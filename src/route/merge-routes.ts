/**
 * 路由合并——照源 ling2-web-monorepo packages/utils/src/helpers/merge-routes-priority.ts 逐行为移植。
 * 语义钉：后端路由优先（后端全路径集去重）；前端路由一律扁平追加为顶级（源注释明确不再挂子级——
 * 父路由可能没有渲染位，Vue/React Router 均支持根级注册完整路径路由）。源第三参 backendMenus 未消费，省略。
 */
import { cloneSpecRoutes } from './tree.ts'
import type { RouteSpec } from './types.ts'

/** 合并路由：后端结构原样保留（深拷贝隔离），前端去重后扁平追加顶级 */
export function mergeRoutesByPriority(backendRoutes: RouteSpec[], frontendRoutes: RouteSpec[]): RouteSpec[] {
  const backendPaths = collectRoutePaths(backendRoutes)
  const result = cloneSpecRoutes(backendRoutes)
  for (const frontendRoute of frontendRoutes) {
    const normalizedPath = normalizePath(frontendRoute.path ?? '')
    if (normalizedPath && backendPaths.has(normalizedPath)) {
      continue
    }
    result.push(frontendRoute)
  }
  return result
}

/** 从后端路由收集全路径集（含 children 深层，用于前端去重） */
function collectRoutePaths(routes: RouteSpec[]): Set<string> {
  const paths = new Set<string>()
  function collect(route: RouteSpec) {
    const normalizedPath = normalizePath(route.path ?? '')
    if (normalizedPath) {
      paths.add(normalizedPath)
    }
    if (route.children && route.children.length > 0) {
      for (const child of route.children) {
        collect(child)
      }
    }
  }
  for (const route of routes) {
    collect(route)
  }
  return paths
}

/** 路径归一化（照源 90-111）：去相对前缀、去 views 前缀、去 .vue 后缀、补根斜杠；空返 null */
function normalizePath(path: string): string | null {
  if (!path) return null
  let normalizedPath = path
  normalizedPath = normalizedPath.replace(/^(\.\/|\.\.\/)+/, '')
  normalizedPath = normalizedPath.replace(/^views\//, '')
  normalizedPath = normalizedPath.replace(/^\/views/, '')
  normalizedPath = normalizedPath.replace(/\.vue$/, '')
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath
  }
  return normalizedPath || null
}
