# v0.3 实施与状态（2026-10-18）

基线：fetch 后 main / origin/main 均为 4a494540c46080e4034744418638d4436c77cb9a，工作区干净。工作分支 work/v0.3-portable-snapshots；禁止推送。用户已授权本轮全部实现和必要技术选择。

## Decision

保留 v0.2 选择器与样式白名单，拆成 src/capture、src/core 及扩展页；原生 JS + esbuild 单一内容脚本，扩展页 ESM。正式 IR 1.0.0，仅允许受验证的树/资源/有限状态，renderers 不接触来源。后台 storage.session 仅 TRUSTED_CONTEXTS，3 份/7.5 MB估算 总量/10 分钟，消息校验与串行写入。JSON 是完整 IR，diagnostic-report 永不含正文/HTML/资源。离线 HTML/SVG 在无扩展权限的 sandbox 中解析和渲染，图片标记 visual-only，JSON 校验与资源 hash 重验。工作 Worker 可 terminate；DOM 遍历协作取消，单次浏览器原生样式/Canvas 调用不是硬超时。

## 顺序与验收

- [x] 基线 npm test 与故障复现；独立 Node 单元测试先失败，覆盖 schema/迁移/净化/资源/ZIP/诊断边界。
- [x] core/policy.js、ir.js、render.js、archive.js：严格、版本化、资源 SHA-256；验证失败不渲染。测试恶意/超大树、非法状态、schema 版本、ZIP CRC/hash。
- [x] capture/dom.js + picker.js：每次独立上下文、分批取消、局部 SVG 引用重映射、MathML、伪元素/开放 Shadow、滚动当前可见裁剪。原有 9 项测试保留语义并修正已升级行为断言。
- [x] background.js src/core/session.js：来源/schema/消息大小/TTL/容量/并发写入；SW 真终止重启测试、过期/删除/报告隔离。
- [x] importer sandbox + import/preview UI：HTML/SVG/IR/PNG/JPEG/WebP 文件入口，隔离/无网络/限额/超时清理/格式选择；HTML/JSON 往返和 PNG/ZIP 实际下载打开。
- [x] 复杂 fixture 深浅/宽窄 golden、注入攻击与失败重试、压力与取消，自动记录图片和指标；自有交互重建为可选，若做须独立输出与等价测试。
- [x] CI lint/单元/E2E/audit/打包；构建与实际测试源码 hash 关联；文档更新单一事实来源；许可证保留 UNLICENSED 并解释候选。本地提交完成后打包校验，不推送。

## Exploration / Proposal / Deprecated

Exploration：复杂 fixture 与 SnapDOM 对照判断是否值得集成；原生调用阻塞和跨进程隔离限制需如实报告。
Proposal：PDF、官方账户包适配（无真实授权样本）、专用原生交互恢复。
Deprecated：v0.2 内存 Map、非版本化 static-snapshot、picker 承担所有序列化；已有 v0.2 dist/evidence 历史保留，不覆盖。

Decision：独立审查的5项确定性缺陷已修复并增加回归。交互重建未进入实现范围，保持 Proposal；不标注 reconstructed-tested。CI已提交配置，远端执行须由后续明确授权的推送触发，本轮不推送。
