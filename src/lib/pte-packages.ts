/**
 * PTE Academic course packages — the single source of truth for the
 * registration page, the create-payment route and the receipt email.
 *
 * Deliberately free of any server imports so client components can read it
 * directly (the create-payment API also imports it to validate + price the
 * order server-side, so a tampered client price can never be trusted).
 *
 * Content mirrors the official Smart Labs "PTE Academic Preparation
 * Programmes" brochure.
 */

export type PtePackageId = 'boostify' | 'boostify_plus' | 'hybrid_boostify_pro';

export interface PteFeature {
  /** Short heading, e.g. "20 Hours Live Online Classes". */
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
  /** e.g. "20 hrs online" — the headline hours line from the brochure. */
  hoursLabel: string;
  /** Total coaching & mentorship hours (for the comparison bar). */
  totalHours: number;
  /** Full feature list shown on the card and repeated in the receipt. */
  features: PteFeature[];
  /** "Best for" guidance from the brochure. */
  bestFor: string;
  /** Whether to flag the card as the recommended / most-popular pathway. */
  popular?: boolean;
  /**
   * How the student actually gets access once payment is confirmed — this
   * block is emailed to them verbatim in the receipt.
   */
  accessSteps: string[];
}

export const PTE_PACKAGES: PtePackage[] = [
  {
    id: 'boostify',
    name: 'Boostify',
    price: 30000,
    tagline: "Learn the exam with Smart Labs' proven strategy-based approach.",
    hoursLabel: '20 hrs online',
    totalHours: 20,
    bestFor:
      'Students confident in English who mainly need exam strategy and marking-scheme clarity.',
    features: [
      { title: '20 Hours Live Online Classes', detail: 'Real-time strategy sessions with expert PTE trainers.' },
      { title: 'All 22 Question Types Covered', detail: 'Complete walkthrough of every task in the PTE exam.' },
      { title: 'PTE Marking Scheme Explained', detail: 'Understand exactly how each response is scored.' },
      { title: 'Smart Labs Exam Strategies', detail: 'Proven techniques to maximise your score in every section.' },
      { title: 'Live Classroom Feedback', detail: 'Get corrected and guided during the class itself.' },
      { title: '2 Months Recording Access', detail: 'Revisit every session at your own pace.' },
    ],
    accessSteps: [
      'Request to join your batch WhatsApp group (link in this email) using your registered number — you are approved once we confirm your payment. Please do not share the link.',
      'Your live online class link (Zoom) will be shared in the group before the first session.',
      'Class recordings unlock inside your Smart Labs dashboard and stay available for 2 months.',
    ],
  },
  {
    id: 'boostify_plus',
    name: 'Boostify Plus',
    price: 35000,
    tagline: 'Learn the exam and strengthen your English with a dedicated grammar clinic.',
    hoursLabel: '20 hrs online + 16 hr clinic',
    totalHours: 36,
    bestFor:
      'Students who want strategy and need to fix grammar, sentence accuracy or fluency.',
    features: [
      { title: 'Everything in Boostify', detail: 'All 20 hours of live online strategy classes and features.' },
      { title: '16-Hour Grammar Clinic', detail: 'A dedicated block focused entirely on English accuracy.' },
      { title: 'Grammar Accuracy', detail: 'Fix recurring grammar errors that cost PTE marks.' },
      { title: 'Sentence Construction', detail: 'Build clean, exam-ready sentence structures.' },
      { title: 'Writing Enhancement', detail: 'Sharpen essays, summaries and written discourse.' },
      { title: 'Speaking Improvement', detail: 'Improve fluency, pronunciation and oral fluency scores.' },
      { title: '2 Months Recording Access', detail: 'Revisit every session at your own pace.' },
    ],
    accessSteps: [
      'Request to join your batch WhatsApp group (link in this email) using your registered number — you are approved once we confirm your payment. Please do not share the link.',
      'Live online class + grammar-clinic links (Zoom) will be shared in the group before each session.',
      'Class recordings unlock inside your Smart Labs dashboard and stay available for 2 months.',
    ],
  },
  {
    id: 'hybrid_boostify_pro',
    name: 'Hybrid Boostify Pro',
    price: 50000,
    tagline:
      'The Smart Labs Mentorship Programme — learn, practise, succeed with mentors by your side.',
    hoursLabel: 'Everything in Plus + 21 hrs face-to-face',
    totalHours: 57,
    popular: true,
    bestFor:
      'Students who want the highest level of support — coaching, mentorship and accountability.',
    features: [
      { title: 'Everything in Boostify Plus', detail: 'All online classes plus the full 16-hour grammar clinic.' },
      { title: '21 Hours Premium Face-to-Face Coaching', detail: 'Direct, in-person coaching with senior mentors.' },
      { title: 'Up to 2 Months Academic Mentorship', detail: 'Long-term guidance that carries you to exam day.' },
      { title: 'Classroom-Based Learning', detail: 'Structured in-person sessions at our Rajagiriya / Wattala centres.' },
      { title: 'Academic Guidance via WhatsApp', detail: 'Ask questions anytime between sessions.' },
      { title: 'Continuous Support While Practising', detail: 'Mentors stay engaged throughout your self-practice.' },
      { title: 'Personalised Feedback Throughout', detail: 'Ongoing, individual feedback on your progress.' },
    ],
    accessSteps: [
      'Request to join your batch WhatsApp group (link in this email) using your registered number — you are approved once we confirm your payment. Please do not share the link.',
      'Your face-to-face class venue (Rajagiriya / Wattala), dates and times are confirmed in the group.',
      'Online session + grammar-clinic links are shared in the same group.',
      'Class recordings unlock inside your Smart Labs dashboard and stay available for 2 months.',
    ],
  },
];

export const getPtePackage = (id: string): PtePackage | undefined =>
  PTE_PACKAGES.find((p) => p.id === id);

/** Formats a LKR amount as "LKR 30,000". */
export const formatLkr = (n: number): string => `LKR ${n.toLocaleString('en-LK')}`;
