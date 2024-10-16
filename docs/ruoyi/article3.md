---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/140881954)

### 回顾
[上一篇文章](https://blog.csdn.net/yan1915766026/article/details/140857138)我们实现了这两个接口：
- `/captchaImage`：返回图片验证码的数据
- `/login`：账号密码登录接口

虽然`/login`接口成功跑通了，但是现在还无法进入后台页面，因为这两个接口还没跑通：
- `/getInfo`：获取用户基础信息，信息里包含关联的角色、部门、权限等数据。
- `/getRouters`：获取路由信息

那么，今天我们就来实现这两个接口！

以下内容均假设你已初步了解[Midway文档](https://www.midwayjs.org/docs/intro)
## 分析
#### getInfo接口的实现过程
这是[若依演示地址](https://vue.ruoyi.vip/index)`/getInfo`接口返回的数据
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/44933b09511b4d94b64d0f18b6dbaf77.png)
通过分析我们发现、接口返回的数据包含：
- permissions：如果是超管，返回[ "* : * : *" ]，否则返回具体权限数组列表；
- roles：角色列表数组；
- user：用户信息对象，对象里还包含
-  - dept：关联的部门信息dept对象
-  - roles：关联角色信息对象的列表数组

上述分析可以帮助我们理清楚各种数据之间的关联：
- 用户与部门是一对一的关系 ，一个用户只能在一个部门；
- 用户与角色是多对多关系，一个用户可以有多个角色，一个角色可以分配多个用户；
- 用户和菜单没有直接关系，但是用户和角色有关系，而角色又和菜单有关联，所以需要通过这层间接的关联，从菜单表里取出权限列表`permissions`给该用户
### 准备工作
老规矩，写接口前要先把准备工作做好
###### 步骤一：新建实体类
先在/src/entity/system文件夹下新建以下几个文件：
- dept.entity.ts：部门表实体
- menu.entity.ts：菜单表实体
- role.entity.ts：角色表实体
- roleMenu.entity.ts：角色菜单表关联实体
- userRole.entity.ts：用户角色关联表实体

dept.entity.ts如下：
```javascript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from "@entity/common.entity";

// 部门表-实体类
@Entity('sys_dept', { comment: '部门表' })
export class DeptEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'dept_id', comment: '部门ID' })
  deptId: number;

  @Column({ type: 'int', name: 'parent_id', default: 0, comment: '父部门ID' })
  parentId: number;

  @Column({ type: 'varchar', name: 'ancestors', default: '', comment: '祖级列表' })
  ancestors: string;

  @Column({ type: 'varchar', name: 'dept_name', default: '', comment: '部门名称' })
  deptName: string;

  @Column({ type: 'bigint', name: 'order_num', default: 0, comment: '显示顺序' })
  orderNum: number;

  @Column({ type: 'varchar', name: 'leader', default: '', comment: '负责人' })
  leader: string;

  @Column({ type: 'varchar', name: 'phone', default: '', comment: '联系电话' })
  phone: string;

  @Column({ type: 'varchar', name: 'email', default: '', comment: '邮箱' })
  email: string;

  @Column({ type: 'varchar', name: 'status', default: '0', comment: '部门状态（0正常 1停用）' })
  status: string;

  @Column({ type: 'varchar', name: 'del_flag', default: '0', comment: '删除标志（0代表存在 2代表删除）' })
  delFlag: string;
}
```
menu.entity.ts如下
```javascript
import { Entity, Column, PrimaryGeneratedColumn, JoinTable, ManyToMany } from 'typeorm';
import { CommonEntity } from "@entity/common.entity";
import { RoleEntity } from "@entity/system/role.entity";

// 菜单表-实体类
@Entity('sys_menu', {comment: '菜单信息表'})
export class MenuEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'menu_id', comment: '菜单ID' })
  menuId: number;

  @Column({ type: 'varchar', name: 'menu_name', length: 50, comment: '菜单名称' })
  menuName: string;

  @Column({ type: 'int', name: 'parent_id', default: 0, comment: '父菜单ID' })
  parentId: number;

  @Column({ type: 'bigint', name: 'order_num', default: 0, comment: '显示顺序' })
  orderNum: number;

  @Column({ type: 'varchar', length: 200, comment: '路由地址' })
  path: string;

  @Column({ type: 'varchar', length: 255, comment: '组件路径' })
  component: string;

  @Column({ type: 'varchar', length: 255, comment: '路由参数' })
  query: string;

  @Column({ type: 'char', name: 'is_frame', length: 1, default: 1, comment: '是否为外链（0是 1否）' })
  isFrame: string;

  @Column({ type: 'char', name: 'is_cache', length: 1, default: 0, comment: '是否缓存（0缓存 1不缓存）' })
  isCache: string;

  @Column({ type: 'char', name: 'menu_type', length: 1, default: 'M', comment: '菜单类型（M目录 C菜单 F按钮）' })
  menuType: string;

  @Column({ type: 'char', length: 1, default: 0, comment: '菜单状态（0显示 1隐藏）' })
  visible: string;

  @Column({ type: 'char', length: 1, default: 0, comment: '菜单状态（0正常 1停用）' })
  status: string;

  @Column({ type: 'varchar', name: 'perms', length: 100, comment: '权限标识' })
  perms: string;

  @Column({ type: 'varchar', length: 100, comment: '菜单图标' })
  icon: string;

  @Column({ type: 'varchar', name: 'remark', default: null, comment: '备注', length: 500 })
  remark: string;

  @ManyToMany(type => RoleEntity, role => role.menus)
  @JoinTable({
    name: 'sys_role_menu', // 中间表名
    joinColumns: [{ name: 'menu_id' }], // 菜单在中间表的列名
    inverseJoinColumns: [{ name: 'role_id' }] // 角色在中间表的列名
  })
  roles: RoleEntity[];
}
```
role.entity.ts：如下
```javascript
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { CommonEntity } from "@entity/common.entity";
import { UserEntity } from "@entity/system/user.entity";
import { MenuEntity } from "@entity/system/menu.entity";

// 角色表-实体类
@Entity('sys_role', { comment: '角色信息表' })
export class RoleEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'role_id', comment: '角色ID' })
  roleId: number;

  @Column({ type: 'bigint', name: 'role_name', comment: '角色名称' })
  roleName: number;

  @Column({ type: 'varchar', name: 'role_key', comment: '角色权限字符' })
  roleKey: string;

  @Column({ type: 'bigint', name: 'role_sort', comment: '角色排序' })
  roleSort: number;

  @Column({ type: 'bigint', name: 'data_scope', comment: '数据范围（0全部数据权限 1自定数据权限 2本部门数据权限 3本部门及以下数据权限 4仅本人数据权限）' })
  dataScope: number;

  @Column({ type: 'boolean', name: 'menu_check_strictly', default: true, comment: '菜单树选择项是否关联显示' })
  menuCheckStrictly: boolean;

  @Column({ type: 'boolean', name: 'dept_check_strictly', default: true, comment: '部门树选择项是否关联显示' })
  deptCheckStrictly: boolean;

  @Column({ type: 'bigint', name: 'status', comment: '状态（0正常 1停用）' })
  status: number;

  @Column({ type: 'bigint', name: 'del_flag', comment: '删除标志（0代表存在 2代表删除）' })
  delFlag: number;

  @Column({ type: 'varchar', name: 'remark', default: null, comment: '备注', length: 500 })
  remark: string;

  @ManyToMany(type => UserEntity, user => user.roles)
  @JoinTable({
    name: 'sys_user_role', // 中间表名，与User实体中的一致
    joinColumn: { name: 'role_id' }, // 角色在中间表的列名
    inverseJoinColumn: { name: 'user_id' } // 用户在中间表的列名
  })
  users: UserEntity[];

  @ManyToMany(type => MenuEntity, menu => menu.roles)
  @JoinTable({
    name: 'sys_role_menu', // 中间表名，与Menu实体中的一致
    joinColumn: { name: 'role_id' }, // 角色在中间表的列名
    inverseJoinColumn: { name: 'menu_id' } // 菜单在中间表的列名
  })
  menus: MenuEntity[];
}
```
roleMenu.entity.ts：如下

```javascript
import { Entity, PrimaryColumn } from 'typeorm';

// 角色和菜单关联表  角色1-N菜单  2个都是主键 -  实体类
@Entity('sys_role_menu', { comment: '角色和菜单关联表' })
export class RoleMenuEntity {
  @PrimaryColumn({ type: 'bigint', name: 'role_id', comment: '角色ID' })
  roleId: number;

  @PrimaryColumn({ type: 'bigint', name: 'menu_id', comment: '菜单ID' })
  menuId: number;
}
```
userRole.entity.ts：如下
```javascript
import { Entity, PrimaryColumn } from 'typeorm';

// 用户和角色关联表  用户N-N角色  2个都是主键 -  实体类
@Entity('sys_user_role', { comment: '用户和角色关联表' })
export class UserRoleEntity {
  @PrimaryColumn({ type: 'bigint', name: 'user_id', comment: '用户ID' })
  userId: number;

  @PrimaryColumn({ type: 'bigint', name: 'role_id', comment: '角色ID' })
  roleId: number;
}
```
并且上一篇文章新建的`user.entity.ts`改为下面这样：

```javascript
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, JoinTable, ManyToMany } from 'typeorm';
import { CommonEntity } from "@entity/common.entity";
import { DeptEntity } from "@entity/system/dept.entity";
import { RoleEntity } from "@entity/system/role.entity";

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

  // 一个用户 对应 一个部门
  @OneToOne(type => DeptEntity)
  @JoinColumn({ name: 'dept_id' })
  dept: DeptEntity;

  // 多个用户 对应 多个角色
  @ManyToMany(type => RoleEntity, role => role.users)
  @JoinTable({
    name: 'sys_user_role', // 中间表名
    joinColumn: { name: 'user_id' }, // 用户在中间表的列名
    inverseJoinColumn: { name: 'role_id' } // 角色在中间表的列名
  })
  roles: RoleEntity[];
}
```
***
###### 步骤二：新建Controller
`/getInfo`是获取用户信息的，属于公共接口，所以我们在`/src/controller/common`下新建文件`index.controller.ts`，内容如下(过程详见代码注释)：
```javascript
import { Controller, Inject, Get } from '@midwayjs/core';
import { UserInfoService } from "@service/common/userInfo.service";

@Controller('/')
export class UserController {

  @Inject()
  userInfoService: UserInfoService;

  // 获取用户信息
  @Get('/getInfo')
  async getInfo(): Promise<any> {
    return this.userInfoService.getUserInfo();
  }
}
```

###### 步骤三：新建Service
在`/src/service/common`下新建文件`userInfo.service.ts`，内容如下(过程详见代码注释):
```javascript
import { Provide, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from "@midwayjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity as NormalEntity } from "@/entity/system/user.entity";
import { RoleEntity } from "@entity/system/role.entity";

// role中加入admin字段、断言，这时多出来的返回给前端字段
interface RoleEntityWithAdmin extends RoleEntity {
  admin?: boolean;
}
// user中加入admin字段、断言，这时多出来的返回给前端字段
interface UserEntityWithAdmin extends NormalEntity {
  admin?: boolean;
}

/** 获取基本的用户信息 */
@Provide()
export class UserInfoService {

  @Inject()
  ctx: Context;

  @InjectEntityModel(NormalEntity)
  protected dynamicModel: Repository<NormalEntity>;

  // 查询用户信息
  async getUserInfo() {
    const userId = this.ctx.session.userInfo.userId;
    if(userId) {
      let userInfo: UserEntityWithAdmin = await this.dynamicModel.findOne({
        where: {
          userId: userId
        },
        relations: ['dept', 'roles', 'roles.menus']
      })

      // 如果查询到用户信息，稍微处理格式、然后返回用户信息
      if(userInfo) {
        // 角色列表
        const roles = [];
        userInfo.roles.forEach((role: RoleEntityWithAdmin) => {
          roles.push(role.roleKey);
          role.admin = role.roleKey === 'admin';
        })

        // 是否为超管
        const isAdmin = roles.includes('admin')
        userInfo.admin = isAdmin;

        // 权限列表
        let permissions = []

        // 如果是超管，拥有所有权限，处理roles格式返回给前端
        if(isAdmin) {
          permissions = ['*:*:*'];
        } else {
          userInfo.roles.forEach((role: RoleEntityWithAdmin) => {
            role.menus.forEach((menu) => {
              permissions.push(menu.perms)
            })
          })
        }
        this.ctx.session.permissions = permissions;
        return {
          msg: '操作成功',
          code: 200,
          user: userInfo,
          roles,
          permissions
        }
      }
    } else {
      throw new Error('用户信息不存在')
    }
  }
}
```
然后我们到后台页面去试试，一下子就成功了：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/06b2fed77c544f309b42e28cc2116ba6.png)
接下来，我们去实现`/getRouters`接口
***
### getRouters接口的实现过程
###### 分析
[若依演示地址](https://vue.ruoyi.vip/index)的`/getRouters`接口，返回的是菜单树状结构，所以我们需要通过`用户-角色-菜单`的关系查询到菜单信息，并处理成树状结构返回给前端
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7647b5d1bd24416f802725cbba6d80bb.png)
###### 准备工作
安装ts版本的lodash依赖，因为菜单树需要把name首字母转为大写，lodash方便处理：
```bash
yarn add @types/lodash -D
```
在`/src/utils`下新建文件`tree.ts`，专门处理树状结构，暂时先写处理菜单树的封装函数，内容如下：
```javascript
import * as _ from 'lodash';

// 处理菜单树
export function handleMenuTree(data: any, id: string = 'menuId', parentId: string = 'parentId', children: string = 'children') {
  let config = {
    id: id,
    parentId: parentId,
    childrenList: children
  };

  let childrenListMap = {};
  let nodeIds = {};
  let tree = [];

  for (let d of data) {
    let parentId = d[config.parentId];
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = [];
    }
    nodeIds[d[config.id]] = d;
    childrenListMap[parentId].push({
      menuId: d.menuId,
      name: _.capitalize(d.path), // name首字母转为大写
      path: d.path,
      hidden: d.visible == '1',
      component: d.component || 'ParentView',
      meta: {
        title: d.menuName,
        icon: d.icon,
        noCache: d.isCache == '1',
        link: d.isFrame == 0 ? d.path : null
      },
    });
  }

  for (let d of data) {
    let parentId = d[config.parentId];
    if (nodeIds[parentId] == null) {
      tree.push({
        menuId: d.menuId,
        name: _.capitalize(d.path),
        path: '/' + d.path,
        hidden: d.visible == '1',
        redirect: 'noRedirect',
        component: 'Layout', // 根路由默认为Layout
        meta: {
          title: d.menuName,
          icon: d.icon,
          noCache: d.isCache == '1',
          link: d.isFrame == 0 ? d.path : null
        },
        children: d.children
      });
    }
  }

  for (let t of tree) {
    adaptToChildrenList(t);
  }

  function adaptToChildrenList(o) {
    if (childrenListMap[o[config.id]]) {
      o.alwaysShow = true
      o[config.childrenList] = childrenListMap[o[config.id]];
    }
    if (o[config.childrenList]) {
      for (let c of o[config.childrenList]) {
        adaptToChildrenList(c);
      }
    }
  }

  return tree;
}
```
###### 修改Controller
把`getRouters`接口也添加写入`/src/controller/common/index.controller.ts`，修改后的内容为：

```javascript
import { Controller, Inject, Get } from '@midwayjs/core';
import { UserInfoService } from "@service/common/userInfo.service";
import { GetRouterService } from "@service/common/getRouters.service";

@Controller('/')
export class IndexController {

  @Inject()
  userInfoService: UserInfoService;

  @Inject()
  getRouterService: GetRouterService;

  // 获取用户信息
  @Get('/getInfo')
  async getInfo(): Promise<any> {
    return this.userInfoService.getUserInfo();
  }

  // 获取路由表
  @Get('/getRouters')
  async getRouters() {
    return this.getRouterService.getRouters();
  }
}
```
###### 新建Service
在`/service/common`下新建文件`getRouters.service.ts`，内容如下(过程见代码注释)：

```javascript
import { Provide, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from "@midwayjs/typeorm";
import { Repository } from "typeorm";
import { MenuEntity } from "@/entity/system/menu.entity";
import { UserEntity } from "@entity/system/user.entity";
import { handleMenuTree } from '@utils/tree'

/**
 * getRouters()：获取基本的菜单路由表，按身份
 */

@Provide()
export class GetRouterService {

  @Inject()
  ctx: Context;

  @InjectEntityModel(MenuEntity)
  protected menuEntity: Repository<MenuEntity>;

  @InjectEntityModel(UserEntity)
  protected userEntity: Repository<UserEntity>;

  // 查询菜单
  async getRouters() {
    // 如果user_id为1，则为超管，获取所有菜单；否则根据user_id获取菜单
    const userId = this.ctx.session.userInfo.userId;
    // 如果是超级管理员，则获取所有菜单
    if(userId === 1) {

      // 所有菜单，取其中一部分字段
      const allMenus = await this.menuEntity.find({
        select: ['menuId', 'menuName', 'parentId', 'path', 'component','menuType', 'visible', 'status', 'icon', 'isCache', 'isFrame'],
        order: {
          orderNum: 'ASC',
          createTime: 'DESC'
        }
      });
      // 只保留菜单和目录
      const filterMenus = allMenus.filter(item => item.menuType === 'M' || item.menuType === 'C');
      return {
        code: 200,
        msg: '操作成功',
        data: handleMenuTree(filterMenus) || []
      }
    } else {
      // 查询该用户的菜单
      const userResult = await this.userEntity.findOne({
        where: {
          userId
        },
        relations: ['roles', 'roles.menus'], // 这里需要现在实体中定义关联关系
      });
      // 处理数据格式
      const menuList = []
      userResult.roles.forEach(item => {
        menuList.push(...item.menus)
      })
      // 只保留菜单和目录
      const filterMenus = menuList.filter(item => item.menuType === 'M' || item.menuType === 'C');
      return {
        code: 200,
        msg: '操作成功',
        data: handleMenuTree(filterMenus) || []
      }
    }
  }
}
```
webstorm会自动帮我重启node服务，然后我们到浏览器看下效果：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/257f8d99bf3c49ffa5102149d7aa09bb.png)
现在，我们已经成功地进入后台了，且接口返回的数据与格式，和若依后台返回的完全一致！
