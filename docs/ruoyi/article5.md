---
outline: deep
---

[作者原文链接](https://blog.csdn.net/yan1915766026/article/details/141782182)

### 回顾
上一章节中，我们学会了`ruoyi用户列表`简单的增删改查功能，但是上一节还存在一些问题：
- 查询的列表是全部数据，没加查询条件；
- 没有导出功能；
- 新增或修改时，用户关联的角色、岗位、菜单等没做关联；

今天，我们先来解决前两个问题，因为第三个问题涉及到其他基础表，放到后面讲

## 查询用户列表

#### 封装返回
下文为了方便统一返回，封装了几个返回函数，可以把上篇文字中的增删改查修改一下：
页面引入：`import { resBuild } from "@utils/resBuild";`
- resBuild.success()：msg:操作成功，code:200，msg、code可修改
- resBuild.fail()：msg:操作失败,code:500，msg、code可修改
- resBuild.data()：返回data键值对，msg:操作成功，code:200，msg、code可修改
- resBuild.list()：返回自定义键值对，msg:操作成功，code:200，msg、code可修改
- resBuild.other()：返回列表，rows: []， total: 0, msg:操作成功，code:200，msg、code可修改

源码如下：
```javascript
/** 基础提示类，封装成功、失败的提示 */
export class resBuild {
  /**
   * 构建 成功/失败 返回 data对象
   * */
  static data(data: any, code:number = 200, msg:string = '操作成功') {
    return {
      code,
      msg,
      data: data,
    }
  }

  /**
   * 构建 成功/失败 返回 自由传键值对来解构
   * */
  static other(data: any = {}, msg = '操作成功', code = 200) {
    return {
      code,
      msg,
      ...data
    }
  }

  /**
   * 构建列表，返回rows,total等字段
   * */
  static list(rows: any[] , total: number, msg:string = '操作成功', code:number = 200) {
    return {
      code,
      msg,
      rows: rows || [],
      total: total || 0
    }
  }

  /** 操作成功 */
  static success(msg:string = '操作成功', code:number = 200) {
    return {
      code,
      msg,
    }
  }

  /** 操作失败 */
  static fail(msg:string = '操作失败', code:number = 500) {
    return {
      code,
      msg,
    }
  }
}

```

#### 新建dto
为了方便以后得列表dto，我们先新建公共类`分页DTO`：

```javascript
import { Rule, RuleType } from "@midwayjs/validate";

// 分页请求参数
export class PageDTO {
  @Rule(RuleType.number())
  pageNum?: number;

  @Rule(RuleType.number())
  pageSize?: number;
}
```
观察用户列表界面，发现有以下几个搜索条件
- 用户名称，模糊搜索
- 手机号码，模糊搜索
- 状态值，单选等于
- 创建时间，日期范围，包含当天
- 部门id，左侧的部门树（大家可以像创建用户列表一样，先把部门Controller、Service、DTO）建立起来

于是，在`user.dto.ts`中、创建：
```javascript
import { PageDTO } from "@dto/common/page.dto";

// 查询参数
export class ListUserDTO extends PageDTO {
  @Rule(RuleType.string())
  userName?: string;

  @Rule(RuleType.string())
  nickName?: string;

  @Rule(RuleType.number())
  deptId?: number;

  @Rule(RuleType.string().max(11))
  phonenumber?: string;

  @Rule(RuleType.string())
  status?: string;

  @Rule(RuleType.string()
  'params[beginTime]'?: string;

  @Rule(RuleType.string()
  'params[endTime]'?: string;
}
```
可能有的人会把`params[beginTime]`改为下面这样：

```javascript
class DateParamsDTO {
  @Rule(RuleType.string().required())
  beginTime: string;

  @Rule(RuleType.string().required())
  endTime: string;
}

export class ListUserDTO extends PageDTO {
  @Rule(RuleType.object())
  params?: DateParamsDTO;
}
```
但是，实测这样无法被解析

> 源码未细读，估计是`@Query()`不支持嵌套，以后仔细读源码再做分析

修改`user.controller.ts`：
```javascript
 @Get('/list')
 async list(@Query() queryParams: ListUserDTO) {
   return await this.userService.list(queryParams);
 }
```
#### 修改`user.service.ts`

```javascript
async list(queryParams: ListUserDTO) {
    const queryBuilder = this.userEntity
      .createQueryBuilder('entity')
      .leftJoinAndSelect('entity.dept', 'dept');

    if(queryParams.userName) {
      queryBuilder.andWhere(`entity.userName LIKE "%${queryParams.userName}%"`,)
    }
    if(queryParams.phonenumber) {
      queryBuilder.andWhere(`entity.phonenumber LIKE "%${queryParams.phonenumber}%"`)
    }
    if(queryParams.status) {
      queryBuilder.andWhere(`entity.status = ${queryParams.status}`)
    }
    // 时间范围，包含全天
    if(queryParams["params[beginTime]"] && queryParams["params[endTime]"]) {
      queryBuilder.andWhere(`entity.createTime BETWEEN :beginTime AND :endTime`, {
        beginTime: queryParams["params[beginTime]"] + ' 00:00:00',
        endTime: queryParams["params[endTime]"] + ' 23:59:59',
      })
    }

    if(queryParams.deptId) {
      queryBuilder.orWhere(`dept.deptId = :deptId`, { deptId: queryParams.deptId });
      queryBuilder.orWhere('FIND_IN_SET(:ancestors, dept.ancestors) > 0', { ancestors: String(queryParams.deptId) });
    }

    if(queryParams.pageNum && queryParams.pageSize) {
      queryBuilder.skip((queryParams.pageNum - 1) * queryParams.pageSize).take(queryParams.pageSize)
    }

    const [ rows, total] = await queryBuilder.getManyAndCount()
    return resBuild.list(rows, total)
  }
```
然后简单测试一下，条件都生效了
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/a7bd56ed2125418898f93fe47e072acc.png)
## 导出用户列表
分析：导出之前需要先查询用户列表，且去除`pageSize`、`pageNum`参数，然后导出为excel文件
#### 引入依赖

