export interface SelectMissingWordData {
  id: string;
  audioTextStart: string; // The part of the audio before the beep
  options: string[];
  correctAnswer: string;
}

export const pteListeningSelectMissingWordData: SelectMissingWordData[] = [
  {
    id: 'smw1',
    audioTextStart: 'After analyzing the data, the scientists came to a clear',
    options: ['decision', 'conclusion', 'question', 'problem'],
    correctAnswer: 'conclusion',
  },
  {
    id: 'smw2',
    audioTextStart: 'The government has announced new policies aimed at protecting the',
    options: ['economy', 'environment', 'industry', 'education'],
    correctAnswer: 'environment',
  },
];
