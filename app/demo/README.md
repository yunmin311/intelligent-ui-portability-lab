# PagePort 真实导出产物(合成测试内容)

以下文件全部由 PagePort 在真实 Chromium 中实际操作导出,内容为项目自建的合成样例(不含任何 ChatGPT 或第三方数据):

- `rich-article-export.md` — 闭环一:网页选区 → Markdown(表格/公式 LaTeX/代码围栏)
- `传输控制实践指南（合成样例） 20261028-005230.png` — 闭环二:可视化区域 → PNG(2×)
- `传输控制实践指南（合成样例） 20261028-005236.html` — 闭环二:自包含 HTML(内嵌画面,离线 0 网络请求)
- `模拟对话页 20261028-005247.md` — ChatGPT DOM 契约 fixture 导出(消息吸附/KaTeX→LaTeX)
- `screenshots/` — 面板选择中/预览中、真实 chatgpt.com 注入、两种 UI 方向

重新生成:`npm run build && node tests/loops.mjs`
