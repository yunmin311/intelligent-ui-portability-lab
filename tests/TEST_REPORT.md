# v0.5.1 界面升级验收 · 2026-10-20

Decision：基准 main/origin/main `71f8fb02e86431bcc400e069066c5ec99eb01692`，开始前 fetch、工作区干净；分支 `codex/ui-design-upgrade`。这是产品界面迭代，保留版本0.5.1、IR1.3、权限、配方与来源保真策略。设计以 [DESIGN_SPEC](../docs/DESIGN_SPEC.md) 为准，具体问题、Skills与最终规则审查见 [界面审查](../docs/UI_UPGRADE_AUDIT.md)。以下旧版报告属于历史记录。

## 本轮实测

- `npm test`：静态检查、schema无漂移、**44项单元 + 50项浏览器通过**，其中38项是真实Linux Chromium MV3，另12项为普通页面/模块测试。[完整日志](evidence/ui-upgrade/test.log)。
- 新增四项UI场景：真实工具栏Popup → Importer/Overlay/Preview，浅深主题、1280/375px、无页面横向溢出、键盘焦点/Enter文件选择/Space降级确认、状态与失败恢复、长中英文、多组件报告滚动、静态格式禁用交互策略、导出文件不混入工具主题。[补充UI日志](evidence/ui-upgrade/ui-tests.log)。独立浏览器会话隔离原生选择器状态，Enter前确认页面焦点；不是权限或业务mock。
- [真实前后截图](evidence/ui-upgrade/index.html)：首批基线在修改生产代码前采集；375px选择器补拍来自同一main归档字节，补拍2项通过/2项新布局场景跳过，非当前代码伪装旧界面。[基线补拍日志](evidence/ui-upgrade/baseline-supplement.log)。概念A/B另行标注，没有当作验收图。
- 六类文字色对，在两个页面、两宽度、两主题计算：最低浅色5.16:1、深色6.20:1，全部≥4.5:1；详细数值见after目录contrast JSON。并非完整WCAG或读屏器认证。
- 原有安全、权限、取消、截图资源、JSON往返、已知交互、三策略、离线打开和像素比较全部保留；[本轮视觉数值](evidence/ui-upgrade/regression-visual-results.json)。来源/导出视觉仍用原变化比例<2%、MAE<2阈值，未更换golden或放宽门槛。
- `npm audit --audit-level=low`：0漏洞；没有新增项目依赖、远程字体或框架。[日志](evidence/ui-upgrade/dependency-audit.log)。

运行环境为WSL2 Ubuntu24.04 / Node24 / Playwright1.64.1 / Linux Chromium156.0.8078.4。[runtime](evidence/ui-upgrade/runtime.json)。真实Popup通过CDP Extensions.triggerAction打开；截图、键盘和下载操作在扩展中执行。新UI测试中的粘贴使用前台合成ClipboardEvent，原v0.5.1文字Ctrl+C/Ctrl+V回归仍通过；不声称覆盖Windows系统富文本剪贴板转换。

## 安装包与追溯

打包命令 `npm run package`；解压安装命令 `npm run test:package`。包验证逐文件比较解压字节和通过测试的extension SHA-256，在实际MV3操作前后都检查。本轮解压安装后的**38项MV3全部通过**，包含四项新增UI场景；[安装包日志](evidence/ui-upgrade/installed-package.log)、[逐文件验证记录](evidence/ui-upgrade/installed-package.json)。文件清单与归档hash以 `dist/v0.5.1/package-manifest.json`、`SHA256SUMS` 为准。版本仍是0.5.1，区别于历史资产必须核对hash与构建信息。

[通过测试的源码字节](evidence/ui-upgrade/verified-build.json)记录本地测试时间；build-info标记基准revision与workingTreeModified=true，sourceDigest记录本轮修改，不能冒充纯main发行构建。CI从提交重新构建并保留独立工件。没有公开Release。

## 已知边界

Implemented：共享明暗令牌、导入优先Popup、粘贴工作区、来源优先Preview、受限报告、44px控件、焦点与统一状态；导入文档未提供背景时采用白色画布，避免系统深色导致默认黑字不可读，显式来源背景优先，已有JSON不改色。

Tested：以上日志、截图、离线文件和包验证对应实际运行；失败调试日志保留在 [failures](evidence/ui-upgrade/failures/loading-race.md)，最后结果不按修复推测通过。

Unverified / Blocked：本轮没有Windows Chrome/Edge实机、Obsidian GUI、真实ChatGPT样本或完整读屏器环境；375px为桌面浏览器窄视口，并非移动端操作系统验证。ChatGPT自动提取Gate未改变。

