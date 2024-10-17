---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/140897712)

### 回顾
[上一篇文章](https://blog.csdn.net/yan1915766026/article/details/140881954)我们实现了这两个接口
- /getInfo
- /getRouters

现在已经可以成功地进入后台页面了。
那么今天就来写用户列表的增删改查接口，我们一步步来，先用最基础的方式写出来，后面再考虑封装。
毕竟，一口吃不成个胖子！

## 代码整洁
先把上一篇`login.service.ts`中的这里删除，因为已经用不到了，同时也保持代码的整洁：
```javascript
// 将此处打印的密码hash值，替换数据库中的password字段值，并保存
    // 因为我们不知道Java是怎么生成的，以后我们就按照这套标准生成
    // 然后登录的时候，就用密码明文和这个生成的hash值做对比
    // 切记，生成替换完成后，删除这行打印
    console.log('密码hash值，替换后要删除这行代码', genHashPsw('admin123'))
```
## 404状态返回修改
然后我们发现直接访问用户列表接口，是这样的报错：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/2315763ec1704700a21d1bff04ceb243.png)
但是我们希望的是返回404，提示“NOT FOUND”之类的，修改`/filter/notFound.filter.ts`中的代码为：

```javascript
import { Catch, httpError, MidwayHttpError, HttpStatus } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Catch(httpError.NotFoundError)
export class NotFoundFilter {
  async catch(err: MidwayHttpError, ctx: Context) {
    // 404 错误会到这里
    // ctx.redirect('/404.html');
    throw new MidwayHttpError('404 - Not Found', HttpStatus.NOT_FOUND);
  }
}
```
然后我们再请求接口，看到返回了404，这就很让人很开心：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0ea980f831a84967bed4f3787f586af8.png)
## 修改config配置
因为下面要多处用得到DTO校验，所以在`config/config.default.ts`加入下面的配置:
```javascript
validate: {
  enable: true,
   validationOptions: {
     allowUnknown: true,
   }
 },
```
## 用户列表
### 分析
老规矩，先看若依是怎么返回！
若依的接口返回的是用户的列表信息数组，并且每一条数据还包含所在部门的dept对象信息。
也就是说，我们只要查询所有的用户数据，再把关联的部门数据带进来一起返回就行了。
### 直接查询所有列表，先别管查询条件
###### 新建controller
新建`/controller/system/user.controller.ts`，内容如下：
```javascript
import { Controller, Inject, Get } from '@midwayjs/core';
import { UserService } from "@service/system/user.service";

@Controller('/system/user')
export class UserController {
  @Inject()
  userService: UserService;

  @Get('/list')
  async list() {
    return await this.userService.list();
  }
}
```
###### 新建service
新建`/service/system/user.service.ts`，内容如下：

```javascript
import { Inject, Provide } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from "@midwayjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "@entity/system/user.entity";

@Provide()
export class UserService {
  @Inject()
  ctx: Context;

  @InjectEntityModel(UserEntity)
  userModel: Repository<UserEntity>;

  // 用户列表
  async list() {
    const [rows, total] = await this.userModel.findAndCount();
    return {
      code: 200,
      msg: '操作成功',
      rows,
      total,
    };
  }
}
```
然后我们再到浏览器查看，接口有返回了：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/2ed0a2b5901b40928acd1edc8434c92a.png)
但是，存在两个问题
1. 用户信息里没有部门对象的数据
2. 没有查询条件

我们先解决第一个问题，先把部门给关联出来，因为之前添加实体的时候，已经把用户和部门关联起来了，所以这里添加一个查询条件即可，如下图：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/007857ad15f149f384845945799236ec.png)
查询条件放在下一篇文章里讲述，因为导出接口也涉及到查询，所以查询和导出一起讲述
## 新增用户
先看若依的新增，需要哪些参数：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/982df0c9ddea4353b99baa5b58053596.png)
且结合前端内容，可以看到，用户昵称、用户名称、用户密码这三个参数是必传的……
其实，这里的新增不仅仅是新增了用户信息，同时还创建了`用户与角色`、`用户与岗位`等关联信息，这个我们放在后面的章节中再讲，先让数据能新增再说！
###### 新建DTO
DTO类型的文件用于参数校验，省的我们在接口里一个个校验了，这便于维护，具体请看文档/
我们需要新建`dto/system/user.dto.ts`，内容如下：

