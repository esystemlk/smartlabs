export interface ListeningMCMATestData {
  id: string;
  audioText: string;
  question: string;
  options: string[];
  correctAnswers: string[];
}

export const pteListeningMultipleChoiceMultipleAnswerData: ListeningMCMATestData[] = [
  {
    id: 'lmcma1',
    audioText: 'Good morning, everyone. In today\'s lecture, we\'ll be discussing the impact of renewable energy sources on the global economy. While the transition to renewables like solar and wind power is crucial for combating climate change, it also presents significant economic opportunities. For example, it stimulates innovation in energy storage technologies and creates new jobs in manufacturing and installation. However, there are challenges, such as the initial high cost of investment and the need to upgrade our existing power grids. We will explore both the benefits and the hurdles in detail.',
    question: 'According to the speaker, what are the effects of transitioning to renewable energy?',
    options: [
      'It only presents economic challenges.',
      'It creates employment in the energy sector.',
      'It requires improvements to current power infrastructure.',
      'It has no impact on climate change.',
      'It drives innovation in how we store energy.',
    ],
    correctAnswers: [
      'It creates employment in the energy sector.',
      'It requires improvements to current power infrastructure.',
      'It drives innovation in how we store energy.',
    ],
  },
];
