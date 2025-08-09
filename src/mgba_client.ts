import * as net from "net";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * mGBA 客户端类
 * 通过 Socket 连接与 mGBA Lua 脚本通信，实现游戏画面捕获功能
 */
export class MgbaClient {
    private socket: net.Socket;
    private host: string;
    private port: number;
    private isConnected: boolean = false;

    constructor(host: string = "localhost", port: number = 8888) {
        this.host = host;
        this.port = port;
        this.socket = new net.Socket();
    }

    /**
     * 连接到 mGBA Lua 服务器
     */
    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.connect(this.port, this.host, () => {
                this.isConnected = true;
                resolve();
            });

            this.socket.on("error", (error) => {
                this.isConnected = false;
                reject(error);
            });
        });
    }

    /**
     * 断开连接
     */
    disconnect(): void {
        if (this.socket && !this.socket.destroyed) {
            this.socket.destroy();
        }
        this.isConnected = false;
    }

    /**
     * 按下按键
     * @param keyCode 按键码
     */
    async addKey(keyCode: number): Promise<void> {
        if (!this.isConnected) {
            throw new Error("Not connected to mGBA server");
        }

        const request = this.packKeyRequest(2, keyCode); // 操作码 2: 按下按键
        this.socket.write(request);

        const response = await this.receiveMessage();
        const status = response.readInt32BE(0);

        if (status !== 0) {
            const errorLength = response.readInt32BE(4);
            const errorMsg = response.subarray(8, 8 + errorLength).toString();
            throw new Error(errorMsg);
        }
    }

    /**
     * 释放按键
     * @param keyCode 按键码
     */
    async clearKey(keyCode: number): Promise<void> {
        if (!this.isConnected) {
            throw new Error("Not connected to mGBA server");
        }

        const request = this.packKeyRequest(3, keyCode); // 操作码 3: 释放按键
        this.socket.write(request);

        const response = await this.receiveMessage();
        const status = response.readInt32BE(0);

        if (status !== 0) {
            const errorLength = response.readInt32BE(4);
            const errorMsg = response.subarray(8, 8 + errorLength).toString();
            throw new Error(errorMsg);
        }
    }

    /**
     * 捕获游戏画面
     * @param screenshotPath 截图保存路径
     * @returns 截图文件的 Buffer 数据
     */
    async captureScreen(screenshotPath: string): Promise<Buffer> {
        if (!screenshotPath) {
            throw new Error("Screenshot path is required");
        }

        if (!this.isConnected) {
            throw new Error("Not connected to mGBA server");
        }

        // 确保目录存在
        await fs.mkdir(path.dirname(screenshotPath), { recursive: true });

        // 发送请求：操作码1 + 文件路径
        const request = this.packScreenshotRequest(screenshotPath);
        this.socket.write(request);

        // 接收响应
        const response = await this.receiveMessage();
        const status = response.readInt32BE(0);

        if (status === 0) {
            // 成功
            // 读取保存的截图文件
            const imageBuffer = await fs.readFile(screenshotPath);
            return imageBuffer;
        } else {
            // 错误
            const errorLength = response.readInt32BE(4);
            const errorMsg = response.subarray(8, 8 + errorLength).toString();
            throw new Error(errorMsg);
        }
    }

    /**
     * 打包按键请求
     * @param opcode 操作码（2=按下，3=释放）
     * @param keyCode 按键码
     * @returns 二进制请求数据
     */
    private packKeyRequest(opcode: number, keyCode: number): Buffer {
        const request = Buffer.alloc(8);

        request.writeInt32BE(opcode, 0); // 操作码
        request.writeInt32BE(keyCode, 4); // 按键码

        return request;
    }

    /**
     * 打包截图请求
     * @param filepath 文件路径
     * @returns 二进制请求数据
     */
    private packScreenshotRequest(filepath: string): Buffer {
        const pathBuffer = Buffer.from(filepath, "utf8");
        const request = Buffer.alloc(8 + pathBuffer.length);

        request.writeInt32BE(1, 0); // 操作码1：截图
        request.writeInt32BE(pathBuffer.length, 4); // 路径长度
        pathBuffer.copy(request, 8); // 路径内容

        return request;
    }

    /**
     * 接收完整的二进制消息
     * @returns 完整的响应消息
     */
    private async receiveMessage(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let buffer = Buffer.alloc(0);
            let status: number | null = null;
            let totalLength = 4; // 至少需要读取状态码

            const onData = (data: Buffer) => {
                buffer = Buffer.concat([buffer, data]);

                // 读取状态码
                if (status === null && buffer.length >= 4) {
                    status = buffer.readInt32BE(0);
                    if (status !== 0) {
                        // 失败时需要读取错误信息长度
                        if (buffer.length >= 8) {
                            const errorLength = buffer.readInt32BE(4);
                            totalLength = 8 + errorLength;
                        } else {
                            return; // 等待更多数据
                        }
                    }
                    // 成功时只有状态码，totalLength = 4
                }

                // 检查是否接收完整消息
                if (buffer.length >= totalLength) {
                    this.socket.removeListener("data", onData);
                    this.socket.removeListener("error", onError);
                    resolve(buffer.subarray(0, totalLength));
                }
            };

            const onError = (error: Error) => {
                this.socket.removeListener("data", onData);
                this.socket.removeListener("error", onError);
                reject(error);
            };

            this.socket.on("data", onData);
            this.socket.on("error", onError);
        });
    }
}
