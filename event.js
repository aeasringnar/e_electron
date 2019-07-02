// 引入对话框
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const dialog = remote.dialog;
const Menu = remote.Menu;
const fs = require('fs');
var $ = require('jquery');

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


// 当打开页面时就会执行 onload。当用户进入后及离开页面时，会触发 onload 和 onunload 事件。
window.onload = function() {
    console.log('开始')
    let newText = document.getElementById('newText')
    const contextMenuTemplate = [
        { label: '复制', role: 'copy' }, 
        { label: '剪切', role: 'cut' }, 
        { label: '粘贴', role: 'paste' },
        { label: '删除', role: 'delete' }
      ];
    const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
    newText.addEventListener('contextmenu',function(event) {
        event.preventDefault();  // 阻止事件的默认行为，例如，submit 按钮将不会向 form 提交
        contextMenu.popup(remote.getCurrentWindow()); 
    })
    
    document.getElementById('newText').onkeydown = function(event) {
        console.log('按下的键盘是：',event.keyCode)
        // newText.innerText = '1234'
    }
    // console.log($('#newText'))
    // $('#newText').keydown(function (evenet) {
    //     console.log('按下的键盘是：',event.keyCode)
    // })
    document.getElementById("newText").addEventListener("input", function(event) {
        console.log(event.data)
    });
}

// 监听浏览器窗口变化时执行的函数
window.onresize = function(){
    // console.log('屏幕宽度：', window.innerWidth)
    // console.log('屏幕高度：', window.innerHeight)
    document.getElementsByTagName('body')[0].style.height = window.innerHeight+'px';
    document.getElementById('newText').focus();
}
// 全局监听document按键按下事件
// window.document.onkeydown = function(event) {
//     console.log('按下的键盘是：',event.keyCode)
// }
