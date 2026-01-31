export interface FillInBlanksData {
  id: string;
  passage: string; // Passage with placeholders like {1}, {2}
  blanks: {
    id: string; // e.g., '1'
    options: string[];
    correctAnswer: string;
  }[];
}

export const pteReadingFillInBlanksDropdownData: FillInBlanksData[] = [
  {
    id: 'fibd1',
    passage: 'Climate change is one of the most pressing issues of our time. The overwhelming scientific {1} is that human activities, particularly the burning of fossil fuels, are the main {2} of the recent warming trend. The {3} of rising temperatures include more extreme weather events, sea-level rise, and threats to biodiversity. {4} these challenges requires a global effort to transition to renewable energy sources.',
    blanks: [
      { id: '1', options: ['consensus', 'dispute', 'opinion', 'debate'], correctAnswer: 'consensus' },
      { id: '2', options: ['driver', 'effect', 'benefit', 'result'], correctAnswer: 'driver' },
      { id: '3', options: ['consequences', 'beginnings', 'causes', 'advantages'], correctAnswer: 'consequences' },
      { id: '4', options: ['Ignoring', 'Creating', 'Mitigating', 'Exacerbating'], correctAnswer: 'Mitigating' },
    ],
  },
];
