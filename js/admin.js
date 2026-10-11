const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const logoutBtn = document.getElementById('logoutBtn');
const auth = firebase.auth();

let submissions = [];
let scoreChartInstance = null;
let ratioChartInstance = null;
let unsubscribe = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Lắng nghe dữ liệu realtime từ Firestore: có bài mới nộp là bảng tự cập nhật
function initDashboard() {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection('submissions').orderBy('createdAt').onSnapshot(snap => {
        submissions = snap.docs.map(d => d.data());
        renderStats(); renderTable(); renderCharts();
    }, err => { console.error(err); alert('Không đọc được dữ liệu: ' + err.message); });
}

function renderStats() {
    document.getElementById('statTotal').innerText = submissions.length;
    if (submissions.length === 0) {
        ['statAvg', 'statMax'].forEach(id => document.getElementById(id).innerText = '0');
        document.getElementById('statRatio').innerText = '0%';
        return;
    }
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
    [...submissions].reverse().forEach((sub, index) => {
        const tr = document.createElement('tr');
        const m = String(Math.floor(sub.totalTime / 60)).padStart(2, '0');
        const s = String(sub.totalTime % 60).padStart(2, '0');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${esc(sub.studentName)}</strong></td>
            <td>${esc(sub.companyName)}</td>
            <td>${esc(sub.email)}</td>
            <td>Đề ${esc(sub.setNumber || 1)}</td>
            <td><span style="color:var(--primary); font-weight:bold;">${sub.score}</span></td>
            <td>${m}:${s}</td>
            <td>${esc(sub.submittedAt)}</td>
            <td><button class="btn btn-small" onclick="viewDetail('${esc(sub.id)}')">Xem chi tiết</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCharts() {
    if (scoreChartInstance) scoreChartInstance.destroy();
    if (ratioChartInstance) ratioChartInstance.destroy();
    if (submissions.length === 0) return;
    let scoreRanges = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    let totalCorrect = 0, totalWrong = 0;
    submissions.forEach(sub => {
        if (sub.score <= 40) scoreRanges['0-40']++;
        else if (sub.score <= 60) scoreRanges['41-60']++;
        else if (sub.score <= 80) scoreRanges['61-80']++;
        else scoreRanges['81-100']++;
        totalCorrect += sub.correct; totalWrong += sub.wrong;
    });
    scoreChartInstance = new Chart(document.getElementById('scoreChart').getContext('2d'), {
        type: 'bar',
        data: { labels: Object.keys(scoreRanges), datasets: [{ label: 'Học viên theo phổ điểm', data: Object.values(scoreRanges), backgroundColor: '#2563eb', borderRadius: 10, maxBarThickness: 60 }] }
    });
    ratioChartInstance = new Chart(document.getElementById('ratioChart').getContext('2d'), {
        type: 'pie',
        data: { labels: ['Đúng', 'Sai'], datasets: [{ data: [totalCorrect, totalWrong], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] }
    });
}

function viewDetail(id) {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;
    document.getElementById('modalInfo').innerHTML = `
        <p><strong>Họ tên:</strong> ${esc(sub.studentName)} | <strong>Công ty:</strong> ${esc(sub.companyName)} | <strong>Email:</strong> ${esc(sub.email)} | <strong>Làm Đề:</strong> ${esc(sub.setNumber || 1)}</p>
        <p><strong>Điểm:</strong> <span style="color:var(--primary); font-weight:bold;">${sub.score}/100</span> | <strong>Đúng:</strong> ${sub.correct} | <strong>Sai:</strong> ${sub.wrong}</p>
    `;
    document.getElementById('modalAnswers').innerHTML = sub.answers.map((ans, i) => `
        <div class="detail-item ${ans.status === 'correct' ? 'correct' : 'wrong'}">
            <div style="font-weight:bold; margin-bottom:5px;">Câu ${i + 1}: ${esc(ans.questionText)}</div>
            <div style="font-size:14px;">
                Người dùng nhập: <strong>${esc(ans.userAnswer) || 'Không có'}</strong> (Sai ${ans.attempts} lần)<br>
                Đáp án đúng: <strong>${esc(ans.correctAnswer)}</strong><br>
                Trạng thái: ${ans.status === 'correct' ? '<span style="color:var(--success)">✓ Đúng</span>' : '<span style="color:var(--danger)">✕ Sai (3 lần)</span>'}
            </div>
        </div>
    `).join('');
    document.getElementById('detailModal').classList.add('active');
}

function closeModal() { document.getElementById('detailModal').classList.remove('active'); }

async function clearData() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu bài làm không? (Xóa trên server, không khôi phục được)')) return;
    try {
        const snap = await db.collection('submissions').get();
        for (let i = 0; i < snap.docs.length; i += 400) {
            const batch = db.batch();
            snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
        alert('Đã xóa dữ liệu!');
    } catch (err) { alert('Xóa thất bại: ' + err.message); }
}

function exportCSV() {
    if (submissions.length === 0) return alert('Không có dữ liệu để xuất!');
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    let csv = 'STT,Họ tên,Công ty,Email,Đề,Điểm,Đúng,Sai,Thời gian(s),Ngày nộp\n';
    submissions.forEach((sub, i) => {
        csv += [i + 1, q(sub.studentName), q(sub.companyName), q(sub.email), 'Đề ' + (sub.setNumber || 1), sub.score, sub.correct, sub.wrong, sub.totalTime, q(sub.submittedAt)].join(',') + '\n';
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'ThongKe_Quiz.csv'; link.click();
}

// Đăng nhập bằng Firebase Authentication (mật khẩu không còn nằm trong code)
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await auth.signInWithEmailAndPassword(document.getElementById('username').value.trim(), document.getElementById('password').value);
        document.getElementById('loginError').style.display = 'none';
    } catch (err) {
        document.getElementById('loginError').style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
    if (user) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        initDashboard();
    } else {
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }
        dashboardScreen.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginScreen.style.display = 'flex';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
});
