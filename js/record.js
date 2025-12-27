let curRecSubject = '國文';
let curRecMode = '考卷模式'; 
let userViewMode = 'list';
let userChartInstance = null;

function showUserRecords() {
    document.getElementById('user-record-modal').classList.remove('hidden');
    renderUserRecords();
}

function setUserRecMode(modeVal, el) {
    curRecMode = (modeVal === 'exam') ? '考卷模式' : '練習模式'; 
    document.querySelectorAll('.mode-switch-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    renderUserRecords();
}

function setUserRecSubject(subjCode, el) {
    const map = { 'chinese': '國文', 'english': '英文', 'politics': '政治', 'military': '軍事' };
    curRecSubject = map[subjCode];
    document.querySelectorAll('#user-rec-subject-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    renderUserRecords();
}

function switchUserView(mode) {
    userViewMode = mode;
    const btnList = document.getElementById('btn-view-list');
    const btnChart = document.getElementById('btn-view-chart');
    const divList = document.getElementById('user-view-list');
    const divChart = document.getElementById('user-view-chart');

    if (mode === 'list') {
        btnList.className = "px-3 py-1 text-xs bg-blue-100 text-blue-700 font-bold";
        btnChart.className = "px-3 py-1 text-xs text-gray-600 hover:bg-gray-100";
        divList.classList.remove('hidden');
        divChart.classList.add('hidden');
    } else {
        btnList.className = "px-3 py-1 text-xs text-gray-600 hover:bg-gray-100";
        btnChart.className = "px-3 py-1 text-xs bg-blue-100 text-blue-700 font-bold";
        divList.classList.add('hidden');
        divChart.classList.remove('hidden');
    }
    renderUserRecords();
}

function renderUserRecords() {
    const statusText = document.getElementById('rec-status-text');
    statusText.innerText = `篩選：${curRecSubject} | ${curRecMode}`;

    let logs = JSON.parse(localStorage.getItem('gh_user_history_v1') || '[]');
    logs = logs.filter(l => l.subject === curRecSubject);

    if (curRecMode === '考卷模式') {
        logs = logs.filter(l => l.mode === '考卷模式');
    } else {
        logs = logs.filter(l => l.mode === '練習模式' || l.mode === '錯題複習');
    }

    if (userViewMode === 'list') {
        const tbody = document.getElementById('user-record-body');
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-400">此科目/模式下尚無紀錄</td></tr>';
        } else {
            tbody.innerHTML = logs.map(l => `
                <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3 text-xs text-gray-500">${l.date}</td>
                    <td class="p-3 font-bold text-gray-700">${l.subject}</td>
                    <td class="p-3 font-bold text-blue-600">${l.result}</td>
                </tr>
            `).join('');
        }
    } else {
        renderUserChart(logs);
    }
}

function renderUserChart(logs) {
    const ctx = document.getElementById('userChartCanvas').getContext('2d');
    if (userChartInstance) userChartInstance.destroy();

    const chartData = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = chartData.map(l => l.date.split(' ')[0]);
    const dataPoints = chartData.map(l => {
        if (l.result.includes('分')) return parseInt(l.result);
        if (l.result.includes('/')) {
            const parts = l.result.split('/');
            return Math.round((parseInt(parts[0]) / parseInt(parts[1])) * 100);
        }
        return 0;
    });

    const labelStr = (curRecMode === '考卷模式') ? '測驗分數' : '練習正確率 (%)';

    userChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: labelStr,
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}
