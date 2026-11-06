/**
 * 路由内核·菜单生成回归钉——照源 ling2-web-monorepo packages/utils/src/helpers/generate-menus.ts 逐行为对拍。
 * finalRoutesMap 参数对位源 router.getRoutes() 的 name→path 快照（由绑定层构建传入，内核零路由器依赖）。
 */
import { describe, expect, it } from 'vitest'
import { generateMenus } from '../src/route/index.ts'
import type { RouteSpec } from '../src/route/index.ts'

describe('菜单生成 generateMenus（照源）', () => {
  it('菜单项 name=title、path 取 finalRoutesMap[name] 兜底 route.path、icon/order 透传', () => {
    const routes: RouteSpec[] = [
      { name: 'Home', path: '/dashboard', meta: { title: '首页', icon: 'i-home', order: 1 } },
    ]
    const menus = generateMenus(routes, { Home: '/home-final' })
    expect(menus).toHaveLength(1)
    expect(menus[0]).toMatchObject({ name: '首页', path: '/home-final', icon: 'i-home', order: 1, show: true })
  })

  it('finalRoutesMap 无命中时回落 route.path', () => {
    const routes: RouteSpec[] = [{ name: 'Home', path: '/dashboard', meta: { title: '首页' } }]
    const menus = generateMenus(routes, {})
    expect(menus[0]!.path).toBe('/dashboard')
  })

  it('hideInMenu 项被过滤（顶层），其余保留', () => {
    const routes: RouteSpec[] = [
      { name: 'A', path: '/a', meta: { title: 'A' } },
      { name: 'B', path: '/b', meta: { title: 'B', hideInMenu: true } },
    ]
    const menus = generateMenus(routes, {})
    expect(menus.map((m) => m.name)).toEqual(['A'])
  })

  it('目录聚合：子级回填 parent/parents 父链', () => {
    const routes: RouteSpec[] = [
      {
        name: 'Dir', path: '/dir', meta: { title: '目录' },
        children: [{ name: 'A', path: '/dir/a', meta: { title: 'A' } }],
      },
    ]
    const menus = generateMenus(routes, {})
    expect(menus[0]!.children![0]!.parent).toBe('/dir')
    expect(menus[0]!.children![0]!.parents).toEqual(['/dir'])
  })

  it('hideChildrenInMenu：children 置空且 path=redirect 兜底', () => {
    const routes: RouteSpec[] = [
      {
        name: 'Dir', path: '/dir', redirect: '/dir/a', meta: { title: '目录', hideChildrenInMenu: true },
        children: [{ name: 'A', path: '/dir/a', meta: { title: 'A' } }],
      },
    ]
    const menus = generateMenus(routes, {})
    expect(menus[0]!.path).toBe('/dir/a')
    expect(menus[0]!.children).toEqual([])
  })

  it('hideChildrenInMenu 无 redirect 时 path=path 本身', () => {
    const routes: RouteSpec[] = [
      {
        name: 'Dir', path: '/dir', meta: { title: '目录', hideChildrenInMenu: true },
        children: [{ name: 'A', path: '/dir/a', meta: { title: 'A' } }],
      },
    ]
    const menus = generateMenus(routes, {})
    expect(menus[0]!.path).toBe('/dir')
  })

  it('meta.link 优先作为菜单路径（外链项）', () => {
    const routes: RouteSpec[] = [
      { name: 'L', path: '/l', meta: { title: '外链', link: 'https://ext.example/x' } },
    ]
    const menus = generateMenus(routes, {})
    expect(menus[0]!.path).toBe('https://ext.example/x')
  })

  it('嵌套 hideInMenu 子级被过滤且父级保留', () => {
    const routes: RouteSpec[] = [
      {
        name: 'Dir', path: '/dir', meta: { title: '目录' },
        children: [
          { name: 'A', path: '/dir/a', meta: { title: 'A' } },
          { name: 'B', path: '/dir/b', meta: { title: 'B', hideInMenu: true } },
        ],
      },
    ]
    const menus = generateMenus(routes, {})
    expect(menus[0]!.children!.map((m) => m.name)).toEqual(['A'])
  })
})
