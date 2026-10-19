# v0.5.0 Release 草稿 · Decision：本地交付，未公开发布

基于 main `22da495b300d080e1aa0840c2494cdfbbea21e2c`，在现有仓库迭代。提交、PR 与远端 CI 在本轮交付结果中提供；不把基线 CI 当本轮通过。

新增可复用的受限适配器契约：tabs、有限加法计算、布尔双面板，保留 Fourier、表格与原生折叠。明确请求受控模型后，保存 JSON、关闭来源，再导入并输出可离线操作的 HTML/ZIP。仅运行本项目固定模型；未知/错误配方局部静态降级。模型验证不等于来源程序等价证明。

插件界面按 Refactoring UI 审查结果小幅改进：下载主操作、报告次操作、组件计数与可展开证据、有界滚动。导出内容保持来源设计，不应用插件品牌或装饰。

## 文件清单

本地 `dist/v0.5.0/`：

- `Intelligent-UI-Portability-Lab-v0.5.0-extension.zip`：解压后在 Chrome/Edge 开发者模式加载 `extension/`。
- `Intelligent-UI-Portability-Lab-v0.5.0-source.zip`：本轮源码、fixture、测试和精选证据。
- `SHA256SUMS`：两个 ZIP 的 SHA-256。
- `package-manifest.json`：版本、测试时间及扩展逐文件 hash。

`npm test` 为实际扩展字节出具证明；打包检查两个 ZIP 内扩展逐文件一致；`npm run test:package` 解压安装 ZIP，独立加载它运行全部 MV3 回归。安装包复测不重建扩展。完整结果见 [验收报告](../tests/TEST_REPORT.md)。CI Artifact 含完整生成数据与包，不重复提交大型生成快照。

## 边界与未验证

HTML/ZIP 支持三策略；Markdown/SVG/PNG 静态，JSON 不执行代码。计算器仅 -100..100、步长0.01 的两数求和；Tabs 为有限已挂载面板，状态模型为布尔双面板。无任意表达式、第三方脚本或账号服务。

Linux Chromium 为已测环境；Windows Chrome/Edge、Obsidian GUI 未完成操作验证。桌面桥在当前 WSL 路径初始化失败，不能用 Linux 代替。见 [人工验收](../tests/MANUAL_ACCEPTANCE.md)。ChatGPT 自动提取继续 Blocked；PDF 为 Proposal。原有权限及 UNLICENSED 不变。

公开 Release、商店上架、许可及仓库管理规则未改动。
