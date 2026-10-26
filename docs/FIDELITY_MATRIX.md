# v0.7.1 产品打磨补充

SVG 渐变端点颜色和透明度保留各自声明；相同继承值使用显式 inherit，覆盖浏览器默认样式和 SVG 属性，避免标题/按钮/表头/填色漂移；长文捕获与公开 JSON Schema 单轴上限统一为 100000px，原图片像素/资源/IR 字节预算不变。离线样例入口见 `samples/index.html`，样例均为自建合成内容。Windows 与 Obsidian GUI 仍 Unverified。验收证据见 `tests/TEST_REPORT.md`。

## v0.7.0 当前增量

| 内容 | 本次实现 | 边界 |
|---|---|---|
| CSSOM边框/圆角/溢出/多栏 | 接受净化后展开的安全单侧属性；边框+Grid、Flex+多栏+合并表格+公式在明暗主题实比 | 固定尺寸；不恢复任意媒体规则或危险CSS资源 |
| 完整PNG归档 | ZIP完整图+笔记单图引用，分块和完整图逐RGBA比较；半透明及隐藏RGB不丢失 | 精确模式仅PNG；8位非隔行可分块；灰度ICC使用仅ZIP |
| 高熵PNG | 用户主动仅ZIP，独立PNG与可离线打开的HTML/Markdown | 不进入IR/会话、不含JSON；16MB输入、8.4MP、36MB输出上限；动画拒绝 |
| 数学/字体 | MathML块/行内保留；报告声明来源font-family与未验证字形覆盖 | 系统字体回退依赖机器；不推断LaTeX、不嵌字体；MD提示看HTML |
| 文档Markdown | 合并表格安全HTML、嵌套列表、代码空白保留；ZIP图片完整相对引用 | 实测渲染器不等于Obsidian GUI认证；阅读器需支持内嵌安全HTML |
| 交互 | details与五种有限模型完整回归，多实例/键盘/嵌套/JSON/缩放/离线 | 未新增第三方适配器；未知逻辑静态降级，不执行来源脚本 |

当前证据见[总测试报告](../tests/TEST_REPORT.md)与[截图/离线样例](../tests/evidence/v0.7.0/index.html)。下文为历史版本记录，v0.6.0边框与笔记分块限制已被本轮覆盖。

---

## v0.6.0 当前增量

| 内容 | 本轮保存改善 | 仍有损失 |
|---|---|---|
| 嵌套列表 | HTML起始/项目编号，MD层级与续段；跳号/负数安全HTML回退 | 阅读器禁用HTML时无法显示特殊编号 |
| 代码/引用/强调 | 保留空格换行、围栏、行内代码、引用与上下标 | 不保存语法高亮脚本；上下标需阅读器允许安全HTML |
| 复杂表格 | HTML/ZIP/IR保留跨度；MD合并表格用安全HTML | 纯MD/GFM表格本身没有合并单元格能力 |
| MathML | HTML保留display与原生数学树 | 不转换LaTeX；MD明确导向HTML；实测源环境α/β有缺字，不保证字体视觉 |
| 文件CSS边框 | 现有计算样式捕获流程保留 | HTML文件border简写展开后的单侧属性被遗漏；已复现，P2后续 |
| SVG | 安全矢量、渐变及本地引用 | 来源脚本、foreignObject及远程引用移除 |
| 原尺寸图片 | 可选8.4MP无损PNG分块，HTML/ZIP完整拼合 | 高熵/大文件预算拒绝；不恢复语义/交互；MD只展示分块 |
| Canvas | 合法页面区域捕获可得静态像素 | 复制HTML不携带绘图缓冲；本地HTML脚本不会执行；图表交互不恢复 |

[逐渠道问题矩阵与实测](COMPATIBILITY_REVIEW_0.6.0.md)。IR当前1.4，1.0–1.3显式验证迁移；下文为历史能力说明，标准模式1MP仍有效。交互能力不变：原生details、五种固定模型，未知动作静态降级。Windows/Obsidian/真实ChatGPT仍Unverified。

---

# v0.5.2 保真与能力矩阵

Decision：视觉优先，HTML/ZIP可选择性保留原生details与重建自有模型；其他内容static，图片visual-only。组件级能力与文件级能力独立，不把控件值/滚动位置解释为原始程序恢复。v0.5.2预览缩放只改变frame显示，导出保持IR原尺寸和捕获状态；它不恢复截图经既定1MP缩放后丢失的小字，也不将预览中试操作的状态写回IR。实际证据见[三轮验收](USABILITY_REVIEW_0.5.2.md)。

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
| 滑块/复选框/按钮 | 安全当前值/勾选/禁用外观 | 未知行为禁用；仅显式受控契约且通过模型验证的 recipe 允许有限交互 |
| 输入/可编辑区 | 文本、密码、select、contenteditable脱敏 | 正文、Canvas和截图中的秘密用户自行检查 |
| 未挂载/跨域/远程字体 | 记录限制，不自动加载 | 虚拟列表、未展开内容不可保证完整 |

