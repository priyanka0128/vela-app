/* ═══════════════════════════════════════════════════════════
   VELA — Core utilities
   Profile management, voice cloning, TTS, carer registry, nav
   ═══════════════════════════════════════════════════════════ */

// ─── Profile management ─────────────────────────────────────
function getProfile() {
  try {
    return JSON.parse(localStorage.getItem('vela_profile') || '{}');
  } catch { return {}; }
}

function saveProfile(p) {
  localStorage.setItem('vela_profile', JSON.stringify(p));
}

function getUserId() {
  const p = getProfile();
  return p.userId || 'guest';
}

// ─── User voice bank (per-user, private) ────────────────────
function getUserVoices() {
  const uid = getUserId();
  try {
    return JSON.parse(localStorage.getItem(`vela_voices_${uid}`) || '[]');
  } catch { return []; }
}

function saveUserVoices(voices) {
  const uid = getUserId();
  localStorage.setItem(`vela_voices_${uid}`, JSON.stringify(voices));
}

function getActiveVoice() {
  return getUserVoices().find(v => v.active) || null;
}

function setActiveVoice(voiceId) {
  const voices = getUserVoices().map(v => ({ ...v, active: v.voiceId === voiceId }));
  saveUserVoices(voices);
}

// ─── Caregiver registry (shared across users) ───────────────
function getCarerRegistry() {
  try {
    return JSON.parse(localStorage.getItem('vela_carer_registry') || '[]');
  } catch { return []; }
}

function registerVoiceForCaregiver(voiceId, voiceName, patientName, patientId) {
  const reg = getCarerRegistry();
  const exists = reg.find(v => v.voiceId === voiceId);
  if (exists) return;
  reg.push({ voiceId, voiceName, patientName, patientId, createdAt: Date.now() });
  localStorage.setItem('vela_carer_registry', JSON.stringify(reg));
}

function removeVoiceFromCaregiver(voiceId) {
  const reg = getCarerRegistry().filter(v => v.voiceId !== voiceId);
  localStorage.setItem('vela_carer_registry', JSON.stringify(reg));
}

// ─── History ─────────────────────────────────────────────────
function saveHistory(text, emotion = 'neutral') {
  const uid = getUserId();
  const key = `vela_history_${uid}`;
  try {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.unshift({ text, emotion, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
  } catch {}
}

function getHistory() {
  const uid = getUserId();
  try {
    return JSON.parse(localStorage.getItem(`vela_history_${uid}`) || '[]');
  } catch { return []; }
}

// ─── Core speech pipeline ────────────────────────────────────
async function rewriteAndSpeak(text, emotion = 'neutral') {
  if (!text || !text.trim()) return null;

  const profile = getProfile();
  let finalText = text;

  // Step 1: Rewrite through personality engine
  try {
    const rwRes = await fetch('/api/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        emotion,
        region: profile.region || 'spain',
        slang: profile.slang || 50,
        humour: profile.humour || 50,
        energy: profile.energy || 50,
        language: profile.language || 'es'
      })
    });
    if (rwRes.ok) {
      const data = await rwRes.json();
      if (data.text) finalText = data.text;
    }
  } catch (e) {
    console.warn('Rewrite failed, using original text', e);
  }

  // Step 2: Speak through cloned voice
  await speakText(finalText, emotion);
  saveHistory(finalText, emotion);
  return finalText;
}

async function speakText(text, emotion = 'neutral') {
  if (!text || !text.trim()) return;

  const voice = getActiveVoice();

  if (voice && voice.voiceId) {
    try {
      const res = await fetch('/api/speak-cloned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: voice.voiceId, emotion })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Cloned voice failed, falling back to browser TTS', e);
    }
  }

  // Fallback: browser speech synthesis
  return browserTTS(text);
}

function browserTTS(text) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    const profile = getProfile();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = profile.language === 'en' ? 'en-US'
           : profile.language === 'fr' ? 'fr-FR'
           : 'es-ES';
    u.rate = 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

// ─── Floating "← vela" home link on every app page ───────────
(function injectVelaHomeLink() {
  const skipPages = ['landing.html', 'index.html', 'setup.html'];
  const path = location.pathname.split('/').pop() || 'index.html';
  if (skipPages.includes(path)) return;

  function build() {
    if (document.getElementById('vela-home-link')) return;
    const link = document.createElement('a');
    link.id = 'vela-home-link';
    link.href = 'landing.html';
    link.title = 'Back to Vela home';
    link.innerHTML = `
      <span style="
        display:inline-flex;align-items:center;gap:6px;
        background:#ffffff;color:#1a2e2a;
        padding:8px 14px 8px 12px;border-radius:999px;
        font-size:12px;font-weight:600;
        font-family:Inter,-apple-system,sans-serif;
        box-shadow:0 4px 14px rgba(26,46,42,.10);
        border:1px solid #d1d3d1;
        transition:transform .15s,box-shadow .15s;">
        <svg viewBox="0 0 130 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="height:14px;width:auto">
          <text x="0" y="25" font-family="Inter,sans-serif" font-weight="700" font-size="28" letter-spacing="-0.04em" fill="currentColor">vela</text>
          <g transform="translate(74,4)" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round">
            <path d="M 0 4 Q 12 14, 0 24"/>
            <path d="M 8 4 Q 20 14, 8 24"/>
            <path d="M 16 4 Q 28 14, 16 24"/>
          </g>
        </svg>
        <span style="opacity:.6;font-size:11px;margin-left:2px">· home</span>
      </span>`;
    link.style.cssText = 'position:fixed;bottom:18px;left:18px;z-index:9997;text-decoration:none;display:block';
    link.addEventListener('mouseenter', () => {
      link.firstElementChild.style.transform = 'translateY(-2px)';
    });
    link.addEventListener('mouseleave', () => {
      link.firstElementChild.style.transform = 'translateY(0)';
    });
    document.body.appendChild(link);
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();

// ─── Offline detection banner ───────────────────────────────
(function offlineBanner() {
  function build() {
    if (document.getElementById('offline-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:9999;
      background:#f59e0b;color:#1f2937;text-align:center;
      padding:8px 16px;font-size:13px;font-weight:600;
      font-family:Inter,sans-serif;display:none`;
    document.body.appendChild(banner);

    const update = () => {
      if (!navigator.onLine) {
        banner.textContent = '⚠️ You are offline. Vela works locally; voice cloning and AI rewrite need internet.';
        banner.style.display = 'block';
        banner.style.background = '#f59e0b';
      } else if (banner.style.display === 'block') {
        banner.textContent = '✓ Back online';
        banner.style.background = '#22c55e';
        setTimeout(() => banner.style.display = 'none', 3000);
      }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }
  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();

// ─── Expose globally ────────────────────────────────────────
window.getProfile = getProfile;
window.saveProfile = saveProfile;
window.getUserId = getUserId;
window.getUserVoices = getUserVoices;
window.saveUserVoices = saveUserVoices;
window.getActiveVoice = getActiveVoice;
window.setActiveVoice = setActiveVoice;
window.getCarerRegistry = getCarerRegistry;
window.registerVoiceForCaregiver = registerVoiceForCaregiver;
window.removeVoiceFromCaregiver = removeVoiceFromCaregiver;
window.saveHistory = saveHistory;
window.getHistory = getHistory;
window.rewriteAndSpeak = rewriteAndSpeak;
window.speakText = speakText;
window.browserTTS = browserTTS;
