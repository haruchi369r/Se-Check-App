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

// Phase 6: ステータス設定 (修正済み: typo修正)
const staminaLevels = [0, 50, 150, 300, 500, 800, 1200, 2000];
const controlLevels = [0, 50, 150, 300, 500, 800, 1200, 2000];

let weatherData = null;
let currentMode = 'morning'; // 'morning' or 'night'
let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    showRandomAffirmation();
    loadCustomGoal();
    renderSettingsToggles();
    renderSliders();

    // データ読み込み (今日の日付で初期化)
    loadDailyLogV3();
    loadTrainingHistoryV3();

    updateStatusDisplay(); // ステータスバー更新
    renderChart();

    const refreshBtn = document.getElementById('refresh-affirmation');
    if (refreshBtn) refreshBtn.addEventListener('click', showRandomAffirmation);
});

// --- Phase 6: 朝夜切り替え ---
function switchMode(mode) {
    currentMode = mode;

    // ボタンの見た目
    document.getElementById('mode-morning').classList.toggle('active', mode === 'morning');
    document.getElementById('mode-night').classList.toggle('active', mode === 'night');

    // フォームの出し分け
    const mornInputs = document.getElementById('morning-inputs');
    const nightInputs = document.getElementById('night-inputs');

    if (mode === 'morning') {
        mornInputs.style.display = 'block';
        nightInputs.style.display = 'none';
        document.getElementById('input-title').textContent = "今の体の声を聞こう";
    } else {
        mornInputs.style.display = 'none';
        nightInputs.style.display = 'block';
        document.getElementById('input-title').textContent = "今日を振り返ろう";
    }
}

// --- Phase 6: ステータス管理 (修正済み) ---
function getStatus() {
    return JSON.parse(localStorage.getItem('seCheckStatus')) || { stamina: 0, control: 0 };
}

function addStatus(type, amount) {
    const status = getStatus();
    status[type] += amount;
    localStorage.setItem('seCheckStatus', JSON.stringify(status));
    updateStatusDisplay();
}

function getLevel(exp, table) {
    // レベル計算 (Lv.1スタート)
    let lvl = 1;
    for (let i = 0; i < table.length; i++) {
        if (exp >= table[i]) lvl = i + 1;
        else break;
    }
    return lvl;
}

function updateStatusDisplay() {
    const s = getStatus();
    const stLvl = getLevel(s.stamina, staminaLevels);
    const ctLvl = getLevel(s.control, controlLevels);

    // レベル表示
    document.getElementById('stamina-lvl').textContent = `Lv.${stLvl}`;
    document.getElementById('control-lvl').textContent = `Lv.${ctLvl}`;

    // バー更新 (次のレベルまで)
    const stNext = staminaLevels[stLvl] || (staminaLevels[stLvl - 1] * 1.5); // 修正: typo fix
    const stPrev = staminaLevels[stLvl - 1];
    const stRange = stNext - stPrev;
    const stProg = s.stamina - stPrev;
    const stPct = Math.min(100, Math.max(0, (stProg / stRange) * 100));

    const ctNext = controlLevels[ctLvl] || (controlLevels[ctLvl - 1] * 1.5);
    const ctPrev = controlLevels[ctLvl - 1];
    const ctRange = ctNext - ctPrev;
    const ctProg = s.control - ctPrev;
    const ctPct = Math.min(100, Math.max(0, (ctProg / ctRange) * 100));

    document.getElementById('stamina-bar').style.width = `${stPct}%`;
    document.getElementById('control-bar').style.width = `${ctPct}%`;

    // 今日のポイント表示
    const today = new Date().toLocaleDateString();
    const daily = JSON.parse(localStorage.getItem(`seCheckDaily_${today}`)) || { stamina_gained: 0, control_gained: 0 };
    document.getElementById('daily-points').textContent = `今日: ❤️ ${daily.stamina_gained || 0}/10  🛡️ ${daily.control_gained || 0}/10`;
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
        loadTrainingHistoryV3();
    }
}

