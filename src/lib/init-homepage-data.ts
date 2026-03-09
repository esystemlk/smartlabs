import { homepageContentService } from './services/homepage-content.service';

export async function initializeHomepageData() {
    console.log('Initializing homepage data...');

    try {
        // Initialize Courses
        const courses = [
            {
                title: "PTE Academic",
                description: "Master the Pearson Test of English with AI-powered practice and expert strategies.",
                icon: "Target",
                href: "/pte",
                color: "from-accent-1/20 to-accent-1/5",
                iconColor: "text-accent-1",
                bgGradient: "from-accent-1/10 via-accent-1/5 to-transparent",
                features: ["AI Scoring Practice", "Live Classes", "Full Materials Access", "Mock Tests"],
                isActive: true,
                order: 1
            },

            {
                title: "CELPIP Prep",
                description: "Your pathway to Canadian immigration with focused CELPIP training.",
                icon: "Zap",
                href: "/celpip",
                color: "from-accent-4/20 to-accent-4/5",
                iconColor: "text-accent-4",
                bgGradient: "from-accent-4/10 via-accent-4/5 to-transparent",
                features: ["Self-Paced Learning", "Video Guides", "Practice Tests", "Expert Tips"],
                isActive: true,
                order: 3
            }
        ];

        for (const course of courses) {
            await homepageContentService.addCourse(course);
        }
        console.log('✓ Courses initialized');

        // Initialize Learning Methods
        const learningMethods = [
            {
                icon: "Video",
                title: "Recorded Classes",
                description: "Access our comprehensive library of recorded sessions anytime, anywhere.",
                color: "bg-accent-1/10 text-accent-1",
                gradient: "from-accent-1/20 to-accent-1/5",
                isActive: true,
                order: 1
            },
            {
                icon: "Users",
                title: "Individual Classes",
                description: "One-on-one personalized sessions with expert instructors.",
                color: "bg-accent-2/10 text-accent-2",
                gradient: "from-accent-2/20 to-accent-2/5",
                href: "https://register.smartlabs.lk",
                isActive: true,
                order: 2
            },
            {
                icon: "Brain",
                title: "AI Scoring Tests",
                description: "Get instant feedback with our advanced AI-powered scoring system.",
                color: "bg-accent-3/10 text-accent-3",
                gradient: "from-accent-3/20 to-accent-3/5",
                isActive: true,
                order: 3
            },
            {
                icon: "BookOpen",
                title: "Grammar Clinic",
                description: "Master English grammar with our specialized clinic sessions.",
                color: "bg-accent-4/10 text-accent-4",
                gradient: "from-accent-4/20 to-accent-4/5",
                isActive: true,
                order: 4
            }
        ];

        for (const method of learningMethods) {
            await homepageContentService.addLearningMethod(method);
        }
        console.log('✓ Learning methods initialized');

        // Initialize Features
        const features = [
            {
                title: "AI Ecosystem",
                description: "Not just a scorer, but a complete feedback loop that learns your weaknesses.",
                icon: "Cpu",
                color: "from-blue-500/20 to-cyan-500/20",
                iconColor: "text-blue-500",
                isActive: true,
                order: 1
            },
            {
                title: "Expert Mentors",
                description: "Learn from trainers who have consistently achieved PTE 90 scores.",
                icon: "GraduationCap",
                color: "from-purple-500/20 to-pink-500/20",
                iconColor: "text-purple-500",
                isActive: true,
                order: 2
            },
            {
                title: "Smart LMS",
                description: "A central dashboard for all your videos, progress reports, and practice materials.",
                icon: "Layout",
                color: "from-amber-500/20 to-orange-500/20",
                iconColor: "text-amber-500",
                isActive: true,
                order: 3
            },
            {
                title: "Real Exam Simulation",
                description: "Practice in an environment that looks and feels exactly like the actual testing center.",
                icon: "Monitor",
                color: "from-emerald-500/20 to-teal-500/20",
                iconColor: "text-emerald-500",
                isActive: true,
                order: 4
            }
        ];

        for (const feature of features) {
            await homepageContentService.addFeature(feature);
        }
        console.log('✓ Features initialized');

        // Initialize FAQs
        const faqs = [
            {
                question: "How accurate is the AI scoring engine?",
                answer: "Our AI scoring engine is built using advanced natural language processing and is continuously refined based on official PTE and CELPIP scoring rubrics. It provides detailed feedback on grammar, vocabulary, coherence, and task achievement to help you improve effectively.",
                isActive: true,
                order: 1
            },
            {
                question: "Can I switch between individual and group classes?",
                answer: "Yes! Smart Labs offers ultimate flexibility. You can start with our recorded classes and upgrade to 1-on-1 individual mentorship sessions at any point during your preparation.",
                isActive: true,
                order: 2
            },
            {
                question: "Is there a trial period available?",
                answer: "Absolutely. You can sign up for free and get access to our diagnostic test immediately. This helps you understand your current level and experience our platform's capabilities before committing to a full course.",
                isActive: true,
                order: 3
            },
            {
                question: "Do you provide assistance with exam booking?",
                answer: "Yes, our support team guides you through the official registration process for PTE and CELPIP to ensure all your details are correct for the test day.",
                isActive: true,
                order: 4
            }
        ];

        for (const faq of faqs) {
            await homepageContentService.addFAQ(faq);
        }
        console.log('✓ FAQs initialized');

        // Initialize Comparisons
        const comparisons = [
            {
                item: "AI Feedback",
                traditional: "Once a week/Delayed",
                smartlabs: "Instant & 24/7",
                highlight: true,
                isActive: true,
                order: 1
            },
            {
                item: "Practice Tests",
                traditional: "Limited availability",
                smartlabs: "Unlimited access",
                highlight: true,
                isActive: true,
                order: 2
            },
            {
                item: "Mock Test Scoring",
                traditional: "3-5 days wait",
                smartlabs: "Generated in seconds",
                highlight: true,
                isActive: true,
                order: 3
            },
            {
                item: "Study Schedule",
                traditional: "Generic class speed",
                smartlabs: "AI-Personalized flow",
                highlight: true,
                isActive: true,
                order: 4
            },
            {
                item: "Course Materials",
                traditional: "Physical textbooks",
                smartlabs: "LMS Digital Hub",
                highlight: true,
                isActive: true,
                order: 5
            }
        ];

        for (const comparison of comparisons) {
            await homepageContentService.addComparison(comparison);
        }
        console.log('✓ Comparisons initialized');

        console.log('✅ Homepage data initialization complete!');
        return { success: true };
    } catch (error) {
        console.error('Error initializing homepage data:', error);
        return { success: false, error };
    }
}
