const resultData = JSON.parse(localStorage.getItem('quiz_last_result'));
if (!resultData) {
    window.location.href = 'index.html';
} else {
    document.getElementById('studentInfo').innerText = `[ĐỀ ${resultData.setNumber || 1}] ${resultData.studentName} - ${resultData.companyName}`;
    let currentScore = 0; const targetScore = resultData.score;
    const scoreEl = document.getElementById('scoreDisplay');
    const interval = setInterval(() => {
        if (currentScore >= targetScore) {
            clearInterval(interval); scoreEl.innerText = targetScore + '/100'; document.getElementById('ring').style.setProperty('--p', targetScore); document.getElementById('verdict').innerText = targetScore >= 80 ? '🏆 Xuất sắc! Bạn nắm rất vững kiến thức an toàn.' : targetScore >= 50 ? '👍 Khá tốt! Hãy ôn lại các câu còn sai nhé.' : '📚 Cần cố gắng thêm — hãy xem lại nội quy an toàn.';
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        } else {
            currentScore += 2; scoreEl.innerText = currentScore + '/100'; document.getElementById('ring').style.setProperty('--p', currentScore);
        }
    }, 20);
    document.getElementById('correctVal').innerText = resultData.correct;
    document.getElementById('wrongVal').innerText = resultData.wrong;
    const m = String(Math.floor(resultData.totalTime / 60)).padStart(2, '0');
    const s = String(resultData.totalTime % 60).padStart(2, '0');
    document.getElementById('timeVal').innerText = `${m}:${s}`;
}