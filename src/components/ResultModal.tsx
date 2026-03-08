import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, PartyPopper } from 'lucide-react';
import { COUPONS, PAYMENT_URLS } from '@/hooks/useSlotLogic';
import type { SpinResult } from '@/hooks/useSlotLogic';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: SpinResult;
}

export function ResultModal({ isOpen, onClose, result }: ResultModalProps) {
    const [copied, setCopied] = useState(false);

    // Determine coupon based on result
    let selectedCoupon = null;
    if (result === 'big') {
        // Pick random big coupon
        selectedCoupon = COUPONS.big[Math.floor(Math.random() * COUPONS.big.length)];
    } else if (result === 'small') {
        // Pick random small coupon
        selectedCoupon = COUPONS.small[Math.floor(Math.random() * COUPONS.small.length)];
    }

    const handleCopy = () => {
        if (!selectedCoupon) return;
        navigator.clipboard.writeText(selectedCoupon.code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const isWin = result === 'big' || result === 'small';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(
                "sm:max-w-md border bg-black/80 backdrop-blur-xl transition-all duration-500",
                result === 'big' ? "border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)]" :
                    result === 'small' ? "border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]" :
                        "border-zinc-800"
            )}>
                <DialogHeader className="flex flex-col items-center text-center">
                    {isWin ? (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                        >
                            <PartyPopper className="w-10 h-10 text-black" />
                        </motion.div>
                    ) : (
                        <div className="text-7xl mb-4">😢</div>
                    )}

                    <DialogTitle className={cn(
                        "text-3xl font-black uppercase tracking-wider",
                        result === 'big' ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500" :
                            result === 'small' ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500" :
                                "text-zinc-400"
                    )}>
                        {result === 'big' ? '大当たり！' : result === 'small' ? '当たり！' : '残念...'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-300 text-lg">
                        {result === 'big' ? 'おめでとうございます！特別クーポンをGET！' :
                            result === 'small' ? 'クーポンをGETしました！' : 'またチャレンジしてね！'}
                    </DialogDescription>
                </DialogHeader>

                {isWin && selectedCoupon && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center gap-4 mt-6"
                    >
                        <div className="w-full relative">
                            <span className="absolute -top-3 left-4 bg-zinc-900 text-xs text-zinc-400 px-2 rounded-full border border-zinc-700">クーポンコード</span>
                            <div className="flex items-center space-x-2 w-full p-4 border border-zinc-700 bg-zinc-900/50 rounded-xl justify-between">
                                <span className="font-mono text-2xl tracking-widest text-white font-bold">{selectedCoupon.code}</span>
                                <Button size="icon" variant="secondary" onClick={handleCopy} className={cn("transition-all", copied && "bg-green-600 hover:bg-green-600 text-white")}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Card className="p-4 bg-black/40 border-zinc-800 text-sm text-center w-full">
                            <p className="font-bold text-yellow-400 mb-1">{selectedCoupon.description}</p>
                            <p className="text-zinc-400">{selectedCoupon.detail}</p>
                        </Card>

                        <div className="w-full text-center mt-2">
                            <p className="text-xs text-zinc-500 mb-2">このクーポンは以下の決済ページで使えます</p>
                            <a
                                href={PAYMENT_URLS[selectedCoupon.type as keyof typeof PAYMENT_URLS]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold hover:opacity-90 transition-opacity"
                            >
                                決済ページへ →
                            </a>
                        </div>
                    </motion.div>
                )}
            </DialogContent>
        </Dialog>
    );
}
