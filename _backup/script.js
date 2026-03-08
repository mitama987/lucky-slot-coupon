// シンボル定義
const SYMBOLS = ['7', '★', 'BAR', '🍒', '🔔', '💎'];
const SYMBOL_HEIGHT = 120; // CSSのsymbol高さと合わせる

// ===== 1日3回制限マネージャー（localStorage） =====
const MAX_SPINS_PER_DAY = 5;
const STORAGE_KEY = 'luckySlot_spinData';

class SpinLimiter {
    constructor() {
        this.data = this.loadData();
    }

    // 今日の日付を取得（YYYY-MM-DD形式）
    getTodayDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // データを読み込む
    loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('localStorage読み込みエラー:', e);
        }
        return { date: this.getTodayDate(), count: 0 };
    }

    // データを保存する
    saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('localStorage保存エラー:', e);
        }
    }

    // 残り回数を取得
    getRemainingSpins() {
        const today = this.getTodayDate();

        // 日付が変わったらリセット
        if (this.data.date !== today) {
            this.data = { date: today, count: 0 };
            this.saveData();
        }

        return MAX_SPINS_PER_DAY - this.data.count;
    }

    // スピン可能かチェック
    canSpin() {
        return this.getRemainingSpins() > 0;
    }

    // スピン回数を消費
    consumeSpin() {
        const today = this.getTodayDate();

        // 日付が変わったらリセット
        if (this.data.date !== today) {
            this.data = { date: today, count: 0 };
        }

        this.data.count++;
        this.saveData();

        return this.getRemainingSpins();
    }
}

// スピン制限マネージャーのインスタンス
const spinLimiter = new SpinLimiter();

// 決済ページURL
const PAYMENT_URLS = {
    buyout: 'https://page.theapps.jp/charge/join/U8hv3G40M25l11n2',
    subscription: 'https://page.theapps.jp/contract/NioqTm3pHgxHHmNTkvJA7w%3D%3D'
};

// クーポンコード定義
const COUPONS = {
    small: [
        {
            code: 'TANTv',
            type: 'subscription',
            description: '980円/月のサブスクリプション',
            detail: '1,000円の割引が無期限に適用されます'
        },
        {
            code: 'Iw7RR',
            type: 'buyout',
            description: '6,980円で購入可能（買い切り）',
            detail: '22,820円の割引が適用されます'
        }
    ],
    big: [
        {
            code: 'gNSPV',
            type: 'buyout',
            description: '4,980円で購入可能（買い切り）',
            detail: '24,820円の割引が適用されます'
        },
        {
            code: 'nKdaf',
            type: 'subscription',
            description: '780円/月のサブスクリプション',
            detail: '1,200円の割引が無期限に適用されます'
        }
    ]
};

// 当選確率
const PROBABILITY = {
    big: 0.20,    // 大当たり 20%
    small: 0.30,  // 小当たり 30%
    lose: 0.50    // はずれ 50%
};

// 当選パターン（シンボルのインデックス）
const WIN_PATTERNS = {
    big: 0,    // 7 (index 0)
    small1: 1, // ★ (index 1)
    small2: 2  // BAR (index 2)
};

