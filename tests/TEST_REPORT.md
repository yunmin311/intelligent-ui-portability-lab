# v0.2 真实测试报告

日期：2026-10-16；环境：WSL2 Ubuntu-24.04 Linux、Node24.21.0、Python3.12、Playwright1.64.1、Chrome for Testing **156.0.8078.4**。测试运行版本对应 extension manifest0.2.0。没有使用真实 ChatGPT 账号或会话接口。

**结果：本地允许页面的 MV3 Popup → 选择 → 捕获 → 沙箱预览 → 下载 → 本地打开链路通过。** `npm test`：静态检查 PASS，9 tests passed（12.5s；8项 MV3 +1项页面选择器测试）。完整输出 [test-run.txt](evidence/test-run.txt)，环境 [runtime.json](evidence/runtime.json)。仅 NO_COLOR/FORCE_COLOR 同时设置的测试运行器提示，无产品测试失败。

## 如何证明是扩展 E2E

`tests/mv3.spec.mjs` 用完整 Chromium channel 启动 persistent context，实际加载 unpacked extension 和 service worker。使用测试浏览器 CDP `Extensions.triggerAction` 对真实 tab 触发工具栏 action，取得真正的 popup target，在其真实 DOM 中设置 select 并调用主按钮 click handler。activeTab 由工具栏动作授予，**未 mock chrome API 或注入假权限**。然后通过页面指针/键盘、扩展预览、真实 download event、download.failure、写盘后打开 file:// 验证。

headless 只表示没有显示窗口，不代表没有 MV3；旧 smoke“本环境无法扩展测试”的结论已被这条真实路径替代。测试用 `--enable-unsafe-extension-debugging` 只启用 CDP 测试接口；不进入插件。调用 Popup DOM click 不是桌面鼠标点击扩展托盘的人工验收，普通稳定版/其他 OS 仍需独立验证。`engine.spec.mjs` 的单项页面注入只证明选择器小回归，不混入扩展证明。

## 项目测试表

| 项目 | 结果与证据 |
|---|---|
| MV3加载/权限/Popup/下载/打开 | PASS：真实toolbar路径、16元素表格与报告下载、独立HTML打开；popup.png / preview.png / table.html / table-report.json |
| 标题点击选容器 | PASS：h2→section，↑body、↓section；picker.png |
| 取消/重入/重复/切换tab | PASS：Esc、取消按钮、重复注入只留1个Overlay、另tab无Overlay |
| HTML/MD/JSON完整与安全 | PASS：表格TCP/UDP；敏感输入、密码、隐藏文字、contenteditable、带token链接不泄露；无script/iframe/事件属性/可导航URL；Markdown注入文本转义；security.* |
| HTML离线网络 | PASS：打开真实table.html，记录HTTP(S)请求为0；源码无fetch/XHR/cookie/private endpoints。不是对所有浏览器插件或机器网络行为的证明 |
| 滑块/计算图/Canvas/暗色/尺寸 | PASS：value9 disabled、波形d与源一致、stroke颜色、Canvas内嵌PNG；620px暗色背景与缺字体回退条件断言；wave-dark.html / png / wave.svg |
| 原生SVG文件 | PASS：实际下载并打开，namespace与static metadata，未包含script/foreignObject/href/onload |
| 计算器/Grid/checkbox/公式 | PASS：7²=49、checked+disabled、computed grid、按钮禁用；MathML降级有报告，非公式视觉保真通过；calculator.html/md/png |
| 视觉golden | PASS：来源/导出同1000×238；差值>16的像素比例0，RGB平均绝对差约0.0583；门槛<1.5%/<2；同viewport1200×900同字体/状态，裁剪不含外部阴影；table-{source,export}.png / table-diff.json |
| 遗漏/错误 | PASS：伪元素与SVG渐变遗漏、5100节点及80层失败、选区非SVG时SVG格式错误、预览失效禁用下载；omissions.json |
| 站点阻止 | PASS：offline route模拟chatgpt.com后真实Popup显示合规闸门；chrome://version显示HTTP(S)提示；未执行真实平台捕获 |
| Popup浅/暗主题 | PASS：真实Popup截图 popup.png/popup-dark.png；不是来源界面重新配色 |
| SnapDOM对照 | 已测：3.3.4同条件表格，1000×237对1000×238，未强制对齐；foreignObject与普通输入值捕获属实。不纳入产品；snapdom-comparison.json/png |
| npm test / npm audit | PASS：全部扩展JS语法/最小权限/禁止采集入口检查，9项浏览器测试；audit当前0，npm-audit.json |
| Chrome稳定版Windows / Edge | **Unverified**：没有这些浏览器实际安装运行证据，不以Chromium共用内核代替 |
| 商店/真实ChatGPT/Obsidian应用渲染 | **Unverified / ChatGPT Blocked**；本轮没有发布或账号测试 |

