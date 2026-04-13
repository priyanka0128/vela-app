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

function speakWithBrowser(text) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const profile = getProfile();
    utter.lang = profile.lang || 'en-IE';
    utter.rate = 0.92;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v =>
      v.lang.startsWith((profile.lang || 'en').substring(0, 2))
    );
    if (match) utter.voice = match;
    utter.onend = resolve;
    utter.onerror = resolve;
    window.speechSynthesis.speak(utter);
  });
}

async function speakText(text) {
  try {
    const response = await fetch('/api/clone-speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('audio')) {
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      await audio.play();
      return;
    }
  } catch (err) {
    console.log('HF failed:', err.message);
  }
  await speakWithBrowser(text);
}

async function rewriteAndSpeak(inputText) {
  const profile = getProfile();
  const btn = document.getElementById('speak-btn');
  const output = document.getElementById('output-text');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Thinking...';
  }

  try {
    const rwRes = await fetch('/api/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText, profile })
    });
    const { result, error } = await rwRes.json();
    if (error) throw new Error(error);
    if (output) output.textContent = result;
    if (btn) btn.textContent = 'Speaking...';
    await speakText(result);
    saveHistory(result);
    return result;
  } catch (err) {
    console.error('Error:', err.message);
    alert('Something went wrong: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Speak';
    }
  }
}

(function applySettings() {
  const p = getProfile();
  if (p.highContrast) document.body.classList.add('hc');
  if (p.largeText) document.body.classList.add('large');
  window.speechSynthesis.getVoices();
})();