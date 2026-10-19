# v0.5.1 交付说明 · 未公开发布Release

基于main 8255b075a931410eec7c185a956161da910d973e，在原仓库集成主动粘贴。现在可从来源手动复制或系统截图 → Popup“手动粘贴 / 导入文件” → Ctrl+V → 预览 → HTML/ZIP/Markdown → 本地打开。无需测试服务器、第二个HTML工具或手改IR。文件和拖放仍可用。

截图标记visual-only，输入安全预检后缩放/重编码，显示原/保存尺寸及损失；HTML内嵌图片，ZIP含notes.md及resources相对引用，单独截图Markdown禁用。富文本通过原隔离净化保存有限结构与样式，纯文本字面保存；未知脚本不运行、不获得recipe或来源等价证明。既有IR1.3交互往返与三策略保留。

修复候选验证前读取敏感状态、来源DOM修改和旧授权沿用风险，授权绑定当前documentId且一次消费。最小权限、CSP、资源校验、固定模型和ChatGPT自动Gate不变。

## 本地资产

`dist/v0.5.1/`：

- Intelligent-UI-Portability-Lab-v0.5.1-extension.zip：解压并加载extension/。
- Intelligent-UI-Portability-Lab-v0.5.1-source.zip：源码、测试、文档与精选证据。
- SHA256SUMS、package-manifest.json：档案hash、版本、测试时间、扩展逐文件hash。

npm test对实际扩展字节验证，package拒绝改动过的扩展；安装ZIP解压后独立MV3复测。执行结果、截图和限制见[测试报告](../tests/TEST_REPORT.md)，不将草稿当发布。源码/安装ZIP不包含原型和未经审查补丁。

Unverified：Windows Chrome/Edge、Obsidian实际渲染、真实ChatGPT用户样本。自动化样本明确为合成。Blocked：ChatGPT自动获取缺公开确认途径；不绕过。Proposal：v0.6按真实授权样本决定适配器。未开发PDF、后端或账户；UNLICENSED保持，未修改仓库规则或公开Release。

main保护建议：PR必需检查chromium，禁止force push/删除，合并前要求最新CI；仅建议，不改管理设置。
