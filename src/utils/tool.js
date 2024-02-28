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

window.glabal = glabal;

export { glabal, channel, addInfoDanmaku, autoGetAndSave };
