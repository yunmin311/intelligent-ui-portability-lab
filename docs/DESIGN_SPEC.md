# v0.4.1 产品与交互规范

状态：以下 Popup、Overlay、预览均已实现；截图来自实际扩展测试，不是概念效果图。尚无设置页。竞品对应证据见 [研究](RESEARCH.md)。

## 定位、场景与流程

面向有权保存的网页组件、图表、公式与当前显示状态，默认 HTML 视觉快照；Markdown 面向笔记，JSON 面向结构保存。不是普通聊天记录全量导出器。ChatGPT 合规接入和原始交互恢复仍被分开限制。

用户打开来源 → Popup 选格式/理解选择性交互边界 → Overlay 选完整区域 → 预览对照内容和遗漏 → 显式下载 → 本地打开。保真失败不以插件美化掩盖；不自动将来源内容套入品牌卡片。

## Popup 信息层级

348px 宽，20px 内边距。顺序：产品短标题 → Auto 徽标及有限交互说明 → 原生格式 select（HTML 默认）→ 主按钮“选择页面区域”与次按钮“导入本地文件” → 可换行 status → 脱敏/离线/ChatGPT 说明。复杂配置不塞进首屏；当前没有未生效的设置入口。

就绪、正在注入、正在选择、已取消、已捕获、注入失败/站点被阻止均用文字反馈；执行时主按钮禁用避免双击。实际捕获由 Popup 关闭后的 Overlay 负责，重开 Popup 从后台读该 tab 状态。协议不允许和 ChatGPT Gate 在原 Popup 显示具体原因，保持按钮可再次操作。

参考 AI Chat Exporter 的格式/主操作/预览分离，chatgpt-export 的进度与取消；不复制其多平台卡片、历史抓取选项。参考 Obsidian Clipper 的单一保存目标和可编辑区域思路，本轮不增加 vault/模板选择。

## Overlay 规则

独立 Shadow root，宿主 pointer-events:none，只有底部面板可交互；蓝框 pointer-events:none，不改变页面布局。候选优先最近 svg/section/article/figure/table 或语义 role，普通 div 回退指针元素。标签显示元素名与实际像素尺寸。

移动预选，单击锁定并阻止该次点击触发来源按钮；↑/扩大进入父容器，↓/缩小返回最近的子链；Enter/捕获按钮执行，Esc/取消清除。body 为最大范围，html 不可选。重选任意区域目前需取消重开；不是任意 DOM 树浏览器。原页可继续滚动，蓝框随 scroll/resize 更新。切换 tab 不复制 Overlay，重复注入先清理旧实例。捕获失败保留选择器并显示原因，无残缺文件。

## 预览与错误

新扩展标签页：顶部标题 + 能力 + 下载文件/下载报告；下方尺寸、元素数、格式、能力说明；默认展开差异与遗漏；最后是可滚动的沙箱预览。预览新增原生策略select：Auto默认、Interactive优先恢复并明确确认降级、Static强制静态。HTML/ZIP在无扩展权限sandbox运行有限交互，其他格式显示静态原貌；逐组件报告说明可用行为与降级。预览不缩放、不重排来源画布，超出窗口可滚动。能力徽标与报告属于产品 UI，不烙印到原界面像素；产物使用不可见 metadata/注释说明能力，可通过预览/报告查看。

预览失效给“会话已过期，请重新捕获或导入”，下载保持禁用；超节点/深度/尺寸/错误 SVG 区域明确失败。下载提示“已向浏览器发起”，不显示未经证实的系统保存成功。可重新点击，Blob URL 60 秒后释放。浏览器取消下载在本轮产品中没有最终状态回传，需要查看下载列表。

## 设计令牌与适配

| 令牌 | 浅色 | 暗色 |
|---|---|---|
| 背景/正文 | #fff / #202124 | #202124 / #e8eaed |
| 次要正文 | #5f6368 | #bdc1c6 |
| 边线 | #dadce0 | #5f6368 |
| 主色/面板 | #185abc / #f8f9fa | #8ab4f8 / #292a2d |

