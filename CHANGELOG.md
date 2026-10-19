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
