// 引入对话框
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const dialog = remote.dialog;
const Menu = remote.Menu;
const fs = require('fs');



// 用来解释主进程和渲染进程的实例
// 流程：先在主进程中监听窗口的close事件，然后当发生点击时，将消息从主进程发送到渲染进程。渲染进程收到消息后执行某些操作后，将消息发回主进程，由主进程执行剩下的操作
function eventQuit() {
    var options = {};
    options.title = '信息对话框';
    options.message = '确定退出吗？';
    options.type = 'none';
    options.buttons = ['Yes', 'No'];
    dialog.showMessageBox(options, (response) => {
        console.log('当前被单击的按钮索引是' + response);
        if (response == 0) {
            ipcRenderer.send('reqaction', 'exit');
        }
    })
}


//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
    switch (arg) {
        case 'exiting':
            eventQuit();
            break;
    }
});


let photoData;
let video;
//弹出对话框保存图像
function savePhoto(filePath) {
    if (filePath) {
        //向文件写入 base 64 格式的图像数据
        fs.writeFile(filePath, photoData, 'base64', (err) => {
            if (err) alert(`保存图像有问题: ${err.message}`);
            photoData = null;
        });
    }
}
//用于初始化视频流
function initialize() {
    document.getElementsByTagName('body')[0].style.height = window.innerHeight+'px';
    // console.log('屏幕宽度：', window.innerWidth)
    // console.log('屏幕高度：', window.innerHeight)
    video = window.document.querySelector('video');
    window.navigator.mediaDevices.getUserMedia({
        // video: true,
        video: { facingMode: "user", width: 640, height: 360 } // 调用前置摄像头并设置尺寸大小 后置摄像头使用video: { facingMode: { exact: "environment" }
        // audio: true // 使用这个就会播放实时录音
    }).then(function(stream) {
        console.log(stream);
        video.srcObject = stream
        video.play();
    }).catch(function(err) {
        console.log(`连接视频流错误: ${err}`);
    })
}
//拍照
function takePhoto() {
    var now_time = new Date().getTime()
    var file_path = String(now_time) + '.jpg'
    let canvas = window.document.querySelector('canvas');
    //将当前的视频图像绘制在 canvas 上 
    canvas.getContext('2d').drawImage(video, 0, 0, 640, 360);
    //获取  base64 格式的图像数据
    photoData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    const willshow = document.getElementById('willshow');
    console.log(willshow.src)
    willshow.src = 'data:image/png;base64,' + photoData
    //显示保存对话框保存图像
    dialog.showSaveDialog({
        title: "保存照片",
        defaultPath: file_path,
        buttonLabel: '保存'
    }, savePhoto);
}


//查看照片
function showPhoto() {
    const showPhoto = document.getElementById('showPhoto');
    showPhoto.src = 'data:image/png;base64,' + photoData
    if (showPhoto.style.display === "none" || showPhoto.style.display === "") {
        showPhoto.style.display = "block"
    } else {
        showPhoto.style.display = "none"
    }
}


function onload() {
    initialize()
}

window.onresize = function(){
    // console.log('屏幕宽度：', window.innerWidth)
    // console.log('屏幕高度：', window.innerHeight)
    document.getElementsByTagName('body')[0].style.height = window.innerHeight+'px';
}