# Hướng dẫn deploy Next.js app lên VPS qua Cloudflare Tunnel + Access

Tài liệu này áp dụng cho các project Next.js (App Router) muốn:
- Host trên VPS riêng (Ubuntu)
- Truy cập public qua HTTPS không cần mở port inbound
- Bảo vệ truy cập bằng email allowlist (không cần SSO doanh nghiệp)
- Triển khai kiosk trên PC Windows qua PowerShell

Đã verify trên project YDSG mù màu (Next.js 16, SQLite, video upload). Áp dụng được cho project khác có config tương tự.

## Kiến trúc

```
[PC Windows kiosk]                    [Cloudflare Edge]                [VPS Ubuntu]
PowerShell launcher                   Access App (email + OTP)
  └─ Chrome --kiosk ───HTTPS────→     ├─ Session 7 days       ──HTTPS──→ cloudflared
                                       └─ JWT stamped to req               └─ Tunnel outbound
                                                                                ↓
                                                                            Next.js (PM2)
                                                                                ↓
                                                                            SQLite + assets
                                       VPS không expose port nào
```

**Ưu điểm:**
- Không cần IP tĩnh, không cần mở firewall inbound
- Không cần SSL cert riêng (Cloudflare tự cấp)
- Bảo mật theo email (đổi/thu hồi quyền nhanh)
- Một tunnel có thể chia sẻ nhiều subdomain → nhiều app chạy chung VPS

## Yêu cầu

- VPS Ubuntu 22.04+ (Hetzner/Vultr/DigitalOcean — RAM 1GB, disk 20GB là đủ)
- Domain đã add vào Cloudflare (orange cloud)
- Tài khoản Cloudflare có Zero Trust (free tier đủ cho < 50 user)
- Repo Next.js trên GitHub (public hoặc private + deploy key)
- Máy local Windows có PowerShell + git + ssh

## Step 1 — VPS provisioning

### 1.1. Tạo user non-root + SSH key

Trên máy local:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519 -N '""'
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@VPS_IP "useradd -m -s /bin/bash -G sudo deploy && mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && cat >> /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys && chown -R deploy:deploy /home/deploy/.ssh"
```

(Đổi `deploy` thành tên user của anh)

Test: `ssh deploy@VPS_IP whoami`

### 1.2. Cài tools cơ bản

```bash
ssh deploy@VPS_IP
sudo apt update
sudo apt install -y git curl build-essential
```

### 1.3. Cài Node 20 qua nvm (KHÔNG cài Node hệ thống)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec bash   # reload shell
nvm install 20 && nvm alias default 20
node -v   # phải in v20.x.x
```

Lý do dùng nvm: nếu sau này VPS host thêm app khác cần Node version khác, không bị xung đột với hệ thống.

### 1.4. Cài PM2 (process manager)

```bash
npm install -g pm2
pm2 startup   # in ra 1 lệnh sudo, copy/paste để PM2 tự khởi động sau reboot
```

### 1.5. Cài cloudflared

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

## Step 2 — Cloudflare Tunnel setup

### 2.1. Authenticate

```bash
cloudflared tunnel login
```

Lệnh in URL → mở trong browser → chọn zone (domain) → authorize. Lưu `cert.pem` vào `~/.cloudflared/cert.pem`.

⚠️ Cert chỉ authorize cho zone đã chọn. Nếu sau này dùng tunnel cho zone khác, phải `cloudflared tunnel login` lại và chọn cả 2 zone.

### 2.2. Tạo tunnel

```bash
cloudflared tunnel create my-tunnel
```

Lưu lại Tunnel ID (UUID, ví dụ `847de6ca-57cb-4612-8fa9-deff650d2f28`).

### 2.3. Viết config

```bash
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <TUNNEL_ID>
credentials-file: /home/deploy/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: app1.example.com
    service: http://localhost:3000
  - hostname: app2.example.com
    service: http://localhost:3001
  - service: http_status:404
EOF
```

### 2.4. Cài làm systemd service

