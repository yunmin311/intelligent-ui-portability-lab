# PagePort · 页面保存

从零重建的产品(`app/`),替代旧版 `extension/`(保留作参考)。一句话:**点扩展图标 → 点选页面区域 → 保存为 Markdown / PNG / 自包含 HTML。**

## 为什么重建

旧版 v0.7.1 自动化测试全绿,但真实用户判定不可用。复现结论(证据见 `REBUILD-REPORT.md`):

1. **旗舰场景被自身拦截**——旧版在 chatgpt.com 弹出"合规闸门"拒绝运行,而保存 ChatGPT 内容正是项目的初始动机;
2. 用户需要理解 IR / 策略 / 契约才能走完流程;
3. 界面信息密度高、反馈弱。

新版产品原则:**打开插件 → 选择内容 → 保存**,三步以内;失败给可读原因;不要求理解任何内部概念。

## 能力层级

| 层级 | 能力 | 实现 |
|---|---|---|
| A 保存内容 | 选区/元素/对话消息 → Markdown(GFM 表格、代码围栏、KaTeX/MathML→LaTeX) | turndown + 自定义规则 |
| B 保存外观 | 选区 → PNG(1×/2×/3×)或自包含 HTML(PNG 内嵌 + 标题/来源/时间) | SnapDOM |
| C 有限交互 | Markdown 保留原生 `<details>`;其余交互如实标注"静态保存",不伪造 | — |

粘贴导入(Ctrl+V 富文本/截图)保留为面板内的备用路径。

## ChatGPT

- 无任何闸门。在 chatgpt.com 点击扩展即注入面板(真实域名实测)。
- 消息感知:悬停/点击回答时自动吸附整条消息(`data-message-author-role` / `data-testid^="conversation-turn"` 等公开 DOM 属性),公式从 KaTeX DOM 自带的 `annotation[x-tex]` 提取原始 LaTeX。
- 只处理用户主动选择的、当前可见的 DOM;不访问私有接口、不后台扫描、不导出隐藏内容。

## 架构(约 700 行产品代码)

```
app/
  manifest.json        MV3,权限:activeTab / scripting / storage / downloads
  src/background.js    点击图标 → 注入面板;受限页打开 landing;chrome.downloads 交付
  src/content.js       入口:防重复注入、旧实例清理
  src/ui.js            Shadow DOM 面板(两套视觉方向,设置可切换)
  src/picker.js        元素选择器(悬停高亮/点击锁定/↑↓扩大缩小/Esc)
  src/convert.js       清洗克隆(隐藏子树按原树并行剪除)+ KaTeX/MathML→LaTeX + turndown
  src/shoot.js         SnapDOM PNG / 自包含 HTML
  pages/landing.html   受限页说明
```

依赖:`@zumer/snapdom`(MIT)、`turndown` + `turndown-plugin-gfm`(MIT)、esbuild(构建)。构建:`npm run build`;打包:`node package.mjs` → `dist-release/`。

## 测试

`node tests/loops.mjs` 在真实 Chromium(Chrome for Testing)上回归三个核心闭环 + 粘贴路径 + chatgpt.com 注入;`node tests/verify-package.mjs` 验证发布 ZIP 的实际安装路径。最近的运行结果与截图在 `tests/artifacts/`(不入库)。指标导向的旧测试体系未迁移——测试只守护真实用户路径。

## 许可

本项目延续仓库既有许可。第三方组件归属见 `NOTICE.md`(均为 MIT,未使用 AGPL 代码)。
