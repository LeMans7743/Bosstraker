// --- 修改：開啟模式選擇選單 ---
function openModeMenu(code, name) {
    // 1. 設定全域變數
    document.getElementById('subject-select').value = code;
    currentSubjectCode = code;
    currentSubjectName = name;
    
    // 2. 取消總測驗模式 (因為這是單科操作)
    isFullExamMode = false;

    // 3. 設定 UI 文字
    document.getElementById('modal-subject-title').innerText = name;

    // 4. 顯示 Modal
    const modal = document.getElementById('mode-selection-modal');
    modal.classList.remove('hidden');
    
    // 5. 點擊外部關閉
    modal.onclick = (e) => {
        if(e.target === modal) closeModeMenu();
    }
}

function closeModeMenu() {
    document.getElementById('mode-selection-modal').classList.add('hidden');
}

// 舊的 selectSubject 已經被 openModeMenu 取代，可以保留相容性或移除
// 這裡保留空函式避免其他地方報錯
function selectSubject(code, el) {
    // 轉接
    openModeMenu(code, el.innerText.replace(/\n/g, ' '));
}

// --- 啟動總測驗模式 ---
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
        confirmButtonColor: '#d946ef'
    }).then((result) => {
        if (result.isConfirmed) {
            isFullExamMode = true;
            fullExamStep = 0;
            fullExamScores = [];
            fullExamWrongDetails = []; 
            loadFullExamStep();
        }
    });
}

function loadFullExamStep() {
    const config = FULL_EXAM_CONFIG[fullExamStep];
    prepareExam('exam', config.code, config.count);
}

// 核心功能: 讀取題庫
async function prepareExam(mode, forceCode = null, forceCount = null) {
    const subjectCode = forceCode || document.getElementById('subject-select').value;
    const qCount = forceCount || parseInt(document.getElementById('question-count').value);
    
    if (!subjectCode && !forceCode) {
        Swal.fire({ title: '尚未選擇科目', text: '請先點擊科目', icon: 'warning', confirmButtonText: '好' });
        return;
    }

    if (forceCode) {
        currentSubjectName = FULL_EXAM_CONFIG.find(c => c.code === forceCode).name;
    } 
    // 注意：因為我們現在用 modal，currentSubjectName 已經在 openModeMenu 設定好了
    
    // 如果不是總測驗，隱藏首頁
    if (!forceCode) {
        document.getElementById('setup-view').classList.add('hidden');
    }
    
    document.getElementById('loading-spinner').classList.remove('hidden');

    try {
        let allQuestions = [];
        if (subjectCode === 'mix_mil_pol') {
            const [resMil, resPol] = await Promise.all([ fetch('questions/military.json'), fetch('questions/politics.json') ]);
            if (!resMil.ok || !resPol.ok) throw new Error("讀取混合題庫失敗");
            const dataMil = await resMil.json();
            const dataPol = await resPol.json();
            allQuestions = [...dataMil, ...dataPol];
        } else {
            const response = await fetch(`questions/${subjectCode}.json`);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            allQuestions = await response.json();
        }
        
        if (!Array.isArray(allQuestions) || allQuestions.length === 0) throw new Error("題庫為空");

        const actualCount = Math.min(qCount, allQuestions.length);
        currentQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, actualCount);
        currentSubjectCode = subjectCode;
        if (!isFullExamMode) isRetryMode = false;

        document.getElementById('setup-view').classList.add('hidden');
        document.getElementById('loading-spinner').classList.add('hidden'); // 讀取完畢隱藏 spinner

        if (mode === 'exam') startExamMode(); 
        else startPracticeMode(); 

    } catch (error) {
        console.error(error);
        Swal.fire({ title: '讀取失敗', html: `無法讀取題庫資料。<br>${error.message}`, icon: 'error' });
        document.getElementById('setup-view').classList.remove('hidden'); // 失敗時顯示回首頁
        document.getElementById('loading-spinner').classList.add('hidden');
    }
}