```bash
yarn add exceljs
```
#### 声明枚举文件
导出时字段翻译用，简单举例如下`@/utils/enum.ts`：

```javascript
/**
 * 删除标志: 0代表存在 1代表删除
 */
export enum DelFlagEnum {
  // 存在
  NORMAL = '0',
  // 删除
  DELETE = '1',
}

/**
 * 数据状态: 0正常,1停用
 */
export enum StatusEnum {
  // 正常
  NORMAL = '0',
  // 停用
  STOP = '1',
}

/**
 * 性别: 0男,1女
 */
export enum SexEnum {
  // 男
  MAN = '0',
  // 女
  WOMAN = '1',
}
```
#### 封装导出函数
新建文件`@/src/service/common/downloadExcel.ts`，如下;

```javascript
import { Provide, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import * as ExcelJS from 'exceljs';
import { StatusEnum, SexEnum, DelFlagEnum } from "@utils/enum";
import * as _ from 'lodash';

/**
 * 通用枚举映射配置
 */
export const commonExportMap = {
  status: {
    [StatusEnum.NORMAL]: '正常',
    [StatusEnum.STOP]: '停用',
  },
  sex: {
    [SexEnum.MAN]: '男',
    [SexEnum.WOMAN]: '女',
  },
  delFlag: {
    [DelFlagEnum.NORMAL]: '正常',
    [DelFlagEnum.DELETE]: '已删除',
  },
};

@Provide()
export class DownloadExcelService {
  @Inject()
  ctx: Context;

  /**
  * 导出excel文件，多表头的暂不考虑
   * @params options<Object>: {
   *   headers: [{}] // 表头
   *   data: [] // 数据
   *   dictMap?: {} // 字典映射
   *   sheetName?: string // sheet名称
   * }
  * */
  async downloadExcel(
    options: {
      headers: any[],
      data: any[],
      dictMap?: any,
      sheetName?: string,
    }
  ) {
    let data = options.data;
    // const dictMap = { ...commonExportMap, ...options.dictMap };
    const sheetName = options.sheetName || 'Sheet1';
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet(sheetName);

    // 添加表头
    worksheet.columns = options.headers.map((column) => {
      const width = column.width;
      return {
        header: column.label,
        key: column.prop,
        width: isNaN(width) ? 16 : width,
      };
    });

    const dictMap = { ...commonExportMap, ...options.dictMap };

    // 数据过滤+排序
    data = data.map((item) => {
      const newItem = {};
      options.headers.forEach((field) => {
        const dataIndex = field.prop;
        const dataValue = _.get(item, dataIndex);
        if (dictMap && dictMap[dataIndex]) {
          newItem[dataIndex] = dictMap[dataIndex][dataValue] !== undefined ? dictMap[dataIndex][dataValue] : dataValue;
        } else {
          newItem[dataIndex] = dataValue;
        }
      });
      return newItem;
    });

    // 定义表头样式
    const headerStyle: any = {
      font: {
        size: 10,
        bold: true,
        color: { argb: 'ffffff' },
      },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '808080' },
      },
      border: {
        top: { style: 'thin', color: { argb: '9e9e9e' } },
        left: { style: 'thin', color: { argb: '9e9e9e' } },
        bottom: { style: 'thin', color: { argb: '9e9e9e' } },
        right: { style: 'thin', color: { argb: '9e9e9e' } },
      },
    };

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // 添加数据
    data.forEach((item) => {
      worksheet.addRow(item);
    });

    worksheet.columns.forEach((column) => {
      column.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    this.ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // 这个地方的空格不要更改
    this.ctx.set('Content-Disposition', "attachment;filename*=UTF-8' '" + encodeURIComponent(sheetName) + '.xlsx');
    // this.ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
    return await workbook.xlsx.writeBuffer()
  }
}
```
#### 修改`user.service.ts`

```javascript
import { DownloadExcelService } from "@service/common/downloadExcel";
import { resBuild } from "@utils/resBuild";

@Provide()
export class UserService {
  @Inject()
  downloadExcelService: DownloadExcelService;

	
  // 导出
  async export(queryParams: ListUserDTO) {
    // 默认导出全部，去掉分页参数
    delete queryParams.pageNum;
    delete queryParams.pageSize;
    let headers = [
      { label: "用户编号", prop: "userId", },
      { label: "用户名称", prop: "userName", },
      { label: "用户昵称", prop: "nickName", },
      { label: "部门", prop: "dept.deptName", },
      { label: "手机号码", prop: "phonenumber", },
      { label: "状态", prop: "status", },
      { label: "创建时间", prop: "createTime", width: 25 },
    ];
    const { rows } = await this.list(queryParams)
    return this.downloadExcelService.downloadExcel({
      headers: headers,
      data: rows,
      sheetName: '用户信息',
    });
  }
}
```
测试一下，导出成功，默认导出全部，也能按条件导出了：
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/4c59e369c2c747ca9a18ec808b16d3d0.png)
