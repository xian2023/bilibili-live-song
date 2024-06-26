<template>
  <div id="panel" class="panel panel-default" spellcheck="false">
    <div class="panel-heading">
      <h2 class="panel-title" style="font-size: 30px; display: inline-block; margin-right: 10px">Bilibili Live Chat</h2>
      <iframe
        src="https://ghbtns.com/github-btn.html?user=Tsuk1ko&amp;repo=bilibili-live-chat&amp;type=star&amp;count=true&amp;size=large"
        frameborder="0"
        scrolling="0"
        width="160px"
        height="30px"
        style="vertical-align: bottom"
      ></iframe>
      <button class="btn btn-primary" type="button" :disabled="!canGo" @click="goLive">GoLive!</button>
      <button class="btn btn-primary" type="button" :disabled="!canGo" @click="goSong">GoSong!</button>
      <button class="btn" :class="copyLinkClass" type="button" :disabled="!canGo" @click="copyLink">
        {{ copyLinkText }}
      </button>
    </div>
    <div class="panel-body">
      <!-- 连接模式 -->
      <InputGroup header="连接模式">
        <select class="form-control" v-model="form.auth">
          <option v-for="{ value, text } in options.auth" :key="value" :value="value">{{ text }}</option>
        </select>
        <template #footer>
          <a href="https://github.com/Tsuk1ko/bilibili-live-chat#连接模式" target="_blank">查看说明</a>
        </template>
      </InputGroup>
      <template v-if="form.auth === 'normal'">
        <!-- 直播间号 -->
        <InputGroup header="直播间号">
          <input
            class="form-control"
            type="number"
            min="0"
            step="1"
            placeholder="必填，支持短号"
            v-model.number="form.room"
          />
        </InputGroup>
        <!-- Cookie -->
        <InputGroup header="Cookie">
          <input class="form-control" type="text" placeholder="选填，不填则为游客模式" v-model="form.cookie" />
          <template #footer v-if="showQrLogin">
            <a style="cursor: pointer" @click="openQrLoginWindow">扫码登录</a>
          </template>
        </InputGroup>
      </template>
      <template v-else-if="form.auth === 'open'">
        <!-- AKId -->
        <InputGroup header="AKId">
          <input
            class="form-control"
            type="text"
            placeholder="必填，开放平台 - 个人资料 - access_key_id"
            v-model="form.akId"
          />
        </InputGroup>
        <!-- AKSecret -->
        <InputGroup header="AKSecret">
          <input
            class="form-control"
            type="text"
            placeholder="必填，开放平台 - 个人资料 - access_key_secret"
            v-model="form.akSecret"
          />
        </InputGroup>
        <!-- AppId -->
        <InputGroup header="AppId">
          <input
            class="form-control"
            type="number"
            min="0"
            step="1"
            placeholder="必填，开放平台 - 我的项目 - 项目ID"
            v-model.number="form.appId"
          />
        </InputGroup>
        <!-- 身份码 -->
        <InputGroup header="身份码">
          <input class="form-control" type="text" placeholder="必填，直播间开播后可见" v-model="form.code" />
        </InputGroup>
      </template>
      <!-- 跨域模式 -->
      <InputGroup header="跨域模式">
        <select class="form-control" v-model="form.cors">
          <option v-for="{ value, text } in options.cors" :key="value" :value="value">{{ text }}</option>
        </select>
        <template #footer>
          <a href="https://github.com/Tsuk1ko/bilibili-live-chat#跨域模式" target="_blank">查看说明</a>
        </template>
      </InputGroup>
      <!-- 屏蔽用户 -->
      <!-- <InputGroup header="屏蔽用户">
        <input
          class="form-control"
          type="text"
          placeholder="选填，将不显示指定UID用户的弹幕和礼物，用英文逗号(,)分隔"
          v-model="form.blockUID"
        />
      </InputGroup> -->
      <InputGroup header="自定义CSS">
        <textarea
          class="form-control"
          placeholder="OBS在添加浏览器的时候可以设置自定义CSS，不需要该设置项"
          v-model="form.customCss"
        />
      </InputGroup>
    </div>
  </div>
</template>

<script>
import { defineComponent, unref, reactive, watch, computed, readonly, ref, onBeforeUnmount } from 'vue';
import InputGroup from '@/components/InputGroup.vue';
import { sget, sset } from '@/utils/storage';
import { defaultProps, intProps, selectOptions } from '@/utils/props';
import { stringify as qss } from 'query-string';
import { fromPairs, pick, omit } from 'lodash';
import { bindQrLogin, openQrLoginWindow, unbindQrLogin } from '@/utils/qrLogin';

