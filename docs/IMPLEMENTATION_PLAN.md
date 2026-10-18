# v0.4 实施与状态

基准：2026-10-18 fetch 后 origin/main = 2e49833f5ecf37f6adf5a119bb904bf21ae6ef49；独立 work/v0.4-selective-interactions；初始工作区干净。v0.3 基线 10 单元 + 15 浏览器通过。当前 main CI run 39121539504 success。rulesets=[]，main protection API 返回 Branch not protected；只读核实，不修改管理配置。本轮只本地提交，不推送/合并/发布。

## Decision

沿用 capture → IR → renderer/Worker → session → preview。IR 1.1 将静态树与有限 recipe 分离；旧 1.0 可读并显式迁移。仅受控本地 fixture 的已知 Fourier/table recipe 可重建；任意 HTML/JSON 导入剥离 recipe 声明，来源/安全声明标为未验证。原生 details 是浏览器行为，可由结构验证；未知控件静态。Auto/Interactive/Static 与格式分别选择；混合区域逐组件降级。交互脚本全部随产品提供，内容不携带执行代码，不使用 eval，不联网。

## 实施顺序

- [x] fetch、源码、基线、远端 CI/保护只读审计。
- [x] 先失败回归：CSS 声明边界、外部声明、IR迁移、有限模型、策略。
- [x] 受控 fixture + native details/Fourier/table 模型、绑定验证、独立离线运行时。
- [x] HTML/ZIP renderer、沙箱预览、策略/组件报告、静态兼容。
- [x] 真 MV3 Popup→捕获→策略→下载→file:// 打开；等价/视觉/XSS/外部请求/ZIP SHA。
- [x] 完整回归、审查修复、版本/文档/可追溯打包和本地提交。

## Proposal / Exploration / Deprecated

Proposal：PDF、正式授权来源适配、真实官方账户样本。ChatGPT 原生抓取仍 Blocked。Exploration：受控来源的识别不是签名认证，不构成第三方程序恢复证据。Deprecated：把 static 当作全部产品目标；把 schema 合法当作外部来源/脱敏事实证明。

## 独立审查与修复

独立审查实际复现两项 P2：捕获闭合 details 时开关状态触发源页面 toggle；原生折叠位于已解析 grid 行高内，展开覆盖后续内容。先增加真实 MV3 回归得到 toggle 次数 2（期望 0）的失败证据，再移除源状态修改、调整原生折叠祖先的静态高度/grid 行解析值；复测源事件为 0，展开内容不覆盖下一行。证据与最终结果统一见 tests/TEST_REPORT.md。
