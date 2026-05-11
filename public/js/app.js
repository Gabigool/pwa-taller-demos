function openDemo(name) {
  document.getElementById('modal-content').innerHTML = `<p style="color:#6b7280; font-size:14px;">Demo <strong>${name}</strong> — próximamente</p>`;
  document.getElementById('modal').classList.add('active');
}

function closeModal(e) {
  if (!e || e.target.id === 'modal') {
    document.getElementById('modal').classList.remove('active');
  }
}

const demos = {
  filesystem:     filesystemDemo,
  authentication: authenticationDemo,
  facedetection:  faceDetectionDemo,
  barcode:        barcodeDemo,
  screencapture:  screenCaptureDemo,
  audio:          audioDemo,
  orientation:    orientationDemo,
  motion:         motionDemo,
  multitouch:     multitouchDemo,
  viewtransition: viewTransitionDemo,
};

function openDemo(name) {
  const demo = demos[name];
  if (!demo) return;
  document.getElementById('modal-content').innerHTML = demo.render();
  document.getElementById('modal').classList.add('active');
}

function closeModal(e) {
  if (!e || e.target.id === 'modal') {
    if (faceDetectionDemo.stream)   faceDetectionDemo.stop();
    if (barcodeDemo.stream)         barcodeDemo.stop();
    if (screenCaptureDemo.stream)   screenCaptureDemo.stopCapture();
    if (audioDemo.stream)           audioDemo.stopRecording();
    if (orientationDemo.active)     orientationDemo.stop();
    if (motionDemo.active)          motionDemo.stop();
    if (multitouchDemo.active)      multitouchDemo.stop();
    document.getElementById('modal').classList.remove('active');
  }
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwa-taller/sw.js')
      .then(reg => console.log('SW registrado:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}