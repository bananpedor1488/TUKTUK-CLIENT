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
