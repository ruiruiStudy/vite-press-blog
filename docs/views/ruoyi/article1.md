---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/140849832)

### 背景
nodejs框架可以写后端服务，早已不是稀奇的事情了。
作为前端，不想花很大精力学习`Java`、`PHP`、`Golang`等，那么用nodejs写后端是最合适不过的了
### 选择nodejs框架
现在nodejs框架有很多，小编仅以自己的主观选择，以下缺点都是小编主观认为:
###### Express.js
- 优点：非常流行的Node.js框架，提供简洁而富有表现力的语法，用于创建Web应用程序。
- 缺点：写法比较老旧，不支持async await语法，如果逻辑过多，会出现回调地狱的嵌套……
###### Koa.js
- 优点：由Express团队开发，支持ES7 async/await，提供了一个更简洁、更可靠的中间件架构。
- 缺点：对于项目来讲，过于轻量，需要自己去集成很多东西，不能拿来即用！
###### Hapi.js
- 优点：强大的基于JavaScript的开发框架，用于开发API和应用程序，易于维护和可扩展。
- 缺点：没用过，不做评价
###### Sails.js
- 优点：基于Node.js的MVC框架，提供了高级的ORM，用于与数据库交互，以及强大的生命周期方法和钩子。
- 缺点：没用过，不做评价
###### Nest.js
- 优点：来自Angular团队的Node.js框架，旨在提供一个简洁、高效、易于学习的框架。
- 缺点：没啥缺点，可能就是不够企业级吧，需要自己封装一些中间件、插件等
###### Egg.js
- 优点：阿里出品，约定优于配置，高度灵活的定制性，业界领先的插件机制和上层业务框架机制。
- 缺点：缺乏对TypeScript的支持，不好封装注入等语句。
###### Midway.js
- 优点：Midway 是阿里巴巴 - 淘宝前端架构团队，基于渐进式理念研发的 Node.js 框架，通过自研的依赖注入容器，搭配各种上层模块，组合出适用于不同场景的解决方案。
- 缺点：目前用着很舒服，没看到明显缺点。

### Midway.js环境搭建
说明：目前小编的node版本为18.16.1
##### 初始化
[Midway官网](https://www.midwayjs.org/docs/quick_guide)
直接用脚手架，输入命令：
```bash
npm init midway@latest -y
```
选择 koa-v3 项目进行初始化创建，项目名可以自定，此处叫“ruoyi-node-midway”吧
然后进入项目，运行yarn安装依赖，然后输入：

```bash
npm run dev
```
项目就启动成功了：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3867841db8a54a28a8ec74bf8ada3013.png)
##### 洁癖
为了保持代码干净、删除掉无关的代码，官方示例等，删除以下文件：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5e22bf94747c4dc7ad4c4d2628b9bfed.png)
### 如何配置并连接Mysql
[TypeORM](https://www.midwayjs.org/docs/extensions/orm) 是 node.js 现有社区最成熟的对象关系映射器（ORM ）
官方让我这样安装依赖：
```bash
npm i @midwayjs/typeorm@3 typeorm --save
```
但是我为了快一点，用的yarn:
```bash
yarn add @midwayjs/typeorm@3 typeorm --save
```
##### 然后引入组件
```javascript
// configuration.ts
import { Configuration } from '@midwayjs/core';
import * as orm from '@midwayjs/typeorm';
import { join } from 'path';

@Configuration({
  imports: [
    // ...
    orm                                                         // 加载 typeorm 组件
  ],
  importConfigs: [
    join(__dirname, './config')
  ]
})
export class MainConfiguration {

}
```
##### 然后安装mysql2
官方:
```bash
npm install mysql2 --save
```
犟种：
```bash
yarn add mysql2 --save
```
这时你运行项目会报错，因为安装并引入了mysql但是并没有配置连接，所以接下来配置mysql连接
#### 配置mysql
先创建一个叫`ruoyi_node_midway`的数据库，然后在/src/config/config.default.ts中新增配置：

```bash
  koa: {
    port: 7001,
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '数据库密码',
        database: 'ruoyi_node_midway',
        synchronize: false,  // 如果第一次使用，不存在表，有同步的需求可以写 true，注意会丢数据
        logging: false,
        // 支持如下的扫描形式，为了兼容我们可以同时进行.js和.ts匹配，⬇️
        entities: [
          'entity',
        ],
        timezone: '+08:00', // 避免时间误差8小时
        dateStrings: true, // 时间字段返回字符串
        bigNumberStrings: false, // 避免大数字被截断转String类型
      }
    }
  }
  ……
```
再次运行就不报错了，此时、你已成功连接数据库了！
