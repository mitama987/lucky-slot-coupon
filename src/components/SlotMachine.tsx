import { useState } from 'react';
import { Reel } from './Reel';
import { ResultModal } from './ResultModal';
import { useSlotLogic } from '@/hooks/useSlotLogic';
import type { SpinResult } from '@/hooks/useSlotLogic';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SlotMachine() {
    const {
        remainingSpins,
        isSpinning,
        setIsSpinning,
        isReach,
        setIsReach,
        isGuaranteedWin,
        setIsGuaranteedWin,
        result,
        setResult,
        targetPositions,
        setTargetPositions,
        consumeSpin,
        determineResult,
        generateLosePositions,
        WIN_PATTERNS
    } = useSlotLogic();

    const sounds = useSoundEffects();
    const [modalOpen, setModalOpen] = useState(false);

    // Track individual reel spinning state for the component rendering logic
    const [reelSpinning, setReelSpinning] = useState([false, false, false]);

    const handleSpin = async () => {
        if (isSpinning || remainingSpins <= 0) return;

        sounds.init();

        // Check for "Freeze" (Guaranteed Win) - e.g. 5% chance
        const isFreeze = Math.random() < 0.05;

        let spinResult: SpinResult;
        let finalPositions: number[];

        if (isFreeze) {
            setIsGuaranteedWin(true);
            sounds.playFreezeEffect();
            spinResult = 'big';
            finalPositions = [WIN_PATTERNS.big, WIN_PATTERNS.big, WIN_PATTERNS.big];

            // Wait for freeze effect to finish before starting spin
            await new Promise(res => setTimeout(res, 2500));
            setIsGuaranteedWin(false);
        } else {
            spinResult = determineResult();
            if (spinResult === 'big') {
                finalPositions = [WIN_PATTERNS.big, WIN_PATTERNS.big, WIN_PATTERNS.big];
            } else if (spinResult === 'small') {
                const pattern = Math.random() < 0.5 ? WIN_PATTERNS.small1 : WIN_PATTERNS.small2;
                finalPositions = [pattern, pattern, pattern];
            } else {
                finalPositions = generateLosePositions();
            }
        }

        // Check if Reach holds true (first two reels match)
        // Only happens if the first two reels naturally roll the same symbol, 
        // or if we force it for a dramatic effect when it's a win
        const reachTriggered = finalPositions[0] === finalPositions[1];

        setTargetPositions(finalPositions);
        setResult(spinResult);
        setIsSpinning(true);
        setReelSpinning([true, true, true]);
        consumeSpin();

        sounds.playSpinStart();

        if (reachTriggered && !isFreeze) {
            setIsReach(true);
            sounds.playReachEffect();
        }

        // Stop logic
        setTimeout(() => stopReel(0), 1500);
        setTimeout(() => stopReel(1), 2000);

        // 3rd reel takes much longer if Reach
        setTimeout(() => {
            stopReel(2);
        }, reachTriggered ? 5000 : 2500);

    };

    const stopReel = (index: number) => {
        setReelSpinning(prev => {
            const next = [...prev];
            next[index] = false;
            return next;
        });
        sounds.playReelStop();

        if (index === 2) {
            // All stopped
            setIsSpinning(false);
            setIsReach(false);
            setTimeout(() => {
                setModalOpen(true);
            }, 500);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
            {/* Guaranteed Win Blackout Overlay */}
            <AnimatePresence>
                {isGuaranteedWin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, delay: 0.5 }}
                            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent mix-blend-overlay"
                        />
                        <motion.h1
                            initial={{ y: 50, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1.2 }}
                            transition={{ duration: 0.8, delay: 1 }}
                            className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 tracking-widest drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]"
                        >
                            確定
                        </motion.h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reach Effect Background Animation */}
            <div className={cn(
                "absolute inset-0 -z-10 rounded-3xl transition-all duration-1000 blur-2xl opacity-0 bg-red-600/30",
                isReach && "opacity-100 animate-pulse bg-gradient-to-r from-red-600/50 via-yellow-500/30 to-red-600/50"
            )} />

            <div className="w-full flex justify-end mb-4 px-4">
                <Button variant="ghost" size="icon" onClick={sounds.toggleMute} className="text-zinc-400 hover:text-white rounded-full">
                    {sounds.isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
            </div>

            <div className="flex bg-zinc-950 p-6 md:p-10 rounded-3xl border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                {/* Inner premium borders */}
                <div className="absolute inset-0 border border-white/5 rounded-3xl pointer-events-none" />
                <div className="absolute inset-[2px] border border-black/50 rounded-[22px] pointer-events-none" />

                <div className="flex gap-2 relative z-10">
                    <Reel reelId={0} isSpinning={reelSpinning[0]} isReach={isReach} targetSymbolIndex={targetPositions[0]} stopDelay={1500} onStop={() => { }} />
                    <Reel reelId={1} isSpinning={reelSpinning[1]} isReach={isReach} targetSymbolIndex={targetPositions[1]} stopDelay={2000} onStop={() => { }} />
                    <Reel reelId={2} isSpinning={reelSpinning[2]} isReach={isReach} targetSymbolIndex={targetPositions[2]} stopDelay={isReach ? 5000 : 2500} onStop={() => { }} />
                </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-6">
                <div className="relative group">
                    {/* Spin Button Glow */}
                    <div className={cn(
                        "absolute -inset-1 rounded-full blur-md bg-gradient-to-r from-yellow-400 to-yellow-600 transition duration-1000",
                        (isSpinning || remainingSpins <= 0) ? "opacity-0" : "opacity-70 group-hover:opacity-100"
                    )} />
                    <Button
                        onClick={handleSpin}
                        disabled={isSpinning || remainingSpins <= 0}
                        className={cn(
                            "relative w-40 h-40 rounded-full text-4xl font-black uppercase tracking-wider shadow-2xl transition-all border-4",
                            (isSpinning || remainingSpins <= 0)
                                ? "bg-zinc-800 border-zinc-700 text-zinc-500 shadow-none hover:bg-zinc-800"
                                : "bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 border-yellow-200 text-zinc-900 hover:scale-105"
                        )}
                    >
                        {remainingSpins <= 0 ? (
                            <span className="text-xl">本日終了</span>
                        ) : (
                            <span>Spin</span>
                        )}
                    </Button>
                </div>

                <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 px-6 py-3 rounded-full flex items-center gap-3">
                    <span className="text-zinc-400 font-medium">本日あと</span>
                    <span className={cn(
                        "text-2xl font-black",
                        remainingSpins > 0 ? "text-yellow-400" : "text-red-500"
                    )}>
                        {remainingSpins}
                    </span>
                    <span className="text-zinc-400 font-medium">回</span>
                </div>
            </div>

            {/* Prize Table */}
            <div className="mt-16 w-full max-w-2xl bg-zinc-950/50 rounded-2xl border border-zinc-800 p-6 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-xl font-bold text-white tracking-widest">景品一覧</h3>
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-900/20 border border-yellow-500/50 rounded-xl p-4 flex flex-col items-center">
                        <span className="text-3xl tracking-widest drop-shadow-md mb-2">7 7 7</span>
                        <span className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs mb-3">大当たり</span>
                        <div className="text-sm text-zinc-300 text-center space-y-1">
                            <p><span className="text-yellow-400 mr-2">買い切り</span> 4,980円</p>
                            <p><span className="text-yellow-400 mr-2">サブスク</span> 780円/月</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/50 rounded-xl p-4 flex flex-col items-center">
                        <span className="text-3xl tracking-widest drop-shadow-md mb-2">★ ★ ★</span>
                        <span className="bg-blue-500 text-white font-bold px-3 py-1 rounded-full text-xs mb-3">当たり</span>
                        <div className="text-sm text-zinc-300 text-center space-y-1">
                            <p><span className="text-blue-400 mr-2">買い切り</span> 6,980円</p>
                            <p><span className="text-blue-400 mr-2">サブスク</span> 980円/月</p>
                        </div>
                    </div>
                </div>
            </div>

            <ResultModal isOpen={modalOpen} onClose={handleModalClose} result={result} />
        </div>
    );
}
