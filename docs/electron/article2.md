---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/141476157)

#### 环境
windows：PC微信
我们可以看到，微信聊天界面点击右上角三个点时，会显示这个人的聊天信息窗口，我们把鼠标点击在其他位置时，这个聊天信息窗口就消失了，那么，这是怎么实现的呢，能否用electron实现类似的功能呢？
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6c9fb9ab54cf499092c043cbf87cafd2.png)
## 实现过程
#### 效果展示

[video(video-Iqm6VPcm-1724476921616)(type-csdn)(url-https://live.csdn.net/v/embed/419680)(image-https://i-blog.csdnimg.cn/blog_migrate/5094fe5b42571268bd04212295570505.jpeg)(title-贴合窗口)]


首先是新创建一个贴合窗口，在[之前的文章](https://blog.csdn.net/yan1915766026/article/details/141425899)中有讲到，注意：微信的贴合窗口，在任务栏中是不显示的，所以在新建贴合窗口时加个属性：

```javascript
skipTaskbar: true
```
在新建贴合窗口时，添加聚焦事件监听，即监听鼠标点击是否在贴合窗口范围内，如果在，那就当你没发生过什么，如果不在则关闭贴合窗口，以外为关键代码：

```javascript
  // win是新创建的贴合窗口
  const win = new BrowserWindow()
  win.on('blur', (event) => {
      if (!win.isVisible()) {
        return; // 如果窗口不可见，则不执行关闭操作
      }

      const position = win.getPosition();
      const size = win.getSize();
      const bounds = { x: position[0], y: position[1], width: size[0], height: size[1] };

      const { x, y } = screen.getCursorScreenPoint(); // 获取鼠标当前坐标
      if (!isPointWithinBounds({ x, y }, bounds)) {
        win.close(); // 如果鼠标点击不在窗口内，则关闭窗口
      }
    });

function isPointWithinBounds(point, bounds) {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

```
