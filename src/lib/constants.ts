
type NavLink = {
  href: string;
  label: string;
};

export const LMS_URL = process.env.NEXT_PUBLIC_LMS_URL || 'https://lms.smartlabs.lk';

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/pte', label: 'PTE' },
  { href: '/celpip', label: 'CELPIP' },
  { href: '/corporate-training', label: 'Corporate Training' },
  { href: '/contact', label: 'Contact' },
];

export const courseData = [
  {
    title: 'PTE',
    description: 'Achieve your desired score in the Pearson Test of English Academic with our PTE training in Colombo.',
    duration: '4 Weeks',
    features: ['AI Scoring Practice', 'Test-taking Strategies', 'Integrated Skills Practice'],
  },
  {
    title: 'CELPIP',
    description: 'Excel in the Canadian English Language Proficiency Index Program for immigration to Canada.',
    duration: '6 Weeks',
    features: ['Computer-Based Practice', 'Real-Life Scenarios', 'Accent Training'],
  },
];

export const testimonials = [
    {
        name: 'Priya Sharma',
        course: 'PTE Student',
        quote: 'The personalized study plan was a game-changer! I improved my score significantly in just 6 weeks. The instructors at Smart Labs are fantastic.',
        avatar: 'https://picsum.photos/100/100?random=1',
        achievement: 'Score 79+'
    },
    {
        name: 'John Adebayo',
        course: 'CELPIP Student',
        quote: 'The CELPIP course was perfectly tailored to my needs. The practice sessions gave me the confidence I needed for the speaking test.',
        avatar: 'https://picsum.photos/100/100?random=2',
        achievement: 'Level 10+'
    },
    {
        name: 'Chen Wei',
        course: 'PTE Student',
        quote: 'I needed a good PTE score quickly for my university application, and Smart Labs delivered. The strategies and AI-scored tests were incredibly helpful.',
        avatar: 'https://picsum.photos/100/100?random=3',
        achievement: 'Score 79+'
    },
];

export const resourceLibrary = [
    { id: '1', type: 'test', title: 'PTE Academic - Sample Test', format: 'PDF', icon: 'FileText', url: '#' },
    { id: '2', type: 'test', title: 'PTE Academic - Full-length Mock Test', format: 'PDF', icon: 'FileText', url: '#' },
    { id: '3', type: 'video', title: 'CELPIP Speaking Role-play Example', format: 'Video', icon: 'Video', url: '#' },
    { id: '4', type: 'list', title: 'PTE Vocabulary List', format: 'PDF', icon: 'FileText', url: '#' },
    { id: '5', type: 'video', title: 'PTE Writing Strategy', format: 'Video', icon: 'Video', url: '#' },
    { id: '6', type: 'test', title: 'CELPIP - Sample Reading Notes', format: 'PDF', icon: 'FileText', url: '#' },
];
