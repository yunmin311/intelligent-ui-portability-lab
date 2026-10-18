# v0.3 验收报告

日期：2026-10-18。审查基线：main `4a494540c46080e4034744418638d4436c77cb9a`（开始前已 fetch，未发现更新）。工作分支：`work/v0.3-portable-snapshots`。v0.2 原有源码历史、证据和发行资产保留。

**结果：PASS。10 项单元测试 + 15 项浏览器测试全部通过；最终安装 ZIP 解压后另有 2 项真实 MV3 测试通过。依赖审计报告 0 漏洞。**

## 运行与证据

本地环境：WSL2 Ubuntu-24.04、Node 24.21.0、Playwright 1.64.1、Chromium **156.0.8078.4 / Linux**。测试扩展 manifest 0.3.0，最低声明 Chrome 114；声明最低版本不等于已经在该版本验收。

完整执行 `npm test`：静态语法/权限检查、schema 同步检查、**10 项 Node 单元测试和 15 项浏览器测试**。其中 **14 项为真实 MV3 扩展测试、1 项为普通页面选择器回归**。结果以 [完整日志](evidence/v0.3/final-test.log)、[运行版本](evidence/v0.3/runtime.json)和[已测扩展逐文件 hash](evidence/v0.3/verified-build.json)为准。依赖检查见 [npm audit](evidence/v0.3/npm-audit.json)。构建不会加载远程执行代码，产品无运行时 npm 依赖。最终扩展 build-info 关联源码提交 `b1c08592d4262a9259548fb0a6777c178d97d70e`，构建时工作区干净；后续提交仅补充构建记录与对应验收证据。

测试以 persistent Chromium 实际加载 unpacked extension，CDP `Extensions.triggerAction` 触发真实工具栏 Popup、授予 activeTab；在真实 Popup DOM 操作按钮，没有 mock Chrome 权限或消息 API。随后进行区域指针/键盘操作、扩展预览、真实 download event、检查下载失败、写盘并打开 file://。这不是 Windows 桌面鼠标操作托盘的人工验收。测试参数 `--enable-unsafe-extension-debugging` 仅用于浏览器测试，不进入产品。

## 验收矩阵

| 项目 | 实际验证 |
|---|---|
| 主链路 | Popup → 语义容器选择 → 捕获 → IR 校验 → 预览 → 下载 HTML → 从磁盘打开；表格文字/结构与离线零 HTTP(S) 请求断言 |
| 选区与取消 | 父/子容器切换、Esc、重复注入、切换 tab、捕获中取消；不叠 Overlay |
| 重试隔离 | 故意构造过大资源使捕获失败，移除后重试；资源与遗漏状态不携带前次失败 |
| IR | 1.0.0 序列化往返、严格 schema、未知字段/版本拒绝；v0.2 HTML 迁移入口必须重新沙箱净化；拒绝未经证据支持的交互能力 |
| 本地文件 | 恶意 HTML 隔离转换、导出 HTML 再导入的语义往返、JSON 等值往返、SVG 渐变、PNG 导出与重导入 visual-only、非法 JSON 后恢复 |
| 数据安全 | 事件/script/foreignObject/危险 URL/CSS image-set、输入和 contenteditable 脱敏、隐藏内容、属性注入、畸形尺寸、超大文本/树/资源；图片 header 尺寸预检及浏览器解码校验 |
| 消息与存储 | 非法来源/schema 拒绝、真正终止 SW target 再启动恢复快照、10 分钟过期禁用、容量/预算/清理单元测试；未新增持久站点权限 |
| 报告隔离 | 诊断 JSON 不含 tree、HTML、正文和资源二进制；完整 snapshot JSON 另行标注 |
| 导出与归档 | HTML/MD/JSON/SVG/适用 PNG；ZIP CRC、清单 SHA-256、资源 hash、Python 解包后离线打开无 HTTP(S) 请求 |
| UI 异步竞争 | 快速切换 ZIP/JSON，旧任务不能覆盖新结果；实际 JSON 扩展名与内容匹配 |
| 复杂组件 | Grid/Flex、中文、SVG 坐标轴/渐变/裁剪、MathML、开放 Shadow DOM、简单文本伪元素、Canvas、控件当前值、嵌套滚动 |
| 有界失败 | 20,000 宽 DOM 在 5,000 节点预检失败，80 层深 DOM 被拒绝；入栈即计数、可协作取消；根 2D transform 尺寸回归 |
| 合规 Gate | 模拟 chatgpt.com 的真实 Popup 显示禁用；内部浏览器页面拒绝；未登录真实平台，未访问私有接口 |

[预期失败截图](evidence/v0.3/failure-node-limit.png)是宽 DOM 超限后的真实错误提示，并非崩溃后伪造的成功截图。Playwright 配置同时保存意外失败截图。fixture 和恶意样本全部为本项目本地测试内容。

## 视觉比较

[原图/导出数值](evidence/v0.3/complex-diff.json)：同一浏览器、viewport、状态、字体就绪条件，逐像素比较来源和实际 HTML 导出。任一 RGB 通道差值超过 16 计为变化。未替换 golden 来掩盖差异，也未强制缩放截图对齐。

