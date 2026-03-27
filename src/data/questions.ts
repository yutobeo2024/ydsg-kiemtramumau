export interface Question {
  id: string;
  image: string;
  options: string[];
  correct: string;
}

export const ISHIHARA_QUESTIONS: Question[] = [
  { id: '1', image: '/images/tam-so-1.jpg', correct: '12', options: ['12', '21', 'Không thấy số', '7'] },
  { id: '2', image: '/images/tam-so-2.jpg', correct: '8', options: ['8', '3', 'Không thấy số', '5'] },
  { id: '3', image: '/images/tam-so-3.jpg', correct: '29', options: ['29', '70', 'Không thấy số', '24'] },
  { id: '4', image: '/images/tam-so-4.jpg', correct: '5', options: ['5', '2', 'Không thấy số', '8'] },
  { id: '5', image: '/images/tam-so-5.jpg', correct: '3', options: ['3', '5', 'Không thấy số', '8'] },
  { id: '6', image: '/images/tam-so-6.jpg', correct: '15', options: ['15', '17', 'Không thấy số', '12'] },
  { id: '7', image: '/images/tam-so-7.jpg', correct: '74', options: ['74', '21', 'Không thấy số', '47'] },
  { id: '8', image: '/images/tam-so-8.jpg', correct: '6', options: ['6', '2', 'Không thấy số', '9'] },
  { id: '9', image: '/images/tam-so-9.jpg', correct: '45', options: ['45', '4', 'Không thấy số', '54'] },
  { id: '10', image: '/images/tam-so-10.jpg', correct: '5', options: ['5', '3', 'Không thấy số', '2'] },
  { id: '11', image: '/images/tam-so-11.jpg', correct: '7', options: ['7', '1', 'Không thấy số', '4'] },
  { id: '12', image: '/images/tam-so-12.jpg', correct: '16', options: ['16', '1', 'Không thấy số', '61'] },
  { id: '13', image: '/images/tam-so-13.jpg', correct: '73', options: ['73', '13', 'Không thấy số', '37'] },
  { id: '14', image: '/images/tam-so-14.jpg', correct: 'Không thấy số', options: ['Không thấy số', '5', '3', '2'] },
  { id: '15', image: '/images/tam-so-15.jpg', correct: 'Không thấy số', options: ['Không thấy số', '45', '15', '35'] },
  { id: '16', image: '/images/tam-so-16.jpg', correct: '26', options: ['26', '6 rõ 2 mờ', '2 rõ 6 mờ', 'Không thấy số'] },
  { id: '17', image: '/images/tam-so-17.jpg', correct: '42', options: ['42', '2 rõ 4 mờ', '4 rõ 2 mờ', 'Không thấy số'] }
];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const getRandomQuestions = (count: number = 8): Question[] => {
  const shuffled = shuffleArray(ISHIHARA_QUESTIONS);
  return shuffled.slice(0, count).map(q => ({
    ...q,
    options: shuffleArray(q.options)
  }));
};
