export interface ListeningMCSAData {
  id: string;
  audioText: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const pteListeningMultipleChoiceSingleAnswerData: ListeningMCSAData[] = [
  {
    id: 'lmcsa1',
    audioText: 'The university is launching a new initiative to promote student well-being. This will include workshops on stress management, mindfulness sessions, and access to free counseling services. The goal is to create a supportive campus environment where students feel empowered to take care of their mental health. The program will be officially introduced next month, and all students are encouraged to participate.',
    question: 'What is the main purpose of the university\'s new initiative?',
    options: [
      'To increase academic enrollment.',
      'To promote student mental health and well-being.',
      'To organize a sports festival.',
      'To build a new student accommodation.',
    ],
    correctAnswer: 'To promote student mental health and well-being.',
  },
];
