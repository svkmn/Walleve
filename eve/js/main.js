document.addEventListener('DOMContentLoaded', () => {
    const statsPanel = document.createElement('div');
    statsPanel.className = 'stats-panel';
    statsPanel.innerHTML = `
        <div class="stats-pill">✉️ Letters: <strong id="lettersCount">0</strong></div>
        <div class="stats-pill">🕯️ Candles: <strong id="candlesCount">0</strong></div>
    `;
    document.body.appendChild(statsPanel);

    const updateStats = () => {
        const letters = JSON.parse(localStorage.getItem('wallEveLetters') || '[]');
        const candles = JSON.parse(localStorage.getItem('wallEveCandles') || '[]');
        const lettersCount = document.getElementById('lettersCount');
        const candlesCount = document.getElementById('candlesCount');
        if (lettersCount) lettersCount.textContent = Array.isArray(letters) ? letters.length : 0;
        if (candlesCount) candlesCount.textContent = Array.isArray(candles) ? candles.length : 0;
    };

    updateStats();
    window.addEventListener('storage', updateStats);
    window.addEventListener('focus', updateStats);

    const typingText = document.getElementById('typingText');
    if (typingText) {
        setTimeout(() => {
            typingText.classList.add('finished');
        }, 6500);
    }

    const AUDIO_KEY = 'wallEveAudioState';
    const AUDIO_RESUME_FLAG = 'wallEveResumeAudio';
    const AUDIO_SRC = 'assets/audios/ns.mp3';

    const getAudio = () => {
        let audio = document.getElementById('siteAudio');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'siteAudio';
            audio.loop = true;
            audio.preload = 'auto';
            audio.playsInline = true;

            const source = document.createElement('source');
            source.src = AUDIO_SRC;
            source.type = 'audio/mpeg';
            audio.appendChild(source);
            document.body.appendChild(audio);
        }
        return audio;
    };

    const readAudioState = () => {
        try {
            return JSON.parse(sessionStorage.getItem(AUDIO_KEY) || '{}');
        } catch {
            return {};
        }
    };

    const saveAudioState = (audio) => {
        if (!audio) return;
        const state = {
            currentTime: audio.currentTime || 0,
            volume: audio.volume ?? 0.2,
            isPlaying: !audio.paused
        };
        sessionStorage.setItem(AUDIO_KEY, JSON.stringify(state));
    };

    const siteAudio = getAudio();
    const navType = performance.getEntriesByType('navigation')[0]?.type || 'navigate';
    const shouldResume = navType !== 'reload' && sessionStorage.getItem(AUDIO_RESUME_FLAG) === '1';
    const savedState = readAudioState();

    if (shouldResume) {
        sessionStorage.removeItem(AUDIO_RESUME_FLAG);
    }

    const startAudio = () => {
        if (!siteAudio) return;
        const state = readAudioState();
        const resumeFromSavedState = navType !== 'reload' && typeof state.currentTime === 'number' && state.currentTime > 0;

        siteAudio.volume = typeof state.volume === 'number' ? state.volume : 0.2;
        siteAudio.currentTime = resumeFromSavedState ? state.currentTime : 0;
        siteAudio.play().catch(() => {});
    };

    siteAudio.addEventListener('timeupdate', () => saveAudioState(siteAudio));
    siteAudio.addEventListener('play', () => saveAudioState(siteAudio));
    siteAudio.addEventListener('pause', () => saveAudioState(siteAudio));
    window.addEventListener('beforeunload', () => {
        saveAudioState(siteAudio);
        sessionStorage.setItem(AUDIO_RESUME_FLAG, '1');
    });
    window.addEventListener('pagehide', () => {
        saveAudioState(siteAudio);
        sessionStorage.setItem(AUDIO_RESUME_FLAG, '1');
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveAudioState(siteAudio);
        }
    });

    startAudio();
    window.addEventListener('pointerdown', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });

    const openWriteModal = document.getElementById('openWriteModal');
    const letterModal = document.getElementById('letterModal');
    const closeModal = document.getElementById('closeModal');
    const continueWrite = document.getElementById('continueWrite');
    const senderNameInput = document.getElementById('senderName');
    const candleButton = document.getElementById('lightCandleBtn');
    const candleImage = document.getElementById('candleImage');
    const candleLabel = candleButton?.querySelector('.candle-label');
    const candleLayer = document.getElementById('candleLayer');
    const candleFrames = ['assets/candle/c1.png', 'assets/candle/c2.png', 'assets/candle/c3.png'];
    const CANDLE_STORAGE_KEY = 'wallEveCandles';
    let candleFrameIndex = 0;
    let candleAnimationTimer = null;
    let activeDragToken = null;

    const getCurrentUserName = () => {
        try {
            const draft = JSON.parse(localStorage.getItem('letterDraft') || 'null');
            if (draft?.name) return draft.name;
        } catch {}

        const savedName = localStorage.getItem('letterAuthorName') || localStorage.getItem('senderName') || '';
        return savedName.trim() || 'A Friend';
    };

    const getCandles = () => {
        try {
            return JSON.parse(localStorage.getItem(CANDLE_STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    };

    const saveCandles = (candles) => {
        localStorage.setItem(CANDLE_STORAGE_KEY, JSON.stringify(candles));
    };

    const createCandleToken = (x, y, name) => {
        if (!candleLayer) return;

        const token = document.createElement('div');
        token.className = 'candle-token';
        const candleImg = document.createElement('img');
        candleImg.src = 'assets/candle/c1.png';
        candleImg.alt = 'candle';
        const nameLabel = document.createElement('span');
        nameLabel.className = 'candle-name';
        nameLabel.textContent = name;
        token.appendChild(candleImg);
        token.appendChild(nameLabel);
        token.style.left = `${x}%`;
        token.style.top = `${y}%`;

        let frameIndex = 0;
        const animateToken = () => {
            frameIndex = (frameIndex + 1) % candleFrames.length;
            candleImg.src = candleFrames[frameIndex];
        };
        const tokenAnimationTimer = setInterval(animateToken, 220);

        const startDrag = (event) => {
            activeDragToken = {
                token,
                startX: event.clientX,
                startY: event.clientY,
                startLeft: parseFloat(token.style.left),
                startTop: parseFloat(token.style.top)
            };
            token.setPointerCapture(event.pointerId);
            event.preventDefault();
        };

        const moveDrag = (event) => {
            if (!activeDragToken || activeDragToken.token !== token) return;
            const rect = candleLayer.getBoundingClientRect();
            const deltaX = event.clientX - activeDragToken.startX;
            const deltaY = event.clientY - activeDragToken.startY;
            const nextX = Math.min(100, Math.max(0, activeDragToken.startLeft + (deltaX / rect.width) * 100));
            const nextY = Math.min(100, Math.max(0, activeDragToken.startTop + (deltaY / rect.height) * 100));
            token.style.left = `${nextX}%`;
            token.style.top = `${nextY}%`;
        };

        const endDrag = () => {
            if (!activeDragToken || activeDragToken.token !== token) return;
            const candles = getCandles();
            const index = Array.from(candleLayer.children).indexOf(token);
            if (candles[index]) {
                candles[index] = {
                    ...candles[index],
                    x: parseFloat(token.style.left),
                    y: parseFloat(token.style.top)
                };
                saveCandles(candles);
            }
            activeDragToken = null;
        };

        token.addEventListener('pointerdown', startDrag);
        token.addEventListener('pointermove', moveDrag);
        token.addEventListener('pointerup', endDrag);
        token.addEventListener('pointerleave', endDrag);
        token.addEventListener('pointercancel', () => {
            clearInterval(tokenAnimationTimer);
        });
        candleLayer.appendChild(token);
    };

    const renderCandles = () => {
        if (!candleLayer) return;
        candleLayer.innerHTML = '';
        const candles = getCandles();
        candles.forEach((candle) => {
            createCandleToken(candle.x, candle.y, candle.name);
        });
    };

    const stopCandleAnimation = () => {
        if (candleAnimationTimer) {
            clearInterval(candleAnimationTimer);
            candleAnimationTimer = null;
        }
        if (candleImage) {
            candleImage.src = 'assets/candle/c1.png';
        }
    };

    const startCandleAnimation = () => {
        if (!candleButton || !candleImage) return;

        candleButton.classList.add('lit');
        candleButton.setAttribute('aria-pressed', 'true');
        if (candleLabel) candleLabel.textContent = 'Candle Lit';

        candleFrameIndex = 0;
        candleImage.src = candleFrames[candleFrameIndex];

        candleAnimationTimer = setInterval(() => {
            candleFrameIndex = (candleFrameIndex + 1) % candleFrames.length;
            candleImage.src = candleFrames[candleFrameIndex];
        }, 220);
    };

    candleButton?.addEventListener('click', () => {
        candleButton.classList.add('lit');
        candleButton.setAttribute('aria-pressed', 'true');
        if (candleLabel) candleLabel.textContent = 'Candle Lit';

        stopCandleAnimation();
        startCandleAnimation();

        const name = getCurrentUserName();
        const candles = getCandles();
        const buttonRect = candleButton.getBoundingClientRect();
        const x = ((buttonRect.left + buttonRect.width / 2) / window.innerWidth) * 100;
        const y = ((buttonRect.top + buttonRect.height / 2) / window.innerHeight) * 100;

        const newCandle = { x, y, name };
        candles.push(newCandle);
        saveCandles(candles);
        createCandleToken(newCandle.x, newCandle.y, newCandle.name);
    });

    openWriteModal?.addEventListener('click', () => {
        letterModal?.classList.add('active');
    });

    renderCandles();

    closeModal?.addEventListener('click', () => {
        letterModal?.classList.remove('active');
        if (senderNameInput) senderNameInput.value = '';
    });

    continueWrite?.addEventListener('click', () => {
        const name = senderNameInput?.value.trim() || '';
        if (!name) {
            alert('Please enter your name first.');
            return;
        }

        localStorage.setItem('letterAuthorName', name);
        sessionStorage.setItem(AUDIO_RESUME_FLAG, '1');
        window.location.href = 'write.html';
    });
});

        