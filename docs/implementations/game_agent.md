# 游戏 Agent 对话功能实现文档

## 概述

实现了 LLM Agent 通过一轮对话控制宝可梦绿宝石游戏的核心功能，包括游戏画面分析、决策思考和按键执行。

## 架构

```
GameAgent → screenshot() → LLM 分析 → pressKey() → 游戏状态更新
```

## 模块

### Prompt 模板 (`src/prompt.ts`)
- 结构化 prompt 设计，使用 `<part_name></part_name>` 格式组织
- 包含游戏背景、任务描述、输出格式、按键映射和示例
- 要求 LLM 输出标准 JSON 格式

### GameAgent 类 (`src/game_agent.ts`)
- `executeOneTurn()` 方法：执行一轮完整对话
- 集成截图、LLM 对话、JSON 解析和按键执行
- 包含响应格式验证和按键有效性检查
- 详细的日志输出，便于调试

### 主程序集成 (`src/main.ts`)
- 初始化配置和 LLM 客户端
- 创建 GameAgent 实例并执行一轮对话
- 完整的结果展示和错误处理

## Prompt 设计

### 结构化部分

- **game_context**: 宝可梦绿宝石游戏背景介绍
- **task_description**: 分析任务和操作要求
- **output_format**: JSON 输出格式定义
- **key_mapping**: 可用按键说明
- **examples**: 三种场景的示例输出（探索、战斗、对话）

### 输出格式

```json
{
  "analysis": "详细的画面分析描述",
  "thinking": "决策思路和预期效果",
  "action": "要执行的按键（A/B/SELECT/START/RIGHT/LEFT/UP/DOWN/R/L）"
}
```

## 执行流程

1. **画面捕获**: 调用 `screenshot()` 获取游戏画面 Buffer
2. **图像编码**: 将 Buffer 转换为 base64 格式
3. **LLM 对话**: 发送 prompt 和图像给 LLM，获取 JSON 响应
4. **响应解析**: 清理和解析 JSON 响应
5. **格式验证**: 验证必要字段和按键有效性
6. **按键执行**: 调用 `pressKey()` 执行决策的按键
7. **结果返回**: 返回完整的分析结果

## 错误处理

- JSON 解析失败时抛出详细错误信息
- 响应格式不完整时验证失败
- 无效按键时拒绝执行

## 使用方法

```typescript
import { GameAgent } from "./game_agent.js";
import { LlmClient } from "./llm.js";

const llmClient = new LlmClient(config.llm);
const gameAgent = new GameAgent(llmClient);

// 执行一轮对话
const result = await gameAgent.executeOneTurn();
console.log("分析:", result.analysis);
console.log("思考:", result.thinking);
console.log("按键:", result.action);
```

## 依赖模块

- `src/gba.ts`: 截图和按键功能
- `src/llm.ts`: LLM 客户端
- `src/prompt.ts`: Prompt 模板
- `src/config.ts`: 配置管理

## 文件结构

```
src/
├── game_agent.ts      # GameAgent 类实现
├── prompt.ts          # Prompt 模板定义
├── main.ts            # 主程序集成
├── gba.ts             # mGBA 功能封装
└── llm.ts             # LLM 客户端
```