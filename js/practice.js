let currentQIndex = 0;
let practiceCorrectCount = 0; 
let practiceWrongDetails = []; // 新增：用來儲存練習模式的錯題細節

// --- 錯題複習入口 ---
function startRetryMode() {
    const subjectCode = document.getElementById('subject-select').value;
    
    if (!subjectCode) {
        Swal.fire('請先選擇科目', '', 'warning');
        return;
    }

    const cards = document.querySelectorAll('.subject-card');
    cards.forEach(c => {
        if(c.classList.contains('active')) currentSubjectName = c.innerText;
    });

    const wrongDB = JSON.parse(localStorage.getItem('gh_wrong_questions_v1') || '{}');
    let wrongList = wrongDB[subjectCode] || [];

    if (wrongList.length === 0) {
        Swal.fire('太棒了', '此科目目前沒有紀錄錯誤題目！', 'info');
        return;
    }

    currentQuestions = wrongList.sort(() => 0.5 - Math.random());
    currentSubjectCode = subjectCode;
    isRetryMode = true;

    document.getElementById('setup-view').classList.add('hidden');
    startPracticeMode();
}

// --- 練習模式主邏輯 ---
function startPracticeMode() {
    currentMode = 'practice';
    document.getElementById('practice-mode-view').classList.remove('hidden');
    document.getElementById('mode-badge').innerText = isRetryMode ? "錯題複習" : "練習模式";
    
    // 初始化變數
    currentQIndex = 0;
    practiceCorrectCount = 0;
    practiceWrongDetails = []; // 清空錯題紀錄
    
    // 確保介面狀態正確 (因為可能從檢討頁回來)
    document.getElementById('practice-card').classList.remove('hidden');
    const reviewDiv = document.getElementById('practice-review-area');
    if(reviewDiv) reviewDiv.remove(); // 移除舊的檢討區(如果有的話)

    renderPracticeQ();
}

function renderPracticeQ() {
    const q = currentQuestions[currentQIndex];
    document.getElementById('practice-progress').innerText = `題目 ${currentQIndex+1} / ${currentQuestions.length}`;
    document.getElementById('practice-q-text').innerText = q.q;
    
    const optsDiv = document.getElementById('practice-options');
    optsDiv.innerHTML = '';
    
    document.getElementById('practice-feedback').classList.add('hidden');
    document.getElementById('practice-hint-text').classList.add('hidden');

    q.options.forEach((opt, i) => {
        const val = ["A","B","C","D"][i];
        const btn = document.createElement('div');
        btn.className = "option-card bg-gray-50 p-4 rounded-xl flex items-center text-gray-700 font-medium";
        btn.innerHTML = `<span class="w-8 h-8 rounded-full bg-white border border-gray-300 flex justify-center items-center mr-4 text-sm font-bold shadow-sm flex-shrink-0">${val}</span>${opt}`;
        btn.onclick = () => checkPractice(btn, val, q.ans, q);
        optsDiv.appendChild(btn);
    });
}

function checkPractice(el, userAns, correctAns, questionObj) {
    // 鎖定所有按鈕防止連點
    document.querySelectorAll('.option-card').forEach(d => d.onclick = null);
    
    const feedback = document.getElementById('practice-feedback');
    const hint = document.getElementById('practice-hint-text');
    feedback.classList.remove('hidden');
    
    // 取得選項文字內容
    const valMap = { "A": 0, "B": 1, "C": 2, "D": 3 };
    const ansText = questionObj.options[valMap[correctAns]] || "";
    const userText = questionObj.options[valMap[userAns]] || "";

    if(userAns === correctAns) {
        // --- 答對 ---
        practiceCorrectCount++;
        el.classList.add('correct');
        feedback.innerHTML = `<div class="flex items-center text-green-700 font-bold">回答正確！</div>`;
        if(isRetryMode) removeWrongQuestion(currentSubjectCode, questionObj);
        
        // 0.25秒後自動換題
        setTimeout(() => { nextPracticeQuestion(); }, 250);

    } else {
        // --- 答錯 ---
        el.classList.add('wrong');
        
        // 記錄錯題資訊 (供最後結算使用)
        practiceWrongDetails.push({
            q: questionObj.q,
            userVal: userAns,
            userText: userText,
            ansVal: correctAns,
            ansText: ansText,
            idx: currentQIndex + 1
        });

        // 顯示即時回饋 (包含文字)
        feedback.innerHTML = `
            <div class="text-red-600 font-bold mb-1">回答錯誤</div>
            <div class="text-gray-600">正確答案是：<b class="text-green-600 text-lg mr-1">${correctAns}</b> <span class="text-sm text-gray-800 font-bold">(${ansText})</span></div>
        `;
        
        // 標示正確選項
        const correctIdx = valMap[correctAns];
        if (correctIdx !== -1) document.getElementById('practice-options').children[correctIdx].classList.add('correct');
        
        saveWrongQuestion(currentSubjectCode, questionObj);
        
        // 顯示點擊提示
        hint.classList.remove('hidden');

        // 啟用全螢幕點擊遮罩 (Click to continue)
        const overlay = document.getElementById('click-overlay');
        overlay.classList.remove('hidden');
        
        const clickHandler = () => {
            overlay.classList.add('hidden');
            overlay.removeEventListener('click', clickHandler);
            nextPracticeQuestion();
        };
        
        overlay.addEventListener('click', clickHandler);
    }
}

