import { watch, reactive } from 'vue';
import { sget, sset } from '@/utils/storage';

const channel = new BroadcastChannel('pageAlert');

const addInfoDanmaku = msg => {
  console.log('addInfoDanmaku', msg);
  channel.postMessage(msg);
};
const glabal = {
  musicConfig: {},
  addInfoDanmaku,
};

function initializeForm(sKey, config) {
  const form = {};
  for (const key in config) {
    const value = sget(`${sKey}_${key}`, config[key]);
    if (value != null) form[key] = value;
  }
  return form;
}

function autoSave(sKey, form, watchedProps) {
  watchedProps.forEach(prop => {
    watch(
      () => form[prop],
      (newValue, oldValue) => {
        if (typeof newValue == 'object' || newValue !== oldValue) {
          sset(`${sKey}_${prop}`, newValue);
        }
      },
      { deep: true }
    );
  });
}

function autoGetAndSave(sKey, defaultValue, watchedProps = []) {
  const form = reactive(initializeForm(sKey, defaultValue));
  autoSave(sKey, form, watchedProps);

  return form;
}

function adjustColor(color, type = 0, threshold = -40, offset = -10, amount = -20) {
  let usePound = false;
  let opcity = 255;
  if (color[0] == '#') {
    if (color.length == 9) opcity = parseInt(color.slice(7), 16);
    color = color.slice(1, 7);
    usePound = true;
  }

  let num = parseInt(color, 16);

  let R = num >> 16;
  let G = num & 0x0000ff;
  let B = (num >> 8) & 0x00ff;
  //找到最大的色值
  let maxColorObject = findMaxRGB(R, G, B);
  //生成相近色
  let shallowColorArray = getShallowRGB(maxColorObject, R, G, B, threshold, offset, amount);
  let result = shallowColorArray[type];
  let r = result[0];
  let g = result[1];
  let b = result[2];

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16) + (opcity == 255 ? '' : opcity.toString(16));
}

function getShallowRGB(maxColorObject, R, G, B, threshold = 40, offset = 10, amount = 20) {
  let result = [];
  for (var d in maxColorObject) {
    if (d == 'R') {
      result = [
        [R - offset, G + threshold, B + threshold],
        [R - offset, G + threshold + amount, B + threshold + amount],
        [R - offset, G + threshold + 2 * amount, B + threshold + 2 * amount],
      ];
    } else if (d == 'G') {
      result = [
        [R + threshold, G - offset, B + threshold],
        [R + threshold + amount, G - offset, B + threshold + amount],
        [R + 3 * amount, G - offset, B + 3 * amount],
      ];
    } else if (d == 'B') {
      result = [
        [R + threshold, G + threshold, B - offset],
        [R + threshold + amount, G + threshold + amount, B - offset],
        [R + threshold + 2 * amount, G + threshold + 2 * amount, B - offset],
      ];
    }
  }
  return result;
}
//找到最大的RGB
function findMaxRGB(R, G, B) {
  let max;
  let index;
  if (R >= G && R >= B) {
    max = R;
    index = 'R';
  }
  if (G >= R && G >= B) {
    max = G;
    index = 'G';
  }
  if (B >= R && B >= G) {
    max = B;
    index = 'B';
  }
  return {
    [index]: max,
  };
}

window.glabal = glabal;

export { glabal, channel, addInfoDanmaku, autoGetAndSave, adjustColor };
