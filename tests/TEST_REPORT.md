# v0.4 验收报告

日期：2026-10-18。开始前 fetch：实际 origin/main 为 `2e49833f5ecf37f6adf5a119bb904bf21ae6ef49`；原工作区干净。实现分支 `work/v0.4-selective-interactions`。v0.3 源码历史与验收资产保留。初次交付仅本地提交；后续用户已授权提交、推送、合并，Release发布仍未授权。

**Implemented / Tested：18 项单元 + 18 项浏览器测试通过。** 浏览器中 17 项实际加载 MV3 扩展，1 项普通页面选择器回归。依赖审计 0 漏洞。最终安装包独立复测另有4项真实MV3全部通过，记录见下方“包与复现”。

## 环境与证据边界

WSL2 Ubuntu-24.04、Node 24.21.0、Python 3.12、Playwright 1.64.1、Chromium **156.0.8078.4 / Linux**，manifest 0.4.0。最低声明 Chrome 114，不等于该版本已经验收。Windows Chrome/Edge、其他版本及 Obsidian 应用实际渲染 **Unverified**。

[完整最终日志](evidence/v0.4/final-test.log)、[浏览器/权限记录](evidence/v0.4/runtime.json)、[已测扩展逐文件 hash](evidence/v0.4/verified-build.json)、[依赖审计](evidence/v0.4/npm-audit.json)是本轮运行证据。测试通过 CDP `Extensions.triggerAction` 打开真实工具栏 Popup 并获得 activeTab，实际操作 Popup DOM，随后选择→捕获→预览→浏览器 download event→写盘→file:// 打开。没有 mock Chrome 权限/消息 API；不是 Windows 桌面鼠标人工验收。测试调试参数不进入扩展。

初始 v0.3 基线 10 单元 + 15 浏览器通过，见 [baseline.log](evidence/v0.4/baseline.log)。新增测试没有替换原有静态流程断言。

## 交互与回归矩阵

| 验收 | 实际证据 |
|---|---|
| Native Preserved | details 初始闭合/打开均捕获；下载 HTML 和解压 ZIP 可开合；仅原生折叠的网格展开不覆盖下一行；捕获不触发源 toggle |
| Reconstructed Tested：Fourier@1 | 自有模型，N=1..12、振幅0..1.5、相位±3.14；3组参数逐点比较来源与 HTML/ZIP 曲线；额外独立数学数值断言；预览滑块亦实际重绘 |
| Reconstructed Tested：table@1 | 自有两列表格，阈值0..50、升/降序；筛选30→降序→恢复0，行内容/顺序严格断言；改变初始筛选状态后仍可恢复全部行 |
| 混合与策略 | 同一区域包含图表、表格、原生折叠、说明与未知按钮；Auto/Interactive 局部恢复，未知按钮禁用；Static 全部静态，无运行时；格式独立选择 |
| 离线执行隔离 | HTML 与 ZIP 解包打开均零 HTTP(S) 请求；下载文件与扩展预览沙箱的 chrome.runtime.sendMessage 均不存在；ZIP 每项 SHA-256 校验 |
| IR与信任 | IR1.1 严格 schema/稳定序列化；1.0显式迁移；有限绑定/参数/曲线输出校验；外部JSON丢弃recipe、来源/脱敏/验证声明降为未验证，同时保留初始表格筛选视觉 |
| 新安全回归 | CSS分号/花括号/转义/注释/URL逃逸、恶意recipe/额外代码/跨组件绑定/非法范围、ZIP路径穿越；file://注入额外script被CSP阻止，合法固定hash运行时继续工作 |
| 既有导出回归 | HTML/Markdown/JSON/SVG/PNG/ZIP、纯诊断不含正文、HTML/JSON往返、资源hash、真正终止SW后恢复/过期、消息来源/schema/容量、失败重试隔离与取消 |
| 既有安全/保真 | XSS/foreignObject/MathML/敏感输入/隐藏内容/资源URL/图片头、宽20000节点与深80层DOM拒绝、Shadow/伪元素/Canvas、根变换、切格式竞争、深浅色/多视口golden |
| Gate/权限 | ChatGPT仍禁用；无Cookie/token/私有端点；权限仅 activeTab/scripting/storage，未扩大 |

有限交互的模型/事件/范围与识别规则见 [架构](../docs/ARCHITECTURE.md)；能力与支持范围见 [保真矩阵](../docs/FIDELITY_MATRIX.md)。来源路径是自有 fixture 测试约定，不是所有权认证，不证明能还原任意网站脚本。Auto 与 Interactive 本轮共用有限白名单。

[离线行为结果](evidence/v0.4/v04-equivalence.json)、[预览截图](evidence/v0.4/v04-preview.png)、[恶意JSON拒绝截图](evidence/v0.4/v04-rejected-json.png)。独立HTML样例 [v04-mixed.html](evidence/v0.4/v04-mixed.html) 打开后可运行已支持行为；该样例来自项目自己的 fixture。

## 视觉与失败证据

同一浏览器/viewport/主题/状态/字体条件，来源与实际下载HTML逐像素比较；任一RGB通道差值>16计为变化，不缩放对齐，也不替换golden掩盖失败。

| v0.4混合样本 | 变化像素 | 平均通道绝对差（0–255） | 门槛 |
|---|---|---|---|
| 初始浅色，1200×900 viewport | 0.181867% | 0.139804 | <2% / <2 |
| 暗色，N=8、筛选30降序、details打开 | 0.189051% | 0.197177 | <2% / <2 |

