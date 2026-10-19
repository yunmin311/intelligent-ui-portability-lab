# v0.4.1 正式发布说明草稿

状态：**Prepared / 未公开发布**。推送、合并源码已获授权；公开Release仍需进一步明确授权。安装与回归结果的唯一记录为[测试报告](../tests/TEST_REPORT.md)。

本版解决交互JSON存档关闭原网页后无法恢复的问题。Fourier@1和table@1在独立结构、参数、绑定、输出和资源验证通过后，使用项目自有固定运行时重建；外部文件一律清除来源身份、脱敏和来源等价声明。未知模型静态降级并报告；危险结构和缺失/损坏资源拒绝导入。它不是任意来源程序复制，也不是ChatGPT原生组件协议。

Auto自动启用安全可恢复部分；Interactive遇到未知组件需明确确认，没有可恢复交互则禁止下载；Static禁用全部行为。HTML和ZIP执行相同规则，静态格式不宣称交互。IR升级1.2，兼容迁移1.0/1.1。

## 待上传资产

所有文件由 `npm test && npm run package && npm run test:package` 在 `dist/v0.4.1/` 生成。测试扩展和安装包文件逐字节对应，不重新构建安装包再冒用旧结果。

- `Intelligent-UI-Portability-Lab-v0.4.1-extension.zip`：解压后加载extension文件夹。
- `Intelligent-UI-Portability-Lab-v0.4.1-source.zip`：源码与构建脚本，不含node_modules。
- `SHA256SUMS`：两个ZIP的SHA-256。
- `package-manifest.json`：版本、测试时间、大小、归档hash、扩展逐文件hash。

Windows Chrome/Edge、Obsidian实际GUI仍Unverified，见[步骤](../tests/MANUAL_ACCEPTANCE.md)。Linux Chromium已测不代表这些平台已通过。权限不变，无云服务、远程执行代码或未经授权的ChatGPT提取。许可证保持UNLICENSED，未授予新复用许可。
