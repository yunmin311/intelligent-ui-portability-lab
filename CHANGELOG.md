# 变更清单

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
