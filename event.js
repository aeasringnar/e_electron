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
let fileDocument = document.getElementById('newText')
let isSave = true



// 用来解释主进程和渲染进程的实例
// 流程：先在主进程中监听窗口的close事件，然后当发生点击时，将消息从主进程发送到渲染进程。渲染进程收到消息后执行某些操作后，将消息发回主进程，由主进程执行剩下的操作
function eventQuit() {
    var options = {};
    // options.title = '确定退出吗？';
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

function setNew() {
    document.getElementById('newText').value = ''
    filePath = ''
    window.document.title = '无标题文档'
}

function askChoice(ask_type) {
    if(ask_type == 0) {
        setNew()
    } else if (ask_type == 1) {
        filePath = openFile()
        if (filePath) {
            readFile(filePath)
            document.title = returnFileName(filePath)
        }
    } else {
        ipcRenderer.send('reqaction', 'exit');
    }
}

// 询问是否保存当前文档 ask_type: 0 newfile 1 openfile 2 exit
function askSave(ask_type) {
    if (isSave == false) {
        var options = {};
        options.title = '是否将当前文档保存?';
        options.message = '是否将当前文档保存?';
        options.type = 'none';
        options.buttons = ['Yes', 'No'];
        dialog.showMessageBox(options, (response) => {
            if (response == 0) {
                if (filePath == '') {
                    // 没有被保存过的新文档，需要先打开保存对话框
                    filePath = openSaveDialog()
                    writeFile(filePath, fileDocument.value)
                    askChoice(ask_type)
                } else {
                    // 已经被保存过的，存在路径，直接保存文件
                    writeFile(filePath, fileDocument.value)
                    askChoice(ask_type)
                }
            } else{
                askChoice(ask_type)
            }
        })
    }
}

// 获取文件名
function returnFileName(filePath) {
    if (platform == 'linux' || platform == 'darwin') {
        var fileList = filePath.split('/')
    } else {
        var fileList = filePath.split('\\')
    }
    return fileList[fileList.length - 1]
}

// 写入文档
function writeFile(filePath, fileData) {
    fs.writeFileSync(filePath, fileData);
    isSave = true
}

// 读取文档
function readFile(filePath) {
    window.document.getElementById('newText').value = fs.readFileSync(filePath, 'utf8');
}

// 打开保存对话框并返回路径
function openSaveDialog() {
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
    // 保存成功返回一个路径，否则返回 undefined
    var path = dialog.showSaveDialog(options)
    return path == undefined ? false : path
  }


// 打开打开对话框并返回路径
function openFile(){
    var options = {};
    options.title = '打开文件';
    options.buttonLabel = '打开';
    options.message = '打开文件';
    options.defaultPath = '.';
    options.properties = ['openFile'];
    options.filters = [
        {name: '文本文件', extensions: ['txt','js','html','md']}
    ]
    // 打开成功返回一个数组，第一个元素为打开的路径,否则返回 undefined
    var path = dialog.showOpenDialog(options)
    return path == undefined ? false : path[0]
  }

//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
    switch (arg) {
        case 'exiting':
            if (fileDocument.value == '' || fileDocument.value == null || isSave == true) {
                eventQuit()
            } else {
                askSave(2)
            }
            break;
        case 'newfile':
            if (fileDocument.value == '' || fileDocument.value == null || isSave == true) {
                setNew()
            } else {
                askSave(0)
            }
            break;
        case 'openfile':
            if (fileDocument.value == '' || fileDocument.value == null || isSave == true) {
                filePath = openFile()
                if (filePath) {
                    readFile(filePath)
                    document.title = returnFileName(filePath)
                }
            } else {
                askSave(1)
            }
            break;
        case 'savefile':
            if (!filePath) filePath = openSaveDialog()
            if (filePath) {
                writeFile(filePath, fileDocument.value)
                document.title = returnFileName(filePath)
            }
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
    
    document.getElementById('newText').onkeyup = function(event) {
        switch (event.keyCode) {
            case 9:
                newText.value += '    '
                break;
        }
    }
    document.getElementById('newText').oninput = function (event) {
        if (isSave) document.title += " *"
        isSave = false
    }
}

// 监听浏览器窗口变化时执行的函数
window.onresize = function(){
    document.getElementsByTagName('body')[0].style.height = window.innerHeight+'px';
    document.getElementById('newText').focus();
}

