# Intelligent UI Portability · 项目立项书与工程方案

> 版本：v0.2 接手修订 · 2026-10-16。保留原立项结构；未来方案与当前实测状态分开。所有导出均为 static。
> 当前原型：`UI Portability Lab`，一个独立的 Chrome/Edge Manifest V3 本地研究扩展。与 OpenAI 无关联、未宣称官方兼容。 

## 1. 目标、非目标和判定标准

**目标：** 把用户有权保存的交互式网页内容转换成独立、可验证、长期可用的存档。优先覆盖 GPT-6 Intelligent UI 类使用场景，但不得预设可获得 ChatGPT 的原生结构或事件代码。

- 核心：选择单个界面 → 捕获用户可见内容和有限状态 → 生成带完整性声明的中间表示（IR） → 导出离线 HTML、Markdown、SVG/PNG（按能力）、JSON；未来打包为 ZIP。
- 辅助：保留来源与日期，提示外部资源遗漏，提供用户隐私控制；对已知组件类型，可独立重建交互应用。
- **非目标：** 无损复制 ChatGPT 客户端、反编译/提取 OpenAI 专有组件、抓取全部聊天历史、绕过登录/限流/保护措施、无依据地宣称导出 HTML 与源应用等价。
- 不要求调用任何 LLM 或支付 API 费用才能完成静态保存。

成功不是“导出一个文件就算完成”，而是 **内容正确、隐私有边界、可溯源、无法复现的行为明确列出**。无损导出属于待研究问题，不是计划承诺。

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

| 格式 | 产品角色 | 第一版策略 | 限制 |
|---|---|---|---|
| **HTML** | 静态视觉保真归档的默认格式 | 优先实现 | 默认禁止执行原站 JS，不等于原始交互 |
| **JSON/IR** | 版本化内部合同和验收依据 | 优先实现 | 结构需要持续演进，不等于原生 UI 表示 |
| **Markdown** | Obsidian、笔记、Git 仓库 | 优先实现 | 图表及复杂布局应使用资源引用或 fallback |
| SVG/PNG | 可视化素材 | 优先提供 SVG；PNG 候选 | 图片丢失互动；字体、Canvas、跨域等有限制 |
| **ZIP** | 多文件交付，未来默认高级产物 | 后续实现 | 须包含 manifest/checksum 与资源清单 |
| PDF | 打印/分享 | 后续实现 | 静态页面可打印 PDF，不解决交互 |
| Zeplin | 设计交付平台 | 不属于核心导出格式 | 如有设计协作需求再做适配 |

长期推荐：**一个 IR + 多个渲染器**。对于需要真正离线交互的场景，生成可信的 HTML + JS + assets 并打包 ZIP；对尚无法重建的原生组件，只能发布静态或半结构化快照。

## 4. 技术架构（Proposal）

```text
[用户提供的数据 / 官方数据导出 / 被许可的可见页面]
              │
      [Source Adapter]  ← 只允许合规输入源
              │
      [Capture Snapshot]  ← DOM、SVG、可见文本、有限控件状态
              │
      [Normalize + Sanitize]  ← 脱敏、资源策略、白名单校验
              │
      [IR v0.x]  ← nodes, assets, state, provenance, omissions
              │
       ├── Static HTML renderer
       ├── Markdown renderer
       ├── SVG/PNG renderer
       ├── Archive ZIP renderer（后续）
       └── Rebuilder（后续，只支持白名单组件）
              │
      [Fidelity + Safety Report]
```

**IR 草案：** `schemaVersion`、`source`（类型、日期、可信级别、脱敏的域名）、`nodes`、`assets`（本地 hash 与 MIME）、`state`（仅被明确允许的值）、`capabilities`、`omissions`、`provenance`、`securityReport`。对每个字段增加 `captureMethod` 和 `fidelity`（captured/reconstructed/unsupported）很重要。当前演示原型仅有 `static-snapshot` JSON；不能声称已实现正式组件 IR。

**v0.2 实际落地：** 上图为长期方案；当前只有净化后的 static-snapshot DTO 和多格式序列化，没有正式 IR、文件/官方包导入器或 Rebuilder。现有数据流见 [ARCHITECTURE](docs/ARCHITECTURE.md)。

**各层职责：** 来源适配器不负责导出；捕获层不解释平台私有行为；格式渲染器不主动访问来源站点；重建模块必须使用确定的输入和经过审查的模板，不能执行未经确认的模型生成脚本。

## 5. 获取路径与合规闸门

优先级按风险从低到高：

1. **用户主动下载的官方数据包，离线处理。** 不需要扩展访问 ChatGPT 内部端点。缺点是包里未必有原生 UI，必须用真实样本验证。
2. **用户主动提供的内容、复制的文本或 HTML/SVG、截图。** 本地转换不依赖抓取网站；缺点是需要手工操作、信息可能缺失。
3. **对已获得使用许可的网站进行显式元素选择与可见区域捕获。** 技术实验可以在本地 fixture 验证；用于 ChatGPT 前必须单独完成合规评估。
4. **私有端点、会话 cookie/token、拦截内部流、反编译客户端。** 不进入预设实施方案。不能因为某个 GitHub 项目采用过就视为被允许。

