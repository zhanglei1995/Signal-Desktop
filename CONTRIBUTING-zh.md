<!-- 版权所有 2015 Signal Messenger, LLC -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# 贡献者指南

## 给新贡献者的建议

首先，有些贡献方式完全不需要涉及代码。建议
_从小处着手_。以下是一些值得考虑的事项：

1. 向亲朋好友介绍 Signal——邀请他们与你一起使用！
1. 加入 Beta 测试，在公众获得访问权限之前率先体验新发布的功能
1. 查找并评论重复的 GitHub 问题，以便我们将其关闭
1. 针对现有 GitHub 问题确定并提供临时解决方案
1. 测试 Signal Desktop，并为现有 GitHub 问题找出可靠且明确的复现步骤
1. 针对特定的 GitHub 问题，测试 Signal iOS 和/或 Signal Android 版本，查看其行为是否与 Signal Desktop 一致，并提供分析详情。

如果您准备花些时间处理某个 GitHub 问题，请考虑留言询问我们
是否有相关需求。这将有助于确保我们最大限度地减少时间浪费。

### 深入代码

您是否已经花了一些时间研究 Signal Desktop 和 GitHub 问题？您可以更深入地
探索代码本身。

同样，从小处着手会更有帮助。您无需创建 PR 也能做出贡献！

1. 找出 GitHub 问题的根本原因，并在问题中提供您的解释，附上指向代码中具体位置的链接
1. 对于特别棘手的调查，请说明您的排查过程。谈谈您所做的更改以及发生的情况——这可能对其他致力于修复该问题的人有所帮助。
1. 测试或审查他人提交的拉取请求中的代码
1. 报告任何问题时，请务必附上代码中发生该问题的具体位置。

### 考虑提交拉取请求？

如果你对代码越来越熟悉，可以考虑准备一份拉取请求。我们
对 Signal Desktop 代码有非常高的标准，因此请特别注意
修改代码、添加测试以及撰写拉取请求摘要。

由于这可能耗费大量时间，建议您先评估大家对您计划
更改内容的兴趣。查找现有的 GitHub 问题或自行创建一个，然后
发布您的计划。这样您就能获得最可能
欣赏您更改的用户反馈。而且我们可能会建议您不要继续进行更改，因为我们
对该问题本身或代码的该部分已有其他计划。

随后，当你花时间规划好解决方案后，请考虑回到
该问题页面，讨论你的实现思路。我们很乐意提供反馈。

