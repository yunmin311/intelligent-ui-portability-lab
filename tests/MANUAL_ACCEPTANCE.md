# Windows / Obsidian 人工验收 · v0.4.1

状态：**Unverified**。2026-10-19 只读检查发现 Windows Chrome 155.0.8059.84、Edge 155.0.4283.62、运行中的 Obsidian 1.14.4；发现安装/进程不代表功能通过。桌面控制工具在当前 WSL 工作路径初始化失败：`sandboxCwd is not a local file URI: file:///mnt/e/30_%E9%A1%B9%E7%9B%AE/intelligent-ui-portability-lab`。没有修改用户浏览器配置或现有 vault。Linux Chromium 自动化结果不能代替以下平台验收。

## Chrome 与 Edge 分别执行

1. 解压 `Intelligent-UI-Portability-Lab-v0.4.1-extension.zip`，先用 PowerShell `Get-FileHash -Algorithm SHA256 <ZIP>` 与 SHA256SUMS 对照。到各自 `chrome://extensions` / `edge://extensions`，打开开发者模式，加载包内 `extension`。确认显示0.4.1及 activeTab/scripting/storage；没有持久站点授权。
2. 在仓库 WSL 运行 `python3 -m http.server 8765 --directory fixtures`。Windows 浏览器打开 `http://localhost:8765/selective-interactions.html`。改变谐波8、振幅1.3、相位-0.75；表格筛选30并降序；展开折叠。保存来源截图并记录浏览器版本、主题、1200×900视口。
3. 从工具栏真实 Popup 选JSON，选择mixed区域，箭头扩大/缩小，Esc取消一次，再重进Enter捕获。下载JSON，**关闭来源和原预览标签页**。
4. Popup→导入本地文件→选刚下载JSON。预览应显示local/external-unverified及model-validated，不能显示来源等价已证明。HTML/Auto能下载；Interactive必须明确确认未知按钮静态降级；Static禁用所有交互。切格式后确认框重置。
5. 下载HTML后用本地文件打开。反复开合details，检查动态高度；Fourier改N/振幅/相位；表格筛选、升降序、清空；未知按钮不能执行。初始画面应保留来源状态。打开DevTools Network清空记录、重载并操作，确认没有HTTP(S)请求。
6. 切ZIP，重新确认降级，下载解压打开index.html，重复同样操作。用SHA256SUMS校验成员；关网仍能使用。Static HTML不得有script或可操作控件。纯静态页面的Interactive必须提示“没有可恢复交互”并禁用下载。
7. 浅/暗主题各执行一次，保留来源/导出截图、下载文件、控制台错误、网络记录和通过/失败表。Popup→chatgpt.com应明确禁用；不要尝试登录数据或私有端点。

## Obsidian

使用独立测试vault，勿覆盖现有笔记。从interactive-demo及complex-components分别下载Markdown；将ZIP中的notes.md和resources一起放入测试目录。检查阅读视图与实时预览中的中文、标题、列表、代码、表格、竖线转义和图片相对路径；SVG/MathML应明确提示查看HTML，不能伪称交互。记录Obsidian版本、主题、截图。若表格/资源不正确，记录具体文件/行与结果，不用Chromium Markdown文本测试冒充渲染验收。
