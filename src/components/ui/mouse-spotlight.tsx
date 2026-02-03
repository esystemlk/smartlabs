'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export function MouseSpotlight() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth out the movement
    const springX = useSpring(mouseX, { damping: 50, stiffness: 500 });
    const springY = useSpring(mouseY, { damping: 50, stiffness: 500 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-[9999] opacity-0 md:opacity-100"
            style={{
                background: `radial-gradient(600px circle at ${springX}px ${springY}px, rgba(79, 70, 229, 0.05), transparent 80%)`,
            }}
        />
    );
}
