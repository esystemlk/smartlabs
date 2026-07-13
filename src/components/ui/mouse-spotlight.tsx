'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';

export function MouseSpotlight() {
    const [enabled, setEnabled] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth out the movement
    const springX = useSpring(mouseX, { damping: 50, stiffness: 500 });
    const springY = useSpring(mouseY, { damping: 50, stiffness: 500 });

    // A plain template literal would stringify MotionValues as "[object Object]" —
    // useMotionTemplate keeps the gradient reactive and valid CSS.
    const background = useMotionTemplate`radial-gradient(600px circle at ${springX}px ${springY}px, rgba(79, 70, 229, 0.05), transparent 80%)`;

    useEffect(() => {
        // The spotlight is invisible on mobile (opacity-0 below md) — skip the
        // mousemove springs entirely on touch devices to save main-thread work.
        if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;
        setEnabled(true);

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    if (!enabled) return null;

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-[9999] opacity-0 md:opacity-100"
            style={{ background }}
        />
    );
}
