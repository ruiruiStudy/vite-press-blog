---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/142323668)

### 背景

前端的宝子们代码写累了吗？那就一起研究下后端吧！

体验地址：[http://106.54.233.63:5000](http://106.54.233.63:5000/)【已失效、后续买服务器重新部署】

Gitee源码：<https://gitee.com/ruirui-study/ruoyi_nodejs_open>

本项目的前端基于若依Vue3.0版本，后端是基于`MidwayJs`框架来实现的，目前已经完成了若依Spring Boot的90%以上的主要接口功能，包括：

*   登录、退出、JWT
*   基础的获取信息、路由、`权限管理`
*   个人信息修改、头像、密码修改
*   excel导出、**导入功能**
*   `permission装饰器`
*   `操作日志装饰器`
*   字典管理、参数配置，`Redis`集成
*   用户管理、角色管理、菜单管理、部门管理、通知公告
*   操作日志、登录日志
*   定时任务（70%）

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/770313873fa946888dea100ee61876d5.png)

### 特色功能

本项目在若依后台的基础上、新增了以下几个亮点功能，且几项配置均可在参数配置中**一键开启或关闭**：

*   支持开启`接口加密`：如果开启，接口返回为密文，前端进行解密获取数据，提高安全性，；
*   是否开启`权限校验`：关闭的话，可用于快速开发调试，最后统一添加；
*   是否开启登录日志：关闭的话节约服务器流量等资源；
*   是否开启操作日志：关闭的话节约服务器流量等资源；
*   是否开启`验证码登录`：登录界面，验证码启动开关配置；
*   **代码预览**：主要模块的后端代码，支持预览，方便大家查看`；`

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/775eb61c14d84fd197076f531a25d4a8.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/ea47fcb2ea2f4e59ad6091d0d731ff52.png)


### 项目预览

#### 首页

首页概况、项目完成情况等说明

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e88eb3d1547146c38ee9af1c1686c29c.png)


#### 用户管理

功能全部实现，包括分配角色、个人信息修改等

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5bbf9e30933e4b3c8c571c3e15d6c77c.png)


#### 角色管理

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/21e30ccf25754cec96361e37380117b2.png)


#### 菜单管理

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/516d1f1cdd3748b68fb4e933179f7f27.png)


#### 部门管理

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8a69341a62d44fe9b1f9b71924b0c6d1.png)


#### 岗位管理

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7c57925080e046eaa1ff4b015117d14b.png)

#### 字典管理

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/4c360bdaf9f545b292c89a4f5691de1b.png)


#### 参数设置

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0c3623fba04948e8af95df2750697894.png)


#### 操作日志

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/69f6300ffcc743759f7c30e1283af2c6.png)


#### 登录日志

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/a890f463902f4e9f9842689c1068a738.png)


#### 定时任务

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3b1d764de1214783865f3a41321eab2c.png)


### 最后

项目还有一些功能尚未完善，晚一些时间继续优化、并整理开源，大家可以先看一下其他人的优秀项目：
[nestjs版若依全栈管理后台完全开源！](https://juejin.cn/post/7364785775344386100)

如有不足之处，请大家多多指教！多提PR
