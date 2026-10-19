# Windows / Obsidian 人工验收 · v0.5.1

状态：**Unverified**。2026-10-19 本轮重新调用 Windows Computer Use，初始化仍失败。上一版记录的 Windows 浏览器及 Obsidian 安装信息不能作为本轮运行证据。桌面控制工具在当前 WSL 工作路径初始化失败：`sandboxCwd is not a local file URI: file:///mnt/e/30_%E9%A1%B9%E7%9B%AE/intelligent-ui-portability-lab`。没有修改用户浏览器配置或现有 vault。Linux Chromium 自动化结果不能代替以下平台验收。

## Chrome 与 Edge 分别执行

1. 解压 `Intelligent-UI-Portability-Lab-v0.5.1-extension.zip`，先用 PowerShell `Get-FileHash -Algorithm SHA256 <ZIP>` 与 SHA256SUMS 对照。到各自 `chrome://extensions` / `edge://extensions`，打开开发者模式，加载包内 `extension`。确认显示0.5.1及 activeTab/scripting/storage；没有持久站点授权。
2. 在仓库 WSL 运行 `python3 -m http.server 8765 --directory fixtures`。Windows 浏览器打开 `http://localhost:8765/selective-interactions.html`。改变谐波8、振幅1.3、相位-0.75；表格筛选30并降序；展开折叠。保存来源截图并记录浏览器版本、主题、1200×900视口。
3. 从工具栏真实 Popup 勾选受控来源契约（只用于自己拥有且符合有限模型的组件），选JSON，选择mixed区域，箭头扩大/缩小，Esc取消一次，再重进Enter捕获。下载JSON，**关闭来源和原预览标签页**。
4. Popup→导入本地文件→选刚下载JSON。预览应显示local/external-unverified及model-validated，不能显示来源等价已证明。HTML/Auto能下载；Interactive必须明确确认未知按钮静态降级；Static禁用所有交互。切格式后确认框重置。
5. 下载HTML后用本地文件打开。反复开合details，检查动态高度；Fourier改N/振幅/相位；表格筛选、升降序、清空；未知按钮不能执行。初始画面应保留来源状态。打开DevTools Network清空记录、重载并操作，确认没有HTTP(S)请求。
6. 切ZIP，重新确认降级，下载解压打开index.html，重复同样操作。用SHA256SUMS校验成员；关网仍能使用。Static HTML不得有script或可操作控件。纯静态页面的Interactive必须提示“没有可恢复交互”并禁用下载。
7. 浅/暗主题各执行一次，保留来源/导出截图、下载文件、控制台错误、网络记录和通过/失败表。Popup→chatgpt.com应明确禁用；不要尝试登录数据或私有端点。

## Obsidian

使用独立测试vault，勿覆盖现有笔记。从interactive-demo及complex-components分别下载Markdown；将ZIP中的notes.md和resources一起放入测试目录。检查阅读视图与实时预览中的中文、标题、列表、代码、表格、竖线转义和图片相对路径；SVG/MathML应明确提示查看HTML，不能伪称交互。记录Obsidian版本、主题、截图。若表格/资源不正确，记录具体文件/行与结果，不用Chromium Markdown文本测试冒充渲染验收。

## v0.5 新组件补充

分别打开 adapters-a.html（1200×900浅色）和 adapters-b.html（375×900暗色）。切换两个独立Tabs并使用左右键/Home/End；数值计算输入0.1+0.2应为0.3，-100+100为0，非法101不得更新结果；空格切换状态开关；展开details修改第二个计算器并确认第一个结果不变。按上面JSON关闭来源→导入→HTML/ZIP流程重复。取消受控契约重新捕获时不能恢复这些行为。adapters-composite.html还应验证Tabs内图表及状态面板内表格独立操作。记录真实Windows版本及证据，未执行前保持Unverified。

## v0.5.1 无服务器真实使用优先验收

1. Windows Chrome与Edge分别加载本轮安装包。打开任意来源（含用户自己的ChatGPT页面），手动复制文字或富文本；Popup → 手动粘贴 / 导入文件 → Ctrl+V → 预览。确认没有自动访问来源网站。
2. 纯文本含开头空行、连续空行、HTML代码、中文与缩进，下载HTML/Markdown，关闭导入页后打开；核对文字不执行HTML。富文本测试标题/表格/代码/details；原生折叠可操作，未知按钮不能执行。
3. 用系统截图复制真实界面（先遮盖私密数据），粘贴；检查visual-only、原/保存尺寸、缩放/压缩说明。下载HTML与ZIP，关闭原来源和扩展页，断网本地打开HTML及解压index.html。
4. 将ZIP的notes.md和resources目录一起放入独立Obsidian测试vault，阅读视图/实时预览核对图片。独立截图Markdown应禁用，不生成坏链接。不要只检查Markdown源文件。
5. 空剪贴板、不支持GIF、多文件、超大截图、转换中取消及再次粘贴应有明确状态且能继续使用。确认网络无HTTP请求、控制台无输入脚本执行。
6. 保留真实来源截图、导出文件、Windows/浏览器/Obsidian版本和结果。不向公共仓库提交账号或聊天隐私；实际ChatGPT样本未提供前不能记为通过。
