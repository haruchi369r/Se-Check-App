const defaultAffirmations = [
    "今日も生きててえらい！",
    "十分がんばってるよ、無理しないでね。",
    "深呼吸して、肩の力を抜こう。",
    "あなたのペースで大丈夫。",
    "休むことも仕事のうちだよ。",
    "完璧じゃなくていいんだよ。",
    "まずは温かい飲み物でも飲もう。",
    "自分の感覚を信じてね。",
    "今日は80%の力でいこう。",
    "あなたは愛される価値がある人です。",
    "眉間のしわ、緩んでる？",
    "空を見上げるといいことあるかも。",
    "大丈夫、なんとかなるよ。"
];

const checkItems = [
    { id: 'head', label: '🧠 頭のすっきり度', minLabel: 'モヤモヤ', maxLabel: 'スッキリ' },
    { id: 'brows', label: '😖 眉間の力', minLabel: 'ガチガチ', maxLabel: 'ゆるゆる' },
    { id: 'shoulders', label: '🗿 肩の凝り', minLabel: 'バキバキ', maxLabel: '軽い' },
    { id: 'back', label: '🪵 腰の具合', minLabel: '痛い', maxLabel: '良い' },
    { id: 'legs', label: '🦶 足の痛み・疲れ', minLabel: '痛い・重い', maxLabel: '軽い' },
    { id: 'fatigue', label: '🔋 だるさ', minLabel: 'だるい', maxLabel: '元気' },
    { id: 'sleepiness', label: '🥱 眠気', minLabel: '眠い', maxLabel: '覚めてる' }
];

// ランクシステムの定義 (Phase 5)
const ranks = [
    { name: "見習い冒険者", minExp: 0 },
    { name: "駆け出しの旅人", minExp: 50 },
    { name: "街の守り手", minExp: 150 },
    { name: "熟練の戦士", minExp: 300 },
    { name: "森の賢者", minExp: 500 },
    { name: "王国の英雄", minExp: 800 },
    { name: "伝説の勇者", minExp: 1200 },
    { name: "神話の守護者", minExp: 2000 }
];

let weatherData = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    showRandomAffirmation();
    loadCustomGoal();
    renderSettingsToggles();
    renderSliders();
    loadFullHistory();
    loadTrainingHistory(); // 修練履歴
    updateRankDisplay();   // ランク表示更新
    renderChart();

    const refreshBtn = document.getElementById('refresh-affirmation');
    if (refreshBtn) refreshBtn.addEventListener('click', showRandomAffirmation);
});

// --- 0. ランク & 経験値システム (Phase 5) ---
function getExp() {
    return Number(localStorage.getItem('seCheckExp')) || 0;
}

function addExp(amount) {
    const currentExp = getExp();
    const newExp = currentExp + amount;
    localStorage.setItem('seCheckExp', newExp);
    updateRankDisplay();

    // レベルアップしたかチェック (簡易)
    const oldRank = getRankInfo(currentExp);
    const newRank = getRankInfo(newExp);
    if (newRank.minExp > oldRank.minExp) {
        alert(`🎉 レベルアップ！\n「${newRank.name}」になりました！`);
    }
}

function getRankInfo(exp) {
    // 現在の経験値以下のランクの中で、一番高いものを返す
    return ranks.slice().reverse().find(r => exp >= r.minExp) || ranks[0];
}

function getNextRankInfo(exp) {
    return ranks.find(r => r.minExp > exp);
}

function updateRankDisplay() {
    const exp = getExp();
    const currentRank = getRankInfo(exp);
    const nextRank = getNextRankInfo(exp);

    document.getElementById('rank-name').textContent = currentRank.name;

    // レベル表記の代わりに、次のランクまでの進捗を表示
    const elLevel = document.getElementById('rank-level');
    const elBar = document.getElementById('exp-bar-fill');

    if (nextRank) {
        // 次のランクまでの進捗率
        // (現在 - 現在ランク開始) / (次ランク開始 - 現在ランク開始)
        const range = nextRank.minExp - currentRank.minExp;
        const progress = exp - currentRank.minExp;
        const percentage = Math.min(100, Math.floor((progress / range) * 100));

        elLevel.textContent = `Exp: ${exp} / ${nextRank.minExp}`;
        elBar.style.width = `${percentage}%`;
    } else {
        elLevel.textContent = `Exp: ${exp} (MAX)`;
        elBar.style.width = '100%';
    }
}


