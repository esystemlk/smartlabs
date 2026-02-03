import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, limit } from 'firebase/firestore';

export interface Testimonial {
    id?: string;
    name: string;
    role: string;
    content: string;
    avatar: string;
    color: string;
    course?: string;
    achievement?: string;
    isActive: boolean;
    createdAt: Date;
    order?: number;
}

/**
 * Get all active testimonials
 */
export async function getActiveTestimonials(limitCount: number = 10): Promise<Testimonial[]> {
    try {
        const testimonialsRef = collection(db, 'testimonials');
        const q = query(
            testimonialsRef,
            where('isActive', '==', true),
            orderBy('order', 'asc'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const testimonials: Testimonial[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            testimonials.push({
                id: doc.id,
                name: data.name,
                role: data.role,
                content: data.content,
                avatar: data.avatar,
                color: data.color,
                course: data.course,
                achievement: data.achievement,
                isActive: data.isActive,
                createdAt: data.createdAt?.toDate() || new Date(),
                order: data.order || 0,
            });
        });

        return testimonials;
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Return default testimonials on error
        return getDefaultTestimonials();
    }
}

/**
 * Add a new testimonial
 */
export async function addTestimonial(testimonial: Omit<Testimonial, 'id' | 'createdAt'>): Promise<string> {
    try {
        const testimonialsRef = collection(db, 'testimonials');
        const docRef = await addDoc(testimonialsRef, {
            ...testimonial,
            createdAt: new Date(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding testimonial:', error);
        throw error;
    }
}

/**
 * Update a testimonial
 */
export async function updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<void> {
    try {
        const testimonialRef = doc(db, 'testimonials', id);
        await updateDoc(testimonialRef, updates);
    } catch (error) {
        console.error('Error updating testimonial:', error);
        throw error;
    }
}

/**
 * Default testimonials fallback
 */
function getDefaultTestimonials(): Testimonial[] {
    return [
        {
            name: 'Priya Sharma',
            role: 'PTE Score: 85 | Sri Lanka',
            content: 'Smart Labs transformed my preparation journey. The AI feedback and personalized study plan helped me achieve my target score in just 3 weeks!',
            avatar: 'PS',
            color: 'from-accent-1/80 to-accent-3/80',
            isActive: true,
            createdAt: new Date(),
        },
        {
            name: 'Liam Smith',
            role: 'IELTS Band: 8.5 | Australia',
            content: 'The instructors are incredibly knowledgeable. Their strategies for the speaking section were game-changers. Highly recommended!',
            avatar: 'LS',
            color: 'from-accent-2/80 to-accent-4/80',
            isActive: true,
            createdAt: new Date(),
        },
        {
            name: 'Nimali Perera',
            role: 'CELPIP Score: 12 | Sri Lanka',
            content: 'The self-paced CELPIP course was perfect for my schedule. The materials are comprehensive and the practice tests are very close to the real exam.',
            avatar: 'NP',
            color: 'from-primary/80 to-accent-2/80',
            isActive: true,
            createdAt: new Date(),
        },
    ];
}
