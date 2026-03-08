import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { SYMBOLS } from '@/hooks/useSlotLogic';
import { cn } from '@/lib/utils';

interface ReelProps {
    isSpinning: boolean;
    isReach: boolean;
    targetSymbolIndex: number | null; // e.g., 0 for '7'
    stopDelay: number; // how long before stopping
    onStop: () => void;
    className?: string;
    reelId: number;
}

const SYMBOL_HEIGHT = 120; // Matches CSS/layout
const TOTAL_SYMBOLS = SYMBOLS.length;
const REEL_LOOP_COUNT = 8; // Extra rotations before stopping

export function Reel({ isSpinning, isReach, targetSymbolIndex, stopDelay, onStop, className, reelId }: ReelProps) {
    const controls = useAnimation();

    // Duplicated symbols to make it look endless but simplified by just rendering a long strip when spinning
    // To avoid complex infinite loop logic, we can generate a single long strip and move it down.
    const stripSymbols = [];
    for (let i = 0; i < REEL_LOOP_COUNT; i++) {
        stripSymbols.push(...SYMBOLS);
    }

    // Pre-calculate randomized layout just for the starting state
    const initialSymbolIndex = Math.floor(Math.random() * TOTAL_SYMBOLS);

    useEffect(() => {
        let cancelled = false;

        if (isSpinning) {
            if (targetSymbolIndex === null) return;

            // Start spinning animation sequence
            const spinDuration = stopDelay / 1000;

            const animateSpin = async () => {
                // Calculate the exact pixel offset to stop at the target symbol
                // The strip has REEL_LOOP_COUNT repetitions of the SYMBOLS array.
                // We will stop at the LAST repetition to ensure a long spin.
                const targetStopIndex = (REEL_LOOP_COUNT - 1) * TOTAL_SYMBOLS + targetSymbolIndex;
                const targetY = -(targetStopIndex * SYMBOL_HEIGHT);

                // If it's a Reach reel (usually the 3rd reel), slow down dramtically near the end
                if (isReach && reelId === 2) {
                    // First spin extremely fast
                    await controls.start({
                        y: targetY + (SYMBOL_HEIGHT * TOTAL_SYMBOLS), // stop one rotation before
                        transition: { duration: spinDuration * 0.4, ease: "linear" }
                    });
                    if (cancelled) return;
                    // Then dramatic slow down
                    await controls.start({
                        y: targetY,
                        transition: { duration: spinDuration * 0.6, ease: [0.17, 0.67, 0.12, 0.99] }
                    });
                } else {
                    // Normal spin
                    await controls.start({
                        y: targetY,
                        transition: {
                            duration: spinDuration,
                            ease: [0.17, 0.67, 0.12, 0.99] // Same bezier curve as original JS
                        }
                    });
                }

                if (!cancelled) {
                    onStop();
                }
            };
            animateSpin();

        } else {
            controls.stop();
            // If not spinning, reset position to just the initial or last known target
            if (targetSymbolIndex !== null) {
                controls.set({ y: -(targetSymbolIndex * SYMBOL_HEIGHT) });
            } else {
                // initial render
                controls.set({ y: -(initialSymbolIndex * SYMBOL_HEIGHT) });
            }
        }

        return () => {
            cancelled = true;
            controls.stop();
        };
    }, [isSpinning, targetSymbolIndex, stopDelay, isReach, controls, reelId, initialSymbolIndex]);

    return (
        <div className={cn("relative w-32 h-[120px] overflow-hidden rounded-xl border-4 border-zinc-800 bg-zinc-950 shadow-inner", className)}>
            <motion.div
                animate={controls}
                className="absolute top-0 w-full flex flex-col"
                style={{ willChange: "transform" }}
            >
                {stripSymbols.map((item, i) => (
                    <div key={i} className="w-full h-[120px] flex items-center justify-center select-none relative group drop-shadow-2xl">
                        <img
                            src={item}
                            alt={`slot symbol ${i}`}
                            draggable={false}
                            className="w-[100px] h-[100px] object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-transform duration-300 group-hover:scale-110"
                        />
                    </div>
                ))}
            </motion.div>
            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_bottom,transparent_0%,white_50%,transparent_100%)] mix-blend-overlay pointer-events-none" />
        </div>
    );
}
