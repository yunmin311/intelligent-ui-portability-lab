# v0.4.1 实施与状态

基准：2026-10-19 fetch，main / origin/main `5bc8cfffd362a68b45379c6da8f9406fc03bdd58`；工作区干净。工作分支 `codex/v0.4.1-roundtrip`。用户已授权测试后提交、推送、合并；公开 Release 未授权。

## Decision

保留现有捕获、IR、Worker、沙箱预览和固定运行时。IR 1.2 增加 `model-validated-v1`，与内部 fixture 的 `fixture-equivalence-v1` 分开。外部 JSON 清除身份、安全、等价声明，每个配方重新做有限模型校验；只执行随扩展提供的运行时。迁移兼容 IR 1.0 / 1.1。未知配方逐项静态降级，树、资源不安全则整体拒绝。

Auto 自动恢复安全组件。Interactive 无可恢复交互则阻止；混合组件要求显式确认降级，HTML / ZIP 由同一核心校验把关。Static 禁用有限运行时和原生折叠。静态格式不显示交互能力。

## 验收顺序

1. 基线完整测试（18 单元、18 浏览器通过）。
2. 新增失败回归，再实现模型导入、证据隔离、策略阻止与确认。
3. 原页面关闭后的 JSON → HTML / ZIP 离线操作、明暗视觉比较、恶意样本。
4. 全量回归、同字节安装包独立 E2E、hash / CI / 文档核实。
5. 验证后提交、推送、合并；仅准备 Release 文件与说明。

## Exploration / Proposal / Deprecated

Exploration：Windows 原生浏览器与 Obsidian 的实际运行环境。未完成真实测试不得标为通过。

Proposal：PDF、正式授权来源、真实官方数据包适配；分支保护建议只记录，不更改管理规则。

Deprecated：外部 JSON 一概剥离配方；Auto / Interactive 语义相同；把模型合法性当作来源等价或正文脱敏证明。历史 v0.4 验证仍保留于 tests/evidence/v0.4。
