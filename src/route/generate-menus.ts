/**
 * 菜单生成器——照源 ling2-web-monorepo packages/utils/src/helpers/generate-menus.ts 逐行为移植。
 * 与源差异（写法层）：源第一参为 vue-router Router 实例（取 getRoutes() 建 name→path 映射）——
 * 本内核零路由器依赖，改为 finalRoutesMap 参数由绑定层构建传入，语义等价。
 * 行为钉：父链回填靠「父映射时先把 parent/parents 写到原始子路由、mapTree 递归随后读取」的原地变异链，
 * 与源同款次序，勿改为两趟遍历（次序变了深层 parent 链会断）。
 */
import { filterTree, mapTree } from './tree.ts'
import type { MenuRecordSpec, RouteMetaSpec, RouteSpec } from './types.ts'

/** 路由→菜单（照源 11-63）：hideInMenu 过滤、hideChildrenInMenu 子级置空、resultPath=redirect‖link‖path */
export function generateMenus(routes: RouteSpec[], finalRoutesMap: Record<string, string> = {}): MenuRecordSpec[] {
  const menus = mapTree(routes, (route) => {
    // 最终路径优先取最终路由表快照（对位源 finalRoutesMap[route.name]）
    const path = finalRoutesMap[route.name as string] ?? route.path ?? ''
    const { meta = {} as RouteMetaSpec, name: routeName, redirect, children = [] } = route
    const { activeIcon, badge, badgeType, badgeVariants, hideChildrenInMenu = false, icon, link, order, title = '', i18nCode = '', type } = meta
    const name = (title || routeName || '') as string
    // hideChildrenInMenu=子级在菜单整段不展现（children 置空、path 取 redirect 兜底）
    const resultChildren = hideChildrenInMenu ? [] : ((children as unknown as MenuRecordSpec[]) ?? [])
    if (resultChildren.length > 0) {
      resultChildren.forEach((child) => {
        child.parents = [...(route.parents ?? []), path]
        child.parent = path
      })
    }
    const resultPath = hideChildrenInMenu ? redirect || path : link || path
    return {
      type,
      i18nCode,
      activeIcon,
      badge,
      badgeType,
      badgeVariants,
      icon,
      name,
      order,
      parent: route.parent,
      parents: route.parents,
      path: resultPath,
      show: !meta.hideInMenu,
      children: resultChildren,
    }
  })
  return filterTree(menus, (menu) => !!menu.show)
}
