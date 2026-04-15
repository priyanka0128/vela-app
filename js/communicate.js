// ── Pictogram data ──────────────────────────────────
const PICTOGRAMS = {
  basic: [
    { emoji: '✅', label: 'Yes' },
    { emoji: '❌', label: 'No' },
    { emoji: '🙏', label: 'Please' },
    { emoji: '🙌', label: 'Thank you' },
    { emoji: '🆘', label: 'Help' },
    { emoji: '⏳', label: 'Wait' },
    { emoji: '👋', label: 'Hello' },
    { emoji: '👍', label: 'Good' },
    { emoji: '👎', label: 'Bad' },
    { emoji: '🔄', label: 'Again' },
    { emoji: '🏠', label: 'Home' },
    { emoji: '💤', label: 'Sleep' }
  ],
  feelings: [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😤', label: 'Angry' },
    { emoji: '😨', label: 'Scared' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🤕', label: 'Pain' },
    { emoji: '🥰', label: 'Love' },
    { emoji: '😰', label: 'Worried' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '🤔', label: 'Confused' },
    { emoji: '😤', label: 'Frustrated' },
    { emoji: '🤗', label: 'Grateful' }
  ],
  food: [
    { emoji: '🍽️', label: 'Eat' },
    { emoji: '🥤', label: 'Drink' },
    { emoji: '💧', label: 'Water' },
    { emoji: '☕', label: 'Coffee' },
    { emoji: '🍞', label: 'Bread' },
    { emoji: '🍎', label: 'Fruit' },
    { emoji: '🍲', label: 'Soup' },
    { emoji: '🧃', label: 'Juice' },
    { emoji: '🍪', label: 'Snack' },
    { emoji: '🥛', label: 'Milk' },
    { emoji: '🍌', label: 'Banana' },
    { emoji: '🥗', label: 'Salad' }
  ],
  body: [
    { emoji: '🤢', label: 'Nausea' },
    { emoji: '🤒', label: 'Fever' },
    { emoji: '💊', label: 'Medicine' },
    { emoji: '🚽', label: 'Toilet' },
    { emoji: '🛁', label: 'Bath' },
    { emoji: '👕', label: 'Clothes' },
    { emoji: '🦷', label: 'Teeth' },
    { emoji: '💪', label: 'Exercise' },
    { emoji: '🩺', label: 'Doctor' },
    { emoji: '🧴', label: 'Cream' },
    { emoji: '🌡️', label: 'Temperature' },
    { emoji: '💉', label: 'Injection' }
  ],
  actions: [
    { emoji: '📱', label: 'Phone' },
    { emoji: '📺', label: 'TV' },
    { emoji: '🎵', label: 'Music' },
    { emoji: '📖', label: 'Read' },
    { emoji: '✍️', label: 'Write' },
    { emoji: '🚶', label: 'Walk' },
    { emoji: '🚗', label: 'Car' },
    { emoji: '👨‍👩‍👧', label: 'Family' },
    { emoji: '👨‍⚕️', label: 'Nurse' },
    { emoji: '🌞', label: 'Outside' },
    { emoji: '💻', label: 'Computer' },
    { emoji: '📷', label: 'Photo' }
  ]
};

// ── State ────────────────────────────────────────────
let selectedPictos   = [];
let eyeSelectedPictos = [];
let currentCategory  = 'basic';
let isRecording      = false;
let recognition      = null;
let gazeInterval     = null;
let dwellTarget      = null;
let dwellTimer       = 0;
const DWELL_TIME     = 1000; // 1 second to select

// ── Init ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const profile = getProfile();
  const mode    = profile.mode || 'text';

  // Show correct mode
  switchMode(mode);

  // Enter key submits text
  const ta = document.getElementById('text-input');
  if (ta) {
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendText();
      }
    });
  }

  loadHistory();
});
// ── VOICE MODE ───────────────────────────────────────
function initVoice() {
  if (!('webkitSpeechRecognition' in window) &&
      !('SpeechRecognition' in window)) {
    document.getElementById('voice-status').textContent =
      'Voice not supported. Please use Chrome.';
    return;
  }
  const SR = window.SpeechRecognition ||
             window.webkitSpeechRecognition;
  recognition = new SR();
  const profile = getProfile();
  recognition.lang = profile.lang || 'es-ES';
  recognition.continuous = false;
  recognition.interimResults = true;

recognition.onresult = (e) => {
  const transcript = e.results[0][0].transcript;
  const status = document.getElementById('voice-status');
  status.textContent = 'Heard: "' + transcript + '"';
  status.style.color = 'var(--blue)';
  if (e.results[0].isFinal) {
    rewriteAndSpeak(transcript);
  }
}};

  recognition.onerror = (e) => {
  const status = document.getElementById('voice-status');
  if (e.error === 'no-speech') {
    status.textContent = 'No speech heard — try again';
  } else if (e.error === 'not-allowed') {
    status.textContent = 'Microphone blocked — allow access in browser';
  } else {
    status.textContent = 'Error: ' + e.error;
  }
  status.style.color = '#dc2626';
  document.getElementById('mic-btn').textContent = '🎤';
  document.getElementById('mic-btn').style.background = 'var(--navy)';
  isRecording = false;
};

  recognition.onend = () => {
  document.getElementById('mic-btn').textContent      = '🎤';
  document.getElementById('mic-btn').style.background = 'var(--navy)';
  isRecording = false;
};

