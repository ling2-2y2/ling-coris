/**
 * 路由内核·后端菜单转换回归钉——照源 ling2-web-monorepo packages/utils/src/helpers/generate-routes-backend.ts 逐类型对拍。
 * 菜单行类型 f_type：0 应用/1 目录/2 页面/3 表单/4 字典/5 旧报表/6 大屏/7 外链/8 门户/9 流程/10 新报表/11 回传表单。
 * 与源差异登记（写法层，行为等价）：源 type 3/4/5/8/9/10 用 createCustomComponent+defineAsyncComponent 做
 * Vue 命名异步包装——该包装是 Vue keep-alive 组件命名需求（keepAlive 已裁不复刻），React 内核只做查表透传，
 * 渲染对象同款；本 spec 用字符串标记当组件占位断言查表结果。
 * 源快照行为钉：convertRoutes 顶层先把每行 component 预置 'BasicLayout' 字串（污染输入，照源保留），
 * 目录分支据此查 layoutMap['BasicLayout']；type 12 等未登记类型无分支=穿透（AMIS 出范围裁定的实现落点）。
 */
import { describe, expect, it } from 'vitest'
import { generateRoutesByBackend } from '../src/route/index.ts'
import type { BackMenuSpec, ComponentMap } from '../src/route/index.ts'

const layoutMap: ComponentMap = {
  BasicLayout: 'L:Basic',
  IFrameView: 'L:IFrame',
  NotFoundView: 'L:NotFound',
  OnlineModelView: 'L:OnlineModel',
  OnlineDictView: 'L:OnlineDict',
  OnlineDataReportView: 'L:OnlineDataReport',
  OnlineReportView: 'L:OnlineReport',
  OnlinePortalView: 'L:OnlinePortal',
}

const menu = (over: Partial<BackMenuSpec>): BackMenuSpec => ({
  enCode: 'demo.node', fullName: '演示', id: 'id-1', type: 1,
  ...over,
})

