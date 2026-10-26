# v0.7.1 · 2026-10-26

面向首次使用者的产品化打磨轮：从最终安装 ZIP 起在真实 Chromium 完整新用户走查（Popup → 导入 → 粘贴 → 预览 → 下载 → 无扩展离线打开），按证据修复：
- 导入沙箱显式设置 16px 中性基准字体：粘贴/文件导出不再继承宿主浏览器 12px 衬线默认，MathML 不再整体缩小 35%。
- MathML 子树不再钉死 width/height/margin/padding/line-height 等布局尺寸，离线机器数学字体差异不会压扁分数、根式与上下标。
- 捕获样式按继承关系去重（与父级相同的继承声明不再重复写入），真实剪贴板富文本导出体积约降 37%（362KB → 227KB），像素金标不变；不可见边框各侧声明一并省略。曾评估"初始值对照表"压缩，因 currentcolor 类初始值会在暗色主题重绘边框而被放弃并记录于代码注释。
- 捕获区域高度上限 12000px → 100000px（IR LIMITS 同步）：约 3 万字长文（≈600 段 / 26000px）此前被误拒，现 260ms 内完成转换。
- 界面文案去术语化：能力徽章显示中文（仅保存画面/静态保存/部分交互可用），格式与策略选项改为中文直述，导入页图片质量说明精简。
- 导出 HTML 标题取正文首个标题（浏览器标签页/历史可识别），下载文件名改为本地时间戳 ui-export-YYYYMMDD-HHmmss。
- 新增 samples/（复杂富文本、已验证交互、4K 截图 ZIP，均为合成内容，双击 samples/index.html 即可离线查看）与根目录 使用说明.md（一页三步）。
- 回归：Node 单元 59 项、真实 Chromium MV3 E2E 70 项全部通过（含明暗主题像素金标、JSON 往返、安全输入、快照过期与消息 schema 拒绝）；新用户走查、连续粘贴 ×3、取消后重试、2560×1440 噪声 PNG 仅 ZIP 归档（14.1MB→ZIP 2.1s）、4K 归档 ZIP 离线 0 网络请求实测。无新增权限、依赖或公开 Release。

# v0.7.0 · 2026-10-21

- 原尺寸PNG ZIP新增完整 `resources/original.png`，`notes.md` 只引用一张完整图；HTML分块与含全部资源的IR1.4往返保留，PNG格式可直接下载完整图。
- 新增主动选择的高熵PNG仅ZIP入口；独立资源、HTML、笔记、manifest与SHA-256，不创建JSON快照或会话，不提高IR/资源/会话预算。
- 修复Canvas预乘alpha造成的半透明与透明RGB量化：精确PNG分块/合成直接处理有界像素流。仅ZIP保留位深/隔行/颜色配置；灰度ICC分块明确拒绝。JPEG/WebP仍支持标准模式，精确模式明确拒绝。
- 修复CSSOM展开border简写后丢失单侧边框；补充圆角、overflow、columns和文字装饰展开属性，继续使用安全CSS值校验。
- 预览增加格式推荐和MathML块/行内、SVG、跨度表格、来源字体诊断。字形覆盖仍标为未验证，不生成LaTeX或下载字体。
- 真实MV3安装链路、半透明RGBA、4K整图、离线Markdown及明暗复杂布局验证；独立代码/安全/视觉审查发现的问题直接修复。无新增权限、依赖、模型或公开Release。

# v0.6.0 · 2026-10-20

- 九类自有复杂样本、六条输入渠道研究；新增真实 Chromium 富文本/纯文本/PNG Ctrl+V、相同语料区域捕获、独立离线和异常验证。
- Markdown 保留嵌套列表、起始编号/项目编号、引用、强调、行内代码和上下标；合并单元格使用净化后的 HTML 表格，保留 rowspan/colspan。
- MathML 保留 display 块/行内语义；SVG 继续保留本地矢量引用，无远程字体或公式服务。
- 新增可选原尺寸 PNG 分块归档，最高 840 万像素；不缩放、不用 JPEG；每块沿用 1MP/2MB base64，全部图片base64≤2.5MB、IR≤4MB。超预算明确拒绝，标准模式保留。
- IR1.4 新增安全属性 start/display，捕获列表 value；1.0–1.3 验证后显式迁移，未知版本拒绝，外部来源继续去信任。没有新增节点种类、配方、依赖、权限或来源脚本。
- 保留修改前证据，安装ZIP实际MV3复测与逐文件hash绑定；仅准备Release草稿，不公开发布。Windows/Obsidian/真实ChatGPT继续Unverified，详见本轮报告。

