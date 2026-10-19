# v0.5.1 交接审查与集成决策

Decision：主仓库是唯一生产实现。两个ZIP只作为用户提供的探索材料读取，未执行补丁脚本，未复制独立工具整页。开始fetch后HEAD/main/origin/main为8255b075a931410eec7c185a956161da910d973e，工作区干净；本轮分支codex/v0.5.1-paste。

| 材料 | SHA-256 | 完整检查内容 |
|---|---|---|
| 即用完整包（用户实际路径99_临时/99E8BD95E9A2_8DE7A889E58C95E585.zip） | `08d39ae2e1f40795551a90e189d31e1d3651563e4273858713a34760b9f50671` | HTML 21842字节、说明4169字节、实际界面PNG132642字节、折叠导出示例1088字节 |
| v05补丁包（99E8BD95E9A2_v05_89E5959BE690A1E481.zip） | `5f9d92f626deb0a9019736c1d4ab3e245ff42ae01748bb1bcff931a22fa88af6` | apply_to_v05.py 5056字节、集成说明2015字节 |

独立HTML包含图片/富文本/纯文本入口、双栏预览、下载和自有ZIP。它的净化、ZIP、下载逻辑重复主项目，使用内联脚本CSP，并对导出body施加字体、留白、颜色和表格样式；不采用这些生产实现。图片解码在限额验证前，且未进入IR/hash契约；原型12MB/10MP不是本扩展安全预算。截图确是原型界面示例，不是本轮主项目验收证据。说明中的page.set_content测试不能当MV3/Windows实测，提到的test_exporter.py不在包内。

补丁依赖旧源码锚点和旧路径，只增加最小paste入口，沿用约1MP/2MB限制，缺取消/重复/恢复、真正资源笔记和主项目CI证据。没有直接执行；仅复用“用户本次paste事件→类型判定→既有转换”思路，按当前架构重实现。

当前入口复用现有sandbox/IR1.3/hash/Worker/preview/policy/render/archive/session。设计沿用v0.5令牌，以粘贴为主、文件为备选、限制折叠。原型两栏仅作交互参考，不建立第二套工具，不增加生产依赖或权限。

审计覆盖import.html/js、src/import-sandbox、capture/dom/adapters、ir、render、archive、preview、background/popup、现有测试、package/verify与CI。具体隐私读取顺序与documentId授权修复见架构和安全文档；测试结果以当前TEST_REPORT为唯一事实源。

Exploration：交接独立HTML与补丁。Deprecated：把原型或补丁通过视为扩展集成完成。Proposal：获得真实授权样本后的v0.6适配，不在本轮扩展模拟组件。
