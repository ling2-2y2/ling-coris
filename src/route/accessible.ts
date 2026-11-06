/**
 * 装配器——照源 ling2-web-monorepo packages/effects/access/src/accessible.ts 移植，职责收窄为「产路由表+菜单」。
 * 与源差异（2026-11-06 设计方案卷裁定，勿回填）：
 * ①router 挂载段（root children 增删/removeRoute+addRoute 重挂）属宿主路由器命令式 API——React 绑定层
 *   用状态驱动 <Routes> 等价实现，内核不做；
 * ②views 目录扫描腿缺席（页面全在业务包 pageMap，无 views 可扫）；
 * ③keep-alive 组件重命名腿不复刻（既有裁定，meta.keepAlive 仅类型层字段）；
 * ④preferences.app.defaultHomePath 改为 options.homePath 由绑定层传入。
 */
import { generateRoutesByBackend } from './convert-backend.ts'
import { generateRoutesByFrontend } from './authority.ts'
import { generateMenus } from './generate-menus.ts'
import { mergeRoutesByPriority } from './merge-routes.ts'
import { cloneSpecRoutes, mapTree } from './tree.ts'
import type { AccessModeType, GenerateAccessOptions, MenuRecordSpec, RouteSpec } from './types.ts'

/** 装配产物：可访问路由表 + 菜单（对位源 { accessibleMenus, accessibleRoutes }） */
export interface AccessibleResult {
  accessibleRoutes: RouteSpec[]
  accessibleMenus: MenuRecordSpec[]
}

/** 三模式装配入口（照源 generateAccessible 10-68）：生成→redirect 收敛→菜单生成→可选「控制台」首项 */
export async function generateAccessible(mode: AccessModeType, options: GenerateAccessOptions): Promise<AccessibleResult> {
  // 照源 13 行：入口先深拷贝前端路由（filterTree 原地变异，防污染调用方）
  const routes = cloneSpecRoutes(options.routes ?? [])
  const accessibleRoutes = await generateRoutes(mode, { ...options, routes })
  const accessibleMenus = generateMenus(accessibleRoutes, options.finalRoutesMap ?? {})
  if (options.isAddHomeToMenu) {
    // 照源 54-66：菜单首项插「控制台」（icon/i18nCode/name 照源钉死）
    const homeItem: MenuRecordSpec = {
      icon: 'icon-ym icon-ym-nav-home-fill',
      i18nCode: 'routes.basic.dashboard',
      name: '控制台',
      order: undefined,
      parent: undefined,
      parents: undefined,
      path: options.homePath ?? '/dashboard',
      show: true,
    }
    accessibleMenus.unshift(homeItem)
  }
  return { accessibleRoutes, accessibleMenus }
}

/** 按模式生成路由（照源 generateRoutes 76-156） */
async function generateRoutes(mode: AccessModeType, options: GenerateAccessOptions): Promise<RouteSpec[]> {
  const { forbiddenComponent, roles, routes = [] } = options
  let resultRoutes: RouteSpec[] = []
  switch (mode) {
    case 'backend': {
      resultRoutes = await generateRoutesByBackend(options)
      break
    }
    case 'frontend': {
      resultRoutes = generateRoutesByFrontend(routes, roles ?? [], forbiddenComponent)
      break
    }
    case 'mixed': {
      // 后端优先合并（views 扫描腿缺席——设计方案卷登记）
      const frontendRoutes = generateRoutesByFrontend(routes, roles ?? [], forbiddenComponent)
      const backendRoutes = await generateRoutesByBackend(options)
      resultRoutes = mergeRoutesByPriority(backendRoutes, frontendRoutes)
      break
    }
  }
  // 路由树后处理（照源 116-153）：对未设 redirect 的目录路由收敛第一有效后代
  resultRoutes = mapTree(resultRoutes, (route) => {
    if (route.redirect || !route.children || route.children.length === 0) {
      return route
    }
    const progenyList = getProgenyList(route.children)
    if (progenyList.length === 0) {
      return route
    }
    const firstChild = progenyList[0]
    // 后代路径非根斜杠开头不处理（需算全父链，照源 146-149）
    if (!firstChild?.path || !firstChild.path.startsWith('/')) {
      return route
    }
    route.redirect = firstChild.path
    return route
  })
  return resultRoutes
}

/** 取参与 redirect 收敛的后代（照源 159-169）：排除 type 0/1/6；type 7 须带 iframeSrc 才算有效落地页 */
function getProgenyList(data: RouteSpec[]): RouteSpec[] {
  const list: RouteSpec[] = []
  mapTree(data, (route: RouteSpec) => {
    const meta = route.meta
    if (![0, 1, 6].includes(meta.type as number) || (meta.type == 7 && meta.iframeSrc)) {
      list.push(route)
    }
    return route
  })
  return list
}
