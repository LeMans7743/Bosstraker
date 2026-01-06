let timerInterval;

function startExamMode() {
    currentMode = 'exam';
    document.getElementById('exam-mode-view').classList.remove('hidden');
    
    // 如果是總測驗，顯示進度
    let title = currentSubjectName;
    if (isFullExamMode) {
        title = `【總測驗 ${fullExamStep + 1}/3】${currentSubjectName}`;
    }
    document.getElementById('exam-info').innerText = `${title} (共 ${currentQuestions.length} 題)`;
    
    // 清空並隱藏檢討區，顯示題目區
    document.getElementById('exam-questions-container').classList.remove('hidden');
    document.getElementById('exam-review-container').classList.add('hidden');
    document.getElementById('exam-submit-bar').classList.remove('hidden');

    const container = document.getElementById('exam-questions-container');
    container.innerHTML = currentQuestions.map((q, idx) => `
        <div id="q-card-${idx}" class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
            <div class="flex gap-2 mb-3">
                <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded h-fit">Q${idx+1}</span>
                <p class="font-bold text-lg text-gray-800 leading-relaxed">${q.q}</p>
            </div>
            <div class="space-y-2 pl-2">
                ${q.options.map((opt, i) => {
                    const val = ["A","B","C","D"][i];
                    return `
                    <label class="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer group">
                        <input type="radio" name="q_${idx}" value="${val}" class="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500">
                        <span class="text-gray-600 group-hover:text-gray-900 transition">${opt}</span>
                    </label>`;
                }).join('')}
            </div>
        </div>
    `).join('');

    let sec = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        sec++;
        const min = String(Math.floor(sec/60)).padStart(2,'0');
        const s = String(sec%60).padStart(2,'0');
        document.getElementById('exam-timer').innerText = `${min}:${s}`;
    }, 1000);
}

