// js/home.js

// --- 1. 開啟模式選擇選單 (點擊科目卡片時觸發) ---
function openModeMenu(code, name) {
    // 設定全域變數
    document.getElementById('subject-select').value = code;
    currentSubjectCode = code;
    currentSubjectName = name;
    
    // 取消總測驗模式狀態 (因為這是單科操作)
    isFullExamMode = false;

    // 更新 Modal 上的標題
    document.getElementById('modal-subject-title').innerText = name;

    // 顯示 Modal
    const modal = document.getElementById('mode-selection-modal');
    modal.classList.remove('hidden');
    
    // 點擊 Modal 外部背景時自動關閉
    modal.onclick = (e) => {
        if(e.target === modal) closeModeMenu();
    }
}

function closeModeMenu() {
    document.getElementById('mode-selection-modal').classList.add('hidden');
}

// 相容性保留：如果有些舊的按鈕還呼叫 selectSubject，將其轉接給 openModeMenu
function selectSubject(code, el) {
    openModeMenu(code, el.innerText.replace(/\n/g, ' '));
}


// --- 2. 啟動總測驗模式 (三科連考) ---
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
                <p class="mt-4 text-red-500">注意：每科交卷後將直接進入下一科，直到全部結束才顯示成績與錯題。</p>
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
            fullExamWrongDetails = []; // 重置累積錯題
            loadFullExamStep();
        }
    });
}

function loadFullExamStep() {
    const config = FULL_EXAM_CONFIG[fullExamStep];
    prepareExam('exam', config.code, config.count);
}


// --- 3. 核心功能: 讀取題庫並分流 ---
async function prepareExam(mode, forceCode = null, forceCount = null) {
    const subjectCode = forceCode || document.getElementById('subject-select').value;
    const qCount = forceCount || parseInt(document.getElementById('question-count').value);
    
    // 防呆
    if (!subjectCode && !forceCode) {
        Swal.fire({ title: '尚未選擇科目', text: '請先點擊科目卡片', icon: 'warning', confirmButtonText: '好' });
        return;
    }

    // 如果是總測驗(強制模式)，更新當前科目名稱
    if (forceCode) {
        currentSubjectName = FULL_EXAM_CONFIG.find(c => c.code === forceCode).name;
    } 
    // 如果是單科模式，currentSubjectName 已經在 openModeMenu 設定好了
    
    // 隱藏設定介面，顯示 Loading
    if (!forceCode) { // 只有非總測驗模式才需要手動隱藏首頁
        document.getElementById('setup-view').classList.add('hidden');
    }
    document.getElementById('loading-spinner').classList.remove('hidden');

    try {
        let allQuestions = [];
        
        // 混合科目邏輯
        if (subjectCode === 'mix_mil_pol') {
            const [resMil, resPol] = await Promise.all([ fetch('questions/military.json'), fetch('questions/politics.json') ]);
            if (!resMil.ok || !resPol.ok) throw new Error("讀取混合題庫失敗");
            const dataMil = await resMil.json();
            const dataPol = await resPol.json();
            allQuestions = [...dataMil, ...dataPol];
        } else {
            // 單科讀取
            const response = await fetch(`questions/${subjectCode}.json`);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            allQuestions = await response.json();
        }
        
        if (!Array.isArray(allQuestions) || allQuestions.length === 0) throw new Error("題庫為空");

        // 洗牌與切片
        const actualCount = Math.min(qCount, allQuestions.length);
        currentQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, actualCount);
        
        currentSubjectCode = subjectCode; // 設定全域變數，供 Exam/Practice/Bank 使用
        
        // 總測驗模式下不改變 Retry 標記
        if (!isFullExamMode) isRetryMode = false;

        document.getElementById('setup-view').classList.add('hidden');
        document.getElementById('loading-spinner').classList.add('hidden');

        // 分流到對應模式
        if (mode === 'exam') startExamMode(); 
        else startPracticeMode(); 

    } catch (error) {
        console.error(error);
        Swal.fire({ title: '讀取失敗', html: `無法讀取題庫資料。<br>${error.message}`, icon: 'error' });
        document.getElementById('setup-view').classList.remove('hidden');
        document.getElementById('loading-spinner').classList.add('hidden');
    }
}

