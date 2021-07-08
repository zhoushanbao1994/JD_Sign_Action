// version v0.0.1
// create by zhihua
// detail url: https://github.com/ruicky/jd_sign_bot

const exec = require('child_process').execSync
const fs = require('fs')
const rp = require('request-promise')
const bark_rp = require('request-promise')
const download = require('download')

// 京东cookie
const cookie = process.env.JD_COOKIE
// Server酱SCKEY
const push_key = process.env.PUSH_KEY
// BARK SCKEY
const bark_key = process.env.SECRET_BARK_KEY

// 京东脚本文件
const js_url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js'
// 下载脚本路劲
const js_path = './JD_DailyBonus.js'
// 脚本执行输出路劲
const result_path = './result.txt'
// 错误信息输出路劲
const error_path = './error.txt'

Date.prototype.Format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'H+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'S+': this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(String(o[k]).length)));
    }
  }
  return fmt;
};

function setupCookie() {
  var js_content = fs.readFileSync(js_path, 'utf8')
  js_content = js_content.replace(/var Key = ''/, `var Key = '${cookie}'`)
  fs.writeFileSync(js_path, js_content, 'utf8')
}

function sendNotificationIfNeed() {

  if (!push_key) {
    console.log('执行任务结束!'); return;
  }

  if (!fs.existsSync(result_path)) {
    console.log('没有执行结果，任务中断!'); return;
  }

  let text = "京东签到_" + new Date().Format('yyyy.MM.dd');
  let desp = fs.readFileSync(result_path, "utf8")         // 读文件
  let desp_array = new Array();
  //desp_array = desp.split(/[\r\n\r\n]/);
  desp_array = desp.split("\n\n");    // 将结果拆分为数组
  console.log(text)
  console.log(desp_array)
  let disp1 = "";
  console.log("---------------------- start -----------------------")
  for (var i = 0; i < desp_array.length; i ++) {
    let tmp = desp_array[i]
    //console.log(tmp)
    if(tmp.search("签到概览") != -1) {
      disp1 += tmp;
      break;
    }
  }
  disp1 += "\n";
  disp1 += desp_array[desp_array.length-1]
  console.log("--------------------- end ------------------------")
  
  console.log("\r\n--------------------- disp1 ------------------------")
  console.log(disp1)
  console.log("--------------------- disp1 ------------------------\r\n")

  /****************************** Server酱 Start*********************************/
  // 去除末尾的换行
  let SCKEY = push_key.replace(/[\r\n]/g,"")

  const options ={
    uri:  `https://sc.ftqq.com/${SCKEY}.send`,
    form: { text, desp },
    json: true,
    method: 'POST'
  }

  rp.post(options).then(res=>{
    const code = res['errno'];
    if (code == 0) {
      console.log("通知发送成功，任务结束！")
    }
    else {
      console.log(res);
      console.log("通知发送失败，任务中断！")
      fs.writeFileSync(error_path, JSON.stringify(res), 'utf8')
    }
  }).catch((err)=>{
    console.log("通知发送失败，任务中断！")
    fs.writeFileSync(error_path, err, 'utf8')
  })
  /****************************** Server酱 End*********************************/

  /****************************** BARK Start*********************************/
  // 去除末尾的换行
  let BARK_KEY = bark_key.replace(/[\r\n]/g,"")

  let TITEL = text.replace(/[\r\n.]/g,"")
  let MESSAGE = disp1

  let url = encodeURI(`https://api.day.app/${BARK_KEY}/${TITEL}/${MESSAGE}`)

  const bark_options ={
    uri:  url,
    json: true,
    method: 'POST'
  }

  bark_rp.post(bark_options).then(res=>{
    const code = res['errno'];
    if (code == 0) {
      console.log("BARK 通知发送成功，任务结束！")
    }
    else {
      console.log(res);
      console.log("BARK 通知发送失败，任务中断！")
      fs.writeFileSync(error_path, JSON.stringify(res), 'utf8')
    }
  }).catch((err)=>{
    console.log("BARK 通知发送失败，任务中断！")
    fs.writeFileSync(error_path, err, 'utf8')
  })
  /****************************** BARK End*********************************/
}

function main() {

  if (!cookie) {
    console.log('请配置京东cookie!'); return;
  }

  // 1、下载脚本
  download(js_url, './').then(res=>{
    // 2、替换cookie
    setupCookie()
    // 3、执行脚本
    exec(`node '${js_path}' >> '${result_path}'`);
    // 4、发送推送
    sendNotificationIfNeed() 
  }).catch((err)=>{
    console.log('脚本文件下载失败，任务中断！');
    fs.writeFileSync(error_path, err, 'utf8')
  })

}

main()