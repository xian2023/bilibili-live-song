import { musicServer } from '@/utils/musicServer';
import { addInfoDanmaku, glabal } from '@/utils/tool';

// const qrLoginService = musicServer.baseUrl;

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

let qrWindow = null;
export const openQrLoginWindow = async () => {
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

  let unikey = await musicServer.getQrKey();
  // 用二维码key获取二维码图片
  let img = await musicServer.getQrPicture(unikey);
  let blob = await (await fetch(img)).blob();
  let url = URL.createObjectURL(blob);
  qrWindow = window.open(url, '_blank', features);

  qrCheck(unikey);
};

let qrCheckInterval = null;
function qrCheck(unikey) {
  clearInterval(qrCheckInterval);
  qrCheckInterval = setInterval(async () => {
    let data = await musicServer.checkQrStatus(unikey);
    if (!data) {
      addInfoDanmaku('请求失败!');
      clearInterval(qrCheckInterval);
      qrWindow.close();
    }
    if (data.code == 800) {
      // 二维码过期
      addInfoDanmaku('二维码已过期');
      clearInterval(qrCheckInterval);
      qrWindow.close();
    } else if (data.code == 803) {
      // 授权成功
      // 保存cookie
      glabal.musicConfig.cookie = data.cookie;
      // 登录成功后重新加载空闲歌单
      // this.loadSongList(this.songListId);
      // e.target.textContent = "退出登录";
      // document.getElementById('qrInfo').value = "已登录";
      addInfoDanmaku('登录成功');
      // 清除定时器
      clearInterval(qrCheckInterval);
      qrWindow.close();
    }
  }, 3000);
}

// let handleLogin;

// const handleMessage = e => {
//     if (e.origin !== qrLoginService) return;
//     const { type, data } = e.data;
//     if (type === 'success') {
//         if (data && typeof data === 'string') handleLogin?.(data);
//         e.source?.close();
//     }
// };

// export const bindQrLogin = fn => {
//     handleLogin = fn;
//     window.addEventListener('message', handleMessage);
// };

// export const unbindQrLogin = () => {
//     handleLogin = null;
//     window.removeEventListener('message', handleMessage);
// };