```javascript
import { Rule, RuleType } from "@midwayjs/validate";

// 新增参数
export class CreateUserDTO {
  @Rule(RuleType.string().required())
  userName: string;

  @Rule(RuleType.string().required())
  nickName: string;

  @Rule(RuleType.string().required())
  password: string;

  @Rule(RuleType.number().allow(null))
  deptId?: number | null;

  @Rule(RuleType.string().email())
  email?: string;

  @Rule(RuleType.string().length(11))
  phonenumber?: string;

  @Rule(RuleType.string())
  status?: string;

  @Rule(RuleType.string())
  sex?: string;

  @Rule(RuleType.string().max(500))
  remark?: string;

  @Rule(RuleType.array())
  postIds?: Array<number>

  @Rule(RuleType.array())
  roleIds?: Array<number>
}
```
###### 修改Controller
`user.controller.ts`在刚刚查询的基础上再加个新增接口，如下：

```javascript
import { Controller, Inject, Get, Body, Post } from '@midwayjs/core';
import { UserService } from "@service/system/user.service";
import { CreateUserDTO } from "@dto/system/user.dto";

@Controller('/system/user')
export class UserController {
  @Inject()
  userService: UserService;

  @Get('/list')
  async list() {
    return await this.userService.list();
  }

  @Post('/')
  async create(@Body() user: CreateUserDTO) {
    return await this.userService.create(user);
  }
}
```
###### 修改Service
同样的在`user.service.ts`中添加新增的逻辑代码：

```javascript
import { Inject, Provide } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from "@midwayjs/typeorm";
import { Repository, } from "typeorm"; // Like, Between
import { UserEntity } from "@entity/system/user.entity";
import { CreateUserDTO } from "@dto/system/user.dto";

@Provide()
export class UserService {
  @Inject()
  ctx: Context;

  @InjectEntityModel(UserEntity)
  userEntity: Repository<UserEntity>;

  // 用户列表
  async list() {
   
  }

  // 添加用户
  async create(user: CreateUserDTO) {
    const addUser = new UserEntity();
    addUser.userName = user.userName;
    addUser.nickName = user.nickName;
    addUser.password = user.password;
    addUser.phonenumber = user.phonenumber;
    addUser.email = user.email;
    addUser.sex = user.sex;
    addUser.status = user.status;
    addUser.deptId = user.deptId;
    addUser.remark = user.remark;

    const addResult = await this.userEntity.save(addUser);
    if(addResult) {
      return {
        code: 200,
        msg: '操作成功',
      };
    } else {
      return {
        code: 500,
        msg: '操作失败',
      };
    }
  }
}
```
##### 调试
回到页面，我们点击新增，会发现有个接口报404，我们有两种解决方案
- 先到前端代码把这个注释掉
- 用类似`Apifox`的接口调试工具

我们先到前端代码把这部分注释掉，后面的章节再专门讲Apifox的使用。
打开`/src/view/system/index.vue`的第587行，注释掉：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/70a6d68964f84ba59ba55a9f1ec17591.png)
然后我们再点击新增，随便填写一些数据，点击确定，一不小心就新增成功了：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/fd9410790ab547afa0e339083aa4ca48.png)
我们看到，虽然新增成功了，但是还缺少很多东西，这个我们先不管，这一章节我们只管新增，下一章节再来填坑，一步步来嘛！
## 用户详情
想要修改的话，就要现有详情接口，所以这里先写详情接口
修改`user.controller.ts`，差异部分如下：

```javascript
import { Param } from '@midwayjs/core';

  @Get('/:userId')
  async get(@Param('userId') userId: number) {
    return await this.userService.detail(userId);
  }
```
修改`user.service.ts`，差异部分如下：

