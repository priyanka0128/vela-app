const DEFAULT_PIN = '1234';

function checkPin() {
  const entered = document.getElementById('pin-input').value;
  const stored  = localStorage.getItem('carer_pin') || DEFAULT_PIN;
  if (entered === stored) {
    document.getElementById('pin-gate').style.display   = 'none';
    document.getElementById('carer-panel').style.display = 'block';
    loadCarerPanel();
  } else {
    alert('Incorrect PIN. Default PIN is 1234.');
  }
}

function loadCarerPanel() {
  const p = getProfile();

  // Show patient info
  document.getElementById('patient-info').innerHTML = `
    <p><strong>Name:</strong> ${p.name || 'Not set'}</p>
    <p><strong>Region:</strong> ${p.region || 'Not set'}</p>
    <p><strong>Language:</strong> ${p.lang || 'Not set'}</p>
    <p><strong>Mode:</strong> ${p.mode || 'touch'}</p>
    <p><strong>Tone:</strong> ${p.tone || 'casual'}</p>
  `;

  // Load accessibility settings
  document.getElementById('hc-toggle').checked = !!p.highContrast;
  document.getElementById('lt-toggle').checked = !!p.largeText;

  loadSavedPhrases();
}

function addPhrase() {
  const text = document.getElementById('custom-phrase').value.trim();
  if (!text) { alert('Please enter a phrase.'); return; }
  const phrases = getSavedPhrases();
  phrases.push({ text, time: Date.now() });
  localStorage.setItem('carer_phrases', JSON.stringify(phrases));
  document.getElementById('custom-phrase').value = '';
  loadSavedPhrases();
}

function getSavedPhrases() {
  return JSON.parse(
    localStorage.getItem('carer_phrases') || '[]'
  );
}

function loadSavedPhrases() {
  const phrases   = getSavedPhrases();
  const container = document.getElementById('saved-phrases');
  if (phrases.length === 0) {
    container.innerHTML =
      '<p style="color:#aaa;font-size:13px">No phrases added yet</p>';
    return;
  }
  container.innerHTML = '';
  phrases.forEach((ph, i) => {
    const div = document.createElement('div');
    div.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0ec';
    div.innerHTML = `
      <span style="font-size:14px">${ph.text}</span>
      <button onclick="deletePhrase(${i})"
        style="background:none;border:none;color:#c0392b;cursor:pointer;font-size:13px">
        Delete
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