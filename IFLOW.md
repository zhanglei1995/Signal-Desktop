# Signal Desktop 项目文档

## 项目概述

Signal Desktop 是 Signal Messenger 的桌面客户端应用，支持 Windows、macOS 和 Linux 平台。它是一个基于 Electron 的应用程序，使用 TypeScript、React 和 Redux 构建，提供端到端加密的私人消息服务。

### 主要技术栈
- **框架**: Electron 39.2.4
- **语言**: TypeScript 5.6.3
- **前端框架**: React 18.3.1
- **状态管理**: Redux 5.0.1
- **UI 组件**: Radix UI, Material Design 原则
- **加密**: Signal Protocol, @signalapp/libsignal-client
- **数据库**: @signalapp/sqlcipher (SQLite加密版本)
- **构建工具**: esbuild, electron-builder
- **包管理**: pnpm 10.18.1
- **Node.js 版本**: 22.21.1

### 项目结构
- `app/` - 主进程代码，包含应用初始化、系统托盘、通知等
- `ts/` - TypeScript 源代码目录
  - `components/` - React 组件
  - `services/` - 核心服务逻辑
  - `state/` - Redux 状态管理
  - `windows/` - 窗口管理逻辑
  - `types/` - TypeScript 类型定义
- `bundles/` - 构建输出文件
- `build/` - 构建配置和资源
- `stylesheets/` - CSS 和样式文件
- `images/` - 图片资源
- `_locales/` - 国际化文件

## 构建和运行

### 环境准备
1. 安装 Node.js 22.21.1 (参考 `.nvmrc`)
2. 安装 pnpm 10.18.1
3. 克隆仓库并安装依赖:
   ```bash
   git clone https://github.com/signalapp/Signal-Desktop.git
   cd Signal-Desktop
   pnpm install
   ```

### 开发命令
- `pnpm start` - 启动开发环境
- `pnpm dev` - 启动 Storybook 开发环境 (端口 6006)
- `pnpm generate` - 生成所有必要资源
- `pnpm build` - 构建生产版本
- `pnpm test` - 运行所有测试
- `pnpm lint` - 代码检查和格式化
- `pnpm format` - 格式化代码

### 构建命令
- `pnpm build:release` - 构建发布版本
- `pnpm build-win32-all` - 构建 Windows 版本 (x64 和 arm64)
- `pnpm build-linux` - 构建 Linux 版本

## 开发约定

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 使用 React 函数组件和 Hooks
- 使用 Redux Toolkit 进行状态管理

### 测试
- 单元测试使用 Mocha 和 Chai
- 组件测试使用 Storybook
- 运行 `pnpm test` 执行所有测试套件

### 提交规范
- 所有更改需要通过 CI 检查
- 需要签署 CLA (Contributor License Agreement)
- 遵循项目现有的提交信息格式

### 国际化
- 所有用户界面文本需要国际化
- 使用 react-intl 进行国际化处理
- 文本字符串存储在 `_locales/` 目录下

## 特殊注意事项

### 安全性
- 所有通信使用端到端加密
- 本地数据库使用 SQLCipher 加密
- 遵循最佳安全实践，不暴露敏感信息

### 平台特定功能
- Windows: 使用 Windows 原生通知
- macOS: 支持黑暗模式和系统托盘
- Linux: 支持 DEB 包安装和系统集成

### 构建优化
- 使用 esbuild 进行快速构建
- 代码分割和懒加载
- 资源优化和压缩

## 许可证
本项目采用 AGPL-3.0 许可证。详见 LICENSE 文件。