# v0.4.1 验收报告

日期：2026-10-19。开始前 `git fetch origin`；实际main/origin/main为 `5bc8cfffd362a68b45379c6da8f9406fc03bdd58`，工作区干净。工作分支 `codex/v0.4.1-roundtrip`。测试/包字节校验、当前远端CI结果分别如下；不以v0.4历史报告代替本轮测试。

## 当前结果与环境

**Implemented：** IR1.2版本化安全交互往返、明确三种策略、单独降级确认及核心渲染校验、诊断与UI、1.0/1.1迁移、完整安装包MV3复测脚本和CI。权限仍仅 activeTab/scripting/storage，未改变许可或ChatGPT Gate。

**Tested：** `npm test` 包含27项单元与22项浏览器测试（21项真实Chromium MV3、1项普通页面选择器测试）。最终结果见 [完整日志](evidence/v0.4.1/final-test.log) 与 [逐文件验证证明](evidence/v0.4.1/verified-build.json)。依赖审计结果见 [npm-audit.json](evidence/v0.4.1/npm-audit.json)。安装ZIP独立复测和远端CI状态见下文，不将中间构建结果当最终包证明。

WSL2 Ubuntu24.04、Node24.21.0、Python3.12、Playwright1.64.1、Chromium156.0.8078.4 / Linux。实际 [运行环境记录](evidence/v0.4.1/runtime.json)。Windows Chrome/Edge、Obsidian GUI为 **Unverified**，见 [人工验收](MANUAL_ACCEPTANCE.md) 和 [平台记录](evidence/v0.4.1/platform-status.json)。发现安装/进程不是功能通过；当前桌面工具无法在此WSL路径初始化。

## P0交互往返与安全

真实流程：自有fixture改变Fourier到N=8/A=1.3/φ=-0.75，表格筛选30降序，浅/暗折叠初态分别闭合/打开 → 工具栏真实Popup获得activeTab → 选区域捕获 → 浏览器下载完整JSON → **关闭来源页和原预览** → 从本地导入JSON → Interactive确认部分降级 → 下载HTML/ZIP → file://打开、实际操作。

[浅色行为结果](evidence/v0.4.1/v041-light-roundtrip-result.json)、[暗色行为结果](evidence/v0.4.1/v041-dark-roundtrip-result.json)：HTML及解压ZIP中各3组Fourier参数与模型逐点相同，表格初始降序/筛选30→升序→清空0严格匹配，details反复4次开合，未知按钮保持禁用。请求监听均零HTTP(S)；ZIP逐项SHA-256验证。

外部入口清除source/provenance/security声明，验证基础树、资源，再逐项校验内置Fourier@1/table@1名称/版本、精确字段、范围、数值类型/步长、唯一组件内绑定、命名空间、当前曲线/表格、有限根/label/output/表格/SVG子树语法与常规HTML祖先。仅固定产品运行时执行；外部代码和表达式从不执行。通过的是 `model-validated`；文件不能伪造 `reconstructed-tested`。原生details另标 `native-preserved`。未知/不匹配配方静态降级并报告；不安全树、资源或未来IR版本拒绝。

单元负样本涵盖未知/错版本recipe、额外code、假evidence、冒用chatgpt.com来源/captured与脱敏声明、跨组件/重复/重叠绑定、缺节点、非法命名空间、超范围、数值字符串/null/表达式、步长不符、曲线不符、资源缺失、XSS和CSS注入。既有恶意SVG、资源URL/MIME/hash/像素、ZIP路径、消息来源、CSP附加脚本阻止等测试保留。导入页与后台重复验证，遗漏说明去重，不保留外部执行权。

IR1.0/1.1迁移到1.2；1.0不允许behavior字段，1.1仅旧证据契约，1.2显式增加model-validated-v1。JSON Schema生成无漂移；结构schema之外仍必须通过运行时资源/CSS/模型语义校验。JSON完整快照与纯诊断分离。

## 策略及格式验收

| 策略 | HTML / ZIP实际行为 | 测试 |
|---|---|---|
| Auto | 安全已知交互自动恢复；未知组件静态并报告 | 自有及外部JSON混合页离线操作 |
| Interactive | 零可恢复则禁止导出；有未知部分需显式勾选降级；切格式/策略重置确认 | UI禁用、提示、确认及核心HTML/ZIP直接调用均验证 |
| Static | 不含运行时，全部控件与details静态化 | 无script、无意外操作/网络及既有静态视觉 |

