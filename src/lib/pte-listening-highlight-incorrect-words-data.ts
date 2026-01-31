export interface HighlightIncorrectWordsData {
  id: string;
  audioText: string;
  transcript: string[]; // split into words
  incorrectWords: string[]; // list of words that are different in the audio
}

export const pteListeningHighlightIncorrectWordsData: HighlightIncorrectWordsData[] = [
  {
    id: 'hiw1',
    audioText: 'The university offers a wide range of courses, from the arts and humanities to the sciences and engineering. Students have access to modern facilities and a vast library. The campus provides a vibrant setting for academic and social growth.',
    transcript: 'The university offers a wide variety of courses, from the arts and humanities to the sciences and engineering. Learners have access to modern facilities and a vast library. The campus provides a vibrant setting for academic and personal growth.'.split(' '),
    incorrectWords: ['variety', 'Learners', 'personal'],
  },
];
