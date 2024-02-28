const qrLoginService = 'https://mashir0-bilibili-qr-login.hf.space';

const getCenterPosition = (width, height) => {
  const screenWidth = document.body.clientWidth;
  const screenHeight = document.body.clientHeight;

  return {
    left: Math.round((screenWidth - width) / 2 + screenLeft),
    top: Math.round((screenHeight - height) / 2 + screenTop),
  };
};

const getFeaturesStr = features =>
  Object.entries(features)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');

export const openQrLoginWindow = () => {
  const width = 380;
  const height = 340;
  const features = getFeaturesStr({
    width,
    height,
    location: false,
    menubar: false,
    resizable: false,
    scrollbars: false,
    status: false,
    toolbar: false,
    ...getCenterPosition(width, height),
  });
  return window.open(`${qrLoginService}/?mode=window`, '_blank', features);
};

let handleLogin;

const handleMessage = e => {
  if (e.origin !== qrLoginService) return;
  const { type, data } = e.data;
  if (type === 'success') {
    if (data && typeof data === 'string') handleLogin?.(data);
    e.source?.close();
  }
};

export const bindQrLogin = fn => {
  handleLogin = fn;
  window.addEventListener('message', handleMessage);
};

export const unbindQrLogin = () => {
  handleLogin = null;
  window.removeEventListener('message', handleMessage);
};
