document.addEventListener('DOMContentLoaded', () => {
    const lettersList = document.getElementById('lettersList');
    const previewCard = document.getElementById('letterPreview');
    const previewName = document.getElementById('previewName');
    const previewBody = document.getElementById('previewBody');
    const closePreview = document.getElementById('closePreview');
    const STORAGE_KEY = 'wallEveLetters';

    const updateStats = () => {
        const letters = JSON.parse(localStorage.getItem('wallEveLetters') || '[]');
        const candles = JSON.parse(localStorage.getItem('wallEveCandles') || '[]');
        const lettersCount = document.getElementById('lettersCount');
        const candlesCount = document.getElementById('candlesCount');
        if (lettersCount) lettersCount.textContent = Array.isArray(letters) ? letters.length : 0;
        if (candlesCount) candlesCount.textContent = Array.isArray(candles) ? candles.length : 0;
    };

    const safeValue = (value) => (typeof value === 'string' ? value : '');

    const loadLocalLetters = () => {
        try {
            const savedLetters = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(savedLetters) ? savedLetters : (savedLetters ? [savedLetters] : []);
        } catch {
            return [];
        }
    };

    const fetchRemoteLetters = async () => {
        try {
            const firestoreDb = await window.wallEveLoadFirebase?.();
            if (!firestoreDb) return null;

            const { collection, query, orderBy, getDocs } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
            const lettersCollection = collection(firestoreDb, 'letters');
            const q = query(lettersCollection, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: safeValue(data.name || 'A letter'),
                    letter: safeValue(data.letter || ''),
                    icon: safeValue(data.icon || 'mail'),
                    createdAt: data.createdAt?.toDate?.().toISOString?.() || data.createdAt || ''
                };
            });
        } catch (error) {
            console.error('Firebase load error:', error);
            return null;
        }
    };

    const hidePreview = () => {
        if (previewCard) {
            previewCard.hidden = true;
        }
    };

    const showLetter = (index, letters) => {
        const letter = letters[index];
        if (!letter || !previewCard || !previewName || !previewBody) return;

        previewName.textContent = letter.name || 'A letter';
        previewBody.textContent = letter.letter || 'No message yet.';
        previewCard.hidden = false;
        previewCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const renderLettersData = (letters) => {
        if (!lettersList) return;

        if (!letters.length) {
            lettersList.innerHTML = '<p class="empty-state">No letters yet. Write one to see it here.</p>';
            return;
        }

        lettersList.innerHTML = letters.map((letter, index) => {
            const iconName = letter.icon === 'mail' ? 'brownmail.png' : 'pinkmail.png';
            const altText = letter.icon === 'mail' ? 'Brown mail icon' : 'Pink mail icon';
            return `
                <button class="letter-card" type="button" data-index="${index}" draggable="false">
                    <img class="letter-card-img" src="assets/designs/${iconName}" alt="${altText}" draggable="false">
                    <span>${letter.name || 'A letter'}</span>
                </button>
            `;
        }).join('');

        lettersList.querySelectorAll('.letter-card').forEach((button) => {
            let dragState = null;

            const setInitialPosition = () => {
                const rect = button.getBoundingClientRect();
                button.style.position = 'fixed';
                button.style.left = `${rect.left}px`;
                button.style.top = `${rect.top}px`;
                button.style.margin = '0';
                button.style.zIndex = '6';
            };

            const handlePointerDown = (event) => {
                if (event.button !== 0) return;
                dragState = {
                    startX: event.clientX,
                    startY: event.clientY,
                    startLeft: button.getBoundingClientRect().left,
                    startTop: button.getBoundingClientRect().top,
                    moved: false
                };
                button.classList.add('dragging');
                document.addEventListener('pointermove', handlePointerMove);
                document.addEventListener('pointerup', handlePointerUp);
                event.preventDefault();
            };

            const handlePointerMove = (event) => {
                if (!dragState) return;
                const dx = event.clientX - dragState.startX;
                const dy = event.clientY - dragState.startY;

                if (!dragState.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                    dragState.moved = true;
                }

                if (dragState.moved) {
                    button.style.left = `${dragState.startLeft + dx}px`;
                    button.style.top = `${dragState.startTop + dy}px`;
                }
            };

            const handlePointerUp = (event) => {
                if (!dragState) return;

                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);

                if (dragState.moved) {
                    button.classList.remove('dragging');
                    button.style.animation = 'none';
                    dragState = null;
                    event.preventDefault();
                    return;
                }

                showLetter(Number(button.dataset.index), letters);
                button.classList.remove('dragging');
                button.style.animation = '';
                dragState = null;
            };

            button.addEventListener('dragstart', (event) => event.preventDefault());
            button.addEventListener('pointerdown', handlePointerDown);
            button.addEventListener('click', (event) => {
                if (dragState && dragState.moved) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                if (dragState) {
                    dragState = null;
                }
            });

            setInitialPosition();
        });
    };

    const renderLetters = async () => {
        const localLetters = loadLocalLetters();
        renderLettersData(localLetters);

        const remoteLetters = await fetchRemoteLetters();
        if (Array.isArray(remoteLetters) && remoteLetters.length) {
            renderLettersData(remoteLetters);
        }
    };

    closePreview?.addEventListener('click', () => {
        hidePreview();
    });

    hidePreview();

    updateStats();
    window.addEventListener('storage', updateStats);
    window.addEventListener('focus', updateStats);

    renderLetters();
});
