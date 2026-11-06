/**
 * 路由权限内核出口——前端路由权限复刻（2026-11-06 设计方案卷裁定 R1：底层能力落 ling-coris，与
 * WebServerRouter/vite 底座同仓）。纯逻辑零框架零浏览器依赖（tests/route-merge-accessible.spec.ts
 * 纯度断言钉死）；React 绑定层（守卫/挂载/导航语义）落 ling-common/src/client。
 */
export type {
  AccessModeType,
  BackMenuSpec,
  ComponentMap,
  GenerateAccessOptions,
  MenuRecordSpec,
  RouteMetaSpec,
  RouteSpec,
} from './types.ts'
export type { AccessibleResult } from './accessible.ts'
export { mapTree, filterTree, cloneSpecRoutes } from './tree.ts'
export { hasAuthority, generateRoutesByFrontend } from './authority.ts'
export { generateRoutesByBackend } from './convert-backend.ts'
export { generateMenus } from './generate-menus.ts'
export { mergeRoutesByPriority } from './merge-routes.ts'
export { generateAccessible } from './accessible.ts'