function submitExam() {
    // 1. 檢查是否有未作答題目
    for (let i = 0; i < currentQuestions.length; i++) {
        const selected = document.querySelector(`input[name="q_${i}"]:checked`);
        if (!selected) {
            Swal.fire({
                title: '還有題目沒寫喔！',
                text: `第 ${i + 1} 題尚未作答`,
                icon: 'warning',
                confirmButtonText: '前往作答'
            }).then(() => {
                // 捲動到該題目
                const card = document.getElementById(`q-card-${i}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('ring-2', 'ring-red-500', 'ring-offset-2'); // 加入視覺提示
                    setTimeout(() => card.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2'), 2000);
                }
            });
            return; // 中斷交卷流程
        }
    }

    clearInterval(timerInterval);
    let correct = 0;
    let wrongCount = 0;
    let wrongDetails = []; 
    const valMap = { "A": 0, "B": 1, "C": 2, "D": 3 };

    currentQuestions.forEach((q, idx) => {
        const userAns = document.querySelector(`input[name="q_${idx}"]:checked`)?.value;
        if(userAns === q.ans) {
            correct++;
        } else {
            wrongCount++;
            saveWrongQuestion(currentSubjectCode, q); 
            const correctText = q.options[valMap[q.ans]] || "解析錯誤";
            let userText = "未作答";
            if (userAns && valMap[userAns] !== undefined) userText = q.options[valMap[userAns]];

            wrongDetails.push({
                q: q.q,
                userVal: userAns || "-",
                userText: userText,
                ansVal: q.ans,
                ansText: correctText,
                idx: idx + 1
            });
        }
    });
    
    let score = Math.round(correct * (100 / currentQuestions.length));
    if(correct === currentQuestions.length && currentQuestions.length > 0) score = 100;

    // --- 總測驗模式的分歧邏輯 ---
    if (isFullExamMode) {
        // 儲存當前科目成績
        fullExamScores.push({
            subject: currentSubjectName,
            score: score,
            correct: correct,
            total: currentQuestions.length
        });

        // 紀錄 Log
        saveLog('總測驗模式', `${currentSubjectName}:${score}分`);

        if (fullExamStep < 2) {
            // 還沒考完 (Step 0 or 1)
            Swal.fire({
                title: `${currentSubjectName} 考卷已送出`,
                text: '準備進入下一科考試',
                icon: 'success',
                confirmButtonText: '開始下一科',
                allowOutsideClick: false
            }).then(() => {
                fullExamStep++;
                loadFullExamStep(); // 載入下一科 (在 home.js)
            });
        } else {
            // 全部考完 (Step 2)
            showFullExamSummary();
        }
        return; // 結束 submitExam，不顯示單科結算
    }

    // --- 原本的單科結算邏輯 ---
    saveLog('考卷模式', `${score}分`); 
    
    Swal.fire({ 
        title: '測驗結束', 
        html: `
            <div class="text-5xl font-bold text-blue-600 mb-2">${score}分</div>
            <div class="text-gray-500 mb-2">答對 ${correct} / ${currentQuestions.length} 題</div>
            ${wrongCount > 0 ? `<div class="text-red-500 text-sm mt-2">下方已顯示錯誤題目與正解</div>` : '<div class="text-green-600 font-bold mt-2">太強了！全對！</div>'}
        `, 
        icon: score >= 60 ? 'success' : 'warning',
        confirmButtonText: '查看結果'
    }).then(() => {
        showExamReview(wrongDetails);
    });
}

// 顯示總測驗成績單
function showFullExamSummary() {
    document.getElementById('exam-mode-view').classList.add('hidden');
    
    const totalScore = Math.round(fullExamScores.reduce((sum, item) => sum + item.score, 0) / 3);
    
    let tableHtml = fullExamScores.map(s => `
        <tr class="border-b">
            <td class="p-3">${s.subject}</td>
            <td class="p-3 text-right">${s.correct}/${s.total}</td>
            <td class="p-3 text-right font-bold ${s.score>=60?'text-green-600':'text-red-600'}">${s.score}</td>
        </tr>
    `).join('');

    // 總分紀錄 Log
    saveLog('總測驗(平均)', `${totalScore}分`);

    Swal.fire({
        title: '總測驗完成',
        html: `
            <div class="mb-4">
                <div class="text-6xl font-bold text-purple-600 mb-2">${totalScore}</div>
                <div class="text-gray-500 text-sm">平均分數</div>
            </div>
            <table class="w-full text-left text-sm mb-4">
                <thead class="bg-gray-100 text-gray-600">
                    <tr><th class="p-3">科目</th><th class="p-3 text-right">答對</th><th class="p-3 text-right">分數</th></tr>
                </thead>
                <tbody>${tableHtml}</tbody>
            </table>
        `,
        icon: 'success',
        confirmButtonText: '回首頁',
        allowOutsideClick: false
    }).then(() => {
        location.reload();
    });
}

function showExamReview(wrongDetails) {
    document.getElementById('exam-questions-container').classList.add('hidden');
    document.getElementById('exam-submit-bar').classList.add('hidden');
    
    const reviewContainer = document.getElementById('exam-review-container');
    const reviewList = document.getElementById('exam-review-list');
    reviewContainer.classList.remove('hidden');
    
    if (wrongDetails.length === 0) {
        reviewList.innerHTML = `<div class="text-center text-green-600 font-bold text-xl py-10">恭喜！本次測驗沒有錯誤題目。</div>`;
    } else {
        reviewList.innerHTML = wrongDetails.map(w => `
            <div class="bg-white p-5 rounded-lg border-l-4 border-red-500 shadow-sm">
                <div class="flex gap-2 mb-3">
                    <span class="text-red-600 font-bold text-sm bg-red-50 px-2 py-1 rounded h-fit">Q${w.idx}</span>
                    <p class="font-bold text-gray-800 text-lg">${w.q}</p>
                </div>
                <div class="flex flex-col md:flex-row gap-4 text-sm mt-2 bg-gray-50 p-4 rounded-lg">
                    <div class="flex-1">
                        <span class="block text-gray-400 text-xs mb-1">你的答案</span>
                        <div class="flex items-start gap-2">
                            <span class="font-bold text-xl ${w.userVal===w.ansVal ? 'text-green-600' : 'text-red-500'}">${w.userVal}</span>
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
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

