const filesystemDemo = {
  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">FileSystem</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1.5rem;">Lee y guarda archivos desde tu dispositivo</p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1.5rem;">
        <button onclick="filesystemDemo.openFile()" class="demo-btn">
          📂 Abrir archivo
        </button>
        <button onclick="filesystemDemo.saveFile()" class="demo-btn" id="btn-save" disabled>
          💾 Guardar cambios
        </button>
      </div>

      <div id="fs-status" style="font-size:12px; color:#6b7280; margin-bottom:10px;"></div>

      <textarea id="fs-content"
        placeholder="El contenido del archivo aparecerá aquí. También puedes editarlo y guardar..."
        style="width:100%; height:200px; padding:10px; border:1px solid #e8eaed;
               border-radius:8px; font-size:13px; resize:vertical; font-family:monospace;">
      </textarea>
    `;
  },

  fileHandle: null,

  async openFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Archivos de texto', accept: { 'text/*': ['.txt', '.html', '.css', '.js', '.json'] } }]
      });
      this.fileHandle = handle;
      const file = await handle.getFile();
      const content = await file.text();
      document.getElementById('fs-content').value = content;
      document.getElementById('fs-status').textContent = `✅ Archivo abierto: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      document.getElementById('btn-save').disabled = false;
    } catch (err) {
      if (err.name !== 'AbortError') {
        document.getElementById('fs-status').textContent = '❌ Error al abrir el archivo';
      }
    }
  },

  async saveFile() {
    if (!this.fileHandle) return;
    try {
      const writable = await this.fileHandle.createWritable();
      await writable.write(document.getElementById('fs-content').value);
      await writable.close();
      document.getElementById('fs-status').textContent = '✅ Archivo guardado correctamente';
    } catch (err) {
      document.getElementById('fs-status').textContent = '❌ Error al guardar: ' + err.message;
    }
  }
};