**合规 Gate（强制）：** 适用的服务协议检查完成 → 明确允许的集成机制或获得授权 → 明确数据范围与用户同意 → 最小权限方案 → 再启用 ChatGPT 专用适配。未通过时必须保持 `blocked`，绝不把“用户点击了按钮”当成足以绕过条款的授权。

**封号风险：** 现有使用条款允许对违反条款的账户采取限制措施，但无证据能量化特定用户主动保存行为的封号概率；不能宣传“零风险”或“必然封号”。

## 6. 威胁模型和安全边界

| 风险 | 典型触发 | 缓解策略 | 严重度 |
|---|---|---|---|
| 账号与协议风险 | 抓内部 `/backend-api/`，获取 session token | 禁止私有 API、cookie 访问；ChatGPT 适配单独 Gate | 严重 |
| 隐私泄露 | 全页扫描、后台自动上传、自动保存输入内容 | 只读显式选中区域、本地处理、默认输入脱敏 | 严重 |
| 导出内容 XSS | 恶意 HTML / `onerror` / `javascript:` URI | 标签/属性白名单、静态 HTML CSP、无脚本输出 | 严重 |
| 远程资源泄露 | 导出 HTML 后加载带签名 URL 的图片 | 默认禁止网络资源加载，仅接受受控 data: 图像 | 高 |
| 数据完整性丢失 | 虚拟列表、流式组件、Shadow DOM、iframe | 标注缺失；不声称完整；构造对照样本 | 高 |
| UI 漂移 | 官方迭代导致 DOM 改动 | 平台适配器隔离 + fixture 回归 + 失败即停 | 高 |
| 恶意重建代码 | AI 生成的 JS 直接在高权限扩展中执行 | 重建应用使用沙箱、无扩展权限、只允许打包内代码 | 高 |
| 性能与内存 | 5 万节点 DOM、超大 Canvas | 节点/深度/字节数上限、超限明确失败且不生成残缺文件 | 中 |
| 版权与素材权 | 非用户所有的图片、第三方图表 | 素材许可清单、来源标记、不保证输出具备全部再分发权 | 中 |
| 扩展商店审核 | 广泛 host 权限、远程代码或模糊数据声明 | MV3、本地代码、最小权限、明示用途与隐私政策 | 高 |

**权限原则：** Chrome/Edge MV3；初期 `activeTab` + `scripting`，不声明 `host_permissions`、`cookies`、`webRequest`、`downloads`、`storage`。页面内原生下载不需要 `chrome.downloads`。没有周期任务、远程代码、后台追踪、网络采集。

## 7. 浏览器与平台适配矩阵（计划，非已测试支持）

| 运行环境 | 优先级 | 策略 |
|---|---|---|
| Chrome 桌面 | P0 | MV3 解压安装，本地 fixture 验证 |
| Edge 桌面 | P1 | 共享 Chromium 实现，独立回归 |
| Firefox 桌面 | P2 | 封装 WebExtensions 差异，审查兼容 API |
| Safari / iOS | P3 | 独立扩展/分享面板方案 |
| ChatGPT 网页 | **受合规闸门约束** | 合规可行性、实际组件样本、稳定适配器 |
| ChatGPT 原生手机应用 | 不在首期 | 浏览器扩展无法直接运行在原生 App 内；需官方入口或用户提供文件 |
| Obsidian | P1 | Markdown+assets、YAML frontmatter、资源相对路径 |

适配检测不能只看 `chatgpt.com` 域名；应考虑 streaming 阶段、页面虚拟化、暗色/浅色、移动/桌面、iframe/Shadow DOM、对话折叠、不同组件和状态。不得为适配而绕过隔离或认证设计。

## 8. 产品范围与阶段门

**Exploration / P0 · 技术和合规发现（首先完成）**

- 收集 10–20 个可合法用于测试的组件样本：文字卡片、对比表、SVG、Chart、Slider、Form、计算器、地图、Canvas、iframe；各自记录 DOM 类型、实际可见性、是否动态、资源来源。
- 对官方数据导出包进行本地解析验证（用户自主取得的样本）。确认是否存在足够的组件信息。
- 用本地页面评估原生 DOM、SnapDOM、截图三条路径，输出 fidelity matrix。完成合规 Gate 文档。

**Proposal / P1 · 静态 MVP**

- 显式选择 → 安全过滤 → HTML / Markdown / JSON / SVG 导出；不请求网络数据。
- 错误、资源缺失、脱敏记录可审计；单元素不会触发原网页按钮。
- 提供浏览器测试页、单元/烟雾测试以及真实浏览器人工验收说明。

**Proposal / P2 · 正式 IR 与质量验证**

