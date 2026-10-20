# v0.5.2 自主使用验收 · 2026-10-20

Decision：沿用精密工具设计，只修复可复现的体验问题。基准为 fetch 后 main/origin/main `42758ce0d2ebfcf154c3c7a8a61abd56351c85ab`，初始工作区干净，开发分支 `codex/usability-v052`。没有另起项目、扩大权限、修改许可或公开 Release。当前设计与架构分别以 DESIGN_SPEC、ARCHITECTURE 为准，本文件集中记录本轮证据，旧报告属于历史。

## 三轮记录

| 轮次 | 实际操作与结果 | 发现 / 修改 / 剩余 |
| --- | --- | --- |
| 1，先测试 | 安装原 v0.5.1 ZIP，38项既有真实MV3通过；追加5个用户体验探针全部复现失败，修改生产代码前截图 | 0 P0、3 P1、2 P2；这轮不改生产代码。探针在失败断言处停止，其本身不算完成离线链路；已有38项覆盖完整链路 |
| 2，集中修复 | 先5项定向通过，再扩展到真实富文本Ctrl+C/V、损坏输入/取消恢复、缩放交互；最终完整 `npm test`：45单元、59浏览器全部通过 | 修复下表5项；新增9项真实MV3与1项缩放单元测试。保真门槛未改 |
| 3，重新验收 | 新浏览器配置再次完整 `npm test`，45单元+59浏览器通过；最终安装ZIP解压后47项MV3全部通过，逐文件字节在测试前后相同 | 复查明暗/375及1280px、无横向页面溢出、离线文件、权限/配方/IR与原始视觉。当前可自主复现的P0/P1已处理 |

[真实截图与文件入口](../tests/evidence/v0.5.2/index.html)。轮1安装 ZIP SHA-256：`2371e63481504c3fe48111a4dfa4c2894494e709df018e6d3aee4e295a8c953a`。日志保留于同目录（仅去除行尾空白以便Git审查，结果与错误内容不变）；没有把本轮实现假装成旧版截图。

## 五个真实问题与修复

| ID / 级别 | 复现及修改前 | 修改后与验证 |
| --- | --- | --- |
| U1 / P1 | 375px打开1200px内容，画布client=341、scroll=1200，无适应窗口入口 | 默认按宽度适应，scroll=341；100%恢复真实宽度，25–200%选择缩放。鼠标、键盘折叠、Tabs、计算输入实测；缩放前后下载HTML字节相同，导出宽度等于IR |
| U2 / P2 | 导入页同时呈现原生file input与拖放按钮，重复入口与Tab停靠 | 原input保留ID/accept但隐藏；一个原生按钮支持点击、Enter/Space、拖放。转换期间禁用，失败/取消后恢复；真实文件选择器选取、下载并离线打开通过 |
| U3 / P1 | Interactive要求确认降级，但未知组件与原因藏在折叠报告里 | 要求确认时自动展开原因；确认后方能下载，切格式重新确认。HTML/ZIP未知组件保持静态，details可用；未更改策略判定或信任 |
| U4 / P1 | 3840×2160截图缩至1MP，质量损失只在折叠诊断中，用户容易误认为原图 | 直接显示原/保存尺寸、PNG/JPEG损失与visual-only；提示100%检查及分区域截图。没有提高1MP预算或恢复丢失细字，放大只是显示 |
| U5 / P2 | 纯文本可选SVG/PNG，直到转换失败才知道不支持 | 依据已验证树结构/资源MIME/像素上限提前禁用并说明。HTML/ZIP/JSON用途就地提示；Markdown与截图资源ZIP逻辑保留 |

这是5项产品问题、5项解决。测试调试另记录：缩放iframe后Playwright子节点boundingBox未按显示比例返回，测试改用子frame原生rect映射真实鼠标坐标（不force click、不调用业务函数）；ZIP格式切换本就重置降级同意，测试在切换后再次显式确认；原生文件选择器触发预览很快，等待事件先于setFiles注册。它们是测试工具/编写问题，不计入产品缺陷数量，不修改安全行为让测试通过。

## 用户链路与安全证据

新增 `tests/usability.spec.mjs` 从真实工具栏Popup打开导入/捕获：使用CDP Extensions.triggerAction，操作实际Popup DOM，不mock activeTab。中文/英文长文本、特殊符号与字面HTML；真实浏览器Ctrl+A/C/Ctrl+V富文本保留标题/表格/列表/代码/公式字符及安全SVG；多个折叠、未知按钮，截图4K细字、正常截图；损坏JSON、资源缺失、取消、连续格式切换、单/多文件拖放与键盘文件选择。合成ClipboardEvent仅用于定向异常或图片输入；真实文字、富文本路径另有系统浏览器剪贴板按键验证，不冒充Windows系统剪贴板。

