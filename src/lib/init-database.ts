import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

/**
 * Initialize Firebase with default data
 * Run this once to populate the database
 */
export async function initializeDatabase() {
    try {
        console.log('Initializing database...');

        // 1. Initialize Site Stats
        const statsRef = doc(db, 'site_stats', 'global_stats');
        await setDoc(statsRef, {
            studentsCount: 5000,
            successRate: 95,
            targetWeeks: '6–8',
            reviewsCount: 1200,
            rating: 5.0,
            aiSupport: '24/7',
            lastUpdated: new Date(),
        });
        console.log('✓ Site stats initialized');

        // 2. Initialize Testimonials
        const testimonials = [
            {
                name: 'Priya Sharma',
                role: 'PTE Score: 85 | Sri Lanka',
                content: 'Smart Labs transformed my preparation journey. The AI feedback and personalized study plan helped me achieve my target score in just 3 weeks!',
                avatar: 'PS',
                color: 'from-accent-1/80 to-accent-3/80',
                course: 'PTE Academic',
                achievement: 'Score 85',
                isActive: true,
                order: 1,
                createdAt: new Date(),
            },
            {
                name: 'Liam Smith',
                role: 'IELTS Band: 8.5 | Australia',
                content: 'The instructors are incredibly knowledgeable. Their strategies for the speaking section were game-changers. Highly recommended!',
                avatar: 'LS',
                color: 'from-accent-2/80 to-accent-4/80',
                course: 'IELTS',
                achievement: 'Band 8.5',
                isActive: true,
                order: 2,
                createdAt: new Date(),
            },
            {
                name: 'Nimali Perera',
                role: 'CELPIP Score: 12 | Sri Lanka',
                content: 'The self-paced CELPIP course was perfect for my schedule. The materials are comprehensive and the practice tests are very close to the real exam.',
                avatar: 'NP',
                color: 'from-primary/80 to-accent-2/80',
                course: 'CELPIP',
                achievement: 'Score 12',
                isActive: true,
                order: 3,
                createdAt: new Date(),
            },
            {
                name: 'Rajesh Kumar',
                role: 'PTE Score: 90 | India',
                content: 'The AI scoring system is incredibly accurate. It helped me identify my weak areas and improve systematically. Achieved my dream score!',
                avatar: 'RK',
                color: 'from-accent-3/80 to-accent-1/80',
                course: 'PTE Academic',
                achievement: 'Score 90',
                isActive: true,
                order: 4,
                createdAt: new Date(),
            },
            {
                name: 'Sarah Johnson',
                role: 'IELTS Band: 9.0 | UK',
                content: 'Outstanding preparation materials and expert guidance. The mock tests were exactly like the real exam. Couldn\'t have done it without Smart Labs!',
                avatar: 'SJ',
                color: 'from-accent-4/80 to-primary/80',
                course: 'IELTS',
                achievement: 'Band 9.0',
                isActive: true,
                order: 5,
                createdAt: new Date(),
            },
        ];

        const testimonialsRef = collection(db, 'testimonials');
        for (const testimonial of testimonials) {
            await addDoc(testimonialsRef, testimonial);
        }
        console.log('✓ Testimonials initialized');

        // 3. Initialize Notifications
        const notifications = [
            {
                title: 'AI Analysis Complete',
                message: 'Your latest PTE Essay analysis is now available in your dashboard.',
                type: 'success',
                isActive: true,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
            {
                title: 'New Mock Test Available',
                message: 'A new PTE Full Mock Test (Practice Test 4) has been added to your library.',
                type: 'info',
                isActive: true,
                createdAt: new Date(),
            },
            {
                title: 'System Maintenance',
                message: 'The AI scoring system will be undergoing brief maintenance this Sunday at 2 AM UTC.',
                type: 'warning',
                isActive: true,
                createdAt: new Date(),
            }
        ];

        const notificationsRef = collection(db, 'notifications');
        for (const notification of notifications) {
            await addDoc(notificationsRef, notification);
        }
        console.log('✓ Notifications initialized');

        // 4. Initialize Resources
        const resources = [
            {
                type: 'test',
                title: 'IELTS Academic - Sample Test',
                format: 'PDF',
                url: 'https://example.com/ielts-test.pdf',
                category: 'IELTS',
                isActive: true,
                createdAt: new Date(),
            },
            {
                type: 'test',
                title: 'PTE Academic - Full Mock Test',
                format: 'PDF',
                url: 'https://example.com/pte-test.pdf',
                category: 'PTE',
                isActive: true,
                createdAt: new Date(),
            },
            {
                type: 'video',
                title: 'PTE Speaking - Strategy Session',
                format: 'Video',
                url: 'https://youtube.com/watch?v=example',
                category: 'PTE',
                isActive: true,
                createdAt: new Date(),
            }
        ];

        const resourcesRef = collection(db, 'resources');
        for (const resource of resources) {
            await addDoc(resourcesRef, resource);
        }
        console.log('✓ Resources initialized');

        console.log('Database initialization complete!');
        return { success: true };
    } catch (error) {
        console.error('Error initializing database:', error);
        return { success: false, error };
    }
}