```javascript
  // 详情
  async detail(userId: number) {
    const detailInfo =  await this.userEntity.findOneBy({
      userId,
    });
    return {
      code: 200,
      msg: '操作成功',
      data: detailInfo,
    }
  }
```
我们回到页面点击修改测试一下，看到数据成功获取了：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3f0604018880433fa993fed1b0116479.png)
## 修改用户
先看若依的修改，除了用户名称和用户密码不能修改，其他的都能改，那么我们还是上面的步骤
###### 修改DTO
`user.dto.ts`加入下面的内容：

```javascript
// 修改参数
export class UpdateUserDTO {
  @Rule(RuleType.number().required())
  userId: number;

  @Rule(RuleType.string().required())
  nickName: string;

  @Rule(RuleType.number().allow(null))
  deptId?: number | null;

  @Rule(RuleType.string().email())
  email?: string;

  @Rule(RuleType.string().length(11))
  phonenumber?: string;

  @Rule(RuleType.string())
  status?: string;

  @Rule(RuleType.string())
  sex?: string;

  @Rule(RuleType.string().max(500))
  remark?: string;

  @Rule(RuleType.array())
  postIds?: Array<number>

  @Rule(RuleType.array())
  roleIds?: Array<number>
}
```
###### 修改Controller
修改`user.controller.ts`，差异部分如下：

```javascript
import { Put } from '@midwayjs/core';

  @Put('/')
  async update(@Body() user: UpdateUserDTO) {
    return await this.userService.update(user);
  }
```
修改`user.service.ts`，差异部分如下：

```javascript
import { UpdateUserDTO } from "@dto/system/user.dto";

 // 修改
  async update(user: UpdateUserDTO) {
    // 先查询时哪条数据需要修改
    const updateRecord = await this.userEntity.findOneBy({
      userId: user.userId,
    });
    // 重新赋值
    updateRecord.nickName = user.nickName;
    updateRecord.phonenumber = user.phonenumber;
    updateRecord.email = user.email;
    updateRecord.sex = user.sex;
    updateRecord.status = user.status;
    updateRecord.deptId = user.deptId;
    updateRecord.remark = user.remark;
    // 然后执行更细语句
    const updateResult = await this.userEntity.save(updateRecord);
    if(updateResult) {
      return {
        code: 200,
        msg: '操作成功',
      }
    } else {
      return {
        code: 500,
        msg: '操作失败',
      }
    }
  }
```
######验证
然后我们到浏览器试试，哎呀，一下就修改成功了：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5a4eef5859c04700ae73a87efcc2786f.png)
## 删除用户
先分析若依的删除功能，分为以下两种情况：
- 单个删除：传一个id
- 批量删除：传多个id用逗号拼接的字符串

> 思路：那么我们后端就可以按照多个删除的方法来处理，可以把逗号拼接的字符串split(',')

修改`user.controller.ts`，差异代码如下：

```javascript
import { Del } from '@midwayjs/core';
  @Del('/:userId')
  async delete(@Param('userId') userId: number | string) {
    return await this.userService.delete(userId);
  }
```
修改`user.service.ts`，差异代码如下：

```javascript
// 删除
  async delete(userId: number | string) {
    const ids = typeof userId === 'string' ? userId.split(',') : [userId];
    const deleteResult = await this.userEntity.delete(ids);
    if(deleteResult) {
      return {
        code: 200,
        msg: '操作成功',
      }
    } else {
      return {
        code: 500,
        msg: '操作失败',
      }
    }
  }
```
然后我们回到浏览器测试一下，为了验证批量删除，我们先新建一条用户记录，然后勾选删除，一下子也成功了。
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d05862c1d8ad489286a650ba893923c4.png)
## 总结
虽然大体上实现了增删改查，但是还存在很多问题，如：
- 搜索没加查询条件
- 新增用户时，关联的角色、岗位信息没处理
- 修改的时候，关联的角色、岗位信息也没处理
- 新增的时候没加校验，判断是否已有该用户
- 删除的时候也没任何校验
- 导出功能还没做
- 缺少一些其他接口

但是，庆幸的是，我们学会了基础的增删改查，上面这些问题，我们将在下一章节中完善
