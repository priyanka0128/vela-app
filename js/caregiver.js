const DEFAULT_PIN = '1234';

function checkPin() {
  const entered = document.getElementById('pin-input').value;
  const stored  = localStorage.getItem('carer_pin') || DEFAULT_PIN;
  if (entered === stored) {
    document.getElementById('pin-gate').style.display    = 'none';
    document.getElementById('carer-panel').style.display = 'block';
    loadCarerPanel();
  } else {
    alert('Incorrect PIN. Default PIN is 1234.');
  }
}

function loadCarerPanel() {
  const p = getProfile();
  document.getElementById('patient-name-display').textContent =
    p.name || 'Not set';
  document.getElementById('patient-details-display').textContent =
    (p.region || '') + ' · ' + (p.lang || '') + ' · Mode: ' + (p.mode || 'touch');
  document.getElementById('hc-toggle').checked = !!p.highContrast;
  document.getElementById('lt-toggle').checked = !!p.largeText;
  loadSavedPhrases();
  loadAllVoices();
}

// ── Show ALL patient voices ───────────────────────────
function loadAllVoices() {
  const container = document.getElementById('all-voices-container');
  if (!container) return;

  const registry = getCarerRegistry();
  const p        = getProfile();
  container.innerHTML = '';

  if (!registry.length) {
    container.innerHTML =
      '<p style="color:var(--muted);font-size:13px">No patient voices registered yet. Each patient must record their voice first.</p>';
    return;
  }

  // Group by patient name
  registry.forEach(v => {
    const isActive = p.voiceId === v.voiceId;
    const card = document.createElement('div');
    card.style.cssText = `
      border:2px solid ${isActive ? '#1a3a5c' : '#e2e8f0'};
      border-radius:12px;padding:14px 16px;margin-bottom:10px;
      background:${isActive ? '#eef4ff' : '#fff'};
      box-shadow:0 1px 3px rgba(0,0,0,.06)`;

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-size:16px;font-weight:700;color:#0f2744">
            ${v.patientName}
          </div>
          <div style="font-size:12px;color:#64748b;margin-top:2px">
            Voice: ${v.voiceName || 'Cloned voice'}
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:1px">
            Cloned: ${new Date(v.addedAt).toLocaleDateString('en-IE', {
              day:'numeric', month:'short', year:'numeric'
            })}
          </div>
        </div>
        ${isActive
          ? '<span style="font-size:11px;background:#dbeafe;color:#1e40af;padding:3px 10px;border-radius:99px;font-weight:600">✓ Active</span>'
          : '<span style="font-size:11px;background:#dcfce7;color:#166534;padding:3px 10px;border-radius:99px;font-weight:500">Stored</span>'}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button onclick="carerTestVoice('${v.voiceId}', '${v.patientName}')"
          style="padding:10px;border-radius:8px;border:1.5px solid #e2e8f0;
          background:#fff;color:#1a3a5c;font-size:13px;font-weight:500;cursor:pointer">
          ▶ Test voice
        </button>
        <button onclick="carerActivateVoice('${v.voiceId}','${v.voiceName}','${v.patientName}')"
          style="padding:10px;border-radius:8px;border:none;
          background:${isActive ? '#0d9488' : '#0f2744'};
          color:#fff;font-size:13px;font-weight:600;cursor:pointer">
          ${isActive ? '✓ Currently active' : 'Use this voice'}
        </button>
      </div>`;

    container.appendChild(card);
  });
}

function carerActivateVoice(voiceId, voiceName, patientName) {
  const p = getProfile();
  p.voiceId   = voiceId;
  p.voiceName = voiceName;
  saveProfile(p);
  loadAllVoices();
  alert('✓ Now using ' + patientName + '\'s voice.');
} 

async function carerTestVoice(voiceId, name) {
  const res = await fetch('/api/speak-cloned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text:    'Testing voice for ' + name,
      voiceId: voiceId
    })
  });
  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('audio')) {
    new Audio(URL.createObjectURL(await res.blob())).play();
  }
}

function carerActivateVoice(voiceId, voiceName) {
  const p = getProfile();
  p.voiceId   = voiceId;
  p.voiceName = voiceName;
  saveProfile(p);
  loadAllVoices();
  alert('Voice assigned to ' + (p.name || 'patient'));
}

// ── Phrases ───────────────────────────────────────────
function addPhrase() {
  const text = document.getElementById('phrase-input').value.trim();
  if (!text) { alert('Please enter a phrase.'); return; }
  const phrases = getSavedPhrases();
  phrases.push({ text, time: Date.now() });
  localStorage.setItem('carer_phrases', JSON.stringify(phrases));
  document.getElementById('phrase-input').value = '';
  loadSavedPhrases();
}

function getSavedPhrases() {
  return JSON.parse(localStorage.getItem('carer_phrases') || '[]');
}

function loadSavedPhrases() {
  const phrases   = getSavedPhrases();
  const container = document.getElementById('phrases-list');
  container.innerHTML = '';
  if (!phrases.length) {
    container.innerHTML =
      '<p style="color:var(--muted);font-size:13px">No phrases added yet</p>';
    return;
  }
  phrases.forEach((ph, i) => {
    const div = document.createElement('div');
    div.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;' +
      'padding:9px 0;border-bottom:1px solid var(--border)';
    div.innerHTML = `
      <span style="font-size:14px">${ph.text}</span>
      <button onclick="deletePhrase(${i})"
        style="background:none;border:none;color:var(--red);cursor:pointer;font-size:13px">
        ✕
      </button>`;
    container.appendChild(div);
  });
}

function deletePhrase(i) {
  const phrases = getSavedPhrases();
  phrases.splice(i, 1);
  localStorage.setItem('carer_phrases', JSON.stringify(phrases));
  loadSavedPhrases();
}

function toggleHighContrast() {
  const p = getProfile();
  p.highContrast = document.getElementById('hc-toggle').checked;
  saveProfile(p);
  document.body.classList.toggle('hc', p.highContrast);
}

function toggleLargeText() {
  const p = getProfile();
  p.largeText = document.getElementById('lt-toggle').checked;
  saveProfile(p);
  document.body.classList.toggle('large', p.largeText);
}

function changePin() {
  const newPin = document.getElementById('new-pin').value;
  if (!newPin || newPin.length < 4) {
    alert('PIN must be at least 4 digits.');
    return;
  }
  localStorage.setItem('carer_pin', newPin);
  alert('PIN changed successfully.');
  document.getElementById('new-pin').value = '';
}