Proposal：B编辑工作台只作概念；后续依据真实用户反馈调整密度。没有PDF、新适配器或额外权限。

复现：`npm ci` → `npx playwright install --with-deps chromium` → `npm test` → `npm run package` → `npm run test:package`。仅补拍本轮场景：`npx playwright test tests/ui-design.spec.mjs`。Windows/Obsidian人工步骤仍见以下历史报告，不能用本轮Linux通过代替。

---

# v0.5.1 验收报告 · 2026-10-19

Decision：开始前 fetch，实际 main/origin/main 为 `8255b075a931410eec7c185a956161da910d973e`，工作区干净；分支 `codex/v0.5.1-paste`。在原仓库集成，未执行旧补丁；两份用户 ZIP 的逐项审计与 hash 见 [交接审计](../docs/V051_HANDOFF_AUDIT.md)。v0.5.0 历史报告可从基准提交读取，历史 evidence 保留。

## Implemented

Popup → “手动粘贴 / 导入文件” → Ctrl+V、文件或拖放 → 同一转换/验证 → 原预览 → 下载。本轮新增纯文本、富文本和截图粘贴；无后台剪贴板读取、无 clipboard 权限。取消、空输入、重复操作、过大数据、异常恢复有反馈，取消终止 worker 或移除隔离解析 frame；浏览器原生图片解码/编码不能强制中断，返回后检查取消并释放资源。

纯文本转义标记并保留首尾换行、代码空行；富文本复用隔离白名单，未知脚本/行为不运行。截图先校验签名、MIME、尺寸，16MB/40MP/16384边界内受控缩放，保存至原有1MP/4096/2MB资源约束；显示原/保存尺寸与损失，不声称保留原始文件。HTML 内嵌图片，ZIP 的 notes.md 引用 resources/ 本地资源；独立截图 Markdown 禁用并引导 ZIP。IR1.3、有限固定运行时、Auto/Interactive/Static 不变。

受控捕获先结构、有限状态与完整模型校验，再允许特殊数据捕获；隐藏面板文字不参与预校验。候选最终变化失败丢弃特权结果并默认脱敏重捕。未临时修改来源 hidden/样式。授权绑定 tabId+origin+documentId+有效期，一次消费；取消、完成、导航均清理。保持 activeTab/scripting/storage，无远程执行代码或自动 ChatGPT 采集。

## Tested

可复现：

```sh
npm ci
npx playwright install --with-deps chromium
npm test
npm audit --audit-level=low
npm run package
npm run test:package
```

`npm test`：静态语法/权限/版本、Schema 无漂移，**44项单元、46项浏览器全部通过**。[完整日志](evidence/v0.5.1/test.log)。其中 **34项 Linux Chromium MV3**，其余12项为普通页面/源模块/图片测试，不冒充扩展 E2E。依赖审计全级别0漏洞，版本锁定且许可证未变。环境为 WSL2 Ubuntu24.04、Playwright1.64.1、Chromium156.0.8078.4 / Linux，见 [runtime](evidence/v0.5.1/runtime.json)。

真实 Toolbar Popup 使用 CDP Extensions.triggerAction 操作实际 Popup DOM，没有 API/权限 mock。纯文本通过真实浏览器 Control+C/Control+V 和 paste 事件输入；富文本、截图及错误样本用合成 ClipboardEvent/DataTransfer 驱动相同前台事件路径，因此不声称覆盖 Windows 系统剪贴板格式转换。

新增验收覆盖：标题/表格/代码/details/恶意 HTML、字面 script 文本、首尾与连续换行、600px解析宽度、4K截图缩放、HTML/Markdown/JSON/ZIP 下载、关闭导入/预览后 file:// 打开、ZIP解压/CRC/逐资源SHA-256/notes相对图片、零HTTP(S)请求与零恶意代码执行、无伪造来源或recipe、空/GIF/过大数据、取消/重复粘贴/文件/拖放恢复。截图为自制合成样本；没有真实 ChatGPT 内容。

安全新增6项源模块测试：恶意计算器/伪造tabs、非法状态与跨组件绑定、候选验证前隐藏文字读取次数为0、有效捕获无DOM突变、验证后状态变化重捕默认脱敏。新增1项真实MV3授权测试：错误document、一次消费、取消、导航和过期均拒绝旧授权。

原v0.5及更早全部测试保留：IR1.0/1.1/1.2迁移与1.3往返、Fourier/table/tabs/calculator/state/native-details、组合控件、三策略、session重启/过期、下载、XSS/SVG/CSP/URL/资源hash。四组来源与JSON往返初始视觉仍用原<2%变化比例、MAE<2门槛，未放宽；本次实际数值见 [视觉结果](evidence/v0.5.1/v05-visual-results.json)。截图粘贴为visual-only，不计为交互或语义恢复。

