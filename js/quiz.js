const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (!document.getElementById('soundToggle').checked) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }
}

const currentUser = JSON.parse(localStorage.getItem('quiz_current_user'));
if (!currentUser) window.location.href = 'index.html';

// Chức năng Bốc thăm Đề Ngẫu nhiên
const randomSetIndex = Math.floor(Math.random() * questionBanks.length);
const quizQuestions = questionBanks[randomSetIndex];
const currentSetNumber = randomSetIndex + 1;

let currentIndex = 0;
let wrongAttempts = 0;
let totalTime = 0;
let timerInterval;
let questionStartTime = Date.now();
const userAnswers = [];

const qText = document.getElementById('questionText');
const ansInput = document.getElementById('answerInput');
const checkBtn = document.getElementById('checkBtn');
const feedback = document.getElementById('feedbackText');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const qCount = document.getElementById('questionCount');
const timerEl = document.getElementById('timer');

timerInterval = setInterval(() => {
    totalTime++;
    const m = String(Math.floor(totalTime / 60)).padStart(2, '0');
    const s = String(totalTime % 60).padStart(2, '0');
    timerEl.innerText = `⏱ ${m}:${s}`;
}, 1000);

function loadQuestion() {
    if (currentIndex >= quizQuestions.length) { finishQuiz(); return; }
    
    const q = quizQuestions[currentIndex];
    qText.innerHTML = q.question.replace('___', '<span style="color:var(--primary); font-weight:700;">___</span>');
    ansInput.value = ''; ansInput.className = 'form-control input-answer'; 
    ansInput.disabled = false; checkBtn.disabled = false;
    feedback.className = 'feedback'; feedback.innerText = '';
    wrongAttempts = 0; questionStartTime = Date.now(); ansInput.focus();
    
    const qNum = currentIndex + 1;
    qCount.innerText = `[ĐỀ ${currentSetNumber}] CÂU ${qNum < 10 ? '0'+qNum : qNum} / ${quizQuestions.length}`;
    const percent = Math.round(((currentIndex) / quizQuestions.length) * 100);
    progressText.innerText = `${percent}%`;
    progressBar.style.width = `${percent}%`;
}

function handleCheck() {
    const q = quizQuestions[currentIndex];
    const userVal = ansInput.value.trim().toLowerCase();
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    
    if (userVal === '') {
        ansInput.classList.add('shake');
        setTimeout(() => ansInput.classList.remove('shake'), 500);
        return;
    }
    ansInput.disabled = true; checkBtn.disabled = true;

    if (q.acceptedAnswers.includes(userVal)) {
        playSound('correct'); ansInput.classList.add('correct-glow');
        feedback.innerText = '✓ Chính xác!'; feedback.className = 'feedback show correct';
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#10b981', '#4f46e5'] });
        saveAnswerRecord(q, userVal, 'correct', wrongAttempts, timeTaken);
        setTimeout(() => { currentIndex++; loadQuestion(); }, 1000);
    } else {
        playSound('wrong'); wrongAttempts++; ansInput.classList.add('shake');
        if (wrongAttempts >= 3) {
            feedback.innerText = `💡 Bạn đã sai 3 lần. Đáp án đúng là: "${q.answer}"`;
            feedback.className = 'feedback show info';
            saveAnswerRecord(q, userVal, 'wrong3', wrongAttempts, timeTaken);
            setTimeout(() => { currentIndex++; loadQuestion(); }, 2000);
        } else {
            feedback.innerText = `✕ Chưa đúng! Hãy thử lại (Sai ${wrongAttempts}/3 lần)`;
            feedback.className = 'feedback show wrong';
            setTimeout(() => {
                ansInput.classList.remove('shake'); ansInput.disabled = false;
                checkBtn.disabled = false; ansInput.focus(); ansInput.select();
            }, 600);
        }
    }
}

function saveAnswerRecord(q, userVal, status, attempts, time) {
    userAnswers.push({ questionId: q.id, questionText: q.question, userAnswer: userVal, correctAnswer: q.answer, status: status, attempts: attempts, timeTaken: time });
}

function finishQuiz() {
    clearInterval(timerInterval);
    const correctCount = userAnswers.filter(a => a.status === 'correct').length;
    const finalData = {
        ...currentUser,
        setNumber: currentSetNumber, // Gửi mã đề sang Admin
        score: Math.round((correctCount / quizQuestions.length) * 100),
        correct: correctCount, wrong: quizQuestions.length - correctCount,
        totalTime: totalTime, submittedAt: new Date().toLocaleString('vi-VN'),
        answers: userAnswers
    };
    let submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
    submissions.push(finalData);
    localStorage.setItem('quiz_submissions', JSON.stringify(submissions));
    localStorage.removeItem('quiz_current_user');
    localStorage.setItem('quiz_last_result', JSON.stringify(finalData));
    window.location.href = 'result.html';
}

checkBtn.addEventListener('click', handleCheck);
ansInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleCheck(); });
loadQuestion();