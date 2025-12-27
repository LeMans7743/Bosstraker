// 選擇科目 UI 切換
function selectSubject(code, el) {
    document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('subject-select').value = code;
    currentSubjectCode = code;
    currentSubjectName = el.innerText.replace(/\n/g, ' '); // 移除換行符
}

// 核心功能: 讀取題庫並分流到不同模式
async function prepareExam(mode) {
    const subjectCode = document.getElementById('subject-select').value;
    
    // 檢查是否選擇科目
    if (!subjectCode) {
        Swal.fire({
            title: '尚未選擇科目',
            text: '請先點擊上方科目卡片進行選擇',
            icon: 'warning',
            confirmButtonText: '好'
        });
        return;
    }

    const cards = document.querySelectorAll('.subject-card');
    cards.forEach(c => {
        if(c.classList.contains('active')) currentSubjectName = c.innerText.replace(/\n/g, ' ');
    });
    const qCount = parseInt(document.getElementById('question-count').value);
    
    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('loading-spinner').classList.remove('hidden');

    try {
        let allQuestions = [];

        // --- 處理混合科目邏輯 ---
        if (subjectCode === 'mix_mil_pol') {
            // 同時讀取軍事與政治
            const [resMil, resPol] = await Promise.all([
                fetch('questions/military.json'),
                fetch('questions/politics.json')
            ]);
            
            if (!resMil.ok || !resPol.ok) throw new Error("讀取混合題庫失敗");

            const dataMil = await resMil.json();
            const dataPol = await resPol.json();

            // 合併題庫
            allQuestions = [...dataMil, ...dataPol];

        } else {
            // 單一科目讀取
            const response = await fetch(`questions/${subjectCode}.json`);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            allQuestions = await response.json();
        }
        
        if (!Array.isArray(allQuestions) || allQuestions.length === 0) throw new Error("題庫為空");

        // 洗牌並擷取數量
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
            html: `無法讀取題庫資料。<br>${error.message}`, 
            icon: 'error'
        });
        document.getElementById('action-buttons').classList.remove('hidden');
        document.getElementById('loading-spinner').classList.add('hidden');
    }
}

