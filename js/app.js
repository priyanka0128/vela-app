const API = '';

function saveProfile(data) {
  localStorage.setItem('vela_profile', JSON.stringify(data));
}
function getProfile() {
  return JSON.parse(localStorage.getItem('vela_profile') || '{}');
}
function saveHistory(text) {
  const h = getHistory();
  h.unshift({ text, time: Date.now() });
  if (h.length > 20) h.pop();
  localStorage.setItem('vela_history', JSON.stringify(h));
}
function getHistory() {
  return JSON.parse(localStorage.getItem('vela_history') || '[]');
}

// ── Browser speech fallback ──────────────────────────
function speakWithBrowser(text) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const profile = getProfile();
    utter.lang  = profile.lang || 'en-IE';
    utter.rate  = 0.92;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v =>
      v.lang.startsWith((profile.lang || 'en').substring(0, 2))
    );
    if (match) utter.voice = match;
    utter.onend  = resolve;
    utter.onerror = resolve;
    window.speechSynthesis.speak(utter);
  });
}

// ── Speak with cloned voice via ElevenLabs ───────────
async function speakText(text) {
  const profile = getProfile();

  if (profile.voiceId) {
    try {
      console.log('Using cloned voice:', profile.voiceId);

      const response = await fetch('/api/speak-cloned', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          text,
          voiceId: profile.voiceId
        })
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('audio')) {
        const blob  = await response.blob();
        const url   = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        console.log('Cloned voice played');
        return;
      }

      const data = await response.json();
      if (data.useBrowser) {
        await speakWithBrowser(text);
        return;
      }

    } catch (err) {
      console.log('Cloned voice failed:', err.message);
      await speakWithBrowser(text);
    }
  } else {
    console.log('No voiceId — using browser speech');
    await speakWithBrowser(text);
  }
}

// ── Main function ────────────────────────────────────
async function rewriteAndSpeak(inputText) {
  const profile = getProfile();
  const btn     = document.getElementById('speak-btn');
  const output  = document.getElementById('output-text');

  if (btn) {
    btn.disabled    = true;
    btn.textContent = 'Thinking...';
  }

  try {
    // Step 1: Rewrite with Groq
    const rwRes = await fetch('/api/rewrite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: inputText, profile })
    });

    const { result, error } = await rwRes.json();
    if (error) throw new Error(error);

    console.log('Rewritten:', result);
    if (output) output.textContent = result;

    // Step 2: Speak in cloned voice
    if (btn) btn.textContent = 'Speaking...';
    await speakText(result);

    saveHistory(result);
    return result;

  } catch (err) {
    console.error('Error:', err.message);
    alert('Something went wrong: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled    = false;
      btn.textContent = 'Speak';
    }
  }
}

// ── Emotion playback ─────────────────────────────────
function playEmotion(emotion) {
  const profile = getProfile();

  // Play recorded emotion audio if available
  if (profile.emotions && profile.emotions[emotion]) {
    const audio = new Audio(profile.emotions[emotion]);
    audio.play();
    return;
  }

  // Speak emotion text in cloned voice
  const texts = {
    laugh:       'Ha! That is really funny!',
    cry:         'I am feeling very sad right now.',
    sigh:        'I just need a moment please.',
    frustration: 'I am feeling really frustrated.'
  };
  speakText(texts[emotion] || emotion);
}

// ── Apply settings on load ───────────────────────────
(function applySettings() {
  const p = getProfile();
  if (p.highContrast) document.body.classList.add('hc');
  if (p.largeText)    document.body.classList.add('large');
  window.speechSynthesis.getVoices();
})();

// ── Per-user voice bank ───────────────────────────────
function getUserVoiceKey() {
  const p = getProfile();
  return 'vela_voices_' + (p.id || 'default');
}

function getUserVoices() {
  return JSON.parse(localStorage.getItem(getUserVoiceKey()) || '[]');
}

function saveUserVoices(voices) {
  localStorage.setItem(getUserVoiceKey(), JSON.stringify(voices));
}

// Get ALL voices across ALL users (caregiver only)
function getAllUsersVoices() {
  const all = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('vela_voices_')) {
      try {
        const voices = JSON.parse(localStorage.getItem(key) || '[]');
        const userId = key.replace('vela_voices_', '');
        voices.forEach(v => all.push({ ...v, userId }));
      } catch(e) {}
    }
  }
  return all;
}
// ── Master voice registry for caregiver ──────────────
function registerVoiceForCaregiver(voiceId, voiceName, patientName, patientId) {
  const registry = JSON.parse(
    localStorage.getItem('vela_carer_registry') || '[]'
  );
  // Remove old entry for this patient if exists
  const filtered = registry.filter(r => r.patientId !== patientId);
  filtered.push({
    voiceId,
    voiceName,
    patientName,
    patientId,
    addedAt: Date.now()
  });
  localStorage.setItem('vela_carer_registry', JSON.stringify(filtered));
}

function getCarerRegistry() {
  return JSON.parse(localStorage.getItem('vela_carer_registry') || '[]');
}

// ── Offline detection ─────────────────────────────────
(function watchConnection() {
  function showBanner(msg, color) {
    let b = document.getElementById('offline-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'offline-banner';
      b.style.cssText = `
        position:fixed;top:0;left:0;right:0;
        padding:10px;text-align:center;
        font-size:13px;font-weight:500;z-index:9999;
        transition:all .3s`;
      document.body.appendChild(b);
    }
    b.textContent    = msg;
    b.style.background = color;
    b.style.color      = '#fff';
    b.style.display    = 'block';
  }

  function hideBanner() {
    const b = document.getElementById('offline-banner');
    if (b) b.style.display = 'none';
  }

  window.addEventListener('offline', () => {
    showBanner(
      '⚠️ No internet — using browser voice. Cloned voice unavailable.',
      '#d97706'
    );
  });

  window.addEventListener('online', () => {
    showBanner('✓ Back online — cloned voice restored', '#16a34a');
    setTimeout(hideBanner, 3000);
  });

  if (!navigator.onLine) {
    showBanner(
      '⚠️ Offline mode — browser voice active',
      '#d97706'
    );
  }
})();

// ── Condition stage adaptation ────────────────────────
(function applyStage() {
  const p = getProfile();
  if (!p.stage) return;
  const stage = parseInt(p.stage);

  // Stage 3+ — larger buttons
  if (stage >= 3) {
    document.querySelectorAll('.picto-btn, .eye-picto').forEach(el => {
      el.style.minHeight = '90px';
    });
  }

  // Stage 4 — redirect to eye tracking automatically
  if (stage === 4 &&
      !window.location.href.includes('eyetrack') &&
      !window.location.href.includes('home') &&
      !window.location.href.includes('setup') &&
      !window.location.href.includes('caregiver') &&
      !window.location.href.includes('settings')) {
    window.location.href = 'eyetrack.html';
  }
})();