<template>
  <div class="main">
    <div class="setting">
      <button class="setting-btn" @click="setting">设置</button>
      <button class="setting-btn" @click="togglePlay">{{ playButtonText }}</button>
      <button class="setting-btn" @click="playNext">下一首</button>
    </div>
    <table class="orderTable" :style="{ backgroundColor: form.backgroundColor, color: form.textColor }">
      <thead>
        <th>歌名</th>
        <th>歌手</th>
        <th>点歌人</th>
      </thead>
      <tbody id="songList">
        <tr v-for="order in form.orderList" :key="order.song.sid">
          <td>{{ order.song.sname }}</td>
          <td>{{ order.song.sartist }}</td>
          <td>{{ order.uname }}</td>
        </tr>
      </tbody>
      <div class="alertBox"></div>
      <audio ref="myAudio"></audio>
      <div class="progress">
        <div class="progress_bar" :style="{ width: form.progressBarWidth + 'px' }">
          <i class="dot" :class="{ dot_blink: form.isPlaying }"></i>
        </div>
      </div>
    </table>
    <transition name="fade">
      <DanmakuMusicConfig ref="configComp" v-show="form.showConfig === true" />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue';

import DanmakuMusicConfig from '@/components/DanmakuMusicConfig';
import { musicServer, qqmusicServer } from '@/utils/musicServer';
import { addInfoDanmaku, glabal, autoGetAndSave } from '@/utils/tool';
import { sget } from '@/utils/storage';

const myAudio = ref(null);
const configComp = ref(null);

const formDefaults = {
  audio: null,
  orderList: [],
  freeList: [],
  playErrorCount: 0,
  isPlaying: false,
  progressBarWidth: 0,
  showConfig: false,
  textColor: sget('musicConfig_textColor', '#ffffff'), // 默认文字颜色
  backgroundColor: sget('musicConfig_backgroundColor', '#0202027e'), // 默认背景颜色
};

// 定义要监视的属性名称
const watchedProps = ['orderList', 'freeList'];
const sKey = 'music';
const form = autoGetAndSave(sKey, formDefaults, watchedProps);
window.playerForm = form;

function setting() {
  form.showConfig = !form.showConfig;
}

function addOrder(order) {
  form.orderList.push(order);
}

// 示例：播放歌曲的方法
let playFadeIn = null;

const playButtonText = computed(() => (form.isPlaying ? '暂停' : '播放'));

function togglePlay() {
  if (myAudio.value) {
    if (isAudioPlaying()) {
      myAudio.value.pause();
    } else if (!myAudio.value.src) {
      if (form.orderList.length > 0) {
        play(form.orderList[0].song);
      } else {
        playNext();
      }
    } else {
      myAudio.value.play();
    }
  }
}

async function play(song) {
  if (!form.audio) {
    alert('播放器未初始化!');
    return;
  }
  // 根据歌曲信息，获取歌曲链接
  let url = null;
  if (song.platform && song.platform == 'qq') {
    url = song.url;
    // url = await qqmusicServer.getSongUrl(song.sid);
  } else {
    url = await musicServer.getSongUrl(song.sid);
  }
  // 检查歌曲链接
  if (!url) {
    // 若多首歌链接都获取失败，可能服务器问题，停止请求
    if (form.playErrorCount++ > 5) {
      setInterval(function () {
        addInfoDanmaku('多次播放失败，请确认服务器状态!');
      }, 7000);
      return;
    }
    addInfoDanmaku('歌曲链接被吃掉了(>_<) =>' + form.playErrorCount++);
    setTimeout(() => {
      // 播放下一首歌曲
      playNext();
    }, 3000);
    return;
  }
  /* 可能浏览器插件会导致 audio.src = null 后src并不等于null */
  form.audio.src = url;

  /*----------------------------音量淡入-------------------------------*/
  if (playFadeIn) {
    clearInterval(playFadeIn);
    playFadeIn = null;
  }
  form.audio.volume = 0;
  playFadeIn = setInterval(function () {
    /* 
        此处有两个注意点
        1. 此处若自增 0.1 会出现精度问题，0.1 + 0.2 不等于 0.3
        2. setInterval为全局函数，无法使用 this 指定对象
        */
    form.audio.volume = (form.audio.volume * 10 + 1) / 10;
    if (form.audio.volume == 1) {
      clearInterval(playFadeIn);
      playFadeIn = null;
    }
  }, 300);
  /*----------------------------音量淡入-------------------------------*/

  // 播放
  form.audio.play();
}

// 示例：播放下一首歌曲的方法
async function playNext() {
  if (form.orderList.length > 0) {
    form.orderList.shift();
  }
  // 此处省略其他逻辑...
  if (!form.orderList.length) {
    // 若点歌列表没有歌曲，则随机播放空闲歌单的歌曲
    if (!form.freeList.length) {
      // addInfoDanmaku("没有下一首可以放了>_<!");
      // 没有就去获取私人fm
      let songList = await musicServer.getPersonalFM();
      if (!songList.length) {
        addInfoDanmaku('获取失败!');
        return;
      }
      form.freeList = songList;
    }
    addOrder(form.freeList.shift());
  }

  // 播放当前第一首歌曲
  play(form.orderList[0].song);
}

