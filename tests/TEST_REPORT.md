# v0.5.0 验收报告 · 2026-10-19

Decision：在已有项目内开发；开始前 fetch，实际 main/origin/main `22da495b300d080e1aa0840c2494cdfbbea21e2c`，工作区干净。工作分支 `codex/v0.5-adapters`。历史 v0.4.1 报告可从该基准提交读取，历史 evidence 均保留。

## 实现与能力

**Implemented：** 关闭式版本化 Registry，Source Adapter 契约，tabs@1、calculator@1（有界求和）、state@1（布尔双面板）；Fourier/table/native-details 整合到统一能力系统。IR1.3，1.0/1.1/1.2 迁移、逐项校验、固定运行时和 HTML/ZIP 统一策略。Popup 显式受控契约，预览紧凑操作栏及有界可展开报告。详见 [架构](../docs/ARCHITECTURE.md)、[能力矩阵](../docs/FIDELITY_MATRIX.md)、[UI 审查与实际截图](../docs/V05_UI_AUDIT.md)。

识别与模型校验严格分离；页面标记、域名、localhost 路径均不能授予来源等价证据。所有页面有限模型捕获都需用户显式请求，后台绑定 tab/origin/5分钟授权；控件仍须逐项通过校验。实捕、导入均只给 `model-validated`；受控 fixture 的输入输出等价证据保留在本报告，不冒充任意来源程序证明。新捕获不授予 `reconstructed-tested`。

## 测试范围和可复现命令

```sh
npm ci
npx playwright install --with-deps chromium
npm test
npm audit --audit-level=high
npm run package
npm run test:package
```

最终日志与 hash 证明在 [本轮 evidence](evidence/v0.5.0/)；完整生成数据在忽略目录 `tests/artifacts/v0.5.0/` 与 CI Artifact，不再次提交数万行快照。

`npm test`：语法/权限/版本、JSON Schema 无漂移、38项单元、33项浏览器测试。其中28项真实 Linux Chromium MV3（原21项、新增7项），1项普通页面选择器、4项源模块捕获安全测试；后5项不冒充扩展 E2E。完整保留原覆盖，旧 schema 版本断言更新至1.3，不放宽视觉阈值。

真实 Popup 使用 CDP `Extensions.triggerAction` 点击工具栏，操作实际弹窗 DOM；无权限或 chrome API mock。涵盖选择、取消、重复注入、下载/打开、本地文件、失败恢复、session重启/过期、恶意消息、格式竞争和资源校验。最终安装包另解压到独立临时目录，加载该 ZIP 的原字节运行全部28项 MV3：**28项通过**；不重建替换包。见 [安装包测试日志](evidence/v0.5.0/installed-test.log) 和 [逐文件hash证明](evidence/v0.5.0/installed-package.json)。

环境：WSL2 Ubuntu24.04、Node24、Python3.12、Playwright1.64.1、Chromium156.0.8078.4 / Linux。精确运行记录见 [runtime.json](evidence/v0.5.0/runtime.json)。依赖审计全级别0漏洞，锁定依赖及许可不变，SnapDOM仅开发对照。

## 行为、往返和视觉

A/B两种不同 DOM 层级 × 浅/暗主题，1200/375视口：操作两个独立tabs、加法计算、布尔开关与details内第二计算器 → 重置到明确初态 → 真实捕获保存JSON → **关闭原来源和原预览** → 导入 → 重新验证 → HTML/ZIP → file://实际操作。多组数字含边界、精度及非法输入；键盘、ARIA、当前状态、组件独立性均断言。

嵌套复合 fixture 两种主题分别验证：tabs内Fourier、状态面板内筛选表格；切换外层与内层参数不串扰。ZIP逐资源SHA-256，HTML/ZIP监听零HTTP(S)请求及零运行时错误。未知控件不获得行为。

初始来源与重导入HTML、Static使用同浏览器/viewport/主题/状态/字体截图，尺寸严格相同。像素通道差>16计变化；沿用变化比例<2%、MAE<2，未改门槛或替换历史基线。四组详细数字见 [results.json](evidence/v0.5.0/results.json)。[代表性来源](evidence/v0.5.0/a-light-source.png) / [重导入输出](evidence/v0.5.0/a-light-roundtrip.png)，[真实离线HTML](evidence/v0.5.0/a-light-roundtrip.html)。样本来自自有fixture，不是ChatGPT。

