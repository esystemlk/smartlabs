"use client";

import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export const TypewriterEffect = ({
    words,
    className,
    cursorClassName,
}: {
    words: {
        text: string;
        className?: string;
    }[];
    className?: string;
    cursorClassName?: string;
}) => {
    // Split words into array of characters
    const wordsArray = words.map((word) => {
        return {
            ...word,
            text: word.text.split(""),
        };
    });

    const [scope, animate] = useAnimate();
    const isInView = useInView(scope);

    useEffect(() => {
        let isMounted = true;
        if (isInView) {
            const loop = async () => {
                while (isMounted) {
                    await animate(
                        "span",
                        { opacity: 1 },
                        { duration: 0.1, delay: stagger(0.1), ease: "easeInOut" }
                    );
                    if (!isMounted) break;
                    await new Promise((r) => setTimeout(r, 2000));

                    if (!isMounted) break;
                    await animate(
                        "span",
                        { opacity: 0 },
                        { duration: 0.1, delay: stagger(0.05, { from: "last" }), ease: "easeInOut" }
                    );
                    if (!isMounted) break;
                    await new Promise((r) => setTimeout(r, 500));
                }
            };
            loop();
        }
        return () => { isMounted = false; };
    }, [isInView, animate]);

    const renderWords = () => {
        return (
            <motion.div ref={scope} className="inline">
                {wordsArray.map((word, idx) => {
                    return (
                        <div key={`word-${idx}`} className="inline-block mr-2 lg:mr-4">
                            {word.text.map((char, index) => (
                                <motion.span
                                    initial={{
                                        opacity: 0,
                                    }}
                                    key={`char-${index}`}
                                    className={cn("opacity-0", word.className)}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div
            className={`text-base sm:text-xl md:text-3xl lg:text-5xl font-bold text-center ${className}`}
        >
            {renderWords()}
            <motion.span
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={`inline-block rounded-sm w-[4px] h-8 md:h-10 lg:h-14 bg-blue-500 align-middle ${cursorClassName}`}
            ></motion.span>
        </div>
    );
};
