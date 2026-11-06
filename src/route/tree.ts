/**
 * 树工具——照源 ling2-web-monorepo @vben-core/shared/utils/tree.ts 的 mapTree/filterTree 逐行为移植。
 * 语义钉：mapTree 父节点映射后再对 mapperNode.children 递归映射（convertRoutes 靠这一点把手工挂上的
 * 原始子菜单行转换成路由）；filterTree 为原地变异且父节点过滤失败不再下钻（整棵子树剔除）。
 */
import type { RouteSpec } from './types.ts'

/** 按条件重映射树节点：父映射→children 若在位则递归映射（照源 mapTree） */
export function mapTree<T, V>(tree: T[], mapper: (node: T) => V): V[] {
  return tree.map((node) => {
    const mapperNode = mapper(node) as Record<string, unknown>
    const children = mapperNode['children']
    if (children) {
      mapperNode['children'] = mapTree(children as T[], mapper)
    }
    return mapperNode as V
  })
}

/** 按条件过滤树节点（原地变异，照源 filterTree）：节点过筛→children 递归过滤后回写；不过筛连子树整支剔除 */
export function filterTree<T>(tree: T[], filter: (node: T) => boolean): T[] {
  const walk = (nodes: T[]): T[] =>
    nodes.filter((node) => {
      if (filter(node)) {
        const holder = node as Record<string, unknown>
        const children = holder['children'] as T[] | undefined
        if (children) {
          holder['children'] = walk(children)
        }
        return true
      }
      return false
    })
  return walk(tree)
}

/** 路由规格深拷贝（逐节点展开、children 递归；component/meta 引用保留——内核管线不变异这两位） */
export function cloneSpecRoutes(routes: RouteSpec[]): RouteSpec[] {
  return routes.map((route) => ({
    ...route,
    children: route.children ? cloneSpecRoutes(route.children) : undefined,
  }))
}
