// WebRTC helpers migrated from SocialSpace
export const checkWebRTCSupport = () => {
  if (!window.RTCPeerConnection) throw new Error('WebRTC не поддерживается в этом браузере');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia не поддерживается в этом браузере');
  return true;
};

export const requestMediaPermissions = async (constraints = { audio: true, video: false }) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // stop immediately, we just check permissions
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch (e) {
    throw e;
  }
};

export const getOptimalConstraints = (callType) => ({
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100, channelCount: 1 },
  video: callType === 'video' ? { width: { min: 320, ideal: 640, max: 1280 }, height: { min: 240, ideal: 480, max: 720 }, frameRate: { min: 15, ideal: 30, max: 30 }, facingMode: 'user' } : false
});

export const handleWebRTCError = (error) => {
  let userMessage = 'Произошла ошибка во время звонка';
  if (error?.name === 'NotAllowedError') userMessage = 'Доступ к камере/микрофону запрещен';
  else if (error?.name === 'NotFoundError') userMessage = 'Устройство камеры/микрофона не найдено';
  else if (String(error.message || '').toLowerCase().includes('ice')) userMessage = 'Проблемы со связью';
  return userMessage;
};

// Монитор качества связи на основе getStats
// Возвращает функцию stop()
export const attachStatsMonitor = (pc, onQuality) => {
  if (!pc || typeof pc.getStats !== 'function') return () => {};
  let lastBytes = 0;
  let lastTs = 0;
  let stopped = false;
  const calc = async () => {
    if (stopped) return;
    try {
      const stats = await pc.getStats(null);
      let bytesNow = 0;
      let packetsLost = 0;
      let packetsTotal = 0;
      stats.forEach(r => {
        if (r.type === 'outbound-rtp' && !r.isRemote) {
          if (typeof r.bytesSent === 'number') bytesNow += r.bytesSent;
        }
        if (r.type === 'remote-inbound-rtp') {
          if (typeof r.packetsLost === 'number') packetsLost += r.packetsLost;
          if (typeof r.packetsReceived === 'number') packetsTotal += r.packetsReceived + r.packetsLost;
        }
      });
      const now = performance.now();
      let kbps = 0;
      if (lastTs && bytesNow >= lastBytes) {
        const deltaBytes = bytesNow - lastBytes;
        const deltaMs = now - lastTs;
        kbps = deltaMs > 0 ? Math.round((deltaBytes * 8) / deltaMs) : 0; // kbit/s approx
      }
      lastBytes = bytesNow;
      lastTs = now;
      const loss = packetsTotal > 0 ? (packetsLost / packetsTotal) : 0;
      // Простая эвристика качества 1..5
      let q = 5;
      if (loss > 0.1 || kbps < 16) q = 1;
      else if (loss > 0.05 || kbps < 32) q = 2;
      else if (loss > 0.02 || kbps < 64) q = 3;
      else if (loss > 0.01 || kbps < 96) q = 4;
      else q = 5;
      onQuality && onQuality({ quality: q, kbps, loss });
    } catch (_) {}
  };
  const timer = setInterval(calc, 2000);
  // первый замер через 1с
  setTimeout(calc, 1000);
  return () => { stopped = true; clearInterval(timer); };
};