// --- 3. アファメーション ---
function showRandomAffirmation() {
    const textElement = document.getElementById('affirmation-text');
    if (!textElement) return;
    const randomIndex = Math.floor(Math.random() * defaultAffirmations.length);
    textElement.textContent = defaultAffirmations[randomIndex];
}

function saveGoal(text) { localStorage.setItem('seCheckGoal', text); }
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
            const pressure = data.hourly.pressure_msl[new Date().getHours()] || 1013;

            // 天気コード簡易変換
            let weatherStr = "不明";
            if (weatherCode === 0) weatherStr = "快晴";
            else if (weatherCode <= 3) weatherStr = "晴/曇";
            else if (weatherCode <= 48) weatherStr = "霧";
            else if (weatherCode <= 67) weatherStr = "雨";
            else if (weatherCode <= 77) weatherStr = "雪";
            else weatherStr = "荒天";

            document.querySelector('.weather-icon').textContent = (weatherCode <= 3 ? "🌤" : "☔️");
            document.querySelector('.weather-temp').textContent = `${temp}℃`;
            document.getElementById('weather-high-low').textContent = `${data.daily.temperature_2m_max[0]}℃ / ${data.daily.temperature_2m_min[0]}℃`;
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
    if (pressure < 1005) messages.push("⚠️ 気圧が低め。頭痛等の不調に注意。");
    if (temp < 10) messages.push("🧤 寒いので温かくしてね。");
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

// --- Phase 6: 日次データ保存 & 読み込み (V3) ---
function getTodayKey() { return new Date().toLocaleDateString(); }

function loadDailyLogV3() {
    const key = `seCheckDaily_${getTodayKey()}`;
    const todayData = JSON.parse(localStorage.getItem(key)) || { morning: {}, night: {} };

    // 朝データの復元
    if (todayData.morning && todayData.morning.scores) {
        Object.keys(todayData.morning.scores).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = todayData.morning.scores[id];
        });
        if (todayData.morning.memo) document.getElementById('memo').value = todayData.morning.memo;
    }

    // 夜データの復元 (Phase 7: stomach, motivation追加)
    if (todayData.night) {
        if (todayData.night.event) document.getElementById('night-event').value = todayData.night.event;
        if (todayData.night.bodyTired) document.getElementById('night-body-tired').value = todayData.night.bodyTired;
        if (todayData.night.mentalTired) document.getElementById('night-mental-tired').value = todayData.night.mentalTired;

        // 新項目
        if (todayData.night.stomach) document.getElementById('night-stomach').value = todayData.night.stomach;
        if (todayData.night.motivation) document.getElementById('night-motivation').value = todayData.night.motivation;

        if (todayData.night.positiveTags) {
            todayData.night.positiveTags.forEach(tag => {
                const el = document.getElementById(`tag-${tag}`);
                if (el) el.checked = true;
            });
        }
        if (todayData.night.positiveMemo) document.getElementById('night-positive-memo').value = todayData.night.positiveMemo;
        // 共通メモは最新を採用
        if (todayData.night.memo) document.getElementById('memo').value = todayData.night.memo;
    }
}

