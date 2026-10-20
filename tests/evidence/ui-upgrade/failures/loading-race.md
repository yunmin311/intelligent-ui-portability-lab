# UI回归调试记录

1. 忙碌状态截图后再通过locator点击“取消”，转换可能已经完成并隐藏按钮。最初测试因此等待隐藏控件超时。保留同目录loading-race.log；最终测试在真实busy状态截图后，仅在按钮仍可用时取消，并等待aria-busy=false，再验证后续导入恢复。已有v0.5.1测试继续验证确定性的即时取消。
2. 文件选择键盘测试未显式激活导入页，也未结束filechooser，在连续主题路径中出现等待事件超时。保留filechooser-first-attempt.log。测试增加bringToFront和setFiles([])；生产拖放入口由旧div改为原生button后移除重复keydown，使用浏览器原生键盘语义。补充375px测试时仍发现偶发失败，保留filechooser-reused-context.log。最终场景使用独立浏览器会话，在按Enter前确认document.hasFocus()，等待拦截订阅与焦点就绪；通过结果见最终日志，不按修复推测通过。

这些是调试记录，不是最终验收结果。没有修改来源保真阈值、延长业务安全时限或伪造loading状态。

日志仅清理行尾空白，未改动失败信息或测试结论。
