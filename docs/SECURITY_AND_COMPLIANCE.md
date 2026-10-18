# 安全、权限与数据获取 Gate

核对日期：2026-10-16。以下区分公开文档事实与本项目的实施判断；不是对特定账号/司法辖区的法律意见。

## 官方来源与结论

- [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/) 当前页面标注 2026-01-01 生效：限制程序化提取数据/Output、逆向服务或底层组件及绕过保护；违规可能被限制或终止访问。输出权利不等于任意提取机制获授权。地区/组织协议可能不同；本轮没有完成某个具体账号的适用协议评估，无法量化封号概率。
- [官方数据导出帮助](https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data)：通过设置/Privacy Portal 申请账户数据 ZIP，邮件下载有时限。官方说明不保证完整的原生 UI 组件树或交互实现；本轮没有用户正式导出样本，不能推断包结构和保真能力。
- [官方开发者 UI 文档](https://developers.openai.com/plugins/build/chatgpt-ui)：MCP 工具返回开发者自己的 UI resource，通过 iframe 与 MCP Apps bridge 通信。这是创建/承载自有 UI 的路径；**没有在所查官方文档中确认将既有 ChatGPT 原生 Intelligent UI 导出的接口或授权**。旧 Apps SDK 入口当前重定向至 Plugins 文档，不沿用旧入口名称推测能力。
- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)：用户调用后临时访问当前站点，跨源导航等会撤销；搭配 scripting 注入。技术授权不代替站点许可。[MV3 远程代码政策](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code) 要求执行代码随扩展提供；本扩展全部 JS 本地，无远程执行依赖。[用户数据原则](https://developer.chrome.com/docs/extensions/develop/security-privacy/user-privacy) 支持最小权限与用途透明。
- [Edge MV3 指南](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/manifest-v3) 说明其扩展平台方向；不能由此宣布 Edge 安装/运行已实测或商店已批准。

**实施判断：** ChatGPT 专用 Gate 未通过。Popup 与后台同时拒绝 chatgpt.com / chat.openai.com 及其子域。未使用账号、Cookie/token、私有会话接口、专有 bundle 或内部流。离线模拟域名仅测试阻止逻辑，不测试 ChatGPT 功能。

## 获取决策矩阵

| 路径 | 可得数据 | 公开授权/前提 | 稳定性 | 隐私/账号风险 | 落地状态 |
|---|---|---|---|---|---|
| 用户自行提供 HTML/SVG/截图 | 仅文件内可见结构/像素，不自动含行为 | 提供者须有内容与处理权；文件不天然可信 | 文件稳定，格式差异大 | 文件可含敏感文字/恶意 markup；本地处理可减少外传 | Proposed：未实现文件导入 UI；当前可用自有 localhost fixture 验证净化，不要直接加载不可信脚本 |
| 官方渠道数据包 | 官方实际提供的账户数据；UI 字段未知 | 官方明确提供账户导出途径，具体内容使用权仍需核实 | 入口正式但包格式可能变 | 本地包含大量私人信息；不需网页身份提取 | Proposed：无真实样本、无导入器，不能称已支持 |
| 本地及明确允许网站 | 已挂载 DOM、计算样式、SVG、可读 Canvas、有限静态控件 | 自有 fixture 明确允许；第三方须另外确认许可 | DOM 通用能力较稳，复杂组件差异大 | 不上传；用户仍需检查正文/画布秘密，普通网站可能有自身条款 | Implemented/Tested：本地；普通网页仅通用注入路径，非全网站兼容承诺 |
| ChatGPT 原生 UI 正式公开接入 | 所查资料未确认可读原生树/代码的导出接口 | 自有 MCP UI 接入不授权导出其他原生 UI；缺少可确认路径 | 未知 | 条款与账号风险无法量化 | Blocked：保持域名拒绝 |

启用专用适配需：适用协议 → 明确许可的接入/数据范围 → 真实授权样本 → 最小权限 → 安全/保真测试。不能拿开源项目代码、商店上架、拥有输出或主动点击代替许可证明。研究不阻止已允许的本地功能。

## 实际威胁模型与防护

| 风险 | 已实现措施 | 证据/剩余边界 |
|---|---|---|
| 脚本/XSS/导航 | 新建净化 DOM；标签/属性/计算样式白名单；不复制事件/id/class/href；拒绝脚本、iframe、foreignObject、动画与 use；HTML CSP；预览 sandbox | HTML/MD/JSON 恶意 fixture；SVG 根与 metadata 测试。非形式化安全证明 |
| 外部资源与追踪 | 不 fetch，不内嵌远程 src/href 或 CSS url，图片只收 base64 栅格，font-src/connect-src none | 本地导出表格打开 HTTP(S) 请求为零；静态扫描生产源码。纯文本 URL 可保留为文字，不是全正文 URL 删除器 |
| 输入/身份泄漏 | 文本/密码/textarea/select/contenteditable 脱敏，hidden 不捕获；不读 Cookie、Storage 或会话端点 | 密码、token query 链接、隐藏文本、可编辑内容未进入导出；普通段落/Canvas 中的秘密不能识别 |
| 扩展页消息越权 | capture 只允许顶层 HTTP(S) tab 且非阻止域；预览请求限制扩展 URL；不声明 externally_connectable/外部资源入口 | isolated world 降低页面直接触达；不是恶意网站对 Overlay/DOM 修改的完整防御 |
| 持久隐私 | 无 storage/网络后端；临时内存快照，3 份/10 分钟上限，报告下载不含正文 | 下载的用户文件长期存在；JSON 本身包含净化正文。SW 睡眠可能更早失效 |
| 大页面/异常 | 5000 访问节点（含文本）、75 层、100 万文本字符、3 秒检查、单边12000px、payload 12,000,000 UTF-8 字节；单图 data URI约300万字符 | 节点/深度失败实测；单次 Canvas 读取无法由遍历预算中断，无专门 worker/压力基准 |

只申请 activeTab、scripting；不申请 host_permissions/cookies/webRequest/downloads/storage。真实下载由预览页用户按钮触发原生 a.download，Blob URL 60 秒后撤销，无后台自动下载。MV3 开发工具测试参数只用于测试浏览器，不写入扩展。

没有商店发布、渗透测试或第三方审计。依赖许可证见 [清单](DEPENDENCIES.md)。不依赖 README 宣传判断 GPT-6 兼容。
