
type NavLink = {
  href: string;
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/pte', label: 'PTE' },
  { href: '/ielts', label: 'IELTS' },
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
    title: 'IELTS',
    description: 'Prepare for the International English Language Testing System with our comprehensive IELTS tuition in Rajagiriya.',
    duration: '8 Weeks',
    features: ['Mock Tests', 'Personalized Feedback', 'Vocabulary Building'],
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
        course: 'IELTS Student',
        quote: 'The personalized study plan was a game-changer! I improved my score by 1.5 bands in just 6 weeks. The instructors at Smart Labs are fantastic.',
        avatar: 'https://picsum.photos/100/100?random=1',
        achievement: 'Score 8.0'
    },
    {
        name: 'John Adebayo',
        course: 'OET Student',
        quote: 'As a doctor, the OET course was perfectly tailored to my needs. The role-playing sessions gave me the confidence I needed for the speaking test.',
        avatar: 'https://picsum.photos/100/100?random=2',
        achievement: 'Grade A'
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
    { id: '1', type: 'test', title: 'IELTS Academic - Sample Test', format: 'PDF', icon: 'FileText', url: '#' },
    { id: '2', type: 'test', title: 'PTE Academic - Full-length Mock Test', format: 'PDF', icon: 'FileText', url: '#' },
    { id: '3', type: 'video', title: 'OET Speaking Role-play Example', format: 'Video', icon: 'Video', url: '#' },
    { id: '4', type: 'list', title: 'TOEFL Vocabulary List', format: 'PDF', icon: 'FileText', url: '#' },
    { id: '5', type: 'video', title: 'IELTS Writing Task 1 Strategy', format: 'Video', icon: 'Video', url: '#' },
    { id: '6', type: 'test', title: 'OET Nursing - Sample Case Notes', format: 'PDF', icon: 'FileText', url: '#' },
];
