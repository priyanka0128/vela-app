let currentStep = 1;
let mediaRecorder = null;
let audioChunks = [];
let isMainRecording = false;

function goTo(n) {
  document.getElementById('s' + currentStep).style.display = 'none';
  document.getElementById('d' + currentStep).classList.remove('active');
  document.getElementById('s' + n).style.display = 'block';
  document.getElementById('d' + n).classList.add('active');
  currentStep = n;
  window.scrollTo(0, 0);
}

function next1() {
  const name = document.getElementById('name').value.trim();
  if (!name) { alert('Please enter your name.'); return; }
  const p = getProfile();
  Object.assign(p, {
    name,
    age:    document.getElementById('age').value,
    lang:   document.getElementById('lang').value,
    region: document.getElementById('region').value,
    carer:  document.getElementById('carer').value
  });
  saveProfile(p);
  goTo(2);
}

function next2() {
  const caps = [...document.querySelectorAll('input[name="cap"]:checked')].map(c => c.value);
  if (!caps.length) { alert('Please select at least one option.'); return; }
  let mode = 'touch';
  if (caps.includes('eye'))   mode = 'eye';
  if (caps.includes('type'))  mode = 'text';
  if (caps.includes('speak')) mode = 'voice';
  const p = getProfile();
  Object.assign(p, { capabilities: caps, mode });
  saveProfile(p);
  goTo(3);
}

function next3() {
  const p = getProfile();
  Object.assign(p, {
    tone:   document.getElementById('tone').value,
    humour: document.getElementById('humour').value,
    slang:  document.getElementById('slang').value,
    energy: document.getElementById('energy').value
  });
  saveProfile(p);
  goTo(4);
}

// ── VOICE RECORDING ──────────────────────────────────

async function startRecording() {
  if (isMainRecording) {
    stopRecording();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks  = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped — processing...');
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(t => t.stop());

      // Show audio preview
      const preview = document.getElementById('voice-preview-audio');
      if (preview) {
        preview.src = URL.createObjectURL(blob);
        preview.style.display = 'block';
      }

      // Update status
      const status = document.getElementById('record-status');
      if (status) {
        status.textContent = 'Recording saved — cloning your voice now...';
        status.style.color = '#1a3a5c';
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const p = getProfile();
        p.voiceRecording = reader.result;
        saveProfile(p);
        console.log('Starting voice clone...');
        await autoCloneVoice(base64, p.name);
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    isMainRecording = true;
    document.getElementById('record-btn').textContent = '⏹ Stop Recording';
    document.getElementById('record-btn').style.background = '#c0392b';
    const status = document.getElementById('record-status');
    if (status) {
      status.textContent = '🔴 Recording... speak naturally for 30 seconds';
      status.style.color = '#c0392b';
    }

  } catch (err) {
    alert('Microphone access denied. Please allow microphone and try again.');
    console.error(err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  isMainRecording = false;
  document.getElementById('record-btn').textContent = '🎤 Record again';
  document.getElementById('record-btn').style.background = '#1a3a5c';
}

async function handleVoiceUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const preview = document.getElementById('voice-preview-audio');
  if (preview) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  }

  const status = document.getElementById('record-status');
  if (status) {
    status.textContent = 'File loaded — cloning your voice...';
    status.style.color = '#1a3a5c';
  }

  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result.split(',')[1];
    const p = getProfile();
    p.voiceRecording = reader.result;
    saveProfile(p);
    await autoCloneVoice(base64, p.name);
  };
  reader.readAsDataURL(file);
}

async function autoCloneVoice(audioBase64, userName) {
  const status  = document.getElementById('record-status');
  const nextBtn = document.getElementById('voice-next-btn');
  const preview = document.getElementById('recording-preview');

  console.log('autoCloneVoice called for:', userName);

  try {
    if (status) {
      status.textContent = 'Cloning your voice with AI... please wait 30 seconds';
      status.style.color = '#1a3a5c';
    }

    const response = await fetch('/api/clone-voice', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        audioBase64,
        fileName:  'voice.webm',
        voiceName: (userName || 'Patient') + ' Voice'
      })
    });

    const data = await response.json();
    console.log('Clone response:', data);

    if (data.error) throw new Error(data.error);

    // Save voice ID to profile
    const p = getProfile();
    p.voiceId   = data.voiceId;
    p.voiceName = data.voiceName;
    saveProfile(p);
    console.log('Voice ID saved:', data.voiceId);

    if (status) {
      status.textContent = '✓ Voice cloned! Vela will now speak in your voice.';
      status.style.color = '#27ae60';
    }

    if (preview) preview.style.display = 'block';
    if (nextBtn) {
      nextBtn.style.display = 'block';
      nextBtn.textContent   = 'Continue →';
    }

  } catch (err) {
    console.error('Clone failed:', err.message);
    if (status) {
      status.textContent = 'Voice cloning failed: ' + err.message + ' — you can still continue.';
      status.style.color = '#e74c3c';
    }
    if (preview) preview.style.display = 'block';
    if (nextBtn) {
      nextBtn.style.display = 'block';
      nextBtn.textContent   = 'Continue without cloned voice';
    }
  }
}

function skipVoice() {
  const p = getProfile();
  p.voiceSkipped = true;
  saveProfile(p);
  next4();
}

function next4() { goTo(5); }
function next5() {
  const p = getProfile();
  showSummary(p);
  goTo(6);
}

function showSummary(p) {
  const el = document.getElementById('profile-summary');
  if (!el) return;
  el.innerHTML = `
    <p><strong>Name:</strong> ${p.name || 'Not set'}</p>
    <p><strong>Region:</strong> ${p.region || 'Not set'}</p>
    <p><strong>Language:</strong> ${p.lang || 'Not set'}</p>
    <p><strong>Mode:</strong> ${p.mode || 'touch'}</p>
    <p><strong>Tone:</strong> ${p.tone || 'casual'}</p>
    <p><strong>Voice cloned:</strong> ${p.voiceId ? '✓ Yes' : '✗ Not yet'}</p>
  `;
}

// ── EMOTION RECORDING ────────────────────────────────

async function recordEmotion(emotion, btn) {
  try {
    const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks   = [];
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob   = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const p = getProfile();
        if (!p.emotions) p.emotions = {};
        p.emotions[emotion] = reader.result;
        saveProfile(p);
        btn.style.background  = '#27ae60';
        btn.style.color       = '#fff';
        btn.textContent       = '✓ ' + emotion;
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(t => t.stop());
    };

    recorder.start();
    btn.textContent       = '⏹ Stop';
    btn.style.background  = '#c0392b';
    btn.style.color       = '#fff';

    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 5000);

  } catch (err) {
    alert('Microphone access needed.');
  }
}