function saveDailyLog() {
    const key = `seCheckDaily_${getTodayKey()}`;
    let todayData = JSON.parse(localStorage.getItem(key)) || { morning: {}, night: {}, control_gained: 0 };

    // ポイント計算 (管理力: 朝+5, 夜+5, 上限10)
    let addedPoints = 0;

    // 共通メモ
    const commonMemo = document.getElementById('memo').value;

    if (currentMode === 'morning') {
        const settings = getVisibleSettings();
        const scores = {};
        checkItems.forEach(item => {
            if (settings[item.id] !== false) {
                const el = document.getElementById(item.id);
                if (el) scores[item.id] = Number(el.value);
            }
        });

        todayData.morning = {
            scores: scores,
            memo: commonMemo,
            weather: weatherData
        };

        // ポイント付与 (朝の分 5pt - 既に付与済みなら0)
        if (!todayData.morning_recorded) {
            const gain = Math.min(5, 10 - (todayData.control_gained || 0));
            if (gain > 0) {
                addStatus('control', gain);
                todayData.control_gained = (todayData.control_gained || 0) + gain;
            }
            todayData.morning_recorded = true;
            alert(`朝の記録を保存しました！ (+${gain} 管理pt)`);
        } else {
            alert('朝の記録を更新しました！');
        }

    } else { // Night
        const tags = [];
        if (document.getElementById('tag-fun').checked) tags.push('fun');
        if (document.getElementById('tag-moved').checked) tags.push('moved');
        if (document.getElementById('tag-growth').checked) tags.push('growth');

        todayData.night = {
            event: document.getElementById('night-event').value,
            bodyTired: Number(document.getElementById('night-body-tired').value),
            mentalTired: Number(document.getElementById('night-mental-tired').value),
            stomach: Number(document.getElementById('night-stomach').value), // New
            motivation: Number(document.getElementById('night-motivation').value), // New
            positiveTags: tags,
            positiveMemo: document.getElementById('night-positive-memo').value,
            memo: commonMemo
        };

        // ポイント付与 (夜の分 5pt)
        if (!todayData.night_recorded) {
            const gain = Math.min(5, 10 - (todayData.control_gained || 0));
            if (gain > 0) {
                addStatus('control', gain);
                todayData.control_gained = (todayData.control_gained || 0) + gain;
            }
            todayData.night_recorded = true;
            alert(`夜の記録を保存しました！ (+${gain} 管理pt)`);
        } else {
            alert('夜の記録を更新しました！');
        }
    }

    localStorage.setItem(key, JSON.stringify(todayData));
    updateStatusDisplay();
    loadFullHistory(); // 履歴更新
}

// --- Phase 6: 修練保存 (V3) ---
function loadTrainingHistoryV3() {
    // 簡易的に従来のリスト表示を使う
    loadTrainingHistory();
}

function saveTraining() {
    const key = `seCheckDaily_${getTodayKey()}`;
    let todayData = JSON.parse(localStorage.getItem(key)) || { stamina_gained: 0 };

    // ポイント計算 (体力: 上限10)
    // 今回の獲得予定
    const steps = document.getElementById('step-count').value ? Number(document.getElementById('step-count').value) : 0;
    const items = [];
    if (document.getElementById('tr-taiki').checked) items.push('太気拳');
    if (document.getElementById('tr-kihon').checked) items.push('基本功');
    if (document.getElementById('tr-kick').checked) items.push('蹴り');
    if (document.getElementById('tr-karate-basic').checked) items.push('空手基本');
    const kata = document.getElementById('tr-kata').value;

    if (!steps && items.length === 0 && !kata) {
        alert("何か入力してください");
        return;
    }

    // ポイント計算: 項目ごと2pt
    let potentialGain = 0;
    if (steps >= 1000) potentialGain += 2; // 簡易: 1000歩以上なら2pt
    potentialGain += items.length * 2;
    if (kata) potentialGain += 2;

    // 今日の上限チェック
    const currentGain = todayData.stamina_gained || 0;
    const realGain = Math.min(potentialGain, 10 - currentGain);

    if (realGain > 0) {
        addStatus('stamina', realGain);
        todayData.stamina_gained = currentGain + realGain;
    }

    // ログ保存 (上書きではなくリスト追加のままにするか、日次データにするか。
    // 要望では修正可能にしたいとのことだが、修練は複数回やるかもしれないのでリストのままが安全。
    // ただしポイントはキャップする)

    // 従来のリスト保存
    const trainingLog = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: steps,
        items: items,
        kata: kata,
        gain: realGain
    };
    let history = JSON.parse(localStorage.getItem('seCheckTraining')) || [];
    history.unshift(trainingLog);
    localStorage.setItem('seCheckTraining', JSON.stringify(history));

    // 日次ステータス管理用保存
    localStorage.setItem(key, JSON.stringify(todayData));

    alert(`修練記録！ (+${realGain} 体力pt)\n(今日: ${todayData.stamina_gained}/10)`);
    document.getElementById('training-form').reset();
    loadTrainingHistoryV3();
    updateStatusDisplay();
}

