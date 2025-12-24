'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeButtonProps {
    onComplete: () => void;
    text: string;
    loadingText?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export function SwipeButton({
    onComplete,
    text,
    loadingText = 'Processing...',
    isLoading = false,
    disabled = false,
    className
}: SwipeButtonProps) {
    const [isComplete, setIsComplete] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Map x position to styles
    const opacity = useTransform(x, [0, 150], [1, 0]);
    const backgroundOpacity = useTransform(x, [0, 200], [0.1, 0.5]);
    const successOpacity = useTransform(x, [180, 250], [0, 1]);
    const scale = useTransform(x, [0, 50], [1, 1.05]);

    useEffect(() => {
        if (!isLoading && isComplete) {
            // Reset after success
            const timer = setTimeout(() => {
                setIsComplete(false);
                controls.start({ x: 0 });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isComplete, controls]);

    const handleDragEnd = async (_: any, info: any) => {
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const threshold = containerWidth * 0.7;

        if (info.offset.x >= threshold) {
            setIsComplete(true);
            await controls.start({ x: containerWidth - 56 }); // 56 is handle width
            onComplete();
        } else {
            controls.start({ x: 0 });
        }
    };

    if (isLoading) {
        return (
            <div className={cn(
                "relative h-14 w-full bg-primary-600 rounded-xl flex items-center justify-center overflow-hidden",
                className
            )}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 text-white font-semibold"
                >
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingText}
                </motion.div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative h-14 w-full bg-blue-50 dark:bg-gray-800 rounded-xl flex items-center p-1 overflow-hidden transition-colors border border-blue-100 dark:border-gray-700",
                disabled && "opacity-50 pointer-events-none",
                className
            )}
        >
            {/* Background progress fill */}
            <motion.div
                style={{ width: x, opacity: backgroundOpacity }}
                className="absolute left-0 top-0 h-full bg-primary-500 rounded-xl"
            />

            {/* Instruction Text */}
            <motion.div
                style={{ opacity }}
                className="absolute inset-0 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold pointer-events-none"
            >
                {text}
            </motion.div>

            {/* Success Text */}
            <motion.div
                style={{ opacity: successOpacity }}
                className="absolute inset-0 flex items-center justify-center text-white font-semibold pointer-events-none"
            >
                Success!
            </motion.div>

            {/* Draggable Handle */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: (containerRef.current?.offsetWidth || 0) - 56 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x, scale }}
                whileTap={{ cursor: 'grabbing' }}
                className="relative z-10 w-12 h-12 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center shadow-lg cursor-grab hover:bg-primary-700 transition-colors group"
            >
                {isComplete ? (
                    <Check className="text-white" size={24} />
                ) : (
                    <ChevronRight className="text-white group-hover:translate-x-0.5 transition-transform" size={24} />
                )}
            </motion.div>
        </div>
    );
}
