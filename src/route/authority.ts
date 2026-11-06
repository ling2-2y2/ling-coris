/**
 * 前端路由权限过滤——照源 ling2-web-monorepo packages/utils/src/helpers/generate-routes-frontend.ts 逐行为移植。
 * 行为钉（2026-11-06 设计方案卷）：hasAuthority 对 authority:[]（空数组）=拒绝访问（源代码 ![] 为 false
 * 不走早退），与《菜单路由设计和使用规范.md》宣称「空数组=允许」相反——以源代码为准。
 */
import { filterTree, mapTree } from './tree.ts'
import type { RouteSpec } from './types.ts'

/**
 * 判断路由是否有权限访问（照源 36-44）：无 meta.authority=true；
 * 有则角色交集判定；无交集但 menuVisibleWithForbidden=true 时仍放行（菜单可见、访问换 403）。
 */
export function hasAuthority(route: RouteSpec, access: string[]): boolean {
  const authority = route.meta?.authority
  if (!authority) {
    return true
  }
  const canAccess = access.some((value) => authority.includes(value))
  return canAccess || (!canAccess && menuHasVisibleWithForbidden(route))
}

/** 判断路由是否「菜单可见但访问换 403」（照源 50-52）：authority 在位+menuVisibleWithForbidden 显式 true */
function menuHasVisibleWithForbidden(route: RouteSpec): boolean {
  return !!route.meta?.authority && Reflect.has(route.meta || {}, 'menuVisibleWithForbidden') && !!route.meta?.menuVisibleWithForbidden
}

/**
 * 前端路由生成（照源 8-29）：按角色过滤路由树；传 forbiddenComponent 时把
 * menuVisibleWithForbidden 路由的组件替换为 403 组件。
 */
export function generateRoutesByFrontend(routes: RouteSpec[], roles: string[], forbiddenComponent?: unknown): RouteSpec[] {
  const finalRoutes = filterTree(routes, (route) => hasAuthority(route, roles))
  if (!forbiddenComponent) {
    return finalRoutes
  }
  return mapTree(finalRoutes, (route) => {
    if (menuHasVisibleWithForbidden(route)) {
      route.component = forbiddenComponent
    }
    return route
  })
}
