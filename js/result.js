const resultData = JSON.parse(localStorage.getItem('quiz_last_result'));
if (!resultData) {
    window.location.href = 'index.html';
} else {
    document.getElementById('studentInfo').innerText = `[ĐỀ ${resultData.setNumber || 1}] ${resultData.studentName} - ${resultData.className}`;
    let currentScore = 0; const targetScore = resultData.score;
    const scoreEl = document.getElementById('scoreDisplay');
    const interval = setInterval(() => {
        if (currentScore >= targetScore) {
            clearInterval(interval); scoreEl.innerText = targetScore + '/100';
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        } else {
            currentScore += 2; scoreEl.innerText = currentScore + '/100';
        }
    }, 20);
    document.getElementById('correctVal').innerText = resultData.correct;
    document.getElementById('wrongVal').innerText = resultData.wrong;
    const m = String(Math.floor(resultData.totalTime / 60)).padStart(2, '0');
    const s = String(resultData.totalTime % 60).padStart(2, '0');
    document.getElementById('timeVal').innerText = `${m}:${s}`;
}