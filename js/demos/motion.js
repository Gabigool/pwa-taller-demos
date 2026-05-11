const motionDemo = {
  active: false,
  handler: null,
  historyX: [],
  historyY: [],
  historyZ: [],
  maxHistory: 50,
  animationId: null,

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Motion</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Detecta aceleración y rotación del dispositivo en tiempo real
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1rem;">
        <button onclick="motionDemo.start()" class="demo-btn" id="btn-mot-start">
          🌀 Iniciar sensor
        </button>
        <button onclick="motionDemo.stop()" class="demo-btn" id="btn-mot-stop" disabled>
          ⏹ Detener sensor
        </button>
      </div>

      <div id="mot-status" style="font-size:13px; color:#6b7280; margin-bottom:1rem;"></div>

      <!-- Acelerómetro -->
      <div style="margin-bottom:1rem;">
        <div style="font-size:12px; font-weight:500; color:#374151; margin-bottom:8px;">
          Aceleración (m/s²)
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
          <div style="background:#f5f6f8; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">X</div>
            <div id="mot-ax" style="font-size:20px; font-weight:600; color:#185FA5;">—</div>
          </div>
          <div style="background:#f5f6f8; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Y</div>
            <div id="mot-ay" style="font-size:20px; font-weight:600; color:#185FA5;">—</div>
          </div>
          <div style="background:#f5f6f8; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Z</div>
            <div id="mot-az" style="font-size:20px; font-weight:600; color:#185FA5;">—</div>
          </div>
        </div>
      </div>

      <!-- Giroscopio -->
      <div style="margin-bottom:1rem;">
        <div style="font-size:12px; font-weight:500; color:#374151; margin-bottom:8px;">
          Velocidad de rotación (°/s)
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
          <div style="background:#f5f6f8; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Alpha</div>
            <div id="mot-ra" style="font-size:20px; font-weight:600; color:#378ADD;">—</div>
          </div>
          <div style="background:#f5f6f8; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Beta</div>
            <div id="mot-rb" style="font-size:20px; font-weight:600; color:#378ADD;">—</div>
          </div>
          <div style="background:#f5f6f8; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Gamma</div>
            <div id="mot-rg" style="font-size:20px; font-weight:600; color:#378ADD;">—</div>
          </div>
        </div>
      </div>

      <!-- Gráfica de historial -->
      <div style="background:#f5f6f8; border-radius:10px; padding:12px;">
        <div style="font-size:12px; color:#6b7280; margin-bottom:8px;">
          Historial de aceleración
          <span style="margin-left:8px;">
            <span style="color:#378ADD;">— X</span>
            <span style="color:#1D9E75; margin-left:6px;">— Y</span>
            <span style="color:#D85A30; margin-left:6px;">— Z</span>
          </span>
        </div>
        <canvas id="mot-canvas" height="80"
          style="width:100%; display:block; border-radius:8px;">
        </canvas>
      </div>

      <!-- Intensidad de movimiento -->
      <div style="margin-top:1rem; background:#f5f6f8; border-radius:10px; padding:12px;">
        <div style="font-size:12px; color:#6b7280; margin-bottom:8px;">Intensidad de movimiento</div>
        <div style="background:#e8eaed; border-radius:20px; height:10px; overflow:hidden;">
          <div id="mot-intensity-bar" style="
            height:100%; width:0%;
            background:#378ADD;
            border-radius:20px;
            transition:width 0.15s ease, background 0.15s ease;
          "></div>
        </div>
        <div id="mot-intensity-label" style="font-size:12px; color:#6b7280; margin-top:6px;">
          Sin movimiento
        </div>
      </div>
    `;
  },

  async start() {
    const statusEl = document.getElementById('mot-status');

    // iOS 13+ requiere permiso explícito
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          statusEl.textContent = '⚠️ Permiso denegado para el sensor de movimiento';
          return;
        }
      } catch (err) {
        statusEl.textContent = '❌ Error al solicitar permiso: ' + err.message;
        return;
      }
    }

    if (!('DeviceMotionEvent' in window)) {
      statusEl.textContent = '❌ DeviceMotionEvent no está soportado en este dispositivo';
      return;
    }

    this.historyX = [];
    this.historyY = [];
    this.historyZ = [];
    this.active = true;

    this.handler = (e) => this.handleMotion(e);
    window.addEventListener('devicemotion', this.handler);

    document.getElementById('btn-mot-start').disabled = true;
    document.getElementById('btn-mot-stop').disabled = false;
    statusEl.textContent = '✅ Sensor activo — mueve tu dispositivo';

    this.drawChart();
  },

  handleMotion(e) {
    const acc = e.accelerationIncludingGravity;
    const rot = e.rotationRate;

    if (!acc) return;

    const ax = acc.x !== null ? parseFloat(acc.x.toFixed(2)) : 0;
    const ay = acc.y !== null ? parseFloat(acc.y.toFixed(2)) : 0;
    const az = acc.z !== null ? parseFloat(acc.z.toFixed(2)) : 0;

    // Actualizar valores de aceleración
    const axEl = document.getElementById('mot-ax');
    const ayEl = document.getElementById('mot-ay');
    const azEl = document.getElementById('mot-az');
    if (axEl) axEl.textContent = ax.toFixed(1);
    if (ayEl) ayEl.textContent = ay.toFixed(1);
    if (azEl) azEl.textContent = az.toFixed(1);

    // Actualizar velocidad de rotación
    if (rot) {
      const raEl = document.getElementById('mot-ra');
      const rbEl = document.getElementById('mot-rb');
      const rgEl = document.getElementById('mot-rg');
      if (raEl && rot.alpha !== null) raEl.textContent = rot.alpha.toFixed(1);
      if (rbEl && rot.beta  !== null) rbEl.textContent = rot.beta.toFixed(1);
      if (rgEl && rot.gamma !== null) rgEl.textContent = rot.gamma.toFixed(1);
    }

    // Guardar historial
    this.historyX.push(ax);
    this.historyY.push(ay);
    this.historyZ.push(az);
    if (this.historyX.length > this.maxHistory) this.historyX.shift();
    if (this.historyY.length > this.maxHistory) this.historyY.shift();
    if (this.historyZ.length > this.maxHistory) this.historyZ.shift();

    // Calcular intensidad de movimiento
    const intensity = Math.min(100, Math.sqrt(ax * ax + ay * ay + az * az) * 5);
    const bar   = document.getElementById('mot-intensity-bar');
    const label = document.getElementById('mot-intensity-label');

    if (bar) {
      bar.style.width = `${intensity}%`;
      if (intensity < 20) {
        bar.style.background = '#378ADD';
      } else if (intensity < 60) {
        bar.style.background = '#1D9E75';
      } else {
        bar.style.background = '#D85A30';
      }
    }

    if (label) {
      if (intensity < 10)      label.textContent = 'Sin movimiento';
      else if (intensity < 30) label.textContent = 'Movimiento leve';
      else if (intensity < 60) label.textContent = 'Movimiento moderado';
      else                     label.textContent = '⚡ Movimiento intenso';
    }
  },

  drawChart() {
    const canvas = document.getElementById('mot-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (!this.active) return;
      this.animationId = requestAnimationFrame(draw);

      canvas.width = canvas.offsetWidth;
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f5f6f8';
      ctx.fillRect(0, 0, w, h);

      // Línea central
      ctx.strokeStyle = '#e8eaed';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();

      // Dibujar líneas de historial
      const drawLine = (data, color) => {
        if (data.length < 2) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        data.forEach((val, i) => {
          const x = (i / this.maxHistory) * w;
          const y = mid - (val / 20) * mid;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
      };

      drawLine(this.historyX, '#378ADD');
      drawLine(this.historyY, '#1D9E75');
      drawLine(this.historyZ, '#D85A30');
    };

    draw();
  },

  stop() {
    if (this.handler) {
      window.removeEventListener('devicemotion', this.handler);
      this.handler = null;
    }
    this.active = false;
    cancelAnimationFrame(this.animationId);

    document.getElementById('btn-mot-start').disabled = false;
    document.getElementById('btn-mot-stop').disabled = true;
    document.getElementById('mot-status').textContent = '⏹ Sensor detenido';

    ['mot-ax','mot-ay','mot-az','mot-ra','mot-rb','mot-rg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });

    const bar = document.getElementById('mot-intensity-bar');
    if (bar) bar.style.width = '0%';
    const label = document.getElementById('mot-intensity-label');
    if (label) label.textContent = 'Sin movimiento';
  }
};