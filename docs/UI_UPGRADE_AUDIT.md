# 界面升级审查 · v0.5.1 · 2026-10-20

Decision：在现有 v0.5.1 上改进产品界面，不扩展导出格式、适配器或自动提取范围。开始前 fetch，main/origin/main 均为 `71f8fb02e86431bcc400e069066c5ec99eb01692`，工作区干净；开发分支 `codex/ui-design-upgrade`。版本号保留0.5.1，构建以文件hash区分。没有公开Release、许可证或仓库规则变更。

## 真实问题与决策

基线由真实 Chromium MV3 工具栏 Popup 打开页面、启动 Overlay、进入导入和预览后截图，非概念渲染。首批基线保存后才修改生产界面；375px Overlay补图来自同一main提交的原始归档字节；本轮截图不替代已有来源/导出像素基线。

| 原界面证据 | 问题 | 已实装处理 |
| --- | --- | --- |
| before/popup-light.png | 格式/契约和捕获占首屏，实际粘贴入口靠后 | 导入主按钮前置；网页捕获次要；捕获设置折叠，仍须显式勾选 |
| before/import-light-1280.png | 640px偏左表单，桌面留白失衡，粘贴表面弱 | 中央工作区；突出Ctrl+V；能力说明侧栏；窄屏单栏 |
| before/preview-light-1280.png | 诊断在画布之前，来源内容被向下挤压 | 来源左侧优先、检查右栏；窄屏来源在前；报告独立限高滚动 |
| before/import-dark-375.png | 信息密度与默认控件层级普通 | 统一字体、间距、边界、状态和明暗令牌；44px普通操作控件 |
| after/preview-dark-375.png（首次迭代发现） | 无背景纯文本默认黑字继承深色画布 | 本地解析文档默认白色画布，显式来源背景优先；新增离线深/浅主题断言 |

[真实前后截图画廊](../tests/evidence/ui-upgrade/index.html)包含桌面1280×900、375×900、浅/深色、Popup、Overlay、空态、错误、忙碌和多组件降级；全页截图可能高于900px。Popup使用自身360px（旧版348px）尺寸。加载图在真实隔离净化进行中截取，未伪造busy状态。样本均为自有fixture或合成文字，不是真实ChatGPT内容。

A精密工具 / B编辑工作台的[概念对照](UI_DESIGN_DIRECTIONS.html)明确标为概念。选A的依据与令牌见[设计规范](DESIGN_SPEC.md)，B仅Exploration。没有把插件主题应用到快照、图片或ZIP内部页面。

## Skills与工具验证

[完整来源、路径、版本和SHA-256](../tests/evidence/ui-upgrade/skills.json)。已有Anthropic Frontend Design、Vercel Web Design Guidelines与Refactoring UI均读取并保留；前两者与上游文件逐字节相同。Refactoring UI色阶生成器实际执行。新装UI/UX Pro Max按审查过的官方Codex模板生成，只复制scripts/data/LICENSE；未执行远程安装脚本、安装CLI依赖或无关Skills/MCP。

UI/UX Pro Max的Python设计系统与UX查询已实际运行，输出保存在evidence。其营销模板与动画建议没有照搬。当前会话通过读取SKILL.md与调用脚本使用；新Skill在后续会话的目录发现可能需要刷新，但不影响本轮实际应用。无Windows Node回退，所有命令在WSL执行。

## Web Design Guidelines最终审查

规则源：[Vercel command.md](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md)，本轮重新获取并通读；使用已安装Skill的file:line方式检查实际HTML/CSS/JS。

| 检查位置 | 结论与处理 |
| --- | --- |
| extension/import.html:7 / extension/import.js:38 | 拖放入口改原生button，移除旧模拟keydown，保留点击与拖放处理；Enter调用原生文件选择 |
| extension/import.html:1 / extension/preview.html:3 | 增加跳过链接与明确区域名称；ID、label/for、原生select保留 |
| extension/ui.css:23 | focus-visible统一2px轮廓；不移除键盘焦点；强制色提供可见边界 |
| extension/ui.css:11 / extension/ui.css:145 | 常用控件44px；窄屏布局与长内容折行；来源画布保持原始尺寸并内部滚动 |
| extension/import.html:9 / extension/preview.html:8 | aria-live状态，busy与cancel已有业务流程；状态颜色只是文字辅助 |
| extension/ui.css:128 | color-scheme、select明确颜色、浅/深令牌；正文/辅助/主操作/错误色对实测≥4.5:1，具体JSON随图保存 |
| extension/import.html:10 | 数值控件有label、name、autocomplete=off；保留原有范围 |
| extension/ui.css:173 | 遵从减少动态效果和系统强制色；没有新动画或外部字体 |

审查例外：paste事件的preventDefault是安全隔离所必需，避免不可信HTML直接进入扩展DOM，不能按通用表单建议移除。粘贴区保留既有自动聚焦以服务Ctrl+V桌面工作流；375px为桌面浏览器模拟宽度，不宣称移动端软键盘验证。原生复选框不人为放大模型内的来源控件。此为基础可访问性审查，不是完整读屏器认证。

## 验证与边界

测试结果与复现命令以[测试报告](../tests/TEST_REPORT.md)为准。新增四项UI E2E验证真实Popup路径、主按钮焦点、文件选择键盘操作、空输入恢复、真实忙碌状态、明暗375/1280无页面横向溢出、长中英文、多组件报告内部滚动、降级确认、静态格式策略禁用、离线纯文本可读性及导出不混入产品CSS。新增测试也对最终解压安装包运行。

调试过程保留[加载测试竞态](../tests/evidence/ui-upgrade/failures/loading-race.md)：截图后转换可能已完成，测试改为只在仍忙碌时取消，不用无效等待掩盖真实失败。文件选择测试改为场景间独立浏览器，显式激活页面、确认document.hasFocus()后按Enter，并清空filechooser；保留连续会话的失败日志。原有安全、交互、JSON往返、SHA-256与视觉阈值未放宽。

Implemented：Popup/Importer/Overlay/Preview共享设计系统与状态；原生键盘入口；本地空背景对比度修复。

Tested：仅以本轮日志和实际截图确认，详见测试报告；真实工具栏Popup不使用权限mock。视觉截图是审查证据，不是自动像素审美评分；原内容保真沿用自动成对像素比较。

Unverified / Blocked：Windows Chrome/Edge实机、Obsidian GUI、真实ChatGPT样本与完整辅助技术未在本轮验证。没有阻止本轮Linux Chromium功能验收；没有新增授权接口。

Proposal：收集真实用户视觉反馈后再调整密度；B方向不作为另一套生产界面。无PDF、新适配器或自动ChatGPT采集计划实装。