function isAudioPlaying() {
  const audio = form.audio;
  return audio && !audio.paused && audio.currentTime > 0 && !audio.ended;
}

/*  识别弹幕命令
        @param: userDanmu 包括用户id、用户名、用户弹幕
    */
async function identifyDanmuCommand(userDanmu) {
  let danmu = userDanmu.danmu.trim();

  // 点歌命令触发
  let order = null;
  if (danmu.slice(0, 2) == '点歌') {
    // 获取点歌关键词
    let keyword = danmu.slice(2).trim();
    // 根据平台通过API查询歌曲信息
    let song = null;
    if (keyword.slice(0, 2) == 'qq') {
      song = await qqmusicServer.getSongInfo(keyword.slice(2).trim());
    } else {
      song = await musicServer.getSongInfo(keyword);
    }
    if (!song) {
      addInfoDanmaku('挺好听的，虽然我没找到<(▰˘◡˘▰)>');
      return;
    }
    // 封装点歌信息
    order = {
      uid: userDanmu.uid,
      uname: userDanmu.uname,
      song: song,
    };
    // 检查点歌信息
    if (!configComp.value.checkOrder(order)) {
      return;
    }

    // 添加点歌信息到点歌列表
    addOrder(order);
    // 如果当前点歌列表第一首是空闲歌单，则播放下一首
    if (form.orderList.length > 0 && form.orderList[0].uname == '私人FM') {
      playNext();
    } else if (!isAudioPlaying()) {
      // 开始播放
      play(form.orderList[0].song);
    }
  } else if (danmu == '切歌') {
    // 切歌命令，触发切歌流程
    const flag = glabal.musicConfig.adminList.find(admin => admin == userDanmu.uid);
    const devUid = 1568568;
    if (flag || form.orderList[0].uid == userDanmu.uid || userDanmu.uid == devUid) {
      // 如果当前播放的是该用户的歌曲，或者发送命令的是管理员，则播放下一首歌曲
      playNext();
    } else {
      addInfoDanmaku('不能切别人点的歌哦(^o^)');
    }
  }
}

onMounted(() => {
  form.audio = myAudio.value;
  // 初始化事件监听器
  form.audio.addEventListener('play', () => {
    form.isPlaying = true;
  });
  form.audio.addEventListener('pause', () => {
    form.isPlaying = false;
  });
  form.audio.addEventListener('timeupdate', () => {
    if (form.audio.duration > 0) {
      form.progressBarWidth = (form.audio.currentTime / form.audio.duration) * 280;
    }
  });
  form.audio.addEventListener('ended', playNext);
  form.audio.addEventListener('error', () => {
    alert('播放错误，即将播放下一首');
    playNext();
  });
});

function setBackgroudColor(color) {
  form.backgroundColor = color;
}

function setTextColor(color) {
  form.textColor = color;
}

provide('playerForm', form);
provide('play', play);
provide('playNext', playNext);
provide('addOrder', addOrder);
provide('setBackgroudColor', setBackgroudColor);
provide('setTextColor', setTextColor);

defineExpose({
  form,
  play,
  playNext,
  addOrder,
  identifyDanmuCommand,
});
// dev
glabal.dianGe = identifyDanmuCommand;
</script>

<style lang="scss">
body,
html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  color: white;
  background: transparent;
  display: flex;
  justify-content: center;
}

/* 定义过渡类 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 二维码 */
#qrImg {
  width: 200px;
  height: 200px;
  border-radius: 5px;
  display: none;
  box-shadow: 0px 0px 20px black;
  z-index: 4;
  left: 50%;
  top: 200px;
  position: absolute;
  transform: translate(-50%, -50%);
  transition: 0.5s;
}

.orderTable {
  width: 320px;
  margin-top: 24px;
  border-radius: 10px;
  margin-left: auto;
  margin-right: auto;
  background: #0202027e;
  box-shadow: 0px 0px 6px #8c7676;
  table-layout: fixed;
  position: relative;
  z-index: 1;
}

.orderTable thead th {
  font-size: 20px;
  text-align: center;
  padding: 10px;
  white-space: 1em;
}

.orderTable tbody td {
  padding: 10px;
  text-align: center;
  /* 隐藏溢出文字 */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.progress {
  z-index: 1;
  width: 280px;
  height: 3px;
  border-radius: 50px;
  background: rgb(255, 255, 255);
  /* 水平居中 */
  position: absolute;
  top: 47px;
  left: 50%;
  transform: translate(-50%, 0);
  /* 进度条居中 */
  display: flex;
  align-items: center;
}

.progress_bar {
  width: 0px;
  height: 3px;
  border-radius: 50px;
  background: #3d3c3c;
  position: relative;
}

.progress_bar .dot {
  z-index: 2;
  width: 3px;
  height: 3px;
  background: rgb(212, 211, 212);
  border-radius: 100%;
  box-shadow: 0px 0px 4px #000000;
  float: right;
}

/* 音乐进度条闪烁动画 */
.dot_blink {
  animation: dot_blink 3s infinite;
}

@keyframes dot_blink {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(4);
  }

  100% {
    transform: scale(1);
  }
}

