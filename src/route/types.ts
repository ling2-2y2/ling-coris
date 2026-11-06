/**
 * 路由内核类型——照源 ling2-web-monorepo @core/base/typings（menu-record.ts 的 BackMenu/MenuRecordRaw、
 * vue-router.d.ts 的 RouteMeta）逐字段对位移植。内核零框架零浏览器依赖：组件位一律 unknown 透传，
 * 组件形态（React 组件/字符串键）由消费方绑定层解释。
 * 前端路由权限复刻方案卷=.project/MERGE/前端路由权限复刻-设计方案-2026-11-06.md（裁定 R1~R5）。
 */

/** 组件映射表：内核不感知组件形态，仅做查表透传（对位源 ComponentRecordType） */
export type ComponentMap = Record<string, unknown>

/** 路由生成模式（对位源 AccessModeType）：frontend=纯前端路由表 / backend=纯后端菜单 / mixed=合并 */
export type AccessModeType = 'frontend' | 'backend' | 'mixed'

/** 路由元信息——照源 RouteMeta 全字段族；modelId/relationId/isTree 三位为源 convertRoutes 附加写入（源经 route:any 旁路，此处显式入型）。
 * keepAlive 字段照源进类型但运行时不复刻（既有裁定，2026-11-06 卡裁确认维持）。 */
export interface RouteMetaSpec {
  /** 激活图标（菜单/页签） */
  activeIcon?: string
  /** 当前激活的菜单路径（不想激活现有菜单、激活父级时用） */
  activePath?: string
  /** 固定页签 */
  affixTab?: boolean
  /** 固定页签顺序 */
  affixTabOrder?: number
  /** 需要的角色标识才可访问；注意空数组=拒绝（源代码行为，与使用规范文档宣称相反） */
  authority?: string[]
  /** 徽标文案 */
  badge?: string
  /** 徽标类型 */
  badgeType?: 'dot' | 'normal'
  /** 徽标颜色 */
  badgeVariants?: string
  /** 路由完整路径作 key（缺省 true） */
  fullPathKey?: boolean
  /** 子级在菜单中不展现 */
  hideChildrenInMenu?: boolean
  /** 在面包屑中不展现 */
  hideInBreadcrumb?: boolean
  /** 在菜单中不展现 */
  hideInMenu?: boolean
  /** 在页签中不展现 */
  hideInTab?: boolean
  /** 翻译标识 */
  i18nCode?: string
  /** 图标名 */
  icon?: string
  /** iframe 内嵌地址 */
  iframeSrc?: string
  /** 忽略登录门直接可访问 */
  ignoreAccess?: boolean
  /** keep-alive 缓存位（类型照源、运行时不复刻——既有裁定） */
  keepAlive?: boolean
  /** 外链新窗地址 */
  link?: string
  /** 路由是否已加载过 */
  loaded?: boolean
  /** 页签最大打开数量 */
  maxNumOfOpenTab?: number
  /** 菜单可见但访问重定向 403 */
  menuVisibleWithForbidden?: boolean
  /** 禁用缓存（AMIS 等切页即销毁场景） */
  noCache?: boolean
  /** 不用基础布局（仅顶级生效） */
  noBasicLayout?: boolean
  /** 新窗口打开 */
  openInNewWindow?: boolean
  /** 路由→菜单排序号 */
  order?: number
  /** 菜单携带参数（urlAddress ? 后串经 qs 解析落此） */
  query?: Record<string, unknown>
  /** 标题（菜单/页签文案） */
  title: string
  /** 菜单行类型（0 应用/1 目录/2 页面/3 表单/4 字典/5 旧报表/6 大屏/7 外链/8 门户/9 流程/10 新报表/11 回传表单） */
  type?: number
  /** 源 convertRoutes 附加位：菜单行 id */
  modelId?: string
  /** 源 convertRoutes 附加位：在线功能关联模块 id（propertyJson.moduleId） */
  relationId?: string
  /** 源 convertRoutes 附加位：是否树形（propertyJson.isTree） */
  isTree?: number
}

/** 路由规格（对位源 RouteRecordRaw + ExRouteRecordRaw 的 parent/parents 回填位）；component 为 unknown 透传 */
export interface RouteSpec {
  name?: string | number
  path?: string
  component?: unknown
  redirect?: string
  meta: RouteMetaSpec
  children?: RouteSpec[]
  /** 菜单生成时回填的父级路径 */
  parent?: string
  /** 菜单生成时回填的全父链 */
  parents?: string[]
}

/** 后端菜单行——照源 menu-record.ts:88-104 BackMenu 逐字段对位；实际下发可能缺列，除逻辑必用字段外放宽可选 */
export interface BackMenuSpec {
  children?: BackMenuSpec[]
  component?: unknown
  enCode?: string
  fullName?: string
  hasChildren?: boolean
  icon?: string
  id?: string
  linkTarget?: string
  pageAddress?: string
  parentId?: string
  path?: string
  propertyJson?: string
  sortCode?: number
  type?: number
  urlAddress?: string
}

/** 菜单节点（照源 MenuRecordRaw）——generateMenus 产物，壳侧导航/侧栏消费 */
export interface MenuRecordSpec {
  activeIcon?: string
  badge?: string
  badgeType?: 'dot' | 'normal'
  badgeVariants?: string
  children?: MenuRecordSpec[]
  disabled?: boolean
  /** 翻译后菜单名（title 兜底路由名） */
  fullName?: string
  i18nCode?: string
  icon?: string
  /** 菜单名（title 兜底路由名） */
  name: string
  order?: number
  parent?: string
  parents?: string[]
  /** 菜单路径（hideChildrenInMenu=redirect‖path；否则 link‖path） */
  path: string
  /** 是否显示（=!meta.hideInMenu，生成后统一过滤） */
  show?: boolean
  type?: number
}

/** 装配入参——对位源 GenerateMenuAndRoutesOptions；router 位改为 finalRoutesMap（内核零路由器依赖，绑定层构建传入） */
export interface GenerateAccessOptions {
  /** 前端路由模块（对位源 routes；frontend/mixed 模式消费） */
  routes?: RouteSpec[]
  /** 后端菜单树（backend/mixed 模式消费） */
  backMenus?: BackMenuSpec[]
  /** 页面组件映射：页面地址→组件（type 2/11 渲染承载） */
  pageMap?: ComponentMap
  /** 布局组件映射：BasicLayout/IFrameView/NotFoundView/Online*View 等 */
  layoutMap?: ComponentMap
  /** 角色集（frontend 模式 hasAuthority 判定输入） */
  roles?: string[]
  /** 403 组件（frontend 模式 menuVisibleWithForbidden 路由组件替换） */
  forbiddenComponent?: unknown
  /** 全局设置（大屏 dataVUrl） */
  globSetting?: { dataVUrl?: string }
  /** 用户 token（大屏/外链占位符替换） */
  token?: string
  /** 应用编码（大屏/外链占位符替换） */
  appEnCode?: string
  /** 应用前缀（大屏/外链占位符替换） */
  appPrefix?: string
  /** 菜单首项插「控制台」 */
  isAddHomeToMenu?: boolean
  /** 控制台路径（对位源 preferences.app.defaultHomePath） */
  homePath?: string
  /** 最终路由 name→path 映射（对位源 router.getRoutes() 快照，由绑定层构建传入） */
  finalRoutesMap?: Record<string, string>
}
