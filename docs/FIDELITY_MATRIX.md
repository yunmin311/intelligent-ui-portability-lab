# v0.2 保真与能力矩阵

所有产物标记 **static**。`state-preserved` 要求明确状态合同和重载/操作测试；`reconstructed-tested` 另需输入输出等价测试，本轮均未授予。保留某个 value 或 path 不意味着恢复原组件。

| 组件/条件 | 实现与实测 | 差异/限制 |
|---|---|---|
| HTML 表格 | 内容、顺序、计算样式、border-box 尺寸；真实下载后像素比较通过 | rowspan/colspan 可保留 HTML 属性；Markdown 合并单元格退化；不推广为全站零差异 |
| 标题/文字/列表 | 净化 DOM、内联字体/颜色；Markdown 结构 | 字体文件不打包、Unicode 可见文本不做语义脱敏 |
| SVG 曲线 | 原生 namespace、长 d、stroke/fill；修改滑块后几何一致 | 局部渐变/clip/mask URL 引用、use、foreignObject 移除；metadata 报告 |
| 滑块/checkbox | disabled 静态 value/checked；计算器 7²=49 和勾选外观实测 | 无输入事件、原始计算与状态恢复合同 |
| Canvas | 可读 Canvas 转 PNG，实测有内嵌图 | 被污染/超大时报占位；画布文字可能敏感，不能自动脱敏；无数据点 |
| 公式 | 上下标和普通公式文本；MathML 降为文字并报告 | 不支持 MathML 视觉语义、LaTeX 源码恢复或 MathJax/KaTeX 专用适配 |
| Grid/布局 | 当前计算 grid 列/行、gap；网格 fixture 实测 | 响应式规则/祖先选择器不保留；复杂 absolute/fixed 布局需单独 golden |
| 浅色/暗色/尺寸 | 1000px 表格 golden；620px 暗色波形断言/截图；540px 计算器 | 只有表格做数值像素比较；暗色和计算器不是零差异声明 |
| CSS 伪元素/动画/transform | 检测并报告 | 不完整恢复伪元素、时间轴和变换；无自动截图 fallback |
| Shadow DOM/iframe/自定义元素 | 检测并报告，iframe 移除 | 封闭 Shadow 无法识别内部；只有标签提示，不保证每种未知缺失都可识别 |
| 图片/字体/链接 | 安全 base64 PNG/JPEG/WebP/GIF；外部 URL 样式/属性移除 | 远程图片占位、字体回退、链接不可导航；无隐式下载或代理 |
| 可编辑/表单/隐藏区域 | 输入脱敏，hidden/display:none 不导出；XSS 测试 | 不能检测段落里的密码，不能推断所有 CSS 遮挡/屏幕外隐私语义 |
| 未挂载内容 | 通用遗漏声明 | 不滚动加载虚拟列表，不访问隐藏 API，不宣称完整会话 |

## 数值视觉验收

`tests/evidence/table-diff.json`：同 Chromium 156、viewport 1200×900、同状态/系统字体，来源与本地导出均按组件边界截取（不包含外部阴影）。尺寸 1000×238；RGB 任一通道差 >16 才计为变化像素，比例 0，平均绝对通道误差约 0.0583。门槛为比例 <1.5%、均误差 <2；不是每个像素完全相同，也不是跨操作系统保证。

SnapDOM 3.3.4 对照 `snapdom-comparison.json`：来源 1000×238，core.toPng 1000×237，尺寸不等不强行缩放算 diff；SVG 含 foreignObject、原始普通输入值被捕获。结论：**只保留开发对照依赖，不接入产品**。这不否认其字体/伪元素/Shadow 支持的潜在收益，也未评估可选 HTML/PDF 插件；未来需在先净化后捕获和复杂 CSS 样本上重新量化。
