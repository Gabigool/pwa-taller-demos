const faceDetectionDemo = {
  stream: null,
  detector: null,
  animationId: null,

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Face detection</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Detección de rostros en tiempo real con la cámara
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1rem;">
        <button onclick="faceDetectionDemo.start()" class="demo-btn" id="btn-face-start">
          📷 Iniciar cámara
        </button>
        <button onclick="faceDetectionDemo.stop()" class="demo-btn" id="btn-face-stop" disabled>
          ⏹ Detener
        </button>
      </div>

      <div id="face-status" style="font-size:13px; color:#6b7280; margin-bottom:10px;"></div>

      <div style="position:relative; width:100%; background:#f5f6f8; border-radius:10px; overflow:hidden;">
        <video id="face-video" autoplay playsinline muted
          style="width:100%; display:block; border-radius:10px;">
        </video>
        <canvas id="face-canvas"
          style="position:absolute; top:0; left:0; width:100%; height:100%;">
        </canvas>
      </div>

      <div id="face-counter" style="
        margin-top:10px;
        font-size:13px;
        color:#185FA5;
        font-weight:500;
      "></div>
    `;
  },

  async start() {
    const statusEl = document.getElementById('face-status');

    if (!('FaceDetector' in window)) {
      statusEl.innerHTML = `
        ❌ <strong>FaceDetector no está disponible</strong> en este navegador.<br>
        <span style="font-size:12px;">Actívalo en Chrome en <code>chrome://flags/#enable-experimental-web-platform-features</code></span>
      `;
      return;
    }

    try {
      statusEl.textContent = '⏳ Accediendo a la cámara...';

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      const video = document.getElementById('face-video');
      video.srcObject = this.stream;
      await video.play();

      this.detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 5 });

      document.getElementById('btn-face-start').disabled = true;
      document.getElementById('btn-face-stop').disabled = false;
      statusEl.textContent = '✅ Cámara activa — detectando rostros...';

      this.detect();

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        statusEl.textContent = '⚠️ Permiso de cámara denegado';
      } else {
        statusEl.textContent = '❌ Error: ' + err.message;
      }
    }
  },

  async detect() {
    const video = document.getElementById('face-video');
    const canvas = document.getElementById('face-canvas');

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');

    const loop = async () => {
      if (!this.stream) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const faces = await this.detector.detect(video);

        faces.forEach(face => {
          const { top, left, width, height } = face.boundingBox;

          // Rectángulo alrededor del rostro
          ctx.strokeStyle = '#378ADD';
          ctx.lineWidth = 3;
          ctx.strokeRect(left, top, width, height);

          // Etiqueta
          ctx.fillStyle = 'rgba(24, 95, 165, 0.75)';
          ctx.fillRect(left, top - 24, 80, 22);
          ctx.fillStyle = 'white';
          ctx.font = '13px sans-serif';
          ctx.fillText('Rostro', left + 6, top - 7);

          // Puntos de landmarks si están disponibles
          if (face.landmarks) {
            face.landmarks.forEach(lm => {
              ctx.beginPath();
              ctx.arc(lm.location.x, lm.location.y, 4, 0, Math.PI * 2);
              ctx.fillStyle = '#85B7EB';
              ctx.fill();
            });
          }
        });

        const counter = document.getElementById('face-counter');
        if (counter) {
          counter.textContent = faces.length > 0
            ? `👤 ${faces.length} rostro${faces.length > 1 ? 's' : ''} detectado${faces.length > 1 ? 's' : ''}`
            : '👁 Buscando rostros...';
        }

      } catch (_) {}

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  },

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    const video = document.getElementById('face-video');
    const canvas = document.getElementById('face-canvas');
    if (video) video.srcObject = null;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    document.getElementById('btn-face-start').disabled = false;
    document.getElementById('btn-face-stop').disabled = true;
    document.getElementById('face-status').textContent = '⏹ Cámara detenida';
    document.getElementById('face-counter').textContent = '';
  }
};