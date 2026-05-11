const audioDemo = {
  stream: null,
  recorder: null,
  chunks: [],
  analyser: null,
  animationId: null,
  recordings: [],

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Audio Recording</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Graba audio desde el micrófono con visualización en tiempo real
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1rem;">
        <button onclick="audioDemo.startRecording()" class="demo-btn" id="btn-audio-start">
          🎙️ Iniciar grabación
        </button>
        <button onclick="audioDemo.stopRecording()" class="demo-btn" id="btn-audio-stop" disabled>
          ⏹ Detener grabación
        </button>
      </div>

      <div id="audio-status" style="font-size:13px; color:#6b7280; margin-bottom:10px;"></div>

      <!-- Visualizador de ondas -->
      <div style="background:#f5f6f8; border-radius:10px; padding:8px;">
        <canvas id="audio-canvas" height="80"
          style="width:100%; display:block; border-radius:8px;">
        </canvas>
      </div>

      <!-- Timer -->
      <div id="audio-timer" style="
        text-align:center;
        font-size:28px;
        font-weight:600;
        color:#185FA5;
        margin:12px 0;
        font-variant-numeric:tabular-nums;
        display:none;
      ">00:00</div>

      <!-- Lista de grabaciones -->
      <div id="audio-list" style="margin-top:8px;"></div>
    `;
  },

  async startRecording() {
    const statusEl = document.getElementById('audio-status');

    try {
      statusEl.textContent = '⏳ Solicitando acceso al micrófono...';

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Configurar analizador de audio para visualización
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(this.stream);
      this.analyser = audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Configurar grabador
      this.chunks = [];
      this.recorder = new MediaRecorder(this.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      this.recorder.ondataavailable = e => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.recorder.onstop = () => this.saveRecording();
      this.recorder.start(100);

      document.getElementById('btn-audio-start').disabled = true;
      document.getElementById('btn-audio-stop').disabled = false;
      document.getElementById('audio-timer').style.display = 'block';
      statusEl.textContent = '🔴 Grabando...';

      this.startTimer();
      this.drawWaveform();

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        statusEl.textContent = '⚠️ Permiso de micrófono denegado';
      } else {
        statusEl.textContent = '❌ Error: ' + err.message;
      }
    }
  },

  stopRecording() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    clearInterval(this.timerInterval);
    cancelAnimationFrame(this.animationId);
    this.clearCanvas();

    document.getElementById('btn-audio-start').disabled = false;
    document.getElementById('btn-audio-stop').disabled = true;
    document.getElementById('audio-timer').style.display = 'none';
    document.getElementById('audio-timer').textContent = '00:00';
    document.getElementById('audio-status').textContent = '✅ Grabación guardada';
  },

  saveRecording() {
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const duration = document.getElementById('audio-timer')?.textContent || '00:00';
    const size = (blob.size / 1024).toFixed(1);
    const time = new Date().toLocaleTimeString();

    const listEl = document.getElementById('audio-list');
    if (!listEl) return;

    const item = document.createElement('div');
    item.style.cssText = `
      background:white; border:1px solid #e8eaed; border-radius:10px;
      padding:12px; margin-bottom:8px;
    `;
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:12px; color:#374151;">
          🎵 Grabación ${time}
          <span style="color:#6b7280;">(${size} KB)</span>
        </span>
        <a href="${url}" download="audio-${Date.now()}.webm"
          style="font-size:12px; color:#185FA5; font-weight:500; text-decoration:none;">
          ⬇ Descargar
        </a>
      </div>
      <audio controls src="${url}" style="width:100%; height:36px;"></audio>
    `;
    listEl.prepend(item);
  },

  startTimer() {
    let seconds = 0;
    this.timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      const timerEl = document.getElementById('audio-timer');
      if (timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);
  },

  drawWaveform() {
    const canvas = document.getElementById('audio-canvas');
    if (!canvas || !this.analyser) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.analyser) return;
      this.animationId = requestAnimationFrame(draw);

      this.analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f5f6f8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#378ADD';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  },

  clearCanvas() {
    const canvas = document.getElementById('audio-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5f6f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};