最有可能被合并的 PR 是那些解决对用户有实际影响的问题、
进行小而易于审查的修改，并且具有清晰具体意图的 PR。请参阅下文
[关于拉取请求的更多指南](#pull-requests)。

## 开发者环境配置

首先，你需要安装与我们当前版本匹配的 [Node.js](https://nodejs.org/)。
你可以查看 [`main` 分支中的 `.nvmrc`](https://github.com/signalapp/Signal-Desktop/blob/main/.nvmrc)
以确认当前版本。如果您安装了 [nvm](https://github.com/creationix/nvm)，
只需在项目目录下运行 `nvm use`，它就会切换到项目所需的
Node.js 版本。[Windows 版的 nvm](https://github.com/coreybutler/nvm-windows) 依然
很有用，但它不支持 `.nvmrc` 文件。

然后你需要 [`git`](https://git-scm.com/)，如果你还没安装的话。

### macOS

安装 [Xcode 命令行工具](http://osxdaily.com/2014/02/12/install-command-line-tools-mac-os-x/)。

### Windows

1.  从 [微软官网](https://visualstudio.microsoft.com/vs/community/) 下载 _Visual Studio 2022 Community Edition 构建工具_ 并进行安装，同时勾选“使用 C++ 进行桌面开发”选项。
2.  从 https://www.python.org/downloads/windows/ 下载并安装最新的 Python 3 版本（需 3.6 或更高版本）。

### Linux

1.  选择您喜欢的包管理器。
1.  安装 `python`（Python 3.6+）
1.  安装 `gcc`
1.  安装 `g++`
1.  安装 `make`

### 所有平台

现在，在您偏好的终端中，于一个适合开发的目录下运行以下命令：

```
git clone https://github.com/signalapp/Signal-Desktop.git
cd Signal-Desktop
npm install -g pnpm
pnpm install       # 安装并构建依赖项（此过程需要一段时间）
pnpm run generate  # 生成最终的 JS 和 CSS 资源
pnpm test          # 建议先运行测试以确保一切正常
pnpm start         # 启动 Signal！
```


由于没有自动重启机制，您需要定期重启应用程序才能看到更改。
或者，保持开发者工具处于打开状态
（`视图 > 切换开发者工具`），将鼠标悬停在工具上，然后按下
<kbd>Cmd</kbd> + <kbd>R</kbd>（macOS）或 <kbd>Ctrl</kbd> + <kbd>R</kbd>
(Windows & Linux)。

此外，请注意应用程序加载的资源文件未必与您正在修改的文件一致。
您可能需要像设置时那样在命令行中运行 `pnpm run generate`，
才能看到修改后的效果。您可以在修改文件时生成
最新的构建资源，从而简化操作。在进行修改时，请在各自的终端
实例中运行以下命令——它们将持续运行直至您停止：

```
pnpm run dev:transpile # 修改 .ts 文件时重新编译
pnpm run dev:styles    # 修改 .scss 文件时重新编译
```

#### 已知问题

##### `yarn install` 报错“无法检测到版本 30.0.6 的 ABI 及 runtime electron”

`yarn install` 可能会显示如下错误，但由于整体操作成功，可以忽略该错误。

```
$ ./node_modules/.bin/electron-builder install-app-deps

  • electron-builder  version=24.6.3
  • 加载的配置文件=package.json（“build”字段）
  • 重新构建原生依赖项：dependencies=@nodert-win10-rs4/windows.data.xml.dom@0.4.4, @nodert-win10-rs4/windows.ui. notifications@0.4.4, @signalapp/better-sqlite3@8.7.1, @signalapp/windows-dummy-keystroke@1.0.0, bufferutil@4.0.7, fs-xattr@0.3.0, mac-screen-capture-permissions@2.0.0, utf-8-validate@5.0.10
                                    platform=linux
                                    arch=x64
  • 安装预编译二进制文件  name=mac-screen-capture-permissions version=2.0.0 platform=linux arch=x64 napi=
  • 从源代码构建原生依赖项  name=mac-screen-capture-permissions
                                          version=2.0.0
                                          platform=linux
                                          arch=x64
                                          napi=
                                          reason=预编译安装失败，出现错误（请使用环境变量 DEBUG=electron-builder 运行以获取更多信息）
                                          error=/home/ben/sauce/Signal-Desktop/node_modules/node-abi/index.js:30
      throw new Error(‘无法检测到版本 ’ + target + ‘ 和运行时 ’ + runtime + ' 的 ABI。 如果这是 ‘ + runtime + ’ 的新版本，更新 “node-abi” 可能会解决此问题)
      ^

    错误：无法检测到版本 30.0.6 和运行时 electron 的 ABI。如果这是 electron 的新版本，更新 “node-abi” 可能会解决此问题
        在 getAbi 函数中 (/home/ben/sauce/Signal-Desktop/node_modules/node-abi/index.js:30:9)
        在 module.exports 函数中 (/home/ben/sauce/Signal-Desktop/node_modules/prebuild-install/rc.js:53:57)
        在 Object.<anonymous> (/home/ben/sauce/Signal-Desktop/node_modules/prebuild-install/bin.js:8:25)
        在 Module._compile (node:internal/modules/cjs/loader:1376:14)
        在 Module._extensions..js (node:internal/modules/cjs/loader:1435:10)
        在 Module.load (node:internal/modules/cjs/loader:1207:32)
        在 Module._load (node:internal/modules/cjs/loader:1023:12)
        位于 Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:12)
        位于 node:internal/main/run_main_module:28:49

    Node.js v20.11.1
```

### webpack

应用程序的部分功能（例如贴纸生成器）已迁移至 webpack。
您可以通过以下命令为这些功能运行开发服务器：

```
pnpm run dev
```

为了让应用程序能够向开发服务器发送请求，您必须将
`SIGNAL_ENABLE_HTTP` 环境变量设置为真值。在 Linux 和
macOS 上，只需执行以下操作：

```
SIGNAL_ENABLE_HTTP=1 pnpm start
```

## 设置独立模式

默认情况下，应用程序将连接到 **测试** 服务器，这意味着您
**无法** 将其与您的主要移动设备绑定。

别担心！您无需将应用与手机绑定。在二维码界面，你可以
从“文件”菜单中选择“设置为独立设备”，这将引导你完成
与在手机上相同的注册流程。

注意：你将不会与主手机绑定，这会使某些功能的测试变得非常
困难（联系人、个人资料和群组均仅在你的手机上管理）。

## 预发布环境


遗憾的是，这种默认设置会导致应用中既没有联系人也没有消息记录，
应用完全处于空状态。但您可以利用生产环境中的 Signal Desktop 安装信息
来填充测试应用！

首先，退出生产环境和开发环境中的应用（在 macOS 中，请直接退出应用）。
其次，在 [appData](https://www.electronjs.org/docs/latest/api/app#appgetpathname) 目录中找到你的应用数据：

- macOS：`~/Library/Application Support/Signal`
- Linux：`~/.config/Signal`
- Windows 10：`C:\Users\<YourName>\AppData\Roaming\Signal`

现在将此生产数据目录复制到同一目录下（作为 Signal
目录的同级文件夹），并将其命名为 `Signal-development`。随后如常启动应用的开发版本，
您将看到所有的联系人及消息！

您会注意到系统提示重新绑定，因为您的生产环境凭据在
测试环境中无法使用。点击“重新关联”，然后选择“独立模式”，接着验证手机号码并点击
“发送短信”。

输入手机收到的验证码后，您便会以常规手机号码注册为
独立测试设备，并拥有生产环境
消息记录和联系人列表的副本。

但有一个限制：您无法向这些联系人发送消息，因为他们尚未进行
相同的操作。那么，测试时可以给谁发消息呢？

## 额外的存储配置文件

要进行有效的测试，您需要额外的电话号码来注册更多的
独立设备。您可以通过
[Twilio（每个号码每月 1 美元 + 每条短信 0.0075 美元）](https://www.twilio.com/)，或通过
[Google Voice（每个 Google 账户一个号码，免费短信）](https://voice.google.com/)。

获得额外号码后，您可以设置额外的存储配置文件，并通过
`NODE_APP_INSTANCE` 环境变量在它们之间切换。

例如，要创建一个名为“alice”的配置文件，请在项目代码库的
`/config` 子目录中放置一个名为 `local-alice.json` 的文件，该目录中还存放着其他 `.json` 配置文件：

```
{
  “storageProfile”: “aliceProfile”
}
```

然后，您可以通过稍作调整来启动应用程序以加载该配置文件：

```
NODE_APP_INSTANCE=alice pnpm start
```

这会将 `userData` 目录从 `%appData%/Signal` 更改为 `%appData%/Signal-aliceProfile`。

# 进行修改

现在您正在准备提交拉取请求。以下是确保该过程
顺利进行的方法。

## 测试

请编写测试！我们使用的测试框架是
[mocha](http://mochajs.org/)，断言库是
[chai](http://chaijs.com/api/assert/)。

一次性运行所有测试的最简单方法是 `pnpm test`，这将在
命令行上运行测试。您可以在交互式会话中运行客户端测试，使用
`NODE_ENV=test pnpm start` 在交互式会话中运行客户端测试。

## 拉取请求

你想提交拉取请求吗？

首先，请注意我们极不可能接受视觉上的改动、新增字符串，或者任何
会改变用户体验的内容。如果你计划进行此类修改，请先与我们沟通！
虽然我们可能会批准，但极有可能不会。

最理想的修改是修复现有用户体验实现中的 bug。例如，
任何添加新选项的提交几乎肯定会被我们拒绝。

更多指南：


- 请务必签署 [CLA](https://signal.org/cla/)。
- 请务必确保您的 `pnpm run ready` 命令能成功运行——这与我们的
  持续集成服务器测试应用程序的方式非常相似。
- 请勿提交用于修复翻译问题的拉取请求。
- 切勿在源代码中直接使用纯文本字符串——请从 `messages.json` 中提取！
  您**仅需**修改默认语言环境
  [`_locales/en/messages.json`](_locales/en/messages.json)。其他语言环境会
  基于该文件自动生成，并定期进行翻译。
- 将您的
  更改 [Rebase](https://nathanleclaire.com/blog/2014/09/14/dont-be-scared-of-git-rebase/) 到最新的 `main` 分支，并解决任何冲突。
  这可确保您在提交 PR 时，更改能干净地合并。
- 务必添加并运行测试！
- 请确保主分支与您分支之间的差异仅包含
  实现该功能或修复该 bug 所需的最小改动集。这将
  使代码审查者更容易批准您的更改。
  请勿提交包含被注释掉的代码或未完成功能的 PR。
- 避免无意义或过于细碎的提交。如果您的分支中包含诸如
  “哎呀，撤销此更改”或“只是在尝试，稍后会
  删除”之类的提交，请 [将这些更改合并或重置](https://robots.thoughtbot.com/git-interactive-rebase-squash-amend-rewriting-history)。
- 提交次数不宜过少。如果您有一个复杂或长期维护的功能
  分支，将更改拆分为逻辑上独立的单元
  有助于审查过程。
- 请提供措辞得当且格式规范的提交信息。有关格式设置的提示，请参阅[此
  链接](http://chris.beams.io/posts/git-commit/)
  。就内容而言，请尝试在摘要中包含以下
  信息：
  1.  您修改了什么
  2.  为何进行此修改。如果存在相关的 [GitHub Issue](https://github.com/signalapp/Signal-Desktop/issues)，请包含该 Issue 的编号。
  3.  任何相关的技术细节或您在实现
      选择背后的动机，这些信息可能有助于未来
      审查或审计提交历史记录的人员。如有疑问，宁可
      写得更详细一些。

最重要的是，花些时间熟悉该代码库。遵循自动添加到
您的拉取请求描述中的模板。查看最近批准的拉取请求，
了解它们是如何处理的。

## 连接到预发布移动设备

多台独立的桌面设备非常适合测试大量场景。但 Signal 的许多
功能体验都需要一台主移动设备：联系人管理、
在所有关联设备间同步已读和已验证状态等。

这带来了一个问题——即使您拥有另一部手机，iOS 和 Android 应用的正式版也
被锁定在正式服务器上。要在 staging 环境中测试所有场景，
最佳方案是下载 iOS 或 Android 应用的开发版，
并使用您的备用手机号码之一进行注册：

首先，从源代码构建 Android 或 iOS 版的 Signal，并将服务 URL 指向 `chat.staging.signal.org`：

**Android 平台：** 在 [build.gradle](https://github.com/signalapp/Signal-Android/blob/master/build.gradle) 中替换 `SIGNAL_URL` 的值

**iOS 平台：** 在 `TSConstants.h`（位于 SignalServiceKit pod 中）中替换 `textSecureServerURL` 的值

这项工作 1% 是查找替换，99% 是配置构建环境。相关说明适用于
[Android](https://github.com/signalapp/Signal-Android/blob/master/BUILDING.md)
和 [iOS](https://github.com/signalapp/Signal-iOS/blob/master/BUILDING.md) 项目。

随后，您可以照常设置 Signal Desktop 的开发构建。如果您已
设置为独立安装模式，可通过打开开发者工具（视图 -> 切换
开发者工具），在控制台输入以下内容并按回车键进行切换：`window.reduxActions.app.openInstaller();`

## 切换至生产环境

如果您完全确定您的更改不会对生产服务器产生影响，
您可以通过在 `config` 目录中放置一个名为
`local-development.json` 的文件，将您的开发版本连接到生产服务器。该文件应是
`production.json` 的副本，但您应将 `updatesEnabled` 设置为 `false`，以确保在开发过程中
自动更新机制不会被触发。

**注意：**当连接到
生产服务器时，若使用您的主要手机号码配置独立模式，将导致您的移动设备被_注销_！来自您联系人
的所有消息都将发送到您的新开发桌面应用，而非您的手机。

## 测试生产构建


```
pnpm run generate
pnpm run build
```

然后，使用 `pnpm run test-release` 运行测试。

### 测试 macOS 构建

macOS 要求应用程序使用 Apple 证书进行代码签名。要测试开发构建，
您可以对打包后的应用程序进行临时签名，这样就可以在本地运行它。

1. 构建应用程序时跳过自定义的 macOS 签名脚本：

```
pnpm run generate
SKIP_SIGNING_SCRIPT=1 pnpm run build
cd release
# 选择所需的应用程序包：mac、mac-arm64 或 mac-universal
cd mac-arm64
codesign --force --deep --sign - Signal.app
```

2. 现在您可以在本地运行该应用程序。