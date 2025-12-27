// 選擇科目 UI 切換
function selectSubject(code, el) {
    document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('subject-select').value = code;
    currentSubjectCode = code;
    currentSubjectName = el.innerText;
}

// 核心功能: 讀取題庫並分流到不同模式
async function prepareExam(mode) {
    const subjectCode = document.getElementById('subject-select').value;
    const cards = document.querySelectorAll('.subject-card');
    cards.forEach(c => {
        if(c.classList.contains('active')) currentSubjectName = c.innerText;
    });
    const qCount = parseInt(document.getElementById('question-count').value);
    
    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('loading-spinner').classList.remove('hidden');

    try {
        const response = await fetch(`questions/${subjectCode}.json`);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const allQuestions = await response.json();
        
        if (!Array.isArray(allQuestions) || allQuestions.length === 0) throw new Error("題庫為空");

        const actualCount = Math.min(qCount, allQuestions.length);
        currentQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, actualCount);
        
        currentSubjectCode = subjectCode;
        isRetryMode = false;

        document.getElementById('setup-view').classList.add('hidden');
        if (mode === 'exam') startExamMode(); // 呼叫 exam.js
        else startPracticeMode(); // 呼叫 practice.js

    } catch (error) {
        console.error(error);
        Swal.fire({
            title: '讀取失敗', 
            html: `請確認 <b class="text-red-500">${subjectCode}.json</b> 存在。<br>${error.message}`, 
            icon: 'error'
        });
        document.getElementById('action-buttons').classList.remove('hidden');
        document.getElementById('loading-spinner').classList.add('hidden');
    }
}
