document.getElementById('infoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = {
        id: 'TEST-' + Date.now(),
        studentName: document.getElementById('fullname').value.trim(),
        companyName: document.getElementById('companyName').value.trim(),
        email: document.getElementById('email').value.trim(),
    };
    localStorage.setItem('quiz_current_user', JSON.stringify(user));
    window.location.href = 'quiz.html';
});