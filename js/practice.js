let currentQIndex = 0;
let practiceCorrectCount = 0; 

// --- 錯題複習入口 ---
function startRetryMode() {
    const subjectCode = document.getElementById('subject-select').value;
    const cards = document.querySelectorAll('.subject-card');
    cards.forEach(c => {
        if(c.classList.contains('active')) currentSubjectName = c.innerText;
    });

    const wrongDB = JSON.parse(localStorage.getItem('gh_wrong_questions_v1') || '{}');
    const wrongList = wrongDB[subjectCode] || [];

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
    
    currentQIndex = 0;
    practiceCorrectCount = 0;
    renderPracticeQ();
}

function renderPracticeQ() {
    const q = currentQuestions[currentQIndex];
    document.getElementById('practice-progress').innerText = `題目 ${currentQIndex+1} / ${currentQuestions.length}`;
    document.getElementById('practice-q-text').innerText = q.q;
    
    const optsDiv = document.getElementById('practice-options');
    optsDiv.innerHTML = '';
    document.getElementById('practice-feedback').classList.add('hidden');

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
    document.querySelectorAll('.option-card').forEach(d => d.onclick = null);
    const feedback = document.getElementById('practice-feedback');
    feedback.classList.remove('hidden');
    
    if(userAns === correctAns) {
        practiceCorrectCount++;
        el.classList.add('correct');
        feedback.innerHTML = `<div class="flex items-center text-green-700 font-bold">回答正確！</div>`;
        if(isRetryMode) removeWrongQuestion(currentSubjectCode, questionObj);
    } else {
        el.classList.add('wrong');
        feedback.innerHTML = `
            <div class="text-red-600 font-bold mb-1">回答錯誤</div>
            <div class="text-gray-600">正確答案是：<b class="text-green-600 text-lg">${correctAns}</b></div>
        `;
        const correctIdx = ["A","B","C","D"].indexOf(correctAns);
        if (correctIdx !== -1) document.getElementById('practice-options').children[correctIdx].classList.add('correct');
        saveWrongQuestion(currentSubjectCode, questionObj);
    }

    setTimeout(() => { nextPracticeQuestion(); }, 250);
}

function nextPracticeQuestion() {
    if(++currentQIndex < currentQuestions.length) {
        renderPracticeQ();
    } else {
        const label = isRetryMode ? '錯題複習' : '練習模式';
        const res = `${practiceCorrectCount}/${currentQuestions.length} 題`;
        saveLog(label, res);
        Swal.fire({
            title: '練習結束',
            html: `<div class="text-center"><h2 class="text-4xl font-bold text-blue-600">${res}</h2></div>`, 
            icon: 'success'
        }).then(() => location.reload());
    }
}

// --- 錯題存取 Helper ---
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