Auto 自动恢复合格有限模型，其余报告静态降级。Interactive：零恢复阻断；混合未知组件需显式确认，HTML/ZIP一致。Static 无固定运行时、原生details也冻结，保留当前状态；静态格式不显示可执行能力。固定面板高度保留；Typed OM确认auto才保存自然高度，无法判定则保守保留并报告。

## 安全与修复证据

保持 activeTab/scripting/storage，无新增持久网站权限、cookies/webRequest/远程执行。外部JSON清除来源、安全、脱敏与等价声明，逐模型精确字段、版本、范围/步长、命名空间、绑定唯一性、状态/输出及资源hash校验；未知配方局部降级，不执行代码/表达式。

负样本覆盖未知/恶意recipe、假来源/证据、跨组件/重复/逃逸绑定、非法输入、CSS/XSS/SVG、CSP附加代码、URL/MIME/hash、ZIP路径。新增对HTML解析器重排的面板语法约束，避免隐藏内容被浏览器移出面板；普通ARIA属性安全省略、重复ID与引用省略并诊断；5000节点/75层预检及abort先于候选扫描，候选最多20。固定/自动高度回归通过。独立安全审查的5项发现均已修复并专项复核。

中间全套回归曾出现3项失败：两个测试仍断言IR1.2，一个测试依赖旧拓扑诊断类别。已同步版本并保留“结构不匹配”类别；最终重跑和安装包复测为交付依据，失败摘要保留于 [failures.json](evidence/v0.5.0/failures.json)。未通过增大阈值或删除断言消除失败。

## 打包、CI与状态

测试前后对全部扩展文件hash比对，测试通过才生成 verified-build。package脚本检查两个 ZIP 内含扩展与该证明逐字节相同；安装包实测前后再次比对。当前资产见 `dist/v0.5.0/`，安装/源码 ZIP、SHA256SUMS及package-manifest。构建记录基准提交和dirty标志，实际sourceDigest/文件hash界定内容，不称为纯基准构建。Release仅[草稿](../docs/RELEASE_NOTES_0.5.0.md)，未公开发布。

当前workflow `chromium` 运行audit、构建/静态/schema、单元、浏览器、打包和安装包验证，上传完整证据与包。远端本轮运行需在提交推送后独立核对，最终交付列当前链接及HEAD；不使用历史main成功代替。建议main保护要求PR和必需检查 `chromium`、禁force push/删除；本轮未变更仓库规则或授权。

**Unverified：** Windows Chrome/Edge、Obsidian GUI。实际尝试Windows桌面桥初始化，工具返回 `sandboxCwd is not a local file URI: file:///mnt/e/...`，在应用操作前失败；不能声称已安装或功能通过。最短步骤见 [人工验收](MANUAL_ACCEPTANCE.md) 与 [platform-status.json](evidence/v0.5.0/platform-status.json)。其他Chromium版本/最低114、读屏、真实峰值内存亦未完整验证。

**Blocked：** ChatGPT自动提取缺公开确认接口/授权；官方账户包适配缺真实授权样本。Gate保持。

**Proposal：** PDF、更多有明确模型/授权的适配器、真实第三方来源等价验证。**Exploration：** SnapDOM仍开发比较，不增加生产捕获依赖。**Deprecated：** 固定页面路径授予fixture身份的旧规则，历史版本入口不作为当前能力。

仍有限制：任意第三方业务JS、远程资源、未挂载/虚拟内容、封闭Shadow、完整响应式CSS未恢复；正文/Canvas秘密无法全面自动脱敏；浏览器同步style/Canvas调用不是硬超时；session逻辑过期10分钟，访问触发物理清理。许可保持UNLICENSED。

## 源码变更索引

- 新增 core/adapters.js、sources.js、capture/adapters.js；更新 interactions/ir/policy/runtime/render/import-snapshot 和 capture/dom/picker；schema生成与IR迁移。
- background/popup：tab授权、来源契约及重复后台校验；preview/ui：报告层级和下载操作；构建picker/import-sandbox/runtime-source/build-info由脚本生成。
- 新增 adapters-a/b/composite fixture、v05单元与浏览器/安全/组合测试；旧MV3版本断言与显式契约同步。
- 版本/lock/manifest、安装包验证、CI Artifact、生成证据治理；项目书/README/架构/设计/安全/保真/变更日志及当前Release草稿。

完整逐行变更由本轮Git提交/PR保留；未删除既有成果或重写历史。
