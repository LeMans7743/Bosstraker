let timerInterval;

function startExamMode() {
    currentMode = 'exam';
    document.getElementById('exam-mode-view').classList.remove('hidden');
    document.getElementById('exam-info').innerText = `${currentSubjectName} (共 ${currentQuestions.length} 題)`;
    
    // 清空並隱藏檢討區
    document.getElementById('exam-questions-container').classList.remove('hidden');
    document.getElementById('exam-review-container').classList.add('hidden');
    document.getElementById('exam-submit-bar').classList.remove('hidden');

    const container = document.getElementById('exam-questions-container');
    container.innerHTML = currentQuestions.map((q, idx) => `
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
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
    clearInterval(timerInterval);
    let correct = 0;
    let wrongCount = 0;
    let wrongDetails = []; // 儲存錯題詳細資訊
    
    currentQuestions.forEach((q, idx) => {
        const userAns = document.querySelector(`input[name="q_${idx}"]:checked`)?.value;
        if(userAns === q.ans) {
            correct++;
        } else {
            wrongCount++;
            saveWrongQuestion(currentSubjectCode, q); // 存入錯題庫
            wrongDetails.push({
                q: q.q,
                user: userAns || "未作答",
                ans: q.ans,
                idx: idx + 1
            });
        }
    });
    
    let score = Math.round(correct * (100 / currentQuestions.length));
    if(correct === currentQuestions.length && currentQuestions.length > 0) score = 100;

    saveLog('考卷模式', `${score}分`); 
    
    // SweetAlert 顯示分數
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
        // 進入檢討模式
        showExamReview(wrongDetails);
    });
}

function showExamReview(wrongDetails) {
    // 隱藏題目區與交卷按鈕
    document.getElementById('exam-questions-container').classList.add('hidden');
    document.getElementById('exam-submit-bar').classList.add('hidden');
    
    // 顯示檢討區
    const reviewContainer = document.getElementById('exam-review-container');
    const reviewList = document.getElementById('exam-review-list');
    reviewContainer.classList.remove('hidden');
    
    // 渲染錯題
    if (wrongDetails.length === 0) {
        reviewList.innerHTML = `<div class="text-center text-green-600 font-bold text-xl py-10">恭喜！本次測驗沒有錯誤題目。</div>`;
    } else {
        reviewList.innerHTML = wrongDetails.map(w => `
            <div class="bg-white p-5 rounded-lg border-l-4 border-red-500 shadow-sm">
                <div class="flex gap-2 mb-2">
                    <span class="text-red-600 font-bold text-sm">Q${w.idx}</span>
                    <p class="font-bold text-gray-800">${w.q}</p>
                </div>
                <div class="flex gap-4 text-sm mt-3 bg-gray-50 p-3 rounded">
                    <div class="flex-1">
                        <span class="block text-gray-500 text-xs">你的答案</span>
                        <span class="font-bold ${w.user===w.ans ? 'text-green-600' : 'text-red-600'}">${w.user}</span>
                    </div>
                    <div class="flex-1 border-l pl-4">
                        <span class="block text-gray-500 text-xs">正確答案</span>
                        <span class="font-bold text-green-600 text-lg">${w.ans}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // 捲動到頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

