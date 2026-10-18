# 依赖与许可核对 · 2026-10-18

生产 extension/ 为原生 JS/CSS/HTML，没有 npm 运行依赖或第三方捕获代码；交互运行时为本项目有限白名单实现，无 CDN/远程可执行代码。项目 package license 保持 UNLICENSED，不擅自替用户授予公共开源许可。测试环境使用 Node24.21.0、Python3.12、Playwright Chromium156.0.8078.4。

| 锁文件包 | 版本 | 许可证 | 用途 |
|---|---|---|---|
| @playwright/test | 1.64.1 | Apache-2.0 | 开发/测试，不进入扩展 |
| @zumer/snapdom | 3.3.4 | MIT | 开发/测试，不进入扩展 |
| playwright | 1.64.1 | Apache-2.0 | 开发/测试，不进入扩展 |
| playwright-core | 1.64.1 | Apache-2.0 | 开发/测试，不进入扩展 |
| esbuild | 0.28.2 | MIT | 本地构建，不进入扩展运行依赖 |
| pngjs | 7.0.0 | MIT | 开发/测试，不进入扩展 |

直接开发依赖均精确版本，传递依赖由 package-lock.json integrity 固定；许可证读取本地包与锁文件，全文副本位于 docs/licenses/。`npm audit` 当前结果0漏洞，记录见 tests/evidence/v0.4/npm-audit.json；这不等于零漏洞承诺。浏览器本体按 Playwright 官方分发许可提供，未随发布包重分发。

竞品：browser-ai-chat-exporter 当前 BSL1.1（个人/非商业/内部业务用途有 grant，商业再分发另需许可，2031-04-04转换Apache），chatgpt-export MIT，Obsidian源码MIT且README排除品牌资产，SingleFile AGPL3，SnapDOM核心MIT。源码只作研究，未复制到生产扩展；不打包 .research 或竞品图片。图片通过原仓库链接引用且标明不是本项目截图。

## 项目授权选择（待所有者决定）

当前`UNLICENSED`保留，不因为仓库可见而自动开放复用。

| 选项 | 适用取向与代价 |
|---|---|
| [MIT](https://opensource.org/license/mit) | 简单宽松，允许商业使用/修改/分发，要求保留许可与版权；不包含Apache式明确专利条款 |
| [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | 宽松复用，含明确贡献者专利授权及终止规则，分发有许可/修改声明及适用NOTICE等义务 |
| 保留所有权（现状） | 先保留是否及如何授权的决定权，外部不能据公开可见推定得到通用复用许可；不利于开放协作 |

如希望开放协作且许可证简洁可选MIT；如重视明确专利授权可选Apache-2.0。此处给出选项，不代替所有者选择或法律意见。第三方依赖原许可独立保留。
