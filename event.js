// 引入对话框
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const dialog = remote.dialog;
const Menu = remote.Menu;
const fs = require('fs');
var $ = require('jquery');
var os  = require('os');
let platform = os.platform();

let filePath = ''
let fileData = ''



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

// 询问是否保存当前文档
function askSave() {
    var options = {};
    options.title = '是否将当前文档保存?';
    options.message = '是否将当前文档保存?';
    options.type = 'none';
    options.buttons = ['Yes', 'No'];
    dialog.showMessageBox(options, (response) => {
        if (response == 0) {
            saveFile()
        }
    })
}

// 保存文件将文件保存起来
function beginSave(filePath, fileData) {
    if (filePath) {
        fs.writeFile(filePath, fileData, (err) => {
            if (err) {
                alert(`保存文件有问题: ${err.message}`)
            } else {
                alert('保存成功')
                var fileList = filePath.split('\\')
                window.document.title = fileList[fileList.length]
            }
            fileData = null;
        });
    }
}

// 读取文档
function readFile(filePath) {
    if (filePath) {
        window.document.getElementById('newText').value = fs.readFileSync(filePath, 'utf8');
    }
}

function saveFile() {
    if (!filePath) {
        var options = {};
        options.title = '保存文件';
        options.buttonLabel = '保存';
        options.defaultPath = '.';
        options.nameFieldLabel = '保存文件';
        options.showsTagField = false;
        options.filters = [
            {name: '文本文件', extensions: ['txt','js','html','md']},
            {name: '所有文件', extensions: ['*']}
        ]
        filePath = dialog.showSaveDialog(options)
        // dialog.showSaveDialog(options,(filePath) => {
        //     console.log('查看文件路径：',filePath)
        //     filePath = filePath;
        // })
    }
    fileData = window.document.getElementById('newText').value
    console.log('内容：',fileData)
    beginSave(filePath,fileData)
  }


// 打开有筛选的对话框
function openFile(){
    var options = {};
    options.title = '打开文件';
    options.buttonLabel = '打开';
    //  Mac OSX 默认目录是桌面
    options.message = '打开文件';
    options.defaultPath = '.';
    options.properties = ['openFile'];
    options.filters = [
        {name: '文本文件', extensions: ['txt','js','html','md']}
    ]
    filePath = dialog.showOpenDialog(options)
    console.log('打开的文件路径：', filePath)
    readFile(filePath[0])
  }

//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
    switch (arg) {
        case 'exiting':
            eventQuit();
            break;
        case 'newfile':
            if (fileData == '' || fileData == null) {
                filePath = ''
                fileData = ''
                window.document.title = '无标题文档'
            } else {
                askSave()
            }
            break;
        case 'openfile':
            openFile();
            break;
        case 'savefile':
            saveFile();
            var fileList = filePath.split('\\')
            window.document.title = fileList[fileList.length]
            break;
    }
});


// 当打开页面时就会执行 onload。当用户进入后及离开页面时，会触发 onload 和 onunload 事件。
window.onload = function() {
    console.log('开始',platform)
    let newText = document.getElementById('newText')
    const contextMenuTemplate = [
        { label: '复制', role: 'copy' }, 
        { label: '剪切', role: 'cut' }, 
        { label: '粘贴', role: 'paste' },
        { label: '删除', role: 'delete' }
      ];
    const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
    newText.addEventListener('contextmenu',function(event) {
        event.preventDefault();
        contextMenu.popup(remote.getCurrentWindow());
    })
    
    // document.getElementById('newText').onkeydown = function(event) {
    //     console.log('按下的键盘是：',event.keyCode)
    //     newText.value = '1234'
    // }

    document.getElementById('newText').onkeyup = function(event) {
        // console.log('按下的键盘是：',event.keyCode)
        // if (event.ctrlKey && event.keyCode === 67){ 
        //     alert('你按下了CTRL+C'); 
        // } 
        switch (event.keyCode) {
            case 9:
                newText.value += '    '
                break;
        }
    }
    document.getElementById('newText').oninput = function (event) {
        fileData = event.data
    }
    // console.log($('#newText'))
    // $('#newText').keydown(function (evenet) {
    //     console.log('按下的键盘是：',event.keyCode)
    // })
    // 监听input事件
    // document.getElementById("newText").addEventListener("input", function(event) {
    //     console.log(event.data)
    // });
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
