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
    loadDailyHistory(); // 履歴タブ初期化

    const refreshBtn = document.getElementById('refresh-affirmation');
    if (refreshBtn) refreshBtn.addEventListener('click', showRandomAffirmation);
    loadPrescription();
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
    if (tabId === 'column') {
        initColumnTab();
    }
    if (tabId === 'library') {
        initLibraryTab();
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

    // ローカルストレージに保存
    localStorage.setItem(key, JSON.stringify(todayData));

    // うさぎが反応
    rabbitReact('saved', 'データを保存したよ！');

    updateStatusDisplay();
    renderChart();
    loadDailyHistory();

    // 親密度+1
    increaseIntimacy(1);

    // データ表示更新
    loadDailyLogV3();

    // AI分析トリガー（朝のデータ保存時のみ）
    if (currentMode === 'morning') {
        analyzeWithAI(todayData);
    }
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
    const logs = JSON.parse(localStorage.getItem('seCheckTraining')) || [];
    const list = document.getElementById('training-list');
    if (!list) return;
    list.innerHTML = '';

    logs.slice(0, 10).forEach(item => {
        const li = document.createElement('li');
        const content = [];
        if (item.steps) content.push(`🚶 ${item.steps}歩`);
        if (item.items && item.items.length > 0) content.push(`✅ ${item.items.join(', ')}`);
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

// --- 履歴モード切り替え ---
let currentHistoryMode = 'daily';

function switchHistoryMode(mode) {
    currentHistoryMode = mode;
    document.getElementById('history-mode-daily').classList.toggle('active', mode === 'daily');
    document.getElementById('history-mode-good').classList.toggle('active', mode === 'good');

    document.getElementById('history-daily').style.display = mode === 'daily' ? 'block' : 'none';
    document.getElementById('history-good').style.display = mode === 'good' ? 'block' : 'none';

    if (mode === 'daily') {
        loadDailyHistory();
    } else {
        loadGoodMemories();
    }
}

// --- 日々の記録タブ (スコア平均+できごと) ---
function loadDailyHistory() {
    const list = document.getElementById('history-list-daily');
    if (!list) return;
    list.innerHTML = '';

    // 直近7日分のデータを取得
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString();
        const key = `seCheckDaily_${dateStr}`;
        const dailyData = JSON.parse(localStorage.getItem(key));

        if (!dailyData) continue;

        const li = document.createElement('li');
        li.style.borderLeft = i === 0 ? "5px solid var(--accent)" : "3px solid var(--accent-light)";

        // 朝のスコア平均
        let morningAvg = '-';
        if (dailyData.morning && dailyData.morning.scores) {
            morningAvg = calcAvg(dailyData.morning.scores);
        }

        // できごと・メモ
        const memo = dailyData.morning?.memo || '';
        const event = dailyData.night?.event || '';

        let content = `<div class="log-header">
            <span>📅 ${dateStr}${i === 0 ? ' (今日)' : ''}</span>
            <span>朝の平均: ${morningAvg}</span>
        </div>
        <div class="log-main">`;

        if (memo) content += `<div><strong>朝メモ:</strong> ${memo}</div>`;
        if (event) content += `<div><strong>今日の出来事:</strong> ${event}</div>`;
        if (!memo && !event) content += '<div style="color:var(--text-sub);">記録なし</div>';

        content += '</div>';
        li.innerHTML = content;
        list.appendChild(li);
    }
}

// --- よかったことタブ (😁🥺🌱のみ1週間分) ---
function loadGoodMemories() {
    const list = document.getElementById('history-list-good');
    if (!list) return;
    list.innerHTML = '';

    const goodItems = [];

    // 直近7日分のデータから良かったことを収集
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString();
        const key = `seCheckDaily_${dateStr}`;
        const dailyData = JSON.parse(localStorage.getItem(key));

        if (!dailyData || !dailyData.night) continue;

        // 😁 楽しかった
        if (dailyData.night.fun) {
            goodItems.push({
                date: dateStr,
                icon: '😁',
                type: '楽しかった',
                content: dailyData.night.fun
            });
        }

        // 🥺 心が動いた
        if (dailyData.night.moved) {
            goodItems.push({
                date: dateStr,
                icon: '🥺',
                type: '心が動いた',
                content: dailyData.night.moved
            });
        }

        // 🌱 成長・発見
        if (dailyData.night.growth) {
            goodItems.push({
                date: dateStr,
                icon: '🌱',
                type: '成長・発見',
                content: dailyData.night.growth
            });
        }
    }

    if (goodItems.length === 0) {
        list.innerHTML = '<li style="color:var(--text-sub); text-align:center; padding:2rem;">まだ記録がありません</li>';
        return;
    }

    goodItems.forEach(item => {
        const li = document.createElement('li');
        li.style.borderLeft = `5px solid var(--accent)`;
        li.innerHTML = `
            <div class="log-header">
                <span>${item.icon} ${item.type}</span>
                <span style="font-size:0.9rem; color:var(--text-sub);">${item.date}</span>
            </div>
            <div class="log-main">
                ${item.content}
            </div>
        `;
        list.appendChild(li);
    });
}

// 初期化時に呼ばれる（互換性のため残す）
function loadFullHistory() {
    loadDailyHistory();
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

// グラフモード管理
let currentGraphMode = 'morning'; // 'morning' or 'combined'

function switchGraphMode(mode) {
    currentGraphMode = mode;
    document.getElementById('graph-mode-morning').classList.toggle('active', mode === 'morning');
    document.getElementById('graph-mode-combined').classList.toggle('active', mode === 'combined');
    renderChart();
}

// グラフ (日次データから生成)
function renderChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;

    const theme = document.body.getAttribute('data-theme') || 'forest';
    const isFantasy = (theme === 'fantasy');
    const colorMain = isFantasy ? '#c5a059' : '#4a7c59';

    // 直近7日分のデータを取得
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString();
        const key = `seCheckDaily_${dateStr} `;
        const dailyData = JSON.parse(localStorage.getItem(key));

        let avgScore = null;

        if (dailyData) {
            if (currentGraphMode === 'morning') {
                // 朝のスコア平均
                if (dailyData.morning && dailyData.morning.scores) {
                    avgScore = calcAvg(dailyData.morning.scores);
                }
            } else {
                // 朝+夜の総合平均
                const scores = [];
                if (dailyData.morning && dailyData.morning.scores) {
                    scores.push(...Object.values(dailyData.morning.scores));
                }
                // 夜のスコアも加味（体の疲れ、メンタルの疲れなど）
                if (dailyData.night) {
                    if (dailyData.night.bodyTired) scores.push(6 - dailyData.night.bodyTired); // 反転（疲れが少ない=良い）
                    if (dailyData.night.mentalTired) scores.push(6 - dailyData.night.mentalTired);
                    if (dailyData.night.stomach) scores.push(dailyData.night.stomach);
                    if (dailyData.night.motivation) scores.push(dailyData.night.motivation);
                }
                if (scores.length > 0) {
                    avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                }
            }
        }

        chartData.push({
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            score: avgScore ? parseFloat(avgScore) : null
        });
    }

    const labels = chartData.map(d => d.date);
    const scores = chartData.map(d => d.score);

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: currentGraphMode === 'morning' ? '朝の平均スコア' : '総合スコア',
                data: scores,
                borderColor: colorMain,
                backgroundColor: isFantasy ? 'rgba(197, 160, 89, 0.1)' : 'rgba(74, 124, 89, 0.1)',
                tension: 0.3,
                fill: true,
                spanGaps: true // null値をスキップして線を繋ぐ
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/* ============================
   Phase 8: 案内人NPCシステム
   ============================ */

// === うさぎNPC システム（画像対応可能） ===
const rabbitExpressions = {
    normal: { emoji: '🐰', image: null, description: '通常' },
    happy: { emoji: '✨🐰', image: null, description: '喜び' },
    sleepy: { emoji: '😴🐰', image: null, description: '眠そう' },
    thinking: { emoji: '🤔🐰', image: null, description: '考え中' },
    excited: { emoji: '🎉🐰', image: null, description: 'わくわく' },
    loving: { emoji: '💕🐰', image: null, description: 'うれしい' }
};

// うさぎの会話内容
const rabbitDialogues = {
    morning: [
        "おはよう！今日もよろしくね",
        "今日の体調はどうかな？",
        "新しい一日の始まりだね"
    ],
    night: [
        "今日もお疲れさま！",
        "一日どうだった？",
        "ゆっくり休んでね"
    ],
    saved: [
        "記録できたね！",
        "データ保存完了だよ",
        "よくできました！"
    ],
    levelUp: [
        "レベルアップしたよ！すごい！",
        "継続の力って素敵だね",
        "ここまでよく頑張ったね！"
    ],
    highIntimacy: [
        "いつもありがとう",
        "一緒に頑張ろうね",
        "あなたのこと応援してるよ"
    ]
};

// うさぎNPCの初期化
function initRabbitNPC() {
    const intimacy = parseInt(localStorage.getItem('seCheckIntimacy')) || 0;

    // 初回表示
    updateRabbitDisplay('normal');

    // 朝夜に応じた挨拶
    const hour = new Date().getHours();
    let dialogue;
    if (hour >= 5 && hour < 12) {
        dialogue = rabbitDialogues.morning[Math.floor(Math.random() * rabbitDialogues.morning.length)];
    } else {
        dialogue = rabbitDialogues.night[Math.floor(Math.random() * rabbitDialogues.night.length)];
    }

    // 親密度が高い場合は特別なメッセージ
    if (intimacy > 50 && Math.random() < 0.3) {
        dialogue = rabbitDialogues.highIntimacy[Math.floor(Math.random() * rabbitDialogues.highIntimacy.length)];
    }

    document.getElementById('npc-dialogue').textContent = dialogue;
}

// うさぎの表情を更新
function updateRabbitDisplay(expression) {
    const npcChar = document.getElementById('npc-character');
    const expr = rabbitExpressions[expression] || rabbitExpressions.normal;

    // 画像がある場合は画像を、ない場合は絵文字を表示
    if (expr.image) {
        npcChar.innerHTML = `<img src="${expr.image}" alt="${expr.description}" style="width:80px; height:80px;">`;
    } else {
        npcChar.textContent = expr.emoji;
    }
}

// うさぎに反応させる（保存時などに呼ばれる）
function rabbitReact(type, message) {
    const npcDialogue = document.getElementById('npc-dialogue');

    switch (type) {
        case 'saved':
            updateRabbitDisplay('happy');
            npcDialogue.textContent = message || rabbitDialogues.saved[Math.floor(Math.random() * rabbitDialogues.saved.length)];
            break;
        case 'levelUp':
            updateRabbitDisplay('excited');
            npcDialogue.textContent = message || rabbitDialogues.levelUp[Math.floor(Math.random() * rabbitDialogues.levelUp.length)];
            break;
        case 'thinking':
            updateRabbitDisplay('thinking');
            npcDialogue.textContent = message || "AIに聞いてみるね...";
            break;
        case 'loving':
            updateRabbitDisplay('loving');
            npcDialogue.textContent = message || "いつも一緒にいるよ";
            break;
        default:
            updateRabbitDisplay('normal');
            if (message) npcDialogue.textContent = message;
    }

    // 3秒後に通常に戻る
    setTimeout(() => {
        updateRabbitDisplay('normal');
    }, 3000);
}

// 初期化用（後方互換性のため）
function initNPC() {
    initRabbitNPC();
}

function updateNPCDisplay() {
    // 既にうさぎNPCで処理されているのでスキップ
}

function getNPCDialogue() {
    // 既にうさぎNPCで処理されているのでスキップ
    return "";
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
    initNPC();

    // API Key復元
    const savedKey = localStorage.getItem('seCheckApiKey');
    if (savedKey && document.getElementById('gemini-api-key')) {
        document.getElementById('gemini-api-key').value = savedKey;
    }
});