// 従来の履歴表示 (Training)
function loadTrainingHistory() {
    let history = JSON.parse(localStorage.getItem('seCheckTraining')) || [];
    const list = document.getElementById('training-history-list');
    if (!list) return;
    list.innerHTML = '';

    const todayStr = new Date().toLocaleDateString();

    history.slice(0, 10).forEach(item => {
        const li = document.createElement('li');
        let content = [];
        if (item.steps > 0) content.push(`🐾 ${item.steps}歩`);
        if (item.items.length > 0) content.push(`✅ ${item.items.join(', ')}`);
        if (item.kata) content.push(`🥋 ${item.kata}`);

        li.innerHTML = `
            <div class="log-header">
                <span>📅 ${item.date} ${item.time}</span>
                <span>+${item.gain || 0}pt</span>
            </div>
            <div class="log-main">
                ${content.join('<br>')}
            </div>
        `;
        list.appendChild(li);
    });
}

// --- 履歴表示 (Log - Phase 6対応) ---
function loadFullHistory() {
    // 過去ログ
    let history = JSON.parse(localStorage.getItem('seCheckHistoryV2')) || [];
    const list = document.getElementById('history-list-full');
    if (!list) return;
    list.innerHTML = '';

    // 今日のデータをまず表示
    const key = `seCheckDaily_${getTodayKey()}`;
    const today = JSON.parse(localStorage.getItem(key));

    if (today) {
        const li = document.createElement('li');
        li.style.borderLeft = "5px solid var(--accent)";
        li.style.background = "var(--accent-light)"; // Highlight today

        let morningHTML = today.morning_recorded ?
            `<div><b>☀️ 朝:</b> スコア平均 ${calcAvg(today.morning.scores)}</div>` : '<div>☀️ 朝: 未記録</div>';

        let nightHTML = today.night_recorded ?
            `<div><b>🌙 夜:</b> event:${today.night.event}</div>` : '<div>🌙 夜: 未記録</div>';

        li.innerHTML = `
            <div class="log-header">
                <span>📅 今日 (${getTodayKey()})</span>
                <span>修正可能</span>
            </div>
            <div class="log-main">
                ${morningHTML}
                ${nightHTML}
                <div style="font-size:0.8rem; margin-top:5px;">📝 ${today.morning?.memo || today.night?.memo || ""}</div>
            </div>
        `;
        list.appendChild(li);
    }

    history.slice(0, 20).forEach(item => {
        // 今日の分と重複しないように日付チェックすべきだが簡易実装
        if (item.date === new Date().toLocaleDateString()) return;

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="log-header">
                <span>📅 ${item.date} ${item.time}</span>
                <span>Avg: ${item.average}</span>
            </div>
            <div class="log-main">
                ${item.memo || '-'}
            </div>
        `;
        list.appendChild(li);
    });
}

function calcAvg(scores) {
    if (!scores) return 0;
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function clearHistory() {
    if (confirm('データ全消去しますか？')) {
        localStorage.clear();
        location.reload();
    }
}

// グラフ (簡易: 従来のHistoryV2のみ参照)
function renderChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    const theme = document.body.getAttribute('data-theme') || 'forest';
    const isFantasy = (theme === 'fantasy');
    const colorMain = isFantasy ? '#c5a059' : '#4a7c59';

    let history = JSON.parse(localStorage.getItem('seCheckHistoryV2')) || [];
    // ここも本来はDailyデータを集計すべき
    const sortedData = [...history].reverse().slice(-7);
    const labels = sortedData.map(item => item.date.slice(5));
    const avgPoints = sortedData.map(item => item.average);

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '平均スコア',
                data: avgPoints,
                borderColor: colorMain,
                backgroundColor: isFantasy ? 'rgba(197, 160, 89, 0.1)' : 'rgba(74, 124, 89, 0.1)',
                tension: 0.3, fill: true
            }]
        }
    });
}

/* ============================
   Phase 8: 案内人NPCシステム
   ============================ */

// NPCデータ
const npcData = {
    level0: { char: '🌱', name: '見習いの精霊', minLvl: 0 },
    level10: { char: '🦉', name: '森の賢者', minLvl: 10 },
    level20: { char: '🦄', name: '守護聖獣', minLvl: 20 },
    // アイランドテーマ用
    island_lvl0: { char: '🥥', name: 'ココナッツの妖精', minLvl: 0 },
    island_lvl10: { char: '🦜', name: '南国の鳥', minLvl: 10 },
    island_lvl20: { char: '🐢', name: '長老カメ', minLvl: 20 }
};

// 会話リスト
const npcDialogues = {
    common: [
        "今日も来てくれてありがとう！",
        "無理しすぎないでね。",
        "深呼吸、深呼吸〜。",
        "水分とった？",
        "君のペースでいいんだよ。",
        "今日はどんな一日だった？"
    ],
    weather: {
        cold: ["寒いから温かくしてね。", "ホットココアがおいしい季節だね。"],
        hot: ["水分補給を忘れないで！", "暑いね〜。涼しく過ごしてね。"],
        rain: ["雨音って落ち着くよね。", "足元に気をつけてね。"],
        snow: ["雪だ！！", "滑らないようにね。"]
    },
    intimacy: [
        "君と話すと元気がもらえるよ。(❤️)",
        "いつも頑張っててえらい！大好き！(❤️)",
        "ずっと応援してるからね。(❤️)"
    ]
};

// NPC初期化
function initNPC() {
    updateNPCDisplay();
}

// NPCの見た目更新
function updateNPCDisplay() {
    const s = getStatus();
    const totalLvl = getLevel(s.stamina, staminaLevels) + getLevel(s.control, controlLevels);
    const theme = localStorage.getItem('seCheckTheme') || 'forest';
    
    let charData = npcData.level0;
    
    // テーマとレベルで分岐
    if (theme === 'island') {
        if(totalLvl >= 20) charData = npcData.island_lvl20;
        else if(totalLvl >= 10) charData = npcData.island_lvl10;
        else charData = npcData.island_lvl0;
    } else {
        if(totalLvl >= 20) charData = npcData.level20;
        else if(totalLvl >= 10) charData = npcData.level10;
        else charData = npcData.level0; // level0 (🌱)
    }

    const charEl = document.getElementById('npc-char');
    if(charEl) charEl.textContent = charData.char;
}

// NPCに話しかける
window.talkToNPC = function() {
    const bubble = document.getElementById('npc-bubble');
    if(!bubble) return;

    // 吹き出し表示アニメーション
    bubble.classList.remove('hidden');
    bubble.classList.add('visible');
    
    // セリフ決定
    const text = getNPCDialogue();
    bubble.textContent = text;
    
    // 親密度アップ演出
    showHeartEffect();
    increaseIntimacy();

    // 3秒後に消える
    setTimeout(() => {
        bubble.classList.remove('visible');
    }, 4000);
}

function getNPCDialogue() {
    // 親密度が高いとデレる
    const intimacy = Number(localStorage.getItem('seCheckIntimacy')) || 0;
    if (intimacy > 10 && Math.random() > 0.7) {
        return randomPick(npcDialogues.intimacy);
    }

    // 天気による会話
    if (weatherData && weatherData.temp) {
        if (weatherData.temp < 10) return randomPick(npcDialogues.weather.cold);
        if (weatherData.temp > 28) return randomPick(npcDialogues.weather.hot);
    }
    
    // 通常会話
    return randomPick(npcDialogues.common);
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function increaseIntimacy() {
    let intimacy = Number(localStorage.getItem('seCheckIntimacy')) || 0;
    intimacy++;
    localStorage.setItem('seCheckIntimacy', intimacy);
}

function showHeartEffect() {
    const area = document.getElementById('npc-area');
    const heart = document.createElement('div');
    heart.className = 'heart-effect';
    heart.textContent = '❤️';
    heart.style.left = '50%';
    heart.style.bottom = '100%';
    area.appendChild(heart);
    
    setTimeout(() => {
        heart.remove();
    }, 1000);
}

// ロード時に実行
document.addEventListener('DOMContentLoaded', () => {
    // 既存のinitの下に追加で呼ばれるようにする
    // ただしDOM読み込み順序に注意。今回は最後尾に追記しているので、
    // 上のDOMContentLoadedリスナとは別に動く。
    initNPC();
});

