<template>
  <div class="config">
    <table>
      <tbody>
        <InputRow
          label="网易云"
          v-if="form.cookie == ''"
          isDisabled
          placeholder="请扫码登录"
          showButton
          buttonText="二维码登录"
          @buttonClick="qrLogin"
        />
        <InputRow
          label="网易云"
          v-if="form.cookie !== ''"
          v-model="form.isLogin"
          isDisabled
          placeholder="已登录"
          showButton
          buttonText="退出"
          @buttonClick="loginout"
        />
        <InputRow label="最大点歌数" inputType="number" v-model="form.maxOrder" />
        <InputRow label="最大歌曲时长" inputType="number" v-model="form.maxDuration" />
        <InputRow label="超时限播时长" inputType="number" v-model="form.overLimit" />
        <InputRow
          label="新增管理员"
          inputType="number"
          v-model="form.newAdminId"
          showButton
          buttonText="添加"
          @buttonClick="addAdmin"
        />

        <SelectRow
          label="管理员名单"
          v-model="form.adminList"
          :options="form.adminList.map(admin => ({ id: admin, value: admin, text: admin }))"
          buttonText="移除"
          @buttonClick="removeAdmin"
        />

        <SelectRow
          label="历史点歌用户"
          v-model="form.userHistory"
          :options="form.userHistory.map(user => ({ id: user.id, value: user, text: user.name }))"
          buttonText="加入黑名单"
          @buttonClick="addUserBlack"
        />

        <SelectRow
          label="用户黑名单"
          v-model="form.userBlackList"
          :options="form.userBlackList.map(user => ({ id: user.id, value: user, text: user.name }))"
          buttonText="移除黑名单"
          @buttonClick="delUserBlack"
        />

        <SelectRow
          label="历史点歌歌曲"
          v-model="form.songHistory"
          :options="form.songHistory.map(song => ({ id: song.id, value: song, text: song.name }))"
          buttonText="加入黑名单"
          @buttonClick="addSongBlack"
        />

        <SelectRow
          label="歌曲黑名单"
          v-model="form.songBlackList"
          :options="form.songBlackList.map(song => ({ id: song.id, value: song, text: song.name }))"
          buttonText="移除黑名单"
          @buttonClick="delSongBlack"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { inject, onMounted } from 'vue';
import InputRow from '@/components/DanmakuMusicConfigInputItem';
import SelectRow from '@/components/DanmakuMusicConfigSelectItem';
import { glabal, addInfoDanmaku, autoGetAndSave } from '@/utils/tool';
import { openQrLoginWindow } from '@/utils/qrLoginMusic';
import { musicServer } from '@/utils/musicServer';

const playerForm = inject('playerForm');

const configDefaults = {
  qrInfo: '',
  cookie: '',
  isLogin: '',
  maxOrder: 15,
  maxDuration: 0,
  overLimit: 0,
  newAdminId: '',
  adminList: [],
  userHistory: [],
  userBlackList: [],
  songHistory: [],
  songBlackList: [],
};

// 定义要监视的属性名称
const watchedProps = ['cookie', 'maxOrder', 'maxDuration', 'overLimit', 'adminList', 'userBlackList', 'songBlackList'];
const sKey = 'musicConfig';
const form = autoGetAndSave(sKey, configDefaults, watchedProps);

glabal.musicConfig = form;

function qrLogin() {
  // 实现二维码登录逻辑
  openQrLoginWindow();
}

function loginout() {
  form.cookie = '';
}

function addAdmin() {
  if (form.newAdminId) {
    form.adminList.push(form.newAdminId);
    form.newAdminId = ''; // 清空输入框
  }
}

function removeAdmin() {
  form.adminList = form.adminList.filter(admin => admin !== form.selectedAdmin);
}

function addUserBlack() {
  if (form.userHistory && !form.userBlackList.includes(form.userHistory)) {
    form.userBlackList.push(form.userHistory);
  }
}

function delUserBlack() {
  form.userBlackList = form.userBlackList.filter(user => user !== form.userBlackList);
}

function addSongBlack() {
  if (form.songHistory && !form.songBlackList.includes(form.songHistory)) {
    form.songBlackList.push(form.songHistory);
  }
}

function delSongBlack() {
  form.songBlackList = form.songBlackList.filter(song => song !== form.songBlackList);
}

function addUserHistory(data) {
  if (form.userHistory && !form.userHistory.includes(data)) {
    form.userHistory.push(data);
    if (form.userHistory.length > 50) {
      form.userHistory.shift();
    }
  }
}

function addSongHistory(data) {
  if (form.songHistory && !form.songHistory.includes(form.songHistory)) {
    form.songHistory.push(data);
    if (form.songHistory.length > 50) {
      form.songHistory.shift();
    }
  }
}

function checkOrder(order) {
  // 查询用户是否被拉入黑名单
  for (let i = 0; i < form.userBlackList.length; i++) {
    if (form.userBlackList[i].uid == order.uid) {
      addInfoDanmaku('你已被加入暗杀名单!(▼へ▼メ)!');
      return false;
    }
  }
  // 用户点歌数是否已达上限
  // if(playerForm.orderList.filter(value => value.uid == order.uid).length >= form.userOrder){
  //     addInfoDanmaku("你点太多啦，歇歇吧>_<!");
  //     return false;
  // }
  // 最大点歌数是否已达上限
  if (playerForm.orderList.length >= form.maxOrder) {
    addInfoDanmaku('我装不下更多的歌啦>_<!');
    return false;
  }

  // 查询歌曲是否被拉入黑名单
  for (let i = 0; i < form.songBlackList.length; i++) {
    if (form.songBlackList[i].sid == order.song.sid) {
      addInfoDanmaku('请不要乱点奇怪的歌!(▼ヘ▼#)');
      return false;
    }
  }

  // 判断该歌曲是否已在点歌列表
  if (
    playerForm.orderList.some(value => {
      if (value.song.platform == 'qq') {
        value.song.name == order.song.name;
      } else {
        value.song.sid == order.song.sid;
      }
    })
  ) {
    addInfoDanmaku('已经点上啦!>_<!');
    return false;
  }
  if (form.maxDuration > 0 && order.song.duration > form.maxDuration) {
    // 该歌曲是否无歌曲限制，且歌曲时长超出规定,
    addInfoDanmaku('你点的歌时太长啦!>_<');
    return false;
  }
  // 点歌成功，加入历史用户和历史歌曲列表中
  addUserHistory({
    id: order.uid,
    name: order.uname,
  });
  addSongHistory({
    id: order.song.sid,
    name: order.song.sname,
  });
  return true;
}

onMounted(async () => {
  if (form.cookie) {
    // 获取登录的用户信息
    let loginStatus = await musicServer.loginStatus();
    if (loginStatus.code == 200) {
      form.isLogin = '已登录';
    } else {
      form.cookie = '';
      addInfoDanmaku('网易云登录态失效!');
    }
  }
});

defineExpose({
  form,
  checkOrder,
});
</script>

<style lang="scss"></style>