function nextPracticeQuestion() {
    if(++currentQIndex < currentQuestions.length) {
        renderPracticeQ();
    } else {
        // --- 練習結束 ---
        const label = isRetryMode ? '錯題複習' : '練習模式';
        const res = `${practiceCorrectCount}/${currentQuestions.length} 題`;
        saveLog(label, res);
        
        Swal.fire({
            title: '練習結束',
            html: `
                <div class="text-center">
                    <h2 class="text-4xl font-bold text-blue-600 mb-2">${res}</h2>
                    <p class="text-gray-500">正確率: ${Math.round((practiceCorrectCount/currentQuestions.length)*100)}%</p>
                </div>`, 
            icon: 'success',
            confirmButtonText: '查看錯題檢討'
        }).then(() => {
            showPracticeReviewList();
        });
    }
}

// --- 顯示練習模式的結算檢討 ---
function showPracticeReviewList() {
    // 隱藏題目卡片
    document.getElementById('practice-card').classList.add('hidden');
    document.getElementById('practice-progress').innerText = "錯題檢討";

    // 建立檢討區塊
    const container = document.getElementById('practice-mode-view');
    const reviewDiv = document.createElement('div');
    reviewDiv.id = "practice-review-area";
    reviewDiv.className = "pb-24 animate-fade-in-up"; // 增加底部 padding 防止被 footer 擋住

    if (practiceWrongDetails.length === 0) {
        reviewDiv.innerHTML = `
            <div class="bg-white p-10 rounded-2xl shadow-lg text-center">
                <div class="text-green-500 text-5xl mb-4">🎉</div>
                <h3 class="text-2xl font-bold text-gray-800">太強了！全對！</h3>
                <p class="text-gray-500 mt-2">本次練習沒有錯誤題目。</p>
                <button onclick="location.reload()" class="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">返回首頁</button>
            </div>
        `;
    } else {
        const listHtml = practiceWrongDetails.map(w => `
            <div class="bg-white p-5 rounded-lg border-l-4 border-red-500 shadow-sm mb-4">
                <div class="flex gap-2 mb-3">
                    <span class="text-red-600 font-bold text-sm bg-red-50 px-2 py-1 rounded h-fit">Q${w.idx}</span>
                    <p class="font-bold text-gray-800 text-lg">${w.q}</p>
                </div>
                <div class="flex flex-col md:flex-row gap-4 text-sm mt-2 bg-gray-50 p-4 rounded-lg">
                    <div class="flex-1">
                        <span class="block text-gray-400 text-xs mb-1">你的答案</span>
                        <div class="flex items-start gap-2">
                            <span class="font-bold text-xl text-red-500">${w.userVal}</span>
                            <span class="text-gray-700 font-medium mt-1 leading-snug">${w.userText}</span>
                        </div>
                    </div>
                    <div class="hidden md:block w-px bg-gray-300 mx-2"></div>
                    <div class="flex-1">
                        <span class="block text-gray-400 text-xs mb-1">正確答案</span>
                        <div class="flex items-start gap-2">
                            <span class="font-bold text-green-600 text-xl">${w.ansVal}</span>
                            <span class="text-gray-800 font-bold mt-1 leading-snug">${w.ansText}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        reviewDiv.innerHTML = `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                <p class="font-bold text-yellow-800">錯題檢討 (${practiceWrongDetails.length} 題)</p>
                <p class="text-sm text-yellow-700">以下列出本次練習答錯的題目與正確答案。</p>
            </div>
            <div class="space-y-4">
                ${listHtml}
            </div>
            <div class="text-center mt-8">
                <button onclick="location.reload()" class="bg-gray-600 text-white px-8 py-3 rounded-full hover:bg-gray-700 font-bold shadow-lg transition transform hover:-translate-y-1">
                    結束練習並返回
                </button>
            </div>
        `;
    }

    container.appendChild(reviewDiv);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 錯題存取 Helper (保持不變) ---
function saveWrongQuestion(subjectCode, qObj) {
    const db = JSON.parse(localStorage.getItem('gh_wrong_questions_v1') || '{}');
    if (!db[subjectCode]) db[subjectCode] = [];
    if (!db[subjectCode].some(item => item.q === qObj.q)) {
        db[subjectCode].push(qObj);
        localStorage.setItem('gh_wrong_questions_v1', JSON.stringify(db));
    }
}
function removeWrongQuestion(subjectCode, qObj) {
    const db = JSON.parse(localStorage.getItem('gh_wrong_questions_v1') || '{}');
    if (db[subjectCode]) {
        db[subjectCode] = db[subjectCode].filter(item => item.q !== qObj.q);
        localStorage.setItem('gh_wrong_questions_v1', JSON.stringify(db));
    }
}

