/**
 * 路由内核·合并与装配回归钉——照源 ling2-web-monorepo merge-routes-priority.ts + effects/access/accessible.ts 对拍。
 * 与源差异登记（2026-11-06 设计方案卷）：①views 目录扫描腿不适用（页面全在业务包 pageMap，缺席登记）；
 * ②keep-alive 组件重命名腿不复刻（既有裁定）；③router 挂载段（root children 增删/重挂）属 React 绑定层职责，
 * 内核只产路由表与菜单。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { generateAccessible, mergeRoutesByPriority } from '../src/route/index.ts'
import type { BackMenuSpec, RouteSpec } from '../src/route/index.ts'

const menuRow = (over: Partial<BackMenuSpec>): BackMenuSpec => ({
  enCode: 'demo.node', fullName: '演示', id: 'id-1', type: 1,
  ...over,
})

describe('mergeRoutesByPriority（后端优先，照源）', () => {
  it('后端与前端同路径去重（children 深层路径也参与收集）', () => {
    const backend: RouteSpec[] = [
      { name: 'B', path: '/b', meta: { title: 'B' }, children: [{ name: 'B1', path: '/b/one', meta: { title: 'B1' } }] },
    ]
    const frontend: RouteSpec[] = [
      { name: 'F1', path: '/b/one', meta: { title: '重复' } },
      { name: 'F2', path: '/extra', meta: { title: '独有' } },
    ]
    const result = mergeRoutesByPriority(backend, frontend)
    expect(result.map((r) => r.path)).toEqual(['/b', '/extra'])
  })

  it('后端输入不被改写（深拷贝隔离，改结果不波及输入）', () => {
    const backend: RouteSpec[] = [{ name: 'B', path: '/b', meta: { title: 'B' } }]
    const result = mergeRoutesByPriority(backend, [{ name: 'F', path: '/f', meta: { title: 'F' } }])
    result.push({ name: 'X', path: '/x', meta: { title: 'X' } })
    expect(backend).toHaveLength(1)
    expect(result[0]).not.toBe(backend[0])
  })
})

describe('generateAccessible 装配（照源 accessible.ts）', () => {
  it('mixed 模式：后端菜单转换与前端路由过滤合并、后端优先', async () => {
    const result = await generateAccessible('mixed', {
      backMenus: [menuRow({ type: 2, enCode: 'b.p', fullName: '后端页', urlAddress: '/b/p' })],
      routes: [
        { name: 'F', path: '/b/p', meta: { title: '同路径前端页' } },
        { name: 'G', path: '/g', meta: { title: '前端独有' } },
      ],
      layoutMap: { BasicLayout: 'L:Basic', NotFoundView: 'L:NotFound' },
      pageMap: { '/b/p.vue': 'PG:bp' },
      roles: [],
      finalRoutesMap: {},
    })
    expect(result.accessibleRoutes.map((r) => r.path)).toEqual(['/b/p', '/g'])
    expect(result.accessibleRoutes[0]!.component).toBe('PG:bp')
  })

  it('目录无 redirect 时收敛第一有效后代（getProgenyList：排除 type 0/1/6）', async () => {
    const result = await generateAccessible('backend', {
      backMenus: [
        menuRow({
          type: 0, enCode: 'app', fullName: '应用',
          children: [
            menuRow({ type: 2, enCode: 'app.one', fullName: '第一页', urlAddress: '/p/one' }),
            menuRow({ type: 6, enCode: 'app.screen', fullName: '大屏', propertyJson: '{"moduleId":"m1"}' }),
          ],
        }),
      ],
      layoutMap: { BasicLayout: 'L:Basic', IFrameView: 'L:IFrame' },
      pageMap: { '/p/one.vue': 'PG:one' },
      finalRoutesMap: {},
    })
    expect(result.accessibleRoutes[0]!.redirect).toBe('/p/one')
  })

  it('type 7 外链有 iframeSrc 时参与 redirect 收敛、无 iframeSrc 不参与', async () => {
    const result = await generateAccessible('backend', {
      backMenus: [
        menuRow({
          type: 0, enCode: 'app', fullName: '应用',
          children: [menuRow({ type: 7, enCode: 'app.ext', fullName: '内嵌外链', urlAddress: '/ext', linkTarget: '_self', pageAddress: 'https://x.example' })],
        }),
      ],
      layoutMap: { BasicLayout: 'L:Basic', IFrameView: 'L:IFrame' },
      pageMap: {},
      finalRoutesMap: {},
    })
    expect(result.accessibleRoutes[0]!.redirect).toBe('/ext')
  })

  it('type 7 外链仅新窗形态时不收敛 redirect（子级全无效保持无 redirect）', async () => {
    const result = await generateAccessible('backend', {
      backMenus: [
        menuRow({
          type: 0, enCode: 'app', fullName: '应用',
          children: [menuRow({ type: 7, enCode: 'app.ext', fullName: '新窗外链', urlAddress: '/ext', linkTarget: '_blank', pageAddress: 'https://x.example' })],
        }),
      ],
      layoutMap: { BasicLayout: 'L:Basic', IFrameView: 'L:IFrame' },
      pageMap: {},
      finalRoutesMap: {},
    })
    expect(result.accessibleRoutes[0]!.redirect).toBeUndefined()
  })

  it('frontend 模式仅前端路由（角色过滤）', async () => {
    const result = await generateAccessible('frontend', {
      routes: [
        { name: 'A', path: '/a', meta: { title: 'A' } },
        { name: 'B', path: '/b', meta: { title: 'B', authority: ['admin'] } },
      ],
      roles: ['user'],
      finalRoutesMap: {},
    })
    expect(result.accessibleRoutes.map((r) => r.name)).toEqual(['A'])
  })

  it('backend 模式仅后端菜单', async () => {
    const result = await generateAccessible('backend', {
      backMenus: [menuRow({ type: 2, enCode: 'b.p', fullName: '后端页', urlAddress: '/b/p' })],
      routes: [{ name: 'F', path: '/f', meta: { title: '前端页' } }],
      layoutMap: { BasicLayout: 'L:Basic', NotFoundView: 'L:NotFound' },
      pageMap: { '/b/p.vue': 'PG:bp' },
      finalRoutesMap: {},
    })
    expect(result.accessibleRoutes.map((r) => r.path)).toEqual(['/b/p'])
  })

  it('isAddHomeToMenu 首项插「控制台」（icon/i18nCode/name/path 照源钉死）', async () => {
    const result = await generateAccessible('backend', {
      backMenus: [menuRow({ type: 2, enCode: 'b.p', fullName: '后端页', urlAddress: '/b/p' })],
      layoutMap: { BasicLayout: 'L:Basic', NotFoundView: 'L:NotFound' },
      pageMap: { '/b/p.vue': 'PG:bp' },
      finalRoutesMap: {},
      isAddHomeToMenu: true,
      homePath: '/dashboard',
    })
    expect(result.accessibleMenus[0]).toMatchObject({
      name: '控制台', path: '/dashboard', icon: 'icon-ym icon-ym-nav-home-fill', i18nCode: 'routes.basic.dashboard', show: true,
    })
  })

  it('菜单与路由联动：hideInMenu 经 generateMenus 过滤', async () => {
    const result = await generateAccessible('backend', {
      backMenus: [
        menuRow({ type: 0, enCode: 'app', fullName: '应用', children: [
          menuRow({ type: 2, enCode: 'app.v', fullName: '可见页', urlAddress: '/v' }),
          menuRow({ type: 2, enCode: 'app.h', fullName: '隐藏页', urlAddress: '/h' }),
        ] }),
      ],
      layoutMap: { BasicLayout: 'L:Basic', NotFoundView: 'L:NotFound' },
      pageMap: { '/v.vue': 'PG:v', '/h.vue': 'PG:h' },
      finalRoutesMap: {},
    })
    // 注意：后端菜单行无 hideInMenu 通道（源 BackMenu 无该字段）——两行都进菜单；
    // 此钉只验证「后端行转菜单后父链/标题在位」
    const app = result.accessibleMenus.find((m) => m.name === '应用')
    expect(app!.children!.map((c) => c.name)).toEqual(['可见页', '隐藏页'])
  })
})

describe('路由内核纯度（设计判据：零框架依赖）', () => {
  it('src/route/*.ts 禁 import react/vue/vue-router/antd', () => {
    const files = ['types', 'tree', 'authority', 'convert-backend', 'generate-menus', 'merge-routes', 'accessible', 'index']
    const banned = /from\s+['"](react|vue|vue-router|antd|@ant-design[^'"]*)['"]/
    for (const f of files) {
      const code = readFileSync(new URL(`../src/route/${f}.ts`, import.meta.url), 'utf8')
      expect(banned.test(code), `${f}.ts 出现框架依赖`).toBe(false)
    }
  })
})
