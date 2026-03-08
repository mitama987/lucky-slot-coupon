import { useState, useCallback, useEffect } from 'react';
import symbol7 from '@/assets/symbols/7.png';
import symbolStar from '@/assets/symbols/star.png';
import symbolBar from '@/assets/symbols/bar.png';
import symbolCherry from '@/assets/symbols/cherry.png';
import symbolBell from '@/assets/symbols/bell.png';
import symbolDiamond from '@/assets/symbols/diamond.png';

export const SYMBOLS = [
    symbol7,
    symbolStar,
    symbolBar,
    symbolCherry,
    symbolBell,
    symbolDiamond
];
export const MAX_SPINS_PER_DAY = 5;
const STORAGE_KEY = 'luckySlot_spinData';

export const COUPONS = {
    small: [
        { code: 'TANTv', type: 'subscription', description: '980円/月のサブスクリプション', detail: '1,000円の割引が無期限に適用されます' },
        { code: 'Iw7RR', type: 'buyout', description: '6,980円で購入可能（買い切り）', detail: '22,820円の割引が適用されます' }
    ],
    big: [
        { code: 'gNSPV', type: 'buyout', description: '4,980円で購入可能（買い切り）', detail: '24,820円の割引が適用されます' },
        { code: 'nKdaf', type: 'subscription', description: '780円/月のサブスクリプション', detail: '1,200円の割引が無期限に適用されます' }
    ]
};

export const PAYMENT_URLS = {
    buyout: 'https://page.theapps.jp/charge/join/U8hv3G40M25l11n2',
    subscription: 'https://page.theapps.jp/contract/NioqTm3pHgxHHmNTkvJA7w%3D%3D'
};

export type SpinResult = 'big' | 'small' | 'lose' | null;

const PROBABILITY = { big: 0.20, small: 0.30, lose: 0.50 };
const WIN_PATTERNS = { big: 0, small1: 1, small2: 2 }; // 0: 7, 1: ★, 2: BAR

export function useSlotLogic() {
    const [remainingSpins, setRemainingSpins] = useState(MAX_SPINS_PER_DAY);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isReach, setIsReach] = useState(false);
    const [isGuaranteedWin, setIsGuaranteedWin] = useState(false);
    const [result, setResult] = useState<SpinResult>(null);
    const [targetPositions, setTargetPositions] = useState<number[]>([0, 0, 0]);

    const getTodayDate = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const today = getTodayDate();
            if (stored) {
                const data = JSON.parse(stored);
                if (data.date === today) {
                    setRemainingSpins(Math.max(0, MAX_SPINS_PER_DAY - data.count));
                } else {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
                    setRemainingSpins(MAX_SPINS_PER_DAY);
                }
            }
        } catch (e) {
            console.warn('localStorage read error', e);
        }
    }, []);

    const consumeSpin = useCallback(() => {
        setRemainingSpins((prev) => {
            const newCount = MAX_SPINS_PER_DAY - prev + 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayDate(), count: newCount }));
            return prev - 1;
        });
    }, []);

    const generateLosePositions = () => {
        const positions = [];
        const availableSymbols = [3, 4, 5]; // Not win symbols

        for (let i = 0; i < 3; i++) {
            positions.push(availableSymbols[Math.floor(Math.random() * availableSymbols.length)]);
        }
        if (positions[0] === positions[1] && positions[1] === positions[2]) {
            positions[2] = availableSymbols[(availableSymbols.indexOf(positions[2]) + 1) % availableSymbols.length];
        }
        return positions;
    };

    const determineResult = useCallback((): SpinResult => {
        const rand = Math.random();
        if (rand < PROBABILITY.big) return 'big';
        if (rand < PROBABILITY.big + PROBABILITY.small) return 'small';
        return 'lose';
    }, []);

    return {
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
    };
}
