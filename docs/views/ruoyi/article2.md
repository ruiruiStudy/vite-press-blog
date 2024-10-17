---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/140857138)

### 回顾
上一篇，我们对比了各大nodejs库，选择了Midway.js并且初始化了项目，也成功地配置并连接了数据库mysql。
那么，今天我们来尝试写一下接口，先从登录接口开始吧。
为了方便描述，本项目统一把`ruoyi_node_midway`叫后端，`ruoyi-vue3`叫前端。

## 前置准备
在具体写接口之前，我们先对项目做一些配置，以方便后面使用。
### 后端配置路径别名@
在后端根目录下的`tsconfig.json`文件内加上如下内容：
```javascript
"rootDir": "src",
// 以下为新增的内容，相当于vue里配置的alias别名：@
  "baseUrl": ".", // 设置基础目录
  "paths": {
  "@*": ["src/*"], // 创建别名，@ 指向 src/ 目录
}
```
### 修改前端代理地址
因为本后端项目接口用的时7001端口，所以把前端代理的接口也改为7001（不一定要一模一样，但是端口要统一）：

```javascript
// vite.config.js
target: 'http://localhost:7001'
```
### 基本配置习惯
常用的src下的文件夹有如下，后面我们会用到：
- `controller `Web Controller 目录
- `middleware `中间件目录
- `filter `过滤器目录
- `aspect `拦截器
- `service `服务逻辑目录
- `entity `或 model 数据库实体目录
- `config `业务的配置目录
- `util `工具类存放的目录
- `decorator `自定义装饰器目录
- `interface.ts` 业务的 ts 定义文件

## 登录接口
登录相关的接口可以分为三块：

- 1.获取图片验证码
- 2.账号密码登录
- 3.退出登录
***
### 1.获取图片验证码
#### 分析
通过对`login.vue`的代码分析发现，只要接口返回的`captchaEnabled`字段为空或者为true，那么前端就显示并启用验证码。
且如果`captchaEnabled`字段为true，则同时返回base64字符串`img`字段来拼接位图片，为了省事，我们把此处直接返回图片img
```javascript
function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
    if (captchaEnabled.value) {
      // codeUrl.value = "data:image/gif;base64," + res.img; // 这行是源代码，注释掉
      codeUrl.value = res.img; // 修改为这行的，此处后端直接返回图片，不用拼接了
      loginForm.value.uuid = res.uuid;
    }
  });
}
```
为了语义清晰，我们约定在接下来的接口中，如果开启图片验证码，那么`captchaEnabled`字段返回true，否则返回false，不存在不返回这一说。
##### 编写controller
在/src/controller下新建文件`login.controller.ts`（也可以叫login.ts，无强制要求），并写上如下代码：
```javascript
import { Controller, Get } from '@midwayjs/core';

@Controller('/')
export class LoginController {
  @Get('/captchaImage')
  async generateCode() {
    return {
      code: 200,
      msg: '操作成功',
      img: 'imageBase64',
      captchaEnabled: false,
    }
  }
}
```
这样，`/captchaImage`接口就成功返回了，midway路由教程请看[文档](https://www.midwayjs.org/docs/controller)
打开浏览器，你将看到这样：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d38095b38711444d80ca134832358e8a.png)
但是此时，`/captchaImage`字段如果为true时，还没生成图片，那么接下来我们就去生成图片。
##### 生成验证码图片
先执行命令：
```bash
yarn add @midwayjs/captcha --save
```
然后在`configuration.ts`文件中引入，类似上一篇的`orm`引入