/* ============================
   Phase 9: AI分析機能 (Gemini)
   ============================ */

function saveApiKey(key) {
    if (!key) return;
    localStorage.setItem('seCheckApiKey', key.trim());
}

function getApiKey() {
    return localStorage.getItem('seCheckApiKey');
}

// AI分析を実行する
async function analyzeWithAI(dailyData) {
    const apiKey = getApiKey();
    if (!apiKey) return;

    // 1. ログタブに移動して結果を待つ演出
    switchTab('log');

    const feedbackSection = document.getElementById('ai-prescription');
    const feedbackContent = document.getElementById('ai-message-content');

    feedbackSection.style.display = 'block';
    feedbackContent.textContent = "身体データと照合中... (カルテ作成)";
    feedbackSection.scrollIntoView({ behavior: 'smooth' });

    // 2. データ準備
    const status = getStatus(); // 継続レベル (経験値)

    // 特定部位のスコア比較 (直近7回分の平均を算出)
    const recentStats = calculateRecentStats();

    // 今回のスコア (朝ならMorning, 夜ならNightから取得。なければ空)
    const currentScores = dailyData.morning.scores || {};

    // 比較データのテキスト化
    let comparisonText = "";
    if (Object.keys(currentScores).length > 0) {
        comparisonText += "【部位別スコア分析 (現在値 vs 平均)】\n";
        for (const [key, val] of Object.entries(currentScores)) {
            const avg = recentStats[key];
            const diff = avg ? (val - avg).toFixed(1) : 0;
            const diffStr = diff > 0.5 ? "↑(好調)" : (diff < -0.5 ? "↓(不調)" : "→(通常)");
            // アイテム名取得
            const label = checkItems.find(i => i.id === key)?.label || key;
            comparisonText += `- ${label}: ${val} (平均 ${avg ? avg.toFixed(1) : '-'}) ${diffStr}\n`;
        }
    } else {
        comparisonText = "※今回は詳細な身体スコア入力なし\n";
    }

    // 3. プロンプト作成
    const isNight = (currentMode === 'night');
    const prompt = `
【システムプロンプト】
あなたは武道家（空手・太気拳）であり、身体操作の探求者「はる」です。
ユーザー専属の「身体チューナー」として、入力されたデータ（Se-Check）をカルテのように分析し、論理的かつ静謐なフィードバックを行ってください。

【ユーザーの設定・哲学】
- 「体力Lv」「管理Lv」は「身体能力」ではなく、ここまでの「継続の証（経験値）」です。高ければ日々の積み重ねを称賛してください。
- 重要なのは「今の身体の声」です。平均値との乖離を見て、身体のどこが滞っているかを見抜いてください。
- あなたは騎士ではありません。道着を着て静かに語る武道家、あるいはNoteで思考を綴るクリエイターのような「静かで知的な」口調（デスマス調だが、落ち着いている）で話してください。

【入力データ】
- 継続レベル(経験値): 体力Lv.${getLevel(status.stamina, staminaLevels)} / 管理Lv.${getLevel(status.control, controlLevels)}
- モード: ${isNight ? "夜（振り返り）" : "朝（チューニング）"}
- ${comparisonText}
- メモ・出来事: ${isNight ? dailyData.night.event : dailyData.morning.memo || "特になし"}

【出力構成 (300文字程度)】
1. **現状の分析 (Diagnosis)**: 
   数値の偏りや平均との差から、今の身体システムの状態を論理的に言語化してください。（例：「平均より肩の緊張が強いようです。思考が先行して、重心が浮き上がっている可能性があります」）
2. **継続への敬意 (Respect)**:
   レベル（継続ポイント）を参照し、日々の鍛錬を静かに称えてください。
3. **身体操作の処方箋 (Prescription)**:
   空手や太気拳の身体操作に基づき、具体的な「骨格・意識の修正」を提案してください。（例：「坐骨を座面に垂直に刺すイメージで、腰椎のカーブを緩めましょう」）

※絵文字は最低限に、落ち着いたトーンで。
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'API Error');
        }

        const aiText = data.candidates[0].content.parts[0].text;
        feedbackContent.innerHTML = formatText(aiText);

        // 処方箋を保存（その日1日表示を維持）
        savePrescription(aiText, isNight);

    } catch (e) {
        console.error(e);
        feedbackContent.textContent = "AIとの通信に失敗しました。(" + e.message + ")";
    }
}

// 今日の日付キーを取得 (YYYY-MM-DD)
function getTodayKey() {
    const d = new Date();
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
}

// 処方箋を保存（日付とモード付き）
function savePrescription(text, isNight) {
    const today = getTodayKey();
    localStorage.setItem('seCheckPrescription', JSON.stringify({
        date: today,
        mode: isNight ? 'night' : 'morning',
        text: text,
        timestamp: Date.now()
    }));
}

// 処方箋をロード（ページ読み込み時）
function loadPrescription() {
    const saved = localStorage.getItem('seCheckPrescription');
    if (!saved) return;

    const data = JSON.parse(saved);
    const today = getTodayKey();

    // 日付が違う、または夜モードで新しいデータが入っている場合はクリア
    if (data.date !== today) {
        localStorage.removeItem('seCheckPrescription');
        return;
    }

    // 夜のデータが入ったらクリア（朝の処方箋を消す）
    const todayData = JSON.parse(localStorage.getItem(`seCheckDaily_${today}`));
    if (data.mode === 'morning' && todayData && todayData.night && Object.keys(todayData.night).length > 0) {
        localStorage.removeItem('seCheckPrescription');
        return;
    }

    // 表示
    const feedbackSection = document.getElementById('ai-prescription');
    const feedbackContent = document.getElementById('ai-message-content');
    if (feedbackSection && feedbackContent) {
        feedbackSection.style.display = 'block';
        feedbackContent.innerHTML = formatText(data.text);
    }
}

// 直近のデータから平均値を計算するヘルパー
function calculateRecentStats() {
    const stats = {};
    const counts = {};

    // localStorageの全キーから 'seCheckDaily_' を探す (非効率だが件数少ないのでOK)
    // 本当は履歴配列を持っているならそこから引くのが早いが、詳細スコア(morning.scores)は履歴配列(historyV2)に入ってない場合があるため
    // ここでは簡易的に直近1週間分の日付キーを生成してチェックする

    for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `seCheckDaily_${d.toLocaleDateString()}`;
        const data = JSON.parse(localStorage.getItem(key));

        if (data && data.morning && data.morning.scores) {
            for (const [k, v] of Object.entries(data.morning.scores)) {
                stats[k] = (stats[k] || 0) + v;
                counts[k] = (counts[k] || 0) + 1;
            }
        }
    }

    const averages = {};
    for (const k of Object.keys(stats)) {
        averages[k] = stats[k] / counts[k];
    }
    return averages;
}

// 簡易テキスト整形
function formatText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// --- コラムタブ機能 ---

// 1. コラムデータの読み込み
// 1. コラムデータの読み込み (デフォルトデータを持たせておく)
const defaultColumnData = {
    "systematic": [
        {
            "id": "col-theory-001",
            "title": "INFJ、INTJの必須習得スキルは「意図的に緩む力」かも",
            "url": "https://note.com/jagapachi3/n/nb318d967396a",
            "category": "心身のリセット",
            "tags": ["ストレス", "疲れ", "休息", "思考", "回復"],
            "summary": "無自覚に疲れを溜めがちなINFJ/INTJ必見。筋肉の緊張を一度高めてから解放する「軍隊式」脱力法など、具体的な心身のリセット術を解説します。",
            "thumbnail": null,
            "isPinned": true
        },
        {
            "id": "col-theory-002",
            "title": "INFJやINTJはご自愛をシステム化するのがいいのかも",
            "url": "https://note.com/jagapachi3/n/n2b2d2f7f8f9a",
            "category": "セルフケア理論",
            "tags": ["頭", "ストレス", "疲れ", "回復", "継続"],
            "summary": "感覚に頼らない体調管理。「数値化」や「制限時間」を設けることで、思考優位なタイプが無理なく健康を維持するための仕組みを提案します。",
            "thumbnail": null,
            "isPinned": false
        },
        {
            "id": "col-theory-003",
            "title": "肩こり解消の原理？柔道整復師に聞いたコツ",
            "url": "https://note.com/jagapachi3/n/n1f2e3d4c5b6a",
            "category": "身体操作",
            "tags": ["肩", "姿勢", "疲れ", "回復", "休息"],
            "summary": "ガチガチの肩をほぐすには「あえて一度強い緊張を加える」のが正解？筋肉の性質を利用した、自分でも試せる具体的な指圧のコツを解説。",
            "thumbnail": null,
            "isPinned": false
        },
        {
            "id": "col-theory-004",
            "title": "身体感覚の追求の道のりは長いなぁと",
            "url": "https://note.com/jagapachi3/n/n9a8b7c6d5e4f",
            "category": "身体操作",
            "tags": ["姿勢", "肩", "疲れ", "継続", "回復"],
            "summary": "猫背ゲーマーが武道2年で姿勢激変。自分の体の「ズレ」に気づき、パッシブアビリティとして良い状態を保つための身体操作の重要性。",
            "thumbnail": null,
            "isPinned": false
        },
        {
            "id": "col-theory-005",
            "title": "意味探しのグルグル思考を終わらせるための気付き",
            "url": "https://note.com/jagapachi3/n/ne4d5c6b7a8f9",
            "category": "メンタルケア",
            "tags": ["思考", "ストレス", "回復", "呼吸", "休息"],
            "summary": "思考の迷宮にハマりやすい方へ。「今」を肯定し、メンタルヘルスを整えるための思考の処方箋。虚無感を乗り越えるヒントについて。",
            "thumbnail": null,
            "isPinned": false
        }
    ],
    "expedition": [
        {
            "id": "col-log-101",
            "title": "（一言日記）年末年始リゾバから無事帰還した感想",
            "url": "https://note.com/jagapachi3/n/n1a2b3c4d5e6f",
            "category": "遠征ログ",
            "tags": ["疲れ", "回復", "南伊豆", "リゾバ"],
            "summary": "南伊豆での過酷かつ充実した2週間のリゾバ記録。1日1万8千歩の労働と自然がもたらした刺激と幸福感について。",
            "date": "2026-01-06",
            "thumbnail": null
        },
        {
            "id": "col-log-102",
            "title": "彼氏なしアラサー女の積極的クリスマスの過ごし方",
            "url": "https://note.com/jagapachi3/n/n7f8e9d0c1b2a",
            "category": "遠征ログ",
            "tags": ["南伊豆", "休息", "リフレッシュ", "クリスマス"],
            "summary": "クリスマスに南伊豆へ！都会のノイズから離れ、現地の「今」に没入することで得られる心の平安と、環境を変える価値について。",
            "date": "2025-12-27",
            "thumbnail": null
        },
        {
            "id": "col-log-103",
            "title": "誰かのお手紙を読める喫茶店「天文図舘」での話",
            "url": "https://note.com/jagapachi3/n/n4d5e6f7a8b9c",
            "category": "遠征ログ",
            "tags": ["思考", "ストレス", "阿佐ヶ谷", "メンタルケア"],
            "summary": "阿佐ヶ谷の静寂な喫茶店への小遠征。他者の内面に触れる「手紙」を通じて自分を見つめ直す、至福のメンタルケア・タイムの記録。",
            "date": "2025-12-24",
            "thumbnail": null
        }
    ]
};

async function loadColumnData() {
    try {
        // ローカルファイル実行（file://）だとfetchが失敗することが多いため、
        // 失敗した場合はあらかじめ定義したデータを使います。
        const response = await fetch('./columns.json');
        if (!response.ok) return defaultColumnData;
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('columns.json の読み込みに失敗したため、内蔵データを使用します。', error);
        return defaultColumnData;
    }
}

// 2. コラムタブの初期化
async function initColumnTab() {
    const data = await loadColumnData();

    // 体系的に学ぶセクション
    renderSystematicColumns(data.systematic);

    // 遠征ライブログセクション
    renderExpeditionColumns(data.expedition);

    // AI推薦
    recommendColumn(data);
}

function renderSystematicColumns(columns) {
    const container = document.getElementById('systematic-columns');
    if (!container) return;

    container.innerHTML = columns.map(col => {
        const stocked = isStocked(col.id);
        return `
            <div class="column-card" style="position:relative;">
                <div class="column-card-content" onclick="openColumn('${col.url}')">
                    ${col.thumbnail ? `<img src="${col.thumbnail}" class="column-card-thumbnail" alt="${col.title}">` : ''}
                    <div class="column-card-category">${col.category}</div>
                    <div class="column-card-title">${col.title}</div>
                    <div class="column-card-summary">${col.summary}</div>
                </div>
                <div class="column-card-footer">
                    <button class="small-btn stock-btn ${stocked ? 'stocked' : ''}" 
                        data-stock-id="${col.id}"
                        onclick="toggleStock('${col.id}', event)">
                        ${stocked ? '📌 済み' : '📌 ストック'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderExpeditionColumns(columns) {
    const container = document.getElementById('expedition-columns');
    if (!container) return;

    // 日付順にソート (新しい順)
    const sorted = [...columns].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sorted.map(col => {
        const stocked = isStocked(col.id);
        return `
            <div class="column-list-item" style="position:relative;">
                <div onclick="openColumn('${col.url}')" style="display:flex; width:100%; gap:15px;">
                    <div class="column-list-date">${col.date}</div>
                    <div class="column-list-content">
                        <div class="column-card-title">${col.title}</div>
                        <div class="column-card-summary">${col.summary}</div>
                    </div>
                </div>
                <button class="small-btn stock-btn ${stocked ? 'stocked' : ''}" 
                    data-stock-id="${col.id}"
                    onclick="toggleStock('${col.id}', event)" 
                    style="margin-left:10px;">
                    ${stocked ? '📌' : '📌'}
                </button>
            </div>
        `;
    }).join('');
}

function openColumn(url) {
    if (!url) return;
    // 空白除去とセキュリティ対策
    const cleanUrl = url.trim();
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
}

// 3. AI推薦ロジック
function recommendColumn(columnData) {
    const allColumns = [...columnData.systematic, ...columnData.expedition];

    // 最近7日間の記録データを分析
    const recentCheckData = getRecentCheckDataForRecommendation(7);
    const bodyCondition = analyzeBodyConditionForRecommendation(recentCheckData);

    // 各コラムのマッチングスコアを計算
    const scored = allColumns.map(col => ({
        ...col,
        matchScore: calculateRecommendationScore(col, bodyCondition)
    }));

    // スコア順にソートして最高の一本を選ぶ
    const recommended = scored.sort((a, b) => b.matchScore - a.matchScore)[0];

    if (recommended && recommended.matchScore > 0) {
        renderRecommendedColumn(recommended, bodyCondition);
    } else {
        renderDefaultRecommendation(allColumns);
    }
}

// 最近7日分の localStorage データを取得
function getRecentCheckDataForRecommendation(days) {
    const results = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `seCheckDaily_${y} -${m} -${day} `;
        const saved = localStorage.getItem(key);
        if (saved) {
            results.push(JSON.parse(saved));
        }
    }
    return results;
}

// 体調データの要約
function analyzeBodyConditionForRecommendation(recentData) {
    const summary = {
        issues: {},       // 部位ごとの低スコア(<=2)回数
        keywords: new Set(),
        patterns: []
    };

    recentData.forEach(day => {
        if (day.morning) {
            Object.entries(day.morning).forEach(([part, score]) => {
                if (typeof score === 'number' && score <= 2) {
                    summary.issues[part] = (summary.issues[part] || 0) + 1;
                }
            });
            if (day.morning.memo) {
                extractKeywordsToSet(day.morning.memo, summary.keywords);
            }
        }
        if (day.night) {
            if (day.night.event) {
                extractKeywordsToSet(day.night.event, summary.keywords);
            }
        }
    });

    // パターン検出
    if (summary.issues.shoulders >= 3) summary.patterns.push('stiff-shoulders');
    if (summary.issues.back >= 3) summary.patterns.push('back-pain');
    if (summary.issues.head >= 2 || summary.issues.brows >= 3) summary.patterns.push('mental-fatigue');

    return summary;
}

function extractKeywordsToSet(text, set) {
    const targetKeywords = ['姿勢', '腰', '肩', '首', '目', 'ストレス', '疲れ', '継続', '集中', '呼吸', '坐骨'];
    targetKeywords.forEach(kw => {
        if (text.includes(kw)) set.add(kw);
    });
}

function calculateRecommendationScore(column, condition) {
    let score = 0;

    // タグマッチング (1つあたり10点)
    if (column.tags) {
        column.tags.forEach(tag => {
            if (condition.keywords.has(tag)) score += 10;

            // 部位とのマッチング
            if (tag.includes('肩') && condition.issues.shoulders >= 2) score += 15;
            if (tag.includes('腰') && condition.issues.back >= 2) score += 15;
            if ((tag.includes('ストレス') || tag.includes('思考')) && condition.issues.brows >= 2) score += 15;
        });
    }

    // パターンマッチング (30点)
    if (condition.patterns.includes('stiff-shoulders') && column.tags?.includes('肩')) score += 30;
    if (condition.patterns.includes('back-pain') && column.tags?.includes('腰')) score += 30;
    if (condition.patterns.includes('mental-fatigue') && (column.tags?.some(t => t.includes('ストレス') || t.includes('休息')))) score += 30;

    // ピン留めは基本スコア+5
    if (column.isPinned) score += 5;

    return score;
}

function renderRecommendedColumn(column, condition) {
    const container = document.getElementById('recommended-column');
    if (!container) return;

    let reason = "最近の記録から、あなたへのおすすめを選びました。";
    if (condition.patterns.includes('stiff-shoulders')) reason = "肩の重な感じが続いているようなので、このコラムが役立つかもしれません。";
    else if (condition.patterns.includes('back-pain')) reason = "腰周りの違和感に寄り添った内容です。";
    else if (condition.patterns.includes('mental-fatigue')) reason = "少し思考がお疲れ気味かもしれません。ふっと息を抜けるこちらをどうぞ。";

    const stocked = isStocked(column.id);
    container.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; height:100%;">
            <div onclick="openColumn('${column.url}')" style="flex-grow:1;">
                <div class="column-card-category">${column.category || 'コラム'}</div>
                <div class="column-card-title">${column.title}</div>
                <div class="column-card-summary">${column.summary}</div>
                <div style="margin-top: 1rem; font-size: 0.85rem; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px;">
                    💡 ${reason}
                </div>
            </div>
            <div class="column-card-footer">
                <button class="small-btn stock-btn ${stocked ? 'stocked' : ''}" 
                    data-stock-id="${column.id}"
                    onclick="toggleStock('${column.id}', event)">
                    ${stocked ? '📌 済み' : '📌 ストック'}
                </button>
            </div>
        </div>
    `;

    // うさぎが通知
    setTimeout(() => {
        if (typeof rabbitReact === 'function') {
            rabbitReact('normal', '新しいコラムをおすすめしておいたよ！読んでみてね 📚');
        }
    }, 1000);
}

function renderDefaultRecommendation(allColumns) {
    const container = document.getElementById('recommended-column');
    if (!container) return;

    const fallback = allColumns.find(c => c.isPinned) || allColumns[0];
    if (fallback) {
        container.innerHTML = `
            <div onclick="openColumn('${fallback.url}')">
                <div class="column-card-category">${fallback.category || 'コラム'}</div>
                <div class="column-card-title">${fallback.title}</div>
                <div class="column-card-summary">${fallback.summary}</div>
                <div style="margin-top: 1rem; font-size: 0.85rem; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px;">
                    💡 まずはこちらの記事から読んでみるのはいかがでしょう？
                </div>
            </div>
            `;
    }
}

// --- 内観の書斎 (Library) ロジック ---

// 1. ストック機能
function stockColumnItem(colId, event) {
    if (event) event.stopPropagation();

    loadColumnData().then(data => {
        const all = [...data.systematic, ...data.expedition];
        const item = all.find(c => c.id === colId);
        if (item) {
            stockItem({
                id: item.id,
                title: item.title,
                content: item.summary,
                url: item.url,
                tags: item.tags,
                category: item.category,
                type: 'column',
                date: new Date().toLocaleDateString()
            });
        }
    });
}

function stockCurrentPrescription(btnElement) {
    const content = document.getElementById('ai-message-content').innerText;
    if (!content || content.includes('分析中')) return;

    // ボタンの参照取得（引数がない場合は検索）
    const btn = btnElement || document.querySelector('#ai-prescription .stock-btn');

    // 既にストック済みかチェック（内容ベース）
    let stocked = JSON.parse(localStorage.getItem('seCheckStocked') || '[]');
    const textContent = content.trim();

    // 内容が完全に一致するものが既に直近にあるか（過去の処方箋と同じ内容が偶然出ることもあるので、直近10件程度チェック）
    const duplicates = stocked.slice(0, 10).some(s => s.type === 'prescription' && s.content.trim() === textContent);

    if (duplicates) {
        if (typeof rabbitReact === 'function') rabbitReact('normal', 'その処方箋はもう書斎にあるよ！');
        if (btn) {
            btn.innerHTML = '📌 済み';
            btn.classList.add('stocked');
        }
        return;
    }

    // 現在の状況からタグを生成
    const recentData = getRecentCheckDataForRecommendation(1);
    const condition = analyzeBodyConditionForRecommendation(recentData);

    stockItem({
        id: 'presc-' + Date.now(),
        title: 'はるからの処方箋 (' + new Date().toLocaleDateString() + ')',
        content: content,
        tags: Array.from(condition.keywords),
        type: 'prescription',
        date: new Date().toLocaleDateString()
    });

    // ボタンの見た目更新
    if (btn) {
        btn.innerHTML = '📌 済み';
        btn.classList.add('stocked');
    }
}

function isStocked(id) {
    const stocked = JSON.parse(localStorage.getItem('seCheckStocked') || '[]');
    return stocked.some(s => s.id === id);
}

function toggleStock(id, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    if (isStocked(id)) {
        unstockItem(id);
    } else {
        stockColumnItem(id);
    }
}

function updateStockButtons(id, isStocked) {
    const buttons = document.querySelectorAll(`button[data-stock-id="${id}"]`);
    buttons.forEach(btn => {
        if (isStocked) {
            btn.innerHTML = '📌 済み';
            btn.classList.add('stocked');
        } else {
            btn.innerHTML = '📌 ストック';
            btn.classList.remove('stocked');
        }
    });
}

function unstockItem(id) {
    if (!confirm('この巻物を書斎から削除しますか？')) return;

    let stocked = JSON.parse(localStorage.getItem('seCheckStocked') || '[]');
    stocked = stocked.filter(s => s.id !== id);
    localStorage.setItem('seCheckStocked', JSON.stringify(stocked));

    updateStockButtons(id, false);

    // 書斎タブならリスト再描画
    const currentTab = document.querySelector('.tab-content.active')?.id;
    if (currentTab === 'tab-library') {
        renderStockedScrolls(stocked);
        updateLibrarianMessage(stocked);
    }
}

function handleUnstock(event, id) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    unstockItem(id);
}

function stockItem(item) {
    let stocked = JSON.parse(localStorage.getItem('seCheckStocked') || '[]');

    // 重複チェック
    if (stocked.some(s => s.id === item.id)) {
        return;
    }

    stocked.unshift(item);
    localStorage.setItem('seCheckStocked', JSON.stringify(stocked));

    // データIDが一致するボタンを更新
    // 処方箋の場合、IDが動的に変わる可能性があるため、PrescriptionのID管理には注意が必要だが
    // stockColumnItem経由ならIDは固定
    updateStockButtons(item.id, true);

    if (typeof rabbitReact === 'function') {
        rabbitReact('joy', '大切な知恵を書斎にしまっておいたよ！✨');
    }
}

// 2. 書斎タブの初期化
async function initLibraryTab() {
    const stocked = JSON.parse(localStorage.getItem('seCheckStocked') || '[]');
    const columnData = await loadColumnData();

    // グローバル関数として登録（HTMLから呼び出せるように）
    window.handleUnstock = handleUnstock;

    renderStockedScrolls(stocked);
    renderDeskLetters(columnData.expedition);
    updateLibrarianMessage(stocked);
}

function renderStockedScrolls(stocked) {
    const container = document.getElementById('stocked-scrolls');
    if (!container) return;

    if (stocked.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#e6d5b8; opacity:0.6; padding:40px;">まだ巻物がありません。コラムや処方箋をストックしてみましょう。</p>';
        return;
    }

    container.innerHTML = stocked.map(item => `
        <div class="scroll-item">
            <div class="scroll-header" onclick="toggleScroll(this.parentElement)">
                <div class="scroll-title-container" style="overflow:hidden;">
                    <div class="scroll-title">
                        <span>📜</span> ${item.title}
                    </div>
                    ${item.tags ? `<div class="scroll-tags-container">${item.tags.map(t => `<span class="scroll-tag">${t}</span>`).join('')}</div>` : ''}
                </div>
                <div class="scroll-actions">
                    <div style="font-size:0.8rem; opacity:0.6; margin-top:2px;">${item.date}</div>
                    <button class="small-btn danger" onclick="handleUnstock(event, '${item.id}')">削除</button>
                </div>
            </div>
            <div class="scroll-content">
                <p>${item.content.replace(/\n/g, '<br>')}</p>
                ${item.url ? `<button class="small-btn" onclick="openColumn('${item.url}')" style="margin-top:15px;">noteで詳しく読む</button>` : ''}
            </div>
        </div>
    `).join('');
}

function renderDeskLetters(expeditionColumns) {
    const container = document.getElementById('desk-letters');
    if (!container) return;

    // イタリア遠征に関連するものを抽出
    const italyLetters = expeditionColumns.filter(c => c.category === '遠征ログ' || (c.tags && c.tags.includes('イタリア')));

    if (italyLetters.length === 0) {
        container.innerHTML = '<p style="opacity:0.5; font-size:0.9rem;">まだ手紙は届いていないようです。</p>';
        return;
    }

    container.innerHTML = italyLetters.map(col => `
        <div class="desk-letter" onclick="openColumn('${col.url}')">
            <h4>${col.title}</h4>
            <div style="font-size:0.85rem; color:#666;">${col.date}</div>
            <p style="font-size:0.9rem; margin-top:10px;">${col.summary}</p>
            <div style="text-align:right; font-style:italic; font-size:0.8rem; color:var(--accent);">- Haruka in Italy</div>
        </div>
    `).join('');
}

function toggleScroll(element) {
    element.classList.toggle('open');
}

// 3. 司書うさぎのメッセージ
function updateLibrarianMessage(stocked) {
    const messageEl = document.getElementById('librarian-message');
    if (!messageEl) return;

    const recentData = getRecentCheckDataForRecommendation(3);
    const condition = analyzeBodyConditionForRecommendation(recentData);

    let message = "「ここは、あなたが手に入れた知恵が集まる場所だよ。今のあなたに必要な巻物を選んでみてね。」";

    // 体調とストックの照合
    if (condition.patterns.includes('stiff-shoulders')) {
        const sub = stocked.find(s => s.tags && s.tags.some(t => t.includes('肩')));
        if (sub) message = `「肩の重さが気になっているね。さっきストックした『${sub.title}』を読み返してみるのが一番の近道だよ。」`;
    } else if (condition.patterns.includes('back-pain')) {
        const sub = stocked.find(s => s.tags && s.tags.some(t => t.includes('腰')));
        if (sub) message = `「腰の違和感に負けないように。書斎にある『${sub.title}』の知恵を思い出して、少し体を動かしてみようか。」`;
    } else if (condition.patterns.includes('mental-fatigue')) {
        message = "「少し思考がお疲れ気味だね。今は新しい情報を入れるより、ストックした文章をゆっくり眺めて深呼吸するのがおすすめだよ。」";
    }

    messageEl.innerText = message;
}

// 4. 知恵の統合 (AI Synthesis)
async function synthesizeWisdom() {
    const stocked = JSON.parse(localStorage.getItem('seCheckStocked') || '[]');
    if (stocked.length < 2) {
        alert('知恵を統合するには、少なくとも2つ以上の項目をストックしてください。');
        return;
    }

    const apiKey = localStorage.getItem('seCheckApiKey');
    if (!apiKey) {
        alert('設定タブでGemini API Keyを登録してください。');
        return;
    }

    // データ整合性チェック
    const recentData = typeof getRecentCheckDataForRecommendation === 'function'
        ? getRecentCheckDataForRecommendation(3)
        : getRecentCheckData(3);

    const condition = typeof analyzeBodyConditionForRecommendation === 'function'
        ? analyzeBodyConditionForRecommendation(recentData)
        : analyzeBodyCondition(recentData);

    const btn = document.getElementById('synthesis-btn');
    const resultArea = document.getElementById('synthesis-result');
    const initialArea = document.getElementById('synthesis-initial');

    if (btn) {
        btn.disabled = true;
        btn.innerText = '知恵を集約中...';
    }

    // プロンプト生成 (エラー対策を含む)
    const keywords = Array.from(new Set(stocked.flatMap(s => s.tags || []))).join(', ');
    const titles = stocked.map(s => s.title).join(' / ');

    const prompt = `あなたは身体操作とセルフケアの専門家です。
        ユーザーがストックした以下の知恵（キーワード: ${keywords}）と、
        最近の体調（パターンの分析: ${condition.patterns.join(', ')}）を組み合わせて、
「今のこのユーザーのためだけの究極の身体操作のコツ」を100文字〜150文字程度で生成してください。

        文体は、落ち着いた、しかし力強い指導者のような口調で。
        複数の要素を組み合わせた具体的な動作のヒントを含めてください。`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        initialArea.style.display = 'none';
        resultArea.style.display = 'block';
        resultArea.innerHTML = `
            <div style="font-family:'Shippori Mincho', serif; border-bottom:1px solid #d4af37; padding-bottom:10px; margin-bottom:10px; font-weight:bold; color:#d4af37;">
                📜 統合された知恵の結晶
            </div>
            <div>${text.replace(/\n/g, '<br>')}</div>
            <button class="small-btn" onclick="document.getElementById('synthesis-initial').style.display='block'; document.getElementById('synthesis-result').style.display='none'; document.getElementById('synthesis-btn').disabled=false; document.getElementById('synthesis-btn').innerText='知恵を統合する';" style="margin-top:15px; opacity:0.7;">戻る</button>
        `;

        rabbitReact('joy', 'すごい！バラバラだった知恵がひとつに繋がったね！');

    } catch (error) {
        console.error('Synthesis failed:', error);
        alert('知恵の統合に失敗しました。APIキーやネットワークを確認してください。');
        btn.disabled = false;
        btn.innerText = '知恵を統合する';
    }
}

// グローバルスコープへの公開 (HTMLからの呼び出し用)
window.openColumn = openColumn;
window.toggleStock = toggleStock;
window.handleUnstock = handleUnstock;
window.stockColumnItem = stockColumnItem;
window.switchTab = switchTab;
window.synthesizeWisdom = synthesizeWisdom;
