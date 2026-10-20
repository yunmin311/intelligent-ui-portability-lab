# v0.6.0 复杂内容兼容性研究与交付记录

2026-10-20；Implemented / Tested 为下列实际范围，Windows、Obsidian 与真实 ChatGPT 内容为 Unverified。基线是远端已核验的 main `5496b53`，在 `codex/compatibility-v060` 实装，沿用现有扩展与导出器。没有新增依赖或交互配方。

## 1. 研究了什么，样本是否真实

样本源为作者本轮编写并以 CC0 提供的 [复杂页面](../fixtures/compatibility-workspace.html)，不是用户 ChatGPT 对话。九类内容：长文与嵌套列表；数学与特殊字符；宽表与合并单元格；代码与空白；SVG/Canvas 图表；Grid/Flex 复合布局；透明细字图片；嵌套原生 details 与未知表单；混合界面。

测试覆盖六条输入路径。富文本和纯文本通过真实 Chromium Ctrl+C / Ctrl+V，记录可信 paste 事件及浏览器实际提供的 text/html、text/plain；同一复杂页面的 HTML 文件导入和工具栏区域捕获另作比较。截图路径通过浏览器 ClipboardItem 写入 PNG 再真实 Ctrl+V，证明 PNG 剪贴板传输链路，**不能代表 Windows 系统截屏工具兼容性**。另外覆盖 SVG、PNG/JPEG/WebP 文件与 JSON 重导入。路径真实、内容合成，两者分别记录。

富文本剪贴板实得 HTML 6050 bytes、纯文本 880 bytes；净化后94个元素，完整 HTML 文件97个元素。两者 Canvas 图像均为0，区域捕获 Canvas 图像为1。这是输入信息差异：复制 HTML 不携带绘图缓冲，禁止执行文件内来源脚本后也不会重新绘制。字体、外部 CSS 和未挂载内容同样不能凭空恢复。

## 2. 兼容性矩阵与取舍

| 内容/渠道 | 可用信息与成功部分 | 损失阶段、原因分类 | 本轮决定；成本/影响/优先级 |
|---|---|---|---|
| 富文本、HTML文件的嵌套列表 | 标题、顺序、层级、段内强调、续段 | Markdown 导出原先扁平化；实现缺陷 | 修复递归与缩进；中/全部富文本/P1 |
| 有序列表 start/value | HTML已有编号依据 | 捕获丢属性，Markdown阅读器忽略后续编号；实现缺陷与格式限制 | IR1.4保留属性；连续列表Markdown，跳号/负数用净化HTML；中/列表/P1 |
| 引用、代码 | 原始代码空白、反引号、竖线 | Markdown原先弱化引用/强调；实现缺陷 | 引用递归，动态围栏、边界空格、仅表格内转义代码竖线；低/文档/P1 |
| 复杂表格 | rowspan/colspan和单元格 | pipe表无法表达合并；格式限制 | 净化HTML表格回退，HTML保留合并；低/表格/P1 |
| MathML | mfrac/mi/mn等原生结构 | display属性被白名单移除；实现缺陷 | 仅增加安全display，保留块/行内；Markdown明确转向HTML；低/数学/P1 |
| SVG文件、富文本内SVG | 路径、坐标、渐变、文字 | 来源JS与不安全URL净化；安全策略 | 保留原有矢量与局部渐变，无联网依赖；低/图形/P2 |
| Canvas经HTML复制/文件 | canvas元素，无绘图缓冲 | 输入缺信息；脚本执行主动禁止 | 不猜绘图；明确报告，允许区域捕获保存静态PNG；不扩展/P2 |
| Grid/Flex、字体 | 文件的安全内联/本地CSS，区域计算样式 | 剪贴板未携带样式、字体未嵌入；输入缺信息与策略 | 固定静态布局；未恢复响应式规则与外部字体；高/任意网页/后续研究 |
| HTML文件CSS边框 | 安全颜色/宽度在源CSS中存在 | CSSOM把border简写展开为单侧属性，现白名单未覆盖；已有实现缺陷 | 已复现并保留css-border-audit.json；不影响正文，列为后续P2；低/文件视觉/后续 |
| 4K PNG剪贴板/文件 | 实际位图、透明度、细字 | 标准模式约1MP缩小；预算策略 | 新增可选原尺寸PNG分块；中/视觉归档/P1 |
| JPEG/WebP | 已解码输入像素 | 原文件既有有损压缩不可逆 | 原尺寸模式转PNG且不再有损；小样本通过；低/图片/P2 |
| details、未知按钮/表单 | 浏览器原生状态；缺业务实现 | 来源事件禁止；安全策略 | 原生details可离线操作，未知按钮静态/控件脱敏；不增加配方/P1边界 |
| JSON IR | 完整结构、图片及有限模型数据 | 外部来源不具原证明；信任边界 | 校验哈希、旧版本显式迁移、逐模型独立验证；中/全部存档/P1 |

