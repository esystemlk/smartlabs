export interface GuideSection {
  id: string;
  title: string;
  intro: string;
  steps: string[];
  links: { label: string; href: string }[];
  image?: { src: string; alt: string; caption: string; width: number; height: number };
  note?: string;
}

export const guideSections: GuideSection[] = [
  {
    id: 'account', title: 'Create your account and sign in',
    intro: 'Your account keeps your registrations and saved practice history together.',
    steps: ['Open Create Account. Enter your full name, email and a password, then choose Sign Up. You can also use Sign up with Google.', 'Already registered? Choose Login and use the same email or Google account you used before.', 'Open Student Home after signing in. If a registration page asked you to sign in, return to that page to finish your registration.'],
    links: [{ label: 'Create account', href: '/signup' }, { label: 'Log in', href: '/login' }, { label: 'Reset password', href: '/forgot-password' }],
    image: { src: '/images/guide/create-account.webp', width: 1265, height: 712, alt: 'Create Account page with full name, email, password, Sign Up and Google options.', caption: 'Account creation page. Use your own details; the text inside empty fields is an example.' },
    note: 'Creating an account does not automatically register you for a course or purchase practice credits.',
  },
  {
    id: 'home', title: 'Find your way around Student Home',
    intro: 'Start with your exam. PTE Academic and IELTS have separate dashboards.',
    steps: ['Choose the PTE Academic card or the IELTS card. Each opens that exam’s own skills and practice options.', 'Use the centered search bar for a task or skill, such as “PTE dictation” or “IELTS writing”. Select a result and check the exam name shown below it.', 'The floating bottom menu stays within reach: Home, PTE, IELTS, Registrations, Results and More. The highlighted item shows your current area.', 'Choose More for the website guide, Help, Settings and Sign out. Inside an exam dashboard, More also includes that exam’s skill links.'],
    links: [{ label: 'Open Student Home', href: '/dashboard' }],
    image: { src: '/images/guide/student-home.webp', width: 1265, height: 1177, alt: 'Student Home showing centered practice search, separate PTE and IELTS cards and the floating bottom navigation.', caption: 'Dashboard layout example, shown without personal student records.' },
  },
  {
    id: 'pte', title: 'Start PTE Academic practice',
    intro: 'PTE tasks are organised into Speaking, Writing, Reading and Listening.',
    steps: ['Choose PTE in the bottom menu, or open the PTE Academic card on Student Home.', 'Choose a skill to see the full task names. For example, Writing contains Summarize Written Text and Write Essay; Listening includes Write from Dictation.', 'Choose Start practice beside the task you want. Some trainers open in their own page design; the practice link still takes you to the correct task.', 'Read the task instructions before answering. For speaking tasks, allow microphone access when requested and check your microphone before recording.', 'Complete the response, then use the checking or scoring control shown in that trainer. Review the feedback before starting another response. Use the back link to return to the skill page.'],
    links: [{ label: 'PTE dashboard', href: '/dashboard/pte' }, { label: 'PTE writing', href: '/dashboard/pte/writing' }, { label: 'PTE listening', href: '/dashboard/pte/listening' }],
    image: { src: '/images/guide/pte-skills.webp', width: 1265, height: 1430, alt: 'PTE Academic dashboard with Speaking, Writing, Reading and Listening practice cards.', caption: 'PTE dashboard layout example. Choose a skill, then a task.' },
    note: 'AI scoring and access requirements vary by tool. Read any credit or access message before submitting. Practice feedback is an estimate, not an official PTE result.',
  },
  {
    id: 'ielts', title: 'Choose your IELTS path and skill',
    intro: 'Choose Academic or General Training before selecting a practice section.',
    steps: ['Choose IELTS in the bottom menu, or open the IELTS card on Student Home.', 'Use the Academic / General Training switch near the top. Reading and Writing options can differ between these paths.', 'Choose Listening, Reading, Writing or Speaking. Open an available collection, expand a Cambridge book where shown, then choose Start practice beside a test.', 'For essay practice, open Writing and choose an available Task 2 option. Read the prompt, write your response and use the feedback controls in the trainer.', 'If a section says Coming soon, it is not available to practise yet. IELTS Speaking is currently marked Coming soon.'],
    links: [{ label: 'IELTS dashboard', href: '/dashboard/ielts' }, { label: 'IELTS writing', href: '/dashboard/ielts/writing' }, { label: 'IELTS Task 2 trainer', href: '/ai-ielts-essay-practice' }],
    image: { src: '/images/guide/ielts-skills.webp', width: 1265, height: 1595, alt: 'IELTS overview showing the Academic and General Training switch, skill cards and mock test entry.', caption: 'IELTS dashboard layout example. Check your study path before opening a section.' },
  },
  {
    id: 'mocks', title: 'Use IELTS mock tests and credits',
    intro: 'The IELTS mock area brings timed Listening, Reading and Writing practice together.',
    steps: ['Open IELTS, then choose Explore mock tests or the Mock tests link.', 'Check the available tests and your mock credit balance. If access requires credits, review the package shown under Buy mock credits before deciding whether to purchase.', 'Read the test instructions and timing before starting. Follow the controls in the test to move through sections and submit.', 'Return to the mock area for its available reports and history. The floating menu is hidden during timed IELTS attempts to leave more room for questions; navigation remains available from More in the header.'],
    links: [{ label: 'IELTS mock tests', href: '/dashboard/ielts/mock-tests' }],
    note: 'Speaking is not included in the current IELTS mock practice. Mock credits are separate from course registration. Do not assume a course payment includes every practice tool.',
  },
  {
    id: 'courses', title: 'Register for a course',
    intro: 'Use this website to register for courses. Student Home is for navigation and practice, not joining live classes.',
    steps: ['Open Courses & Fees and compare the current options. Select Register or Register & pay for the course you want.', 'On the registration page, check the selected package, available batch or other options, and the total shown. Sign in if asked.', 'Confirm your contact details and review the payment information. Only continue to checkout when you are ready to pay.', 'After checkout, follow the confirmation shown on the website. Keep your order or payment reference, then open Registrations in the bottom menu to check the account’s payment status.'],
    links: [{ label: 'Browse courses', href: '/courses' }, { label: 'PTE registration', href: '/pte-registration' }, { label: 'IELTS registration', href: '/ielts-registration' }],
    image: { src: '/images/guide/courses.webp', width: 1265, height: 712, alt: 'Courses and Fees page with course options and Register buttons.', caption: 'Courses & Fees page. Always check the linked page for current prices and availability.' },
    note: 'For course delivery or joining instructions, follow the information provided by the team. There is no My Classes or Join Class area in the student dashboard.',
  },
  {
    id: 'registrations', title: 'Check a registration or payment',
    intro: 'Registrations shows course payment records for the account you are signed into.',
    steps: ['Choose Registrations in the bottom menu, or View all beside My registrations on Student Home.', 'Find the course name and check the payment status, amount, date and reference.', 'Paid means the payment record is marked successful. Pending means it has not yet been marked paid. Failed, Cancelled or Amount issue need attention.', 'If a payment is missing or looks incorrect, check that you used the same account. Contact Help with your order reference and the issue; do not send card details or passwords.', 'If records cannot load, choose Try again. An empty list means no records were found for this account; it is different from a loading error.'],
    links: [{ label: 'My registrations', href: '/dashboard/registrations' }, { label: 'Ask for help', href: '/dashboard/support' }],
    image: { src: '/images/guide/registrations.webp', width: 1280, height: 720, alt: 'My registrations page showing where payment records appear and the empty state for an account without registrations.', caption: 'Registrations layout example with no records. Your own course and payment details appear here when available.' },
    note: 'If money was deducted but the website still shows Pending, ask the team to check the reference before making another payment.',
  },
  {
    id: 'results', title: 'Find your scores and feedback',
    intro: 'Results shows saved practice history. Keep PTE and IELTS scores separate.',
    steps: ['Choose Results in the bottom menu, or View all beside Recent practice results on Student Home.', 'Use All, PTE or IELTS to filter the saved records. Each record keeps its own score scale; do not compare a score out of 90 with a score out of 9.', 'Open Score details when a saved record contains a breakdown. Some tools also show feedback directly in their own practice screen.', 'For IELTS mock reports, use the IELTS Mock tests link. Mock reports are separate from the shared practice history.', 'If your latest attempt is missing, confirm you completed the trainer’s submission step and used the same account. Not every tool stores its report in the shared Results list.'],
    links: [{ label: 'Practice results', href: '/dashboard/results' }, { label: 'IELTS mock reports', href: '/dashboard/ielts/mock-tests' }],
    image: { src: '/images/guide/results.webp', width: 1265, height: 712, alt: 'Practice results page showing All, PTE and IELTS filters, the empty history message and the separate IELTS mock reports link.', caption: 'Results layout example with no records. Use the exam filters; IELTS mock reports have their own link.' },
    note: 'The shared Results page shows up to the latest 100 saved records. Practice and AI scores are estimates, not official exam results.',
  },
  {
    id: 'mobile', title: 'Use the website on your phone',
    intro: 'The same floating menu works on a smaller screen.',
    steps: ['Scroll through the page normally; the floating menu remains near the bottom of the screen.', 'Tap PTE or IELTS to switch exam dashboards. Tap More to open the guide, Help, Settings and available exam skill links.', 'Tap outside More to close it. On a keyboard, Escape closes the panel and returns focus to More.', 'If a practice tool asks to open a new tab, return to the original tab when you finish. Avoid closing an active test before following its save or submission instructions.'],
    links: [{ label: 'Student Home', href: '/dashboard' }],
    image: { src: '/images/guide/mobile-navigation.webp', width: 375, height: 812, alt: 'Mobile Student Home with the floating menu showing Home, PTE, IELTS, Registrations, Results and More.', caption: 'Mobile dashboard layout example with the floating navigation.' },
  },
  {
    id: 'help', title: 'Get help and manage your account',
    intro: 'You can return to this guide at any time from More → Website guide.',
    steps: ['Open More → Help to use the account’s support chat. Type your question and choose Send when you are ready.', 'For a useful support request, include the page or task name, what you were trying to do and any error message. Support chat accepts text. If the team asks for a screenshot, use the channel they provide and keep private information out of it.', 'Use More → Settings, or the account icon at the top, to view the available profile settings.', 'If you cannot sign in, use Reset password for an email/password account, or use the same Google sign-in method you registered with. Contact the team if you still cannot access your account.', 'On a shared device, finish your work and choose More → Sign out.'],
    links: [{ label: 'Open Help', href: '/dashboard/support' }, { label: 'Contact the team', href: '/contact' }, { label: 'Account settings', href: '/dashboard/settings' }, { label: 'Reset password', href: '/forgot-password' }],
  },
];