实际截图：[导入浅色](evidence/v0.5.1/import-light.png)、[375px暗色](evidence/v0.5.1/import-dark-narrow.png)、[富文本离线](evidence/v0.5.1/paste-rich-offline.png)、[截图离线](evidence/v0.5.1/screenshot-offline.png)、[解压ZIP离线](evidence/v0.5.1/screenshot-zip-offline.png)。可直接打开的真实输出：[文本HTML](evidence/v0.5.1/paste-text.html)、[富文本HTML](evidence/v0.5.1/paste-rich.html)、[截图HTML](evidence/v0.5.1/paste-screenshot.html)。不是设计稿或伪造验收图。

独立代码审查找到3项保真问题，均修复并纳入最终回归：宽度字符串无法解析、pre首换行被HTML解析器移除、Markdown全局空行折叠。开发中测试辅助代码也修复了模块加载前派发粘贴、折叠区控件不可编辑及ZIP检查字符串转义问题；最终全量通过作为验收依据，未删断言或调大视觉阈值。

## 打包与远端验证

测试前后扩展逐文件hash一致后才生成 [verified-build](evidence/v0.5.1/verified-build.json)；package拒绝与测试字节不一致的扩展。安装ZIP解压到独立目录，使用该目录运行全部34项MV3并在前后比对逐文件hash。**独立安装包34项MV3全部通过**，见 [日志](evidence/v0.5.1/installed-test.log) 与 [逐文件hash记录](evidence/v0.5.1/installed-package.json)。最终仅补文档/证据后重打源码ZIP，安装ZIP的SHA-256保持不变。

资产位于 `dist/v0.5.1/`：安装ZIP、源码ZIP、SHA256SUMS、package-manifest.json。sourceDigest与dirty标记准确记录本轮改动，不声称仅基准提交即可重现dirty构建。源码ZIP包括精选证据，不包括原型、旧补丁或完整生成中间快照；安装包与通过测试的扩展字节一致。Release仅[说明草稿](../docs/RELEASE_NOTES_0.5.1.md)，未公开发布。

CI 运行 audit、完整测试、打包、安装包MV3，上传本轮证据和资产。远端运行可在 [本仓库Actions](https://github.com/yunmin311/intelligent-ui-portability-lab/actions/workflows/ci.yml) 按本轮提交核对；最终交付附已核验运行链接，不沿用旧结果。main保护仅建议要求PR/必需chromium检查、禁force push/删除；本轮不改仓库规则。

## Unverified / Blocked / Proposal

**Unverified：** Windows Chrome/Edge 与 Obsidian GUI。尝试 Windows 桌面桥初始化即返回 sandboxCwd 非本地fileURI，应用操作前失败，详见 [平台记录](evidence/v0.5.1/platform-status.json)；步骤见 [人工验收](MANUAL_ACCEPTANCE.md)。真实用户ChatGPT截图/富文本未提供，当前仅合成样本链路通过，不能声称完成ChatGPT实际内容验收。其他浏览器版本/最低114、读屏、真实峰值内存未完整验证。

**Blocked：** ChatGPT自动获取缺公开确认接口/授权，官方账户包缺授权真实样本；Gate保持。

**Proposal：** v0.6获得真实授权样本后再决定适配器；PDF等不纳入本轮。**Exploration：** SnapDOM仍仅开发比较。**Deprecated：** 独立导出HTML和旧锚点补丁不作为第二套生产实现。

仍有限制：截图细字缩放可能损失，不保留原图；正文/Canvas/图片中的秘密无法全面自动脱敏；富文本视觉取决于剪贴板是否携带内联样式，不恢复来源CSS全局环境；未知业务JS、虚拟内容、封闭Shadow、远程资源及完整响应式逻辑不恢复。同步浏览器style/Canvas/解码调用不承诺硬超时。许可保持UNLICENSED。

## 修改索引

- import.html/js、import-input、import-raster、jobs、raster：统一主动粘贴/文件/拖放、取消恢复、图片预算与安全重编码。
- background/popup、capture/adapters/dom：document授权生命周期、候选预验证、脱敏重捕及无DOM副作用；生成picker/import-sandbox/build-info。
- preview/render/ui：截图资源Markdown指引、文本保真、既有紧凑设计系统。
- 新增输入/图片单元及浏览器、粘贴MV3、隐私与授权测试；安装包验证扩展至34项；版本/lock/CI。
- README、CHANGELOG、项目书、架构/设计/保真/安全、交接审计、Release草稿、人工步骤及本报告。完整逐行修改见本轮Git提交/PR。
