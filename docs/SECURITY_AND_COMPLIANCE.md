# 安全、权限与数据获取 Gate · v0.5 Decision

核对日期：2026-10-18。以下区分公开文档事实与本项目的实施判断；不是对特定账号/司法辖区的法律意见。

## 官方来源与结论

- [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/)：限制程序化提取数据/Output、逆向服务或底层组件及绕过保护；违规可能被限制或终止访问。输出权利不等于任意提取机制获授权。地区/组织协议可能不同；本轮没有完成某个具体账号的适用协议评估，无法量化封号概率。
- [官方数据导出帮助](https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data)：通过设置/Privacy Portal 申请账户数据 ZIP，邮件下载有时限。官方说明不保证完整的原生 UI 组件树或交互实现；本轮没有用户正式导出样本，不能推断包结构和保真能力。
- [官方开发者 UI 文档](https://developers.openai.com/plugins/build/chatgpt-ui)：MCP 工具返回开发者自己的 UI resource，通过 iframe 与 MCP Apps bridge 通信。这是创建/承载自有 UI 的路径；**没有在所查官方文档中确认将既有 ChatGPT 原生 Intelligent UI 导出的接口或授权**。旧 Apps SDK 入口当前重定向至 Plugins 文档，不沿用旧入口名称推测能力。
- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)：用户调用后临时访问当前站点，跨源导航等会撤销；搭配 scripting 注入。技术授权不代替站点许可。[MV3 远程代码政策](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code) 要求执行代码随扩展提供；本扩展全部 JS 本地，无远程执行依赖。[用户数据原则](https://developer.chrome.com/docs/extensions/develop/security-privacy/user-privacy) 支持最小权限与用途透明。
- [Edge MV3 指南](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/manifest-v3) 说明其扩展平台方向；不能由此宣布 Edge 安装/运行已实测或商店已批准。

**实施判断：** ChatGPT 专用 Gate 未通过。Popup 与后台同时拒绝 chatgpt.com / chat.openai.com 及其子域。未使用账号、Cookie/token、私有会话接口、专有 bundle 或内部流。离线模拟域名仅测试阻止逻辑，不测试 ChatGPT 功能。

## 获取决策矩阵

| 路径 | 可得数据 | 公开授权/前提 | 稳定性 | 隐私/账号风险 | 落地状态 |
|---|---|---|---|---|---|
| 用户自行提供 HTML/SVG/截图 | 仅文件内可见结构/像素，不自动含行为 | 提供者须有内容与处理权；文件不天然可信 | 文件稳定，格式差异大 | 文件可含敏感文字/恶意 markup；本地处理可减少外传 | Implemented/Tested：本地文件入口；HTML/SVG先隔离净化，图片visual-only，JSON严格验证 |
| 官方渠道数据包 | 官方实际提供的账户数据；UI 字段未知 | 官方明确提供账户导出途径，具体内容使用权仍需核实 | 入口正式但包格式可能变 | 本地包含大量私人信息；不需网页身份提取 | Proposed：无真实样本、无导入器，不能称已支持 |
| 本地及明确允许网站 | 已挂载 DOM、计算样式、SVG、可读 Canvas、有限静态控件 | 自有 fixture 明确允许；第三方须另外确认许可 | DOM 通用能力较稳，复杂组件差异大 | 不上传；用户仍需检查正文/画布秘密，普通网站可能有自身条款 | Implemented/Tested：本地；普通网页仅通用注入路径，非全网站兼容承诺 |
| ChatGPT 原生 UI 正式公开接入 | 所查资料未确认可读原生树/代码的导出接口 | 自有 MCP UI 接入不授权导出其他原生 UI；缺少可确认路径 | 未知 | 条款与账号风险无法量化 | Blocked：保持域名拒绝 |

启用专用适配需：适用协议 → 明确许可的接入/数据范围 → 真实授权样本 → 最小权限 → 安全/保真测试。不能拿开源项目代码、商店上架、拥有输出或主动点击代替许可证明。研究不阻止已允许的本地功能。

## 实际威胁模型与防护

| 风险 | 已实现措施 | 证据/剩余边界 |
|---|---|---|
| 脚本/XSS/导航 | DOM→严格IR；导入在唯一来源无扩展权限sandbox中先新建净化DOM；标签/属性/计算样式白名单；不复制事件/class/href，SVG id重映射；拒绝脚本、iframe、foreignObject、动画与 use；HTML CSP；预览 sandbox | HTML/MD/JSON 恶意 fixture；SVG 根与 metadata 测试。非形式化安全证明 |
| 外部资源与追踪 | 不 fetch，不内嵌远程 src/href 或 CSS url / image-set等未许可资源函数，图片只收 base64 栅格，font-src/connect-src none | 本地导出表格打开 HTTP(S) 请求为零；静态扫描生产源码。纯文本 URL 可保留为文字，不是全正文 URL 删除器 |
| 输入/身份泄漏 | 文本/密码/textarea/select/contenteditable 脱敏；普通 hidden 不捕获，合法受控模型的必要面板/行按下节例外处理；不读 Cookie、Storage 或会话端点 | 密码、token query 链接、隐藏文本、可编辑内容未进入导出；普通段落/Canvas 中的秘密不能识别 |
| 扩展页消息越权 | capture 只允许顶层 HTTP(S) tab 且非阻止域；预览请求限制扩展 URL；不声明 externally_connectable/外部资源入口 | isolated world 降低页面直接触达；不是恶意网站对 Overlay/DOM 修改的完整防御 |
| 持久隐私 | 仅storage.session受信上下文，无local/sync/网络后端；3份/7.5MB估算/10分钟访问上限，报告下载不含正文 | 下载的用户文件长期存在；JSON 本身包含净化正文。SW重启可恢复，浏览器重启/扩展重载清空；过期物理清理由后续消息触发 |
| 大页面/异常 | 5000访问节点（含文本，入栈即限额）、75层、100万文本字符、单边12000px、IR4MB；单资源base64≤200万字符，Canvas/栅格≤100万像素；编码头先检查 | 节点/深度失败实测；DOM遍历分批协作取消，单次原生调用不能硬中断；纯转换Worker10秒terminate，隔离页15秒移除；宽/深DOM、重试取消有压力回归 |

只申请 activeTab、scripting、storage；不申请 host_permissions/cookies/webRequest/downloads。storage只为SW重启后的会话恢复，未扩大站点访问范围。真实下载由预览页用户按钮触发原生 a.download，Blob URL 60 秒后撤销，无后台自动下载。MV3 开发工具测试参数只用于测试浏览器，不写入扩展。

没有商店发布、渗透测试或第三方审计。依赖许可证见 [清单](DEPENDENCIES.md)。不依赖 README 宣传判断 GPT-6 兼容。

## 存储、隔离与剩余边界（Decision）

[Chrome storage.session](https://developer.chrome.com/docs/extensions/reference/api/storage)为内存会话存储，当前10MB配额；本产品使用更保守7.5MB估算。显式TRUSTED_CONTEXTS，内容脚本不能直接读取保存结果。10分钟逻辑过期，不承诺无人访问时精确物理删除或内存安全擦除。扩展页面的记录是完整正文；下载后由用户管理长期保存。

[Manifest sandbox](https://developer.chrome.com/docs/extensions/reference/manifest/sandbox)提供唯一来源、无扩展API的隔离页。本地HTML从DOMParser到白名单克隆后才挂载；CSP default/connect none、img data-only、script self。原始脚本/事件/@import/远程字体不进入执行页面。消息检查frame窗口与随机nonce；JSON校验不借执行HTML完成。可选择渲染器只消费已验证IR。格式切换任务序号防止旧结果覆盖新文件。

独立审查实测发现独立SVG可通过CSS image-set发请求，已用函数白名单修复；不能只依赖HTML CSP保护SVG。资源验证同时检查MIME签名、编码尺寸与SHA-256；无法解码/超像素失败关闭。外部链接只保留可见文字，不保留可点击地址或来源query。JSON自身是用户内容，无法证明普通文本无秘密；security.redacted表示控件脱敏策略执行，绝不表示所有像素/正文已匿名化。

没有正式第三方渗透测试、稳定版Chrome/Edge多版本验收、商店审批或适用个人账号协议意见。官方账户包专用导入无真实授权样本，保持Proposal/Unverified；原生ChatGPT获取为Blocked。

## 行为与声明边界（Decision）

CSS值在进入单个声明前拒绝分号、花括号、感叹号、C0/DEL、反斜线、注释、活动URL和未知函数；属性名仍是白名单。允许颜色、渐变、变换、calc/var等有限函数；SVG仅允许重映射的本地ID引用。不能用单个color值注入其他声明；浏览器可忽略不符合属性语法的值，不将过滤器视为通用CSS语法解析器。

外部JSON先约束版本/体积，强制来源json/local、provenance external-unverified、redacted=false，剥离行为后验证树，再逐项执行内置 Fourier@1/table@1/tabs@1/calculator@1/state@1 结构、参数类型/步长/范围、绑定命名空间/唯一性/组件范围、当前曲线/表格、有限组件子树/祖先与资源完整性校验。最多20项；模型匹配的标记强制改为model-validated-v1，而非来源等价证据。未知recipe/版本/额外代码字段/跨组件绑定/非法数值静态降级并产生诊断；危险树/资源与带子节点的HTML空元素拒绝文件。后台重复规范化，不信任导入页消息的声明。

外部来源、安全与fixture-equivalence字段不是真实证明。固定运行时只按项目自有有限模型响应，JSON没有代码或表达式执行权，不能扩展模型、调用网络或获得扩展API。IR 1.3 将模型安全与来源等价明确分开，旧 1.0/1.1/1.2 显式迁移；普通正文和像素秘密仍需用户检查。

所有 HTTP(S) 网页有限模型检测均要求 Popup 显式受控契约，包括本地 fixture。`sourceAdapter` 不按路径自动授信；路径、data 标记、用户勾选均不是所有权或来源等价认证。模型状态、绑定、输出仍必须通过独立校验；实捕 evidence 始终为 model-validated-v1。攻击者不能通过模仿 fixture 获得执行来源脚本的能力，不能因此获等价性证明。真实 fixture 来源/产物对照仅是测试报告中的有界证据。

calculator 只接收 -100…100、步长 0.01 的两个加法参数；不是表达式执行器。tabs 绑定数组 2–12 项，state 恰好两个面板；组件不得共享绑定，嵌套仅在父组件独立面板内。模型需要的隐藏面板/行只在已识别且校验的组件作用域内保留；不扩大为任意隐藏内容读取。受控加法数字值会保存，用户仍应确认数值是否敏感；普通输入继续脱敏。

下载HTML的CSP只允许构建时固定运行时hash，禁connect/font/frame/object/form/base；无扩展API和同源权限。预览同样在manifest sandbox的唯一来源执行；父窗口只发送本地校验renderer产物，不把原HTML放入特权页面。

ZIP成员名拒绝绝对路径、反斜线、空段、点/点点段；内容只来自本地已验证IR，逐文件SHA-256。不会下载跨域资源，JS/CSS审阅副本不额外加载。实际file://回归同时检查合法行为与附加恶意脚本被CSP阻止，以及HTML/ZIP的HTTP(S)请求为零。安全证据不是形式化证明或通用第三方程序复原能力。

仓库管理和当前CI结果以[本轮测试报告](../tests/TEST_REPORT.md)为准，不沿用历史运行。建议所有者未来启用main禁止直接push、要求现有CI job成功及PR审查，先确认账户/仓库计划支持；本轮未改管理设置；后续用户已授权推送、合并源码，未授权发布Release。

IR 的 `security.scripts:false` 表示没有保留来源脚本，不表示 HTML 中绝无产品自身脚本。只有经过行为校验的 HTML/ZIP 才包含固定哈希白名单运行时；下载文件和扩展沙箱均实测没有 `chrome.runtime.sendMessage`。


## 当前状态边界

Decision：本地 v0.5 安装包与源码按测试绑定打包；未公开发布 v0.5 Release。Windows Chrome/Edge、Obsidian GUI 保持 Unverified；本轮 Windows GUI 工具因 sandboxCwd 启动失败，未完成应用内验证。具体运行结果以[测试报告](../tests/TEST_REPORT.md)为准。

Proposal：正式授权数据包专用解析与未来第三方适配。Exploration：公开接入研究和开发期保真比较。Deprecated：固定 fixture 路径自动赋予捕获等价标记。ChatGPT Gate 和 UNLICENSED 维持原决策，未授予额外许可。上方官方资料核对日期为历史记录，本轮仅更新实现说明，没有重新核验条款。

## v0.5.1 手动粘贴边界 · Decision

主动复制/系统截图后前台paste与自动站点捕获是独立入口。前者仅使用本次事件数据，不触发站点读取、Cookie/token/私有接口；ChatGPT自动Gate不变。用户提供不证明合法权利、来源身份或原生行为等价，内容和像素秘密仍需用户检查。没有真实ChatGPT样本验收证据。

不采纳交接原型的unsafe-inline CSP、重复净化/ZIP/下载实现；补丁未执行。原扩展CSP、唯一来源sandbox、CSS白名单、资源签名/hash及固定运行时不放宽。HTML标记不授予recipe；JSON保持IR1.3去信任验证；截图external-unverified/redacted:false。截图预算及取消限制以架构文档为准。没有新权限或网络依赖。

候选配方必须通过结构→有限状态→模型验证才可进入例外捕获集合；计算结果必须可见，Tabs/state预验证不读取隐藏正文。最终模型改变触发整次丢弃并默认脱敏重捕。测试包含恶意calculator/Tabs、错误绑定、非法状态、instrumented隐藏读取、零来源DOM mutation及竞态。授权绑定documentId，完成/失败提交消费，取消/导航/关闭失效；来源同源不能沿用上一文档授权。

## v0.5.2 可用性收口复核

预览缩放仅在扩展页外层transform，不改隔离frame权限或内容；格式禁用依据已校验IR，不访问来源。文件入口合并复用同一file/paste/drop转换，错误/取消后恢复；图片风险提示提前显示。没有新增权限、依赖、后台请求、recipe、授权绕过或放宽输入预算；documentId一次授权、候选完整预验证、外部JSON信任清除和CSP沿用并在全量测试中回归。Gate和以上外部条款研究沿用原核对日期，不把本轮体验检查称作新的法律核查。证据统一见[本轮验收](USABILITY_REVIEW_0.5.2.md)。