- `snapshot.schema.json`、迁移策略、黄金样本、视觉差异截图、内容对照。
- 支持资源打包、SHA-256 完整性清单、ZIP 归档和大文件失败恢复。

**Proposal / P3 · 可交互恢复**

- 用确定模板重建：输入/输出型计算器、图表数据切换、滑块控制的数学图像。
- 每种类型要求输入输出等价测试；第三方地图、搜索、服务器操作不能随意伪造离线支持。
- UI 支持等级：`static` / `state-preserved` / `reconstructed-tested`，且必须用户可见。

**Proposal / P4 · 分发与集成**

- Chrome/Edge 商店、安全审核、Obsidian 归档模板、多文件包与可选 PDF。
- 只有在官方接口/条款明确允许并通过 P0 Gate 后，才评估 ChatGPT 专用适配器。

## 9. 验收与失败标准

- **安全：** 敏感文本输入、密码字段不进入快照；导出的 HTML 不包含 `script` / 事件处理 / 远程 URL；扩展没有持久站点权限；不获取会话身份信息。
- **内容：** 对标准 HTML 表格，数据与顺序准确；可选 SVG 可保存几何描述；Markdown 保留公式文本和基本标题结构。
- **视觉：** 相同 viewport/状态/字体条件下按组件边界比较来源与本地 HTML 截图；v0.2 表格 golden 已通过数值门槛，其余暗色/公式样本按结构/样式断言及真实截图记录。不能承诺所有复杂 CSS 100% 一致。
- **交互：** P1 的 HTML 是静态快照；按钮无反应属于约定行为，不应被归类为功能失败。P3 另行规定功能等价。
- **失效：** 对不受支持类型可解释地失败，不能静默丢失内容；超限、iframe、cross-origin 资源必须列在 omissions。
- **回归：** 构建产物不含远程执行代码；对每个新适配器跑 golden fixtures、权限审计、脱敏与视觉回归。
- **商店与真实 ChatGPT：** 尚未验证；不能作为当前已完成验收。

## 10. 当前实现状态（2026-10-16）

| 项目 | 状态 | 证据 |
|---|---|---|
| MV3 Popup → 选区 → 沙箱预览 → 下载 → 本地打开 | Implemented / Tested | Chrome for Testing156，真实工具栏授权/Popup，无 chrome API mock；tests/mv3.spec.mjs |
| 容器父子选择、取消/重复/跨 tab | Implemented / Tested | 同上；原标题点击缺表格故障保留基线复现 |
| HTML/Markdown/JSON/SVG静态导出、安全过滤/遗漏 | Implemented / Tested | security、wave、calculator 与 omissions 实际下载；全部 static |
| 表格视觉 golden | Tested | 1000×238，变化像素阈值>16的比例0、均误差约0.0583；非全站无损 |
| 节点/深度错误、SVG格式错误、过期预览 | Tested | 明确失败不下载，完整日志 tests/evidence/test-run.txt |
| npm test | Tested | 全部扩展JS语法/权限检查 + 8项MV3及1项页面测试，9 passed |
| Windows稳定版 Chrome / Edge / 商店 | Unverified | 本轮无这些浏览器运行证据；提供人工步骤，不据Chromium推断通过 |
| GPT-6 Intelligent UI真实兼容 | Blocked | 未确认原生导出授权路径；域名阻止保留 |
| 正式IR、导出PNG/PDF/ZIP、交互重建、官方包导入 | Proposed | 无实现声明；工程交付ZIP不等于内容导出ZIP |

详细产品规范、竞品/许可研究、保真和安全边界、验收证据分别见 docs/ 与 tests/TEST_REPORT.md。SingleFile当前运行UI截图未取得，竞品运行能力未冒充本项目验证。

## 11. 立项决策记录

- **Decision：** HTML + IR + Markdown 是第一阶段骨架，后续 ZIP 才是可交付互动项目的适当容器。
- **Decision：** 源适配与输出渲染解耦；任何新格式不允许影响数据获取权限。
- **Decision：** 安全和来源透明度优先于视觉 100% 相似。
- **Decision（v0.2）：** SnapDOM3.3.4 已做同条件对照，当前表格未见足够收益且默认捕获普通输入值；只留开发测试依赖，不进入生产扩展。复杂CSS/字体收益待后续评测。
- **Decision（v0.2）：** HTML 来源样式不加品牌页眉/卡片；能力/遗漏放预览与不可见元数据。单个控件值保留也不升级整体能力等级。
- **Proposal：** 对用户熟悉的公式/图表按类型实现独立解释器；模型重建代码不得拥有浏览器扩展权限。
- **Deprecated / Rejected：** 直接调用未公开的 ChatGPT 内部接口、尝试复制客户端私有 bundle、后台批量抓取历史、输出 HTML 后宣称保留全部原始交互。
- **Unknown：** 官方是否会提供 Intelligent UI Export API、官方数据包中包含哪些组件字段、哪些具体用户操作在适用协议下被允许。
