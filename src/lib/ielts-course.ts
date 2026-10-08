/**
 * IELTS course — single product, LKR 20,000 / 1 month. Server-free so client
 * components and the create-payment route both read the same source of truth
 * (price is validated server-side so a tampered client price is never trusted).
 */
export interface IeltsCourse {
  id: string;
  name: string;
  price: number;        // LKR charged
  durationLabel: string;
  tagline: string;
  features: { title: string; detail: string }[];
}

export const IELTS_COURSE: IeltsCourse = {
  id: 'ielts-foundation',
  name: 'IELTS Course',
  price: 20000,
  durationLabel: '1-month program',
  tagline: 'Build the skills and strategy for your target IELTS band.',
  features: [
    { title: 'All four skills', detail: 'Listening, Reading, Writing and Speaking — strategies and practice for each.' },
    { title: 'Academic practice tests', detail: 'Cambridge-style Listening and Reading with instant marking on your dashboard.' },
    { title: 'Writing feedback', detail: 'Guidance on Task 1 and Task 2 structure, ideas and grammar.' },
    { title: 'Exam strategy & timing', detail: 'Band-focused techniques and time management for test day.' },
    { title: 'Complete support', detail: 'Batch details shared by email and WhatsApp after you register.' },
  ],
};

export const formatLkr = (n: number): string => `LKR ${Number(n).toLocaleString('en-LK')}`;
