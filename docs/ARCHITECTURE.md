# v0.2 实际架构

2026-10-16。沿用原 MV3 Popup + picker 的结构，保留原 Markdown/白名单捕获基础，在上面修复与增补；没有引入生产捕获依赖。

```text
用户工具栏调用（activeTab 临时授权）
 → popup.js 检查协议/ChatGPT Gate、选择格式、executeScript
 → picker.js 独立存活于原标签页；Shadow Overlay 选择/调整/取消
 → safeClone：白名单、计算样式、输入脱敏、资源过滤、容量检查
 → 一个净化 DOM → HTML / Markdown / SVG / static-snapshot JSON
 → background.js 校验消息来源/大小 → 内存 Map → 打开 preview.html?id=UUID
 → preview.js 请求快照 → sandbox iframe 静态预览 / pre 文本预览
 → 用户点击 → Blob + 原生 a.download → 下载列表 → 本地文件
```

## 文件职责与生命周期

| 文件 | 职责 |
|---|---|
| manifest.json | MV3，activeTab + scripting，action Popup、service worker，打包内 JS |
| popup.html/js、ui.css | 产品 UI；失败反馈；标签页 URL Gate；格式通过 isolated-world 变量传给 picker |
| picker.js | 重复注入先移除旧监听和 Overlay；语义候选、父/子链、同步净化、序列化；不直接下载 |
| background.js | 捕获来源必须是 HTTP(S) 顶层标签页且非 ChatGPT；消息上限；临时快照与逐 tab 状态；打开预览 |
| preview.html/js | 只接收扩展后台返回的净化产物，文本节点呈现报告；iframe 无 sandbox allow 权限；原生下载 |

Popup 关闭不移除 picker。每标签页各有 isolated world，切换 tab 不移动选择器；再次点击工具栏可继续查看状态或重新选择。取消清除原页监听；捕获成功也清除。遍历失败保留原选择器和错误，可取消缩小重试。页面重载/导航会丢失选择。

后台至多 3 份，后到逐出最早一份，期限 10 分钟，过期清理在消息到来时执行。SW 终止会清空内存，预览按钮保持禁用并提示重捕获。此策略选择不持久保存正文，暂不支持长期打开预览。状态 Map 在 tab 关闭时清理。结果提示是“已发起下载”，不假装能观测系统最终写盘成功；E2E 独立检查 download.failure、读取保存文件并打开。

## 数据合同与格式

JSON 字段：`schemaVersion:0.2.0`、`kind:static-snapshot`、`capability:static`、UTC capturedAt、origin（无路径/query/title）、dimensions、stats、limitations、omissions、html、text。不是正式 IR；没有组件数据模型、state machine 或适配器注册系统。

HTML 中所有样式均来自净化白名单与当前计算值；根重置放置坐标和 margin、固定来源 border-box 尺寸，body 仅归零并补最近不透明祖先背景。无品牌页眉或自定义卡片。HTML meta 与 SVG metadata 内嵌能力/遗漏；Markdown 用注释；独立报告不含 html/text。HTML 的安全 CSP 禁止连接、脚本、表单和远程资源；预览再叠一层无脚本 sandbox。

## 限制与后续

同步遍历会短暂阻塞页面，3 秒预算只在节点间检查，单次昂贵 Canvas/样式计算不能被强制中断。固定尺寸利于当前态复现，不等于跨 viewport 响应式恢复。CSS 白名单不覆盖全部排版语义。普通网页已允许启动，页面应授权与能力覆盖仍由用户/许可决定。正式 IR、资源打包、官方包导入及可测试重建均属 Proposed。