## 原故障复现

先用 `python3 -m http.server 18787 --bind 127.0.0.1 --directory fixtures` 启动 fixture，再 `node tests/regression.mjs`。原 picker 的真实页面点击/下载结果：tableIncluded=false、brandedHeader=true。证据 baseline-reproduction.json 与 baseline-child.html。它只是 v0.1 负例，不能用于宣称 v0.2 功能失败或新的“成功截图”。原交付的 picker 保存在 baseline/，不进入安装包。

## 用户人工验收（Chrome/Edge分别记录）

1. 在 chrome://extensions 或 edge://extensions 加载 extension/，确认版本0.2.0、只有当前标签页和脚本权限；已有安装须重新加载并刷新来源页。
2. 按 README 启动8765服务，打开 interactive-demo.html；不要file://直接双击。
3. 工具栏点扩展→HTML→选择区域；点击“协议对比”文字，应框住整个表格section。↑扩大/↓还原，Esc应退出；重复进入不叠框。
4. 再选表格Enter，应打开扩展预览。检查static和遗漏清单，下载HTML与报告，在下载列表确认，再从磁盘打开HTML；没有品牌页眉，表格结构和颜色与来源比较。
5. 调滑块至9，选择波形section，HTML打开应仍显示该曲线，但滑块/按钮不恢复原交互。改选图形本身测试SVG；用section导SVG应明确报错。
6. security区域导HTML/MD/JSON，搜索DONT_EXPORT_ME、PRIVATE_NOTE_DO_NOT_EXPORT、token-secret，应无结果；远程图占位，未自动连接网络。
7. 浏览器切暗色或缩小窗口，确认Popup文字/焦点可见；打开golden-components.html测试计算器显示结果与checkbox外观，MathML差异须列出。
8. ChatGPT应提示阻止，chrome/edge内部页提示不允许。下载被取消/策略阻止时检查浏览器下载列表再试；后台重启造成预览失效时按提示重捕获。

人工结果记录浏览器完整版本、OS、步骤、失败截图和实际导出，未运行步骤不要填PASS。

## 已知问题与剩余验证

- 只有表格做数值像素golden；复杂布局/暗色/公式只有针对性断言和截图，不宣称全量视觉一致。
- Shadow DOM、iframe、伪元素、外部字体/图片、SVG资源引用、动画、虚拟列表、精确MathML等有限制，见保真矩阵。
- 输入脱敏不是全正文/画布敏感信息识别器；无完整独立渗透/XSS模糊测试。
- 3秒预算非强制中断；尚无大页面/内存峰值/污染Canvas/极端尺寸/消息上限的完整压力矩阵。节点与深度超限有真实测试。
- SW内存预览可能较早失效；浏览器下载取消/被组织策略限制的最终结果不回传UI，用户需看下载列表。
- 未测试最低声明Chrome110；自动化依赖较新的CDP接口。Edge、稳定版Chrome/Windows、读屏和商店审核需后续验收。
- SingleFile当前运行UI截图未取得；研究明确区分源码、仓库展示图与本项目实测，没有竞品运行兼容结论。

## 交付分类

**Implemented：** 现有原型修复后的静态链路、容器选择、紧凑Popup/预览、净化/遗漏、HTML/MD/JSON/SVG和可复现测试脚本。

**Tested：** 本文PASS项、实际下载/打开文件与数值golden；未把页面注入测试或README陈述作为扩展能力证明。

**Blocked：** ChatGPT原生UI采集授权路径未确认；域名Gate保留。

**Proposed：** 官方包/文件导入、正式IR、资源包/PNG/PDF/ZIP导出、经过等价测试的交互重建；无功能实现声明。
