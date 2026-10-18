# v0.2 产品与交互规范

状态：以下 Popup、Overlay、预览均已实现；截图来自实际扩展测试，不是概念效果图。尚无设置页。竞品对应证据见 [研究](RESEARCH.md)。

## 定位、场景与流程

面向有权保存的网页组件、图表、公式与当前显示状态，默认 HTML 视觉快照；Markdown 面向笔记，JSON 面向结构保存。不是普通聊天记录全量导出器。ChatGPT 合规接入和原始交互恢复仍被分开限制。

用户打开来源 → Popup 选格式/理解 static 边界 → Overlay 选完整区域 → 预览对照内容和遗漏 → 显式下载 → 本地打开。保真失败不以插件美化掩盖；不自动将来源内容套入品牌卡片。

## Popup 信息层级

348px 宽，20px 内边距。顺序：产品短标题 → static 徽标及边界说明 → 原生格式 select（HTML 默认）→ 唯一主按钮“选择页面区域” → 可换行 status → 脱敏/离线/ChatGPT 说明。复杂配置不塞进首屏；v0.2 没有未生效的设置入口。

就绪、正在注入、正在选择、已取消、已捕获、注入失败/站点被阻止均用文字反馈；执行时主按钮禁用避免双击。实际捕获由 Popup 关闭后的 Overlay 负责，重开 Popup 从后台读该 tab 状态。协议不允许和 ChatGPT Gate 在原 Popup 显示具体原因，保持按钮可再次操作。

参考 AI Chat Exporter 的格式/主操作/预览分离，chatgpt-export 的进度与取消；不复制其多平台卡片、历史抓取选项。参考 Obsidian Clipper 的单一保存目标和可编辑区域思路，本轮不增加 vault/模板选择。

## Overlay 规则

独立 Shadow root，宿主 pointer-events:none，只有底部面板可交互；蓝框 pointer-events:none，不改变页面布局。候选优先最近 svg/section/article/figure/table 或语义 role，普通 div 回退指针元素。标签显示元素名与实际像素尺寸。

移动预选，单击锁定并阻止该次点击触发来源按钮；↑/扩大进入父容器，↓/缩小返回最近的子链；Enter/捕获按钮执行，Esc/取消清除。body 为最大范围，html 不可选。重选任意区域目前需取消重开；不是任意 DOM 树浏览器。原页可继续滚动，蓝框随 scroll/resize 更新。切换 tab 不复制 Overlay，重复注入先清理旧实例。捕获失败保留选择器并显示原因，无残缺文件。

## 预览与错误

新扩展标签页：顶部标题 + static + 下载文件/下载报告；下方尺寸、元素数、格式、能力说明；默认展开差异与遗漏；最后是可滚动的沙箱预览。HTML/SVG 用无脚本 iframe，MD/JSON 用纯文本 pre。预览不缩放、不重排来源画布，超出窗口可滚动。static 徽标与报告属于产品 UI，不烙印到原界面像素；产物使用不可见 metadata/注释说明能力，可通过预览/报告查看。

预览失效给“过期或后台重启，请重捕获”，下载保持禁用；超节点/深度/尺寸/错误 SVG 区域明确失败。下载提示“已向浏览器发起”，不显示未经证实的系统保存成功。可重新点击，Blob URL 60 秒后释放。浏览器取消下载在本轮产品中没有最终状态回传，需要查看下载列表。

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

- [Popup 浅色](../tests/evidence/popup.png)、[Popup 暗色](../tests/evidence/popup-dark.png)。
- [区域选择](../tests/evidence/picker.png)、[预览页](../tests/evidence/preview.png)。
- [暗色来源快照](../tests/evidence/wave-dark-export.png)、[计算器静态导出](../tests/evidence/calculator-export.png)。

键盘、暗色令牌和主要状态有自动测试；未进行完整读屏/高对比度审计，窄窗口 Overlay 遮挡复杂页面仍需实用性测试。
