// js/bank.js

let bankAllQuestions = []; // 儲存該科目所有題目

async function initBankMode() {
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

    // 切換 UI
    document.getElementById('setup-view').classList.add('hidden');
    document.getElementById('loading-spinner').classList.remove('hidden');

    try {
        // --- 讀取邏輯 (與 Home.js 相同，支援混合題庫) ---
        if (subjectCode === 'mix_mil_pol') {
            const [resMil, resPol] = await Promise.all([
                fetch('questions/military.json'),
                fetch('questions/politics.json')
            ]);
            if (!resMil.ok || !resPol.ok) throw new Error("讀取混合題庫失敗");
            const dataMil = await resMil.json();
            const dataPol = await resPol.json();
            bankAllQuestions = [...dataMil, ...dataPol];
        } else {
            const response = await fetch(`questions/${subjectCode}.json`);
            if (!response.ok) throw new Error("讀取失敗");
            bankAllQuestions = await response.json();
        }

        if (!Array.isArray(bankAllQuestions)) throw new Error("題庫格式錯誤");

        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('bank-mode-view').classList.remove('hidden');
        document.getElementById('bank-subject-title').innerText = `${currentSubjectName} - 完整題庫 (${bankAllQuestions.length}題)`;
        
        // 渲染列表
        renderBankList(bankAllQuestions);

    } catch (error) {
        console.error(error);
        Swal.fire('讀取失敗', '無法載入題庫檔案', 'error');
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('setup-view').classList.remove('hidden');
    }
}

function renderBankList(questions) {
    const container = document.getElementById('bank-list-container');
    const searchVal = document.getElementById('bank-search').value.trim().toLowerCase();

    const filtered = searchVal 
        ? questions.filter(q => q.q.toLowerCase().includes(searchVal))
        : questions;

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-400 py-10">找不到符合「${searchVal}」的題目</div>`;
        return;
    }

    // --- 新增：字體判斷 ---
    const qFontClass = (currentSubjectCode === 'english') ? "font-english" : "text-lg";
    const optFontClass = (currentSubjectCode === 'english') ? "font-english" : "";

    container.innerHTML = filtered.map((q, idx) => {
        const ansIdx = ["A","B","C","D"].indexOf(q.ans);
        
        return `
        <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
            <div class="flex gap-3 mb-2">
                <span class="text-xs font-bold text-gray-400 mt-1">#${idx + 1}</span>
                <p class="font-bold text-gray-800 leading-relaxed ${qFontClass}">${highlightText(q.q, searchVal)}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 mt-3">
                ${q.options.map((opt, i) => {
                    const label = ["A","B","C","D"][i];
                    const isAns = (label === q.ans);
                    const styleClass = isAns 
                        ? "bg-green-100 border-green-300 text-green-800 font-bold ring-1 ring-green-500" 
                        : "bg-gray-50 border-gray-100 text-gray-500";
                    
                    return `
                    <div class="flex items-center p-2 rounded border ${styleClass}">
                        <span class="w-6 h-6 flex justify-center items-center rounded-full bg-white text-xs border mr-2 shadow-sm ${isAns?'border-green-400 text-green-700':'border-gray-300'}">${label}</span>
                        <span class="${optFontClass}">${opt}</span>
                        ${isAns ? '<span class="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">正解</span>' : ''}
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    }).join('');
}


// 搜尋關鍵字高亮工具
function highlightText(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-200 text-black">$1</span>');
}

// 搜尋輸入監聽 (防抖動)
let searchTimeout;
function handleBankSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        renderBankList(bankAllQuestions);
    }, 300);
}

function exitBankMode() {
    document.getElementById('bank-mode-view').classList.add('hidden');
    document.getElementById('setup-view').classList.remove('hidden');
    document.getElementById('bank-search').value = ''; // 清空搜尋
}