# v0.5.2 · 2026-10-20

- 三轮自主验收，以旧安装包复现五项体验问题：宽预览、重复文件入口、降级原因隐藏、截图质量提示隐藏、不可用图形格式误导。
- 预览默认适应窗口，提供100%与25–200%缩放，仅缩放隔离frame的显示；IR、来源布局与下载字节不变。
- 文件点击/键盘/拖放共用单一可见入口；转换期间禁用，取消/错误后恢复。
- Interactive需要确认时展开降级原因；截图原/保存尺寸及损失直接显示；不可用SVG/PNG提前禁用。
- 增加真实Ctrl+C/V富文本、缩放后指针/键盘、快速格式切换、损坏资源恢复、关闭扩展后独立离线浏览器、ZIP资源/hash验收；安装ZIP执行全部MV3场景。
- 版本、构建、CI和文档同步；无新权限、依赖、适配器、IR变更或公开Release。

# v0.5.1 界面升级 · 2026-10-20

- 选择精密工具方向；Popup导入优先，捕获设置渐进披露；Importer突出Ctrl+V；Preview来源优先、报告侧栏与独立滚动。
- 统一青绿/墨色浅深主题、系统字体、间距、44px普通控件、键盘焦点、错误与忙碌反馈；不改变导出内容视觉。
- 拖放入口原生按钮与键盘操作；修复无背景本地文字在系统深色模式下黑字深底的问题。
- 增加四项真实MV3界面回归、前后截图、Skills来源与设计审查；最终安装包执行同套新增检查。没有新增权限、依赖、格式、配方或公开Release。

# v0.5.1 · 2026-10-19

- 主项目导入页统一粘贴、选文件和拖放：截图、富文本、纯文本；仅前台 paste 事件读取本次数据，不增加权限。
- 受控截图预检、缩放与重编码；保留原/保存尺寸和损失说明，visual-only，HTML单文件及ZIP资源笔记；独立截图Markdown禁用。
- 复用现有隔离净化、IR1.3、固定模型、预览、策略、归档和资源hash，无独立工具代码或补丁直接执行。
- 隐私：完整模型预验证后才授予有限数值/隐藏捕获；竞态失败丢弃重捕；不修改来源DOM。授权绑定documentId，一次提交/取消/导航失效。
- 修复导入宽度单位、纯文本首行与Markdown空行保真；增加真实Ctrl+V、MV3粘贴/资源/失败恢复、隐私与授权负样本。
- 安装包独立MV3复测、CI和文档同步；Windows/Obsidian及真实ChatGPT样本验收保持Unverified，未发布Release。

# v0.5.0 · 2026-10-19

- 关闭式版本化 Adapter Registry、Source Adapter 契约；所有页面有限模型均需显式请求，路径/属性不授信，模型校验与来源等价证据分离。
- 新增 tabs@1、calculator@1（有界两数加法）、state@1（布尔双面板），与 Fourier/table/native-details 共用 IR、策略、校验和固定运行时。
- IR1.3、1.0/1.1/1.2 迁移，嵌套组件作用域与隐藏状态、ARIA/键盘、JSON 关闭来源往返。
- Popup 契约入口、紧凑预览操作栏和有界能力报告；只调整插件自身界面。
- 修复预检前候选扫描、重复 ID/ARIA、面板解析器重排、静态高度变更；增加跨结构/嵌套/攻击/视觉及最终安装包回归。
- 生成数据移至忽略目录与 CI Artifact，保留少量截图、指标和离线样本；历史证据不删除。Windows/Obsidian 仍 Unverified，Release 草稿不公开发布。

