# 竞品与捕获方案研究

检索/源码读取日期：2026-10-16。下载 GitHub 当前 main 快照，读取 README、许可证、manifest、下列关键源码，并查看已有图片。`research-sources.json` 保存已读文件 SHA-256，标识此次实际内容；GitHub API 返回限制，未将这些 hash 冒充 commit SHA。**代码/文档事实不等于已安装该竞品实测；本轮没有用用户账号运行竞品。** 动态 main 链接将来可能变化。

## 1. browser-ai-chat-exporter · manifest 1.9.1

[README](https://github.com/TomSchmidtDev/browser-ai-chat-exporter)、[Popup](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/main/popup.js)、[Preview](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/main/preview.js)、[ChatGPT injector](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/main/platforms/chatgpt/injector.js)。文档覆盖多平台常规聊天与多格式；不能从 Claude 图块支持推导 GPT-6 原生 UI 兼容。

已查看仓库截图 [导出对话框](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/main/screenshots/export-dialog.jpeg)（图中版本 1.3.4，早于当前源码）、[预览选择](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/main/screenshots/preview-select.jpeg)。界面为格式/选项/主操作，独立预览中按消息/块勾选，标出选中计数。代码用 sessionStorage 传递预览数据，有进度/失败反馈。它的元素选择是聊天块，不是任意组件容器。

权限有 activeTab/storage/downloads/contextMenus 和指定站点 host 权限；injector 使用认证 session 与内部会话接口，这是代码事实，**不是公开接口授权证据**。许可证为 Business Source License 1.1，限制当前商业用途，注明 2031-04-04 转 Apache；不能当作当前宽松开源代码直接复制。[LICENSE](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/main/LICENSE.md)。借鉴预览分离和选择计数，不采用接口/凭据路线。

## 2. chatgpt-export · manifest 0.6.58

[README](https://github.com/thekester/chatgpt-export)、[Popup HTML](https://github.com/thekester/chatgpt-export/blob/main/popup/popup.html)、[Content](https://github.com/thekester/chatgpt-export/blob/main/src/content.js)、[MIT](https://github.com/thekester/chatgpt-export/blob/main/LICENSE)。以会话/消息、分支和资源归档为主；当前源码有任务取消、能力探测、fallback、错误/下载失败与 ZIP/checksum 路径。

已查看官方仓库 [格式选项图](https://github.com/thekester/chatgpt-export/blob/main/store-assets/chrome-screenshots/01-export-options.jpg)、[会话选择图](https://github.com/thekester/chatgpt-export/blob/main/store-assets/chrome-screenshots/05-conversation-picker.jpg)：紧凑格式/范围分层，历史列表可过滤勾选，底部显示数量与导出操作；图中用户信息已有原作者遮盖。Popup 有 progress/cancel/error，预览/选择针对消息和会话，非通用 DOM 图层。

权限含 storage/scripting、ChatGPT 主机与可选广泛站点；源码有 auth/session 和内部 backend 请求，不能复用作为合规依据。其自定义聊天导出排版不能用于要求保持原视觉的本产品。借鉴明确取消、失败列表与归档 manifest 思路，ZIP 属后续方案；没有证据证明该项目完整支持 GPT-6 Intelligent UI。

## 3. Obsidian Web Clipper · Chrome manifest 1.7.1

[README](https://github.com/obsidianmd/obsidian-clipper)、[Popup](https://github.com/obsidianmd/obsidian-clipper/blob/main/src/popup.html)、[Highlighter](https://github.com/obsidianmd/obsidian-clipper/blob/main/src/utils/highlighter.ts)、[Overlay](https://github.com/obsidianmd/obsidian-clipper/blob/main/src/utils/highlighter-overlays.ts)、[Manifest](https://github.com/obsidianmd/obsidian-clipper/blob/main/src/manifest.chrome.json)。面向网页→Markdown/Obsidian，模板/属性与正文编辑；高亮基于文本范围/元素，Overlay 与提取分离，有错误容器与保存目标设置。

已查看仓库 [Safari 官方截图](https://github.com/obsidianmd/obsidian-clipper/blob/main/assets/safari/screen-01.png)：模板/标题/属性/正文/路径/vault/单一保存按钮；这是 Safari 展示图，不能冒充 Chrome 运行验收。[官方产品页](https://obsidian.md/clipper) 也展示剪藏与高亮。权限比本产品宽，包含侧栏、存储、剪贴板、菜单、规则等；提取与净化依赖 Defuddle/DOMPurify。代码 MIT，但名称/logo/营销素材等有额外品牌限制，见 [LICENSE](https://github.com/obsidianmd/obsidian-clipper/blob/main/LICENSE)。

借鉴可检查正文与单一保存动作；不采用模板重排来源视觉，不把 Markdown 提取能力等同 HTML 原貌保存。可选解释器连接需另行隐私评估，本产品未引入。

## 4. SnapDOM · 3.3.4（实际对照同版本）

[README/限制](https://github.com/zumerlab/snapdom#limitations)、[Capture](https://github.com/zumerlab/snapdom/blob/main/src/core/capture.js)、[Clone](https://github.com/zumerlab/snapdom/blob/main/src/core/clone.js)。按 DOM element 捕获，有样式/字体/伪元素/Shadow 处理与多种图像输出；无浏览器扩展 Popup、预览和权限模型，须由调用方实现。看过仓库 `docs/assets/newhero.png`，它是营销示意图，**不作为功能证据**。

源码与 README 明确：跨域资源需可读权限，iframe 可占位；SVG 包含 foreignObject；默认捕获可见输入值，语义插件的文本脱敏不自动脱敏图像。可选 HTML/PDF 插件另有包与范围，未测试。MIT 核心只作为精确锁定的 devDependency，产品没有内嵌该库。

实际对照同表格/viewport/字体/状态：核心 PNG 高度少1px，未强行缩放；原始 SVG 可见普通输入秘密。现有 HTML 表格 golden 已满足门槛，**不足以证明引入库会实质提高当前核心质量**。保留对照测试，暂不集成；复杂 CSS 收益仍需后续样本评测。详见 [保真矩阵](FIDELITY_MATRIX.md) 与 evidence/snapdom-comparison.json。

## 5. SingleFile · 1.31.1

[README](https://github.com/gildas-lormeau/SingleFile)、[已知问题](https://github.com/gildas-lormeau/SingleFile/blob/main/known-issues.md)、[Panel](https://github.com/gildas-lormeau/SingleFile/blob/main/src/ui/pages/panel.html)、[后台加载脚本](https://github.com/gildas-lormeau/SingleFile/blob/main/src/lib/single-file/core/bg/scripts.js)、[Manifest](https://github.com/gildas-lormeau/SingleFile/blob/main/manifest.json)。整页/选区/框架单文件封装、资源内嵌、注释编辑；Toolbar 执行/再次取消，更多选项走菜单/选项/侧栏。Panel 有 options/batch/pending 标签与嵌入选项页；不是聊天格式选择 Popup。

源仓库根 manifest 是 **MV2 的 Firefox 路径**，不能将其权限表说成 Chrome MV3 发行版；README 指向另一个 Chromium MV3 构建仓库。当前根权限较宽，含 downloads/storage/tabs/全站等及可选权限；产品不照搬。已知问题包括受限页、跨域/Canvas/视频、iframe 和文件路径等。AGPL-3.0 约束复用，未复制其代码。

[官方站](https://www.getsinglefile.com/) 和 [Chrome 商店](https://chromewebstore.google.com/detail/singlefile/mpiodijhokgodhhofbcjdecpffjipkle) 已核对（商店版本1.31.1）。研究边界：仓库只提供演示视频/图标，没有取得并检查可归档的当前扩展 Popup 截图；静态 UI 分析来自 panel 源码，**不能声称完成了该竞品界面的运行截图验证**。借鉴离线单文件和资源遗漏透明，不复制全页采集/自动保存/云目标权限。

## 收敛决策（本项目判断）

保留原型架构，补单一主操作、语义容器+父子调整、独立预览、显式遗漏/失败、真实下载反馈。来源像素归来源，插件 UI 归插件。HTML 核心质量先于格式扩张。第三方项目的“支持 ChatGPT”、商店可用或截图都不证明本项目获得原生 Intelligent UI 结构、原始交互或程序化提取授权。

## v0.3 补充实验 · 2026-10-18

上述五仓库README/截图/代码分析是2026-10-16的研究快照，本轮沿用，不声称逐仓重新完成最新版本运行审计。新增SnapDOM3.3.4复杂组件同条件实验，920×389尺寸一致；实际指标见[complex对照](../tests/evidence/v0.3/snapdom-complex.json)。DOM静态导出和SnapDOM均与同一来源比较，结果只支持该样本。结合既有表格尺寸差和输入秘密可见的证据，Decision仍为dev-only，不将其含foreignObject的任意输出直接引入安全渲染链路。

Decision：借鉴成熟扩展的来源/主操作/预览/错误分离；保持原有紧凑Popup，新增本地文件入口，格式解释与遗漏独立，不复制竞品采集端点、许可证受限代码或视觉品牌。静态结构化导出、visual-only和未来reconstructed输出保持不同契约。
