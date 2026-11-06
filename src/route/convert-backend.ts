/**
 * 后端菜单转换器——照源 ling2-web-monorepo packages/utils/src/helpers/generate-routes-backend.ts 逐行为移植。
 * 菜单行类型：0 应用/1 目录/2 页面/3 表单/4 字典/5 旧报表/6 大屏/7 外链/8 门户/9 流程/10 新报表/11 回传表单。
 * 行为钉：①顶层先把每行 component 预置 'BasicLayout' 字串（原地变异输入，照源保留）——目录分支据此查
 * layoutMap['BasicLayout']，深层行不受预置波及；②type 12 等未登记类型无分支=穿透（path 缺席）——AMIS
 * 出范围裁定的实现落点；③type 3/4/5/8/9/10 源用 createCustomComponent+defineAsyncComponent 做 Vue
 * 命名异步包装（keep-alive 组件命名需求，keepAlive 已裁不复刻）——本内核只查表透传，渲染对象同款。
 * 查询串解析与源同款走 qs（依赖单源，勿改手写解析）。
 */
import qs from 'qs'
import { mapTree } from './tree.ts'
import type { BackMenuSpec, ComponentMap, GenerateAccessOptions, RouteSpec } from './types.ts'

/** 后端菜单→路由规格（照源 generateRoutesByBackend 15-37）：pageMap 键先归一化再查表 */
export async function generateRoutesByBackend(options: GenerateAccessOptions): Promise<RouteSpec[]> {
  const { layoutMap = {}, pageMap = {}, backMenus = [] } = options
  const menuRoutes = backMenus
  if (!menuRoutes) {
    return []
  }
  const normalizePageMap: ComponentMap = {}
  for (const [key, value] of Object.entries(pageMap)) {
    normalizePageMap[normalizeViewPath(key)] = value
  }
  return convertRoutes(menuRoutes, layoutMap, normalizePageMap, options.globSetting, options.token, options.appEnCode, options.appPrefix)
}