function toggleVoice() {
  if (!recognition) { initVoice(); }
  const btn    = document.getElementById('mic-btn');
  const status = document.getElementById('voice-status');

  if (isRecording) {
    recognition.stop();
    btn.textContent     = '🎤';
    btn.style.background = 'var(--navy)';
    btn.style.boxShadow  = '0 4px 20px rgba(15,39,68,.35)';
    status.textContent   = 'Press the button and speak';
    status.style.color   = 'var(--muted)';
    isRecording = false;
  } else {
    try {
      recognition.start();
      btn.textContent     = '⏹';
      btn.style.background = '#dc2626';
      btn.style.boxShadow  = '0 4px 20px rgba(220,38,38,.4)';
      status.innerHTML     = '<span class="record-pulse"></span> Listening...';
      status.style.color   = '#dc2626';
      isRecording = true;
    } catch(e) {
      status.textContent = 'Could not start — try again';
    }
  }
}
// ── PICTOGRAM MODE ───────────────────────────────────
function renderGrid(category) {
  currentCategory = category;
  const grid  = document.getElementById('picto-grid');
  const items = PICTOGRAMS[category] || [];
  grid.innerHTML = '';
  items.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'picto-btn';
    btn.innerHTML = `
      <span style="font-size:28px">${p.emoji}</span>
      <span class="picto-label">${p.label}</span>`;
    btn.onclick = () => addPicto(p);
    grid.appendChild(btn);
  });
}

function showCategory(cat) {
  renderGrid(cat);
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.remove('active');
  });
  event.target.classList.add('active');
}

function addPicto(p) {
  selectedPictos.push(p);
  updateSelectedBar();
}

function updateSelectedBar() {
  const bar = document.getElementById('selected-bar');
  if (!bar) return;

  bar.innerHTML = '';

  if (selectedPictos.length === 0) {
    bar.innerHTML =
      '<span style="color:#aaa;font-size:14px">Tap pictograms to build a sentence</span>';
    return;
  }

  selectedPictos.forEach((p, i) => {
    const chip = document.createElement('span');
    chip.style.cssText =
      'background:#eef3f8;border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;margin:2px';
    chip.innerHTML =
      `${p.emoji} ${p.label} <span style="color:#999;font-size:11px">✕</span>`;
    chip.onclick = () => {
      selectedPictos.splice(i, 1);
      updateSelectedBar();
    };
    bar.appendChild(chip);
  });
}

function speakPictogram() {
  if (selectedPictos.length === 0) {
    alert('Please select some pictograms first.');
    return;
  }
  const text = selectedPictos.map(p => p.label).join(', ');
  rewriteAndSpeak(text);
  selectedPictos = [];
  updateSelectedBar();
}