// --- 1. テーマ機能 ---
function initTheme() {
    const savedTheme = localStorage.getItem('seCheckTheme') || 'forest';
    setTheme(savedTheme);
}

function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('seCheckTheme', themeName);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(themeName)) btn.classList.add('active');
    });
    renderChart();
}

// --- 2. タブ機能 ---
function initTabs() {
    switchTab('home');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });
    const btn = Array.from(document.querySelectorAll('.nav-item')).find(b => b.onclick.toString().includes(tabId));
    if (btn) btn.classList.add('active');

    if (tabId === 'log') {
        renderChart();
        loadFullHistory();
    }
    if (tabId === 'training') {
        loadTrainingHistory();
    }
}

// --- 3. アファメーション ---
function showRandomAffirmation() {
    const textElement = document.getElementById('affirmation-text');
    if (!textElement) return;
    const randomIndex = Math.floor(Math.random() * defaultAffirmations.length);
    textElement.style.opacity = 0;
    setTimeout(() => {
        textElement.textContent = defaultAffirmations[randomIndex];
        textElement.style.opacity = 1;
    }, 200);
}

function saveGoal(text) {
    localStorage.setItem('seCheckGoal', text);
}

function loadCustomGoal() {
    const savedGoal = localStorage.getItem('seCheckGoal');
    if (savedGoal) document.getElementById('custom-goal').value = savedGoal;
}

