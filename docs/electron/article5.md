---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/141318150)

## 说明
技术栈：electron + vue3 + element-plus
实例：仿写PC端微信

electron新项目，我们一般会创建一个窗口，这个窗口就是主窗口，那么如果我还想再开一个窗口，该怎么办呢？
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/78f67201c1b846348f19e148177012b6.png)

## 实现过程
项目以PC端微信为例，新开一个设置窗口

> 注：本项目仅提供思路，具体代码自行实现

1. 在vue项目声明一个路由：`/setting`，在里面写对应的页面代码
2. 在vue布局组件中，点击设置按钮，触发显示设置弹框的事件：

```javascript
 window.ipcRenderer.send('openSettingWindow')
```
3. `main/index.js`中：

```javascript
// 创建主窗口
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // 省略
  })
  
  // 打开设置窗口
  ipcMain.on('openSettingWindow', () => {
    windowUtils.openWindow({
      windowId: 'setting',
      title: '设置',
      path: '/setting',
      width: 600,
      height: 500,
      callback: () => {}
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
```
4. `windowUtils.js`中：

```javascript
/**
 * 新开窗口，按vue路由打开，传对应的参数
 * */
const openWindow = ({ windowId, title, path, width = 500, height = 360, callback }) => {
    let win = getWindow(windowId)
    if (!win) {
      win = new BrowserWindow({
        // icon: icon,
        width: width,
        height: height,
        autoHideMenuBar: true,
        resizable: false,
        titleBarStyle: 'hidden',
        frame: true,
        transparent: true,
        hasShadow: false,
        backgroundColor: '#ffffff',
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false,
          contextIsolation: false
        }
      })

      saveWindow(windowId, win)
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html#${path}`)
      } else {
        win.loadFile(join(__dirname, `../renderer/index.html`), { hash: `${path}` })
      }

      win.on('ready-to-show', () => {
        win.setTitle(title)
        win.show()
      })
      win.once('show', () => {
        callback()
      })
      win.on('closed', () => {
        delWindow(windowId)
      })
    } else {
      win.show()
      win.setSkipTaskbar(false)
      callback()
    }
  }
```
