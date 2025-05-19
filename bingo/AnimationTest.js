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

let luckBgmPlaying = false, max = 999, availableNumbers = [], history = [], running = false, soundEnabled = true;
const soundIcons = ['🔈','🔉','🔊','🔔','🎵','🎶'];
let soundIconIdx = 4;
audioToggle.textContent = soundIcons[soundIconIdx];

luckBgmBtn.onclick = () => {
  luckBgmPlaying ? (luckBgm.pause(), luckBgm.currentTime=0, luckBgmBtn.textContent='More bgm') :
    (luckBgm.play(), luckBgmBtn.textContent='bgm on');
  luckBgmPlaying = !luckBgmPlaying;
};
luckBgm.addEventListener('pause', () => {
  luckBgmPlaying = false;
  luckBgmBtn.textContent = 'More bgm';
});

audioToggle.onclick = () => {
  soundEnabled = !soundEnabled;
  soundIconIdx = (soundIconIdx + 1) % soundIcons.length;
  audioToggle.textContent = soundEnabled ? soundIcons[soundIconIdx] : '🔇';
};

document.body.addEventListener('click', () => { bgm.play().then(()=>bgm.pause()); }, { once: true });

function playSoundSection(start, end) {
  if (!soundEnabled) return;
  try {
    bgm.pause(); bgm.currentTime = start;
    const handler = () => { if (bgm.currentTime >= end) { bgm.pause(); bgm.removeEventListener('timeupdate', handler); } };
    bgm.addEventListener('timeupdate', handler);
    bgm.addEventListener('seeked', function play() { bgm.play(); bgm.removeEventListener('seeked', play); });
  } catch (err) { }
}

function getDigitRange(pos) {
  let digits = new Set();
  for (let i = 1; i <= max; i++) digits.add(i.toString().padStart(3, '0')[pos]);
  return Array.from(digits);
}

function updateSlotsDisplay(num) {
  let str = num.toString().padStart(3, '0');
  slots.hundreds.style.visibility = 'visible';
  slots.tens.style.visibility = 'visible';
  slots.ones.style.visibility = 'visible';
  slots.hundreds.querySelector('.number').textContent = (max >= 100) ? str[0] : '';
  slots.tens.querySelector('.number').textContent = (max >= 10) ? str[1] : '';
  slots.ones.querySelector('.number').textContent = str[2];
}

function updateStartBtns() {
  startBtn.disabled = availableNumbers.length === 0;
  start10Btn.disabled = availableNumbers.length < 10;
}

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

function addHistory(num) {
  history.push(num);
  renderHistory();
  historyHorizontal.scrollLeft = historyHorizontal.scrollWidth;
}

function renderHistory() {
  historyHorizontal.innerHTML = '';
  history.forEach((num, idx) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<span class="history-label">Round ${idx + 1}:</span>${num}`;
    historyHorizontal.appendChild(div);
  });
}

function animateSlots(finalNum, callback) {
  running = true; startBtn.disabled = true; start10Btn.disabled = true;
  if (soundEnabled) playSoundSection(3, 8);
  const str = finalNum.toString().padStart(3, '0');
  const duration = 4000;
  const slotEls = [slots.hundreds, slots.tens, slots.ones];
  const visible = [max >= 100, max >= 10, true];
  const digitRanges = [
    (max >= 100) ? getDigitRange(0) : [''],
    (max >= 10) ? getDigitRange(1) : [''],
    getDigitRange(2),
  ];
  function easeOutQuad(t) { return t * (2 - t); }
  function animateDigit(index, finalDigit, onStop) {
    let start = null;
    function roll(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      const frameInterval = 30 + eased * 90;
      if (elapsed % frameInterval < 16) {
        const range = digitRanges[index];
        const val = range[Math.floor(Math.random() * range.length)];
        slotEls[index].querySelector('.number').textContent = val;
      }
      if (progress < 1) requestAnimationFrame(roll);
      else { slotEls[index].querySelector('.number').textContent = finalDigit; onStop && onStop(); }
    }
    requestAnimationFrame(roll);
  }
  function startAll() {
    let delay = 0;
    for (let i = 0; i < 3; i++) {
      if (!visible[i]) continue;
      setTimeout(() => {
        animateDigit(i, str[i], () => {
          if (i === 2) {
            running = false;
            bgm.pause();
            updateStartBtns();
            callback && callback();
          }
        });
      }, delay);
      delay += 400;
    }
  }
  startAll();
}

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
  // 动画期间播放bgm
  if (soundEnabled) {
    bgm.currentTime = 3;
    bgm.play();
  }
  const duration = 4200;
  function easeOutQuad(t) { return t * (2 - t); }
  let stopCount = 0;
  for (let i = 0; i < 10; i++) {
    (function(idx){
      let start = null;
      function roll(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuad(progress);
        const frameInterval = 30 + eased * 90;
        if (elapsed % frameInterval < 16) {
          let rand = Math.floor(Math.random() * max) + 1;
          let str = rand.toString().padStart(3, '0');
          let digits = slotEls[idx].querySelectorAll('.slot10-digit');
          digits[0].textContent = (max >= 100) ? str[0] : '';
          digits[1].textContent = (max >= 10) ? str[1] : '';
          digits[2].textContent = str[2];
        }
        if (progress < 1) requestAnimationFrame(roll);
        else {
          let str = finalNums[idx].toString().padStart(3, '0');
          let digits = slotEls[idx].querySelectorAll('.slot10-digit');
          digits[0].textContent = (max >= 100) ? str[0] : '';
          digits[1].textContent = (max >= 10) ? str[1] : '';
          digits[2].textContent = str[2];
          stopCount++;
          if (stopCount === 10) {
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
        }
      }
      requestAnimationFrame(roll);
    })(i);
  }
}

start10Btn.onclick = () => {
  if (running || availableNumbers.length < 10) return;
  playSoundSection(0, 0.5);
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

startBtn.onclick = () => {
  if (running || availableNumbers.length === 0) return;
  playSoundSection(0, 0.5);
  setTimeout(() => {
    const idx = Math.floor(Math.random() * availableNumbers.length);
    const num = availableNumbers.splice(idx, 1)[0];
    animateSlots(num, () => { addHistory(num); });
  }, 500);
};

resetBtn.onclick = () => { playSoundSection(0, 0.5); resetGame(); };

function updateStartBtns() {
  startBtn.disabled = availableNumbers.length === 0;
  start10Btn.disabled = availableNumbers.length < 10;
}

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

draw10Video.onloadedmetadata = function() {
  const videoW = draw10Video.videoWidth, videoH = draw10Video.videoHeight;
  if(videoW && videoH) {
    const ratio = videoW / videoH;
    draw10Modal.querySelector('.modal-content').style.aspectRatio = ratio;
  }
};