export default defineComponent({
  components: { InputGroup },
  setup() {
    const form = reactive({
      ...defaultProps,
      ...sget('setting', {}),
    });
    // 迁移
    if (form.face !== 'false') form.face = true;
    intProps.forEach(key => {
      watch(
        () => form[key],
        value => {
          if (typeof value !== 'number') return;
          const newVal = Math.max(Math.floor(value), 0);
          if (value === newVal) return;
          form[key] = newVal;
        },
        { immediate: true }
      );
    });

    const canGo = computed(() => {
      const { auth, room, akId, akSecret, appId, code } = form;
      switch (auth) {
        case 'normal':
          return !!room;
        case 'open':
          return !!(akId && akSecret && appId && code);
      }
      return false;
    });

    const simpleForm = computed(() =>
      pick(
        fromPairs(
          Object.entries(form)
            .filter(([k, v]) => {
              const val = unref(v);
              return val && val !== defaultProps[k];
            })
            .map(([k, v]) => [k, unref(v)])
        ),
        Object.keys(defaultProps)
      )
    );
    watch(simpleForm, value => {
      sset('setting', value);
    });

    // 定义处理cookie变化的方法
    const processBilibiliCookie = function (cookieString) {
      // 使用;分割cookie字符串
      const cookiesArray = cookieString.split(';');
      // 初始化一个数组来存储处理后的cookie
      let processedCookies = [];
      const checkCookies = [
        'buvid3',
        'b_nut',
        'b_ut',
        'SESSDATA',
        'bili_jct',
        'DedeUserID',
        'DedeUserID__ckMd5',
        'sid',
      ];
      // 遍历cookies数组
      cookiesArray.forEach(cookie => {
        // 去除cookie前后的空格
        const trimmedCookie = cookie.trim();
        // 如果是需要的cookie，则加入到处理后的数组中
        for (const checkCookie of checkCookies) {
          if (trimmedCookie.startsWith(checkCookie + '=')) {
            processedCookies.push(trimmedCookie);
            break;
          }
        }
      });

      if (processedCookies.length < checkCookies.length) {
        console.log('cookie 数据缺失，请在F12网页请求里复制完整的cookie');
        return '';
      }

      // 使用;将处理后的cookie数组重新拼接成字符串
      return processedCookies.join('; ');
    };
    // 监控cookie属性的变化
    watch(
      () => form.cookie,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          // 调用 processBilibiliCookie 函数处理新的 cookie 值
          const processedCookie = processBilibiliCookie(newVal);
          // 使用处理后的 cookie 值更新 form.cookie
          form.cookie = processedCookie;
          sset('setting', form);
        }
      }
    );

    const getFinalForm = () => {
      let data = simpleForm.value;
      switch (form.auth) {
        case 'normal':
          data = omit(data, ['akId', 'akSecret', 'appId', 'code']);
          break;
        case 'open':
          data = omit(data, ['room', 'cookie']);
          break;
      }
      return data;
    };

    const copyLinkStatus = ref('');
    const copyLinkClass = computed(() => (copyLinkStatus.value ? `btn-${copyLinkStatus.value}` : 'btn-primary'));
    const copyLinkText = computed(() => {
      switch (copyLinkStatus.value) {
        case 'success':
          return '复制成功';
        case 'error':
          return '复制失败';
        default:
          return '复制链接';
      }
    });

    const copyLink = async () => {
      if (copyLinkStatus.value) return;
      try {
        await navigator.clipboard.writeText(new URL(`live.html#${qss(getFinalForm())}`, location.origin).href);
        copyLinkStatus.value = 'success';
      } catch {
        copyLinkStatus.value = 'error';
      } finally {
        setTimeout(() => {
          copyLinkStatus.value = '';
        }, 2000);
      }
    };

    const showQrLogin =
      window.location.origin === 'https://blc.lolicon.app' || window.location.origin === 'http://localhost:8080';

    if (showQrLogin) {
      bindQrLogin(cookie => {
        form.cookie = cookie;
      });

      onBeforeUnmount(() => {
        unbindQrLogin();
      });
    }

    function go() {
      window.location.href = `live.html#${qss(getFinalForm())}`;
    }

    return {
      form,
      canGo,
      goLive: () => {
        form.drive = 'Live';
        go();
      },
      goSong: () => {
        form.drive = 'Song';
        go();
      },
      copyLink,
      copyLinkClass,
      copyLinkText,
      options: readonly(selectOptions),
      showQrLogin,
      openQrLoginWindow,
    };
  },
});
</script>

<style lang="scss">
body,
html {
  width: 100%;
  height: 100%;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
}
#app {
  margin: 16px;
}
@media screen and (min-width: 800px) {
  #app {
    width: 70%;
    min-width: 768px;
    max-width: 1024px;
  }
}
@media screen and (max-width: 799px) {
  #app {
    width: 100%;
  }
}
#panel {
  margin: 0;
  .btn {
    float: right;
    margin-left: 8px;
  }
}
.btn {
  outline: none !important;
}
.form-control {
  box-shadow: none !important;
}
input[type='checkbox'] {
  vertical-align: middle;
}
label {
  margin-bottom: 0;
  font-weight: 400;
}
.input-group:not(:last-child) {
  margin-bottom: 10px;
}
.input-group-addon.front {
  min-width: 81px;
}
a {
  text-decoration: none !important;
}

.bl-0 {
  border-left: 0;
}
</style>
