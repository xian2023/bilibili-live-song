import { addInfoDanmaku, glabal } from '@/utils/tool';
import { autoGet, get } from '@/utils/request';

export { musicServer, qqmusicServer };

function axios(option, noCors = false) {
  const queryString = Object.entries(option.params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const fullUrl = `${option.url}?${queryString}`;
  return noCors ? get(fullUrl, option) : autoGet(fullUrl, option);
}

/* 歌曲API服务 */
const musicServer = {
  // 服务器地址 gitpage 需要https服务器
  // baseUrl: "http://plugin.changsheng.space:3000",
  // baseUrl: "https://zmusic.i9mr.com",
  //   baseUrl: 'https://docs.neteasecloudmusicapi.binaryify.com/',
  baseUrl: 'https://zm.armoe.cn',

  /* 发送验证码 
          @param phone 手机号
      */
  sendCaptcha: async function (phone) {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/captcha/sent',
      params: {
        phone: phone,
      },
    })
      .then(function (resp) {
        data = resp;
      })
      .catch(function (error) {
        console.log('验证码发送失败!', error.response);
      });
    return data;
  },

  /* 校验验证码 
          @param phone 手机号
         @param captcha 验证码
      */
  verifyCaptcha: async function (phone, captcha) {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/captcha/verify',
      params: {
        phone: phone,
        captcha: captcha,
      },
    })
      .then(function (resp) {
        data = resp;
      })
      .catch(function (error) {
        console.log('验证码校验失败!', error.response);
      });
    return data;
  },

  /* 登录
         @param phone 手机号
         @param captcha 验证码
       */
  login: async function (phone, captcha) {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/login/cellphone',
      params: {
        phone: phone,
        captcha: captcha,
      },
    })
      .then(function (resp) {
        data = resp;
      })
      .catch(function (error) {
        console.log('登录失败!', error.response);
      });
    return data;
  },
  /*
          游客登录
       */
  anonimousLogin: async function () {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/register/anonimous',
    })
      .then(function (resp) {
        data = resp;
      })
      .catch(function (error) {
        console.log('游客登录失败！', error.response);
      });
    return data;
  },
  /* 
          获取二维码key
      */
  getQrKey: async function () {
    let unikey = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/login/qr/key',
      withCredentials: true,
      params: {
        timestamp: Date.now(),
      },
    })
      .then(function (resp) {
        unikey = resp.data.unikey;
      })
      .catch(function (error) {
        console.log('获取二维码key失败!', error.response);
      });
    return unikey;
  },
  /* 
          获取二维码图片
      */
  getQrPicture: async function (key) {
    let qrImgUrl = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/login/qr/create',
      withCredentials: true,
      params: {
        key: key,
        qrimg: true,
        timestamp: Date.now(),
      },
    })
      .then(function (resp) {
        qrImgUrl = resp.data.qrimg;
      })
      .catch(function (error) {
        console.log('二维码图片获取失败!', error.response);
      });
    return qrImgUrl;
  },
  /*
          检查二维码扫描状态
      */
  checkQrStatus: async function (key) {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/login/qr/check',
      withCredentials: true,
      params: {
        key: key,
        timestamp: Date.now(),
      },
    })
      .then(function (resp) {
        data = resp;
      })
      .catch(function (error) {
        console.log('获取二维码扫描状态失败!', error.response);
      });
    return data;
  },

  /* 退出登录 */
  logout: async function () {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/logout',
      params: {
        cookie: glabal.musicConfig.cookie,
      },
    }).catch(function (error) {
      console.log('退出登录失败！', error.response);
    });
    return data;
  },

  /* 获取用户详情 */
  getUserDetail: async function () {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/user/account',
      params: {
        cookie: glabal.musicConfig.cookie,
      },
    })
      .then(function (resp) {
        data = resp;
        console.log(resp);
      })
      .catch(function (error) {
        console.log('获取用户详情失败!', error.response);
      });
    return data;
  },

  /* 登录状态 */
  loginStatus: async function () {
    let data = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/login/status',
      params: {
        cookie: glabal.musicConfig.cookie,
      },
    })
      .then(function (resp) {
        data = resp.data;
      })
      .catch(function (error) {
        console.log('获取登录状态失败!', error.response);
      });
    return data;
  },

  /* 搜索歌曲信息 
          @param keyword 关键词
      */
  getSongInfo: async function (keyword) {
    let song = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/search',
      params: {
        cookie: glabal.musicConfig.cookie,
        keywords: keyword,
        limit: 10,
        type: 1,
      },
    })
      .then(function (resp) {
        // 获取歌曲列表
        let songs = resp.result.songs;
        if (songs.length > 0) {
          // 封装歌曲信息
          song = {
            platform: 'wy',
            sid: songs[0].id,
            sname: songs[0].name,
            sartist: songs[0].artists[0].name,
            duration: songs[0].duration / 1000,
          };
        }
      })
      .catch(function (error) {
        console.log('歌曲搜索失败!', error.response);
      });
    return song;
  },

  /* 获取歌曲链接
          @param songId 歌曲Id
      */
  getSongUrl: async function (songId) {
    let url = null;
    await axios({
      method: 'get',
      url: this.baseUrl + '/song/url',
      params: {
        cookie: glabal.musicConfig.cookie,
        id: songId,
      },
    })
      .then(function (resp) {
        if (resp.code < 0) {
          addInfoDanmaku(resp.message + '(登录)');
        } else if (resp.data[0].url) {
          url = resp.data[0].url;
        }
      })
      .catch(function (error) {
        console.log('歌曲链接获取失败!', error.message);
      });
    return url;
  },

  /* 获取歌单列表 
          @param listId 歌单Id
      */
  getSongList: async function (listId) {
    let songList = new Array();
    await axios({
      method: 'get',
      url: this.baseUrl + '/playlist/detail',
      params: {
        cookie: glabal.musicConfig.cookie,
        id: listId,
      },
    })
      .then(function (resp) {
        let list = resp.playlist;
        let songs = list.tracks;
        // 获取歌单的所有歌曲
        for (let i = 0; i < songs.length; i++) {
          let song = {
            uid: list.id,
            uname: list.name,
            song: {
              platform: 'wy',
              sid: songs[i].id,
              sname: songs[i].name,
              sartist: songs[i].ar[0].name,
            },
          };
          songList.push(song);
        }
      })
      .catch(function (error) {
        console.log('歌单信息获取失败!', error.response);
      });
    return songList;
  },
  // 私人FM 就不用找歌单了
  getPersonalFM: async function () {
    let songList = new Array();
    await axios({
      method: 'get',
      url: this.baseUrl + '/personal_fm',
      params: {
        cookie: glabal.musicConfig.cookie,
      },
    })
      .then(function (resp) {
        let songs = resp.data;
        //获取歌单的所有歌曲
        for (let i = 0; i < songs.length; i++) {
          let song = {
            uid: songs[i].id,
            uname: '私人FM',
            song: {
              platform: 'wy',
              sid: songs[i].id,
              sname: songs[i].name,
              sartist: songs[i].album.artists[0].name,
            },
          };
          songList.push(song);
        }
      })
      .catch(function (error) {
        console.log('私人FM歌曲信息获取失败!', error.response);
      });
    return songList;
  },
};

