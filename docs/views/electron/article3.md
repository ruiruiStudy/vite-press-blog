---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/141425899)

## 说明
在写electron项目时，只有一个主窗口不足以满足需求，我们通常还会打开很多个窗口。
怎么打开一个子窗口像微信的聊天界面一样，全贴合在一起，看起来像一个整体呢：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8e0ac16b8d2a4ef297c1d8358a2a2e95.png)
## 分析
这个窗口有点像element ui中的`抽屉(drawer)`，但是我们知道electron主体就是一个容器盒子，而`抽屉`只能在容器盒子内部显示，很明显贴合窗口并不能用抽屉来实现。
那么久只能新建一个窗口了，需要考虑以下几点：
- 新开贴合窗口的左侧，需要与主窗口的右侧贴合，即x坐标一致；
- 新开贴合窗口的顶部要与主窗口的顶部对齐，即顶部y坐标一致；
- 新开贴合窗口的高度，要与主窗口高度一致（因为主窗口可能会被拉伸）

#### 获取主窗口的高度
此处的height是主窗口高度，在触发`ipcMain.on`事件时，把高度赋值给贴合窗口的高度
```javascript
const [ width, height ] = mainWindow.getSize();
```
#### 计算坐标
假设主窗口名为`mainWindow`，那么获取x,y坐标，赋值给新建的贴合窗口
```javascript
x: mainWindow.getPosition()[0] + mainWindow.getSize()[0], // 位置在主窗口右侧
y: mainWindow.getPosition()[1],
```
#### 关键代码
新建贴合窗口：

```javascript
new BrowserWindow({
  width: 250, // 可自定义固定值
  height: height, // 上面动态获取的height值
  x: mainWindow.getPosition()[0] + mainWindow.getSize()[0],
  y: mainWindow.getPosition()[1],
  autoHideMenuBar: true,
  resizable: false,
  titleBarStyle: 'hidden',
  frame: true,
  transparent: true,
  hasShadow: false,
  backgroundColor: '#F7F7F7',
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false,
    contextIsolation: false
  }
})
```
#### 效果图
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/2b07cfd708ea494096d550890bd6ae1a.png)
