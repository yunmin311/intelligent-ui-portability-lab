# Intelligent UI Portability · 项目立项书与工程方案

> v0.5.2可用性收口 · 2026-10-20。保留原立项结构、原项目与历史证据；当前事实按下列Decision及链接文档收敛。与OpenAI无关联，未宣称官方兼容。

本轮通过三轮实际MV3测试修复预览、导入与能力反馈，沿用精密工具设计，不扩展适配器。范围及证据见[当前设计规范](docs/DESIGN_SPEC.md)和[可用性验收](docs/USABILITY_REVIEW_0.5.2.md)。捕获、安全、IR与导出能力边界保持。

## 1. 目标、非目标和判定标准

将用户有权保存的智能界面转换成可携带、可验证的内容。长期关注GPT-6 Intelligent UI类场景，但不得预设可获得ChatGPT的原生组件树、专有事件或代码。当前保存允许页面DOM，或用户主动粘贴的截图、富文本、纯文本及离线文件。手动输入共用主项目导入/净化/IR/预览/导出，不维护第二套工具。

HTML优先保留来源视觉、比例、字体回退与当前可见状态；Markdown服务笔记，JSON承担版本化IR，SVG/PNG按真实范围输出，ZIP封装已有资源。导出不套品牌、装饰标题或AI重设计。默认本地，无后端、付费API或账号。

成功标准是内容正确、隐私有边界、结果可溯源、无法恢复的部分可见。静态快照不是原应用的无损复制；当前静态、像素和经测试的有限交互明确区分，不等同原始程序恢复。

## 2. 已验证的外部事实与行业参考

