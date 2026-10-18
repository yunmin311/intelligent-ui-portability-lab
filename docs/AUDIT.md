# v0.1 → v0.2 审计与变更清单

2026-10-16。用户已解压 ZIP，工作区即原工程，无 Git 元数据。先读取原有全部项目文件（项目书、README、manifest、popup.html/js、picker.js、background.js、interactive-demo.html、check.mjs、browser-smoke.py、旧 TEST_REPORT），再在其基础上修改，没有删除原 fixture 或另建产品。

## 可复现故障与判断

1. **设计性阻止：** 原 popup.js 显式拒绝 ChatGPT，属于未过合规 Gate 的决定。v0.2 保留并把解释补入 UI/后台。对本地 HTTP 页面不存在该设计阻止；file:// 暂不支持，需 localhost。
2. **实际选区问题：** 旧 picker 点击 h2 立即捕获该子元素，导出缺表格。保留 `tests/baseline/picker-v0.1.js`，`node tests/regression.mjs` 从同一 fixture 点击标题，实际下载 `baseline-child.html`，结果 tableIncluded=false、brandedHeader=true。这是本地使用困难的可复现原因，未在用户原浏览器采集到其他故障，不能断言只有此原因。
3. **视觉问题：** 原模板品牌页眉、固定背景/宽度/margin 改变原视觉。计算样式缺 SVG stroke/fill，d 长度上限1000导致曲线丢失。新 golden 首次还发现 content-box 根高度缩小；已改根 border-box，实测同尺寸。
4. **验证缺口：** 原 Python smoke 使用 set_content+add_script_tag，不能证明扩展 Popup/activeTab/后台正常；硬编码浏览器路径且代码下载流程与新交互不符。现入口转调真实 MV3 E2E，旧源码基线用于复现，不作为产品运行。

## 逐文件结论/修改

| 文件 | 审计发现与 v0.2 修改 |
|---|---|
| manifest.json | 原最小权限合理；保留 activeTab+scripting，无 host 权限；更新版本与描述 |
| popup.html/js | 原状态贫乏、关闭后用户无进度；增加原生格式/说明/status/错误、双击禁用、URL Gate、后台状态读取；通过真实工具栏测试授权 |
| picker.js | 保留净化/Markdown基础；选择器改 Shadow Overlay、语义容器/父子链/取消/清理；捕获与下载分离；长SVG/计算颜色/根尺寸修复，Canvas静态化；安全/遗漏/硬限额 |
| background.js | 原空白；新增临时结果协调、来源校验、内存上限/过期、预览 tab |
| preview.html/js、ui.css（新增） | 沙箱预览、static/遗漏、显式下载、报告与错误；Blob 60秒释放，避免过早撤销；无品牌写入来源内容 |
| fixtures/interactive-demo.html | 保持原始样例不变；表格、波形/滑块、敏感区直接回归 |
| fixtures/golden-components.html（新增） | 自有计算器/网格/checkbox/MathML/Markdown竖线样本 |
| tests/check.mjs | 原只检查有限字符串/权限；现覆盖所有扩展JS语法/权限/禁止采集入口；修复中文绝对路径 URL 解码问题 |
| tests/browser-smoke.py | 保留可调用入口但替换误导性页面烟雾路径，转调 E2E |
| tests/mv3.spec.mjs（新增） | 真实加载MV3/工具栏Popup/预览/下载/打开；安全、取消、跨tab、超限、dark/尺寸、SnapDOM对照、像素golden |
| tests/engine.spec.mjs、regression.mjs、baseline/（新增） | 区分页面引擎小回归与扩展证明；保存旧picker故障证据 |
| package*.json、playwright.config.mjs | 固定开发依赖/实际测试脚本/本地服务；生产扩展无打包依赖 |
| 项目书/README/测试报告/docs | 删除未验证发布说明作为事实的引用；更新当前状态，保留原决策和未来架构边界 |

## 安全与运行剩余项

选择器只拦截 click/key，不是恶意站点事件隔离容器；页面仍可能在 pointerdown/mutation 中改变自身。未知 CSS/浏览器渲染、敏感普通文本/画布、后台重启、下载取消、跨域资源需按报告与预览检查。没有在 Windows Edge 或真实账户运行。异常详情/遗漏是固定描述，不复制 credential URL；不等于通用敏感信息识别器。

测试、截图、依赖版本与交付包见 TEST_REPORT/DEPENDENCIES；完整工程交付保留原始成果和故障基线，不将测试工具装入生产扩展。
