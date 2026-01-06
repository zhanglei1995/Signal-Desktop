# Redux架构设计

<cite>
**本文档引用的文件**  
- [reducer.preload.ts](file://ts/state/reducer.preload.ts)
- [createStore.preload.ts](file://ts/state/createStore.preload.ts)
- [getInitialState.preload.ts](file://ts/state/getInitialState.preload.ts)
- [actions.preload.ts](file://ts/state/actions.preload.ts)
- [initializeRedux.preload.ts](file://ts/state/initializeRedux.preload.ts)
- [ducks/conversations.preload.ts](file://ts/state/ducks/conversations.preload.ts)
- [ducks/stories.preload.ts](file://ts/state/ducks/stories.preload.ts)
- [ducks/calling.preload.ts](file://ts/state/ducks/calling.preload.ts)
- [ducks/accounts.preload.ts](file://ts/state/ducks/accounts.preload.ts)
- [ducks/app.preload.ts](file://ts/state/ducks/app.preload.ts)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概述](#架构概述)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介
本文档详细描述了Signal-Desktop应用程序中基于ducks模式的Redux状态管理架构。文档涵盖了根reducer的组合机制、store的创建流程、各业务模块的状态切片设计原则以及中间件配置等关键方面。通过分析核心文件和模块，本文档旨在为开发者提供对Signal-Desktop状态管理系统的全面理解。

## 项目结构
Signal-Desktop的Redux架构主要集中在`ts/state`目录下，采用模块化的ducks模式组织代码。该架构将相关的action、reducer和action creator组织在独立的模块中，实现了高内聚低耦合的设计。

```mermaid
graph TB
subgraph "ts/state"
A[ducks] --> B[accounts.preload.ts]
A --> C[app.preload.ts]
A --> D[conversations.preload.ts]
A --> E[calls.preload.ts]
A --> F[stories.preload.ts]
G[reducer.preload.ts]
H[createStore.preload.ts]
I[getInitialState.preload.ts]
J[actions.preload.ts]
K[initializeRedux.preload.ts]
end
```

**图示来源**  
- [reducer.preload.ts](file://ts/state/reducer.preload.ts#L1-L85)
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L1-L96)

**本节来源**  
- [ts/state](file://ts/state)

## 核心组件
Signal-Desktop的Redux架构由几个核心组件构成：reducer组合器、store创建器、初始状态生成器和action分发器。这些组件协同工作，构建了一个可扩展且易于维护的状态管理系统。

**本节来源**  
- [reducer.preload.ts](file://ts/state/reducer.preload.ts#L1-L85)
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L1-L96)
- [getInitialState.preload.ts](file://ts/state/getInitialState.preload.ts#L1-L248)

## 架构概述
Signal-Desktop采用基于ducks模式的模块化Redux架构，将应用程序状态划分为多个独立的切片。每个切片负责管理特定业务领域的状态，通过根reducer组合成完整的状态树。

```mermaid
graph TD
A[根Store] --> B[accounts]
A --> C[app]
A --> D[conversations]
A --> E[calls]
A --> F[stories]
A --> G[media]
A --> H[ui]
A --> I[settings]
B --> B1[用户账户信息]
C --> C1[应用全局状态]
D --> D1[会话列表]
D --> D2[消息历史]
E --> E1[通话状态]
E --> E2[通话历史]
F --> F1[故事内容]
F --> F2[故事查看者]
G --> G1[媒体播放]
G --> G2[媒体库]
H --> H1[模态框]
H --> H2[导航]
I --> I1[通知设置]
I --> I2[隐私设置]
```

**图示来源**  
- [reducer.preload.ts](file://ts/state/reducer.preload.ts#L44-L82)
- [ducks](file://ts/state/ducks)

## 详细组件分析
### Ducks模式设计
Signal-Desktop采用ducks模式组织Redux模块，每个模块包含action类型、action creator和reducer。这种模式将相关逻辑组织在一起，提高了代码的可维护性和可理解性。

```mermaid
classDiagram
class DuckModule {
+string ACTION_TYPE_1
+string ACTION_TYPE_2
+actionCreator1(payload)
+actionCreator2(payload)
+reducer(state, action)
+getEmptyState()
}
DuckModule <|-- AccountsDuck
DuckModule <|-- ConversationsDuck
DuckModule <|-- StoriesDuck
DuckModule <|-- CallingDuck
AccountsDuck --> "用户认证状态"
ConversationsDuck --> "会话和消息状态"
StoriesDuck --> "故事状态"
CallingDuck --> "通话状态"
```

**图示来源**  
- [ducks/accounts.preload.ts](file://ts/state/ducks/accounts.preload.ts)
- [ducks/conversations.preload.ts](file://ts/state/ducks/conversations.preload.ts)
- [ducks/stories.preload.ts](file://ts/state/ducks/stories.preload.ts)
- [ducks/calling.preload.ts](file://ts/state/ducks/calling.preload.ts)

**本节来源**  
- [ducks](file://ts/state/ducks)

### 根Reducer组合机制
根reducer通过combineReducers函数将各个模块的reducer组合成一个统一的reducer。这种组合方式使得状态树的结构清晰，便于管理和调试。

```mermaid
flowchart TD
A[导入所有模块的reducer] --> B[使用combineReducers组合]
B --> C[创建根reducer]
C --> D[导出根reducer和状态类型]
D --> E[在store创建时使用]
subgraph "reducer.preload.ts"
F[accounts reducer]
G[app reducer]
H[conversations reducer]
I[calls reducer]
J[stories reducer]
end
F --> C
G --> C
H --> C
I --> C
J --> C
```

**图示来源**  
- [reducer.preload.ts](file://ts/state/reducer.preload.ts#L6-L82)

**本节来源**  
- [reducer.preload.ts](file://ts/state/reducer.preload.ts#L1-L85)

### Store创建流程
Store的创建流程包括中间件配置、增强器应用和初始状态注入。Signal-Desktop使用了redux-promise-middleware、thunk和自定义中间件来处理异步操作和副作用。

```mermaid
sequenceDiagram
participant Init as initializeRedux
participant Store as createStore
participant Middleware as 中间件链
participant Reducer as 根reducer
Init->>Store : 调用createStore
Store->>Store : 配置中间件
Store->>Middleware : 添加promise中间件
Store->>Middleware : 添加thunk中间件
Store->>Middleware : 添加dispatchItems中间件
Store->>Middleware : 添加actionRateLogger
Store->>Middleware : 添加redux-logger(开发环境)
Store->>Store : 创建增强器
Store->>Reducer : 传入根reducer
Store->>Store : 注入初始状态
Store-->>Init : 返回store实例
```

**图示来源**  
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L81-L87)
- [initializeRedux.preload.ts](file://ts/state/initializeRedux.preload.ts#L42-L45)

**本节来源**  
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L1-L96)
- [initializeRedux.preload.ts](file://ts/state/initializeRedux.preload.ts#L1-L119)

### 业务模块状态切片
Signal-Desktop将应用程序状态划分为多个业务模块，每个模块负责管理特定领域的状态。这种模块化设计使得状态管理更加清晰和可维护。

#### 会话模块
会话模块管理所有与会话相关的状态，包括会话列表、消息历史、联系人信息等。

```mermaid
erDiagram
CONVERSATION {
string id PK
string name
string type
string activeAt
string lastMessage
string unreadCount
boolean isArchived
boolean isPinned
}
MESSAGE {
string id PK
string conversationId FK
string body
number timestamp
string senderId
enum status
boolean isUnread
}
CONTACT {
string id PK
string name
string phoneNumber
string avatar
boolean isBlocked
}
CONVERSATION ||--o{ MESSAGE : contains
CONVERSATION ||--o{ CONTACT : participants
```

**图示来源**  
- [ducks/conversations.preload.ts](file://ts/state/ducks/conversations.preload.ts#L165-L186)
- [model-types.d.ts](file://ts/model-types.d.ts)

**本节来源**  
- [ducks/conversations.preload.ts](file://ts/state/ducks/conversations.preload.ts#L1-L200)

#### 通话模块
通话模块管理所有与通话相关的状态，包括当前通话、通话历史、设备设置等。

```mermaid
classDiagram
class CallingState {
+DirectCallState directCall
+GroupCallState groupCall
+CallHistoryState callHistory
+MediaDeviceSettings mediaSettings
+boolean isMuted
+boolean isCameraEnabled
}
class DirectCallState {
+string conversationId
+CallState callState
+boolean isVideoCall
+boolean hasRemoteVideo
+number remoteAudioLevel
}
class GroupCallState {
+string conversationId
+GroupCallConnectionState connectionState
+GroupCallJoinState joinState
+GroupCallPeekInfo peekInfo
+array remoteParticipants
}
class CallHistoryState {
+array callHistoryByCallId
+number unreadCount
}
CallingState --> DirectCallState
CallingState --> GroupCallState
CallingState --> CallHistoryState
```

**图示来源**  
- [ducks/calling.preload.ts](file://ts/state/ducks/calling.preload.ts#L139-L200)
- [ducks/callHistory.preload.ts](file://ts/state/ducks/callHistory.preload.ts)

**本节来源**  
- [ducks/calling.preload.ts](file://ts/state/ducks/calling.preload.ts#L1-L200)

#### 故事模块
故事模块管理所有与故事相关的状态，包括故事内容、查看者列表、发送状态等。

```mermaid
classDiagram
class StoriesState {
+array stories
+SelectedStoryData selectedStoryData
+ReplyState replyState
+AddStoryData addStoryData
+RecipientsByConversation sendStoryModalData
+boolean hasAllStoriesUnmuted
+number lastOpenedAtTimestamp
}
class StoryData {
+string messageId
+string conversationId
+Attachment attachment
+string body
+number timestamp
+number expirationStartTimestamp
+DurationInSeconds expireTimer
+array reactions
+map sendStateByConversationId
+boolean readStatus
+boolean hasReplies
+boolean hasRepliesFromSelf
}
class SelectedStoryData {
+number currentIndex
+string messageId
+number numStories
+StoryViewModeType storyViewMode
+array unviewedStoryConversationIdsSorted
+StoryViewTargetType viewTarget
}
StoriesState --> StoryData
StoriesState --> SelectedStoryData
```

**图示来源**  
- [ducks/stories.preload.ts](file://ts/state/ducks/stories.preload.ts#L165-L176)
- [types/Stories.std.js](file://ts/types/Stories.std.js)

**本节来源**  
- [ducks/stories.preload.ts](file://ts/state/ducks/stories.preload.ts#L1-L200)

### 中间件配置
Signal-Desktop配置了多个中间件来处理不同的任务，包括异步操作、副作用处理和性能监控。

```mermaid
graph LR
A[Action] --> B[promise中间件]
B --> C[thunk中间件]
C --> D[dispatchItems中间件]
D --> E[actionRateLogger]
E --> F[redux-logger]
F --> G[Reducer]
style B fill:#f9f,stroke:#333
style C fill:#f9f,stroke:#333
style D fill:#f9f,stroke:#333
style E fill:#f9f,stroke:#333
style F fill:#f9f,stroke:#333
classDef middleware fill:#f9f,stroke:#333;
class B,C,D,E,F middleware;
```

**图示来源**  
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L81-L87)
- [shims/dispatchItemsMiddleware.preload.js](file://ts/shims/dispatchItemsMiddleware.preload.js)

**本节来源**  
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L1-L96)

### 初始状态加载
初始状态的加载通过getInitialState函数实现，该函数从持久化存储和其他服务中获取初始数据，并与空状态合并。

```mermaid
flowchart TD
A[调用getInitialState] --> B[获取各模块的空状态]
B --> C[从Storage获取项目状态]
C --> D[从ConversationController获取会话状态]
D --> E[生成用户状态]
E --> F[合并初始数据]
F --> G[返回完整初始状态]
subgraph "数据源"
H[本地存储]
I[会话控制器]
J[用户服务]
K[系统信息]
end
H --> C
I --> D
J --> E
K --> E
```

**图示来源**  
- [getInitialState.preload.ts](file://ts/state/getInitialState.preload.ts#L67-L126)
- [Storage.preload.js](file://ts/textsecure/Storage.preload.js)
- [ConversationController.preload.js](file://ts/ConversationController.preload.js)

**本节来源**  
- [getInitialState.preload.ts](file://ts/state/getInitialState.preload.ts#L1-L248)

## 依赖分析
Signal-Desktop的Redux架构依赖于多个外部库和内部服务，这些依赖关系确保了状态管理系统的完整性和功能性。

```mermaid
graph TD
A[Redux] --> B[redux-thunk]
A --> C[redux-promise-middleware]
A --> D[redux-logger]
A --> E[redux]
E --> F[React-Redux]
G[Signal-Desktop] --> H[SQL数据库]
G --> I[Electron IPC]
G --> J[WebAPI]
G --> K[本地文件系统]
H --> |读写状态| G
I --> |进程通信| G
J --> |网络请求| G
K --> |文件操作| G
style A fill:#ffcccc,stroke:#333
style G fill:#ccffcc,stroke:#333
style H fill:#ccccff,stroke:#333
style I fill:#ccccff,stroke:#333
style J fill:#ccccff,stroke:#333
style K fill:#ccccff,stroke:#333
classDef redux fill:#ffcccc,stroke:#333;
classDef app fill:#ccffcc,stroke:#333;
classDef service fill:#ccccff,stroke:#333;
class A,B,C,D,E,F redux
class G app
class H,I,J,K service
```

**图示来源**  
- [package.json](file://package.json)
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L7-L8)
- [getInitialState.preload.ts](file://ts/state/getInitialState.preload.ts#L10-L11)

**本节来源**  
- [package.json](file://package.json)
- [ts/state](file://ts/state)

## 性能考虑
Signal-Desktop在Redux架构设计中考虑了多个性能优化点，包括action频率监控、选择器优化和状态更新策略。

### Action频率监控
通过actionRateLogger中间件监控action的频率，防止过多的action导致性能问题。

```mermaid
flowchart TD
A[分发Action] --> B[actionRateLogger中间件]
B --> C{是否为网络状态检查}
C --> |是| D[忽略]
C --> |否| E{是否为音频级别变化}
E --> |是| F[忽略]
E --> |否| G[记录action]
G --> H{数量是否超过阈值}
H --> |是| I[记录警告]
H --> |否| J[继续处理]
I --> K[重置计数器]
J --> L[传递给下一个中间件]
style D fill:#f96,stroke:#333
style F fill:#f96,stroke:#333
style I fill:#f96,stroke:#333
```

**图示来源**  
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L50-L78)
- [environment.std.js](file://ts/environment.std.js)

**本节来源**  
- [createStore.preload.ts](file://ts/state/createStore.preload.ts#L1-L96)

## 故障排除指南
### 状态更新问题
当遇到状态更新问题时，可以检查以下几个方面：

1. **Action类型是否正确**：确保action的type字段与reducer中处理的类型匹配
2. **Reducer是否纯函数**：确保reducer没有副作用，总是返回新的状态对象
3. **中间件配置**：检查中间件链是否正确配置，没有阻止action传递

### 初始状态加载失败
如果初始状态加载失败，可以检查：

1. **存储服务是否可用**：确保Storage服务已正确初始化
2. **数据迁移是否完成**：检查数据库迁移是否成功完成
3. **权限是否足够**：确保应用程序有足够的权限访问所需资源

**本节来源**  
- [initializeRedux.preload.ts](file://ts/state/initializeRedux.preload.ts#L42-L46)
- [getInitialState.preload.ts](file://ts/state/getInitialState.preload.ts#L87-L89)

## 结论
Signal-Desktop的Redux架构采用了成熟的ducks模式，实现了模块化、可扩展的状态管理。通过合理的中间件配置、初始状态加载机制和性能优化策略，该架构为应用程序提供了稳定可靠的状态管理基础。各业务模块的状态切片设计清晰，命名规范统一，便于维护和扩展。整体架构体现了高内聚、低耦合的设计原则，为大型应用程序的状态管理提供了优秀的实践范例。