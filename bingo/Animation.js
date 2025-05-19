const $ = id => document.getElementById(id);
const maxInput = $('maxInput'), resetBtn = $('resetBtn'), startBtn = $('startBtn');
const slots = { hundreds: $('hundreds'), tens: $('tens'), ones: $('ones') };
const historyHorizontal = $('historyHorizontal');
const audioToggle = $('audioToggle'), luckBgmBtn = $('luckBgmBtn');
const luckBgm = $('luckBgm'), bgm = $('bgm');
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

function resetGame() {
  let val = parseInt(maxInput.value, 10);
  if (isNaN(val) || val < 1 || val > 999) return alert('请输入1-999的数字');
  max = val; availableNumbers = [];
  for (let i = 1; i <= max; i++) availableNumbers.push(i);
  history = [];
  renderHistory();
  updateSlotsDisplay(max);
  startBtn.disabled = false;
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
  running = true; startBtn.disabled = true;
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
            startBtn.disabled = availableNumbers.length === 0;
            callback && callback();
          }
        });
      }, delay);
      delay += 400;
    }
  }
  startAll();
}

resetBtn.onclick = () => { playSoundSection(0, 0.5); resetGame(); };
startBtn.onclick = () => {
  if (running || availableNumbers.length === 0) return;
  playSoundSection(0, 0.5);
  setTimeout(() => {
    const idx = Math.floor(Math.random() * availableNumbers.length);
    const num = availableNumbers.splice(idx, 1)[0];
    animateSlots(num, () => { addHistory(num); });
  }, 500);
};

updateSlotsDisplay(999);
startBtn.disabled = true;
renderHistory();