function clearPictogram() {
  selectedPictos = [];
  updateSelectedBar();
}

// ── EYE TRACKING MODE ────────────────────────────────
function renderEyeGrid(category) {
  const grid  = document.getElementById('eye-picto-grid');
  const items = PICTOGRAMS[category] || [];
  grid.innerHTML = '';
  items.forEach(p => {
    const btn = document.createElement('button');
    btn.className   = 'picto-btn';
    btn.dataset.label = p.label;
    btn.innerHTML = `
      <span style="font-size:28px">${p.emoji}</span>
      <span class="picto-label">${p.label}</span>
      <div class="dwell-bar" style="height:4px;background:#ddd;border-radius:2px;margin-top:4px;width:100%">
        <div class="dwell-fill" style="height:100%;width:0%;background:#1a3a5c;border-radius:2px;transition:width 0.1s"></div>
      </div>`;
    grid.appendChild(btn);
  });
}

function initEyeTracking() {
  // Use mouse position as gaze proxy for demo
  // Real eye tracking via WebGazer added post-demo
  const grid = document.getElementById('eye-picto-grid');

  grid.addEventListener('mouseover', (e) => {
    const btn = e.target.closest('.picto-btn');
    if (!btn) return;
    if (dwellTarget !== btn) {
      clearDwell();
      dwellTarget = btn;
      dwellTimer  = 0;
      startDwell(btn);
    }
  });

  grid.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget?.closest('.picto-btn')) {
      clearDwell();
    }
  });
}

function startDwell(btn) {
  const fill = btn.querySelector('.dwell-fill');
  gazeInterval = setInterval(() => {
    dwellTimer += 100;
    const pct = Math.min((dwellTimer / DWELL_TIME) * 100, 100);
    if (fill) fill.style.width = pct + '%';
    if (dwellTimer >= DWELL_TIME) {
      clearDwell();
      const label = btn.dataset.label;
      const emoji = btn.querySelector('span')?.textContent;
      addEyePicto({ emoji, label });
    }
  }, 100);
}

function clearDwell() {
  if (gazeInterval) clearInterval(gazeInterval);
  gazeInterval = null;
  dwellTimer   = 0;
  if (dwellTarget) {
    const fill = dwellTarget.querySelector('.dwell-fill');
    if (fill) fill.style.width = '0%';
    dwellTarget = null;
  }
}

function addEyePicto(p) {
  eyeSelectedPictos.push(p);
  updateEyeSelectedBar();
}

function updateEyeSelectedBar() {
  const bar = document.getElementById('eye-selected-bar');
  if (!bar) return;

  bar.innerHTML = '';

  if (eyeSelectedPictos.length === 0) {
    bar.innerHTML =
      '<span style="color:#aaa;font-size:14px">Look at pictograms to build a sentence</span>';
    return;
  }

  eyeSelectedPictos.forEach((p, i) => {
    const chip = document.createElement('span');
    chip.style.cssText =
      'background:#eef3f8;border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer;margin:2px';
    chip.textContent = `${p.emoji} ${p.label}`;
    chip.onclick = () => {
      eyeSelectedPictos.splice(i, 1);
      updateEyeSelectedBar();
    };
    bar.appendChild(chip);
  });
}

function speakEyePictogram() {
  if (eyeSelectedPictos.length === 0) {
    alert('Please select some pictograms first.');
    return;
  }
  const text = eyeSelectedPictos.map(p => p.label).join(', ');
  rewriteAndSpeak(text);
  eyeSelectedPictos = [];
  updateEyeSelectedBar();
}

function clearEyePictogram() {
  eyeSelectedPictos = [];
  updateEyeSelectedBar();
}

function switchToTouch() {
  document.getElementById('section-eye').style.display  = 'none';
  document.getElementById('section-picto').style.display = 'block';
  renderGrid('basic');
}