# v0.4.1 · 2026-10-19

- IR1.2与1.0/1.1迁移；外部JSON内置Fourier/table逐项有限模型验证、安全交互往返，清除来源/脱敏/等价声明。
- Auto自动局部恢复；Interactive零可恢复时拒绝、有未知组件需明确确认；Static全静态。HTML/ZIP核心统一策略校验及可审计诊断。
- JSON关闭源页往返、明暗像素、恶意声明/绑定/数值安全回归；安装ZIP全MV3独立复测；CI增加安装包验证。
- Windows/Obsidian当前未完成GUI实测，Release仅准备未发布。真实结果见 tests/TEST_REPORT.md。

# 变更清单

## v0.4.0 · 2026-10-18 · 源码交付，未创建 Release

基于 main `2e49833f5ecf37f6adf5a119bb904bf21ae6ef49`，原v0.3静态能力与证据保留。

- `core/interactions/recipes/runtime`：原生details、自有Fourier@1/table@1有限模型、组件/文件能力分析、未知行为静态降级。
- `core/ir` / schema：IR1.1行为与静态树分离、1.0迁移、严格参数/绑定/输出校验、外部JSON声明去信任与初始筛选冻结。
- `policy/render/archive`：修复CSS声明逃逸、固定CSP hash运行时、三种策略、单文件HTML、ZIP交互报告/JS/CSS副本与安全路径。
- 捕获器：已知fixture结构识别；保留details内容与状态；交互区动态高度，修复筛选状态的grid行高。
- Popup/preview/manifest：Auto说明、策略独立select、逐组件报告、无权限预览sandbox；权限不增加。
- build/CI/package版本：0.4.0、运行时hash生成、原有测试字节绑定打包；既有main CI已核实通过，当前分支按后续授权推送并合并，远端结果以 Actions 为准。
- tests/fixtures：三类与混合案例、实际HTML/ZIP离线行为、多个Fourier参数/独立数值校验、深浅色像素、恶意recipe/外部JSON/CSP/CSS/路径回归。完整结果见tests/TEST_REPORT.md。

不提供ChatGPT原生获取、任意网站交互复制、PDF或全局HTML截图；UNLICENSED保持。

## v0.3.0 · 2026-10-18

基于 main `4a494540c46080e4034744418638d4436c77cb9a`，保留 v0.2 选择流程与历史资产。

- `extension/src/capture/`：拆分选择器和捕获器，独立重试/取消状态、有界预检、SVG引用、MathML、简单伪元素、开放Shadow、滚动偏移和2D根变换。
- `extension/src/core/`：IR1.0.0、严格净化/契约、编码图片像素预检、资源SHA-256、纯格式渲染、独立诊断、ZIP CRC32/manifest、会话限额。
- `extension/background.js` / manifest：ESM后台、严格消息来源/schema/尺寸、串行session存储。权限只新增必要的storage，未添加持久网站授权。
- `extension/import*` / `src/import-sandbox.js`：本地HTML/SVG/JSON/栅格导入；无扩展权限的隔离解析；有时限Worker。
- Popup/preview/ui：沿用现有紧凑样式，增加来源入口、格式切换、能力/遗漏、失败恢复，解决快速切格式结果竞争。
- `scripts/`：轻量构建、schema生成、前后字节一致的完整测试、拒绝未验证包的确定性打包。
- `tests/` / `fixtures/complex-components.html`：保留原9项语义，增加离线导入、往返、ZIP/hash、SW真实重启、过期、重试隔离、攻击/压力与多视口主题golden；修复独立审查发现的CSS图片语法、尺寸必填、宽DOM队列、根变换问题。
- `.github/workflows/ci.yml`：安装/语法与schema/单元/MV3/audit/包校验及证据上传；远端运行尚未验证。
- README、项目书、架构/设计/保真/安全/依赖/研究与测试报告统一当前事实；UNLICENSED保持。

历史 v0.2 dist 与 tests/evidence 保留。v0.3自动中间文件不反复提交；只保留精选真实验收证据。未实现ChatGPT采集、官方账户包专用适配、原生交互恢复或PDF。
