# Intelligent UI Portability Lab · v0.4.1

本地浏览器扩展：保存有权处理的页面区域，或导入自己的 HTML、SVG、JSON、PNG/JPEG/WebP 文件，检查静态外观与遗漏，再下载。HTML 优先保留来源视觉，不套品牌卡片；不上传内容。

**当前支持选择性交互：浏览器原生折叠，以及项目自有、已验证的 Fourier 图表和筛选排序表格。未知行为静态降级，图片 `visual-only`。不复制来源脚本或完整响应式规则；ChatGPT 自动提取仍禁用。** 长期目标与当前能力见 [项目书](PROJECT_PROPOSAL.md)。

当前交付入口：本轮本地 `dist/v0.4.1/` 的 extension/source ZIP、`SHA256SUMS` 和 `package-manifest.json`（先 `npm test && npm run package` 可重建）。源码更新按验证后提交、推送、合并的流程交付；尚未发布 v0.4.1 Release；历史 v0.2/v0.3 ZIP 仅供追溯，不是最新版。

安装包尚未公开发布；仓库最新源码入口为 [main](https://github.com/yunmin311/intelligent-ui-portability-lab/tree/main)，正式说明与文件清单见 [v0.4.1 Release 草稿](docs/RELEASE_NOTES_0.4.1.md)。Windows Chrome/Edge 与 Obsidian GUI 当前 Unverified，按[人工验收步骤](tests/MANUAL_ACCEPTANCE.md)验证。

## 安装与使用

解压 extension 安装包，在 Chrome `chrome://extensions` 或 Edge `edge://extensions` 打开开发者模式，加载包内 `extension/` 文件夹。源码中的 `extension/` 也可直接加载；修改 `extension/src/` 后需执行 `npm ci && npm run build`，再重载扩展。最低声明 Chromium 114；实际运行验证版本与平台见 [测试报告](tests/TEST_REPORT.md)，不把最低声明当兼容性实测。

1. 在自己的页面点击扩展 → 选择格式 → **选择页面区域**。悬停预选，点击锁定，↑/↓ 扩大或缩小到容器，Enter 捕获，Esc 取消。失败后可重试；重复注入清理旧选择器。
2. 或点击 **导入本地文件**，选择/拖入一个文件。HTML/SVG 在隔离页净化后处理；JSON 必须符合本项目 IR。宽度选项仅控制 HTML 文件解析视口。
3. 预览显示隔离的原貌与受支持交互；检查组件能力、差异和遗漏，选择 Auto（默认）/ Interactive / Static 策略，再选格式下载。**JSON 是含正文的完整快照；下载遗漏报告只含诊断信息。** 浏览器是否完成保存请看下载列表。
4. 下载后本地打开 HTML；ZIP 先解压再打开 `index.html`。Markdown 可放入 Obsidian，复杂图形有降级提示。没有自动写入 vault 的权限。

仅对明确允许处理的网页使用。普通段落、图片和 Canvas 中的秘密不能自动识别，下载前必须检查。无需登录本产品。

## 格式与范围

| 格式 | 已实现范围 |
|---|---|
| HTML | 固定尺寸、来源计算样式、净化结构、内嵌安全图片；仅原生行为与产品自有有限运行时，无原站 JS |
| Markdown | 标题/列表/表格等语义；复杂 SVG/MathML 明确指向 HTML 导出，阅读器支持有差异 |
| JSON | IR 1.2.0，可校验、重导入；1.0/1.1 显式迁移，外部已知配方逐项独立验证并清除来源等价声明；v0.2 static-snapshot 只通过隔离 HTML 迁移 |
| SVG | 仅所选根元素为 SVG；HTML 容器不冒充矢量导出 |
| PNG | SVG 根元素或导入图片；不提供任意 HTML 截图 |
| ZIP | HTML、IR、Markdown、已有资源、manifest、SHA-256、独立诊断、交互报告、受控运行时审阅副本；不抓跨域资源 |

MathML、开放 Shadow DOM、简单文本伪元素、滚动偏移均有静态处理与限制说明。详见 [保真矩阵](docs/FIDELITY_MATRIX.md)。PDF、任意第三方交互恢复、官方账户包专用解析尚为 Proposal。

## 交互策略与信任边界

Auto 自动恢复通过本地安全模型验证的交互，其余静态降级。Interactive 没有可恢复交互时禁止下载；有未知组件时必须勾选“确认不可恢复组件静态降级”才能下载。Static 禁止全部行为，包括原生折叠。HTML/ZIP 支持策略；其他格式仍静态。报告逐组件区分 `native-preserved`、`reconstructed-tested`、`model-validated`、`static-fallback`；文件区分 `selective-interactive`、`partial-interactive`、`static` 或 `visual-only`。

自有 recipe 仅在 HTTP loopback 的 `/selective-interactions.html` 页面识别，并验证有限结构、状态与曲线模型；路径是测试来源约定，不是所有权认证或第三方通用适配。JSON 导入只允许内置 Fourier@1、table@1 通过独立结构、参数、绑定、输出与资源校验后使用项目固定运行时。其能力标记为 model-validated，绝不继承来源等价、来源身份或脱敏声明。未知或不匹配的配方静态降级并列出原因；不安全结构或资源拒绝整个文件。原生 details 不需要来源脚本；懒加载内容可能缺失。

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

`npm test` 执行打包、语法/权限/schema 检查、Node 单元测试和真实 Chromium MV3 E2E。测试通过记录扩展逐文件 hash；`npm run package` 拒绝未测或变动的扩展，输出 `dist/v0.4.1/` 下源码与安装 ZIP、manifest 和 SHA256SUMS。构建信息记录基准提交、工作区修改标志、运行文件 hash；以实际文件 hash 为准，不把脏工作区标为纯提交构建。

```sh
python3 -m http.server 8765 --directory fixtures
```

浏览器打开 `http://localhost:8765/interactive-demo.html` 或 `complex-components.html` 或 `selective-interactions.html`，手动完成选择→预览→下载→打开。自动测试另用 18787 端口，实际工具栏 Popup 交互，无授权 mock。临时截图在 `tests/artifacts/v0.4.1/`；保留的验收证据在 `tests/evidence/v0.4.1/`。

完整往返：在自有 `selective-interactions.html` 选取混合区域并保存 JSON → 关闭来源页 → 从 Popup 导入 JSON → 选择 HTML 或 ZIP → Interactive 时按提示确认部分降级 → 下载后离线操作滑块、筛选、排序和折叠。JSON 不存源代码；验证的是固定模型，不能证明任意外部来源行为等价。

## 安全与工程资料

权限仅 `activeTab`、`scripting`、`storage`。storage 仅供受信扩展上下文使用会话内存，最多3份/7.5 MB估算/10分钟访问有效期，后台重启可恢复；扩展重载、禁用、更新或浏览器重启清空。物理过期清理由下一次访问触发。无 cookies、webRequest、持久站点授权、远程执行代码或后端。

- [架构与 IR](docs/ARCHITECTURE.md) · [JSON Schema](docs/snapshot.schema.json)
- [设计规范](docs/DESIGN_SPEC.md) · [研究与技术比较](docs/RESEARCH.md)
- [安全与合规 Gate](docs/SECURITY_AND_COMPLIANCE.md) · [依赖和许可选择](docs/DEPENDENCIES.md)
- [测试、截图和剩余限制](tests/TEST_REPORT.md) · [变更清单](CHANGELOG.md)

许可证保持 `UNLICENSED`：公开可见不代表授予复用许可。MIT、Apache-2.0 或保留所有权由所有者决定；未擅自改变授权。v0.2 历史证据和发布资产保留；提交、推送和合并已获授权；发布 Release 或商店仍需单独授权。
