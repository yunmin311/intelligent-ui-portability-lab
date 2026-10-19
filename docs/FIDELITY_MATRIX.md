# v0.4.1 保真与能力矩阵

Decision：视觉优先，HTML/ZIP可选择性保留原生details与重建自有模型；其他内容static，图片visual-only。组件级能力与文件级能力独立，不把控件值/滚动位置解释为原始程序恢复。

| 内容 | 当前实现 | 差异/失败边界 |
|---|---|---|
| Grid/Flex/定位/中文 | 计算样式、固定来源尺寸、系统字体 | 不嵌字体，不保存响应式规则；复杂祖先依赖可能不同 |
| 根2D变换 | 保留布局尺寸，以外层画布归一变换包围盒 | 3D/SVG根变换明确降级并报告；祖先变换不保证 |
| 表格/Markdown | 视觉HTML；MD列、转义竖线 | MD合并格降级提示；不同Obsidian主题表现有差异 |
| SVG | 渐变、裁剪、路径/坐标轴，本地ID重映射 | 不支持use、foreignObject、活动动画；长属性超过上限失败 |
| MathML | 原生白名单结构/样式 | 渲染器/字体相关；MD提示查看HTML，不声称LaTeX还原 |
| Canvas | 可读且≤100万像素转PNG | 污染/过大占位并报告；不含数据/逻辑，像素秘密不自动识别 |
| 图片 | 安全内嵌PNG/JPEG/WebP；文件导入解码再编码PNG | 远程图片占位不抓取；图片仅visual-only；复杂/损坏编码拒绝 |
| Shadow DOM | 展开开放根 | 封闭根不可读，slot分发不保证 |
| 伪元素 | 简单字符串before/after转静态span | counter、多段、图片等提示遗漏 |
| 嵌套滚动 | 包装内容并冻结当前偏移 | 不恢复滚动/粘性定位交互；复杂布局有差异 |
| 滑块/复选框/按钮 | 安全当前值/勾选/禁用外观 | 未知行为禁用；仅自有Fourier/table有限recipe允许重算与筛选 |
| 输入/可编辑区 | 文本、密码、select、contenteditable脱敏 | 正文、Canvas和截图中的秘密用户自行检查 |
| 未挂载/跨域/远程字体 | 记录限制，不自动加载 | 虚拟列表、未展开内容不可保证完整 |

## 格式

HTML 为主要视觉输出，无额外品牌/标题/页边距；元信息不占画面。JSON 为可重读IR；报告独立。SVG只允许SVG根，PNG只允许SVG根或导入图片。ZIP归档已有内容并提供SHA-256；不因归档而扩大资源访问。

Markdown保留语义，不承诺像素；复杂SVG/MathML以文字提示查看HTML；独立MD图片提示查看HTML，ZIP内使用相对资源。未对所有Obsidian版本和主题进行GUI验收。PDF、任意HTML截图、第三方任意交互恢复均为 Proposal，未显示成已实现能力。

## 量化验证与技术选择

详见 [测试报告](../tests/TEST_REPORT.md) 和 [实测指标](../tests/evidence/v0.4/complex-diff.json)。同一Chromium、viewport、主题、控件状态、font readiness下，直接对来源和导出组件截图比较，不更换基线来掩盖差异。检查尺寸一致、RGB通道差>16的像素比例及平均绝对通道误差；复杂样本门槛4%/4，不能推广为所有网页的准确率。

SnapDOM 3.3.4仅开发依赖：简单表格与复杂样本实际对照，记录尺寸/差异；其SVG foreignObject路径与本项目严格SVG边界不同，且对输入的截图可能保留秘密。当前不集成、不声称通用截图回退已实现。来源视觉难以保留时报告差异，不通过AI重设计替代。

## 选择性交互范围（v0.4.1 Decision）

| 组件/来源 | Auto / Interactive | Static / 限制 |
|---|---|---|
| details/summary 已有内容 | native-preserved，浏览器展开折叠 | inert；懒加载/原站toggle处理器不复制 |
| 自有loopback Fourier@1 | reconstructed-tested；N、振幅、相位重算 | 当前SVG路径/值；不推断其他滑块行为 |
| 自有loopback table@1 | reconstructed-tested；有限数值筛选与稳定排序 | 冻结当前可见结果 |
| 混合区域 | 支持部分交互、未知部分static-fallback，文件partial-interactive | 全部static |
| 外部JSON/HTML/SVG | JSON已知配方独立校验后为model-validated；HTML/SVG仅安全原生details | 不继承外部来源、脱敏或测试声明 |

Interactive有未知组件需确认降级，零可恢复交互时阻止导出；Auto自动局部恢复。外部JSON的模型匹配不证明来源行为等价，也不继承外部声明。

三个已知案例均在真实下载HTML和ZIP解压后运行测试；v0.4.1增加关闭来源页面后的JSON往返。初始视觉直接比较来源/交互/静态产物；新样本门槛变化像素<2%、MAE<2，不改旧基线掩盖失败。实际数值与失败修复证据见测试报告。动态后续布局仅有限高度自适应，不承诺原始响应式规则、事件顺序或任意嵌套CSS等价。
