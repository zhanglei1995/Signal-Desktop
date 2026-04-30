# Signal Desktop 项目概览

这是 Signal Desktop，官方 Signal 桌面端客户端。它是一个很大的 Electron + TypeScript 项目，当前版本在 `package.json` 里是 `8.10.0-alpha.1`，许可证是 `AGPL-3.0-only`。

简单说：它把 Signal 手机上的账号能力连接到 Windows、macOS、Linux 桌面端，负责聊天、群组、附件、语音视频通话、通知、备份、更新、加密存储等完整客户端体验。

## 项目骨架

最核心的几个入口是：

- `app/main.main.ts`：Electron 主进程，创建窗口、菜单、托盘、更新器、权限弹窗、调试窗口、IPC、SQL 初始化等。
- `background.html`：主窗口 HTML 壳，加载 CSS、字体、图片，最后调用 `window.startApp()`。
- `preload.wrapper.ts`：预加载脚本包装器，会加载打包后的 preload bundle，并支持缓存提升启动速度。
- `ts/background.preload.ts`：渲染侧真正的启动大入口，初始化服务、数据库、消息接收、Redux，然后渲染 React 应用。
- `ts/components/App.preload.tsx`：顶层 React 应用，根据状态显示安装页、注册页、收件箱或加载页。

## 技术栈

它不是普通网页应用，而是桌面端“多运行时”结构：

- Electron `41.1.1`
- React `19`
- Redux
- TypeScript 严格模式
- pnpm workspace
- Rolldown 打包
- Sass + Tailwind
- SQLCipher，本地加密数据库
- `@signalapp/libsignal-client` 做 Signal 协议相关能力
- `@signalapp/ringrtc` 做通话能力
- Mocha/Chai、Electron 测试、Storybook、oxlint、stylelint

## 文件命名规则

这个仓库靠文件后缀区分运行环境，很关键：

- `.main.ts`：Electron 主进程
- `.preload.ts` / `.preload.tsx`：Electron preload 层，能接触 Node/Electron 能力，也桥接给页面
- `.dom.ts` / `.dom.tsx`：纯浏览器/React DOM 环境
- `.node.ts`：Node 环境
- `.std.ts`：通用逻辑，可在多个环境复用

所以看文件名基本就能判断它在哪里运行，这对读代码特别省力。

## 主要目录

- `app`：Electron 主进程与系统集成。
- `ts/components`：大量 React UI 组件。
- `ts/state`：Redux ducks、selectors、smart containers。
- `ts/textsecure`：Signal 网络/API/消息收发层，比如 `MessageReceiver`、`SendMessage`、`WebAPI`。
- `ts/sql`：数据库接口、worker、SQL server、迁移。
- `ts/services`：通话、通知、备份、存储、profile、网络监听等后台服务。
- `ts/models`、`ts/messages`、`ts/conversations`：消息和会话领域逻辑。
- `_locales`：国际化文案。
- `protos`：protobuf 定义，会生成到 `ts/protobuf`。
- `sticker-creator`：贴纸创建器子项目。

## 启动流程

大概是这样：

1. Electron 从 `package.json` 的 `main: bundles/main.js` 启动。
2. `bundles/main.js` 来自 `app/main.main.ts`。
3. 主进程读取配置、设置 user data、初始化日志、SQL、协议处理、系统托盘、更新器。
4. 主窗口加载 `background.html`。
5. preload 分阶段初始化 IPC、全局 `window.SignalContext`、日志、Signal 服务、模型。
6. `ts/background.preload.ts` 初始化 Redux。
7. `ts/background.preload.ts` 创建 React root，渲染应用。

## 开发命令

按 `CONTRIBUTING.md` 的说明，常用的是：

```bash
pnpm install
pnpm run generate
pnpm start
```

开发时通常开 watcher：

```bash
pnpm run dev:transpile
pnpm run dev:styles
```

测试/检查：

```bash
pnpm test
pnpm run lint
pnpm run ready
```

## 阅读建议

想读懂它，最好从这条线进去：

```text
app/main.main.ts
  -> preload phases
  -> ts/background.preload.ts
  -> ts/state
  -> ts/components
```

如果关心消息协议，就看 `ts/textsecure` 和 `ts/messages`。

如果关心本地数据，就看 `ts/sql` 和 migrations。

一句话总结：这是一个成熟、超大规模、安全敏感的桌面客户端项目。