```javascript
// onfiguration.ts
import * as captcha from '@midwayjs/captcha';
……
imports: [
  captcha,
  ……
]
```
紧接着，我们在`/src/service`文件夹下新建`login.service.ts`（也可叫login.ts，随意）
业务代码一定要写在service下！
业务代码一定要写在service下！
业务代码一定要写在service下！
代码如下：
```javascript
import { Provide, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CaptchaService } from '@midwayjs/captcha';

@Provide()
export class LoginService {
  @Inject()
  ctx: Context;

  @Inject()
  captchaService: CaptchaService;

  // 生成验证码
  async captchaImage() {
    // 是否开启验证码校验
    const isCaptchaEnabled: boolean = true;
    // 验证码的开启状态存入session
    this.ctx.session.isCaptchaEnabled = isCaptchaEnabled;
    if(isCaptchaEnabled) {
      // 如果开启了验证码，则生成验证码
      const { id, imageBase64 } = await this.captchaService.formula({ noise: 1 }); // noise：干扰项条数，具体其他配置可看文档
      // 把校验id存起来，和后面的登录时的参数、对比值是否一致
      this.ctx.session.codeId = id;
      return {
        code: 200,
        msg: '操作成功',
        img: imageBase64, // 此处直接返回base64图片，和若依的base64位字符串不一样
        captchaEnabled: isCaptchaEnabled, // 是否开启验证码校验
      }
    } else {
      // 如果关闭了验证码，则返回captchaEnabled值为false
      return {
        code: 200,
        msg: '操作成功',
        captchaEnabled: isCaptchaEnabled, // 是否开启验证码校验
      }
    }
  }
}
```
我们修改之前的`login.controller.ts`，把LoginService中的方法引入，修改后的代码如下：
```javascript
import { Controller, Inject, Get } from '@midwayjs/core';
import { LoginService } from "@service/login.service";

@Controller('/')
export class LoginController {
  @Inject()
  loginService: LoginService;

  // 生成验证码，转64位输出
  @Get('/captchaImage')
  async generateCode() {
    return this.loginService.captchaImage()
  }
}
```
此时，我们再刷新浏览器，会看到这样：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/450bc438354c4554af7b298d50c17ae8.png)
接口跑通了，验证码也有了，每次刷新验证码，都会随机生成不同的内容。
至此，获取验证码接口完成。
### 2.账号密码登录
登录接口比较复杂，首先要往数据库里录入数据，然后校验用户名、密码、图片验证码（如果开启的话）是否正确匹配。
如果登录成功，还要根据用户id来请求以下两个接口：
- /getInfo ：获取用户的基础信息及关联的角色、部门、权限等内容。
- /getRouters :获取路由权限等基础信息
  此处，我们先完成校验用户及密码是否正确的接口`/login`，上面的两个接口在接下啦的章节中讲述。
##### 导入sql数据
把这个若依的[mysql文件](https://gitee.com/y_project/RuoYi-Cloud/blob/master/sql/ry_20240629.sql)中的数据录入mysql。
- 1.上面的sql文件内容全选；
- 2.Navicat中到`ruoyi_node_midway`数据库中，点击新建查询
- 3.把刚刚复制的内容粘贴进来，全选；
- 4.点击运行已选择的
  ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9dc643584a884fddb89b129b88806d57.png)
  然后刷新数据库，所有的表导入成功：
  ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f3fd15fc4be743e5b8645bfc15889322.png)
##### 实现账号密码登录
我们先实现最简单的功能，就是用户输入的账号密码、和数据库做对比：
- 比对成功：那么我们返回成功提示、并返回token数据
- 比对失败：返回用户不存在、或密码错误、或验证码不一致 等 错误提示
  我们看到数据库里`sys_user`表中的`password`字段是密文的形式
  ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/254cd48bb18f4e20b6959e7fa7e61b1a.png)
  接下来又到了准备的时刻：
###### a.声明用户实体类
新建文件`/src/entity/system/user.entity.ts`和`/src/entity/common.entity.ts`，内容分别如下：

```javascript
// /src/entity/common.entity.ts
import { Column, CreateDateColumn, UpdateDateColumn, } from 'typeorm'; // BeforeInsert, BeforeUpdate

// 公共字段类，自动记录创建时间、修改时间
export abstract class CommonEntity {

  @Column({ type: 'varchar', comment: '创建者', name: 'create_by', length: 64 })
  createBy: string;

  @CreateDateColumn({ type: 'timestamp', comment: '创建时间', name: 'create_time' })
  createTime: Date;

  @Column({ type: 'varchar', comment: '更新者', name: 'update_by', length: 64 })
  updateBy: string;

  @UpdateDateColumn({ type: 'timestamp', comment: '更新时间', name: 'update_time' })
  updateTime: Date;
}
```