const qqmusicServer = {
  // https://github.com/jsososo/QQMusicApi
  // https://api.aa1.cn/doc/qq-music.html
  baseUrl: 'https://zj.v.api.aa1.cn/api/qqmusic/demo.php',
  /* 搜索歌曲信息 
          @param keyword 关键词
      */
  getSongInfo: async function (keyword) {
    let song = null;
    await axios(
      {
        method: 'get',
        url: this.baseUrl + '',
        params: {
          type: 1,
          q: keyword,
          n: 5,
          p: 1,
        },
      },
      true
    )
      .then(function (resp) {
        // 获取歌曲列表
        let songs = resp.list;
        if (songs.length > 0) {
          // 封装歌曲信息
          song = {
            platform: 'qq',
            sid: 0,
            sname: songs[0].name,
            sartist: songs[0].singer,
            url: songs[0].url,
            duration: 1,
            time: Date.now(),
            keyword: keyword,
          };
        }
      })
      .catch(function (error) {
        addInfoDanmaku(error.message);
      });
    return song;
  },
  // getSongInfo: async function(keyword){
  //     let song = null;
  //     await axios({
  //         method: "get",
  //         url: this.baseUrl +"/search",
  //         params: {
  //             key: keyword,
  //             pageSize: 5,
  //             pageNo: 1,
  //             t:0
  //         }
  //     }).then(function (resp) {
  //         // 获取歌曲列表
  //         let songs = resp.data.list;
  //         if(songs.length > 0){
  //             // 封装歌曲信息
  //             song = {
  //                 platform: "qq",
  //                 sid: songs[0].songmid,
  //                 sname: songs[0].songname,
  //                 sartist:songs[0].singer[0].name,
  //                 duration: songs[0].interval
  //             };
  //         }
  //     }).catch(function(error){
  //         addInfoDanmaku(error.message);
  //     });
  //     return song;
  // },

  /* 获取播放链接
          @param    
      */
  // getSongUrl: async function(songmid){
  //     let url = null;
  //     await axios({
  //         method: "get",
  //         url: this.baseUrl + "/song/url",
  //         params: {
  //             id: songmid
  //         }
  //     }).then(function (resp) {
  //         if(resp.result == 100){
  //             // 获取对象的所有键
  //             url = resp.data;
  //         }else{
  //             console.log(resp);
  //             addInfoDanmaku("链接获取失败");
  //         }
  //     }).catch(function(error){
  //         addInfoDanmaku(error.message);
  //     });
  //     return url;
  // },

  // /* 设置cookie
  //     param qqcookie QQ音乐cookie
  // */
  // setCookie: async function(cookie){
  //     await axios({
  //         method: "post",
  //         url: this.baseUrl + "/user/setCookie",
  //         data: {
  //             data: cookie,
  //         },
  //         headers: {
  //             'Content-Type': 'application/json'
  //         },
  //     }).then(function (resp) {
  //         addInfoDanmaku("cookie设置成功！");

  //     }).catch(function(error){
  //         addInfoDanmaku("cookie设置失败！");
  //     });
  // },
  // /* 获取cookie
  //     param qq qq号
  // */
  // getCookie: async function(qq){
  //     await axios({
  //         method: "get",
  //         url: this.baseUrl + "/user/getCookie",
  //         params: {
  //             id: qq,
  //         },
  //     }).then(function (resp) {
  //         addInfoDanmaku("获取cookie成功！");
  //     }).catch(function(error){
  //         addInfoDanmaku("获取cookie失败！");
  //     });
  // },
};
