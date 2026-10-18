# 依赖与许可核对 · 2026-10-16

生产 extension/ 为原生 JS/CSS/HTML，没有 npm 运行依赖或第三方捕获代码，无 CDN/远程可执行代码。项目 package license 保持 UNLICENSED，不擅自替用户授予公共开源许可。测试环境使用 Node24.21.0、Python3.12、Playwright Chromium156.0.8078.4。

| 锁文件包 | 版本 | 许可证 | 用途 |
|---|---|---|---|
| @playwright/test | 1.64.1 | Apache-2.0 | 开发/测试，不进入扩展 |
| @zumer/snapdom | 3.3.4 | MIT | 开发/测试，不进入扩展 |
| playwright | 1.64.1 | Apache-2.0 | 开发/测试，不进入扩展 |
| playwright-core | 1.64.1 | Apache-2.0 | 开发/测试，不进入扩展 |
| pngjs | 7.0.0 | MIT | 开发/测试，不进入扩展 |

直接开发依赖均精确版本，传递依赖由 package-lock.json integrity 固定；许可证读取本地包与锁文件，全文副本位于 licenses/。`npm audit` 当前结果0漏洞，记录见 tests/evidence/npm-audit.json；这不等于零漏洞承诺。浏览器本体按 Playwright 官方分发许可提供，未随发布包重分发。

竞品：browser-ai-chat-exporter 当前 BSL1.1（个人/非商业/内部业务用途有 grant，商业再分发另需许可，2031-04-04转换Apache），chatgpt-export MIT，Obsidian源码MIT且README排除品牌资产，SingleFile AGPL3，SnapDOM核心MIT。源码只作研究，未复制到生产扩展；不打包 .research 或竞品图片。图片通过原仓库链接引用且标明不是本项目截图。