describe('后端菜单转换 generateRoutesByBackend（照源）', () => {
  it('应用/目录 type 0/1：path=enCode 点转斜杠、顶级组件查 layoutMap[BasicLayout]、children 递归转换', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [
        menu({
          type: 0, enCode: 'system.manage', fullName: '系统管理',
          children: [menu({ type: 2, enCode: 'system.manage.user', fullName: '用户', urlAddress: '/demo/user' })],
        }),
      ],
      layoutMap,
      pageMap: { '/demo/user.vue': 'PG:user' },
    })
    const dir = result[0]!
    expect(dir.path).toBe('/system/manage')
    expect(dir.component).toBe('L:Basic')
    expect(dir.meta.title).toBe('系统管理')
    const page = dir.children![0]!
    expect(page.path).toBe('/demo/user')
    expect(page.component).toBe('PG:user')
    expect(page.name).toBe('SystemManageUser')
  })

  it('二层级目录显式 node.component 时查 layoutMap 对应键（顶层预置 BasicLayout 不波及深层）', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [
        menu({
          type: 0, enCode: 'app', fullName: '应用',
          children: [menu({ type: 1, enCode: 'app.sub', fullName: '子目录', component: 'IFrameView' })],
        }),
      ],
      layoutMap,
    })
    expect(result[0]!.children![0]!.component).toBe('L:IFrame')
  })

  it('meta 五件套：title=fullName、i18nCode=enCode 点转横杠带 routes. 前缀、modelId=id、type 透传、icon 透传', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 2, enCode: 'demo.node', fullName: '演示', id: 'm-9', icon: 'i-x', urlAddress: '/demo/p' })],
      layoutMap,
      pageMap: { '/demo/p.vue': 'PG:p' },
    })
    expect(result[0]!.meta).toMatchObject({ title: '演示', i18nCode: 'routes.demo-node', modelId: 'm-9', type: 2, icon: 'i-x' })
  })

  it('type 2 页面：pageAddress 优先于 urlAddress、缺省补 .vue 查 pageMap', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 2, enCode: 'a.b', urlAddress: '/raw/path', pageAddress: 'demo/page' })],
      layoutMap,
      pageMap: { '/demo/page.vue': 'PG:page' },
    })
    expect(result[0]!.path).toBe('/raw/path')
    expect(result[0]!.component).toBe('PG:page')
  })

  it('type 2 页面：pageMap 目录 index.vue 回退命中', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 2, enCode: 'a.b', urlAddress: '/demo/page' })],
      layoutMap,
      pageMap: { '/demo/page/index.vue': 'PG:idx' },
    })
    expect(result[0]!.component).toBe('PG:idx')
  })

  it('type 2 页面：查无组件兜底 layoutMap.NotFoundView', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 2, enCode: 'a.b', urlAddress: '/nope' })],
      layoutMap,
      pageMap: {},
    })
    expect(result[0]!.component).toBe('L:NotFound')
  })

  it('type 2 页面：normalizeViewPath 去相对前缀与 /views 前缀', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 2, enCode: 'a.b', urlAddress: '/x', pageAddress: './views/demo/page' })],
      layoutMap,
      pageMap: { '/demo/page.vue': 'PG:norm' },
    })
    expect(result[0]!.component).toBe('PG:norm')
  })

  it('urlAddress 补根斜杠+查询串分离进 meta.query（qs 解析，值保持字符串）', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 2, enCode: 'a.b', urlAddress: 'demo/list?id=1&type=2' })],
      layoutMap,
      pageMap: { '/demo/list.vue': 'PG:list' },
    })
    expect(result[0]!.path).toBe('/demo/list')
    expect(result[0]!.meta.query).toEqual({ id: '1', type: '2' })
  })

  it('type 3/9 表单流程：OnlineModelView 组件+name=OnlineModel+路由名+propertyJson 解析 relationId/isTree', async () => {
    const forType = async (type: number) => await generateRoutesByBackend({
      backMenus: [menu({ type, enCode: 'biz.form', propertyJson: '{"moduleId":"m1","isTree":1}' })],
      layoutMap,
      pageMap: {},
    })
    for (const type of [3, 9]) {
      const result = await forType(type)
      expect(result[0]!.component).toBe('L:OnlineModel')
      expect(result[0]!.name).toBe('OnlineModelBizForm')
      expect(result[0]!.meta.relationId).toBe('m1')
      expect(result[0]!.meta.isTree).toBe(1)
    }
  })

  it('type 4 字典/5 旧报表/10 新报表/8 门户：组件按类型映射 OnlineDict/OnlineDataReport/OnlineReport/OnlinePortal', async () => {
    const cases: Array<[number, string, string]> = [
      [4, 'L:OnlineDict', 'OnlineDict'],
      [5, 'L:OnlineDataReport', 'OnlineDataReport'],
      [10, 'L:OnlineReport', 'OnlineReport'],
      [8, 'L:OnlinePortal', 'OnlinePortal'],
    ]
    for (const [type, component, namePrefix] of cases) {
      const result = await generateRoutesByBackend({
        backMenus: [menu({ type, enCode: 'biz.x', urlAddress: '/biz/x' })],
        layoutMap,
        pageMap: {},
      })
      expect(result[0]!.component, `type ${type}`).toBe(component)
      expect(result[0]!.name, `type ${type}`).toBe(`${namePrefix}BizX`)
      expect(result[0]!.path, `type ${type}`).toBe('/biz/x')
    }
  })

  it('在线功能类无 propertyJson 时 relationId 空串 isTree 0', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 4, enCode: 'biz.d', urlAddress: '/d' })],
      layoutMap,
      pageMap: {},
    })
    expect(result[0]!.meta.relationId).toBe('')
    expect(result[0]!.meta.isTree).toBe(0)
  })

  it('type 6 大屏：meta.link=dataVUrl+appPrefix+appEnCode+view/moduleId+token、path=enCode 点转斜杠、IFrameView', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 6, enCode: 'screen.big', propertyJson: '{"moduleId":"m1"}' })],
      layoutMap,
      pageMap: {},
      globSetting: { dataVUrl: 'https://datav.example/' },
      appPrefix: '/app_',
      appEnCode: 'demoApp',
      token: 'tk',
    })
    expect(result[0]!.meta.link).toBe('https://datav.example//app_demoApp/view/m1?token=tk')
    expect(result[0]!.path).toBe('/screen/big')
    expect(result[0]!.component).toBe('L:IFrame')
  })

  it('type 6 大屏：无 appEnCode 时无前缀段（dataVUrl 直接接 view/）', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 6, enCode: 'screen.big', propertyJson: '{"moduleId":"m1"}' })],
      layoutMap,
      pageMap: {},
      globSetting: { dataVUrl: 'https://datav.example/' },
      token: 'tk',
    })
    expect(result[0]!.meta.link).toBe('https://datav.example/view/m1?token=tk')
  })

  it('type 7 外链 _self：占位符替换（dataV/ling2Token/ling2AppCode）+iframeSrc 内嵌+path 保持路由地址', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({
        type: 7, enCode: 'ext.link', urlAddress: '/ext/link', linkTarget: '_self',
        pageAddress: 'https://ext.example/?v=${dataV}&t=${ling2Token}&c=${ling2AppCode}',
      })],
      layoutMap,
      pageMap: {},
      globSetting: { dataVUrl: 'https://datav.example/' },
      appPrefix: '/app_',
      appEnCode: 'demoApp',
      token: 'tk',
    })
    expect(result[0]!.meta.iframeSrc).toBe('https://ext.example/?v=https://datav.example//app_demoApp/&t=tk&c=demoApp')
    expect(result[0]!.path).toBe('/ext/link')
    expect(result[0]!.component).toBe('L:IFrame')
  })

  it('type 7 外链 非 _self：meta.link 新窗且 route.path=外链地址本身', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({
        type: 7, enCode: 'ext.link', urlAddress: '/ext/link', linkTarget: '_blank',
        pageAddress: 'https://ext.example/home',
      })],
      layoutMap,
      pageMap: {},
      globSetting: { dataVUrl: '' },
    })
    expect(result[0]!.meta.link).toBe('https://ext.example/home')
    expect(result[0]!.path).toBe('https://ext.example/home')
  })

  it('type 12 等未登记类型：源快照无分支=穿透（path 缺席；AMIS 出范围裁定的实现落点）', async () => {
    const result = await generateRoutesByBackend({
      backMenus: [menu({ type: 12, enCode: 'amis.p', urlAddress: '/amis/p' })],
      layoutMap,
      pageMap: {},
    })
    expect(result[0]!.path).toBeUndefined()
    expect(result[0]!.meta.type).toBe(12)
  })
})
