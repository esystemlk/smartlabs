export interface ListeningFillBlanksData {
  id: string;
  audioText: string;
  transcript: string; // Use {BLANK} placeholder
  correctWords: string[];
}

export const pteListeningFillInBlanksData: ListeningFillBlanksData[] = [
  {
    id: 'lfib1',
    audioText: 'The university library has implemented a new booking system for study rooms. Students can now reserve a space online to ensure they have a quiet place to work. This change aims to improve the student experience and manage the high demand for these facilities, especially during exam periods.',
    transcript: 'The university library has {BLANK} a new booking system for study rooms. Students can now {BLANK} a space online to ensure they have a quiet place to work. This change aims to {BLANK} the student experience and manage the high {BLANK} for these facilities, especially during exam periods.',
    correctWords: ['implemented', 'reserve', 'improve', 'demand'],
  },
];
