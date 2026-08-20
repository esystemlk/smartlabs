/**
 * PTE Academic course packages — the single source of truth for the
 * registration page, the create-payment route and the receipt email.
 *
 * Deliberately free of any server imports so client components can read it
 * directly (the create-payment API also imports it to validate + price the
 * order server-side, so a tampered client price can never be trusted).
 *
 * Content mirrors the official Smart Labs "PTE Boostify" programme flyers.
 * Package ids are kept stable ('boostify' / 'boostify_plus' /
 * 'hybrid_boostify_pro') so existing batches and orders keep working.
 */

export type PtePackageId = 'boostify' | 'boostify_plus' | 'hybrid_boostify_pro';

export interface PteFeature {
  /** Short heading, e.g. "20 Hours PTE Intensive Course". */
  title: string;
  /** One-line explanation. */
  detail: string;
}

export interface PtePackage {
  id: PtePackageId;
  name: string;
  /** LKR — the one-time programme fee. This is the amount charged. */
  price: number;
  /** Short tagline shown under the price. */
  tagline: string;
  /** e.g. "28 hrs guided learning" — the headline line. */
  hoursLabel: string;
  /** Total guided learning hours (for the comparison bar). */
  totalHours: number;
  /** Full feature list shown on the card and repeated in the receipt. */
  features: PteFeature[];
  /** "Best for" guidance. */
  bestFor: string;
  /** Whether to flag the card as the recommended / most-popular pathway. */
  popular?: boolean;
  /**
   * How the student actually gets access once payment is confirmed — this
   * block is emailed to them verbatim in the receipt.
   */
  accessSteps: string[];
}

const INTAKE_STEP =
  "Choose your intake time — Afternoon (2:30 PM) or Evening (8:00 PM) — and reply with your preference so we place you in the right batch.";
const WHATSAPP_STEP =
  "Request to join your batch WhatsApp group (link in this email) using your registered number — you are approved once we confirm your payment. Please do not share the link.";
const CLASS_STEP =
  "Your class link (Zoom) and full schedule are shared in the group before the first session.";

export const PTE_PACKAGES: PtePackage[] = [
  {
    id: 'boostify',
    name: 'PTE Boostify',
    price: 35000,
    tagline: 'Learn the exam. Build the language. Apply the right techniques.',
    hoursLabel: '28 hrs guided learning',
    totalHours: 28,
    bestFor:
      'Students who want a structured, intensive and practical program — without stretching preparation over months.',
    features: [
      { title: '20 Hours PTE Intensive Course', detail: '2-week program, Monday–Friday, 2 hrs/day — from fundamentals to advanced techniques.' },
      { title: 'All Question Types & Techniques', detail: 'Speaking, Writing, Reading & Listening — every task type and strategy covered.' },
      { title: 'Marking System & High-Weightage Strategies', detail: 'Understand how PTE scores you and focus on the questions that move your score most.' },
      { title: 'Time-Management Techniques', detail: 'Pace every section and never run out of time.' },
      { title: 'Common Mistakes & How to Avoid Them', detail: 'Fix the errors that quietly cost marks, with exam-focused practice.' },
      { title: '8 Hours PTE-Focused Grammar', detail: 'Saturdays 2:30–4:30 PM over 4 weeks — grammar built for PTE Speaking & Writing (not general English).' },
      { title: '2 Intakes per Month', detail: 'Pick the announced intake that suits you: Afternoon 2:30 PM or Evening 8:00 PM.' },
    ],
    accessSteps: [WHATSAPP_STEP, INTAKE_STEP, CLASS_STEP],
  },
  {
    id: 'boostify_plus',
    name: 'PTE Boostify Plus',
    price: 40000,
    tagline: 'Learn → Practise → Get Feedback → Improve.',
    hoursLabel: '28 hrs + 2 feedback sessions',
    totalHours: 30,
    bestFor:
      'Students who want the full program plus post-course feedback to identify and fix mistakes before the exam.',
    features: [
      { title: 'Everything in PTE Boostify', detail: '20 hrs PTE intensive training + 8 hrs PTE-focused grammar.' },
      { title: '2 Group Feedback & Improvement Sessions', detail: 'After your 20-hour training — once a week for 2 weeks, about 1–1.5 hrs each.' },
      { title: 'Practise & Spot Where You Lose Marks', detail: 'Use the sessions to practise, understand your mistakes and get trainer guidance to improve.' },
      { title: 'Group Feedback Format', detail: 'Interactive group sessions (not one-to-one).' },
      { title: '2 Intakes per Month', detail: 'Afternoon 2:30 PM or Evening 8:00 PM.' },
    ],
    accessSteps: [
      WHATSAPP_STEP,
      INTAKE_STEP,
      CLASS_STEP,
      "After your 20-hour training, your 2 group feedback sessions run once a week for the following 2 weeks — details shared in the group.",
    ],
  },
  {
    id: 'hybrid_boostify_pro',
    name: 'PTE Boostify Pro',
    price: 50000,
    tagline: 'Learn → Practise → Get Feedback → Get Personally Corrected → Improve.',
    hoursLabel: '28 hrs + 2 sessions + 30-day WhatsApp support',
    totalHours: 30,
    popular: true,
    bestFor:
      'Students who want the highest level of support — personalised correction and guidance right up to exam day.',
    features: [
      { title: 'Everything in PTE Boostify Plus', detail: '20 hrs training + 8 hrs grammar + 2 group feedback & improvement sessions.' },
      { title: '30 Days Individual WhatsApp Correction', detail: 'Submit your practice responses/links on WhatsApp and receive individual corrections for 30 days from your registration date.' },
      { title: 'Personalised Voice-Note & Message Feedback', detail: 'Individual, focused correction of your responses — see exactly what to fix and how.' },
      { title: 'Continuous Guidance While You Practise', detail: 'Stay on track with support as you keep practising independently before your exam.' },
      { title: '2 Intakes per Month', detail: 'Afternoon 2:30 PM or Evening 8:00 PM.' },
    ],
    accessSteps: [
      WHATSAPP_STEP,
      INTAKE_STEP,
      CLASS_STEP,
      "Your 30-day individual WhatsApp correction support starts from your registration date — submit practice responses/links any time within the window. (It covers PTE practice correction, not private live classes or instant on-demand responses.)",
    ],
  },
];

export const getPtePackage = (id: string): PtePackage | undefined =>
  PTE_PACKAGES.find((p) => p.id === id);

/** Formats a LKR amount as "LKR 35,000". */
export const formatLkr = (n: number): string => `LKR ${n.toLocaleString('en-LK')}`;
