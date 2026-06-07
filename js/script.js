const weights = [0.21, 0.25, 0.28, 0.26]; 
const criteriaTypes = ['benefit', 'benefit', 'benefit', 'benefit']; 

const initialData = [
    { id: 'A1', name: 'Ruang Perkuliahan', values: [3.2, 4.2, 4.6, 4.4] },
    { id: 'A2', name: 'Jaringan Wi-Fi/Internet', values: [3.8, 4.1, 4.7, 4.2] },
    { id: 'A3', name: 'Infrastruktur Jalan', values: [3.8, 4.3, 4.5, 4.6] },
    { id: 'A4', name: 'Akses Pelayanan Akademik', values: [3.0, 4.3, 4.6, 4.2] }
];

let currentAlternatives = JSON.parse(JSON.stringify(initialData));
let dbHistory = []; 

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderInputTable();
    calculateSAW();
    fetchHistoryFromDB();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.className = "nav-btn px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700");
    document.querySelectorAll('.nav-btn-mobile').forEach(btn => btn.className = "nav-btn-mobile px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 whitespace-nowrap");
    
    document.getElementById(tabId).classList.add('active');
    
    const activeDesktopBtn = document.querySelector(`.nav-btn[data-target="${tabId}"]`);
    if (activeDesktopBtn) activeDesktopBtn.className = "nav-btn px-4 py-2 rounded-md text-sm font-medium transition-colors bg-brand-500 text-white";
    const activeMobileBtn = document.querySelector(`.nav-btn-mobile[data-target="${tabId}"]`);
    if(activeMobileBtn) activeMobileBtn.className = "nav-btn-mobile px-3 py-1 rounded-full text-xs font-medium bg-brand-500 text-white whitespace-nowrap";
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
}

function toggleTheme() {
    const htmlClasses = document.documentElement.classList;
    if (htmlClasses.contains('dark')) { htmlClasses.remove('dark'); localStorage.setItem('theme', 'light'); } 
    else { htmlClasses.add('dark'); localStorage.setItem('theme', 'dark'); }
}

function renderInputTable() {
    const tbody = document.getElementById('matrix-body');
    tbody.innerHTML = '';
    currentAlternatives.forEach((alt, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors";
        let tdHtml = `<td class="p-4 font-medium text-gray-900 dark:text-white">${alt.id} - ${alt.name}</td>`;
        alt.values.forEach((val, colIndex) => {
            tdHtml += `<td class="p-4"><input type="number" step="0.1" min="1" max="5" value="${val}" class="w-full max-w-[80px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" onchange="updateValue(${index}, ${colIndex}, this.value)"></td>`;
        });
        tr.innerHTML = tdHtml;
        tbody.appendChild(tr);
    });
}

function updateValue(altIndex, colIndex, newValue) {
    let val = parseFloat(newValue);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 5) val = 5;
    currentAlternatives[altIndex].values[colIndex] = val;
    calculateSAW();
}

function calculateSAW() {
    const maxValues = Array(4).fill(-Infinity), minValues = Array(4).fill(Infinity);
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < currentAlternatives.length; i++) {
            const val = currentAlternatives[i].values[j];
            if (val > maxValues[j]) maxValues[j] = val;
            if (val < minValues[j]) minValues[j] = val;
        }
    }
    const results = currentAlternatives.map(alt => {
        let finalScore = 0;
        for (let j = 0; j < 4; j++) {
            let normalized = criteriaTypes[j] === 'benefit' ? alt.values[j] / maxValues[j] : minValues[j] / alt.values[j];
            finalScore += normalized * weights[j];
        }
        return { name: alt.name, score: finalScore.toFixed(4) };
    });
    results.sort((a, b) => b.score - a.score);
    renderRankingTable(results);
    document.getElementById('dash-top-name').textContent = results[0].name;
    document.getElementById('dash-top-score').textContent = results[0].score;
}

function renderRankingTable(results) {
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = '';
    results.forEach((res, index) => {
        const tr = document.createElement('tr');
        tr.className = index === 0 ? "bg-brand-50/50 dark:bg-brand-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50";
        tr.innerHTML = `
            <td class="p-4 text-center"><span class="inline-flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-yellow-400 text-yellow-900 font-bold' : 'bg-gray-200 dark:bg-gray-600'}">${index + 1}</span></td>
            <td class="p-4 font-medium ${index === 0 ? 'text-brand-700 dark:text-brand-400 font-bold' : ''}">${res.name} ${index === 0 ? '<span class="ml-2 text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full dark:bg-brand-900 dark:text-brand-200">Prioritas 1</span>' : ''}</td>
            <td class="p-4 text-right font-mono font-medium">${res.score}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- FUNGSI AJAX FETCH KE PHP BACKEND ---

async function fetchHistoryFromDB() {
    try {
        const response = await fetch('api.php?action=read');
        dbHistory = await response.json();
        renderHistoryTable();
    } catch (error) { console.error("Gagal load DB", error); }
}

async function saveCalculationToDB() {
    const topName = document.getElementById('dash-top-name').textContent;
    const topScore = document.getElementById('dash-top-score').textContent;
    const now = new Date();
    const record = {
        tanggal: now.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        prioritas: topName,
        skor: topScore,
        matrix: currentAlternatives
    };

    const response = await fetch('api.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
    });
    const result = await response.json();
    
    if(result.status === 'success') {
        showToast("Perubahan berhasil diupdate!", "bg-blue-600");
        fetchHistoryFromDB();
    }
}

async function deleteHistoryDB(id) {
    if(confirm("Yakin ingin menghapus riwayat ini dari database?")) {
        const response = await fetch('api.php?action=delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        if(result.status === 'success') {
            showToast("Riwayat berhasil dihapus.", "bg-red-500");
            fetchHistoryFromDB();
        }
    }
}

function editHistoryDB(index) {
    const historyItem = dbHistory[index];
    if(historyItem && historyItem.matrix_state) {
        currentAlternatives = JSON.parse(historyItem.matrix_state);
        renderInputTable();
        calculateSAW();
        switchTab('perhitungan');
        showToast("Data dimuat untuk diedit.", "bg-blue-500");
    }
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';
    if (dbHistory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-gray-500 italic">Belum ada data di database. Lakukan kalkulasi dan klik 'Update Perubahan'.</td></tr>`;
        return;
    }
    dbHistory.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-4 text-sm">${item.tanggal}</td>
            <td class="p-4 font-medium">${item.prioritas_utama}</td>
            <td class="p-4 text-center font-mono">${item.skor}</td>
            <td class="p-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="editHistoryDB(${index})" class="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded font-medium">Edit</button>
                    <button onclick="deleteHistoryDB(${item.id})" class="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded font-medium">Hapus</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showToast(message, bgColorClass = "bg-green-500") {
    const toast = document.getElementById('save-toast');
    toast.querySelector('span').textContent = message;
    toast.querySelector('div').className = `${bgColorClass} rounded-full p-1`;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
}