
export interface DragDropData {
  id: string;
  passage: string; // Using {BLANK} as a placeholder
  correctWords: string[]; // In order of the blanks
  extraWords: string[]; // Decoy words
}

export const pteReadingFillInBlanksDragDropData: DragDropData[] = [
  {
    id: 'fibdd1',
    passage: 'Artificial intelligence (AI) is transforming numerous industries. From automating repetitive tasks to providing deep insights from data, its {BLANK} are vast. However, the {BLANK} of AI also raises ethical questions about job displacement, bias in algorithms, and autonomous decision-making. Striking the right balance between innovation and regulation is {BLANK} for a responsible AI future. Many experts believe that a human-centric approach, where AI {BLANK} human capabilities rather than replacing them, is the best path forward.',
    correctWords: ['applications', 'adoption', 'crucial', 'augments'],
    extraWords: ['complications', 'future', 'technology'],
  },
];
