const screenCaptureDemo = {
  stream: null,
  recorder: null,
  chunks: [],

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Screen capture</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Captura y graba tu pantalla desde el navegador
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1rem;">
        <button onclick="screenCaptureDemo.startCapture()" class="demo-btn" id="btn-sc-start">
          🖥️ Iniciar captura
        </button>
        <button onclick="screenCaptureDemo.startRecording()" class="demo-btn" id="btn-sc-record" disabled>
          🔴 Iniciar grabación
        </button>
        <button onclick="screenCaptureDemo.stopRecording()" class="demo-btn" id="btn-sc-stop" disabled>
          ⏹ Detener grabación
        </button>
        <button onclick="screenCaptureDemo.stopCapture()" class="demo-btn" id="btn-sc-end" disabled>
          ✕ Detener captura
        </button>
      </div>

      <div id="sc-status" style="font-size:13px; color:#6b7280; margin-bottom:10px;"></div>

      <video id="sc-video" autoplay playsinline muted
        style="width:100%; border-radius:10px; background:#f5f6f8; display:none;">
      </video>

      <div id="sc-recordings" style="margin-top:12px;"></div>
    `;
  },

  async startCapture() {
    const statusEl = document.getElementById('sc-status');

    try {
      statusEl.textContent = '⏳ Selecciona qué compartir...';

      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });

      const video = document.getElementById('sc-video');
      video.srcObject = this.stream;
      video.style.display = 'block';

      // Detectar si el usuario detiene desde el navegador
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopCapture();
      });

      document.getElementById('btn-sc-start').disabled = true;
      document.getElementById('btn-sc-record').disabled = false;
      document.getElementById('btn-sc-end').disabled = false;

      const track = this.stream.getVideoTracks()[0];
      const settings = track.getSettings();
      statusEl.textContent = `✅ Capturando — ${settings.width}×${settings.height}`;

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        statusEl.textContent = '⚠️ Captura cancelada por el usuario';
      } else {
        statusEl.textContent = '❌ Error: ' + err.message;
      }
    }
  },

  startRecording() {
    if (!this.stream) return;
    const statusEl = document.getElementById('sc-status');

    try {
      this.chunks = [];
      this.recorder = new MediaRecorder(this.stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
      });

      this.recorder.ondataavailable = e => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.recorder.onstop = () => this.saveRecording();

      this.recorder.start(1000);

      document.getElementById('btn-sc-record').disabled = true;
      document.getElementById('btn-sc-stop').disabled = false;
      statusEl.textContent = '🔴 Grabando...';

    } catch (err) {
      statusEl.textContent = '❌ Error al grabar: ' + err.message;
    }
  },

  stopRecording() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    document.getElementById('btn-sc-record').disabled = false;
    document.getElementById('btn-sc-stop').disabled = true;
    document.getElementById('sc-status').textContent = '✅ Grabación guardada';
  },

  saveRecording() {
    const blob = new Blob(this.chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const size = (blob.size / (1024 * 1024)).toFixed(2);
    const time = new Date().toLocaleTimeString();

    const recordingsEl = document.getElementById('sc-recordings');
    if (!recordingsEl) return;

    const item = document.createElement('div');
    item.style.cssText = `
      padding:10px 12px; background:white; border:1px solid #e8eaed;
      border-radius:8px; font-size:12px; margin-bottom:8px;
      display:flex; justify-content:space-between; align-items:center;
    `;
    item.innerHTML = `
      <span style="color:#374151;">🎬 Grabación — ${time} <span style="color:#6b7280;">(${size} MB)</span></span>
      <a href="${url}" download="grabacion-${Date.now()}.webm"
        style="color:#185FA5; font-weight:500; text-decoration:none;">
        ⬇ Descargar
      </a>
    `;
    recordingsEl.prepend(item);
  },

  stopCapture() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    const video = document.getElementById('sc-video');
    if (video) {
      video.srcObject = null;
      video.style.display = 'none';
    }

    document.getElementById('btn-sc-start').disabled = false;
    document.getElementById('btn-sc-record').disabled = true;
    document.getElementById('btn-sc-stop').disabled = true;
    document.getElementById('btn-sc-end').disabled = true;
    document.getElementById('sc-status').textContent = '⏹ Captura detenida';
  }
};