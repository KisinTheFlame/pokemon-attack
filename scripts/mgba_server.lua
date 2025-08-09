-- mGBA Socket Server for Pokemon Attack
-- 为 LLM Agent 提供画面捕获功能的 Lua 服务端脚本

-- 基础数据类型操作函数
local function receiveInt32(socket)
    local data = socket:receive(4)
    if not data or #data < 4 then return nil end
    return string.unpack(">i4", data)
end

local function sendInt32(socket, value)
    local data = string.pack(">i4", value)
    socket:send(data)
end

local function receiveString(socket)
    local length = receiveInt32(socket)
    if not length then return nil end
    local str_data = socket:receive(length)
    return str_data
end

local function sendString(socket, str)
    sendInt32(socket, #str)
    socket:send(str)
end

-- 协议层函数
local function receiveOpCode(socket)
    return receiveInt32(socket)
end

local function sendResponse(socket, status, data)
    sendInt32(socket, status) -- 状态码
    if status ~= 0 then       -- 只在失败时发送响应体
        local error_msg = tostring(data)
        sendString(socket, error_msg)
    end
end

local function sendError(socket, error_msg)
    sendResponse(socket, 1, error_msg)
end

-- 按键码到名称的映射
local KEY_NAMES = {
    [0] = "A",
    [1] = "B",
    [2] = "SELECT",
    [3] = "START",
    [4] = "RIGHT",
    [5] = "LEFT",
    [6] = "UP",
    [7] = "DOWN",
    [8] = "R",
    [9] = "L"
}

-- 业务逻辑函数
local function handleAddKey(socket, keyCode)
    local keyName = KEY_NAMES[keyCode] or "UNKNOWN"
    console:log("Attempting to add key: " .. keyName .. " (" .. keyCode .. ")")
    
    local success, result = pcall(function()
        emu:addKey(keyCode)
    end)
    
    if success then
        console:log("Add key successful: " .. keyName)
        sendResponse(socket, 0)
    else
        console:error("Add key failed: " .. keyName .. " - " .. tostring(result))
        sendError(socket, "Add key failed: " .. tostring(result))
    end
end

local function handleClearKey(socket, keyCode)
    local keyName = KEY_NAMES[keyCode] or "UNKNOWN"
    console:log("Attempting to clear key: " .. keyName .. " (" .. keyCode .. ")")
    
    local success, result = pcall(function()
        emu:clearKey(keyCode)
    end)
    
    if success then
        console:log("Clear key successful: " .. keyName)
        sendResponse(socket, 0)
    else
        console:error("Clear key failed: " .. keyName .. " - " .. tostring(result))
        sendError(socket, "Clear key failed: " .. tostring(result))
    end
end

local function handleScreenshot(socket, filepath)
    console:log("Attempting to take screenshot: " .. filepath)
    local success, result = pcall(function()
        -- 使用 mGBA 截图 API，保存到指定路径
        emu:screenshot(filepath)
    end)

    if success then
        console:log("Screenshot successful")
        sendResponse(socket, 0) -- 成功时只发送状态码
    else
        console:error("Screenshot failed: " .. tostring(result))
        sendError(socket, "Screenshot failed: " .. tostring(result))
    end
end

-- 主处理循环
local function handleConnection(socket)
    local opcode = receiveOpCode(socket)

    if opcode == 1 then -- 截图操作
        local filepath = receiveString(socket)
        if filepath then
            handleScreenshot(socket, filepath)
        else
            sendError(socket, "Invalid filepath")
        end
    elseif opcode == 2 then -- 按下按键操作
        local keyCode = receiveInt32(socket)
        if keyCode then
            handleAddKey(socket, keyCode)
        else
            sendError(socket, "Invalid key code")
        end
    elseif opcode == 3 then -- 释放按键操作
        local keyCode = receiveInt32(socket)
        if keyCode then
            handleClearKey(socket, keyCode)
        else
            sendError(socket, "Invalid key code")
        end
    else
        sendError(socket, "Unknown operation code")
    end
end

local server = nil

-- 服务器主循环
local function startServer(port)
    port = port or 8888

    server = socket.tcp()

    server:bind(nil, port)
    if not server then
        console:error("Failed to bind to port " .. port)
        return
    end

    local ok, err = server:listen()
    if not ok then
        console:log("Failed to listen on port " .. port .. ": " .. err)
        return
    end

    console:log("mGBA Socket Server started on port " .. port)

    -- 处理连接事件
    server:add("received", function(sock)
        local client, accept_err = server:accept()
        if accept_err then
            console:error("Failed to accept client: " .. tostring(accept_err))
            return
        end

        if client then
            console:log("Client connected")

            -- 为每个请求设置一次性处理回调
            -- 处理完后即关闭连接，确保服务端的无状态和稳定性
            client:add("received", function()
                local ok, err = pcall(handleConnection, client)
                if not ok then
                    console:error("Error handling connection: " .. tostring(err))
                end

                console:log("Request processing finished, closing client connection.")
                client:close()
            end)

            -- 错误处理回调
            client:add("error", function()
                console:log("Client connection error. Closing.")
                client:close()
            end)
        end
    end)
end

-- 启动服务器
startServer()
