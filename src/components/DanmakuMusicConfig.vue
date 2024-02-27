<template>
  <div id="panel" class="panel panel-default" spellcheck="false">
    <div class="panel-body">
      <div class="config">
        <!-- 网易云 -->
        <InputGroup header="网易云">
          <input type="text" placeholder="请扫码登录" v-model="form.qrInfo" disabled />
          <template #footer>
            <button @click="qrLogin">二维码登录</button>
          </template>
        </InputGroup>
        <!-- QQ音乐 -->
        <InputGroup header="QQ音乐">
          <input type="tel" placeholder="请输入cookie" v-model="form.cookie" />
          <template #footer>
            <button @click="setCookie">设置Cookie</button>
          </template>
        </InputGroup>
        <!-- 主播uid -->
        <InputGroup header="主播uid">
          <input type="text" v-model="form.adminId" />
        </InputGroup>
        <!-- 最大点歌数 -->
        <InputGroup header="最大点歌数">
          <input type="text" v-model="form.maxOrder" />
        </InputGroup>
        <!-- 最大歌曲时长 -->
        <InputGroup header="最大歌曲时长">
          <input type="text" v-model="form.maxDuration" />
        </InputGroup>
        <!-- 超时限播时长 -->
        <InputGroup header="超时限播时长">
          <input type="text" v-model="form.overLimit" />
        </InputGroup>
        <!-- 新增管理员 -->
        <InputGroup header="新增管理员">
          <input type="text" v-model="form.newAdminId" />
          <template #footer>
            <button @click="addAdmin">添加</button>
          </template>
        </InputGroup>
        <!-- 管理员名单 -->
        <InputGroup header="管理员名单">
          <select v-model="form.selectedAdmin" size="4">
            <option v-for="admin in form.adminList" :key="admin" :value="admin">{{ admin }}</option>
          </select>
          <template #footer>
            <button @click="removeAdmin">移除</button>
          </template>
        </InputGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { sget, sset } from '@/utils/storage';

const form = reactive({
  // 省略其他初始值以保持重点突出
  qrInfo: '',
  cookie: '',
  adminId: '',
  maxOrder: '',
  maxDuration: '',
  overLimit: '',
  newAdminId: '',
  adminList: [],
  selectedAdmin: null,
  ...sget('musicConfig', {}),
});

function qrLogin() {
  // 实现二维码登录逻辑
}

function setCookie() {
  // 实现设置Cookie逻辑
}

function addAdmin() {
  if (form.newAdminId) {
    form.adminList.push(form.newAdminId);
    form.newAdminId = ''; // 清空输入框
    sset('musicConfig', form);
  }
}

function removeAdmin() {
  form.adminList = form.adminList.filter(admin => admin !== form.selectedAdmin);
  sset('musicConfig', form);
}
</script>
