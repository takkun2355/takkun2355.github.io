(function() {
    const translations = {
        ja: {
            app_title: "時間ユーティリティ",
            timer_title: "タイマー",
            timer_subtitle: "カウントダウン",
            stopwatch_title: "ストップウォッチ",
            stopwatch_subtitle: "経過時間計測",
            alarm_title: "アラーム",
            alarm_subtitle: "時刻指定通知",
            world_title: "世界時計",
            world_subtitle: "タイムゾーン",
            "1min": "1分", "3min": "3分", "5min": "5分", "10min": "10分",
            "15min": "15分", "30min": "30分", "60min": "60分",
            start: "▶ 開始",
            pause: "⏸ 一時停止",
            reset: "↺ リセット",
            lap: "🏁 ラップ",
            off: "OFF", on: "ON",
            alarm_off: "アラームはオフです",
            alarm_on: "アラーム設定: ",
            alarm_Disable: "アラームを無効にする",
            alarm_Enable: "アラームを有効にする",
            alarm_ringing: "🔔 アラーム鳴動中！",
            snoozing: "💤 スヌーズ中（あと約{minutes}分）",
            stop_alarm: "🔇 停止",
            snooze: "💤 5分後に再通知",
            no_laps: "ラップはまだ記録されていません",
            timer_finished: "タイマーが終了しました！",
            timer_finished_notification: "設定時間が経過しました"
        },
        en: {
            app_title: "Time Utility",
            timer_title: "Timer",
            timer_subtitle: "Countdown",
            stopwatch_title: "Stopwatch",
            stopwatch_subtitle: "Elapsed Time",
            alarm_title: "Alarm",
            alarm_subtitle: "Time Alert",
            world_title: "World Clock",
            world_subtitle: "Time Zones",
            "1min": "1min", "3min": "3min", "5min": "5min", "10min": "10min",
            "15min": "15min", "30min": "30min", "60min": "60min",
            start: "▶ Start",
            pause: "⏸ Pause",
            reset: "↺ Reset",
            lap: "🏁 Lap",
            off: "OFF",
            on: "ON",
            alarm_off: "Alarm is off",
            alarm_on: "Alarm set: ",
            alarm_Disable: "Disable alarm",
            alarm_Enable: "Enable alarm",
            alarm_ringing: "🔔 Alarm ringing!",
            snoozing: "💤 Snoozing (about {minutes} min)",
            stop_alarm: "🔇 Stop",
            snooze: "💤 Snooze 5min",
            no_laps: "No laps recorded",
            timer_finished: "Timer finished!",
            timer_finished_notification: "Time is up."
        }
    };

    let currentLang = localStorage.getItem("lang") || "ja";
    function t(key, params = {}) {
        let str = translations[currentLang]?.[key] || translations.ja[key] || key;
        Object.keys(params).forEach(k => str = str.replace(`{${k}}`, params[k]));
        return str;
    }
    function applyLanguage() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            el.textContent = t(el.getAttribute("data-i18n"));
        });
    }

    function setTheme(isDark) {
        document.body.classList.toggle("light", !isDark);
        document.getElementById("themeBtn").textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("darkMode", isDark ? "true" : "false");
    }
    const savedDark = localStorage.getItem("darkMode");
    setTheme(savedDark === null ? true : savedDark === "true");

    // DOM
    const $currentClock = document.getElementById('currentClock');
    const $currentDate = document.getElementById('currentDate');
    const $timerDisplay = document.getElementById('timerDisplay');
    const $timerProgressFg = document.getElementById('timerProgressFg');
    const $timerStartBtn = document.getElementById('timerStartBtn');
    const $timerPauseBtn = document.getElementById('timerPauseBtn');
    const $timerResetBtn = document.getElementById('timerResetBtn');
    const $timerPresets = document.getElementById('timerPresets');
    const $stopwatchMain = document.getElementById('stopwatchMain');
    const $stopwatchMillis = document.getElementById('stopwatchMillis');
    const $stopwatchStartBtn = document.getElementById('stopwatchStartBtn');
    const $stopwatchPauseBtn = document.getElementById('stopwatchPauseBtn');
    const $stopwatchLapBtn = document.getElementById('stopwatchLapBtn');
    const $stopwatchResetBtn = document.getElementById('stopwatchResetBtn');
    const $lapList = document.getElementById('lapList');
    const $alarmHour = document.getElementById('alarmHour');
    const $alarmMinute = document.getElementById('alarmMinute');
    const $alarmEnableBtn = document.getElementById('alarmEnableBtn');
    const $alarmStatus = document.getElementById('alarmStatus');
    const $alarmRingingActions = document.getElementById('alarmRingingActions');
    const $alarmStopBtn = document.getElementById('alarmStopBtn');
    const $alarmSnoozeBtn = document.getElementById('alarmSnoozeBtn');
    const $worldClockList = document.getElementById('worldClockList');
    const $toast = document.getElementById('toast');
    const $modalOverlay = document.getElementById('modal-overlay');
    const $modalContent = document.getElementById('modal-content');
    const $modalHeader = document.getElementById('modalHeader');
    const $modalBody = document.getElementById('modalBody');

    const CIRCUMFERENCE = 2 * Math.PI * 100;
    $timerProgressFg.style.strokeDasharray = CIRCUMFERENCE;
    $timerProgressFg.style.strokeDashoffset = '0';

    // 状態
    let timerTotalSeconds = 0;
    let timerEndTime = null;
    let timerIsRunning = false;
    let timerIntervalId = null;
    let timerEditing = false;
    let rawDigits = "000000";

    let stopwatchAccumulated = 0;
    let stopwatchStartTime = null;
    let stopwatchIsRunning = false;
    let stopwatchIntervalId = null;
    let lapTimes = [];
    let bestLapIndex = -1;

    let alarmEnabled = false;
    let alarmHour = 7;
    let alarmMinute = 0;
    let alarmIsRinging = false;
    let alarmSnoozeUntil = null;
    let alarmCheckIntervalId = null;
    let alarmRingIntervalId = null;

    let sharedAudioCtx = null;
    let toastTimeout = null;
    let timerSoundInterval = null;
    let timerSoundCount = 0;
    const TIMER_SOUND_MAX = 60;

    const STORAGE_KEY = 'timeUtilityStateV2';
    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timer: { totalSeconds: timerTotalSeconds, endTime: timerEndTime, isRunning: timerIsRunning },
            stopwatch: { accumulated: stopwatchAccumulated, startTime: stopwatchStartTime, isRunning: stopwatchIsRunning, lapTimes },
            alarm: { enabled: alarmEnabled, hour: alarmHour, minute: alarmMinute, snoozeUntil: alarmSnoozeUntil }
        }));
    }
    function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
            const state = JSON.parse(saved);
            if (state.timer) {
                timerTotalSeconds = state.timer.totalSeconds || 0;
                timerIsRunning = state.timer.isRunning || false;
                timerEndTime = state.timer.endTime || null;
                if (timerIsRunning && timerEndTime) {
                    const rem = timerEndTime - Date.now();
                    if (rem <= 0) { timerIsRunning = false; timerEndTime = null; timerTotalSeconds = 0; }
                    else timerTotalSeconds = Math.ceil(rem / 1000);
                }
            }
            if (state.stopwatch) {
                stopwatchAccumulated = state.stopwatch.accumulated || 0;
                stopwatchIsRunning = state.stopwatch.isRunning || false;
                stopwatchStartTime = state.stopwatch.startTime || null;
                lapTimes = state.stopwatch.lapTimes || [];
                if (stopwatchIsRunning && stopwatchStartTime) {
                    stopwatchAccumulated += Date.now() - stopwatchStartTime;
                    stopwatchStartTime = Date.now();
                }
            }
            if (state.alarm) {
                alarmEnabled = state.alarm.enabled || false;
                alarmHour = state.alarm.hour ?? 7;
                alarmMinute = state.alarm.minute ?? 0;
                alarmSnoozeUntil = state.alarm.snoozeUntil || null;
            }
        } catch(e) { localStorage.removeItem(STORAGE_KEY); }
    }

    function resumeRunningTools() {
        if (timerIsRunning && timerEndTime) {
            timerIntervalId = setInterval(timerTick, 100);
            $timerStartBtn.classList.add('hidden');
            $timerPauseBtn.classList.remove('hidden');
            updateTimerDisplay();
        }
        if (stopwatchIsRunning) {
            stopwatchIntervalId = setInterval(updateStopwatchDisplay, 50);
            $stopwatchStartBtn.classList.add('hidden');
            $stopwatchPauseBtn.classList.remove('hidden');
            $stopwatchLapBtn.disabled = false;
        }
        if (alarmEnabled) startAlarmCheck();
    }

    function getAudioCtx() {
        if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
        return sharedAudioCtx;
    }
    function playBeep(duration = 200, freq = 880) {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration/1000);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + duration/1000);
        } catch(e) {}
    }
    function startTimerSound() {
        stopTimerSound();
        timerSoundCount = 0;
        function beepLoop() {
            if (timerSoundCount >= TIMER_SOUND_MAX) { stopTimerSound(); return; }
            playBeep(200, 880);
            timerSoundCount++;
            timerSoundInterval = setTimeout(beepLoop, 300);
        }
        beepLoop();
    }
    function stopTimerSound() {
        if (timerSoundInterval) { clearTimeout(timerSoundInterval); timerSoundInterval = null; }
    }
    function playAlarmSound() {
        stopAlarmSound();
        function ring() { playBeep(180, 1000); setTimeout(() => playBeep(180, 700), 150); }
        ring();
        alarmRingIntervalId = setInterval(ring, 2000);
    }
    function stopAlarmSound() {
        if (alarmRingIntervalId) { clearInterval(alarmRingIntervalId); alarmRingIntervalId = null; }
    }

    function showToast(msg) {
        if (toastTimeout) clearTimeout(toastTimeout);
        $toast.textContent = msg; $toast.classList.add('show');
        toastTimeout = setTimeout(() => $toast.classList.remove('show'), 2200);
    }
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    }
    function sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '⏰', tag: 'time-utility' });
        }
    }

    function secondsToRawDigits(totalSec) {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}${String(s).padStart(2,'0')}`;
    }
    function rawDigitsToSeconds(digits) {
        const h = parseInt(digits.slice(0,2)) || 0;
        const m = Math.min(parseInt(digits.slice(2,4)) || 0, 59);
        const s = Math.min(parseInt(digits.slice(4,6)) || 0, 59);
        return h * 3600 + m * 60 + s;
    }
    function rawDigitsToDisplay(digits) {
        return `${digits.slice(0,2)}:${digits.slice(2,4)}:${digits.slice(4,6)}`;
    }

    function updateTimerDisplay() {
        if (timerEditing) {
            $timerDisplay.value = rawDigitsToDisplay(rawDigits);
        } else {
            const rem = getTimerRemainingMs();
            const sec = Math.ceil(rem / 1000);
            rawDigits = secondsToRawDigits(sec);
            $timerDisplay.value = rawDigitsToDisplay(rawDigits);
        }
        updateTimerProgress(timerIsRunning ? getTimerRemainingMs() : timerTotalSeconds * 1000);
    }
    function updateTimerProgress(remainingMs) {
        const totalMs = timerTotalSeconds * 1000;
        if (totalMs <= 0) {
            $timerProgressFg.style.strokeDashoffset = CIRCUMFERENCE;
            $timerProgressFg.classList.remove('warning','danger');
            return;
        }
        const fraction = Math.max(0, Math.min(1, remainingMs / totalMs));
        $timerProgressFg.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
        $timerProgressFg.classList.remove('warning','danger');
        if (fraction < 0.1) $timerProgressFg.classList.add('danger');
        else if (fraction < 0.25) $timerProgressFg.classList.add('warning');
    }
    function updatePresetActive() {
        document.querySelectorAll('#timerPresets .preset-btn').forEach(btn => {
            const sec = parseInt(btn.dataset.seconds);
            btn.classList.toggle('active', sec === timerTotalSeconds && !timerIsRunning && !timerEditing && !timerEndTime);
        });
    }

    function getTimerRemainingMs() {
        if (!timerEndTime) return timerTotalSeconds * 1000;
        return Math.max(0, timerEndTime - Date.now());
    }

    function enableTimerEditing() {
        if (timerIsRunning) return;
        timerEditing = true;
        $timerDisplay.removeAttribute('readonly');
        $timerDisplay.focus();
        $timerDisplay.setSelectionRange(0, $timerDisplay.value.length);
    }
    function disableTimerEditing() {
        $timerDisplay.setAttribute('readonly', 'readonly');
        timerEditing = false;
    }

    function getRawIndexFromCursor(pos) {
        if (pos <= 2) return pos;
        if (pos <= 5) return pos - 1;
        return Math.min(pos - 2, 5);
    }
    function getCursorPosFromRawIndex(rawIdx) {
        if (rawIdx <= 2) return rawIdx;
        if (rawIdx <= 4) return rawIdx + 1;
        return rawIdx + 2;
    }
    function clampDigitForPosition(rawIdx, digit) {
        if ((rawIdx === 2 || rawIdx === 4) && digit > '5') return '5';
        return digit;
    }

    function commitTimerEdit() {
        const totalSec = rawDigitsToSeconds(rawDigits);
        if (totalSec <= 0) {
            showToast('1秒以上を設定してください');
            return false;
        }
        timerTotalSeconds = totalSec;
        timerEndTime = null;
        return true;
    }

    $timerDisplay.addEventListener('click', () => {
        if (!timerEditing && !timerIsRunning) enableTimerEditing();
    });
    $timerDisplay.addEventListener('keydown', (e) => {
        if (!timerEditing) return;
        const pos = $timerDisplay.selectionStart;
        const rawIdx = getRawIndexFromCursor(pos);
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (commitTimerEdit()) {
                disableTimerEditing();
                updateTimerDisplay();
                updatePresetActive();
                saveState();
                $timerDisplay.blur();
            }
            return;
        }
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (rawIdx > 0) {
                rawDigits = rawDigits.slice(0, rawIdx-1) + rawDigits.slice(rawIdx) + '0';
                updateTimerDisplay();
                const newPos = getCursorPosFromRawIndex(rawIdx - 1);
                $timerDisplay.setSelectionRange(newPos, newPos);
            }
            return;
        }
        if (e.key === 'Delete') {
            e.preventDefault();
            if (rawIdx < 5) {
                rawDigits = rawDigits.slice(0, rawIdx) + rawDigits.slice(rawIdx+1) + '0';
                updateTimerDisplay();
                const newPos = getCursorPosFromRawIndex(rawIdx);
                $timerDisplay.setSelectionRange(newPos, newPos);
            }
            return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            let digit = e.key;
            digit = clampDigitForPosition(rawIdx, digit);
            rawDigits = rawDigits.substr(0, rawIdx) + digit + rawDigits.substr(rawIdx+1);
            updateTimerDisplay();
            const newIdx = Math.min(rawIdx + 1, 5);
            const newPos = getCursorPosFromRawIndex(newIdx);
            $timerDisplay.setSelectionRange(newPos, newPos);
        }
    });
    $timerDisplay.addEventListener('blur', () => {
        if (timerEditing) {
            if (commitTimerEdit()) {
                disableTimerEditing();
                updateTimerDisplay();
                updatePresetActive();
                saveState();
            } else {
                rawDigits = secondsToRawDigits(timerTotalSeconds);
                updateTimerDisplay();
                disableTimerEditing();
            }
        }
    });

    function startTimer() {
        if (timerIsRunning) return;
        const remaining = getTimerRemainingMs();
        if (remaining <= 0) return;
        timerEndTime = Date.now() + remaining;
        timerTotalSeconds = Math.ceil(remaining/1000);
        timerIsRunning = true;
        if (timerEditing) disableTimerEditing();
        $timerStartBtn.classList.add('hidden');
        $timerPauseBtn.classList.remove('hidden');
        timerIntervalId = setInterval(timerTick, 100);
        updateTimerDisplay();
        updatePresetActive();
        saveState();
        requestNotificationPermission();
    }
    function pauseTimer() {
        if (!timerIsRunning) return;
        const remaining = getTimerRemainingMs();
        timerTotalSeconds = Math.ceil(remaining/1000);
        timerEndTime = null;
        timerIsRunning = false;
        clearInterval(timerIntervalId);
        $timerStartBtn.classList.remove('hidden');
        $timerPauseBtn.classList.add('hidden');
        updateTimerDisplay();
        updatePresetActive();
        saveState();
    }
    function resetTimer() {
        pauseTimer();
        timerTotalSeconds = 0;
        rawDigits = "000000";
        updateTimerDisplay();
        $timerProgressFg.style.strokeDashoffset = CIRCUMFERENCE;
        $timerProgressFg.classList.remove('warning','danger');
        updatePresetActive();
        saveState();
    }
    function timerTick() {
        updateTimerDisplay();
        if (getTimerRemainingMs() <= 0) {
            pauseTimer();
            timerTotalSeconds = 0;
            rawDigits = "000000";
            $timerDisplay.value = "00:00:00";
            $timerProgressFg.style.strokeDashoffset = CIRCUMFERENCE;
            $timerProgressFg.classList.remove('warning','danger');
            $timerStartBtn.classList.remove('hidden');
            $timerPauseBtn.classList.add('hidden');
            showToast(t('timer_finished'));
            startTimerSound();
            sendNotification(t('timer_finished'), t('timer_finished_notification'));
            saveState();
        }
    }

    $timerPresets.addEventListener('click', e => {
        const btn = e.target.closest('.preset-btn');
        if (!btn || timerIsRunning) return;
        const sec = parseInt(btn.dataset.seconds);
        if (!isNaN(sec)) {
            timerTotalSeconds = sec;
            timerEndTime = null;
            rawDigits = secondsToRawDigits(sec);
            updateTimerDisplay();
            updatePresetActive();
            $timerProgressFg.style.strokeDashoffset = '0';
            $timerProgressFg.classList.remove('warning','danger');
            saveState();
        }
    });
    $timerStartBtn.addEventListener('click', startTimer);
    $timerPauseBtn.addEventListener('click', pauseTimer);
    $timerResetBtn.addEventListener('click', resetTimer);

    // ストップウォッチ
    function getStopwatchElapsed() {
        if (stopwatchIsRunning && stopwatchStartTime) return stopwatchAccumulated + (Date.now() - stopwatchStartTime);
        return stopwatchAccumulated;
    }
    function updateStopwatchDisplay() {
        const total = getStopwatchElapsed();
        const h = Math.floor(total/3600000), m = Math.floor((total%3600000)/60000);
        const s = Math.floor((total%60000)/1000), cs = Math.floor((total%1000)/10);
        $stopwatchMain.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        $stopwatchMillis.textContent = `.${String(cs).padStart(2,'0')}`;
    }
    function updateLapList() {
        $lapList.innerHTML = '';
        if (lapTimes.length === 0) {
            $lapList.innerHTML = `<div class="no-laps">${t('no_laps')}</div>`;
            return;
        }
        bestLapIndex = 0;
        for (let i=1; i<lapTimes.length; i++) {
            if (lapTimes[i].lapTime < lapTimes[bestLapIndex].lapTime) bestLapIndex = i;
        }
        lapTimes.forEach((lap, idx) => {
            const div = document.createElement('div');
            div.className = 'lap-item' + (idx === bestLapIndex ? ' best' : '');
            const lapH = Math.floor(lap.lapTime/3600000), lapM = Math.floor((lap.lapTime%3600000)/60000);
            const lapS = Math.floor((lap.lapTime%60000)/1000), lapCS = Math.floor((lap.lapTime%1000)/10);
            const totalH = Math.floor(lap.totalTime/3600000), totalM = Math.floor((lap.totalTime%3600000)/60000);
            const totalS = Math.floor((lap.totalTime%60000)/1000);
            div.innerHTML = `<span class="lap-label">ラップ ${lap.lapNum}</span>
                             <span class="lap-time">${String(lapH).padStart(2,'0')}:${String(lapM).padStart(2,'0')}:${String(lapS).padStart(2,'0')}.${String(lapCS).padStart(2,'0')}</span>
                             <span style="font-size:0.65rem;color:var(--text-secondary);">(計 ${String(totalH).padStart(2,'0')}:${String(totalM).padStart(2,'0')}:${String(totalS).padStart(2,'0')})</span>`;
            $lapList.appendChild(div);
        });
        $lapList.scrollTop = $lapList.scrollHeight;
    }
    function startStopwatch() {
        if (stopwatchIsRunning) return;
        stopwatchStartTime = Date.now();
        stopwatchIsRunning = true;
        $stopwatchStartBtn.classList.add('hidden');
        $stopwatchPauseBtn.classList.remove('hidden');
        $stopwatchLapBtn.disabled = false;
        stopwatchIntervalId = setInterval(updateStopwatchDisplay, 50);
        updateStopwatchDisplay();
        saveState();
    }
    function pauseStopwatch() {
        if (!stopwatchIsRunning) return;
        stopwatchAccumulated += Date.now() - stopwatchStartTime;
        stopwatchStartTime = null;
        stopwatchIsRunning = false;
        clearInterval(stopwatchIntervalId);
        $stopwatchStartBtn.classList.remove('hidden');
        $stopwatchPauseBtn.classList.add('hidden');
        updateStopwatchDisplay();
        saveState();
    }
    function resetStopwatch() {
        pauseStopwatch();
        stopwatchAccumulated = 0; stopwatchStartTime = null;
        lapTimes = []; bestLapIndex = -1;
        $stopwatchLapBtn.disabled = true;
        updateStopwatchDisplay(); updateLapList();
        saveState();
    }
    function recordLap() {
        const total = getStopwatchElapsed();
        const prevTotal = lapTimes.length ? lapTimes[lapTimes.length-1].totalTime : 0;
        lapTimes.push({ lapNum: lapTimes.length+1, lapTime: total - prevTotal, totalTime: total });
        updateLapList();
        playBeep(80, 1200);
        saveState();
    }

    $stopwatchStartBtn.addEventListener('click', startStopwatch);
    $stopwatchPauseBtn.addEventListener('click', pauseStopwatch);
    $stopwatchResetBtn.addEventListener('click', resetStopwatch);
    $stopwatchLapBtn.addEventListener('click', recordLap);

    // アラーム
    function getAlarmTimeString() {
        return `${String(alarmHour).padStart(2,'0')}:${String(alarmMinute).padStart(2,'0')}`;
    }
    function updateAlarmDisplay() {
        $alarmHour.textContent = String(alarmHour).padStart(2, '0');
        $alarmMinute.textContent = String(alarmMinute).padStart(2, '0');
    }
    function updateEnableButton() {
        if (alarmEnabled) {
            $alarmEnableBtn.textContent = '🔕 アラームを無効にする';
            $alarmEnableBtn.classList.add('active');
        } else {
            $alarmEnableBtn.textContent = '🔔 アラームを有効にする';
            $alarmEnableBtn.classList.remove('active');
        }
    }
    function updateAlarmUI() {
        updateAlarmDisplay();
        updateEnableButton();
        if (alarmIsRinging) {
            $alarmStatus.textContent = t('alarm_ringing');
            $alarmStatus.classList.add('ringing');
            $alarmRingingActions.classList.remove('hidden');
            document.getElementById('alarmCard').classList.add('ringing');
        } else if (alarmSnoozeUntil && Date.now() < alarmSnoozeUntil) {
            const mins = Math.ceil((alarmSnoozeUntil - Date.now()) / 60000);
            $alarmStatus.textContent = t('snoozing', { minutes: mins });
            $alarmStatus.classList.remove('ringing');
            $alarmRingingActions.classList.add('hidden');
            document.getElementById('alarmCard').classList.remove('ringing');
        } else if (alarmEnabled) {
            $alarmStatus.textContent = t('alarm_on') + getAlarmTimeString();
            $alarmStatus.classList.remove('ringing');
            $alarmRingingActions.classList.add('hidden');
            document.getElementById('alarmCard').classList.remove('ringing');
        } else {
            $alarmStatus.textContent = t('alarm_off');
            $alarmStatus.classList.remove('ringing');
            $alarmRingingActions.classList.add('hidden');
            document.getElementById('alarmCard').classList.remove('ringing');
        }
    }

    document.querySelectorAll('.arrow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (alarmIsRinging) return;
            const target = btn.dataset.target;
            const direction = btn.classList.contains('up') ? 1 : -1;
            if (target === 'hour') alarmHour = (alarmHour + direction + 24) % 24;
            else if (target === 'minute') alarmMinute = (alarmMinute + direction + 60) % 60;
            updateAlarmDisplay();
            saveState();
        });
    });

    $alarmEnableBtn.addEventListener('click', () => {
        if (alarmIsRinging) { stopAlarm(); return; }
        alarmEnabled = !alarmEnabled;
        alarmSnoozeUntil = null;
        updateAlarmUI();
        saveState();
        if (alarmEnabled) { requestNotificationPermission(); startAlarmCheck(); }
        else { if (alarmCheckIntervalId) clearInterval(alarmCheckIntervalId); stopAlarmSound(); }
    });

    function checkAlarm() {
        if (!alarmEnabled || alarmIsRinging) return;
        if (alarmSnoozeUntil && Date.now() < alarmSnoozeUntil) { updateAlarmUI(); return; }
        if (alarmSnoozeUntil && Date.now() >= alarmSnoozeUntil) { alarmSnoozeUntil = null; saveState(); }
        const now = new Date();
        if (now.getHours() === alarmHour && now.getMinutes() === alarmMinute) triggerAlarm();
    }
    function triggerAlarm() {
        alarmIsRinging = true;
        updateAlarmUI();
        playAlarmSound();
        sendNotification(t('alarm_title'), `${t('alarm_on')}${getAlarmTimeString()}`);
        saveState();
    }
    function stopAlarm() {
        alarmIsRinging = false; alarmSnoozeUntil = null;
        stopAlarmSound(); updateAlarmUI(); saveState();
    }
    function snoozeAlarm() {
        alarmIsRinging = false;
        alarmSnoozeUntil = Date.now() + 5*60*1000;
        stopAlarmSound(); updateAlarmUI();
        showToast('5分後に再通知します');
        saveState();
    }
    $alarmStopBtn.addEventListener('click', stopAlarm);
    $alarmSnoozeBtn.addEventListener('click', snoozeAlarm);

    function startAlarmCheck() {
        if (alarmCheckIntervalId) clearInterval(alarmCheckIntervalId);
        alarmCheckIntervalId = setInterval(checkAlarm, 1000);
    }

    // 世界時計
    function getTimezoneList() {
        if (typeof Intl === 'undefined' || !Intl.supportedValuesOf) return ['UTC','Asia/Tokyo','America/New_York','Europe/London'];
        try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC']; }
    }
    function getLocalTimeForZone(tz) {
        try {
            const now = new Date();
            const time = now.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, timeZone: tz });
            const date = now.toLocaleDateString('ja-JP', { weekday:'short', month:'numeric', day:'numeric', timeZone: tz });
            return { time, date };
        } catch { return { time:'--:--:--', date:'' }; }
    }
    function getOffsetString(tz) {
        try {
            const now = new Date();
            const utc = now.toLocaleString('en-US', { timeZone:'UTC', hour:'2-digit', minute:'2-digit', hour12:false });
            const local = now.toLocaleString('en-US', { timeZone: tz, hour:'2-digit', minute:'2-digit', hour12:false });
            const [uh,um] = utc.split(':').map(Number), [lh,lm] = local.split(':').map(Number);
            let diff = (lh*60+lm) - (uh*60+um);
            if (diff > 720) diff -= 1440; else if (diff < -720) diff += 1440;
            const sign = diff >= 0 ? '+' : '-', absH = Math.floor(Math.abs(diff)/60), absM = Math.abs(diff)%60;
            return `UTC${sign}${String(absH).padStart(2,'0')}:${String(absM).padStart(2,'0')}`;
        } catch { return ''; }
    }
    function renderWorldClocks() {
        const tzs = getTimezoneList();
        $worldClockList.innerHTML = '';
        tzs.forEach(tz => {
            const { time, date } = getLocalTimeForZone(tz);
            const offset = getOffsetString(tz);
            const row = document.createElement('div');
            row.className = 'world-city-row';
            row.innerHTML = `<div class="world-city-info"><div class="world-city-name">${tz.replace(/_/g,' ')}</div><div class="world-city-offset">${offset}</div></div>
                             <div><div class="world-city-time">${time}</div><div class="world-city-date">${date}</div></div>`;
            $worldClockList.appendChild(row);
        });
    }

    // 最大化モーダル
    let currentMaximizedCard = null;
    function openMaximized(card) {
        if (currentMaximizedCard) return;
        currentMaximizedCard = card;
        const cardBody = card.querySelector('.card-body');
        const cardTitle = card.querySelector('.card-title').textContent;
        $modalHeader.textContent = cardTitle;
        $modalBody.innerHTML = '';
        $modalBody.appendChild(cardBody);
        // タイマー/アラーム用クラス付与
        $modalContent.className = 'modal-content';
        if (card.id === 'timerCard') $modalContent.classList.add('timer-modal');
        else if (card.id === 'alarmCard') $modalContent.classList.add('alarm-modal');
        $modalOverlay.classList.remove('hidden');
        void $modalContent.offsetWidth;
    }
    function closeMaximized() {
        if (!currentMaximizedCard) return;
        const cardBody = $modalBody.querySelector('.card-body');
        if (cardBody) currentMaximizedCard.appendChild(cardBody);
        $modalOverlay.classList.add('hidden');
        $modalContent.className = 'modal-content';
        currentMaximizedCard = null;
    }

    document.querySelectorAll('.clickable-maximize').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.closest('button, input, .arrow-btn, .toggle-wrap')) return;
            const card = header.closest('.card');
            if (currentMaximizedCard === card) closeMaximized();
            else if (!currentMaximizedCard) openMaximized(card);
        });
    });
    $modalOverlay.addEventListener('click', (e) => {
        if (e.target === $modalOverlay) closeMaximized();
    });

    // 言語・テーマ
    document.getElementById('langBtn').addEventListener('click', () => {
        currentLang = currentLang === 'ja' ? 'en' : 'ja';
        localStorage.setItem('lang', currentLang);
        applyLanguage();
        document.getElementById('langBtn').textContent = currentLang === 'ja' ? 'EN' : 'JA';
        updateAlarmUI();
    });
    document.getElementById('themeBtn').addEventListener('click', () => {
        setTheme(!document.body.classList.contains('light'));
    });

    function updateCurrentClock() {
        const now = new Date();
        $currentClock.childNodes[0].textContent = now.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
        $currentDate.textContent = now.toLocaleDateString('ja-JP', { weekday:'short', month:'numeric', day:'numeric' });
    }

    function init() {
        loadState();
        applyLanguage();
        updateCurrentClock();
        rawDigits = secondsToRawDigits(timerTotalSeconds);
        updateTimerDisplay();
        updatePresetActive();
        updateStopwatchDisplay();
        updateLapList();
        updateAlarmUI();
        renderWorldClocks();
        resumeRunningTools();
        setInterval(updateCurrentClock, 1000);
        setInterval(renderWorldClocks, 10000);
        window.addEventListener('beforeunload', saveState);
    }
    init();
})();