let timerInterval;

function startExamMode() {
    currentMode = 'exam';
    document.getElementById('exam-mode-view').classList.remove('hidden');
    document.getElementById('exam-info').innerText = `${currentSubjectName} (共 ${currentQuestions.length} 題)`;
    
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
    
    currentQuestions.forEach((q, idx) => {
        const ans = document.querySelector(`input[name="q_${idx}"]:checked`)?.value;
        if(ans === q.ans) correct++;
        else {
            wrongCount++;
            saveWrongQuestion(currentSubjectCode, q); // 呼叫 practice.js 中的儲存功能
        }
    });
    
    let score = Math.round(correct * (100 / currentQuestions.length));
    if(correct === currentQuestions.length) score = 100;

    saveLog('考卷模式', `${score}分`); // 呼叫 config.js
    
    Swal.fire({ 
        title: '測驗結果', 
        html: `
            <div class="text-5xl font-bold text-blue-600 mb-2">${score}分</div>
            <div class="text-gray-500 mb-2">答對 ${correct} / ${currentQuestions.length} 題</div>
            ${wrongCount > 0 ? `<div class="text-red-500 text-sm">已將 ${wrongCount} 題錯題加入複習庫</div>` : ''}
        `, 
        icon: score >= 60 ? 'success' : 'warning',
        confirmButtonText: '確定'
    }).then(() => location.reload());
}
