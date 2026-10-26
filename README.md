# Intelligent UI Portability Lab · v0.7.1

本地浏览器扩展：保存有权处理的页面区域，或主动粘贴截图、富文本、纯文本，导入自己的 HTML、SVG、JSON、PNG/JPEG/WebP、TXT/MD 文件，检查静态外观与遗漏，再下载。HTML 优先保留来源视觉，不套品牌卡片；不上传内容。

**Decision：当前支持浏览器原生折叠，以及经明确受控契约和有限模型校验的 Fourier、表格、标签页、加法计算、布尔面板切换。未知行为静态降级，图片 `visual-only`。不复制来源脚本或完整响应式规则；ChatGPT 自动提取仍禁用。** 长期目标与当前能力见 [项目书](PROJECT_PROPOSAL.md)。

当前交付入口：本轮本地 `dist/v0.7.1/` 的 extension/source ZIP、`SHA256SUMS` 和 `package-manifest.json`（先 `npm test && npm run package` 可重建）。源码更新按验证后提交、推送、合并的流程交付；未公开发布 v0.7.1 Release；历史 v0.2/v0.3 ZIP 仅供追溯，不是最新版。

安装包不通过公开 Release 发布；源码入口为 [main](https://github.com/yunmin311/intelligent-ui-portability-lab/tree/main)，CI 的 `v070-verification` 工件包含安装 ZIP、源码 ZIP、manifest 与 SHA-256。最终结果见[测试报告](tests/TEST_REPORT.md)，[本轮截图与离线样例](tests/evidence/v0.7.0/index.html)。Windows Chrome/Edge 与 Obsidian GUI 仍 Unverified；Linux Chromium 的实际剪贴板、安装扩展与离线浏览器实测单独记录。

v0.7.1 面向首次使用者完成产品化打磨：粘贴/文件导入统一 16px 中性基准字体（不再泄漏宿主默认 12px 衬线体），MathML 不再钉死盒尺寸、离线字体差异不会压扁分数与根式；捕获时将相同的继承值显式写为 inherit，并省略不可见边框声明，在保留浏览器默认样式覆盖的前提下减少冗余；长文（约 3 万字 / 6 万 px）不再被 12000px 高度上限误拒。界面文案去术语化（能力徽章、格式与策略选项改为中文直述），导出文件名使用本地时间、标题取正文首个标题。新增 [samples/](samples/index.html) 离线样例入口（复杂富文本、已验证交互、4K 截图 ZIP，双击即可查看，均为合成内容）与根目录 [使用说明.md](使用说明.md)（一页三步）。真实 Chromium 全链路新用户走查、像素金标、暗色主题、连续粘贴/取消重试、噪声 PNG 仅 ZIP 归档全部实测通过。

v0.7.0 修复 CSSOM 边框丢失；PNG ZIP 同时提供完整图片与笔记单图引用；高熵 PNG 可主动选择仅 ZIP 模式。半透明和完全透明像素的 RGB 不经 Canvas 重绘。现有精密工具界面与有限交互保持，预览增加格式推荐、数学与字体诊断。

## 安装与使用

解压 extension 安装包，在 Chrome `chrome://extensions` 或 Edge `edge://extensions` 打开开发者模式，加载包内 `extension/` 文件夹。源码中的 `extension/` 也可直接加载；修改 `extension/src/` 后需执行 `npm ci && npm run build`，再重载扩展。最低声明 Chromium 114；实际运行验证版本与平台见 [测试报告](tests/TEST_REPORT.md)，不把最低声明当兼容性实测。

1. 点击扩展 → **手动粘贴 / 导入文件**。从来源页面复制文字、富文本或使用系统截图，在导入页按 **Ctrl+V**；也可点击同一个文件入口（键盘 Enter/Space）或拖入一个文件。转换后自动打开预览，可取消、重试和继续粘贴。HTML/SVG隔离净化，纯文本按字面保存，JSON沿用IR1.4往返。解析宽度在折叠设置中。
2. 如需捕获允许处理的网页，点击 **选择页面区域**。默认格式与受控契约在“页面捕获设置”中；有限模型仍须明确勾选。悬停预选，点击锁定，↑/↓扩大/缩小，Enter捕获，Esc取消；失败可重试。
3. 预览显示隔离的原貌与受支持交互，默认适应窗口；可切换 100% 或 25–200% 检查细节（只改变显示，不改变下载尺寸与状态）。检查组件能力、差异和遗漏，选择 Auto（默认）/ Interactive / Static 策略，再选格式下载。**JSON 是含正文的完整快照；下载遗漏报告只含诊断信息。** 浏览器是否完成保存请看下载列表。
4. 下载后本地打开 HTML；ZIP 先解压再打开 `index.html`。Markdown 可放入 Obsidian，复杂图形有降级提示。标准截图可选 ZIP，将 `notes.md` 与 `resources/` 一起放入 Obsidian；原尺寸 PNG 的 `notes.md` 只引用 `resources/original.png` 一张完整图片，HTML 可继续分块显示；单独 Markdown 对截图禁用，避免失效链接。没有自动写入 vault 的权限。

**从 ChatGPT 手动复制/截图 → 扩展导入页 Ctrl+V → 预览 → HTML/ZIP → 本地打开**无需测试服务器或编辑 JSON。扩展不会因此访问 ChatGPT 网页；自动捕获 Gate 继续禁用。实际 ChatGPT 用户样本尚未提供，本轮使用明确标记的合成内容验证链路。

图片默认标准模式：输入 PNG/JPEG/WebP ≤16 MB / 4000 万像素 / 单边16384，输出≤100万像素，必要时 JPEG 有损压缩。精确原尺寸归档仅接受 **PNG**，≤840万像素、单边12000：

- **原尺寸无损快照**：支持8位非隔行 PNG（不含灰度ICC）；原图≤8.4MP、单边≤12000；分块≤100万像素/2MB base64，全部图片base64≤2.5MB、IR≤4MB，JSON包含全部资源，可独立往返。HTML分块显示，ZIP另含完整 PNG 和单图笔记，预览可直接下载完整 PNG。
- **仅 ZIP 无损归档**：适合高熵图片及16位/隔行/灰度 ICC PNG；保留原 PNG 像素与颜色配置，去除文字、EXIF等元数据。输入仍≤16MB、≤8.4MP、单边≤12000，完整PNG≤36MB；独立资源不进入IR或会话，**没有JSON快照，不能JSON往返**。直接下载ZIP，解压后打开 `index.html` 或 `notes.md`。

超预算、动画PNG、无法安全保真的分块输入明确拒绝，不自动降低质量。JPEG/WebP精确归档会明确拒绝；可选标准模式或自行转换PNG。灰度ICC分块拒绝并引导仅ZIP，避免色彩配置失效。两种归档均只保存视觉，不能从图片恢复文字或交互，也不能恢复输入已有的压缩损失。颜色配置保留，其他元数据去除；不保证原文件字节相同。


仅对明确允许处理的网页使用。普通段落、图片和 Canvas 中的秘密不能自动识别，下载前必须检查。无需登录本产品。

## 格式与范围

| 格式 | 已实现范围 |
|---|---|
| HTML | 固定尺寸、来源计算样式、净化结构、内嵌安全图片；仅原生行为与产品自有有限运行时，无原站 JS |
| Markdown | 标题/列表/表格等语义；复杂 SVG/MathML 明确指向 HTML 导出，阅读器支持有差异 |
| JSON | IR 1.4.0，可校验、重导入；1.0/1.1/1.2/1.3 显式迁移，外部已知配方逐项独立验证并清除来源等价声明；v0.2 static-snapshot 只通过隔离 HTML 迁移 |
| SVG | 仅所选根元素为 SVG；HTML 容器不冒充矢量导出 |
| PNG | ≤100万像素的SVG根，或单个PNG资源图片根；精确原尺寸PNG分块可合成完整PNG；不提供任意HTML截图 |
| ZIP | HTML、IR、Markdown、已有资源、manifest、SHA-256、独立诊断、交互报告、受控运行时审阅副本；原尺寸PNG另含完整图；仅ZIP模式无IR；不抓跨域资源 |

MathML、开放 Shadow DOM、简单文本伪元素、滚动偏移均有静态处理与限制说明。详见 [保真矩阵](docs/FIDELITY_MATRIX.md)。PDF、任意第三方交互恢复、官方账户包专用解析尚为 Proposal。

## 交互策略与信任边界

Auto 自动恢复通过本地安全模型验证的交互，其余静态降级。Interactive 没有可恢复交互时禁止下载；有未知组件时必须勾选“确认不可恢复组件静态降级”才能下载。Static 禁止全部行为，包括原生折叠。HTML/ZIP 支持策略；其他格式仍静态。报告默认显示计数，详细证据、遗漏与限制折叠且有界滚动；Interactive 要求降级确认时自动展开组件及原因。不可用 SVG/PNG 提前禁用并说明，截图原/保存尺寸与画质损失直接显示。报告逐组件区分 `native-preserved`、`model-validated`、`static-fallback`；`reconstructed-tested` 是保留的历史证据能力，不是新捕获的来源证明；文件区分 `selective-interactive`、`partial-interactive`、`static` 或 `visual-only`。

所有网页有限模型捕获均须在 Popup 明确勾选受控契约，含本地 fixture；没有按域名或路径自动授信。未勾选时只做通用 DOM 捕获及安全原生折叠。勾选表示请求验证内置模型，不证明页面身份、所有权、许可或来源行为等价。实捕行为证据均为 `model-validated-v1`，真实 fixture 等价性只记录于测试报告。外部 JSON 独立验证内置模型后也仅为 `model-validated`，不继承来源、等价或脱敏声明。详见 [架构](docs/ARCHITECTURE.md)。

## 本地验证与构建

使用 Linux/WSL 的 Node 24、Python 3.12；首次安装：

```sh
npm ci
npx playwright install --with-deps chromium
npm test
npm audit --audit-level=high
npm run package
npm run test:package
```

`npm test` 执行打包、语法/权限/schema 检查、Node 单元测试和真实 Chromium MV3 E2E。测试通过记录扩展逐文件 hash；`npm run package` 拒绝未测或变动的扩展，输出 `dist/v0.7.1/` 下源码与安装 ZIP、manifest 和 SHA256SUMS。构建信息记录基准提交、工作区修改标志、运行文件 hash；以实际文件 hash 为准，不把脏工作区标为纯提交构建。

```sh
python3 -m http.server 8765 --directory fixtures
```

浏览器打开 `http://localhost:8765/interactive-demo.html` 或 `complex-components.html` 或 `selective-interactions.html`，手动完成选择→预览→下载→打开。自动测试另用 18787 端口，实际工具栏 Popup 交互，无授权 mock。本轮临时截图在 `tests/artifacts/v070-after/`，安装包复测在 `tests/artifacts/v0.7.0-installed/`；保留的验收证据在 `tests/evidence/v0.7.0/`。

完整往返：在自有 `selective-interactions.html` 或 `adapters-composite.html` 勾选受控契约后选取混合区域并保存 JSON → 关闭来源页 → 从 Popup 导入 JSON → 选择 HTML 或 ZIP → Interactive 时按提示确认部分降级 → 下载后离线操作滑块、筛选、排序和折叠。文件和粘贴共用隔离、IR验证、预览与渲染，无第二套生产导出器。JSON 不存源代码；验证的是固定模型，不能证明任意外部来源行为等价。

## 安全与工程资料

权限仅 `activeTab`、`scripting`、`storage`。storage 仅供受信扩展上下文使用会话内存，最多3份/7.5 MB估算/10分钟访问有效期，后台重启可恢复；扩展重载、禁用、更新或浏览器重启清空。物理过期清理由下一次访问触发。无 cookies、webRequest、持久站点授权、远程执行代码或后端。

- [架构与 IR](docs/ARCHITECTURE.md) · [JSON Schema](docs/snapshot.schema.json)
- [设计规范](docs/DESIGN_SPEC.md) · [研究与技术比较](docs/RESEARCH.md)
- [安全与合规 Gate](docs/SECURITY_AND_COMPLIANCE.md) · [依赖和许可选择](docs/DEPENDENCIES.md)
- [交接材料审计](docs/V051_HANDOFF_AUDIT.md)
- [测试、截图和剩余限制](tests/TEST_REPORT.md) · [变更清单](CHANGELOG.md)

许可证保持 `UNLICENSED`：公开可见不代表授予复用许可。MIT、Apache-2.0 或保留所有权由所有者决定；未擅自改变授权。v0.2 历史证据和发布资产保留；提交、推送和合并已获授权；发布 Release 或商店仍需单独授权。

状态约定：Decision 为当前实现决策；Proposal 为尚未实现的后续能力；Exploration 为技术比较；Deprecated 为历史实现。SnapDOM 仍属 Exploration，仅开发对照；旧 v0.2/v0.3/v0.4.x 发布说明与截图属于历史，不是当前安装入口。