- 原 v0.1 引用的 GPT-6 发布说明与“组件库/编译器”判断未得到本轮核实，已移出事实依据。项目保留面向智能界面的目标，不宣称已获原生结构或官方导出接口。当前官方 [UI 文档](https://developers.openai.com/plugins/build/chatgpt-ui) 描述开发者自有 MCP UI，不是原生 UI 导出授权。
- [ChatGPT 个人使用条款（2026-01-01 生效）](https://openai.com/zh-Hans-CN/policies/terms-of-use/)：使用条款限制自动/程序化提取服务数据或输出、逆向服务与底层组件；且保留暂停或终止违反条款的账户的权利。用户拥有输出，不等于所有导出机制自动获授权。须进行适用地区/用户协议专项合规核查。
- [ChatGPT 官方数据导出](https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data)：官方提供数据导出途径，可作为离线数据导入来源；目前没有证据确保包内包含完整的 Intelligent UI 组件树或交互定义。
- [AI Chat Exporter](https://github.com/TomSchmidtDev/browser-ai-chat-exporter)：ChatGPT 常规消息支持较完整，但 README 对平台 Artifacts/Visualizer 的支持矩阵主要列在 Claude 侧，且其隐私政策描述了对 ChatGPT 内部会话端点的认证请求。**不得简单复制内部接口策略作为合规基础。**
- [chatgpt-export](https://github.com/thekester/chatgpt-export)：可参考分支、资源归档、ZIP/校验清单和 DOM fallback 结构，不等于已支持 GPT-6 Intelligent UI。
- [SingleFile](https://github.com/gildas-lormeau/SingleFile)：离线 HTML 静态封装设计；注意其 AGPL-3.0 开源许可对复用代码的要求。优先先参考思想。
- [SnapDOM](https://github.com/zumerlab/snapdom)：MIT；可选视觉捕获引擎，包含 SVG/PNG、HTML、PDF、Figma 向量导出相关插件，但需单独核验版本和许可证。
- [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper)：可参考 Markdown 归档及内容选择逻辑。
- [Chrome MV3 权限指南](https://developer.chrome.com/docs/extensions/develop/security-privacy/user-privacy)：最小权限，推荐 `activeTab`，不要申请不必要的 host 权限。

**竞争结论：** 现有工具不构成 Intelligent UI 无损迁移能力的证据。差异应建立在组件级导出、能力标识、格式无关的 IR 与可验证重建，而不只是“多一个导出格式”。

## 3. 格式决策（Decision）

HTML为主要视觉产物；Markdown保留语义并明确复杂视觉降级；JSON为IR1.3.0完整快照，独立诊断不含正文。SVG仅根SVG，PNG仅根SVG或导入图片。ZIP实际包含HTML/IR/MD/资源/manifest/SHA-256/报告，不抓跨域资源。HTML/ZIP支持Auto、Interactive、Static策略；组件能力与文件能力分离。PDF为Proposal。各格式边界唯一详表见[保真矩阵](docs/FIDELITY_MATRIX.md)。

## 4. 技术架构（Decision）

保留v0.2选择流程，拆成独立捕获、净化契约、格式渲染、归档、会话和扩展页模块；原生JS加轻量本地构建，不引入大型框架。每次捕获独立上下文，取消/错误不污染后续结果。渲染器只消费经过严格校验与资源hash验证的IR，不访问来源身份或网络。

离线HTML/SVG在唯一来源、无扩展API的sandbox里净化；JSON在Worker校验、未知版本失败关闭；图片编码像素预检后受控缩放并优先重新编码PNG、必要时JPEG，标记visual-only并报告损失。schema定义、迁移策略、资源与状态契约、上限、数据流见[实际架构](docs/ARCHITECTURE.md)，不是ChatGPT协议。

## 5. 获取路径与合规闸门

用户主动粘贴截图/富文本/纯文本、提供HTML/SVG/JSON/图片和明确允许的本地页面已实现。用户主动提供不等于自动获取来源或交互授权。提供文件不自动证明内容处理权。官方账户包有正式导出渠道，但本轮没有真实授权样本，不猜字段或宣布专用支持。ChatGPT原生UI没有确认到正式允许的自动提取途径，Popup与后台双重禁用。

不得使用Cookie/token、私有会话端点、内部流或反编译组件。浏览器activeTab授权不等于网站提取许可。完整的授权/技术稳定性/隐私与账号风险矩阵见[安全与合规](docs/SECURITY_AND_COMPLIANCE.md)。

## 6. 威胁模型和安全边界

权限activeTab/scripting，新增storage仅供会话恢复；无host_permissions/cookies/webRequest/downloads或远程执行代码。session最多3份、7.5MB估算、10分钟访问有效期；SW重启恢复，浏览器会话结束/扩展重载清空。过期物理清理按后续访问执行，不承诺内存安全擦除。

标签/属性/样式函数白名单、资源MIME/hash/像素验证、CSP和预览sandbox共同约束不可信内容。正文与Canvas秘密不能自动识别；报告明确提示。DOM节点/深度/文本/资源限额和分批取消有真实失败测试，纯Worker转换可终止；单次浏览器原生调用不能伪称硬超时。

## 7. 浏览器与平台适配矩阵

| 平台 | 状态 |
|---|---|
| WSL Ubuntu24.04，Playwright Chromium156.0.8078.4 | Tested：真实MV3工具栏Popup到下载文件打开；非API mock |
| Chrome/Edge稳定版本、Windows原生GUI | Unverified：提供安装入口，不由Chromium测试推定通过 |
| Chromium114最低声明 | Unverified：语法target与API最低要求，不是逐版本测试 |
| Obsidian GUI各主题/版本 | Unverified：Markdown语义与转义有自动测试，无完整GUI适配承诺 |
| ChatGPT原生提取 | Blocked：缺少确认的合法正式接入 |

## 8. 产品范围与阶段门

Decision：v0.5 沿用模块化、离线输入与静态基线，提供原生 details，以及 Fourier/表格/tabs/限定加法/布尔双面板的封闭注册表和局部降级；外部JSON不能自行授予执行权；内置模型经过本地独立校验可安全恢复，但不继承来源等价声明。Auto自动部分恢复，Interactive要求显式降级确认或阻止空交互，Static禁用全部行为。不需要等待ChatGPT接入。

Exploration：复杂页面保真与捕获技术持续比较，SnapDOM仅开发对照，当前不引入生产。

Proposal：PDF、任意HTML截图回退、官方账户包专用解析、任意第三方组件的行为恢复。静态结果绝不标为reconstructed-tested。

Deprecated：v0.2内存Map、混合所有职责的picker与非版本化static-snapshot；仅作为历史保留，不作为当前架构。

## 9. 验收与失败标准

真实Popup→Overlay→捕获→安全预览→下载→打开必须通过。离线HTML/JSON往返、SVG/PNG、ZIP解压/哈希/无网络、SW真实终止恢复/过期、失败重试状态隔离、XSS/敏感输入/超限和复杂组件深浅宽窄像素比较都自动化。严格区分测试通过、实现但平台未测、受授权限制和仅有方案。

打包必须比对完整测试前后扩展hash与实际ZIP内文件；源码与安装包包含构建基准和逐文件hash。不能通过更新视觉基线掩盖缺陷。验收证据与命令以[测试报告](tests/TEST_REPORT.md)为唯一结果来源。

## 10. 当前实现状态（2026-10-19）

Decision / Implemented：模块化捕获、安全IR1.3.0、本地文件导入、HTML/MD/JSON及有限SVG/PNG、ZIP、独立报告、会话恢复、紧凑UI、CI配置和测试绑定打包。选择性交互、IR迁移、CSS属性边界修复与外部来源信任隔离；真实结果/截图见测试报告。本轮CI、安装包逐字节复测和平台未验证项统一见测试报告，不以历史CI代替。

Blocked：原生ChatGPT数据获取及无数据的完整交互恢复。Unverified：其他浏览器/真实官方账户包。Proposal：PDF等上述后续选项。没有为了版本号虚构原生交互或全网站兼容。

## 11. 立项决策记录

- v0.1接手：保留成果，先复现，不按README判断完成。
- v0.2：建立static边界、真实扩展E2E、视觉优先与合规Gate；历史资产不覆盖。
- v0.3：以离线数据入口和版本化IR形成独立可用闭环；拆分职责、增加会话级storage而不扩大网站权限；纯诊断与正文分离。
- v0.4：选择性交互正式进入Decision；三种策略与格式分离，受控模型输入输出等价测试，外部声明不授予执行权，HTML/ZIP离线验证。
- 当前许可证保持UNLICENSED。MIT/Apache-2.0/保留所有权的依据见[依赖与许可](docs/DEPENDENCIES.md)，所有者未决定前不授予新的复用许可。
- 用户已授权更新后提交、推送、合并；不公开发布Release或商店。
- v0.4.1：IR1.2安全模型往返；清除外部等价声明；Interactive显式确认；全安装包MV3回归。


## 12. v0.5 收敛决策（Decision）

所有网页有限模型提取须由用户在 Popup 显式勾选受控组件契约；本地 fixture 不例外。Source Adapter 分离普通 DOM、用户受控契约和本地文件，路径不能认证所有权；实捕模型证据一律 model-validated-v1。外部 JSON 独立校验后也只能获得模型证明，来源等价性只由真实测试在报告中记录。

IR 1.3 增加 tabs@1、calculator@1、state@1，保留 Fourier/table。加法输入各 -100…100、步长 0.01；布尔状态只控制两个面板。合法组合允许独立面板内的嵌套组件，禁止交叉绑定；具体范围以架构与保真矩阵为准。

插件 UI 保留已有令牌与布局语义，分组工具栏、单一主操作、有界报告、折叠遗漏与逐组件证据；实际截图见 [UI 审查](docs/V05_UI_AUDIT.md)。当前交付为本地 dist/v0.5.0 安装与源码 ZIP，没有公开 v0.5 Release。历史版本链接不作为当前入口。

Windows Chrome/Edge 与 Obsidian GUI 继续 Unverified：本轮 Windows GUI 工具因 sandboxCwd 启动失败，不能据此声称原生应用已验收。测试数量、运行平台、完整安装包结果统一引用[测试报告](tests/TEST_REPORT.md)。ChatGPT Gate 与 UNLICENSED 不变。

Proposal / Exploration / Deprecated 的既有边界继续有效；新增 Deprecated 项为按固定 fixture 路径自动授予捕获等价声明。官方资料章节保留既有核对记录，本轮未重新核验外部条款与产品信息。