## 格式

HTML 为主要视觉输出，无额外品牌/标题/页边距；元信息不占画面。JSON 为可重读IR；报告独立。SVG只允许SVG根，PNG只允许≤100万像素的SVG根或已保存为PNG资源的导入图片；JPEG资源使用HTML/ZIP，预览禁用不支持的PNG选项。ZIP归档已有内容并提供SHA-256；不因归档而扩大资源访问。

Markdown保留语义，不承诺像素；复杂SVG/MathML以文字提示查看HTML；独立MD图片提示查看HTML，ZIP内使用相对资源。未对所有Obsidian版本和主题进行GUI验收。PDF、任意HTML截图、第三方任意交互恢复均为 Proposal，未显示成已实现能力。

## 量化验证与技术选择

详见 [测试报告](../tests/TEST_REPORT.md) 和 [实测指标](../tests/evidence/v0.4/complex-diff.json)。同一Chromium、viewport、主题、控件状态、font readiness下，直接对来源和导出组件截图比较，不更换基线来掩盖差异。检查尺寸一致、RGB通道差>16的像素比例及平均绝对通道误差；复杂样本门槛4%/4，不能推广为所有网页的准确率。

SnapDOM 3.3.4仅开发依赖：简单表格与复杂样本实际对照，记录尺寸/差异；其SVG foreignObject路径与本项目严格SVG边界不同，且对输入的截图可能保留秘密。当前不集成、不声称通用截图回退已实现。来源视觉难以保留时报告差异，不通过AI重设计替代。

## 选择性交互范围（v0.5 Decision）

| 组件 / 来源 | Auto / Interactive | Static / 限制 |
| --- | --- | --- |
| details/summary | native-preserved | inert；不复制懒加载或 toggle 处理器 |
| Fourier@1 / table@1 | 显式受控契约后为 model-validated；原有限曲线/筛选排序 | 冻结当前视觉；未勾选不提取模型 |
| tabs@1 | 2–12 个标签与面板，点击、方向键、Home/End | 只保持当前状态；不推断任意标签组件 |
| calculator@1 | 两个 -100…100、步长 0.01 数值的加法 | 不支持表达式、任意公式或服务端计算 |
| state@1 | checkbox 切换恰好两个面板 | 不恢复任意状态机 |
| 合法组合 | tabs 内 Fourier、state 面板内表格等独立面板作用域 | 交叉绑定、共享节点、解析不稳定结构静态降级或拒绝 |
| 外部 JSON | 五种内置有限 recipe 逐项验证后 model-validated | 来源、脱敏、等价声明全部清除；危险树/资源拒绝 |
| 外部 HTML/SVG、普通 DOM | 安全原生折叠；未显式开启受控契约不检测有限模型 | 未知行为禁用，不推断来源程序 |

所有网页有限模型捕获均需 Popup 显式契约，loopback 路径不自动授信。实捕证据为 model-validated-v1；fixture 来源/产物的等价性仅见真实测试报告，不写成页面自证能力。保留历史 reconstructed-tested 枚举兼容性不等于新捕获获得此声明。

Interactive 有未知组件需确认降级，零可恢复交互时阻止导出；Auto 局部恢复。JSON 现行为 IR 1.3，旧 1.0/1.1/1.2 验证后迁移；旧版本不能携带新增模型。关闭来源后的往返、重复实例、多包装结构、嵌套面板、HTML/ZIP 后续操作与实际像素结果见[测试报告](../tests/TEST_REPORT.md)，不由本矩阵虚构测试数量。

Windows Chrome/Edge 与 Obsidian GUI 仍为 Unverified；WSL Chromium 不代替原生 GUI。Proposal：PDF、任意 HTML 截图和任意第三方行为恢复。Exploration：SnapDOM 开发对照。Deprecated：固定 fixture 路径自动等价授信，以及旧版仅 Fourier/table 的当前能力描述。

## v0.5.1 主动输入

| 输入 | 保存与降级 | 标记 |
|---|---|---|
| 截图 | 原/保存尺寸报告；≤1MP重新编码，可能JPEG有损；HTML内嵌，ZIP资源及notes相对链接；不保存原文件 | visual-only |
| 富文本 | 得到的标题/表格/代码/列表/MathML安全表示/有限样式；原生details可保留；未知脚本不恢复，远程资源省略 | static树；导出报告按原生能力派生 |
| 纯文本 | 字面HTML、缩进、首尾及连续换行；HTML预格式化，MD代码围栏 | static |
| 本地IR1.3 | 既有逐配方独立校验和去信任，JSON往返保持 | model-validated，不证明来源等价 |

富文本剪贴板未携带的CSS、字体、图表或公式不能凭空恢复；截图小字经缩放会损失。截图静态MD入口禁用，使用ZIP带资源笔记；Obsidian实际渲染仍Unverified。
