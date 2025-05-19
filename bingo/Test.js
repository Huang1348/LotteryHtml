const $ = id => document.getElementById(id);
const maxInput = $('maxInput'), resetBtn = $('resetBtn'), startBtn = $('startBtn');
const start10Btn = $('start10Btn');
const slots = { hundreds: $('hundreds'), tens: $('tens'), ones: $('ones') };
const historyHorizontal = $('historyHorizontal');
const audioToggle = $('audioToggle'), luckBgmBtn = $('luckBgmBtn');
const luckBgm = $('luckBgm'), bgm = $('bgm');
const draw10Modal = $('draw10Modal');
const draw10Slots = $('draw10Slots');
const draw10Result = $('draw10Result');
const draw10VideoWrapper = $('draw10VideoWrapper');
const draw10Video = $('draw10Video');
luckBgm.volume = 0.3;

let luckBgmPlaying = false,
    max = 999,
    availableNumbers = [],
    history = [],
    running = false,
    soundEnabled = true;

// bgm按钮
luckBgmBtn.addEventListener('click', () => {
    luckBgmPlaying = !luckBgmPlaying;
    if (luckBgmPlaying) {
        luckBgm.play();
        luckBgmBtn.innerText = 'bgm on';
        console.log('bgm on');
    } else {
        luckBgm.pause();
        luckBgmBtn.innerText = 'More bgm';
        console.log('bgm off');
    }
});
luckBgm.addEventListener('pause', () => {
    luckBgmPlaying = false;
    luckBgmBtn.innerText = 'More bgm';
});

// 音效按钮
audioToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    audioToggle.innerText = soundEnabled ? '🎵' : '🔇';
    console.log('动画音效开关:', soundEnabled);
});

// 兼容自动播放
document.body.addEventListener('click', () => { bgm.play().then(()=>bgm.pause()); }, { once: true });

// bgm播放片段
function playBgmsection(start, end) {
    if (!soundEnabled) return;
    bgm.pause();
    bgm.currentTime = start;
    const onTimeUpdate = () => {
        if (bgm.currentTime >= end) {
            bgm.pause();
            bgm.removeEventListener('timeupdate', onTimeUpdate);
        }
    };
    bgm.addEventListener('timeupdate', onTimeUpdate);
    bgm.addEventListener('seeked', function playOnce() {
        bgm.play();
        bgm.removeEventListener('seeked', playOnce);
    });
}

// 获取某位数字所有可能
function getDigitRange(pos) {
    let digits = new Set();
    for (let i = 1; i <= max; i++) digits.add(i.toString().padStart(3, '0')[pos]);
    return Array.from(digits);
}

// 更新主slot显示
function updateSlotsDisplay(num) {
    let str = num.toString().padStart(3, '0');
    slots.hundreds.style.visibility = 'visible';
    slots.tens.style.visibility = 'visible';
    slots.ones.style.visibility = 'visible';
    slots.hundreds.querySelector('.number').textContent = (max >= 100) ? str[0] : '';
    slots.tens.querySelector('.number').textContent = (max >= 10) ? str[1] : '';
    slots.ones.querySelector('.number').textContent = str[2];
}

// 按钮可用性
function updateStartBtns() {
    startBtn.disabled = availableNumbers.length === 0;
    start10Btn.disabled = availableNumbers.length < 10;
}

// 重置
function resetGame() {
    let val = parseInt(maxInput.value, 10);
    if (isNaN(val) || val < 1 || val > 999) return alert('input number 1-999');
    max = val; availableNumbers = [];
    for (let i = 1; i <= max; i++) availableNumbers.push(i);
    history = [];
    renderHistory();
    updateSlotsDisplay(max);
    updateStartBtns();
}

// 添加历史
function addHistory(num) {
    history.push(num);
    renderHistory();
    historyHorizontal.scrollLeft = historyHorizontal.scrollWidth;
}