Markdown/SVG/PNG以static分析，策略控件不可操作；JSON保存含模型的IR但本身不执行。报告逐组件/整体及确认状态可审计；ZIP diagnostic与interaction-report一致。PDF未实现。

## 视觉与真实截图

关闭原页面后的JSON导入HTML，与关闭前来源截图比较。相同Chromium、viewport1200×900、主题、控件状态及字体条件；尺寸严格相同，通道差>16记为变化像素。**保留原有<2%变化比例、MAE<2阈值**，没有更新基线掩盖回归。

| 条件 | 变化像素 | MAE（0–255） |
|---|---|---|
| 浅色，N8/A1.3/φ-0.75，filter30降序 | 0.177485% | 0.193121 |
| 暗色，同状态且details打开 | 0.189051% | 0.197194 |

[浅色指标](evidence/v0.4.1/v041-light-roundtrip-visual.json)、[暗色指标](evidence/v0.4.1/v041-dark-roundtrip-visual.json)。[浅色来源](evidence/v0.4.1/v041-light-source.png) / [导出](evidence/v0.4.1/v041-light-roundtrip.png)，[暗色来源](evidence/v0.4.1/v041-dark-source.png) / [导出](evidence/v0.4.1/v041-dark-roundtrip.png)，[真实确认界面](evidence/v0.4.1/v041-light-confirmation.png)。

既有复杂组件多视口/主题、MathML/Canvas/Shadow DOM/伪元素、根变换、20000节点/80层DOM拒绝、取消/重试/切目标、session后台终止恢复及过期、所有已实现格式与CSP回归全部继续运行。[复杂比较](evidence/v0.4.1/complex-diff.json)、[表格比较](evidence/v0.4.1/table-diff.json)、[SnapDOM开发对照](evidence/v0.4.1/snapdom-complex.json)。未引入生产捕获依赖。视觉结果只证明这些固定样本，不代表任意来源无损复制。

## 可复现产物与打包

```sh
npm ci
npx playwright install --with-deps chromium
npm test
npm audit --audit-level=high
npm run package
npm run test:package
```

`npm test` 构建并核对测试前后每个扩展文件hash；`package.py`拒绝扩展字节或版本不匹配。extension/source两个ZIP都核对内含扩展字节。`test:package`只解压最终安装ZIP到独立临时目录，加载该目录，运行完整21项MV3 E2E；前后比对每个文件hash，不重建再替换包。单独的普通页面选择器测试已经在npm test运行。安装包实测见 [完整日志](evidence/v0.4.1/installed-test.log) 与 [版本/hash/逐文件证明](evidence/v0.4.1/installed-package.json)。

本地资产目录 `dist/v0.4.1/`：extension.zip、source.zip（完整名称见 [Release说明草稿](../docs/RELEASE_NOTES_0.4.1.md)）、SHA256SUMS、package-manifest.json。build-info记录基准提交和工作区修改标志，sourceDigest及逐文件hash界定实际构建；不把含改动构建标成纯提交产物。Release未公开发布。

真实离线文件：[浅色HTML](evidence/v0.4.1/v041-light-roundtrip.html)、[暗色HTML](evidence/v0.4.1/v041-dark-roundtrip.html)、[完整JSON](evidence/v0.4.1/v041-light-snapshot.json)、[ZIP](evidence/v0.4.1/v041-light-roundtrip.zip)。这些来自自有fixture，不是ChatGPT原生界面或真实账号导出。

## 复现故障与修复

- 原JSON导入剥离全部behaviors，单元先失败：[red-unit.log](evidence/v0.4.1/failures/red-unit.log)。改为独立验证、固定运行时、清除等价声明后往返通过。
- 后台旧规则仍阻止已校验外部模型：[background-import-gate.log](evidence/v0.4.1/failures/background-import-gate.log)。后台改为重复规范化验证，而非直接信任或一律剥离。
- 共享label样式覆盖hidden，零交互仍显示无用确认：[hidden-confirmation.log](evidence/v0.4.1/failures/hidden-confirmation.log)。产品CSS显式保障hidden，保留浏览器回归。
- 完整测试期间编辑扩展会被测试后字节检查拒绝出证明；最终冻结后重新完整验证。真实预览发现重复校验产生重复警告，增加幂等断言并去重。

