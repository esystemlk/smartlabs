export interface HighlightSummaryData {
  id: string;
  audioText: string;
  summaries: {
    id: string;
    text: string;
  }[];
  correctSummaryId: string;
}

export const pteListeningHighlightCorrectSummaryData: HighlightSummaryData[] = [
  {
    id: 'hcs1',
    audioText: 'The concept of emotional intelligence, often referred to as EQ, has gained significant traction in both psychology and business. Unlike IQ, which measures cognitive ability, EQ is the capacity to understand, use, and manage your own emotions in positive ways to relieve stress, communicate effectively, empathize with others, overcome challenges, and defuse conflict. Research has shown that individuals with high emotional intelligence tend to have better mental health, job performance, and leadership skills. It\'s a skill that can be learned and developed over time.',
    summaries: [
      { id: 'sum1', text: 'Emotional intelligence is a fixed trait, similar to IQ, that primarily helps in achieving academic success and has little impact on professional life.' },
      { id: 'sum2', text: 'Emotional intelligence, or EQ, is the ability to manage one\'s own emotions to handle stress, communicate well, and resolve conflicts. It is linked to better mental health and career success and can be improved with practice.' },
      { id: 'sum3', text: 'EQ is a new psychological trend focused only on being empathetic. It suggests that cognitive abilities are no longer important for leadership or job performance.' },
      { id: 'sum4', text: 'The main function of emotional intelligence is to relieve stress. It is not considered a significant factor in professional environments or leadership.' },
    ],
    correctSummaryId: 'sum2',
  },
];