| viewport / theme | 截图尺寸 | 变化像素比例 | 平均通道绝对差（0–255） |
|---|---|---|---|
| 1200 / light | 920×389 | 0.2311% | 0.22765 |
| 1200 / dark | 920×389 | 0.2328% | 0.16961 |
| 640 / light | 592×588 | 0.2376% | 0.23100 |
| 640 / dark | 592×588 | 0.2373% | 0.17126 |

复杂样本门槛：变化比例 <4%、平均通道差 <4；表格门槛 <1.5% / <2，实测变化比例 0、平均差约 0.0583，见 [table-diff.json](evidence/v0.3/table-diff.json)。来源控件可操作、导出控件禁用，会产生局部像素差；缺失字体的回退在来源与导出中都存在，不宣称恢复了缺失字体。比较证明这些固定条件样本，不证明任意网页无损或完整响应式行为恢复。

真实图片：[来源浅色](evidence/v0.3/complex-1200-light-source.png)、[对应 HTML 导出](evidence/v0.3/complex-1200-light-export.png)、[窄屏暗色](evidence/v0.3/complex-640-dark-export.png)、[Popup](evidence/v0.3/popup.png)、[导入入口](evidence/v0.3/importer.png)、[预览](evidence/v0.3/preview.png)。完整四组来源/导出截图均在 evidence/v0.3。

SnapDOM 3.3.4 对照：[复杂样本](evidence/v0.3/snapdom-complex.json)同尺寸变化比例 1.7162%、平均差 0.63923；[表格对照](evidence/v0.3/snapdom-comparison.json)出现 1px 尺寸差，且 foreignObject/普通输入敏感值捕获与本产品安全边界不符。Decision：保持仅开发测试依赖，未纳入扩展捕获器。不能把本样本结果推广成对该库所有场景的优劣结论。

## 可复现命令

```bash
npm ci
npx playwright install chromium
npm test
npm audit --audit-level=high
npm run package
```

Linux 缺系统库时按 Playwright 安装依赖。`npm test` 在测试前构建，并验证测试期间扩展逐文件 hash 未变；打包脚本拒绝缺少或不匹配的测试证明。发行目录 `dist/v0.3.0/` 包含扩展 ZIP、源码 ZIP、SHA256SUMS、package-manifest.json。扩展 ZIP 解压后加载其 extension/；仓库本身也可直接加载 extension/。针对解压安装包再运行两项主链路/本地导入 MV3 测试，日志见 [package-smoke.log](evidence/v0.3/package-smoke.log)。

```bash
UIP_EXTENSION_PATH=/absolute/extracted/extension \
UIP_EVIDENCE_DIR=/absolute/separate-evidence \
npx playwright test tests/mv3.spec.mjs --output=/absolute/separate-results \
  --grep 'real toolbar Popup|local HTML hostile'
```

人工验收：加载扩展后刷新来源页，按 README 启动 fixtures 服务；选择协议表格并下载打开 HTML；调滑块后保存当前图形（不可继续运算）；从 Popup 进入本地导入，提供 HTML/SVG/JSON/PNG，查看遗漏并分别下载完整快照和纯诊断。取消浏览器下载或组织策略阻止时，查看浏览器下载列表；无 downloads 权限，UI 仅承诺已发起请求。

## 完成程度与限制

- **Implemented / Tested：** 模块化捕获、IR 1.0.0、离线文件入口、会话恢复、严格安全契约、静态多格式与 ZIP、上述本地自动化和视觉证据。原有 9 项测试语义保留并扩展。
- **Blocked：** ChatGPT 原生数据/组件树/交互代码不存在本项目已确认授权的公开获取路径，Gate 保留；官方账户数据包适配缺真实授权样本。
- **Unverified：** Chrome/Edge Windows、Chrome 114、其他浏览器版本、远端 GitHub Actions（本轮未获推送授权）、商店、Obsidian 应用实际渲染、完整读屏/模糊测试。CI 配置已实现，不宣称远端执行成功。
- **Proposal：** PDF、专用交互恢复与输入输出等价测试。当前不产生 state-preserved / reconstructed-tested；截图仅 visual-only。
- 有限支持开放 Shadow DOM、简单文本伪元素、2D 根变换；复杂伪元素、closed Shadow、iframe、外部图片/字体、3D 变换、虚拟列表、动画、实时运算仍有遗漏。Markdown 对复杂视觉明确降级。SVG/PNG 仅对受支持图形导出，普通任意 HTML 没有 PNG 截图回退。
- 单次浏览器同步 computedStyle/Canvas/解码调用没有硬中断保证；DOM 遍历分批取消、节点/尺寸/资源限额已实现。未测真实进程内存峰值，不将时间检查称为强制超时。导入超时会移除沙箱/终止 Worker。
- 正文、图片和 Canvas 中的敏感信息无法自动完整识别；来源只保存脱敏 origin，用户仍需检查预览。session 逻辑过期 10 分钟，物理清理发生于访问/预览定时检查；不承诺准点擦除。
- 许可证仍为 UNLICENSED；候选依据见 docs/DEPENDENCIES.md，等待用户决定后才能更改授权。

v0.2 历史结果保存在原 evidence/ 与 Git 历史；其中内存预览、未实现文件导入等旧结论已由本报告取代，不能混用为 v0.3 限制或证据。
