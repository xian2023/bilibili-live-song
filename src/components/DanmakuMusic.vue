<template>
  <div class="main">
    <div class="setting">
      <button class="setting-btn" @click="setting">设置</button>
      <button class="setting-btn" @click="nextSong">下一首</button>
    </div>
    <table class="orderTable">
      <thead>
        <th>歌名</th>
        <th>歌手</th>
        <th>点歌人</th>
      </thead>
      <tbody id="songList">
        <tr v-for="order in orderList" :key="order.song.sid">
          <td>{{ order.song.sname }}</td>
          <td>{{ order.song.sartist }}</td>
          <td>{{ order.uname }}</td>
        </tr>
      </tbody>
    </table>
    <DanmakuMusicConfig v-if="showConfig === true" />
    <div class="alertBox"></div>
    <div class="progress">
      <div class="progress_bar" :style="{ width: progressBarWidth + 'px' }">
        <i class="dot" :class="{ dot_blink: isPlaying }"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';

import DanmakuMusicConfig from '@/components/DanmakuMusicConfig';
import { musicServer, qqmusicServer } from '@/utils//musicServer';

// 创建音频对象
const audio = ref('');
const orderList = ref([]);
const freeList = ref([]);
const playErrorCount = ref(0);
const isPlaying = ref(false);
const progressBarWidth = ref(0);
const showConfig = ref(false);

function setting() {
  showConfig.value = !showConfig.value;
}

function addOrder(order) {
  orderList.value.push(order);
  // 在此处添加对DOM的处理，Vue模板已自动处理
}

const channel = new BroadcastChannel('pageAlert');
const musicMethod = {
  pageAlert: msg => {
    channel.postMessage(msg);
  },
};

// 示例：播放歌曲的方法
let playFadeIn = null;

async function play(song) {
  if (!audio.value) {
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
    if (playErrorCount.value++ > 5) {
      setInterval(function () {
        musicMethod.pageAlert('多次播放失败，请确认服务器状态!');
      }, 7000);
      return;
    }
    musicMethod.pageAlert('歌曲链接被吃掉了(>_<) =>' + playErrorCount.value++);
    setTimeout(() => {
      // 播放下一首歌曲
      playNext();
    }, 3000);
    return;
  }
  /* 可能浏览器插件会导致 audio.src = null 后src并不等于null */
  audio.value.src = url;

  /*----------------------------音量淡入-------------------------------*/
  if (playFadeIn) {
    clearInterval(playFadeIn);
    playFadeIn = null;
  }
  audio.value.volume = 0;
  playFadeIn = setInterval(function () {
    /* 
        此处有两个注意点
        1. 此处若自增 0.1 会出现精度问题，0.1 + 0.2 不等于 0.3
        2. setInterval为全局函数，无法使用 this 指定对象
        */
    audio.value.volume = (audio.value.volume * 10 + 1) / 10;
    if (audio.value.volume == 1) {
      clearInterval(playFadeIn);
      playFadeIn = null;
    }
  }, 300);
  /*----------------------------音量淡入-------------------------------*/

  // 播放
  audio.value.play();
}

// 示例：播放下一首歌曲的方法
async function playNext() {
  if (orderList.value.length > 0) {
    orderList.value.shift();
  }
  // 此处省略其他逻辑...
  if (!orderList.value.length) {
    // 若点歌列表没有歌曲，则随机播放空闲歌单的歌曲
    if (!freeList.value.length) {
      // musicMethod.pageAlert("没有下一首可以放了>_<!");
      // 没有就去获取私人fm
      let songList = await musicServer.getPersonalFM();
      if (!songList.length) {
        // musicMethod.pageAlert("获取失败!");
        return;
      }
      freeList.value = songList;
    }
    addOrder(freeList.value.shift());
  }

  // 播放当前第一首歌曲
  play(orderList.value[0].song);
}

onMounted(() => {
  audio.value = new Audio();
  // 初始化事件监听器
  audio.value.addEventListener('play', () => {
    isPlaying.value = true;
  });
  audio.value.addEventListener('pause', () => {
    isPlaying.value = false;
  });
  audio.value.addEventListener('timeupdate', () => {
    if (audio.value.duration > 0) {
      progressBarWidth.value = (audio.value.currentTime / audio.value.duration) * 280;
    }
  });
  audio.value.addEventListener('ended', playNext);
  audio.value.addEventListener('error', () => {
    alert('播放错误，即将播放下一首');
    playNext();
  });
});
</script>

<style lang="scss">
// 定义一些常用的变量
$primary-color: white;
$background-color: transparent;
$shadow-color: black;
$progress-bar-color: #3d3c3c;
$alert-background: #000000c0;
$alert-shadow: #5a5a5a;
$setting-btn-hover-bg: rgb(235, 152, 152);
$config-background: rgb(114, 114, 114);
$input-background: rgb(187, 187, 187);
$input-hover-background: white;

body,
html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  color: $primary-color;
  background: $background-color;
  display: flex;
  justify-content: center;
}

#qrImg {
  width: 200px;
  height: 200px;
  border-radius: 5px;
  display: none;
  box-shadow: 0 0 20px $shadow-color;
  z-index: 4;
  position: absolute;
  left: 50%;
  top: 200px;
  transform: translate(-50%, -50%);
  transition: 0.5s;
}

.orderTable {
  width: 320px;
  margin-top: 20px;
  border-radius: 10px;
  background: #0202027e;
  box-shadow: 0 0 6px $shadow-color;
  table-layout: fixed;
  position: relative;

  thead th {
    font-size: 20px;
    text-align: center;
    padding: 10px;
  }

  tbody td {
    padding: 10px;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.progress {
  @extend .orderTable; // 假设进度条和订单表格有共同的样式
  width: 280px;
  height: 3px;
  border-radius: 50px;
  background: $primary-color;
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translate(-50%, 0);
  display: flex;
  align-items: center;

  &_bar {
    width: 0;
    height: 3px;
    border-radius: 50px;
    background: $progress-bar-color;
    position: relative;

    .dot {
      z-index: 2;
      width: 3px;
      height: 3px;
      background: rgb(212, 211, 212);
      border-radius: 100%;
      box-shadow: 0 0 4px $shadow-color;
      float: right;
    }
  }
}

@keyframes dot_blink {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(4);
  }
}

.alertBox {
  width: 300px;
  height: 500px;
  position: absolute;
  top: 59px;
  background: $background-color;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .text {
    color: rgb(250, 136, 136);
    margin: 0 0 7px;
    padding: 7px 0;
    font-size: 17px;
    border-radius: 7px;
    background: $alert-background;
    box-shadow: 0 0 10px $alert-shadow;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    z-index: 3;
    text-overflow: ellipsis;
    animation: show 7s forwards ease-in-out;
  }
}

@keyframes show {
  0% {
    width: 0;
  }

  50% {
    width: 98%;
  }

  100% {
    width: 0;
  }
}

.setting {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.5s;
}
</style>
