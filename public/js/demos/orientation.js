const orientationDemo = {
  active: false,
  handler: null,

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Orientation</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Detecta la orientación e inclinación del dispositivo en tiempo real
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1rem;">
        <button onclick="orientationDemo.start()" class="demo-btn" id="btn-ori-start">
          📱 Iniciar sensor
        </button>
        <button onclick="orientationDemo.stop()" class="demo-btn" id="btn-ori-stop" disabled>
          ⏹ Detener sensor
        </button>
      </div>

      <div id="ori-status" style="font-size:13px; color:#6b7280; margin-bottom:1rem;"></div>

      <!-- Visualizador 3D del dispositivo -->
      <div style="display:flex; justify-content:center; margin-bottom:1.5rem;">
        <div style="position:relative; width:120px; height:200px;">
          <div id="ori-device" style="
            width:120px; height:200px;
            background:white;
            border:2px solid #e8eaed;
            border-radius:16px;
            position:absolute;
            display:flex; align-items:center; justify-content:center;
            transition: transform 0.1s ease;
            box-shadow: 0 4px 16px rgba(24,95,165,0.10);
          ">
            <div style="
              width:80px; height:140px;
              background:#E6F1FB;
              border-radius:8px;
              display:flex; flex-direction:column;
              align-items:center; justify-content:center;
              gap:6px;
            ">
              <div style="font-size:24px;">📱</div>
              <div style="font-size:10px; color:#185FA5; font-weight:500;">DISPOSITIVO</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Valores numéricos -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:1rem;">
        <div style="background:#f5f6f8; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Alpha (Z)</div>
          <div id="ori-alpha" style="font-size:22px; font-weight:600; color:#185FA5;">—</div>
          <div style="font-size:10px; color:#6b7280;">rotación</div>
        </div>
        <div style="background:#f5f6f8; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Beta (X)</div>
          <div id="ori-beta" style="font-size:22px; font-weight:600; color:#185FA5;">—</div>
          <div style="font-size:10px; color:#6b7280;">adelante/atrás</div>
        </div>
        <div style="background:#f5f6f8; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Gamma (Y)</div>
          <div id="ori-gamma" style="font-size:22px; font-weight:600; color:#185FA5;">—</div>
          <div style="font-size:10px; color:#6b7280;">izq/der</div>
        </div>
      </div>

      <!-- Barra de nivel (burbuja) -->
      <div style="background:#f5f6f8; border-radius:10px; padding:12px;">
        <div style="font-size:12px; color:#6b7280; margin-bottom:8px;">Nivel (vista superior)</div>
        <div id="ori-level" style="
          position:relative;
          width:100%; height:80px;
          background:white;
          border:1px solid #e8eaed;
          border-radius:8px;
          overflow:hidden;
        ">
          <!-- Cruz de referencia -->
          <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#e8eaed;"></div>
          <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#e8eaed;"></div>
          <!-- Burbuja -->
          <div id="ori-bubble" style="
            position:absolute;
            width:20px; height:20px;
            background:#378ADD;
            border-radius:50%;
            top:50%; left:50%;
            transform:translate(-50%,-50%);
            transition:top 0.1s ease, left 0.1s ease;
          "></div>
        </div>
      </div>
    `;
  },

  async start() {
    const statusEl = document.getElementById('ori-status');

    // iOS 13+ requiere permiso explícito
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          statusEl.textContent = '⚠️ Permiso denegado para el sensor de orientación';
          return;
        }
      } catch (err) {
        statusEl.textContent = '❌ Error al solicitar permiso: ' + err.message;
        return;
      }
    }

    if (!('DeviceOrientationEvent' in window)) {
      statusEl.textContent = '❌ DeviceOrientationEvent no está soportado en este dispositivo';
      return;
    }

    this.active = true;
    this.handler = (e) => this.handleOrientation(e);
    window.addEventListener('deviceorientation', this.handler);

    document.getElementById('btn-ori-start').disabled = true;
    document.getElementById('btn-ori-stop').disabled = false;
    statusEl.textContent = '✅ Sensor activo — inclina tu dispositivo';
  },

  handleOrientation(e) {
    const alpha = e.alpha !== null ? Math.round(e.alpha) : null;
    const beta  = e.beta  !== null ? Math.round(e.beta)  : null;
    const gamma = e.gamma !== null ? Math.round(e.gamma) : null;

    // Actualizar valores numéricos
    const alphaEl = document.getElementById('ori-alpha');
    const betaEl  = document.getElementById('ori-beta');
    const gammaEl = document.getElementById('ori-gamma');
    if (alphaEl) alphaEl.textContent = alpha !== null ? `${alpha}°` : '—';
    if (betaEl)  betaEl.textContent  = beta  !== null ? `${beta}°`  : '—';
    if (gammaEl) gammaEl.textContent = gamma !== null ? `${gamma}°` : '—';

    // Rotar el dispositivo visual
    const device = document.getElementById('ori-device');
    if (device && beta !== null && gamma !== null) {
      device.style.transform = `rotateX(${beta * 0.3}deg) rotateY(${gamma * 0.3}deg)`;
    }

    // Mover la burbuja de nivel
    const bubble = document.getElementById('ori-bubble');
    const level  = document.getElementById('ori-level');
    if (bubble && level && gamma !== null && beta !== null) {
      const maxX = level.offsetWidth  / 2 - 14;
      const maxY = level.offsetHeight / 2 - 14;
      const x = Math.max(-maxX, Math.min(maxX, (gamma / 45) * maxX));
      const y = Math.max(-maxY, Math.min(maxY, (beta  / 45) * maxY));
      bubble.style.left = `calc(50% + ${x}px)`;
      bubble.style.top  = `calc(50% + ${y}px)`;

      // Color según inclinación
      const intensity = Math.sqrt(x * x + y * y) / Math.sqrt(maxX * maxX + maxY * maxY);
      const r = Math.round(55  + intensity * 180);
      const g = Math.round(138 - intensity * 80);
      const b = Math.round(221 - intensity * 100);
      bubble.style.background = `rgb(${r},${g},${b})`;
    }
  },

  stop() {
    if (this.handler) {
      window.removeEventListener('deviceorientation', this.handler);
      this.handler = null;
    }
    this.active = false;

    document.getElementById('btn-ori-start').disabled = false;
    document.getElementById('btn-ori-stop').disabled = true;
    document.getElementById('ori-status').textContent = '⏹ Sensor detenido';

    const alphaEl = document.getElementById('ori-alpha');
    const betaEl  = document.getElementById('ori-beta');
    const gammaEl = document.getElementById('ori-gamma');
    if (alphaEl) alphaEl.textContent = '—';
    if (betaEl)  betaEl.textContent  = '—';
    if (gammaEl) gammaEl.textContent = '—';
  }
};