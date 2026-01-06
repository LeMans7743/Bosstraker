// 選擇科目 UI 切換
function selectSubject(code, el) {
    document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('subject-select').value = code;
    currentSubjectCode = code;
    currentSubjectName = el.innerText.replace(/\n/g, ' ');
    // 切換科目時，取消總測驗模式
    isFullExamMode = false;
}

// --- 新增：啟動總測驗模式 ---
function startFullMockExam() {
    Swal.fire({
        title: '準備進行總測驗',
        html: `
            <div class="text-left text-sm text-gray-600">
                <p>即將依序進行以下測驗：</p>
                <ul class="list-decimal pl-5 mt-2 font-bold text-gray-800">
                    <li>國文 (50題)</li>
                    <li>英文 (50題)</li>
                    <li>軍事與政治 (50題)</li>
                </ul>
                <p class="mt-4 text-red-500">注意：每科交卷後將直接進入下一科，直到全部結束才顯示成績。</p>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '開始測驗',
        confirmButtonColor: '#d946ef' // 紫色
    }).then((result) => {
        if (result.isConfirmed) {
            isFullExamMode = true;
            fullExamStep = 0;
            fullExamScores = [];
            loadFullExamStep();
        }
    });
}

function loadFullExamStep() {
    const config = FULL_EXAM_CONFIG[fullExamStep];
    // 呼叫 prepareExam，但帶入強制參數
    prepareExam('exam', config.code, config.count);
}

// 核心功能: 讀取題庫 (已修改支援參數)
async function prepareExam(mode, forceCode = null, forceCount = null) {
    // 如果有傳入強制參數(總測驗用)，則使用參數；否則讀取 DOM
    const subjectCode = forceCode || document.getElementById('subject-select').value;
    const qCount = forceCount || parseInt(document.getElementById('question-count').value);
    
    // 檢查是否選擇科目 (僅在非強制模式下檢查)
    if (!subjectCode && !forceCode) {
        Swal.fire({
            title: '尚未選擇科目',
            text: '請先點擊上方科目卡片進行選擇',
            icon: 'warning',
            confirmButtonText: '好'
        });
        return;
    }

    // 設定 UI 顯示名稱
    if (forceCode) {
        // 總測驗時，從 Config 抓名稱
        currentSubjectName = FULL_EXAM_CONFIG.find(c => c.code === forceCode).name;
    } else {
        // 一般模式，從 DOM 抓
        const cards = document.querySelectorAll('.subject-card');
        cards.forEach(c => {
            if(c.classList.contains('active')) currentSubjectName = c.innerText.replace(/\n/g, ' ');
        });
    }
    
    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('loading-spinner').classList.remove('hidden');

    try {
        let allQuestions = [];

        // --- 處理混合科目邏輯 ---
        if (subjectCode === 'mix_mil_pol') {
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
        // 如果不是總測驗模式，才重置重試模式標記；總測驗模式下保持 isFullExamMode 狀態
        if (!isFullExamMode) isRetryMode = false;

        document.getElementById('setup-view').classList.add('hidden');
        
        if (mode === 'exam') startExamMode(); 
        else startPracticeMode(); 

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

