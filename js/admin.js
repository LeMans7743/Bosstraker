let adminAllLogs = [];
let clicks = 0, timer;

// 秘密觸發器
document.getElementById('secret-trigger').addEventListener('click', () => {
    clicks++; clearTimeout(timer); timer = setTimeout(() => clicks=0, 800);
    if(clicks === 3) {
        Swal.fire({
            title:'管理員登入', input:'password', showCancelButton:true
        }).then(r => {
            if(r.value === 'admin') initAdmin(); 
            else if(r.value) Swal.fire('密碼錯誤', '', 'error');
        });
        clicks = 0;
    }
});

async function initAdmin() {
    document.getElementById('admin-modal').classList.remove('hidden');
    const hint = document.getElementById('admin-source-hint');
    hint.innerHTML = '<div class="loader" style="width:20px;height:20px;border-width:2px;margin:0"></div> 正在同步雲端資料...';
    
    let logs = [];
    // GOOGLE_SHEET_CSV_URL 來自 config.js
    if (GOOGLE_SHEET_CSV_URL && GOOGLE_SHEET_CSV_URL.startsWith('http')) {
        try {
            const res = await fetch(GOOGLE_SHEET_CSV_URL);
            const csvText = await res.text();
            logs = parseCSV(csvText);
            hint.innerText = "資料來源：Google 雲端試算表 (即時連線)";
            hint.classList.add("text-green-600");
        } catch (e) {
            hint.innerText = "雲端讀取失敗，顯示本機資料";
            logs = JSON.parse(localStorage.getItem('gh_admin_logs_local') || '[]');
        }
    } else {
        hint.innerText = "未設定雲端連結 (本機模式)";
        logs = JSON.parse(localStorage.getItem('gh_admin_logs_local') || '[]');
    }
    adminAllLogs = logs;
    renderAdminIPList();
}

function getNicknames() { return JSON.parse(localStorage.getItem('gh_ip_nicknames') || '{}'); }

function renderAdminIPList() {
    document.getElementById('admin-back-btn').classList.add('hidden');
    const content = document.getElementById('admin-content-area');
    const nicknames = getNicknames();
    
    const groups = {};
    adminAllLogs.forEach(l => {
        const ip = l.ip || 'Unknown';
        if (!groups[ip]) groups[ip] = { count: 0, totalScore: 0, scoreCount: 0, lastActive: l.date, device: l.device };
        groups[ip].count++;
        if (l.mode === '考卷模式' && l.result.includes('分')) {
            groups[ip].totalScore += parseInt(l.result);
            groups[ip].scoreCount++;
        }
        if (new Date(l.date) > new Date(groups[ip].lastActive)) groups[ip].lastActive = l.date;
    });

    const ipList = Object.keys(groups).sort((a,b) => new Date(groups[b].lastActive) - new Date(groups[a].lastActive));

    let html = `
        <table class="w-full text-sm text-left">
            <thead class="bg-gray-100 text-gray-600">
                <tr>
                    <th class="p-3">使用者 (暱稱/IP)</th>
                    <th class="p-3">裝置</th>
                    <th class="p-3">次數</th>
                    <th class="p-3">平均分</th>
                    <th class="p-3">最後上線</th>
                    <th class="p-3">操作</th>
                </tr>
            </thead>
            <tbody class="divide-y">
    `;
    html += ipList.map(ip => {
        const g = groups[ip];
        const avg = g.scoreCount > 0 ? Math.round(g.totalScore / g.scoreCount) + '分' : '-';
        const nick = nicknames[ip] || '';
        const displayName = nick ? `<span class="font-bold text-blue-700">${nick}</span> <span class="text-xs text-gray-400">(${ip})</span>` : `<span class="font-mono text-gray-600">${ip}</span>`;
        return `
            <tr class="hover:bg-gray-50">
                <td class="p-3">
                    ${displayName} <button onclick="editNickname('${ip}')" class="text-gray-400 hover:text-blue-500">✏️</button>
                </td>
                <td class="p-3 text-xs text-gray-500">${g.device}</td>
                <td class="p-3">${g.count}</td>
                <td class="p-3 font-bold ${avg!=='-' && parseInt(avg)>=60 ? 'text-green-600':'text-gray-500'}">${avg}</td>
                <td class="p-3 text-xs text-gray-500">${g.lastActive}</td>
                <td class="p-3">
                    <button onclick="renderAdminDetail('${ip}')" class="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">詳細</button>
                </td>
            </tr>
        `;
    }).join('');
    html += `</tbody></table>`;
    content.innerHTML = html;
}

function editNickname(ip) {
    const nicknames = getNicknames();
    Swal.fire({
        title: '設定暱稱', text: `IP: ${ip}`, input: 'text', inputValue: nicknames[ip] || '', showCancelButton: true
    }).then(r => {
        if (r.isConfirmed) {
            nicknames[ip] = r.value;
            localStorage.setItem('gh_ip_nicknames', JSON.stringify(nicknames));
            renderAdminIPList();
        }
    });
}

function renderAdminDetail(targetIp) {
    document.getElementById('admin-back-btn').classList.remove('hidden');
    const content = document.getElementById('admin-content-area');
    const nicknames = getNicknames();
    const nick = nicknames[targetIp] || targetIp;
    const userLogs = adminAllLogs.filter(l => l.ip === targetIp);

    let html = `
        <div class="mb-4 text-lg font-bold text-gray-700"><span class="text-blue-600">${nick}</span> 的紀錄</div>
        <table class="w-full text-sm text-left">
            <thead class="bg-gray-100 text-gray-600">
                <tr><th class="p-3">時間</th><th class="p-3">科目</th><th class="p-3">模式</th><th class="p-3">結果</th></tr>
            </thead>
            <tbody class="divide-y">
    `;
    html += userLogs.map(l => `
        <tr class="hover:bg-gray-50">
            <td class="p-3 text-gray-500">${l.date}</td>
            <td class="p-3 font-bold">${l.subject}</td>
            <td class="p-3 text-xs">${l.mode}</td>
            <td class="p-3 font-bold text-blue-600">${l.result}</td>
        </tr>
    `).join('');
    html += `</tbody></table>`;
    content.innerHTML = html;
}

function parseCSV(csv) {
    const lines = csv.split('\n').slice(1);
    return lines.map(line => {
        const cols = line.split(','); 
        if(cols.length < 5) return null;
        return {
            date: cols[0].replace(/"/g, ''),
            ip: cols[1]?.replace(/"/g, '') || '-',
            device: cols[2]?.replace(/"/g, '') || '-',
            subject: cols[3]?.replace(/"/g, '') || '-',
            mode: cols[4]?.replace(/"/g, '') || '-',
            result: cols[6]?.replace(/"/g, '') || '-' 
        };
    }).filter(x => x);
}

function clearLogs() {
    if(confirm('清空本機快取？')) { 
        localStorage.removeItem('gh_admin_logs_local'); 
        alert('已清空');
    }
}
