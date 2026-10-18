# v0.2 执行范围（2026-10-16）

依据用户已确认决策，在既有代码上修复，不重建项目。

1. 完整读取 v0.1，冻结 picker 基线，真实加载扩展复现选择/视觉问题。
2. 获取五个参考项目当前 main 快照的 README、关键代码及截图引用；用文件 SHA-256 标记实际内容，不冒充 commit SHA；核验官方条款、数据导出、UI 接口、MV3 政策。
3. 延续既有白名单克隆及 Markdown 转换；修复 SVG 样式、尺寸/背景、节点预算、安全过滤；静态能力标识及遗漏报告。
4. 选择器增加锁定、父/子层级、取消/重复注入清理；Popup 状态；扩展沙箱预览与显式下载，后台只协调当前会话，不采集网络。
5. 真 Chromium 加载 MV3，Popup → 注入 → 选择 → 预览 → 下载 → 文件打开；固定 viewport 的像素比较、安全/异常测试，SnapDOM 同条件对照。
6. 更新核心项目书及设计、架构、安全、能力矩阵、测试报告；交付源码与可安装 ZIP。

架构选择：仅 activeTab+scripting；不增加持久站点权限。捕获结果经 runtime 消息交给扩展 service worker，创建预览页；内存结果有 TTL，worker 重启明确失败可重新捕获，不持久保存用户内容。下载由预览页用户手势触发，避免来源页策略干扰。HTML 保留静态源布局，不加品牌页眉。所有结果标记 static；不推出未经证实的 state-preserved/reconstructed-tested。

执行结果：本地基础实现与真实MV3验收已完成，见 tests/TEST_REPORT.md。SingleFile当前运行UI截图、Edge/Windows与真实ChatGPT接入仍未验证；不将待办项视为已完成。