// --- 4. 天気機能 ---
async function getWeather() {
    const btn = document.getElementById('weather-btn');
    const adviceBox = document.getElementById('weather-advice');

    btn.textContent = "📍 取得中...";
    adviceBox.classList.remove('show');

    if (!navigator.geolocation) {
        btn.textContent = "❌ 位置情報不可";
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        btn.textContent = "🌤 問い合わせ中...";

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&hourly=pressure_msl&timezone=auto`;
            const response = await fetch(url);
            const data = await response.json();

            const current = data.current_weather;
            const temp = current.temperature;
            const weatherCode = current.weathercode;
            const todayMax = data.daily.temperature_2m_max[0];
            const todayMin = data.daily.temperature_2m_min[0];
            const currentHourIndex = new Date().getHours();
            const pressure = data.hourly.pressure_msl[currentHourIndex];

            // 天気コード
            let weatherIcon = "🌤";
            let weatherStr = "不明";
            if (weatherCode === 0) { weatherStr = "快晴"; weatherIcon = "☀️"; }
            else if (weatherCode <= 3) { weatherStr = "晴/曇"; weatherIcon = "🌥"; }
            else if (weatherCode <= 48) { weatherStr = "霧"; weatherIcon = "🌫"; }
            else if (weatherCode <= 67) { weatherStr = "雨"; weatherIcon = "☔️"; }
            else if (weatherCode <= 77) { weatherStr = "雪"; weatherIcon = "☃️"; }
            else { weatherStr = "荒天"; weatherIcon = "⛈"; }

            document.querySelector('.weather-icon').textContent = weatherIcon;
            document.querySelector('.weather-temp').textContent = `${temp}℃`;
            document.getElementById('weather-high-low').textContent = `${todayMax}℃ / ${todayMin}℃`;
            document.getElementById('weather-pressure').textContent = `${pressure} hPa`;

            btn.textContent = `✅ ${weatherStr}`;

            weatherData = { temp, condition: weatherStr, pressure };
            generateWeatherAdvice(temp, pressure, weatherCode);

        } catch (error) {
            btn.textContent = "❌ 失敗";
            console.error(error);
        }
    }, () => {
        btn.textContent = "❌ 許可必要";
    });
}

function generateWeatherAdvice(temp, pressure, code) {
    const box = document.getElementById('weather-advice');
    let messages = [];

    if (pressure < 1005) messages.push("⚠️ 気圧が低め。頭痛等の不調に注意してね。");
    if (temp < 10) messages.push("🧤 寒いです！温かくして過ごしてね。");
    if (code >= 51) messages.push("☔️ 雨や雪かも。足元に気をつけて。");

    if (messages.length > 0) {
        box.innerHTML = messages.join("<br>");
        box.classList.add('show');
    }
}

// --- 5. 設定 & スライダー ---
function getVisibleSettings() {
    const saved = localStorage.getItem('seCheckSettings');
    return saved ? JSON.parse(saved) : {};
}

function renderSettingsToggles() {
    const container = document.getElementById('settings-toggles');
    const settings = getVisibleSettings();
    const currentSettings = {};
    checkItems.forEach(item => { currentSettings[item.id] = (settings[item.id] !== false); });

    container.innerHTML = '';
    checkItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'toggle-item';
        div.innerHTML = `
            <label for="toggle-${item.id}">${item.label}</label>
            <input type="checkbox" id="toggle-${item.id}" ${currentSettings[item.id] ? 'checked' : ''} onchange="updateSetting('${item.id}', this.checked)">
        `;
        container.appendChild(div);
    });
}

function updateSetting(id, isChecked) {
    const settings = getVisibleSettings();
    settings[id] = isChecked;
    localStorage.setItem('seCheckSettings', JSON.stringify(settings));
    renderSliders();
}

function renderSliders() {
    const container = document.getElementById('sliders-container');
    const settings = getVisibleSettings();
    container.innerHTML = '';

    checkItems.forEach(item => {
        if (settings[item.id] === false) return;
        const div = document.createElement('div');
        div.className = 'slider-group';
        div.innerHTML = `
            <label>${item.label}</label>
            <input type="range" id="${item.id}" min="1" max="5" value="3" class="slider">
            <div class="slider-labels"><span>${item.minLabel}</span><span>${item.maxLabel}</span></div>
        `;
        container.appendChild(div);
    });
}

// --- 6. 記録保存 (体調) ---
function saveLog() {
    const settings = getVisibleSettings();
    const scores = {};

    checkItems.forEach(item => {
        if (settings[item.id] !== false) {
            const el = document.getElementById(item.id);
            if (el) scores[item.id] = Number(el.value);
        }
    });

    const values = Object.values(scores);
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;

    const logItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scores: scores,
        average: avg,
        memo: document.getElementById('memo').value,
        weather: weatherData
    };

    let history = JSON.parse(localStorage.getItem('seCheckHistoryV2')) || [];
    history.unshift(logItem);
    localStorage.setItem('seCheckHistoryV2', JSON.stringify(history));

    // 経験値付与 (記録ボーナス 10Exp)
    addExp(10);

    alert('記録しました！ (+10 Exp)');
    document.getElementById('memo').value = '';
}

// --- 7. 修練保存 (Phase 5) ---
function saveTraining() {
    // 値取得
    const steps = document.getElementById('step-count').value;
    const items = [];
    if (document.getElementById('tr-taiki').checked) items.push('太気拳');
    if (document.getElementById('tr-kihon').checked) items.push('基本功');
    if (document.getElementById('tr-kick').checked) items.push('蹴り');
    if (document.getElementById('tr-karate-basic').checked) items.push('空手基本');

    const kata = document.getElementById('tr-kata').value;

    // 空振りチェック
    if (!steps && items.length === 0 && !kata) {
        alert("何か入力してください");
        return;
    }

    const trainingLog = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: steps ? Number(steps) : 0,
        items: items,
        kata: kata
    };

    let history = JSON.parse(localStorage.getItem('seCheckTraining')) || [];
    history.unshift(trainingLog);
    localStorage.setItem('seCheckTraining', JSON.stringify(history));

    // 経験値計算 (適当な重み付け)
    let gainedExp = 0;
    if (steps) gainedExp += Math.floor(steps / 100); // 100歩で1Exp
    gainedExp += items.length * 10; // チェック1つで10Exp
    if (kata) gainedExp += 20; // 型稽古で20Exp

    addExp(gainedExp);

    alert(`修練お疲れ様！ (+${gainedExp} Exp)`);

    // フォームリセット
    document.getElementById('training-form').reset();
    loadTrainingHistory();
}

function loadTrainingHistory() {
    let history = JSON.parse(localStorage.getItem('seCheckTraining')) || [];
    const list = document.getElementById('training-history-list');
    if (!list) return;

    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<li style="text-align:center;color:#aaa;">修練の記録はまだありません</li>';
        return;
    }

    history.slice(0, 10).forEach(item => {
        const li = document.createElement('li');

        let content = [];
        if (item.steps > 0) content.push(`🐾 ${item.steps}歩`);
        if (item.items.length > 0) content.push(`✅ ${item.items.join(', ')}`);
        if (item.kata) content.push(`🥋 ${item.kata}`);

        li.innerHTML = `
            <div class="log-header">
                <span>📅 ${item.date} ${item.time}</span>
            </div>
            <div class="log-main">
                ${content.join('<br>')}
            </div>
        `;
        list.appendChild(li);
    });
}


// --- 8. 履歴表示 (ログタブ) ---
function loadFullHistory() {
    let history = JSON.parse(localStorage.getItem('seCheckHistoryV2')) || [];
    const list = document.getElementById('history-list-full');
    if (!list) return;

    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<li style="text-align:center;color:#aaa;">記録はまだありません</li>';
        return;
    }

    history.slice(0, 20).forEach(item => {
        const li = document.createElement('li');
        let weatherInfo = '';
        if (item.weather && item.weather.condition) {
            weatherInfo = `<span style="margin-left:5px; font-size:0.8rem;">(🌤 ${item.weather.condition})</span>`;
        }
        li.innerHTML = `
            <div class="log-header">
                <span>📅 ${item.date} ${item.time}</span>
                <span>平均: <b>${item.average}</b></span>
            </div>
            <div class="log-main">
                ${item.memo ? item.memo : '<span style="color:#ccc;">memoなし</span>'}
            </div>
            <div class="log-extra">
                詳細スコアあり ${weatherInfo}
            </div>
        `;
        list.appendChild(li);
    });
}

function clearHistory() {
    if (confirm('全ての体調記録・修練記録・経験値を消しますか？\n(注意: レベルもリセットされます)')) {
        localStorage.removeItem('seCheckHistoryV2');
        localStorage.removeItem('seCheckTraining');
        localStorage.removeItem('seCheckExp');
        location.reload();
    }
}

// --- 9. グラフ ---
let myChart = null;

function renderChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;

    const theme = document.body.getAttribute('data-theme') || 'forest';
    const isFantasy = (theme === 'fantasy');

    const colorMain = isFantasy ? '#c5a059' : '#4a7c59';
    const colorSub = isFantasy ? '#a09885' : '#ffafcc';
    const colorGrid = isFantasy ? '#444' : '#e5e5e5';
    const colorText = isFantasy ? '#e0d8c0' : '#666';

    let history = JSON.parse(localStorage.getItem('seCheckHistoryV2')) || [];
    const sortedData = [...history].reverse().slice(-7);

    const labels = sortedData.map(item => item.date.slice(5) + ' ' + item.time);
    const avgPoints = sortedData.map(item => item.average);
    const browsPoints = sortedData.map(item => item.scores && item.scores.brows ? item.scores.brows : null);

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '平均スコア',
                    data: avgPoints,
                    borderColor: colorMain,
                    backgroundColor: isFantasy ? 'rgba(197, 160, 89, 0.1)' : 'rgba(74, 124, 89, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: '眉間のゆるみ',
                    data: browsPoints,
                    borderColor: colorSub,
                    borderDash: [5, 5],
                    tension: 0.3,
                    fill: false,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 1, max: 5,
                    ticks: { stepSize: 1, color: colorText },
                    grid: { color: colorGrid }
                },
                x: {
                    ticks: { color: colorText },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: colorText }
                }
            }
        }
    });
}
