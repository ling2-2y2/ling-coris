/**
 * 路由内核·权限判定回归钉——照源 ling2-web-monorepo packages/utils/src/helpers/generate-routes-frontend.ts 逐行为对拍。
 * 注意：源实现 hasAuthority 对 authority:[]（空数组）的真实行为是「拒绝访问」（`![]` 为 false
 * 不走早退分支，交集判定对空数组 some 恒 false），与《菜单路由设计和使用规范.md》文档宣称
 * 「空数组=允许访问」相反——复刻纪律以源代码为准（2026-11-06 设计方案卷 R2 同批登记），
 * 本 spec 将该行为钉死防漂移。
 */
import { describe, expect, it } from 'vitest'
import { generateRoutesByFrontend, hasAuthority } from '../src/route/index.ts'
import type { RouteSpec } from '../src/route/index.ts'

const route = (meta: RouteSpec['meta'], path = '/p'): RouteSpec => ({ name: 'P', path, meta })

describe('权限判定 hasAuthority（照源 generate-routes-frontend.ts:36-44）', () => {
  it('未设置 authority 的路由任何人可访问', () => {
    expect(hasAuthority(route({ title: 'P' }), [])).toBe(true)
  })

  it('authority 空数组=拒绝访问（源代码行为，与使用规范文档宣称相反，以此钉防漂移）', () => {
    expect(hasAuthority(route({ title: 'P', authority: [] }), ['admin'])).toBe(false)
  })

  it('authority 交集命中任一角色即放行', () => {
    expect(hasAuthority(route({ title: 'P', authority: ['admin', 'dev'] }), ['user', 'dev'])).toBe(true)
  })

  it('authority 无交集=拒绝', () => {
    expect(hasAuthority(route({ title: 'P', authority: ['admin'] }), ['user'])).toBe(false)
  })

  it('无交集但 menuVisibleWithForbidden=true 时放行（菜单可见、访问换 403 组件）', () => {
    expect(hasAuthority(route({ title: 'P', authority: ['admin'], menuVisibleWithForbidden: true }), ['user'])).toBe(true)
  })
})

describe('前端路由生成 generateRoutesByFrontend（照源 8-29）', () => {
  it('无权子路由剔除、有权兄弟保留（filterTree 语义：节点过=留，子级递归过滤）', () => {
    const routes: RouteSpec[] = [
      {
        name: 'Dir', path: '/dir', meta: { title: '目录' },
        children: [
          { name: 'A', path: '/dir/a', meta: { title: 'A', authority: ['admin'] } },
          { name: 'B', path: '/dir/b', meta: { title: 'B', authority: ['user'] } },
          { name: 'C', path: '/dir/c', meta: { title: 'C' } },
        ],
      },
    ]
    const result = generateRoutesByFrontend(routes, ['user'])
    expect(result[0]!.children!.map((r) => r.name)).toEqual(['B', 'C'])
  })

  it('父路由无权=整棵子树剔除（父节点过滤失败不再下钻）', () => {
    const routes: RouteSpec[] = [
      {
        name: 'Dir', path: '/dir', meta: { title: '目录', authority: ['admin'] },
        children: [{ name: 'C', path: '/dir/c', meta: { title: 'C' } }],
      },
    ]
    const result = generateRoutesByFrontend(routes, ['user'])
    expect(result).toHaveLength(0)
  })

  it('forbiddenComponent 替换 menuVisibleWithForbidden 路由的组件', () => {
    const routes: RouteSpec[] = [
      { name: 'F', path: '/f', meta: { title: 'F', authority: ['admin'], menuVisibleWithForbidden: true }, component: 'RealPage' },
    ]
    const result = generateRoutesByFrontend(routes, ['user'], 'Forbidden403')
    expect(result[0]!.component).toBe('Forbidden403')
  })

  it('不传 forbiddenComponent 只过滤不替换组件', () => {
    const routes: RouteSpec[] = [
      { name: 'F', path: '/f', meta: { title: 'F', authority: ['admin'], menuVisibleWithForbidden: true }, component: 'RealPage' },
    ]
    const result = generateRoutesByFrontend(routes, ['user'])
    expect(result[0]!.component).toBe('RealPage')
  })
})
