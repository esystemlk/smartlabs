// IELTS Academic Writing Task 2 question bank + prediction themes.
//
// Curated by Lahiruka Weerarathne from Cambridge Books 20 & 21, recent reported
// real exam questions, and predicted high-priority themes. Used by the IELTS
// essay trainer's topic picker.

export type IeltsQuestionType =
  | 'Agree/Disagree'
  | 'Discussion'
  | 'Advantages/Disadvantages'
  | 'Problem/Solution'
  | 'Double Question';

export interface IeltsEssayTopic {
  id: string;
  prompt: string;
  category: string;
  type: IeltsQuestionType;
  /** Provenance shown as a small badge. */
  source: 'Cambridge 21' | 'Reported real exam' | 'Predicted' | 'Practice';
  /** 1–5, higher = more likely per Lahiruka's prediction. */
  priority?: number;
}

export const IELTS_ESSAY_TOPICS: IeltsEssayTopic[] = [
  // ── Cambridge Book 21 (most recent published) ──────────────────────────────
  {
    id: 'cam21-1',
    prompt:
      'All university undergraduate courses should include a period of time spent studying abroad or doing a work placement.\n\nDo you think the advantages of this would outweigh the disadvantages?',
    category: 'Education',
    type: 'Advantages/Disadvantages',
    source: 'Cambridge 21',
    priority: 5,
  },
  {
    id: 'cam21-2',
    prompt:
      'The best way to provide enough homes in large cities is to build tall apartment blocks.\n\nTo what extent do you agree or disagree with this statement?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.',
    category: 'Cities',
    type: 'Agree/Disagree',
    source: 'Cambridge 21',
    priority: 5,
  },
  {
    id: 'cam21-3',
    prompt:
      'Cinemas are still important both economically and culturally.\n\nDiscuss both these views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.',
    category: 'Culture',
    type: 'Discussion',
    source: 'Cambridge 21',
    priority: 4,
  },
  {
    id: 'cam21-4',
    prompt:
      'Some people argue that primary schools focus too much on formal learning.\n\nTo what extent do you agree with this opinion?\n\nHow important do you think it is for children to play as well as learn in the primary school classroom?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.',
    category: 'Education',
    type: 'Double Question',
    source: 'Cambridge 21',
    priority: 4,
  },

  // ── Reported real exam questions ───────────────────────────────────────────
  {
    id: 'real-vocational',
    prompt:
      'Some people think governments should spend more money on skills and vocational training rather than university education.\n\nTo what extent do you agree or disagree?',
    category: 'Education',
    type: 'Agree/Disagree',
    source: 'Reported real exam',
    priority: 5,
  },
  {
    id: 'real-housing-govt',
    prompt:
      'In many countries, a shortage of housing has become a serious problem. Some people believe that only governments can solve this issue.\n\nTo what extent do you agree or disagree?',
    category: 'Cities',
    type: 'Agree/Disagree',
    source: 'Reported real exam',
    priority: 5,
  },
  {
    id: 'real-prison-education',
    prompt:
      'Some people believe that providing education to prisoners can help reduce crime after they are released.\n\nTo what extent do you agree or disagree?',
    category: 'Society',
    type: 'Agree/Disagree',
    source: 'Reported real exam',
    priority: 4,
  },
  {
    id: 'real-physical-education',
    prompt:
      'Some schools make physical education compulsory for students.\n\nDo you think it is important for schools to require physical activities? Are some types of physical activities more beneficial than others?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.',
    category: 'Education',
    type: 'Double Question',
    source: 'Reported real exam',
    priority: 4,
  },

  // ── Education (predicted, high priority) ────────────────────────────────────
  {
    id: 'edu-practical-skills',
    prompt:
      'Some people think schools should focus on practical skills rather than academic subjects.\n\nTo what extent do you agree or disagree?',
    category: 'Education',
    type: 'Agree/Disagree',
    source: 'Predicted',
    priority: 5,
  },
  {
    id: 'edu-free-university',
    prompt:
      'Some people believe university education should be free for everyone.\n\nTo what extent do you agree or disagree?',
    category: 'Education',
    type: 'Agree/Disagree',
    source: 'Predicted',
    priority: 5,
  },
  {
    id: 'edu-online-learning',
    prompt:
      'Online learning is replacing traditional classroom education.\n\nDo the advantages outweigh the disadvantages?',
    category: 'Education',
    type: 'Advantages/Disadvantages',
    source: 'Predicted',
    priority: 5,
  },
  {
    id: 'edu-life-skills',
    prompt:
      'Schools should spend more time teaching life skills instead of traditional academic subjects.\n\nTo what extent do you agree or disagree?',
    category: 'Education',
    type: 'Agree/Disagree',
    source: 'Predicted',
    priority: 4,
  },
  {
    id: 'edu-homework-ban',
    prompt:
      'Homework should be banned because it causes unnecessary stress.\n\nDiscuss both views and give your opinion.',
    category: 'Education',
    type: 'Discussion',
    source: 'Predicted',
    priority: 4,
  },

  // ── Artificial Intelligence & Technology (predicted, high priority) ─────────
  {
    id: 'ai-replacing-jobs',
    prompt:
      'Artificial intelligence is replacing many jobs.\n\nDo the advantages outweigh the disadvantages?',
    category: 'Technology',
    type: 'Advantages/Disadvantages',
    source: 'Predicted',
    priority: 5,
  },
  {
    id: 'ai-in-education',
    prompt:
      'AI should be used in education to assist teachers.\n\nTo what extent do you agree or disagree?',
    category: 'Technology',
    type: 'Agree/Disagree',
    source: 'Predicted',
    priority: 5,
  },
  {
    id: 'tech-dependence',
    prompt:
      "People are becoming too dependent on technology.\n\nIs this a positive or negative development?",
    category: 'Technology',
    type: 'Agree/Disagree',
    source: 'Predicted',
    priority: 4,
  },
  {
    id: 'tech-face-to-face',
    prompt:
      'Technology makes people’s lives easier but reduces face-to-face communication.\n\nDiscuss both views.',
    category: 'Technology',
    type: 'Discussion',
    source: 'Predicted',
    priority: 4,
  },

  // ── Work (predicted, high priority) ─────────────────────────────────────────
  {
    id: 'work-changing-jobs',
    prompt:
      'Many people change jobs several times during their career.\n\nWhy does this happen? Is it a positive or negative development?',
    category: 'Work',
    type: 'Double Question',
    source: 'Predicted',
    priority: 5,
  },
  {
    id: 'work-satisfaction',
    prompt:
      'Job satisfaction is more important than salary.\n\nTo what extent do you agree?',
    category: 'Work',
    type: 'Agree/Disagree',
    source: 'Predicted',
    priority: 4,
  },
  {
    id: 'work-four-days',
    prompt:
      'Employees should work four days a week instead of five.\n\nDiscuss both views.',
    category: 'Work',
    type: 'Discussion',
    source: 'Predicted',
    priority: 4,
  },
  {
    id: 'work-from-home',
    prompt:
      'Working from home has become increasingly common.\n\nDo the advantages outweigh the disadvantages?',
    category: 'Work',
    type: 'Advantages/Disadvantages',
    source: 'Predicted',
    priority: 5,
  },
];

/**
 * Prediction areas Lahiruka flagged from the Cambridge 20 & 21 trend — the
 * themes to prioritise. Surfaced on the trainer so students revise the right
 * topics, not just practise random ones.
 */
export const IELTS_PREDICTION_THEMES: { area: string; topics: string[] }[] = [
  { area: 'Education', topics: ['AI in education', 'lifelong learning', 'vocational training', 'international education', 'internships', 'online universities'] },
  { area: 'Cities', topics: ['affordable housing', 'public transport', 'smart cities', 'green buildings', 'population growth'] },
  { area: 'Technology', topics: ['AI replacing jobs', 'digital privacy', 'remote work', 'automation', 'misinformation'] },
  { area: 'Society', topics: ['ageing populations', 'mental health', 'work-life balance', 'volunteering', 'cultural preservation'] },
  { area: 'Environment', topics: ['sustainable cities', 'renewable energy', 'climate adaptation', 'food security'] },
];

export const IELTS_ESSAY_CATEGORIES = Array.from(
  new Set(IELTS_ESSAY_TOPICS.map(t => t.category))
).sort();