```javascript
// /src/entity/system/user.entity.ts，用户表暂时不与任何表建立关联
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from "@entity/common.entity";

@Entity('sys_user', { comment: '用户信息表' })
export class UserEntity extends CommonEntity{

  @PrimaryGeneratedColumn({ comment: '用户ID', name: 'user_id' })
  userId: number;

  @Column({ comment: '部门ID', name: 'dept_id', default: null, })
  deptId: number;

  @Column({ comment: '登录账号', name: 'user_name', length: 30, })
  userName: string;

  @Column({ comment: '用户昵称', name: 'nick_name', length: 30, default: '', })
  nickName: string;

  @Column({ comment: '用户类型（00系统用户 01注册用户）', name: 'user_type', length: 2, default: '00', })
  userType: string;

  @Column({ comment: '用户邮箱', length: 50, default: '', })
  email: string;

  @Column({ comment: '手机号码', length: 11, default: '', })
  phonenumber: string;

  @Column({ comment: '用户性别（0男 1女 2未知）', default: '0', })
  sex: string;

  @Column({ comment: '头像路径', length: 100, default: '', })
  avatar: string;

  @Column({ comment: '密码', length: 100, default: '', })
  password: string;

  @Column({ comment: '帐号状态（0正常 1停用）', default: '0', })
  status: string;

  @Column({ comment: '最后登录IP', name: 'login_ip', length: 50, default: '', })
  loginIp: string;

  @Column({ comment: '最后登录时间', name: 'login_date', default: null, })
  loginDate: Date;

  @Column({ type: 'varchar', name: 'remark', default: null, comment: '备注', length: 500 })
  remark: string;
}
```
###### b.新建/src/dto文件夹，并新建文件login.dto.ts
dto是用于参数验证的文件，便于维护，login.dto.ts内容如下：
```javascript
import { Rule, RuleType } from "@midwayjs/validate";

export class LoginDTO {
  // 用户名
  @Rule(RuleType.string().required().min(2).max(12))
  username: string;

  // 密码
  @Rule(RuleType.string().required())
  password: string;

  // 验证码、非必填
  @Rule(RuleType.string())
  code: string;
}
```
###### c.安装依赖
c.1:安装`@midwayjs/jwt`,基于它做独立的鉴权和校验:
官方安装方式：
```bash
$ npm i @midwayjs/jwt@3 --save
```
犟种安装方式：
```bash
yarn add @midwayjs/jwt --save
```
并且在`configuration.ts`中引入jwt，方法同`captcha`：
```javascript
import * as captcha from '@midwayjs/captcha';
imports: [
  jwt,
	……
]
```
还要在`/src/config/config.default.ts`中配置：
```javascript
 jwt: {
  secret: '1716858149155_4244',
    expiresIn: '2d', // 2天过期
},
```
c.2:安装`bcryptjs`，用于密码的哈希处理和验证：

```bash
yarn add bcryptjs --save
```
###### d.新建工具函数文件夹/src/utils，新建password.ts
封装密码相关的辅助函数，代码如下：
```javascript
import * as bcrypt from 'bcryptjs';

/**
 * @desc 生成hash密码
 * @param {*} password<string> 密码明文
 * @param {*} saltRounds<number> 密码盐值
 * */
export function genHashPsw(password: string, saltRounds: any = 5) {
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}

/**
 * @desc 验证密码是否正确
 * @param {*} password<string> 密码明文
 * @param {*} hash<string> 密码hash
 * */
export function isEqualPsw(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}
```
###### e.以上准备好了，我们修改接口
`login.controller.ts`修改为以下：

```javascript
import { Controller, Inject, Get, Post, Body } from '@midwayjs/core';
import { LoginService } from "@service/login.service";
import { LoginDTO } from "@dto/login.dto";

@Controller('/')
export class LoginController {
  @Inject()
  loginService: LoginService;

  // 生成验证码，转64位输出
  @Get('/captchaImage')
  async generateCode() {
    return this.loginService.captchaImage()
  }

  /** 登录、在接收数据前，先验证是否符合LoginDTO格式规则 */
  @Post('/login')
  async login(@Body() body: LoginDTO) {
    return this.loginService.login(body);
  }
}
```
`login.service.ts`修改为以下：