- 独立审查复现表格体脱离table、嵌套table、SVG混入HTML、输出节点包裹控件，原来可保留配方却在浏览器解析或首次操作时失效。现逐项拒绝不匹配配方并静态降级，其他合格配方继续运行；真实MV3负样本验证无运行时异常，见[降级截图](evidence/v0.4.1/v041-topology-downgrade.png)。
- 空HTML元素包含后代会使渲染丢失已校验配方：新增[先失败的测试](evidence/v0.4.1/failures/void-red.log)，IR与schema共同拒绝input/img/br/hr非空children，单元及真实导入拒绝均通过。[拓扑负例先失败日志](evidence/v0.4.1/failures/topology-red.log)。

- 原生details位于SVG祖先时会被浏览器解析成SVGElement，现仅在可确认的HTML结构中标native-preserved，否则static-fallback；Interactive零可恢复时阻断。新增[先失败日志](evidence/v0.4.1/failures/native-red.log)及真实导入回归。

## 源码修改清单

- `extension/src/core/import-snapshot.js`（新增）：真实外部JSON入口、身份清除、迁移与资源校验；`ir.js`及`docs/snapshot.schema.json`/`scripts/schema.mjs`：IR1.2与结构约束。
- `extension/src/core/interactions.js`：有限模型、拓扑校验、逐配方降级、三策略语义；`render.js`/`archive.js`：统一核心策略与归档报告。`runtime.js`保持原有限运行时。
- `extension/background.js`/`src/worker.js`：重复验证与转换参数；`src/capture/dom.js`：当前schema号；`preview.html/js`、`ui.css`：降级确认、格式反馈与hidden修复。`picker.js`/`import-sandbox.js`/`build-info.json`由构建更新。
- `package.json`/lock、manifest、`tests/check.mjs`：0.4.1版本；`scripts/test.mjs`/`package.py`/新增`verify-package.mjs`及workflow：测试字节绑定、安装ZIP独立回归。
- 新增`tests/unit/v041.test.mjs`，扩展`tests/mv3.spec.mjs`；旧unit合法SVG样本及版本断言同步，原覆盖保留。`tests/evidence/v0.4.1/`保存本轮实测与故障证据。
- README、项目书、CHANGELOG及架构/设计/保真/安全/实施文档按实际能力更新；新增Release草稿、人工验收，未改授权。完整逐行改动由本轮Git提交/PR保留。

## 工程与发布状态

远端初始main最新CI [39191685384](https://github.com/yunmin311/intelligent-ui-portability-lab/actions/runs/39191685384) 为success，head5bc8cff；这是基线结果。v0.4.1远端运行状态在提交推送后独立核对，最终交付提供当前运行链接及HEAD；本地 `dist/v0.4.1/ci-status.json` 保存交付时读取的远端结果，不拿本段基线代替。当前workflow `chromium` 运行audit、构建/静态/schema、单元、浏览器、打包及完整安装包回归，上传日志与包。

2026-10-19只读核查rulesets为空，main protection返回404 Branch not protected。建议所有者开启PR合并、必需检查 `chromium`、禁止force push/删除main，按团队需要增加审查和管理员例外。**本轮未修改仓库管理规则**。

**Blocked：** ChatGPT正式自动提取缺已确认接口/授权；官方账户包专用适配缺真实授权样本。Gate保留。**Unverified：** Windows真实浏览器、Obsidian GUI、Chromium114最低声明与其他版本、完整读屏、真实峰值内存。**Proposal：** PDF、其他有真实证据的recipe、正式Source Adapter；无任意第三方脚本恢复承诺。

**限制：** 模型校验不证明外部原来源行为等价。封闭Shadow/iframe/虚拟或未挂载内容、复杂伪元素/3D、远程图片/字体/动画仍有遗漏；响应式CSS未完整保留。正文和图像秘密不能完整自动识别。Worker可终止，但浏览器同步样式/Canvas调用不是硬超时。session十分钟为逻辑访问过期、物理清理由访问触发。许可保持UNLICENSED。历史v0.2/v0.3/v0.4证据及Git历史保留。