// 渲染历史
function renderHistory() {
    historyHorizontal.innerHTML = '';
    history.forEach((num, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<span class="history-label">Round ${idx + 1}:</span>${num}`;
        historyHorizontal.appendChild(div);
    });
}

// 单个slot动画（主抽奖专用，只显示一位）
function animateMainSlot(slotEl, finalDigit, duration = 4000, callback) {
    function easeOutQuad(t) { return t * (2 - t); }
    let start = null;
    function roll(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuad(progress);
        const frameInterval = 30 + eased * 90;
        if (elapsed % frameInterval < 16) {
            let rand = Math.floor(Math.random() * 10);
            slotEl.querySelector('.number').textContent = rand;
        }
        if (progress < 1) requestAnimationFrame(roll);
        else {
            slotEl.querySelector('.number').textContent = finalDigit;
            callback && callback();
        }
    }
    requestAnimationFrame(roll);
}

// 主抽奖动画
function animateSlots(finalNum, callback) {
    running = true; startBtn.disabled = true; start10Btn.disabled = true;
    if (soundEnabled) playBgmsection(3, 8);
    const str = finalNum.toString().padStart(3, '0');
    const slotEls = [slots.hundreds, slots.tens, slots.ones];
    const visible = [max >= 100, max >= 10, true];
    let finished = 0;
    slotEls.forEach((slot, i) => {
        if (!visible[i]) {
            finished++;
            return;
        }
        animateMainSlot(slot, str[i], 4000, () => {
            finished++;
            if (finished === 3) {
                running = false;
                bgm.pause();
                updateStartBtns();
                callback && callback();
            }
        });
    });
}
// 10连动画
function animate10Slots(finalNums, callback) {
    draw10Slots.innerHTML = '';
    draw10Result.innerHTML = '';
    let slotEls = [];
    for (let row = 0; row < 2; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'slot10-row';
        for (let col = 0; col < 5; col++) {
            const idx = row * 5 + col;
            const slot = document.createElement('div');
            slot.className = 'slot10';
            for (let d = 0; d < 3; d++) {
                const digit = document.createElement('div');
                digit.className = 'slot10-digit';
                digit.textContent = '?';
                slot.appendChild(digit);
            }
            rowDiv.appendChild(slot);
            slotEls.push(slot);
        }
        draw10Slots.appendChild(rowDiv);
    }
    running = true;
    if (soundEnabled) {
        bgm.currentTime = 3;
        bgm.play();
    }
    let finished = 0;
    for (let i = 0; i < 10; i++) {
        animateSlotElement(slotEls[i], finalNums[i], 4200, () => {
            finished++;
            if (finished === 10) {
                running = false;
                draw10Result.innerHTML = '';
                for (let r = 0; r < 2; r++) {
                    const row = document.createElement('div');
                    row.className = 'result-row';
                    for (let c = 0; c < 5; c++) {
                        const idx2 = r * 5 + c;
                        const span = document.createElement('span');
                        span.textContent = finalNums[idx2].toString().padStart(3, '0');
                        row.appendChild(span);
                    }
                    draw10Result.appendChild(row);
                }
                // 动画结束后，等bgm播放到结尾再回调
                if (soundEnabled && !bgm.paused && bgm.currentTime < bgm.duration - 0.1) {
                    const onBgmEnd = () => {
                        bgm.removeEventListener('ended', onBgmEnd);
                        callback && callback();
                    };
                    bgm.addEventListener('ended', onBgmEnd);
                } else {
                    callback && callback();
                }
            }
        });
    }
}

// 10连按钮
start10Btn.onclick = () => {
    if (running || availableNumbers.length < 10) return;
    playBgmsection(0, 0.5);
    setTimeout(() => {
        let nums = [];
        for (let i = 0; i < 10; i++) {
            const idx = Math.floor(Math.random() * availableNumbers.length);
            nums.push(availableNumbers.splice(idx, 1)[0]);
        }
        draw10Modal.style.display = 'flex';

        draw10VideoWrapper.style.display = 'flex';
        draw10Slots.style.display = 'none';
        draw10Result.style.display = 'none';
        draw10Video.currentTime = 0;
        draw10Video.play();
        let videoEnded = false;
        function finishVideo() {
            if (videoEnded) return;
            videoEnded = true;
            draw10Video.pause();
            draw10VideoWrapper.style.display = 'none';
            draw10Slots.style.display = '';
            draw10Result.style.display = '';
            animate10Slots(nums, () => {
                nums.forEach(addHistory);
                updateStartBtns();
            });
        }
        draw10Video.onended = finishVideo;
        draw10VideoWrapper.onclick = finishVideo;
        running = true;
        draw10Modal.onclick = (e) => {
            if (running) return;
            if (e.target === draw10Modal) {
                draw10Modal.style.display = 'none';
            }
        };
    }, 500);
};

// 单抽按钮
startBtn.onclick = () => {
    if (running || availableNumbers.length === 0) return;
    playBgmsection(0, 0.5);
    setTimeout(() => {
        const idx = Math.floor(Math.random() * availableNumbers.length);
        const num = availableNumbers.splice(idx, 1)[0];
        animateSlots(num, () => { addHistory(num); });
    }, 500);
};

// 重置按钮
resetBtn.onclick = () => { playBgmsection(0, 0.5); resetGame(); };

// 初始化
function init() {
    updateSlotsDisplay(999);
    updateStartBtns();
    renderHistory();
    draw10Modal.onclick = (e) => {
        if (running) return;
        if (e.target === draw10Modal) {
            draw10Modal.style.display = 'none';
        }
    };
}
init();

// 视频自适应
draw10Video.onloadedmetadata = function() {
    const videoW = draw10Video.videoWidth, videoH = draw10Video.videoHeight;
    if(videoW && videoH) {
        const ratio = videoW / videoH;
        draw10Modal.querySelector('.modal-content').style.aspectRatio = ratio;
    }
};