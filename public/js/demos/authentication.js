const authenticationDemo = {
  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">Authentication</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">
        Registro y autenticación biométrica sin contraseñas
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1.5rem;">
        <button onclick="authenticationDemo.register()" class="demo-btn">
          🔏 Registrar credencial
        </button>
        <button onclick="authenticationDemo.authenticate()" class="demo-btn" id="btn-auth" disabled>
          🔓 Autenticar
        </button>
      </div>

      <div id="auth-status" style="font-size:13px; color:#6b7280;"></div>

      <div id="auth-result" style="
        display:none;
        margin-top:1rem;
        padding:12px;
        background:#E6F1FB;
        border-radius:8px;
        font-size:12px;
        font-family:monospace;
        word-break:break-all;
        color:#185FA5;
      "></div>
    `;
  },

  credentialId: null,

  async register() {
    const statusEl = document.getElementById('auth-status');
    const resultEl = document.getElementById('auth-result');

    if (!window.PublicKeyCredential) {
      statusEl.textContent = '❌ WebAuthn no está soportado en este navegador';
      return;
    }

    try {
      statusEl.textContent = '⏳ Esperando autenticación del dispositivo...';
      resultEl.style.display = 'none';

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'PWA Taller', id: location.hostname },
          user: {
            id: userId,
            name: 'usuario@pwa-taller.com',
            displayName: 'Usuario PWA'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      });

      this.credentialId = credential.rawId;
      const idBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

      statusEl.textContent = '✅ Credencial registrada correctamente';
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <strong>Credential ID:</strong><br>
        ${idBase64.substring(0, 40)}...<br><br>
        <strong>Tipo:</strong> ${credential.type}<br>
        <strong>Autenticador:</strong> platform
      `;
      document.getElementById('btn-auth').disabled = false;

    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
        statusEl.textContent = '⚠️ Autenticación cancelada por el usuario';
      } else {
        statusEl.textContent = '❌ Error: ' + err.message;
      }
    }
  },

  async authenticate() {
    const statusEl = document.getElementById('auth-status');
    const resultEl = document.getElementById('auth-result');

    if (!this.credentialId) {
      statusEl.textContent = '⚠️ Primero debes registrar una credencial';
      return;
    }

    try {
      statusEl.textContent = '⏳ Verificando identidad...';

      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            type: 'public-key',
            id: this.credentialId,
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        }
      });

      statusEl.textContent = '✅ Autenticación exitosa';
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <strong>Resultado:</strong> Identidad verificada ✓<br><br>
        <strong>Tipo de respuesta:</strong> ${assertion.type}<br>
        <strong>Autenticador:</strong> platform (biometría / PIN)
      `;

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        statusEl.textContent = '⚠️ Autenticación cancelada';
      } else {
        statusEl.textContent = '❌ Error: ' + err.message;
      }
    }
  }
};