```bash
sudo cp ~/.cloudflared/config.yml /etc/cloudflared/config.yml
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

⚠️ Sau này muốn thêm/sửa ingress: edit `/etc/cloudflared/config.yml` (cần sudo) → `sudo systemctl restart cloudflared` (KHÔNG có `reload` cho systemd này, phải `restart` — chatbot/app khác cùng tunnel sẽ down ~5-10s).

### 2.5. Add DNS record

Cách 1 — qua CLI (cần cert authorize zone đó):

```bash
cloudflared tunnel route dns my-tunnel app1.example.com
```

Cách 2 — qua Cloudflare dashboard:
- Vào DNS → Add record
- Type: **CNAME**
- Name: `app1`
- Target: `<TUNNEL_ID>.cfargotunnel.com`
- Proxy: **Proxied** (cloud cam) ← BẮT BUỘC

Verify: `dig app1.example.com` phải resolve về IP Cloudflare (104.x.x.x).

## Step 3 — Deploy Next.js app

### 3.1. Clone code

```bash
cd ~
git clone https://github.com/your/repo.git my-app
cd my-app
```

⚠️ Nếu default branch trên GitHub không phải `master` (vd: là `main` cũ stale), nhớ checkout đúng branch:

```bash
git checkout master   # hoặc branch production thật
```

### 3.2. Tách data dir ra ngoài repo

Để `git pull` không động vào DB/uploads:

```bash
mkdir -p ~/app-data
# DB sẽ ở ~/app-data/db.sqlite
# Files khác (videos, images) tuỳ project
```

### 3.3. Cài deps + build

```bash
nvm use 20
npm ci --no-audit --no-fund
npm run build
```

⚠️ Nếu project có `next.config.ts` set `distDir: 'dist'`, lưu ý cả `.next/` và `dist/` đều có thể tồn tại — Next.js đôi khi đọc `.next/` cũ. Khi rebuild nên xoá cả 2: `rm -rf .next dist`.

### 3.4. Chạy với PM2

```bash
PATH="$HOME/.nvm/versions/node/v20.x.x/bin:$PATH" \
  DB_PATH="$HOME/app-data/db.sqlite" \
  ADMIN_PASSWORD="strong_password_here" \
  PORT=3000 \
  pm2 start npm --name my-app --update-env -- start
pm2 save
```

⚠️ Quan trọng:
- **PATH phải có nvm bin trước** để PM2 spawn `npm start` dùng đúng Node 20
- Dùng `--update-env` để PM2 capture env vars từ shell hiện tại
- `pm2 restart` KHÔNG update env. Khi đổi env phải `pm2 delete` rồi `pm2 start` lại với env mới

### 3.5. Verify local

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
# Phải in 200
```

## Step 4 — Public access

### 4.1. Update tunnel ingress

Edit `/etc/cloudflared/config.yml` thêm hostname mới (xem 2.3), `sudo systemctl restart cloudflared`.

### 4.2. Test public

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://app1.example.com
# Phải in 200
```

Nếu 404: tunnel chưa pickup config mới. Restart cloudflared.
Nếu 502: app local chết. `pm2 logs my-app`.
Nếu 530: DNS chưa propagate. Đợi vài phút.

## Step 5 — Cloudflare Access (bảo mật)

Mặc định ai biết URL `app1.example.com` đều vào được. Bật Access để chỉ cho phép email cụ thể.

1. Vào [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Access controls** → **Applications** → **+ Create new application**
2. Chọn **Self-hosted and private** → Continue
3. Cấu hình:
   - **Name**: tên dễ nhớ
   - **Session Duration**: `7 days` (cân bằng giữa tiện và bảo mật)
   - **Destinations** → Add → **Public hostname**:
     - Subdomain: `app1`
     - Domain: `example.com`
4. **Policies** → Create new policy:
   - Name: `Allowed users`
   - Action: **Allow**
   - Add include rule → Selector: **Emails** → list email được phép
5. **Authentication**: để default — "Accept all available identity providers" ON (mặc định Cloudflare có **One-time PIN**, không cần SSO)
6. **Create**

Test: mở URL ở chế độ ẩn danh → phải hiện màn yêu cầu email → nhập email allowed → nhận OTP qua email → vào app.

## Step 6 — Kiosk launcher trên PC Windows

Tạo file `Launch-App.ps1` trên Desktop của PC quầy:

```powershell
$url = "https://app1.example.com"

$candidates = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browser) {
    Write-Host "Cai Chrome hoac Edge truoc" -ForegroundColor Red
    Read-Host "Enter de thoat"; exit 1
}

