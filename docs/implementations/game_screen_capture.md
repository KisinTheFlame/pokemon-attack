# 游戏画面捕获功能实现文档

## 概述

通过 mGBA 模拟器的 Lua 脚本 API 与 Node.js TCP Socket 通信，实现游戏画面捕获功能。

## 架构

```
Node.js (MgbaClient) ↔ TCP Socket ↔ mGBA Lua Server ↔ 模拟器核心
```

## 模块

### mGBA Lua 服务端 (`scripts/mgba_server.lua`)
- 监听 TCP 端口 8888
- 解析二进制协议请求
- 调用 `emu:screenshot()` API
- 返回操作状态

### MgbaClient (`src/mgba_client.ts`)
- TCP 连接管理
- 二进制协议编解码
- 截图请求处理流程
- 错误处理

### screenshot 函数 (`src/gba.ts`)
- 对 MgbaClient 的封装
- 自动连接管理和文件路径生成
- 资源清理

## 通信协议

### 数据类型
- **整数**: 4字节有符号整数，大端序 (big-endian)
- **字符串**: 4字节长度 + UTF-8 字符串内容

### 截图操作

**请求格式**:
```
[操作码: 4字节] [路径长度: 4字节] [文件路径: 变长字符串]
```

**请求示例**:
```
操作码: 0x00000001 (截图)
路径长度: 0x0000000F (15字节)
文件路径: "./screenshot.png"
```

**响应格式**:
```
[状态码: 4字节] [错误信息长度: 4字节] [错误信息: 变长字符串]
```

**成功响应**:
```
状态码: 0x00000000 (成功)
无后续数据
```

**失败响应**:
```
状态码: 0x00000001 (失败)
错误信息长度: 0x00000014 (20字节)
错误信息: "Screenshot failed: xxx"
```

### 交换流程
1. 客户端连接到服务器端口 8888
2. 客户端发送截图请求 (操作码1 + 文件路径)
3. 服务器调用 `emu:screenshot()` 保存截图
4. 服务器返回操作状态
5. 客户端读取保存的截图文件
6. 连接关闭

## 使用接口

- `MgbaClient`: 需要手动管理连接，支持连接复用
- `screenshot()`: 自动管理连接，单次调用

## 文件

```
src/mgba_client.ts    # 核心客户端
src/gba.ts           # 封装接口
scripts/mgba_server.lua # Lua 服务端
screenshots/         # 截图存储
```