字体仅 system-ui；标题17px/1.4，正文14px/1.5，辅助12px，文本预览13px/1.6等宽。间距4/8/12/16/20/24px，圆角4/6/8px。控件至少44px高，focus-visible 2px outline、3px offset。按 prefers-color-scheme 切换，保留原生 select 键盘操作。Overlay 固定深色面板保证页面背景中的可识别性。

产品 CSS 仅用于扩展页面及自有 Shadow Overlay。导出 renderer 不引用 ui.css；来源 DOM 的 style 白名单和固定原尺寸独立处理。SingleFile 的静态单文件理念与 SnapDOM 的按元素捕获启发了保真策略；没有复制竞品视觉主题或代码。

## 真实截图

- [Popup 浅色](../tests/evidence/v0.3/popup.png)、[Popup 暗色](../tests/evidence/v0.3/popup-dark.png)。
- [区域选择](../tests/evidence/v0.3/picker.png)、[预览页](../tests/evidence/v0.3/preview.png)。
- [暗色来源快照](../tests/evidence/v0.3/wave-dark-export.png)、[计算器静态导出](../tests/evidence/v0.3/calculator-export.png)。

键盘、暗色令牌和主要状态有自动测试；未进行完整读屏/高对比度审计，窄窗口 Overlay 遮挡复杂页面仍需实用性测试。

## v0.3 来源与状态补充（已实现）

Popup沿用348px紧凑结构，不增加营销区或设置页。入口分“选择页面区域”和“导入本地文件”。导入页允许文件选择或拖入，显示文件/像素上限、HTML解析宽度、转换中、失败可重试和敏感内容说明；没有上传和格式自动猜测。文件转换使用隔离frame，超限/超时明确失败；本轮未提供导入过程的单独取消按钮，可关闭导入标签页。

Overlay捕获显示已处理节点，Esc可协作取消；同步浏览器调用无法保证瞬时中断。JSON选择明确“完整快照”，独立“下载遗漏报告”不含正文。预览能力逐组件区分native-preserved/reconstructed-tested/model-validated/static-fallback；文件区分selective-interactive/partial-interactive/static/visual-only；SVG/PNG不支持当前区域时禁用下载并解释，用户仍可切格式。快速切格式以最新任务为准，过期结果不会覆盖下载。

真实[本地导入界面](../tests/evidence/v0.3/importer.png)与[复杂原始/导出样本](../tests/evidence/v0.3/complex-1200-light-export.png)来自自动验收。浅暗令牌保持原版，未引入新的品牌视觉。来源字体/配色/比例独立于ui.css，文件导入的净化样式也不会被产品主题覆盖。

## v0.4.1 当前实现

保留原布局、令牌、Overlay和本地导入入口，未重做产品视觉。策略与格式在预览页独立选择，捕获不依赖未知行为推测；Auto自动恢复安全已知交互。Interactive没有可恢复交互时禁用下载，有未知组件时显示原生复选框要求显式确认降级；默认不勾选，切格式/策略清除。只有HTML/ZIP可操作策略，静态格式禁用策略选择。组件的model-validated表明模型安全校验，不能显示成来源等价证明。选择Static立即重新渲染并禁止行为，格式/策略竞争以最新任务为准。未知控件显示“未恢复来源事件或计算逻辑”，不显示假可操作设置。受控运行时与报告不插入品牌区，不修改来源配色、字体或组件外观。

真实新截图见 [选择性交互预览](../tests/evidence/v0.4/v04-preview.png)、[深色来源](../tests/evidence/v0.4/v04-dark-source.png)、[深色HTML](../tests/evidence/v0.4/v04-dark-export.png)、[JSON拒绝状态](../tests/evidence/v0.4/v04-rejected-json.png)。v0.3链接保留为已有视觉基线，当前文字/策略以本节和实际代码为准。

当前真实截图：[JSON导入后浅色预览](../tests/evidence/v0.4.1/v041-light-confirmation.png)、[暗色离线HTML](../tests/evidence/v0.4.1/v041-dark-roundtrip.png)。产品复选框和能力反馈均在预览页，不进入来源内容画面。历史截图仅作演变记录。