// ── EMOTIONS ─────────────────────────────────────────
function playEmotion(emotion) {
  const profile = getProfile();
  if (profile.emotions && profile.emotions[emotion]) {
    const audio = new Audio(profile.emotions[emotion]);
    audio.play();
  } else {
    // No recorded emotion — speak text equivalent
    const map = {
      laugh:       'Ha! That is really funny!',
      cry:         'I am feeling very sad right now.',
      sigh:        'I just need a moment.',
      frustration: 'I am feeling frustrated.'
    };
    speakWithBrowser(map[emotion] || emotion);
  }
}

// ── HISTORY ──────────────────────────────────────────
function loadHistory() {
  const history = getHistory();
  const list    = document.getElementById('history-list');
  list.innerHTML = '';
  if (history.length === 0) {
    list.innerHTML =
      '<p style="color:#aaa;font-size:13px">No recent phrases yet</p>';
    return;
  }
  history.slice(0, 8).forEach(item => {
    const div = document.createElement('div');
    div.className   = 'history-item';
    div.textContent = item.text;
    div.onclick     = () => speakText(item.text);
    list.appendChild(div);
  });
}

// ── REPLAY ───────────────────────────────────────────
function replayLast() {
  const output = document.getElementById('output-text').textContent;
  if (output && output !== 'Your message will appear here...') {
    speakText(output);
  }
}
function switchMode(mode) {
  // Hide all sections
  document.getElementById('section-voice').style.display = 'none';
  document.getElementById('section-text').style.display  = 'none';
  document.getElementById('section-picto').style.display = 'none';
  document.getElementById('section-eye').style.display   = 'none';

  // Remove active from all buttons
  ['voice','text','touch','eye'].forEach(m => {
    const b = document.getElementById('btn-' + m);
    if (b) b.classList.remove('active');
  });

  // Show selected section
  if (mode === 'voice') {
    document.getElementById('section-voice').style.display = 'block';
    document.getElementById('btn-voice').classList.add('active');
    initVoice();
  } else if (mode === 'text') {
    document.getElementById('section-text').style.display = 'block';
    document.getElementById('btn-text').classList.add('active');
  } else if (mode === 'touch') {
    document.getElementById('section-picto').style.display = 'block';
    document.getElementById('btn-touch').classList.add('active');
    renderGrid('basic');
  } else if (mode === 'eye') {
    document.getElementById('section-eye').style.display = 'block';
    document.getElementById('btn-eye').classList.add('active');
    renderEyeGrid('basic');
    initEyeTracking();
  }

  // Save mode to profile
  const p = getProfile();
  p.mode = mode;
  saveProfile(p);
  const modeLabel = document.getElementById('mode-label');
    if (modeLabel) {
  modeLabel.textContent =
    mode.charAt(0).toUpperCase() + mode.slice(1) + ' Mode';
}}

function switchMode(mode) {
  // Hide all
  ['voice','text','picto'].forEach(m => {
    const el = document.getElementById('section-' + m);
    if (el) el.style.display = 'none';
  });
  // Remove active from all tabs
  ['voice','text','touch'].forEach(m => {
    const t = document.getElementById('tab-' + m);
    if (t) t.classList.remove('active');
  });
  // Show selected
  if (mode === 'voice') {
    document.getElementById('section-voice').style.display = 'block';
    document.getElementById('tab-voice').classList.add('active');
    initVoice();
  } else if (mode === 'text') {
    document.getElementById('section-text').style.display = 'block';
    document.getElementById('tab-text').classList.add('active');
    // Focus textarea
    setTimeout(() => {
      const ta = document.getElementById('text-input');
      if (ta) ta.focus();
    }, 100);
  } else if (mode === 'touch') {
    document.getElementById('section-picto').style.display = 'block';
    document.getElementById('tab-touch').classList.add('active');
    renderGrid('basic');
  }
  // Save mode
  const p = getProfile();
  p.mode = mode;
  saveProfile(p);
}

function sendText() {
  const input  = document.getElementById('text-input');
  const text   = input.value.trim();
  if (!text) { alert('Please type something first.'); return; }
  rewriteAndSpeak(text);
  input.value = '';
}