HTML/Markdown/ZIP均通过用户下载按钮保存；关闭来源和扩展页面后打开HTML/ZIP，校验结构、状态、无脚本注入/HTTP请求。最后一项关闭整个扩展persistent context，启动**无扩展的普通Chromium**打开截图HTML和ZIP，记录图片800×400、无运行错误、无HTTP请求、manifest逐项SHA-256和notes.md图片相对路径存在。仅检查Markdown源码/相对资源，不等于Obsidian GUI渲染。

原有测试继续覆盖真实MV3授权、取消重试/选择器、后台重启和会话过期、恶意HTML/SVG/JSON、大小与节点限制、受控候选预验证、documentId一次授权、IR迁移/往返、已知配方与三策略。没有改动捕获/净化/IR/运行时/渲染器/归档生产模块；本轮仅扩展页面控制及显示模块。最小权限仍activeTab/scripting/storage，无新依赖、远程字体、后台剪贴板或网络。未知富文本不授予recipe或来源证明。

## 视觉及规则审查

保留原来源像素阈值：变化像素比例<2%、MAE<2；未换golden或放宽断言。显示缩放不参与原始尺寸的来源/导出比较。明暗主题、375/1280px产品页无页面横向溢出，支持画布内部滚动；既有6类令牌文字色对均≥4.5:1，键盘焦点2px、主操作44px、状态aria-live、语义button/select、强制色模式/减少动态设置保留。完整读屏器未实测。

基于已安装Frontend Design、UI/UX Pro Max、Refactoring UI进行局部检查；未重新安装或更换设计系统。最终按[当前Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)审查：新select有label、output播报比例，隐藏原生input由可键盘按钮调用，不用可点击div；已禁用选项不制造后置错误；图片损失不只靠颜色；控件可见焦点与内容溢出由真实浏览器检查。粘贴preventDefault保留是防止未净化HTML进入有扩展权限DOM的必要安全处理；没有任意禁止用户复制。设计没有应用到导出内容。

## 复现与最终结果

```sh
npm ci
npx playwright install --with-deps chromium
npm test
npm audit --audit-level=low
npm run package
npm run test:package
```

定向：`npx playwright test tests/usability.spec.mjs tests/ui-design.spec.mjs`。安装旧包复现时设置 `UIP_EXTENSION_PATH` 指向解压后的extension；不要以新源码注入代替旧包。所有测试在WSL2 Ubuntu24.04 / Node24.21.0 / Playwright1.64.1 / Linux Chromium156.0.8078.4运行，独立临时配置，不使用用户日常浏览器。

最终结果和安装包逐文件证据：见[测试报告](../tests/TEST_REPORT.md)当前顶部。构建记录基准revision、dirty标志和sourceDigest；本地工作分支包不是纯main构建，不能仅凭版本号区分历史包。正式文件与SHA256SUMS位于 `dist/v0.5.2/`，CI从提交重建自己的工件。

## 交付判断与边界

Implemented / Tested：适合首次试用上述本地粘贴/导入/有限受控捕获路径；本轮没有未修复的确定性P0/P1阻塞。截图只能保留像素，原始小字经过既定缩放仍可能不可读；要细节请分区截图，100%不会恢复分辨率。富文本通常不携带完整CSS，结构可保存但不能声称与真实来源逐像素相同。

Unverified：真实用户ChatGPT内容、Windows Chrome/Edge、Obsidian GUI、完整读屏器、多浏览器版本及峰值内存。当前无授权真实样本/可操作平台，未用Linux或合成数据冒充；人工步骤见MANUAL_ACCEPTANCE。取消图片浏览器原生解码仍只能在返回后检查，不声称强制中断该原生操作。

Blocked：ChatGPT原生自动提取及未知交互完整恢复继续受既定数据/授权边界限制，不绕过。

Proposal：获得用户授权的真实样本后做具体兼容验证；没有PDF、新适配器、云服务或新的视觉重构。未修改仓库管理规则或公开Release。

## 修改清单

- 产品：`extension/import.html`、`import.js`单一文件入口及忙碌恢复；`preview.html`、`preview.js`能力/格式/画质反馈；新`src/preview-scale.js`与`ui.css`仅控制预览显示。
- 版本：`package.json`、`package-lock.json`、`extension/manifest.json`与`build-info.json`；`tests/check.mjs`检查版本同步。
- 验证：新`tests/usability.spec.mjs`、`unit/preview-scale.test.mjs`及`fixtures/usability-workspace.html`；`ui-design.spec.mjs`契约从重复入口/后置格式错误更新为单一入口/不可用选项提前禁用，其他断言保留。
- 工程：`scripts/verify-package.mjs`将9项新增MV3纳入安装包；CI更新版本路径与证据工件。
- 资料：README、CHANGELOG、PROJECT_PROPOSAL、DESIGN_SPEC、ARCHITECTURE、FIDELITY_MATRIX、SECURITY_AND_COMPLIANCE、TEST_REPORT、MANUAL_ACCEPTANCE与本记录；`tests/evidence/v0.5.2`只保留必要截图/日志/离线样本，临时产物不提交。