```javascript
import { Provide, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CaptchaService } from '@midwayjs/captcha';
import { JwtService } from "@midwayjs/jwt"; // 鉴权和校验
import { LoginDTO } from "@dto/login.dto"; // 登录参数格式
import { InjectEntityModel } from "@midwayjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "@entity/system/user.entity";
import { genHashPsw, isEqualPsw } from '@/utils/password';

@Provide()
export class LoginService {
  @Inject()
  ctx: Context;

  @Inject()
  captchaService: CaptchaService;

  @Inject()
  jwtService: JwtService;

  @InjectEntityModel(UserEntity)
  userModel: Repository<UserEntity>;

  // 生成验证码
  async captchaImage() {
    // 将此处打印的密码hash值，替换数据库中的password字段值，并保存
    // 因为我们不知道Java是怎么生成的，以后我们就按照这套标准生成
    // 然后登录的时候，就用密码明文和这个生成的hash值做对比
    // 切记，生成替换完成后，删除这行打印
    console.log('密码hash值，替换后要删除这行代码', genHashPsw('admin123'))
    // 是否开启验证码校验
    const isCaptchaEnabled: boolean = true;
    // 验证码的开启状态存入session
    this.ctx.session.isCaptchaEnabled = isCaptchaEnabled;
    if(isCaptchaEnabled) {
      // 如果开启了验证码，则生成验证码
      const { id, imageBase64 } = await this.captchaService.formula({ noise: 1 }); // noise是干扰项条数，具体配置可看文档
      // 把校验id存起来，和后面的登录时的参数、对比值是否一致
      this.ctx.session.codeId = id;
      return {
        code: 200,
        msg: '操作成功',
        img: imageBase64, // 此处直接返回base64图片，和若依的base64位字符串不一样
        captchaEnabled: isCaptchaEnabled, // 是否开启验证码校验
      }
    } else {
      // 如果关闭了验证码，则返回captchaEnabled值为false
      return {
        code: 200,
        msg: '操作成功',
        captchaEnabled: isCaptchaEnabled, // 是否开启验证码校验
      }
    }
  }

  // 登录接口
  async login(body: LoginDTO) {
    const { username, password, code } = body;

    // 先查询用户表是否有这个用户名
    const userInfoTemp: UserEntity = await this.userModel.findOne({
      where: {
        userName: username
      }
    })

    // 如果用户存在，进行下一步，否则提示不存在用户
    if(userInfoTemp) {
      // 如果开启了验证码，验证码是否相等
      if(this.ctx.session.isCaptchaEnabled) {
        const isEqualCode: boolean = await this.captchaService.check(this.ctx.session.codeId, code);
        if(!isEqualCode) {
          throw new Error('验证码错误')
        }
      }

      // 密码是否相等
      const isEqualPswFlag: boolean = await isEqualPsw(password, userInfoTemp.password.trim());
      if(!isEqualPswFlag) {
        throw new Error('账号或密码错误')
      }
    } else {
      throw new Error('用户不存在')
    }

    // 通过校验后，设置本地缓存、返回token
    this.ctx.session.userInfo = userInfoTemp;
    const token: string = await this.jwtService.sign({
      userId: userInfoTemp.userId,
      username: userInfoTemp.userName,
    })
    // 设置token相关配置，更多配置请自行查阅，这个一般够用了
    this.ctx.cookies.set('token', token, {
      maxAge: 24 * 60 * 60 * 1000, // 有效期为一天
      httpOnly: true, // 只能通过 HTTP 请求访问，不能通过 JavaScript 访问
      signed: true, // 签名 cookie，防止篡改
      overwrite: true, // 如果已有同名 cookie，则覆盖
    })

    return {
      code: 200,
      msg: '操作成功',
      token: token,
    }
  }
}

```
这时候我们再运行，验证码输入不一致时会报错，导致程序运行不下去了。
但是，我们希望的是：报错的时候返回code为500，并且提示错误原因。
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/aa7f77c698da44198ff70815440999c5.png)
这时，我们需要到`configuration.ts`文件中解除`DefaultErrorFilter`和`NotFoundFilter`的注释
并且修改`/src/filter/default.filter.ts`的catch中的内容为：
```javascript
  // 所有的未分类错误会到这里，如未设置ctx.code，则默认设置为500
return {
  code: ctx.code || 500,
  msg: err.message,
};
```
此时再运行，验证码错误时，正常提示，程序正常跑
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d0609d0e7a6b4361974436986d1c10ec.png)
账号或密码输入错误时，也会正常提示：“账号或密码错误”，大家可自行尝试。
输入正确的账号、密码、验证码，即可通过`/login`接口的校验，可以看到接口返回200、操作成功
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0d00f1fa84674b20a157e04446a145b3.png)
### 退出登录
因为现在只是登录接口通过校验了，还缺少`/getInfo`，`/getRouters`等接口，所以无法进入后台，也就无法点击退出登录
其实这个接口也简单，就是清除一些缓存值，这个放在后面讲。
