<template>
  <div id="live">
    <DanmakuMusic ref="player" />
    <DanmakuList ref="danmakuList" v-bind="props" />
  </div>
</template>

<script>
import { onBeforeUnmount, ref, onMounted, computed } from 'vue';
import { KeepLiveWS } from 'bilibili-live-ws';
import { propsType } from '@/utils/props';

import DanmakuList from '@/components/DanmakuList';
import DanmakuMusic from '@/components/DanmakuMusic';

export default {
  components: { DanmakuMusic, DanmakuList },
  props: {
    ...propsType,
    anchor: Number,
    liveWsOptions: Object,
  },
  setup(props) {
    const player = ref(null);
    const danmakuList = ref(null);
    const showFace = computed(() => props.face !== 'false');

    let failedTimestamps = [];

    const addInfoDanmaku = message => {
      danmakuList.value.addDanmaku({
        type: 'info',
        message,
        stay: 5000,
      });
    };
    // const addDanmaku = danmaku => {
    //   // if (props.limit) danmakuList.value.addSpeedLimitDanmaku(danmaku);
    //   // else danmakuList.value.addDanmaku(danmaku);
    // };
    const channel = new BroadcastChannel('pageAlert');
    channel.onmessage = event => {
      // console.log("onmessage",event.data);
      addInfoDanmaku(event.data);
    };

    onMounted(() => {
      console.log('正在连接直播弹幕服务器', props.room);
      const live = new KeepLiveWS(props.room, props.liveWsOptions || { protover: 3, uid: 0 });
      live.interval = 1000;
      onBeforeUnmount(() => live.close());
      live.on('open', () => {
        if (live.closed) return;
        console.log('已连接直播弹幕服务器');
        addInfoDanmaku('已连接直播弹幕服务器');
      });
      live.on('live', () => {
        if (live.closed) return;
        console.log('已连接直播间', props.room);
        addInfoDanmaku(`已连接直播间 ${props.room}`);
      });
      live.on('close', () => {
        if (live.closed) return;
        console.log('连接已断开');
        addInfoDanmaku('连接已断开');
        const now = Date.now();
        failedTimestamps = failedTimestamps.filter(time => now - time < 10000);
        failedTimestamps.push(now);
        if (failedTimestamps.length >= 3) {
          console.log('连接失败过于频繁，停止重连');
          addInfoDanmaku('连接失败过于频繁，停止重连');
          live.close();
        }
      });
      // 弹幕
      live.on('DANMU_MSG', ({ info: [, danmu, [uid, uname]] }) => {
        console.log('收到弹幕', danmu, uname);
        // 处理点歌逻辑
        player.value.identifyDanmuCommand({ uid, uname, danmu });
      });
      live.on('LIVE_OPEN_PLATFORM_DM', ({ data: { uid, uname, msg } }) => {
        console.log('收到弹幕', msg, uname);
        // 处理点歌逻辑
        player.value.identifyDanmuCommand({ uid, uname, danmu: msg });
      });

      // SC
      live.on(
        'SUPER_CHAT_MESSAGE',
        ({
          data: {
            uid,
            user_info: { uname, face },
            message,
          },
        }) => {
          handleSuperChat({ uid, uname, message, face });
        }
      );
      live.on('LIVE_OPEN_PLATFORM_SUPER_CHAT', ({ data: { uid, uname, message, uface } }) => {
        handleSuperChat({ uid, uname, message, face: uface });
      });
      const handleSuperChat = () => {
        // giftList.value.addDanmaku({
        //   type: 'sc',
        //   showFace: showFace.value,
        //   uid,
        //   uname,
        //   message,
        //   face,
        // });
      };

      // 舰长
      const guardLevelMap = { 1: '总督', 2: '提督', 3: '舰长' };
      live.on('GUARD_BUY', ({ data: { uid, username, gift_name, num } }) => {
        handleGuard({ uid, uname: username, giftName: gift_name, num });
      });
      live.on('USER_TOAST_MSG', ({ data: { uid, username, role_name, num, unit } }) => {
        handleGuard({ uid, uname: username, giftName: role_name, num, unit });
      });
      live.on(
        'LIVE_OPEN_PLATFORM_GUARD',
        ({
          data: {
            user_info: { uid, uname, uface },
            guard_level,
            guard_num,
            guard_unit,
          },
        }) => {
          handleGuard({
            uid,
            uname,
            giftName: guardLevelMap[guard_level],
            num: guard_num,
            unit: guard_unit,
            face: uface,
          });
        }
      );
      const handleGuard = () => {
        // giftList.value.addDanmaku({
        //   type: 'gift',
        //   showFace: showFace.value,
        //   uid,
        //   uname,
        //   giftName: unit ? `${num}个${unit}${giftName}` : giftName,
        //   num: unit ? 0 : num,
        //   face,
        // });
      };
    });

    return { props, showFace, danmakuList, player };
  },
};
</script>

<style lang="scss">
#live {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: transparent;
  display: flex;
  flex-direction: column;
}
</style>
