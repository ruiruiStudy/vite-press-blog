---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/141305712

## 背景
如果用electron仿写微信PC端的项目，那么微信的右上角的`置顶、最小化、最大化、关闭`，这几个按钮肯定是要自己写的，因为原生的只有`最小化、最大化、关闭`，切不支持定制，无法满足项目需求，所以我们要隐藏原生的，自己来封装

项目技术栈：electron + vue3

> 注：本项目仅提供思路，具体代码有些需要自己去实现
## 封装思路
- 置顶：点击置顶后，置顶图标高亮，且有置顶功能，再次点击会取消置顶；
- 最小化：隐藏主窗口，调用最小化方法；
- 最大化：点击最大化后，窗口最大化，且最大化图片变化，再次点击，窗口还原；
- 关闭：关闭主窗口，且有红色背景；

那么，我们需要把这四个按钮封装在一起，绝对定位到右上角且显示在其他元素的上方。还要考虑其他窗口如果只显示`最小化`和`关闭`按钮呢，所以封装成一个组件，且需要保持灵活性；

> 注：图标啥的自己去iconfont找，能找到最像的就行

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/31f8ef90e57c4407b270d91d94cb16e0.png)


## 代码
具体实现请参考代码。
vue组装的封装：

```javascript
<template>
  <div class="win-op no-drag">
    <div v-if="showSetTop" :title="isTop ? '取消置顶' : '置顶'" @click="top">
    <span :class="['iconfont icon-top ', isTop ? 'win-top' : '']"></span>
</div>
<div v-if="showMin" title="最小化" @click="minimize">
  <span class="iconfont icon-min"></span>
</div>
<div v-if="showMax" :title="isMax ? '向下还原' : '最大化'" @click="maximize">
  <span :class="['iconfont ', isMax ? 'icon-maximize' : 'icon-max']"></span>
</div>
<div v-if="showClose" title="关闭" @click="close">
  <span class="iconfont icon-close"></span>
</div>
</div>
</template>

<script setup>
  import { getCurrentInstance, onMounted, ref } from 'vue'

  const { proxy } = getCurrentInstance()

  const props = defineProps({
  showSetTop: {
  type: Boolean,
  default: true
},
  showMin: {
  type: Boolean,
  default: true
},
  showMax: {
  type: Boolean,
  default: true
},
  showClose: {
  type: Boolean,
  default: true
},
  //关闭类型 0:关闭，1:隐藏
  closeType: {
  type: Number,
  default: 1
}
})

  const emit = defineEmits(['closeCallback'])

  onMounted(() => {
  isMax.value = false
})

  //窗口操作
  const winOp = (action, data) => {
  window.ipcRenderer.send('winTitleOp', { action, data })
}

  //关闭窗口
  const close = () => {
  winOp('close', { closeType: props.closeType })
  emit('closeCallback')
}
  //最小化
  const minimize = () => {
  winOp('minimize')
}

  const isMax = ref(false)
  const isTop = ref(false)

  //最大化
  const maximize = () => {
  if (isMax.value) {
  winOp('unmaximize')
  isMax.value = false
} else {
  winOp('maximize')
  isMax.value = true
}
}

  //置顶窗口
  const top = () => {
  isTop.value = !isTop.value
  winOp('top', { top: isTop.value })
}
</script>

<style lang="scss" scoped>
  .win-op {
  top: 0;
  right: 0;
  position: absolute;
  z-index: 10;
  display: flex;

  .iconfont {
  top: 0;
  left: 0;
  font-size: 12px;
  color: #101010;
  text-align: center;
  display: flex;
  justify-content: center;
  cursor: pointer;
  height: 25px;
  align-items: center;
  padding: 0px 10px;

  &:hover {
  background-color: #ddd;
}
}

  .icon-close {

  &:hover {
  background: #fb7373;
  color: #fff;
}
}

  .win-top {
  color: #07c160;
}
}
</style>

```
electron的局部实现代码：

```javascript
/**
 * 窗口标题栏操作
 *
 * 该函数用于处理窗口标题栏的操作，如关闭、最小化、最大化等。
 * 主要目的是为了提供窗口标题栏的操作功能，如窗口的关闭、最小化、最大化等。
 *
 * @param {BrowserWindow} win - 窗口对象
 * @param {string} action - 操作类型，如'close'、'minimize'、'maximize'等
 * @param {Object} data - 操作数据，如窗口是否最大化等
 */
const winTitleOp = (win, action, data) => {
    switch (action) {
      case 'close':
        if (data.closeType === 0) {
          win.close()
        } else {
          win.setSkipTaskbar(true) // 使窗口不显示在任务栏中
          win.hide()
        }
        break
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        win.maximize()
        break
      case 'unmaximize':
        win.setFullScreen(false)
        win.center()
        break
      case 'top':
        win.setAlwaysOnTop(data.top)
        break
    }
  }
```
