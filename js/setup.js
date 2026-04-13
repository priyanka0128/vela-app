let currentStep = 1;
let mediaRecorder = null;
let audioChunks = [];
let emotionRecorders = {};

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
    age: document.getElementById('age').value,
    lang: document.getElementById('lang').value,
    region: document.getElementById('region').value,
    carer: document.getElementById('carer').value
  });
  saveProfile(p);
  goTo(2);
}

function next2() {
  const caps = [...document.querySelectorAll(
    'input[name="cap"]:checked')].map(c => c.value);
  if (!caps.length) {
    alert('Please select at least one option.');
    return;
  }
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
    tone:    document.getElementById('tone').value,
    humour:  document.getElementById('humour').value,
    slang:   document.getElementById('slang').value,
    energy:  document.getElementById('energy').value
  });
  saveProfile(p);
  goTo(4);
}

// Voice recording
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      { audio: true }
    );
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const p = getProfile();
        p.voiceRecording = reader.result;
        saveProfile(p);
        document.getElementById('record-status').textContent =
          'Recording saved!';
        document.getElementById('recording-preview')
          .style.display = 'block';
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    document.getElementById('record-btn').textContent =
      'Stop Recording';
    document.getElementById('record-btn').onclick =
      stopRecording;
    document.getElementById('record-status').textContent =
      'Recording... speak naturally';
    document.getElementById('record-status').style.color =
      '#c0392b';
  } catch (err) {
    alert('Microphone access denied. Please allow microphone access and try again.');
  }
}

function stopRecording() {
  if (mediaRecorder) mediaRecorder.stop();
  document.getElementById('record-btn').textContent =
    'Re-record';
  document.getElementById('record-btn').onclick =
    startRecording;
}

function skipVoice() {
  const p = getProfile();
  p.voiceSkipped = true;
  saveProfile(p);
  next4();
}

function next4() {
  goTo(5);
}

// Emotion recording
async function recordEmotion(emotion, btn) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      { audio: true }
    );
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const p = getProfile();
        if (!p.emotions) p.emotions = {};
        p.emotions[emotion] = reader.result;
        saveProfile(p);
        btn.style.background = '#27ae60';
        btn.style.color = '#fff';
        btn.textContent = '✓ ' + emotion;
        stream.getTracks().forEach(t => t.stop());
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
    btn.textContent = '⏹ Stop';
    btn.style.background = '#c0392b';
    btn.style.color = '#fff';
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 5000);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const p = getProfile();
        if (!p.emotions) p.emotions = {};
        p.emotions[emotion] = reader.result;
        saveProfile(p);
        btn.style.background = '#27ae60';
        btn.style.color = '#fff';
        btn.textContent = '✓ ' + emotion;
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(t => t.stop());
    };
  } catch (err) {
    alert('Microphone access needed for emotion recording.');
  }
}

function next5() {
  const p = getProfile();
  showSummary(p);
  goTo(6);
}

function showSummary(p) {
  document.getElementById('profile-summary').innerHTML = `
    <p><strong>Name:</strong> ${p.name || 'Not set'}</p>
    <p><strong>Region:</strong> ${p.region || 'Not set'}</p>
    <p><strong>Language:</strong> ${p.lang || 'Not set'}</p>
    <p><strong>Mode:</strong> ${p.mode || 'touch'}</p>
    <p><strong>Tone:</strong> ${p.tone || 'casual'}</p>
    <p><strong>Humour:</strong> ${p.humour || 'medium'}</p>
    <p><strong>Slang:</strong> ${p.slang || 'medium'}</p>
  `;
}