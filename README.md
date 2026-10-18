# Intelligent UI Portability Lab · v0.2

接手 v0.1 后的本地静态组件保存工具。**HTML 优先保留来源样式，不重排成聊天卡片。所有格式能力等级均为 `static`，不含原始交互。** 与 OpenAI 无关联，ChatGPT 站点仍被明确阻止。

## 安装与完整操作

1. Chrome 打开 `chrome://extensions`，启用开发者模式，加载本目录的 `extension/`。更新已有安装时点击扩展的“重新加载”，刷新测试网页。Edge 的入口为 `edge://extensions`，本轮未实测 Edge。
2. 在项目目录运行 `python3 -m http.server 8765 --bind 127.0.0.1 --directory fixtures`，打开 `http://127.0.0.1:8765/interactive-demo.html`。Windows 可在该目录运行 `py -m http.server 8765 --bind 127.0.0.1 --directory fixtures`。
3. 点击工具栏扩展图标，选择 HTML（默认），点击“选择页面区域”。Popup 会关闭，选择器继续留在原页。
4. 移动指针，高亮候选区域；点击标题也会优先选择最近的 section/SVG/表格等容器。点击锁定，↑ 扩大到父容器，↓ 返回刚才的子区域；Enter 或“捕获并预览”执行；Esc 或“取消”退出。选错后可取消重开。
5. 新标签页显示预览、尺寸、`static` 和差异清单。检查后点击“下载文件”，在浏览器下载列表确认完成，再打开本地 HTML。另可下载不含正文的报告 JSON。
6. Markdown 可放入 Obsidian，JSON 是净化后的快照数据；SVG 仅可选择 SVG 根。测试公式与网格可打开 `http://127.0.0.1:8765/golden-components.html`。

仅在你有权保存的本地或普通 HTTP(S) 页面使用。浏览器内部页、扩展商店、PDF 查看器等可能禁止注入。直接 `file://` 页面暂不支持，请用上面的 localhost。用户点击不自动授予网站程序化提取许可。

## 格式与限制

| 格式 | 已实现 | 明确限制 |
|---|---|---|
| HTML | 计算样式、固定原区域尺寸、SVG 几何/颜色、安全内嵌图片、可读取 Canvas PNG | 无原站脚本；外部字体/图片、伪元素、Shadow DOM、iframe、SVG 渐变/裁剪引用等有遗漏 |
| Markdown | 标题、段落、列表、基本表格、公式文本、控件状态描述 | 不保留复杂布局或图形；未实测 Obsidian 应用渲染；不把 MathML 线性文字称为公式保真 |
| JSON | `static-snapshot`，净化 HTML/文字、尺寸、统计、遗漏 | 尚非组件 IR，也不含原始模型/事件数据 |
| SVG | 安全原生 SVG 根及 static 元数据 | 无 foreignObject、活动内容和资源引用；字体不嵌入 |

静态滑块值/勾选外观可以保留，但没有交互恢复证据，所以不标记 `state-preserved`。按钮禁用。PNG/PDF/导出 ZIP/交互重建/官方数据包导入尚未实现。发布包 ZIP 是工程交付包，并非插件新增导出格式。

捕获最多 5000 个访问节点、75 层、100 万文本字符、单边 12000px；3 秒节点遍历预算；总消息 12,000,000 UTF-8 字节。超限显示错误而不下载半成品。预览只在后台内存保存至多 3 份，10 分钟到期在后续请求时清理；后台休眠/重启可能更早丢失，重新捕获即可。

## 测试与打包

在 WSL/Linux 使用 Node 24、Python 3：

```bash
npm ci
npx playwright install chromium
npm test
npm run package
```

Linux 缺浏览器系统库时根据 Playwright 提示安装依赖。`npm test` 包含权限/语法检查和真实 MV3 E2E（测试中调用真实工具栏 Popup，未伪造 chrome API 或 activeTab 授权）。浏览器使用 Playwright 完整 Chromium channel；`CHROMIUM_PATH` 可指定支持对应 CDP 接口的 Chromium。测试自动启动 localhost:18787；已有该端口服务须确为本项目 fixtures。`python3 tests/browser-smoke.py` 是保留的旧入口，现转调同一 E2E。旧版故障复现：先启动 18787 fixture 服务，再运行 `node tests/regression.mjs`。

实测 Chrome for Testing 156.0.8078.4，Linux；8 项扩展测试及 1 项页面引擎测试通过。普通 Chrome 稳定版人工安装、Windows/Edge、商店审核与真实 ChatGPT 兼容没有通过声明。详见 [测试报告](tests/TEST_REPORT.md)，截图/像素数据/实际导出在 `tests/evidence/`。

## 文档与安全边界

- [核心项目书](PROJECT_PROPOSAL.md)：已确认决策与分期范围。
- [逐文件审计](docs/AUDIT.md)、[设计规范](docs/DESIGN_SPEC.md)、[竞品研究](docs/RESEARCH.md)。
- [实际架构](docs/ARCHITECTURE.md)、[保真矩阵](docs/FIDELITY_MATRIX.md)、[安全与合规](docs/SECURITY_AND_COMPLIANCE.md)、[许可证清单](docs/DEPENDENCIES.md)。

扩展无网络采集、cookie/token 访问、持久站点权限、远程可执行代码或云服务。文本输入、密码、选择框、可编辑内容脱敏；这不等于自动识别普通段落或 Canvas 图片里的秘密，下载前仍需检查预览。漏洞防护已做针对性测试，尚无独立安全审计。