// ===== サウンドマネージャー（Web Audio API） =====
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.bgmOscillator = null;
        this.bgmGain = null;
        this.isBgmPlaying = false;
    }

    // AudioContextを初期化（ユーザー操作後に呼び出す必要あり）
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // ミュート切り替え
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.bgmGain) {
            this.bgmGain.gain.value = 0;
        } else if (!this.isMuted && this.bgmGain) {
            this.bgmGain.gain.value = 0.15;
        }
        return this.isMuted;
    }

    // BGM再生（シンプルなループ音楽）
    startBgm() {
        if (this.isBgmPlaying || !this.audioContext) return;

        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.gain.value = this.isMuted ? 0 : 0.15;
        this.bgmGain.connect(this.audioContext.destination);

        // シンプルなジャズ風BGM
        const playNote = (freq, startTime, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // ループするBGMパターン
        const playLoop = () => {
            if (!this.isBgmPlaying) return;

            const now = this.audioContext.currentTime;
            const notes = [
                { freq: 261.63, time: 0, dur: 0.3 },    // C4
                { freq: 329.63, time: 0.35, dur: 0.3 }, // E4
                { freq: 392.00, time: 0.7, dur: 0.3 },  // G4
                { freq: 329.63, time: 1.05, dur: 0.3 }, // E4
                { freq: 293.66, time: 1.4, dur: 0.3 },  // D4
                { freq: 349.23, time: 1.75, dur: 0.3 }, // F4
                { freq: 392.00, time: 2.1, dur: 0.3 },  // G4
                { freq: 440.00, time: 2.45, dur: 0.5 }, // A4
            ];

            notes.forEach(note => {
                playNote(note.freq, now + note.time, note.dur);
            });

            // 3秒後にループ
            setTimeout(() => playLoop(), 3000);
        };

        this.isBgmPlaying = true;
        playLoop();
    }

    stopBgm() {
        this.isBgmPlaying = false;
    }

    // スピン開始音（上昇する電子音）
    playSpinStart() {
        if (this.isMuted || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    // リール停止音（クリック音）
    playReelStop() {
        if (this.isMuted || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.value = 150;

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // 小当たり音（チャイム音）
    playWinSmall() {
        if (this.isMuted || !this.audioContext) return;

        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        const now = this.audioContext.currentTime;

        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        });
    }

    // 大当たり音（ファンファーレ）
    playWinBig() {
        if (this.isMuted || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // ファンファーレのメロディ
        const melody = [
            { freq: 523.25, time: 0, dur: 0.15 },      // C5
            { freq: 523.25, time: 0.15, dur: 0.15 },   // C5
            { freq: 523.25, time: 0.3, dur: 0.15 },    // C5
            { freq: 659.25, time: 0.45, dur: 0.3 },    // E5
            { freq: 523.25, time: 0.8, dur: 0.15 },    // C5
            { freq: 659.25, time: 0.95, dur: 0.15 },   // E5
            { freq: 783.99, time: 1.1, dur: 0.6 },     // G5
        ];

        melody.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(0.4, now + note.time + 0.02);
            gain.gain.setValueAtTime(0.4, now + note.time + note.dur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now + note.time);
            osc.stop(now + note.time + note.dur);
        });
    }

    // はずれ音（残念な音）
    playLose() {
        if (this.isMuted || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // 下降する音
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(now + 0.5);
    }
}

// サウンドマネージャーのインスタンス
const soundManager = new SoundManager();

// DOM要素
const spinBtn = document.getElementById('spinBtn');
const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
];
const modalOverlay = document.getElementById('modalOverlay');
const resultModal = document.getElementById('resultModal');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const couponBox = document.getElementById('couponBox');
const couponCode = document.getElementById('couponCode');
const couponDetail = document.getElementById('couponDetail');
const copyBtn = document.getElementById('copyBtn');
const closeBtn = document.getElementById('closeBtn');
const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.getElementById('soundIcon');
const remainingCountEl = document.getElementById('remainingCount');
const countNumberEl = document.getElementById('countNumber');
const paymentLinkBox = document.getElementById('paymentLinkBox');
const paymentLink = document.getElementById('paymentLink');

let isSpinning = false;

// 残り回数表示を更新
function updateRemainingDisplay() {
    const remaining = spinLimiter.getRemainingSpins();
    countNumberEl.textContent = remaining;

    if (remaining <= 0) {
        remainingCountEl.classList.add('exhausted');
        remainingCountEl.innerHTML = '本日の挑戦回数は終了しました<br><small>明日またお越しください！</small>';
        spinBtn.disabled = true;
        spinBtn.querySelector('.btn-text').textContent = '本日終了';
    } else {
        remainingCountEl.classList.remove('exhausted');
        spinBtn.disabled = false;
        spinBtn.querySelector('.btn-text').textContent = 'SPIN';
    }
}

// 初期化
function init() {
    // 各リールをランダムな位置に設定
    reels.forEach(reel => {
        const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
        reel.style.transform = `translateY(-${randomIndex * SYMBOL_HEIGHT}px)`;
    });

    // 残り回数を表示
    updateRemainingDisplay();
}

// 結果を決定する
function determineResult() {
    const rand = Math.random();

    if (rand < PROBABILITY.big) {
        return 'big';
    } else if (rand < PROBABILITY.big + PROBABILITY.small) {
        return 'small';
    } else {
        return 'lose';
    }
}

// リールをスピンさせる
function spin() {
    if (isSpinning) return;

    // 回数制限チェック
    if (!spinLimiter.canSpin()) {
        updateRemainingDisplay();
        return;
    }

    // サウンド初期化（ユーザー操作時に必要）
    soundManager.init();

    // BGM開始（初回のみ）
    if (!soundManager.isBgmPlaying) {
        soundManager.startBgm();
    }

    // スピン回数を消費
    spinLimiter.consumeSpin();
    updateRemainingDisplay();

    isSpinning = true;
    spinBtn.disabled = true;

    // スピン開始音
    soundManager.playSpinStart();

    // 結果を先に決定
    const result = determineResult();

    // スピン開始
    reels.forEach(reel => {
        reel.classList.add('spinning');
    });

    // 目標位置を決定
    let targetPositions;

    if (result === 'big') {
        // 大当たり: 777
        targetPositions = [0, 0, 0];
    } else if (result === 'small') {
        // 小当たり: ★★★ or BAR BAR BAR
        const smallPattern = Math.random() < 0.5 ? WIN_PATTERNS.small1 : WIN_PATTERNS.small2;
        targetPositions = [smallPattern, smallPattern, smallPattern];
    } else {
        // はずれ: ランダムな不揃い
        targetPositions = generateLosePositions();
    }

    // 各リールを順番に停止
    stopReel(0, targetPositions[0], 1500, () => {
        stopReel(1, targetPositions[1], 500, () => {
            stopReel(2, targetPositions[2], 500, () => {
                // 全リール停止後
                setTimeout(() => {
                    showResult(result);
                    isSpinning = false;
                    spinBtn.disabled = false;
                }, 300);
            });
        });
    });
}

// はずれ用のポジションを生成（揃わないように）
function generateLosePositions() {
    const positions = [];
    const availableSymbols = [3, 4, 5]; // 🍒, 🔔, 💎（当たりシンボル以外）

    for (let i = 0; i < 3; i++) {
        positions.push(availableSymbols[Math.floor(Math.random() * availableSymbols.length)]);
    }

    // 全部同じなら変更
    if (positions[0] === positions[1] && positions[1] === positions[2]) {
        positions[2] = availableSymbols[(availableSymbols.indexOf(positions[2]) + 1) % availableSymbols.length];
    }

    return positions;
}

// リールを停止
function stopReel(reelIndex, targetPosition, delay, callback) {
    setTimeout(() => {
        const reel = reels[reelIndex];
        reel.classList.remove('spinning');

        // リール停止音
        soundManager.playReelStop();

        // 複数回転してから目標位置に止まる（演出）
        const spins = 3 + reelIndex; // リールごとに回転数を変える
        const totalOffset = (spins * SYMBOLS.length + targetPosition) * SYMBOL_HEIGHT;

        reel.style.transition = 'transform 0.8s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        reel.style.transform = `translateY(-${targetPosition * SYMBOL_HEIGHT}px)`;

        setTimeout(() => {
            reel.style.transition = '';
            if (callback) callback();
        }, 800);
    }, delay);
}

// 結果を表示
function showResult(result) {
    const container = document.querySelector('.container');

    // クラスをリセット
    resultModal.classList.remove('lose');
    container.classList.remove('jackpot');

    if (result === 'big') {
        // 大当たり
        soundManager.playWinBig();

        const coupon = COUPONS.big[Math.floor(Math.random() * COUPONS.big.length)];
        container.classList.add('jackpot');
        resultModal.classList.add('big-win');

        resultIcon.textContent = '🎉';
        resultTitle.textContent = '大当たり！';
        resultMessage.textContent = 'おめでとうございます！特別クーポンをGET！';
        couponBox.style.display = 'block';
        couponCode.textContent = coupon.code;
        couponDetail.textContent = `${coupon.description}\n${coupon.detail}`;
        couponDetail.style.display = 'block';

        // 決済リンクを設定
        paymentLinkBox.style.display = 'block';
        paymentLink.href = PAYMENT_URLS[coupon.type];
    } else if (result === 'small') {
        // 小当たり
        soundManager.playWinSmall();

        const coupon = COUPONS.small[Math.floor(Math.random() * COUPONS.small.length)];

        resultIcon.textContent = '✨';
        resultTitle.textContent = '当たり！';
        resultMessage.textContent = 'クーポンをGETしました！';
        couponBox.style.display = 'block';
        couponCode.textContent = coupon.code;
        couponDetail.textContent = `${coupon.description}\n${coupon.detail}`;
        couponDetail.style.display = 'block';

        // 決済リンクを設定
        paymentLinkBox.style.display = 'block';
        paymentLink.href = PAYMENT_URLS[coupon.type];
    } else {
        // はずれ
        soundManager.playLose();
        resultModal.classList.add('lose');

        resultIcon.textContent = '😢';
        resultTitle.textContent = '残念...';
        resultMessage.textContent = 'またチャレンジしてね！';
        couponBox.style.display = 'none';
        couponDetail.style.display = 'none';
        paymentLinkBox.style.display = 'none';
    }

    // モーダルを表示
    modalOverlay.classList.add('active');
}

// クーポンコードをコピー
function copyCoupon() {
    const code = couponCode.textContent;

    navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = 'コピー完了!';
        copyBtn.classList.add('copied');

        setTimeout(() => {
            copyBtn.textContent = 'コピー';
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        // フォールバック
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        copyBtn.textContent = 'コピー完了!';
        copyBtn.classList.add('copied');

        setTimeout(() => {
            copyBtn.textContent = 'コピー';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
}

// モーダルを閉じる
function closeModal() {
    modalOverlay.classList.remove('active');
    document.querySelector('.container').classList.remove('jackpot');
    resultModal.classList.remove('big-win');
}

// 音声ON/OFF切り替え
function toggleSound() {
    soundManager.init();
    const muted = soundManager.toggleMute();

    if (muted) {
        soundIcon.textContent = '🔇';
        soundToggle.classList.add('muted');
    } else {
        soundIcon.textContent = '🔊';
        soundToggle.classList.remove('muted');
        // BGM再開
        if (!soundManager.isBgmPlaying) {
            soundManager.startBgm();
        }
    }
}

// イベントリスナー
spinBtn.addEventListener('click', spin);
copyBtn.addEventListener('click', copyCoupon);
closeBtn.addEventListener('click', closeModal);
soundToggle.addEventListener('click', toggleSound);

// モーダル外クリックで閉じる
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// 初期化実行
init();