Markdown 的安全 HTML 回退来自已校验 IR，未引入任意原始 HTML 绕过净化。阅读器若禁用 HTML，则应使用 HTML/ZIP。MathML/SVG 在 Markdown 中有明确降级文字；未伪称所有格式等价。

编号策略参照 [CommonMark 列表语义](https://spec.commonmark.org/0.31.2/#list-items)；公式块显示参照 [MathML display 定义](https://www.w3.org/TR/MathML3/chapter2.html)。Canvas 位图解码采用浏览器 [createImageBitmap](https://html.spec.whatwg.org/multipage/canvas.html#dom-createimagebitmap) 和既有图片资源模型。

## 3. 4K 是否确实保存更多细节

同一3840×2160源图包含12px文字、透明底和1px彩条。原模式保存1333×750，即999750像素，原图的12.05%；新归档保存3840×2160，即8294400像素，保留像素数约8.30倍。将导出PNG块按IR坐标重组，与同一浏览器解码源图比较 **33177600个RGBA通道，差异0**；不是预览缩放效果。该结论针对此PNG样本，不外推任意图像编码或跨平台字体。

基线一次测量1860ms，JSON284986 bytes；改进后一次代表性测量3288ms，12块，base64共1029880 bytes、JSON1035440 bytes。每轮和安装包实际时间见[证据](../tests/evidence/v0.6.0/after/4k-metrics.json)，单次运行不构成性能基准。

100ms采样的Linux浏览器进程RSS合计约1.16–1.41GiB（含当前测试浏览器全部进程，含共享页重复计数）；导入页JS堆前后约29.6/37.9MiB。不是独占内存，也不保证捕获到绝对峰值，不能据此宣称低内存设备适用。原尺寸解码有完整输入位图，之后复用≤1MP画布逐块编码；没有同时保留所有未压缩块。最终运行采样原值见 archive-memory.json。

标准模式继续保留输入16MB/40MP/单边16384与输出1MP限制。原尺寸为用户主动选择：≤8.4MP、单边12000；每块≤1MP、base64≤2MB；所有块base64≤2.5MB；整个IR仍≤4MB；既有session上限7.5MB不变。复杂高熵图即使只有1MP也可能被容量拒绝，提示裁剪或改用标准模式；归档不会偷偷缩小或转JPEG。8.8MP在解码前拒绝，高熵容量失败、取消、后续重试、资源篡改均有测试。

HTML与ZIP index.html可显示完整拼合，JSON可往返；notes.md是独立图块，不能当完整拼合页。PNG文件导出不适用于多块容器。图片重编码清除元数据，保留的是解码像素而非原文件字节。

## 4. 三轮验证与审查

| 轮次 | 可复现发现和行动 | 测量与剩余问题 |
|---|---|---|
| 1 基线，生产代码修改前 | 四条专项浏览器场景取证，4个新结构单测失败；原59项浏览器回归通过，新断言暴露列表/公式缺陷 | 4K只12.05%像素；列表扁平；MathML缺display；完整运行61通过、2新场景预期失败，不记为全绿 |
| 2 实装与完整回归 | 列表/引用/表格/MathML修复，IR1.4迁移；可选原尺寸归档；新增真实PNG粘贴及区域捕获 | 51单元+66浏览器通过，PNG像素差异0；扩展异常测试发现一次测试文件MIME不匹配，修正为实际WebP后通过 |
| 3 独立审查与最终用户闭环 | 审查复现混合已验证配方+列表/引用/合并表的MD/ZIP失败，新增先红后绿回归；修复子树验证；跳号用HTML；旧IR1.0直接导出补测 | 最终全量与解压安装包结果见测试报告；源浏览器关闭后，新无扩展浏览器断网打开HTML/ZIP/SVG，公式/合并表/details实际检查 |

未修改既有视觉阈值、Golden或降低安全断言。新套件 [compatibility.spec.mjs](../tests/compatibility.spec.mjs) 7个场景，单元 [compatibility.test.mjs](../tests/unit/compatibility.test.mjs) 9个场景。最终完整检查、安装包运行日志和哈希见 [测试报告](../tests/TEST_REPORT.md) 与证据目录。最后一轮运行时修改了旧版子树处理，因此放弃该轮打包资格，再运行完整检查，避免用测试前后不同的扩展字节打包。

## 5. 数学、表格、图形与交互验收边界

新无扩展浏览器在断网状态打开下载的HTML：MathML块公式可见，mfrac存在；合并表span保留；SVG文件保留渐变；嵌套details可切换。HTML复制和文件中的Canvas未恢复，区域捕获则保存绘图为静态图片。4K HTML和ZIP解压页全部图片解码成功，没有HTTP请求或页面脚本错误。

本轮没有新增交互适配器。现有原生details、Fourier、表格、标签页、加法计算、布尔面板的有限模型继续由完整回归测试；不证明任意第三方等价。Auto恢复经过验证的模型；Interactive需要足够证据并确认未知部分静态化；Static移除行为。新输入不能继承来源可信证明，PNG始终visual-only。已修复有配方时静态Markdown子树被错误按完整配方重新校验的问题，HTML策略仍正常校验原快照。

## 6. 安全、迁移与最终产物

仅activeTab/scripting/storage，无新增权限、云服务、远程运行时。保留隔离净化、CSP、URL白名单、资源哈希、输入预算与ChatGPT自动提取Gate。未知脚本、事件、不安全CSS/SVG URL继续拒绝，敏感控件脱敏，Canvas/正文不自动识别秘密。没有新增依赖。

IR1.4新增安全属性start和display，并捕获既有value用于li。无新增节点种类；多块图使用原div/img资源。IR1.0–1.3先按原版本校验再显式迁移，旧标签伪装新属性拒绝，未知版本拒绝，损坏资源拒绝；旧阅读器不保证读取1.4。重新导入清除外部来源/等价/脱敏证明，有限模型另行校验。

安装包、源码包、SHA256SUMS、package-manifest.json位于本地dist/v0.6.0；安装包测试解压真实ZIP，测试前后逐文件比对。GitHub提交、PR、CI与合并状态应以[测试报告](../tests/TEST_REPORT.md)和实际远端记录为准。仅创建Release草稿，不公开Release，不改许可证、仓库保护或历史。

## 7. 未验证项及距长期目标的障碍

Windows Chrome/Edge、Obsidian GUI：Unverified。本轮Windows GUI工具在初始化前被 `sandboxCwd is not a local file URI: file:///mnt/e/...` 阻断；未更改日常浏览器配置或正式Vault。Chromium/Linux里的离线Markdown与资源检查不能替代Obsidian实际渲染。

真实ChatGPT用户内容：Unverified，未提供且未访问私有接口或登录数据。合成复杂页面只证明所列机制。

实际截图复查还发现：HTML文件边框简写经CSSOM展开后被当前属性白名单丢弃，见after/css-border-audit.json；这是暂未修复的P2视觉问题，不应归咎于输入缺信息。数学α/β的缺字在源页面截图也存在，属于当前数学字体环境，不能以原生MathML树存在宣称所有字形视觉正确。

关键障碍仍是：输入渠道本身缺少CSS/字体/Canvas状态；虚拟列表与未挂载内容；任意业务逻辑和远端数据依赖；超过预算的密集高熵图片；跨浏览器/阅读器差异。优先后续获取授权样本做来源差异诊断，再考虑有限适配；本轮不以新增模拟配方替代这些问题。

本地打开[证据画廊](../tests/evidence/v0.6.0/index.html)，可查看实际前后截图、Markdown、HTML、原始剪贴板和机器测量；来源与导出不加产品装饰。重复的大图、解压副本和中间ZIP未提交，运行时仍可在tests/artifacts中检查。
