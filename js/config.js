// ==========================================
//  【雲端資料庫設定區】
// ==========================================
const GOOGLE_FORM_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLScqZn3A4HLzNL-a8_u2Y_jCYqiEnQy6Vn5Tv2Y8STrod4u9gw/formResponse";
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ28Z7fBJziaSJ5EQVCAlK_AVz8zM4KQL-8kCmiPGqjlpxuSw3pGKY0ZuVi5AHfV3WnlQzhI998yDuN/pub?output=csv";

const FORM_IDS = {
    ip:      "entry.214623373", 
    device:  "entry.1194870592",
    subject: "entry.1570979862",
    mode:    "entry.610680044",
    result:  "entry.705527857",
    date:    "entry.40424165"
};

// --- 全域變數 (Shared State) ---
let currentQuestions = [];
let currentSubjectName = ""; 
let currentSubjectCode = ""; 
let currentMode = "";
let isRetryMode = false;
let userIP = "Loading...";

// --- 總測驗模式變數 ---
let isFullExamMode = false;     
let fullExamStep = 0;           
let fullExamScores = [];        
let fullExamWrongDetails = [];  // [新增] 用來儲存三科所有錯題

const FULL_EXAM_CONFIG = [
    { code: 'chinese', name: '國文', count: 50 },
    { code: 'english', name: '英文', count: 50 },
    { code: 'mix_mil_pol', name: '軍事與政治', count: 50 }
];

fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => userIP = data.ip)
    .catch(e => userIP = "無法取得 IP");

function saveLog(modeStr, resultStr) {
    const now = new Date().toLocaleString();
    const deviceType = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "Mobile/Tablet" : "Desktop";
    
    const userLogs = JSON.parse(localStorage.getItem('gh_user_history_v1') || '[]');
    userLogs.unshift({ date: now, subject: currentSubjectName, mode: modeStr, result: resultStr });
    localStorage.setItem('gh_user_history_v1', JSON.stringify(userLogs));

    if (GOOGLE_FORM_URL && GOOGLE_FORM_URL.startsWith('http')) {
        const formData = new FormData();
        formData.append(FORM_IDS.ip, userIP);
        formData.append(FORM_IDS.device, deviceType);
        formData.append(FORM_IDS.subject, currentSubjectName);
        formData.append(FORM_IDS.mode, modeStr);
        formData.append(FORM_IDS.result, resultStr);
        formData.append(FORM_IDS.date, now);
        fetch(GOOGLE_FORM_URL, { method: 'POST', mode: 'no-cors', body: formData }).catch(console.error);
    }
}

