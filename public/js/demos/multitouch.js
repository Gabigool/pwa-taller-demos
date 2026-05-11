const multitouchDemo = {
  active: false,
  touches: {},
  initialDistance: null,
  initialScale: 1,
  currentScale: 1,

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Multitouch</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Detecta gestos táctiles con múltiples dedos simultáneos
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1rem;">
        <button onclick="multitouchDemo.start()" class="demo-btn" id="btn-mt-start">
          👆 Iniciar detección
        </button>
        <button onclick="multitouchDemo.stop()" class="demo-btn" id="btn-mt-stop" disabled>
          ⏹ Detener
        </button>
      </div>

      <div id="mt-status" style="font-size:13px; color:#6b7280; margin-bottom:1rem;"></div>

      <!-- Área de toque -->
      <div id="mt-area" style="
        width:100%; height:280px;
        background:#f5f6f8;
        border-radius:12px;
        border:2px dashed #e8eaed;
        position:relative;
        overflow:hidden;
        touch-action:none;
        display:flex; align-items:center; justify-content:center;
        user-select:none;
      ">
        <div id="mt-hint" style="
          text-align:center;
          color:#6b7280;
          pointer-events:none;
        ">
          <div style="font-size:32px; margin-bottom:8px;">👆</div>
          <div style="font-size:13px;">Toca aquí con uno o más dedos</div>
        </div>

        <!-- Objeto que se puede escalar -->
        <div id="mt-object" style="
          display:none;
          position:absolute;
          top:50%; left:50%;
          transform:translate(-50%,-50%) scale(1);
          width:80px; height:80px;
          background:#E6F1FB;
          border:2px solid #378ADD;
          border-radius:16px;
          display:none;
          align-items:center;
          justify-content:center;
          font-size:32px;
          transition:transform 0.05s ease;
          pointer-events:none;
        ">📱</div>

        <canvas id="mt-canvas" style="
          position:absolute;
          top:0; left:0;
          width:100%; height:100%;
          pointer-events:none;
        "></canvas>
      </div>

      <!-- Contador de dedos -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:1rem;">
        <div style="background:#f5f6f8; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Dedos activos</div>
          <div id="mt-count" style="font-size:28px; font-weight:600; color:#185FA5;">0</div>
        </div>
        <div style="background:#f5f6f8; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; margin-bottom:4px;">Escala (pinch)</div>
          <div id="mt-scale" style="font-size:28px; font-weight:600; color:#185FA5;">1.0x</div>
        </div>
      </div>

      <!-- Gestos detectados -->
      <div style="margin-top:1rem; background:#f5f6f8; border-radius:10px; padding:12px;">
        <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">Último gesto</div>
        <div id="mt-gesture" style="font-size:14px; font-weight:500; color:#185FA5;">—</div>
      </div>
    `;
  },

  start() {
    this.active = true;
    this.currentScale = 1;
    this.initialScale = 1;

    const area = document.getElementById('mt-area');
    if (!area) return;

    area.addEventListener('touchstart',  this.onTouchStart.bind(this),  { passive: false });
    area.addEventListener('touchmove',   this.onTouchMove.bind(this),   { passive: false });
    area.addEventListener('touchend',    this.onTouchEnd.bind(this),    { passive: false });
    area.addEventListener('touchcancel', this.onTouchEnd.bind(this),    { passive: false });

    // Mostrar objeto
    const obj = document.getElementById('mt-object');
    if (obj) {
      obj.style.display = 'flex';
    }

    document.getElementById('btn-mt-start').disabled = true;
    document.getElementById('btn-mt-stop').disabled = false;
    document.getElementById('mt-status').textContent = '✅ Detección activa — toca el área';
    document.getElementById('mt-hint').style.display = 'none';
  },

  onTouchStart(e) {
    e.preventDefault();
    Array.from(e.changedTouches).forEach(t => {
      this.touches[t.identifier] = { x: t.clientX, y: t.clientY };
    });

    const count = Object.keys(this.touches).length;
    this.updateCount(count);

    if (count === 2) {
      this.initialDistance = this.getTouchDistance();
      this.initialScale = this.currentScale;
      this.updateGesture('🤏 Pinch detectado — ajusta la escala');
    } else if (count === 1) {
      this.updateGesture('☝️ Un dedo');
    } else if (count === 3) {
      this.updateGesture('🖖 Tres dedos');
    } else if (count >= 4) {
      this.updateGesture(`✋ ${count} dedos`);
    }

    this.drawTouches();
  },

  onTouchMove(e) {
    e.preventDefault();
    Array.from(e.changedTouches).forEach(t => {
      this.touches[t.identifier] = { x: t.clientX, y: t.clientY };
    });

    const count = Object.keys(this.touches).length;

    if (count === 2 && this.initialDistance) {
      const currentDist = this.getTouchDistance();
      this.currentScale = Math.max(0.3, Math.min(3, this.initialScale * (currentDist / this.initialDistance)));

      const obj = document.getElementById('mt-object');
      if (obj) {
        obj.style.transform = `translate(-50%, -50%) scale(${this.currentScale})`;
      }

      const scaleEl = document.getElementById('mt-scale');
      if (scaleEl) scaleEl.textContent = `${this.currentScale.toFixed(1)}x`;

      const gesture = this.currentScale > this.initialScale
        ? '🔍 Zoom in (pinch out)'
        : '🔎 Zoom out (pinch in)';
      this.updateGesture(gesture);
    }

    this.drawTouches();
  },

  onTouchEnd(e) {
    Array.from(e.changedTouches).forEach(t => {
      delete this.touches[t.identifier];
    });

    const count = Object.keys(this.touches).length;
    this.updateCount(count);

    if (count < 2) {
      this.initialDistance = null;
    }
    if (count === 0) {
      this.updateGesture('—');
      this.clearCanvas();
    } else {
      this.drawTouches();
    }
  },

  getTouchDistance() {
    const pts = Object.values(this.touches);
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  drawTouches() {
    const canvas = document.getElementById('mt-canvas');
    const area   = document.getElementById('mt-area');
    if (!canvas || !area) return;

    canvas.width  = area.offsetWidth;
    canvas.height = area.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rect   = area.getBoundingClientRect();
    const colors = ['#378ADD', '#1D9E75', '#D85A30', '#7F77DD', '#BA7517'];

    Object.values(this.touches).forEach((touch, i) => {
      const x = touch.x - rect.left;
      const y = touch.y - rect.top;
      const color = colors[i % colors.length];

      // Círculo exterior
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.stroke();

      // Círculo interior
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // Número del dedo
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 1;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, x, y);
    });

    // Línea entre dos dedos (pinch)
    const pts = Object.values(this.touches);
    if (pts.length === 2) {
      const x1 = pts[0].x - rect.left;
      const y1 = pts[0].y - rect.top;
      const x2 = pts[1].x - rect.left;
      const y2 = pts[1].y - rect.top;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#378ADD';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  },

  clearCanvas() {
    const canvas = document.getElementById('mt-canvas');
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  },

  updateCount(count) {
    const el = document.getElementById('mt-count');
    if (el) el.textContent = count;
  },

  updateGesture(text) {
    const el = document.getElementById('mt-gesture');
    if (el) el.textContent = text;
  },

  stop() {
    this.active = false;
    this.touches = {};
    this.clearCanvas();

    const area = document.getElementById('mt-area');
    if (area) {
      area.replaceWith(area.cloneNode(true));
    }

    const obj = document.getElementById('mt-object');
    if (obj) obj.style.display = 'none';

    document.getElementById('btn-mt-start').disabled = false;
    document.getElementById('btn-mt-stop').disabled = true;
    document.getElementById('mt-status').textContent = '⏹ Detección detenida';
    document.getElementById('mt-count').textContent = '0';
    document.getElementById('mt-scale').textContent = '1.0x';
    document.getElementById('mt-gesture').textContent = '—';
  }
};