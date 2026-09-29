const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const logoutBtn = document.getElementById('logoutBtn');

let submissions = [];
let scoreChartInstance = null;
let ratioChartInstance = null;

function initDashboard() {
    submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
    renderStats(); renderTable(); renderCharts();
}

function renderStats() {
    document.getElementById('statTotal').innerText = submissions.length;
    if (submissions.length === 0) return;
    let totalScore = 0, maxScore = 0, totalCorrect = 0, totalQuestions = 0;
    submissions.forEach(sub => {
        totalScore += sub.score;
        if (sub.score > maxScore) maxScore = sub.score;
        totalCorrect += sub.correct;
        totalQuestions += (sub.correct + sub.wrong);
    });
    document.getElementById('statAvg').innerText = Math.round(totalScore / submissions.length);
    document.getElementById('statMax').innerText = maxScore;
    document.getElementById('statRatio').innerText = Math.round((totalCorrect / totalQuestions) * 100) + '%';
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    const sorted = [...submissions].reverse();
    sorted.forEach((sub, index) => {
        const tr = document.createElement('tr');
        const m = String(Math.floor(sub.totalTime / 60)).padStart(2, '0');
        const s = String(sub.totalTime % 60).padStart(2, '0');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${sub.studentName}</strong></td>
            <td>${sub.studentCode}</td>
            <td>${sub.className}</td>
            <td>Đề ${sub.setNumber || 1}</td>
            <td><span style="color:var(--primary); font-weight:bold;">${sub.score}</span></td>
            <td>${m}:${s}</td>
            <td>${sub.submittedAt.split(' ')[1] || sub.submittedAt}</td>
            <td><button class="btn btn-small" onclick="viewDetail('${sub.id}')">Xem chi tiết</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCharts() {
    if (submissions.length === 0) {
        if(scoreChartInstance) scoreChartInstance.destroy();
        if(ratioChartInstance) ratioChartInstance.destroy();
        return;
    }
    let scoreRanges = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    let totalCorrect = 0, totalWrong = 0;
    submissions.forEach(sub => {
        if (sub.score <= 40) scoreRanges['0-40']++;
        else if (sub.score <= 60) scoreRanges['41-60']++;
        else if (sub.score <= 80) scoreRanges['61-80']++;
        else scoreRanges['81-100']++;
        totalCorrect += sub.correct; totalWrong += sub.wrong;
    });

    const ctxScore = document.getElementById('scoreChart').getContext('2d');
    if(scoreChartInstance) scoreChartInstance.destroy();
    scoreChartInstance = new Chart(ctxScore, {
        type: 'bar',
        data: {
            labels: Object.keys(scoreRanges),
            datasets: [{ label: 'Học viên theo phổ điểm', data: Object.values(scoreRanges), backgroundColor: '#4f46e5' }]
        }
    });

    const ctxRatio = document.getElementById('ratioChart').getContext('2d');
    if(ratioChartInstance) ratioChartInstance.destroy();
    ratioChartInstance = new Chart(ctxRatio, {
        type: 'pie',
        data: { labels: ['Đúng', 'Sai'], datasets: [{ data: [totalCorrect, totalWrong], backgroundColor: ['#10b981', '#ef4444'] }] }
    });
}

function viewDetail(id) {
    const sub = submissions.find(s => s.id === id);
    if(!sub) return;
    const modal = document.getElementById('detailModal');
    document.getElementById('modalInfo').innerHTML = `
        <p><strong>Họ tên:</strong> ${sub.studentName} | <strong>Lớp:</strong> ${sub.className} | <strong>Mã HV:</strong> ${sub.studentCode} | <strong>Làm Đề:</strong> ${sub.setNumber || 1}</p>
        <p><strong>Điểm:</strong> <span style="color:var(--primary); font-weight:bold;">${sub.score}/100</span> | <strong>Đúng:</strong> ${sub.correct} | <strong>Sai:</strong> ${sub.wrong}</p>
    `;
    document.getElementById('modalAnswers').innerHTML = sub.answers.map((ans, i) => `
        <div class="detail-item ${ans.status === 'correct' ? 'correct' : 'wrong'}">
            <div style="font-weight:bold; margin-bottom:5px;">Câu ${i+1}: ${ans.questionText}</div>
            <div style="font-size:14px;">
                Người dùng nhập: <strong>${ans.userAnswer || 'Không có'}</strong> (Sai ${ans.attempts} lần)<br>
                Đáp án đúng: <strong>${ans.correctAnswer}</strong><br>
                Trạng thái: ${ans.status === 'correct' ? '<span style="color:var(--success)">✓ Đúng</span>' : '<span style="color:var(--danger)">✕ Sai (3 lần)</span>'}
            </div>
        </div>
    `).join('');
    modal.classList.add('active');
}

function closeModal() { document.getElementById('detailModal').classList.remove('active'); }

function clearData() {
    if(confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu bài làm không?')) {
        localStorage.removeItem('quiz_submissions'); initDashboard();
        document.getElementById('statTotal').innerText = '0';
        document.getElementById('statAvg').innerText = '0';
        document.getElementById('statMax').innerText = '0';
        document.getElementById('statRatio').innerText = '0%';
        alert('Đã xóa dữ liệu!');
    }
}

function exportCSV() {
    if(submissions.length === 0) return alert('Không có dữ liệu để xuất!');
    let csv = 'STT,Họ tên,Mã HV,Lớp,Đề,Điểm,Đúng,Sai,Thời gian(s),Ngày nộp\n';
    submissions.forEach((sub, i) => {
        csv += `${i+1},${sub.studentName},${sub.studentCode},${sub.className},Đề ${sub.setNumber||1},${sub.score},${sub.correct},${sub.wrong},${sub.totalTime},${sub.submittedAt}\n`;
    });
    const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'ThongKe_Quiz.csv'; link.click();
}

function checkLogin() {
    if (sessionStorage.getItem('admin_logged') === 'true') {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        initDashboard();
    }
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    // Bạn đổi mật khẩu Admin ở dòng dưới này nhé:
    if (u === 'trungquy' && p === 'trung quy2025') {
        sessionStorage.setItem('admin_logged', 'true');
        checkLogin();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_logged');
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex'; // Fix lỗi lệch form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').style.display = 'none';
});

checkLogin();