(function () {
    const modal = document.getElementById('letterModal');
    const openBtn = document.getElementById('openLetterModal');
    const closeBtn = document.getElementById('closeModal');
    const nextBtn = document.getElementById('nextStep');
    const backBtn = document.getElementById('backStep');
    const finishBtn = document.getElementById('finishStep');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const senderNameInput = document.getElementById('senderName');
    const letterTextInput = document.getElementById('letterText');
    const iconOptions = document.querySelectorAll('.icon-option');

    const STORAGE_KEY = 'wallEveLetters';
    let pickedIcon = '';

    const safeValue = (value) => (typeof value === 'string' ? value.trim() : '');

    const resetModalFlow = () => {
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
        if (senderNameInput) senderNameInput.value = '';
        if (letterTextInput) letterTextInput.value = '';
        pickedIcon = '';
        iconOptions.forEach(option => option.classList.remove('selected'));
    };

    const saveLetterLocally = (letter) => {
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const letters = Array.isArray(existing) ? existing : [];
            letters.push(letter);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
        } catch (error) {
            console.error('Failed to save letter locally', error);
        }
    };

    const saveLetterToFirestore = async (letter) => {
        if (!letter) return false;

        try {
            const firestoreDb = await window.wallEveLoadFirebase?.();
            if (!firestoreDb) return false;

            const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
            await addDoc(collection(firestoreDb, 'letters'), {
                ...letter,
                createdAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("FIREBASE ERROR:", error);
            return false;
        }
    };

    const handleFinishClick = async () => {
        const name = safeValue(senderNameInput?.value);
        const letterText = safeValue(letterTextInput?.value);
        const icon = safeValue(pickedIcon);

        if (!name) {
            alert('Please enter your name first.');
            return;
        }

        if (!letterText) {
            alert('Please type your letter before finishing.');
            return;
        }

        if (!icon) {
            alert('Please choose a letter style.');
            return;
        }

        const letter = {
            name,
            letter: letterText,
            icon,
            createdAt: new Date().toISOString()
        };

        saveLetterLocally(letter);
        const savedToFirestore = await saveLetterToFirestore(letter);

        modal?.classList.remove('active');
        resetModalFlow();

        if (savedToFirestore) {
            alert(`Thanks ${name}! Your letter was saved.`);
        } else {
            alert(`Thanks ${name}! Your letter was saved locally. Firebase was unavailable.`);
        }
    };

    const openModal = () => {
        modal?.classList.add('active');
        resetModalFlow();
    };

    window.openLetterModal = openModal;

    openBtn?.addEventListener('click', openModal);

    closeBtn?.addEventListener('click', () => {
        modal?.classList.remove('active');
        resetModalFlow();
    });

    nextBtn?.addEventListener('click', () => {
        const name = safeValue(senderNameInput?.value);
        const letterText = safeValue(letterTextInput?.value);

        if (!name) {
            alert('Please enter your name first.');
            return;
        }

        if (!letterText) {
            alert('Please type your letter before continuing.');
            return;
        }

        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
    });

    backBtn?.addEventListener('click', () => {
        if (step2) step2.style.display = 'none';
        if (step1) step1.style.display = 'block';
    });

    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            iconOptions.forEach(item => item.classList.remove('selected'));
            option.classList.add('selected');
            pickedIcon = option.dataset.icon || 'mail';
        });
    });

    finishBtn?.addEventListener('click', handleFinishClick);
})();