/** 逐菜单行转换（照源 convertRoutes 39-144）；globalSetting/token/appEnCode/appPrefix 仅大屏与外链分支消费 */
function convertRoutes(
  routes: BackMenuSpec[],
  layoutMap: ComponentMap,
  pageMap: ComponentMap,
  globSetting?: { dataVUrl?: string },
  token?: string,
  appEnCode?: string,
  appPrefix?: string,
): RouteSpec[] {
  // 照源：顶层行 component 预置 'BasicLayout' 字串（目录分支随后查表解析）
  for (const route of routes) {
    route.component = 'BasicLayout'
  }
  return mapTree(routes, (node: BackMenuSpec) => {
    const name = getRouteName(node.enCode ?? '')
    const route: RouteSpec = {
      name,
      meta: {
        icon: node.icon,
        title: node.fullName ?? '',
        i18nCode: `routes.${(node.enCode ?? '').replaceAll('.', '-')}`,
        modelId: node.id,
        type: node.type,
      },
    }
    // 应用/目录：path=enCode 点转斜杠；显式 component 查 layoutMap；children 手工挂原始行、由 mapTree 递归转换
    if (node.type == 0 || node.type == 1) {
      route.path = `/${(node.enCode ?? '').replaceAll('.', '/')}`
      if (node.component) route.component = layoutMap[node.component as string]
      if (node.children?.length) route.children = node.children as unknown as RouteSpec[]
    }
    // 确保路径以 '/' 开头；'?' 后串分离经 qs 解析进 meta.query（照源 71-81）
    const urlAddress = node.urlAddress && node.urlAddress.startsWith('/') ? node.urlAddress : `/${node.urlAddress}`
    let routePath = urlAddress
    let query: Record<string, unknown> = {}
    if (urlAddress.includes('?')) {
      routePath = urlAddress.split('?')[0] as string
      try {
        if (urlAddress.split('?')[1]) {
          query = qs.parse(urlAddress.split('?')[1] as string) as Record<string, unknown>
        }
      } catch {}
    }
    // 页面/回传表单（照源 83-87）
    if ([2, 11].includes(node.type as number)) {
      route.path = routePath
      route.meta.query = query
      route.component = dynamicImport(node.pageAddress ?? node.urlAddress ?? '', layoutMap, pageMap)
    }
    // 在线功能：表单/字典/旧报表/门户/流程/新报表（照源 89-115）
    if ([3, 4, 5, 8, 9, 10].includes(node.type as number)) {
      let component = ''
      let isTree = 0
      const propertyJson = node.propertyJson ? JSON.parse(node.propertyJson) : null
      let relationId: string = ''
      if (propertyJson) {
        relationId = (propertyJson as { moduleId?: string }).moduleId || ''
        isTree = (propertyJson as { isTree?: number }).isTree || 0
      }
      if (node.type == 3 || node.type == 9) {
        component = 'OnlineModel'
      } else if (node.type == 4) {
        component = 'OnlineDict'
      } else if (node.type == 5) {
        component = 'OnlineDataReport'
      } else if (node.type == 10) {
        component = 'OnlineReport'
      } else {
        component = 'OnlinePortal'
      }
      route.path = routePath
      route.meta.query = query
      route.name = component + name
      route.component = layoutMap[`${component}View`]
      route.meta.relationId = relationId
      route.meta.isTree = isTree
    }
    // 大屏（照源 117-124）：meta.link=dataVUrl+[appPrefix+appEnCode/]view/moduleId?token=；path=enCode 点转斜杠
    if (node.type == 6) {
      let moduleId = ''
      const propertyJson = node.propertyJson ? JSON.parse(node.propertyJson) : null
      if (propertyJson) moduleId = (propertyJson as { moduleId?: string }).moduleId || ''
      route.meta.link = `${globSetting?.dataVUrl || ''}${appEnCode ? `${appPrefix}${appEnCode}/` : ''}view/${moduleId}?token=${token || ''}`
      route.path = `/${(node.enCode ?? '').replaceAll('.', '/')}`
      route.component = layoutMap.IFrameView
    }
    // 外链（照源 126-140）：占位符替换；_self=iframeSrc 内嵌、否则 meta.link 新窗且 route.path=外链地址
    if (node.type == 7) {
      route.path = routePath
      route.meta.query = query
      route.component = layoutMap.IFrameView
      const path = (node.pageAddress ?? '')
        .replaceAll('${dataV}', (globSetting?.dataVUrl || '') + (appEnCode ? `${appPrefix}${appEnCode}/` : ''))
        .replaceAll('${ling2Token}', token || '')
        .replaceAll('${ling2AppCode}', appEnCode || '')
      if (node.linkTarget === '_self') {
        route.meta.iframeSrc = path
      } else {
        route.meta.link = path
        route.path = path
      }
    }
    return route
  })
}

/** 页面组件查表（照源 146-156）：精确 .vue → 目录 index.vue → 兜底 layoutMap.NotFoundView */
function dynamicImport(path: string, layoutMap: ComponentMap, pageMap: ComponentMap): unknown {
  const normalizePath = normalizeViewPath(path)
  let component = pageMap[normalizePath.endsWith('.vue') ? normalizePath : `${normalizePath}.vue`]
  if (!component) {
    component = pageMap[`${normalizePath}/index.vue`]
  }
  if (!component) {
    component = layoutMap.NotFoundView
  }
  return component
}

/** 页面地址归一化（照源 158-167）：去相对前缀、补根斜杠、剔 /views 前缀 */
function normalizeViewPath(path: string): string {
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '')
  const viewPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
  return viewPath.replace(/^\/views/, '')
}

/** 路由名（照源 186-192）：enCode 点段首字母大写后拼接 */
function getRouteName(name: string): string {
  return name
    .split('.')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
