const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron')  // 引入electron

// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win
// 托盘应用需要的
let tray;
let contextMenu

function createWindow () {
  win = new BrowserWindow({
    // 设置窗口大小
    width: 800,
    height: 500,
    webPreferences: {
      nodeIntegration: true
    }
  })
  console.log('system edition:', process.platform)  // darwin:表示macos；linux:表示linux；win32:表示Windows；
  // 使用模版创建菜单
  const template = [
    {
      label: '文件',
      submenu: [    
        {
          label: '新建文件',
          click:()=>{
            win.webContents.send('action', 'newfile');
          }
        },
        {
          type: 'separator'
        },
        {
          label: '打开文件',
          click:()=>{
            win.webContents.send('action', 'openfile');
          }
        },
        {
          type: 'separator'
        },
        {
          label: '保存文件',
          click:()=>{
            win.webContents.send('action', 'savefile');
          }
        },
        {
          type: 'separator'
        },
        {
          label: '关闭',
          accelerator: 'Ctrl+Q',      // 设置菜单快捷键
          click: ()=>{win.close()}
        }
      ]
    },
    // {
    //   label: '调试',
    //   submenu: [
    //       {
    //           label: '显示调试工具',
    //           role:'toggleDevTools'
    //       }
    //   ]
    // },
    {
      label: '编辑',
      submenu: [
        {
          label: '复制',
          role:'copy',
          click:()=>{win.webContents.copy()} // 在点击时执行复制命令
        },
        {
          label: '粘贴',
          role:'paste',
          click:()=>{win.webContents.paste()} // 在点击时执行粘贴命令
        },
        {
          label: '剪切',
          role:'cut',
          click:()=>{win.webContents.cut()}
        },
        {
          type:'separator'   // 设置菜单项分隔条
        },
        {
          label: '撤销',
          role:'undo',
          click:()=>{win.webContents.undo()} // 在点击时执行撤销命令
        },
        {
          label: '重做',
          role:'redo',
          click:()=>{win.webContents.redo()} // 在点击时执行重做命令
        }
      ]
    }
    ];

  const menu = Menu.buildFromTemplate(template);
  //  开始设置菜单
  Menu.setApplicationMenu(menu);

  // 加载index.html文件
  win.loadFile('index.html')

  // 打开调试工具
  win.webContents.openDevTools()
  

  // 监听窗口关闭的事件，监听到时将一个消息发送给渲染进程
  win.on('close', (e) => {
    e.preventDefault();
    // 给渲染进程发消息
    win.webContents.send('action', 'exiting');
  });

  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null
  })
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow)

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow()
  }
})

// 监听与渲染进程的通讯，监听来自渲染进程的消息，当监听到确定关闭时，将所有窗口退出
ipcMain.on('reqaction', (event, arg) => {
  console.log('zhu jin cheng:', arg)
  switch(arg){
    case 'exit':
      app.exit()  // 退出所有窗口，注意这里使用 app.quit() 无效
      break;
  }
});