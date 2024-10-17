import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "阿瑞博客",
  description: "个人网站，学习测试用",
  cleanUrls: true, // 简介URL，省略结尾的 .html
  lastUpdated: true, // 最后更新时间

  head: [
      ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '配置项', link: '/api-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: '配置项', link: '/api-examples' },
          {
            text: '若依Nodejs全栈',
            collapsed: false,
            items: [
              { text: '在线预览', link: '/views/ruoyi/article6' },
              { text: '初始化', link: '/views/ruoyi/article1' },
              { text: '登录接口', link: '/views/ruoyi/article2' },
              { text: '用户信息和路由', link: '/views/ruoyi/article3' },
              { text: '用户增删改查', link: '/views/ruoyi/article4' },
              { text: '导出Excel', link: '/views/ruoyi/article5' },
            ]
          },
          {
            text: 'Electron仿微信',
            collapsed: false,
            items: [
              { text: '高度还原微信', link: '/views/electron/article1' },
              { text: '联动关闭子窗口', link: '/views/electron/article2' },
              { text: '新建贴合窗口', link: '/views/electron/article3' },
              { text: '新开窗口', link: '/views/electron/article5' },
              { text: '置顶、最大化、最小化', link: '/views/electron/article6' },
            ]
          },
          { text: '关于作者', link: '/views/about/author' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://gitee.com/ruirui-study', ariaLabel: '码云' }
    ],

    // 是否在 markdown 中的外部链接旁显示外部链接图标。
    externalLinkIcon: true,

    // 页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-2024 Yan Rui'
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新时间',
      // formatOptions: {
      //   dateStyle: 'full',
      //   timeStyle: 'medium'
      // }
    },

    // 上一页、下一页
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    outline: {
      label: '导航目录'
    }
  }
})