Start-Process -FilePath $browser -ArgumentList @(
    "--kiosk", "--app=$url",
    "--no-first-run", "--no-default-browser-check",
    "--disable-features=TranslateUI",
    "--disable-pinch", "--overscroll-history-navigation=0"
)
```

Tạo shortcut → target `powershell.exe -ExecutionPolicy Bypass -File "C:\path\Launch-App.ps1"` → đặt icon → để Desktop.

Lần đầu: click → Cloudflare hỏi email → nhập email allowed → OTP → vào app. Session 7 ngày sau mới phải login lại.

Tuỳ chọn auto-start khi đăng nhập Windows: **Task Scheduler** → tạo task chạy script lúc User Logon.

## Pitfalls đã gặp

### Turbopack reject symlink ngoài project root
- Triệu chứng: build fail với `Symlink ... is invalid, it points out of the filesystem root`
- Fix: KHÔNG dùng symlink trong `public/`. Lưu uploaded files trong `public/` trực tiếp (gitignore), HOẶC tốt hơn: serve files qua API route đọc từ env-configured path

### File upload thêm sau build → 404
- Triệu chứng: file mới upload (sau khi đã `next build`) không serve được qua `/public/...`, trả 404
- Nguyên nhân: Turbopack snapshot `public/` lúc build, file thêm runtime không được include
- Fix: Tạo route `/api/files/[name]` stream từ filesystem:
  ```ts
  export async function GET(_, { params }) {
    const { name } = await params;
    if (!/^[\w.\-]+\.(ext)$/i.test(name)) return new Response(null, { status: 400 });
    const buf = await fs.readFile(path.join(process.env.UPLOAD_DIR, name));
    return new Response(buf, { headers: { 'Content-Type': '...' } });
  }
  ```

### PM2 restart không update env
- Triệu chứng: đổi env vars rồi `pm2 restart` nhưng app vẫn dùng env cũ
- Fix: `pm2 delete <name>` rồi `pm2 start ... --update-env` lại với env mới

### Sudo cần password mỗi lệnh
- Workaround: chuẩn bị batch lệnh thật ngắn, gửi user chạy 1 phát qua `ssh -t` từ PowerShell của họ. Hoặc setup `NOPASSWD` cho specific commands trong `/etc/sudoers.d/` (cần access root 1 lần)

### Default branch GitHub khác branch production
- Triệu chứng: clone trên VPS chỉ thấy code cũ
- Fix: `git checkout <production-branch>` sau clone, hoặc đặt branch đúng làm default trên GitHub

### Cloudflared `route dns` cho zone không authorize
- Triệu chứng: log "Added CNAME `subdomain.zone1.zone2`" — concat lạ
- Fix: tạo CNAME thủ công trên dashboard, hoặc `cloudflared tunnel login` lại chọn đúng zone

## Bảo trì

### Update app
```bash
cd ~/my-app
git pull origin master
rm -rf .next dist
nvm exec 20 npm ci --no-audit --no-fund
nvm exec 20 npm run build
pm2 restart my-app
```

### Xem log app
```bash
pm2 logs my-app --lines 50
pm2 logs my-app --err --lines 50   # chỉ stderr
```

### Xem log tunnel
```bash
sudo journalctl -u cloudflared -n 100 --no-pager
```

### Backup data
Cron hàng đêm:
```bash
0 2 * * * tar -czf /backups/app-$(date +\%Y\%m\%d).tar.gz ~/app-data/
```

Hoặc dùng [Litestream](https://litestream.io/) cho SQLite real-time backup lên S3/B2.

### Đổi admin password
```bash
pm2 delete my-app
PATH="$HOME/.nvm/versions/node/v20.x.x/bin:$PATH" \
  DB_PATH="$HOME/app-data/db.sqlite" \
  ADMIN_PASSWORD="new_strong_password" \
  PORT=3000 \
  pm2 start npm --name my-app --update-env -- start
pm2 save
```

### Thu hồi quyền 1 user
Cloudflare dashboard → Access controls → Applications → app → Policies → edit → xoá email → Save. Áp dụng ngay (không cần đợi session expire — Cloudflare invalidate session khi policy đổi).

## Checklist trước khi đưa production

- [ ] Đổi `ADMIN_PASSWORD` mặc định
- [ ] DB + uploads ở dir ngoài repo
- [ ] Cloudflare Access policy active + test với incognito
- [ ] Backup cron set up
- [ ] PM2 `pm2 save && pm2 startup` để auto-start sau reboot
- [ ] Document URL + email allowed cho team
- [ ] Test reboot VPS: `sudo reboot` → đợi vài phút → curl URL phải 200