.alertBox {
  width: 300px;
  height: 500px;
  position: absolute;
  top: 59px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.text {
  width: 0px;
  color: rgb(250, 136, 136);
  margin: 0px 0px 7px 0px;
  padding: 7px 0px 7px 0px;
  font-size: 17px;
  border-radius: 7px;
  background: #000000c0;
  box-shadow: 0px 0px 10px #5a5a5a;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  z-index: 3;
  text-overflow: ellipsis;
  animation: show 7s forwards ease-in-out;
}

@keyframes show {
  0% {
    width: 0px;
  }

  50% {
    width: 98%;
  }

  100% {
    width: 0;
  }
}

/* 配置按钮样式 */
.setting {
  position: absolute;
  top: 10px; // 或根据需要调整
  left: 50%;
  transform: translateX(-50%);
  z-index: 2; // 确保在 orderTable 上面
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.5s,
    visibility 0.5s;
}

.main {
  position: relative; // 使子元素的绝对定位相对于此元素
  width: 400px; // 或根据需求设置固定宽度
  margin-left: auto;
  margin-right: auto;
}

.main:hover .setting,
.setting:hover {
  opacity: 1;
  visibility: visible;
}

.setting-btn {
  padding: 6px 5px; /* 增加内边距，使按钮更易点击 */
  margin: 0 5px; /* 增加按钮之间的间隔 */
  font-size: 16px; /* 字体大小适中 */
  background-color: #333; /* 暗色调按钮背景色 */
  color: #fff; /* 亮色文字颜色以确保可读性 */
  border: 1px solid #444; /* 边框颜色稍亮于背景色，但仍保持暗调 */
  border-radius: 5px; /* 圆角边框 */
  cursor: pointer; /* 鼠标悬停时显示指针 */
  transition:
    background-color 0.3s,
    transform 0.3s; /* 过渡效果 */

  &:hover {
    background-color: #4a4a4a; /* 悬停时的背景色，比普通状态稍亮 */
    transform: translateY(-2px); /* 轻微上移效果 */
  }
}

/* 配置页面样式 */
.config {
  width: 400px;
  height: 400px;
  font-size: 21px;
  border-radius: 10px;
  overflow: auto;
  background: rgb(114, 114, 114);

  position: absolute;
  top: 74px;
  left: 50%;
  transform: translate(-50%, 0);
  display: flex;
  justify-content: center;
  z-index: 2;
  transition: 0.5s;
}

.config table {
  width: 500px;
}

.config tr td:nth-child(1) {
  width: 150px;
  font-weight: 500;
  text-align: justify;
  text-align-last: justify;
}

.config tr td:nth-child(2) {
  width: 200px;
  text-align: center;
  position: relative;
}

.config tr td:nth-child(2) > input {
  text-align: center;
}

.config tr td:nth-child(3) {
  text-align: center;
}

.config tr td input {
  /* outline: none; */
  width: 140px;
  padding: 3px;
  outline: none;
  border: 1px white solid;
  border-radius: 5px;
  font-size: large;
  background: rgb(187, 187, 187);
  position: absolute;
  transform: translate(-50%, -50%);
  transition: 0.5s;
}

.config tr td input:hover {
  width: 150px;
  box-shadow: 0px 0px 10px white;
  background: white;
}

/* 所有选择框 */
.config tr td select {
  outline: none;
  width: 100%;
  height: 100px;
  text-align: center;
  font-size: large;
  color: white;
  outline: none;
  overflow: auto;
  background: rgb(187, 187, 187);
  border-radius: 3px;
  transition: 0.5s;
}

.config tr td select option:checked {
  box-shadow: 0px 0px 10px black;
}

.config tr td select:hover {
  box-shadow: 0px 0px 20px black;
}

/* 黑名单框，覆盖全局选择框样式 */
#userBlackList,
#songBlackList {
  font-weight: bolder;
  border: 3px #000000 solid;
  background: rgb(16, 20, 16);
  transition: 0.5s;
}

.config tr td button {
  border: 0px;
  padding: 3px;
  width: 100px;
  outline: none;
  background: rgb(255, 253, 253);
  box-shadow: 1px 1px 10px white;
  border-radius: 5px;
  transition: 0.5s;
}

.config tr td button:hover {
  background: rgb(151, 151, 150);
}

.input {
  height: 50px;
}

.select {
  height: 120px;
}

/* 定义滚动条样式 */
::-webkit-scrollbar {
  width: 10px;
  height: 6px;
  background: transparent;
}

/*定义滚动条轨道 内阴影+圆角*/
::-webkit-scrollbar-track {
  /* box-shadow: inset 0 0 10px rgba(12, 235, 4, 0.5); */
  border-radius: 10px;
  background: transparent;
}

/*定义滑块 内阴影+圆角*/
::-webkit-scrollbar-thumb {
  border: 1px gray solid;
  border-radius: 10px;
  /* box-shadow: inset 0 0 0px rgba(145, 77, 77, 0.5); */
  background: rgb(255, 255, 255);
}
</style>
