const barcodeDemo = {
  stream: null,
  detector: null,
  animationId: null,
  lastResult: null,

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Barcode detection</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Escanea códigos QR y de barras con la cámara
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1rem;">
        <button onclick="barcodeDemo.start()" class="demo-btn" id="btn-bar-start">
          📷 Iniciar escáner
        </button>
        <button onclick="barcodeDemo.stop()" class="demo-btn" id="btn-bar-stop" disabled>
          ⏹ Detener
        </button>
      </div>

      <div id="bar-status" style="font-size:13px; color:#6b7280; margin-bottom:10px;"></div>

      <div style="position:relative; width:100%; background:#f5f6f8; border-radius:10px; overflow:hidden;">
        <video id="bar-video" autoplay playsinline muted
          style="width:100%; display:block; border-radius:10px;">
        </video>
        <canvas id="bar-canvas"
          style="position:absolute; top:0; left:0; width:100%; height:100%;">
        </canvas>

        <!-- Guía de escaneo -->
        <div id="scan-guide" style="
          display:none;
          position:absolute;
          top:50%; left:50%;
          transform:translate(-50%, -50%);
          width:200px; height:200px;
          border:2px solid rgba(55,138,221,0.7);
          border-radius:12px;
          pointer-events:none;
        ">
          <div style="position:absolute;top:-2px;left:-2px;width:20px;height:20px;border-top:3px solid #378ADD;border-left:3px solid #378ADD;border-radius:3px 0 0 0;"></div>
          <div style="position:absolute;top:-2px;right:-2px;width:20px;height:20px;border-top:3px solid #378ADD;border-right:3px solid #378ADD;border-radius:0 3px 0 0;"></div>
          <div style="position:absolute;bottom:-2px;left:-2px;width:20px;height:20px;border-bottom:3px solid #378ADD;border-left:3px solid #378ADD;border-radius:0 0 0 3px;"></div>
          <div style="position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-bottom:3px solid #378ADD;border-right:3px solid #378ADD;border-radius:0 0 3px 0;"></div>
        </div>
      </div>

      <div id="bar-result" style="
        display:none;
        margin-top:12px;
        padding:12px;
        background:#E6F1FB;
        border-radius:8px;
        font-size:13px;
        color:#185FA5;
      "></div>

      <div id="bar-history" style="margin-top:12px;"></div>
    `;
  },

  async start() {
    const statusEl = document.getElementById('bar-status');

    if (!('BarcodeDetector' in window)) {
      statusEl.innerHTML = `
        ❌ <strong>BarcodeDetector no está disponible</strong> en este navegador.<br>
        <span style="font-size:12px;">Actívalo en Chrome en <code>chrome://flags/#enable-experimental-web-platform-features</code></span>
      `;
      return;
    }

    try {
      statusEl.textContent = '⏳ Accediendo a la cámara...';

      // En móvil usamos cámara trasera para escanear mejor
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      const video = document.getElementById('bar-video');
      video.srcObject = this.stream;
      await video.play();

      // Obtener formatos soportados
      const formats = await BarcodeDetector.getSupportedFormats();
      this.detector = new BarcodeDetector({ formats });

      document.getElementById('btn-bar-start').disabled = true;
      document.getElementById('btn-bar-stop').disabled = false;
      document.getElementById('scan-guide').style.display = 'block';
      statusEl.textContent = '✅ Escáner activo — apunta a un código';

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
    const video = document.getElementById('bar-video');
    const canvas = document.getElementById('bar-canvas');
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');

    const loop = async () => {
      if (!this.stream) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const barcodes = await this.detector.detect(video);

        barcodes.forEach(barcode => {
          const { x, y, width, height } = barcode.boundingBox;

          // Rectángulo de detección
          ctx.strokeStyle = '#378ADD';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Fondo etiqueta
          ctx.fillStyle = 'rgba(24, 95, 165, 0.85)';
          ctx.fillRect(x, y - 28, Math.min(width, 220), 26);

          // Texto del valor
          ctx.fillStyle = 'white';
          ctx.font = 'bold 13px sans-serif';
          const label = barcode.rawValue.length > 25
            ? barcode.rawValue.substring(0, 25) + '...'
            : barcode.rawValue;
          ctx.fillText(label, x + 6, y - 10);

          // Solo procesar si es un resultado nuevo
          if (barcode.rawValue !== this.lastResult) {
            this.lastResult = barcode.rawValue;
            this.showResult(barcode);
          }
        });

      } catch (_) {}

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  },

  showResult(barcode) {
    const resultEl = document.getElementById('bar-result');
    const historyEl = document.getElementById('bar-history');
    if (!resultEl) return;

    const isURL = barcode.rawValue.startsWith('http');

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <strong>✅ Código detectado</strong><br><br>
      <strong>Formato:</strong> ${barcode.format}<br>
      <strong>Valor:</strong> ${barcode.rawValue}<br>
      ${isURL ? `<br><a href="${barcode.rawValue}" target="_blank"
        style="color:#185FA5; font-weight:500;">🔗 Abrir enlace</a>` : ''}
    `;

    // Agregar al historial
    if (historyEl) {
      const item = document.createElement('div');
      item.style.cssText = `
        padding:8px 10px; background:white; border:1px solid #e8eaed;
        border-radius:8px; font-size:12px; color:#374151; margin-bottom:6px;
      `;
      item.innerHTML = `
        <span style="color:#6b7280;">${barcode.format}</span> —
        <strong>${barcode.rawValue.substring(0, 40)}${barcode.rawValue.length > 40 ? '...' : ''}</strong>
      `;
      historyEl.prepend(item);

      // Máximo 5 en historial
      while (historyEl.children.length > 5) {
        historyEl.removeChild(historyEl.lastChild);
      }
    }
  },

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    this.lastResult = null;
    const video = document.getElementById('bar-video');
    const canvas = document.getElementById('bar-canvas');
    if (video) video.srcObject = null;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    const guide = document.getElementById('scan-guide');
    if (guide) guide.style.display = 'none';

    document.getElementById('btn-bar-start').disabled = false;
    document.getElementById('btn-bar-stop').disabled = true;
    document.getElementById('bar-status').textContent = '⏹ Escáner detenido';
  }
};