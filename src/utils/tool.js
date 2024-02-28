const channel = new BroadcastChannel('pageAlert');

const addInfoDanmaku = msg => channel.postMessage(msg);
const glabal = {
  musicConfig: {},
};

window.glabal = glabal;

export { glabal, channel, addInfoDanmaku };
