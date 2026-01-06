# Tailwind配置

<cite>
**本文档引用的文件**   
- [tailwind-config.css](file://stylesheets/tailwind-config.css)
- [animate-enter-exit.css](file://stylesheets/tailwind-plugins/animate-enter-exit.css)
- [animate-general.css](file://stylesheets/tailwind-plugins/animate-general.css)
- [scrollbar.css](file://stylesheets/tailwind-plugins/scrollbar.css)
- [_variables.scss](file://stylesheets/_variables.scss)
- [package.json](file://package.json)
- [.prettierrc.js](file://.prettierrc.js)
- [tw.dom.tsx](file://ts/axo/tw.dom.tsx)
</cite>

## 目录
1. [简介](#简介)
2. [Tailwind配置结构](#tailwind配置结构)
3. [自定义主题变量](#自定义主题变量)
4. [颜色调色板](#颜色调色板)
5. [字体与排版](#字体与排版)
6. [动画与过渡](#动画与过渡)
7. [Tailwind插件扩展](#tailwind插件扩展)
8. [滚动条配置](#滚动条配置)
9. [响应式与容器设置](#响应式与容器设置)
10. [Tailwind使用最佳实践](#tailwind使用最佳实践)

## 简介
Signal-Desktop项目使用Tailwind CSS作为其主要的CSS框架，通过自定义配置文件`tailwind-config.css`来实现一致的设计系统。该配置文件位于`stylesheets/`目录下，采用CSS原生语法定义了项目所需的所有样式变量、主题、动画和插件。本文档将深入解析Signal-Desktop的Tailwind配置，包括自定义主题变量、颜色调色板、间距系统以及通过插件扩展Tailwind功能的实现细节。

## Tailwind配置结构
Signal-Desktop的Tailwind配置文件`tailwind-config.css`采用了模块化的设计，通过`@import`语句引入了多个插件文件和基础样式。配置文件的结构清晰，分为多个逻辑部分，包括自定义变体、颜色、字体、排版、阴影、模糊、缓动函数、过渡、动画等。

配置文件通过`@source`指令指定了Tailwind需要扫描的源文件路径，确保所有使用Tailwind类名的文件都能被正确处理。这些源文件包括TypeScript文件、HTML文件以及Storybook相关文件。

**Section sources**
- [tailwind-config.css](file://stylesheets/tailwind-config.css#L8-L11)

## 自定义主题变量
Signal-Desktop的Tailwind配置中定义了大量的自定义主题变量，这些变量通过`@theme`规则集进行定义，涵盖了颜色、字体、排版、阴影、模糊、缓动函数等多个方面。

### 颜色变量
颜色变量是Tailwind配置的核心部分，Signal-Desktop通过CSS自定义属性（CSS Variables）定义了一套完整的颜色系统。这些变量以`--color-*`为前缀，分为多个类别，包括标签颜色、背景颜色、填充颜色、边框颜色、阴影颜色等。

例如，`--color-label-primary`定义了主要标签的颜色，其值使用`light-dark()`函数根据用户的主题偏好（浅色或深色）自动切换。这种设计确保了应用在不同主题下的视觉一致性。

**Section sources**
- [tailwind-config.css](file://stylesheets/tailwind-config.css#L29-L208)

### 高对比度模式
为了支持高对比度模式，Signal-Desktop在`@layer theme`中定义了`@media (prefers-contrast: more)`媒体查询。当用户启用高对比度模式时，系统会自动应用这些更鲜明的颜色变量，提高可访问性。

**Section sources**
- [tailwind-config.css](file://stylesheets/tailwind-config.css#L119-L209)

## 颜色调色板
Signal-Desktop的颜色调色板在`_variables.scss`文件中定义，使用Sass变量存储了项目中使用的所有颜色值。这些变量包括基础颜色（如白色、黑色、灰色）、强调色（如蓝色、绿色、红色、黄色）以及用于特定功能的颜色（如安全号码变更警告、进度条等）。

这些Sass变量主要用于非Tailwind样式的SCSS文件中，而Tailwind配置文件则使用CSS自定义属性来定义颜色，两者共同构成了项目完整的颜色系统。

**Section sources**
- [_variables.scss](file://stylesheets/_variables.scss#L24-L273)

## 字体与排版
### 字体家族
Signal-Desktop定义了两种主要的字体家族：无衬线字体和等宽字体。无衬线字体`--font-sans`以Inter字体为主，同时包含了多种语言的备用字体，如Source Han Sans（中文）、SF Pro JP（日文）、Vazirmatn（波斯文）等，确保了多语言环境下的字体显示效果。

等宽字体`--font-mono`则用于代码显示等场景，优先使用SF Mono，同时提供了多种备用字体。

**Section sources**
- [tailwind-config.css](file://stylesheets/tailwind-config.css#L216-L252)

### 排版系统
排版系统通过`@theme`规则集定义了文本大小、字体粗细、字母间距和行高等属性。这些属性以`--type-*`为前缀，如`--type-text-title-large`定义了大标题的字体大小，`--type-font-weight-title-large`定义了大标题的字体粗细。

此外，通过`@utility type-*`规则集，将这些排版属性组合成一个名为`type-*`的实用程序类，方便在项目中统一应用。

**Section sources**
- [tailwind-config.css](file://stylesheets/tailwind-config.css#L260-L309)

## 动画与过渡
### 过渡配置
Signal-Desktop定义了统一的过渡持续时间和缓动函数，通过`--default-transition-duration`和`--default-transition-timing-function`变量进行配置。默认的过渡持续时间为120毫秒，缓动函数为`cubic-bezier(0.33, 1, 0.68, 1)`，即`ease-out-cubic`。

**Section sources**
- [tailwind-config.css](file://stylesheets/tailwind-config.css#L382-L385)

### 动画配置
动画配置与过渡配置类似，定义了默认的动画持续时间和缓动函数。此外，还定义了两个关键帧动画：`animate-spinner-v2-rotate`和`animate-spinner-v2-dash`，用于旋转和虚线动画效果。

**Section sources**
- [tailwind-config.css](file://stylesheets/tailwind-config.css#L391-L424)

## Tailwind插件扩展
Signal-Desktop通过自定义插件扩展了Tailwind的功能，这些插件位于`stylesheets/tailwind-plugins/`目录下，包括`animate-enter-exit.css`、`animate-general.css`和`scrollbar.css`。

### animate-enter-exit插件
`animate-enter-exit`插件实现了进入和退出动画的实用程序类。它通过CSS自定义属性`--tw-animate-opacity`、`--tw-animate-rotate`、`--tw-animate-scale`、`--tw-animate-translate-x`和`--tw-animate-translate-y`来控制动画的各个属性。

该插件提供了`animate-enter`和`animate-exit`两个实用程序类，分别对应进入和退出动画。通过`@keyframes tw-animate-enter`和`@keyframes tw-animate-exit`定义了关键帧动画，实现了平滑的过渡效果。

**Section sources**
- [animate-enter-exit.css](file://stylesheets/tailwind-plugins/animate-enter-exit.css#L10-L143)

### animate-general插件
`animate-general`插件提供了更通用的动画控制实用程序类，包括动画持续时间、延迟、缓动函数、填充模式、播放状态和方向等。

例如，`animate-duration-*`类允许设置动画的持续时间，`animate-delay-*`类允许设置动画的延迟时间，`animate-ease-*`类允许设置动画的缓动函数。

**Section sources**
- [animate-general.css](file://stylesheets/tailwind-plugins/animate-general.css#L1-L86)

## 滚动条配置
`scrollbar.css`插件用于自定义滚动条的样式。它定义了三个CSS自定义属性：`--default-scrollbar-width`、`--default-scrollbar-track`和`--default-scrollbar-thumb`，分别用于设置滚动条的宽度、轨道颜色和拇指颜色。

该插件提供了`scrollbar-track-*`、`scrollbar-thumb-*`、`scrollbar-width-*`和`scrollbar-gutter-*`等实用程序类，允许在项目中灵活地控制滚动条的外观。

**Section sources**
- [scrollbar.css](file://stylesheets/tailwind-plugins/scrollbar.css#L1-L82)

## 响应式与容器设置
Signal-Desktop的Tailwind配置中没有显式定义响应式断点和容器设置。这表明项目可能依赖于Tailwind的默认断点（如sm、md、lg、xl、2xl）和容器配置。

在`package.json`文件中，可以看到项目使用了`@tailwindcss/cli`和`@tailwindcss/postcss`作为依赖，这表明Tailwind的构建过程是通过命令行工具完成的。

**Section sources**
- [package.json](file://package.json#L260-L261)

## Tailwind使用最佳实践
### 类名合并函数
Signal-Desktop定义了一个名为`tw`的函数，用于合并Tailwind类名。这个函数位于`ts/axo/tw.dom.tsx`文件中，接受一个字符串数组作为参数，并返回一个合并后的字符串。

使用这个函数可以避免在JSX中直接拼接字符串，提高了代码的可读性和可维护性。

```typescript
export function tw(
  ...classNames: ReadonlyArray<
    TailwindStyles | string | boolean | null | undefined
  >
): TailwindStyles {
  const { length } = classNames;

  let result = '';
  let first = true;

  for (let index = 0; index < length; index += 1) {
    const className = classNames[index];
    if (typeof className === 'string') {
      if (first) {
        first = false;
      } else {
        result += ' ';
      }
      result += className;
    }
  }

  return result as TailwindStyles;
}
```

**Section sources**
- [tw.dom.tsx](file://ts/axo/tw.dom.tsx#L6-L29)

### ESLint规则
项目中配置了`eslint-plugin-better-tailwindcss`插件，用于强制执行Tailwind的最佳实践。这些规则包括：强制一致的类名顺序、强制一致的变量语法、强制简写类名、移除重复的类名、报告未注册的类名、报告冲突的类名等。

此外，项目还定义了一些Tailwind类名的替换规则，如将`ml-*`替换为`ms-*`，将`mr-*`替换为`me-*`，以支持逻辑属性。

**Section sources**
- [.eslintrc.js](file://.eslintrc.js#L279-L420)

### Prettier配置
Prettier配置文件`.prettierrc.js`中指定了Tailwind相关的配置，包括插件`prettier-plugin-tailwindcss`、Tailwind样式表路径`./stylesheets/tailwind-config.css`以及Tailwind函数`tw`。

这些配置确保了在格式化代码时，Tailwind类名能够被正确处理。

**Section sources**
- [.prettierrc.js](file://.prettierrc.js#L6-L13)