# PagePort 重建报告(2026-10-28)

分支 `rebuild/v1`。旧版 main `338be84`(v0.7.1)保留不动;本报告只陈述证据,不以"测试全绿"作为结论依据。

## 一、旧版真实失败复现(Windows,Chrome for Testing 156 + 真实扩展加载 + 真实 Popup)

| # | 场景 | 结果 |
|---|---|---|
| C | 用户在 chatgpt.com 点击「选择页面区域」 | **被扩展自身拦截**:弹出"ChatGPT 合规闸门:尚无已确认的原生 UI 导出授权路径"。项目的初始动机场景 = 功能不可用 |
| A | 本地文章页粘贴→预览→下载 HTML | 自动化通过(313KB 文件可独立打开) |
| B | 允许页面的选区捕获→下载 | 自动化通过 |

结论:A/B 管道在自动化中可用,**但用户的实际失败与 C 完全吻合**——用户的核心诉求就是保存 ChatGPT 界面,第一-click 就撞闸门;再叠加需要理解"导入页/预览/策略/受控契约"的多步流程与高密度工程文案,产品判定失败成立。自动化绿 ≠ 产品成功,本轮以真实用户路径重新验收。

环境说明:branded Chrome 155/Edge 移除了 `--load-extension`,自动化采用 Chrome for Testing(同引擎);branded 实机安装留作用户验收。

## 二、参考产品研究(要点)

- **Obsidian Web Clipper**(MIT):选区优先于整页、点图标直出面板、anchor 下载、懒注入 content script——采纳其交互范式。
- **SingleFile**(AGPL):分层资源抓取、chrome.downloads 后台交付、badge 状态机——只借鉴思想,零代码复制(AGPL 不兼容)。
- **chatgpt-export**(MIT):公开 DOM 选择器(`[data-message-author-role]`、`conversation-turn`)、防御性降级——采纳 DOM 契约;其私有 API 路径明确不采用。
- **SnapDOM**(MIT):成熟的 DOM→PNG 库——直接复用,不再自研捕获。

## 三、新版交付(PagePort 1.0.0)

两个 UI 方向均已实现并真机截图对比(`.research/repro/ui-variants/`):紧凑浮窗(默认,不遮挡页面)与居中大预览(设置可切换)。

核心闭环(真实浏览器、真实 UI 点击、真实下载文件):

| 闭环 | 结果 | 证据 |
|---|---|---|
| 1. 网页选区→Markdown | **通过** | GFM 表格 + LaTeX + 围栏代码;文件以页面标题命名并独立打开验证 |
| 2. 可视化区域→PNG/自包含 HTML | **通过** | PNG 2560×3576(2×)独立打开;HTML 908KB 内嵌 base64、0 网络请求 |
| 2c. 对话页 DOM 契约 | **通过** | 消息吸附、KaTeX→`$$W(t)=C(t-K)^3+W_{max}$$`、GFM 表格、代码围栏 |
| 粘贴导入 | **通过** | 面板内 Ctrl+V 富文本→Markdown→保存 |
| 3. 真实 chatgpt.com | **注入/选择通过** | 真实域名面板注入、无任何拦截(旧版在此硬拦) |

安装包 `dist-release/PagePort-v1.0.0-extension.zip`(128KB)+ SHA256SUMS;ZIP 解压→加载→选区→保存的完整安装路径复测通过(`tests/verify-package.mjs`)。

## 四、明确未验证 / 限制

- **登录后的 ChatGPT 对话导出**:Unverified。本环境无用户会话;DOM 契约已用忠实还原的本地 fixture 验证(真实 KaTeX 结构),需用户登录后实测确认。
- **Windows branded Chrome / Edge 实机**:自动化受限于 Chrome 137+ 移除的 `--load-extension`;需用户手动安装验收。
- 跨域图片(无 CORS 头)在 Markdown 中保留远程链接,离线打开时不可见——PNG/HTML 快照不受影响。
- 阴影宿主页面(极深 Shadow DOM)与 canvas 密集页面依赖 SnapDOM 能力边界,未穷举。
- Obsidian GUI 呈现:Unverified(用户端确认)。

## 五、提交策略

按授权:不合并、不改许可证、不动旧版。等待用户用安装包实测后决定是否合并 `rebuild/v1`。

## 六、v1.1.0(2026-11-09):面板重做 + 四个内容缺陷

方向由用户定稿:**浅色 = 精密仪器(A),深色 = 命令面(C)**。同一套结构,只换材质——
浅色走中性细线 + 下划线 tab + 墨色主按钮;深色走磨砂玻璃 + kbd 徽章 + 浅色主按钮。
布局不随主题变形,否则同一个控件会有两种心智模型。

### 用户能直接看到的变化

| 之前 | 现在 |
|---|---|
| 预览是 Markdown 源码(`**粗体**`、长 URL 铺满) | 预览是**渲染后的效果**:标题、表格、公式、代码按真实排版显示 |
| 目标标签显示 `p · 752×130 px` | 显示"段落 · 214 字",尺寸只在没有正文时兜底 |
| HTML 快照 tab 只有一句说明 | 显示文件卡片:标题 / 来源 / 保存时间 / 内含什么 |
| 四个按钮挤一行,"保存到本地 ↓"被压成两行 | 次级操作降级为文字链接,主按钮独占整行 |
| 点击段落的粗体/链接只选中两个词 | 自动回退到所在段落(图片/SVG/公式仍按原样选中) |

### 修的四个内容缺陷(都有回归断言)

1. **段落被拆碎**:`toMarkdown` 把根元素每个非文本子节点单独转一次再拼;点一个 `<p>` → 每处 `<b>/<a>` 断成新段(维基一段文字变 10 段)。改为:根元素是内联混排时整体转一次。
2. **合法 MathML 写错**:`childArgs` 把 `mrow` 展平成位置参数,`mroot/mfrac/msup` 是位置语义 → `\sqrt[3]{a+b}` 变成 `\sqrt[+]{a}`。改为保留 `mrow` 为单个参数 + 基数自动加括号。四个构造逐一断言。
3. **LaTeX 被 turndown 转义**:含 `[` `]` 的公式被转成 `\sqrt\[3\]`,在 Markdown 里直接坏掉。改为私有区 token 占位、转换后再还原。
4. **短内容无法保存**:`blob.size < 32` 的守卫把单条公式/一行引用判成"内容为空"直接拒绝。改为按格式设最小字节。

### 顺带

- 新增 `tests/tools/shots.mjs`(浅/深色视觉回归截图,放在 artifacts 之外,不会被测试清理删掉)。
- `tests/verify-package.mjs` 不再写死版本号,改读 `dist-release/package-manifest.json`。
- 快捷键与面板上印的徽章对齐:`1/2/3` 切格式,`Enter` 保存。
- 移除"面板样式(紧凑/大预览)"设置——那是上一轮 A/B 探索的临时开关,方向已定,留着只会增加组合数。

### 验证

`node tests/loops.mjs` 全绿(loop1/2/2c/paste/**loop4**/loop3);`node tests/verify-package.mjs` PASS;
浅/深色在真实维基页面上各跑一遍全流程截图(见 `demo/screenshots/panel-*`)。
仍未验证:登录态 ChatGPT 对话导出、Windows 正式版 Chrome/Edge 实机、Obsidian 呈现。