数值：[浅色](evidence/v0.4/v04-visual.json)、[暗色](evidence/v0.4/v04-dark-visual.json)。同一暗色初始状态的 Static 与 Interactive 还单独比较尺寸与像素（实测0.488949%，门槛<2%），见 [static-interactive](evidence/v0.4/v04-static-interactive-visual.json)。真实图片：[浅色来源](evidence/v0.4/v04-mixed-source.png)、[浅色导出](evidence/v0.4/v04-mixed-export.png)、[暗色来源](evidence/v0.4/v04-dark-source.png)、[暗色导出](evidence/v0.4/v04-dark-export.png)、[暗色静态](evidence/v0.4/v04-dark-static.png)。

原复杂组件四组viewport/theme回归变化比例0.2311%–0.2376%，MAE0.1696–0.2310，见 [complex-diff.json](evidence/v0.4/complex-diff.json)；表格比较见 [table-diff.json](evidence/v0.4/table-diff.json)。SnapDOM 3.3.4 对照再次执行：同尺寸复杂样本变化1.7162%/MAE0.6392，但敏感输入与foreignObject边界不满足本产品策略；继续仅开发依赖，见 [对照](evidence/v0.4/snapdom-complex.json)。这些结果只证明固定条件样本，不证明任意网页无损、原始响应式或所有交互复原。

保留两类真实失败及修复：

- 筛选表格捕获时临时展开所有行造成grid解析行高残留：暗色导出比来源多71px，见 [失败来源](evidence/v0.4/failures/v04-dark-source.png)、[失败导出](evidence/v0.4/failures/v04-dark-export.png)和 [失败日志](evidence/v0.4/failures/interactive-states.log)。修复recipe祖先布局的固定行高后，上述配对比较通过。
- 独立审查复现捕获details触发2次toggle、原生折叠展开覆盖下一行。增加MV3回归先失败 [native-red.log](evidence/v0.4/native-red.log)，修复后源toggle为0且展开几何不重叠。CSS/模型安全的先失败记录见 [red-unit.log](evidence/v0.4/red-unit.log)、[red-interactions.log](evidence/v0.4/red-interactions.log)。全部修复后再次运行完整回归。

## 包与复现

```bash
npm ci
npx playwright install --with-deps chromium
npm test
npm audit --audit-level=high
npm run package
```

测试前构建，测试前后比较扩展逐文件hash；打包拒绝未测或修改的扩展字节。`dist/v0.4.0/` 含extension/source ZIP、SHA256SUMS、package-manifest.json；安装ZIP解压后加载 `extension/`。build-info记录源码提交和构建时是否有改动，最终产物以逐文件hash为准。最终构建关联源码提交 `9d97937177e4ed9c0d66b4fc961d78f0aeaf9f05`，构建时工作区干净；之后的本地提交仅收口构建记录、文档与测试证据。CHANGELOG v0.4节可作正式Release说明草稿，当前没有公开Release。

最终安装包解压后，另执行4项真实MV3：原主链路及全部3项v0.4案例，证据为 [package-smoke.log](evidence/v0.4/package-smoke.log)。不重新构建包内文件：

```bash
UIP_EXTENSION_PATH=/absolute/unpacked/extension \
UIP_EVIDENCE_DIR=/absolute/package-evidence \
npx playwright test tests/mv3.spec.mjs --output=/absolute/package-results \
  --grep 'v0.4|real toolbar Popup'
```

本地源码使用README中的fixtures服务。人工可按选择→预览→调整策略→下载→打开复验；无需人工替代本轮已经通过的自动测试。浏览器保存是否完成看下载列表，扩展只承诺发起请求，不新增downloads权限。

## 工程状态与剩余边界

- **Tested：** main [Actions run 39121539504](https://github.com/yunmin311/intelligent-ui-portability-lab/actions/runs/39121539504) 为success，head为2e49833。本轮保留CI并更新v0.4产物命名，配置含单元/语法/schema/MV3/audit/包验证。
- **Unverified：** Windows Chrome/Edge、其他浏览器版本、商店、Obsidian应用及完整读屏/模糊测试。v0.4远端CI状态以Actions实际运行记录为准，不能用main历史CI代替本轮远端执行。
- **Decision：** rulesets查询为空，main protection API显示未保护；只读检查。建议所有者后续启用PR与CI required status，具体可用性依仓库套餐/管理权限；本轮不更改管理设置。
- **Blocked：** ChatGPT程序化获取无本项目已确认许可的接口，Gate保留；真实官方数据包适配缺授权样本。
- **Proposal：** PDF、正式Source Adapter、其他有真实行为证据的recipe；任意来源JavaScript恢复不在当前能力内。
- **已知限制：** 非自有未知事件静态；closed Shadow/iframe/虚拟或未挂载内容、复杂伪元素/3D、外部图片/字体/动画仍可能遗漏；静态版本不包含完整响应式规则。CSS采用声明边界与属性/函数白名单，不是完整逐属性CSS语法解析器，非合法值由浏览器忽略。同步浏览器样式/Canvas调用无硬中断保证；遍历分批取消、有尺寸/节点/资源限额，未测真实进程峰值内存。正文/图片/Canvas秘密无法完整自动识别；session 10分钟逻辑过期，物理清理由访问触发，不承诺准点擦除。
- **许可：** UNLICENSED保持；项目授权仍由所有者决定，依赖许可见 docs/DEPENDENCIES.md。

v0.3与v0.2历史记录保留于 evidence/v0.3、原evidence和Git历史；它们不代表本轮新增交互路径的测试证据。
