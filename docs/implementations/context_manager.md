# 上下文管理模块实现文档

## 概述

独立的上下文管理模块，负责历史记录存储、系统提示词管理和 LLM 消息链构建，为多轮对话提供完整的上下文支持。

## 架构

```
ContextManager
├── 历史记录管理 (HistoryTurn[])
├── 系统提示词管理 (systemPrompt)
├── 配置管理 (maxHistoryTurns)  
└── 消息链构建 (genMessages)
```

## 核心功能

### 1. 历史记录管理
- 存储过往所有对话历史
- 自动记录图像和 LLM 响应
- 内置日志输出显示历史状态

### 2. 系统提示词管理
- 构造时自动加载系统提示词
- 封装提示词加载逻辑

### 3. 消息链构建
- 动态选择最近的 N 条历史记录
- 构建完整的 ChatCompletionMessageParam 数组
- 包含系统消息、历史对话和当前图像

## 接口设计

```typescript
export class ContextManager {
    constructor(agentConfig: AgentConfig)
    addHistoryTurn(imageBase64: string, response: GameAnalysisResponse): void
    genMessages(currentImage: string): ChatCompletionMessageParam[]
}
```

### 构造函数
- 接收 `AgentConfig` 参数
- 自动加载系统提示词 (`loadPrompt()`)
- 从配置中获取历史保留轮数

### addHistoryTurn()
- 添加新的历史记录到内部数组
- 自动打印历史记录状态日志
- 参数：图像base64字符串、LLM响应对象

### genMessages()
- 构建包含上下文的完整消息链
- 只包含最近的 `maxHistoryTurns` 条历史记录
- 返回 OpenAI ChatCompletionMessageParam 数组

## 数据结构

### HistoryTurn 接口
```typescript
export interface HistoryTurn {
    imageBase64: string;           // 游戏截图的base64编码
    response: GameAnalysisResponse; // LLM的分析响应
}
```

简化设计，移除了不必要的 `turnNumber` 和 `timestamp` 字段。

## 消息链构建逻辑

1. **系统消息**: 添加系统提示词作为第一条消息
2. **历史对话**: 遍历最近的 N 条历史记录
   - 每条历史生成用户消息（包含图像）
   - 每条历史生成助手消息（JSON格式响应）
3. **当前请求**: 添加当前图像作为最后的用户消息

## 与其他模块的集成

### GameAgent 集成
- `GameAgent` 构造函数接收 `ContextManager` 实例
- 通过 `contextManager.genMessages()` 获取消息链
- 移除了原有的 `buildMessagesWithHistory` 方法

### MultiTurnGameAgent 集成
- 创建 `ContextManager` 实例并传递给 `GameAgent`
- 执行完一轮对话后调用 `addHistoryTurn()` 更新历史
- 简化了历史管理逻辑

## 封装原则

- **完全封装**: 不暴露内部历史数据（移除了 `getHistory` 方法）
- **职责单一**: 专注于上下文管理，不涉及其他业务逻辑
- **配置驱动**: 通过 `AgentConfig` 管理行为参数
- **自治管理**: 自主加载依赖和管理状态

## 使用示例

```typescript
import { ContextManager } from "./context_manager.js";
import { AgentConfig } from "./config.js";

// 创建上下文管理器
const contextManager = new ContextManager(agentConfig);

// 生成消息链
const messages = contextManager.genMessages(currentImageBase64);

// 添加历史记录
contextManager.addHistoryTurn(imageBase64, llmResponse);
```

## 依赖模块

- `src/prompt.ts`: 系统提示词加载
- `src/config.ts`: 配置类型定义
- `src/game_agent.ts`: 响应类型定义
- `openai`: ChatCompletionMessageParam 类型