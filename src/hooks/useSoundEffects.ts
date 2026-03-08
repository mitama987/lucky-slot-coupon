import { useRef, useCallback, useState } from 'react';

export function useSoundEffects() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const normalBgmRef = useRef<HTMLAudioElement | null>(null);
    const reachBgmRef = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    const initBgm = useCallback(() => {
        if (!normalBgmRef.current) {
            const base = import.meta.env.BASE_URL;
            normalBgmRef.current = new Audio(`${base}bgm/Golden_Cascade.mp3`);
            normalBgmRef.current.loop = true;
            normalBgmRef.current.volume = 0.3;

            reachBgmRef.current = new Audio(`${base}bgm/Jackpot_Cascade.mp3`);
            reachBgmRef.current.loop = true;
            reachBgmRef.current.volume = 0.4;
        }
    }, []);

    const startReachBgm = useCallback(() => {
        if (isMuted) return;
        if (normalBgmRef.current) {
            normalBgmRef.current.pause();
        }
        if (reachBgmRef.current) {
            reachBgmRef.current.currentTime = 0;
            reachBgmRef.current.play().catch(() => {});
        }
    }, [isMuted]);

    const stopReachBgm = useCallback(() => {
        if (reachBgmRef.current) {
            reachBgmRef.current.pause();
            reachBgmRef.current.currentTime = 0;
        }
        if (normalBgmRef.current && !isMuted) {
            normalBgmRef.current.play().catch(() => {});
        }
    }, [isMuted]);

    // Initialize and resume audio context (needs user interaction)
    const init = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        initBgm();
        if (normalBgmRef.current && !isMuted) {
            normalBgmRef.current.play().catch(() => {});
        }
    }, [initBgm, isMuted]);

    // Rest of original sounds (Spin, Stop, WinSmall, WinBig, Lose)
    const playSpinStart = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx || isMuted) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }, [isMuted]);

    const playReelStop = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx || isMuted) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = 150;

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }, [isMuted]);

    const playWinSmall = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx || isMuted) return;
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        const now = ctx.currentTime;

        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        });
    }, [isMuted]);

    const playWinBig = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx || isMuted) return;
        const now = ctx.currentTime;
        const melody = [
            { freq: 523.25, time: 0, dur: 0.15 },
            { freq: 523.25, time: 0.15, dur: 0.15 },
            { freq: 523.25, time: 0.3, dur: 0.15 },
            { freq: 659.25, time: 0.45, dur: 0.3 },
            { freq: 523.25, time: 0.8, dur: 0.15 },
            { freq: 659.25, time: 0.95, dur: 0.15 },
            { freq: 783.99, time: 1.1, dur: 0.6 },
        ];

        melody.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(0.4, now + note.time + 0.02);
            gain.gain.setValueAtTime(0.4, now + note.time + note.dur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + note.time);
            osc.stop(now + note.time + note.dur);
        });
    }, [isMuted]);

    const playLose = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx || isMuted) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
    }, [isMuted]);

    // --- NEW: Pachislot Effects ---

    // Reach Effect (High tension siren/heartbeat)
    const playReachEffect = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx || isMuted) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // Sirens usually alternate frequencies quickly
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        osc.frequency.linearRampToValueAtTime(600, now + 0.4);
        osc.frequency.linearRampToValueAtTime(800, now + 0.6);
        osc.frequency.linearRampToValueAtTime(600, now + 0.8);
        osc.frequency.linearRampToValueAtTime(800, now + 1.0);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.setValueAtTime(0.15, now + 0.9);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
    }, [isMuted]);

    // Guaranteed Win (Freeze: Dramatic blackout sound)
    const playFreezeEffect = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx || isMuted) return;
        const now = ctx.currentTime;

        // Low frequency rumbling impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.exponentialRampToValueAtTime(1, now + 1.5);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);

        // Followed by high pitched "Pshyuuu" 
        setTimeout(() => {
            const ctx2 = audioContextRef.current;
            if (!ctx2 || isMuted) return;
            const now2 = ctx2.currentTime;
            const osc2 = ctx2.createOscillator();
            const gain2 = ctx2.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(2000, now2);
            osc2.frequency.exponentialRampToValueAtTime(100, now2 + 1.0);
            gain2.gain.setValueAtTime(0.4, now2);
            gain2.gain.exponentialRampToValueAtTime(0.01, now2 + 1.0);
            osc2.connect(gain2);
            gain2.connect(ctx2.destination);
            osc2.start(now2);
            osc2.stop(now2 + 1.0);
        }, 400); // Trigger after 400ms

    }, [isMuted]);


    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            if (next) {
                normalBgmRef.current?.pause();
                reachBgmRef.current?.pause();
            } else {
                normalBgmRef.current?.play().catch(() => {});
            }
            return next;
        });
    }, []);

    return {
        init,
        isMuted,
        toggleMute,
        playSpinStart,
        playReelStop,
        playWinSmall,
        playWinBig,
        playLose,
        playReachEffect,
        playFreezeEffect,
        startReachBgm,
        stopReachBgm
    };
}
