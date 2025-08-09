import * as path from "path";
import { MgbaClient } from "./mgba_client.js";

export type GbaKey = "A" | "B" | "SELECT" | "START" | "RIGHT" | "LEFT" | "UP" | "DOWN" | "R" | "L";

const GBA_KEY_CODES: Record<GbaKey, number> = {
    A: 0,
    B: 1,
    SELECT: 2,
    START: 3,
    RIGHT: 4,
    LEFT: 5,
    UP: 6,
    DOWN: 7,
    R: 8,
    L: 9,
};

/**
 * 发送按键输入到游戏
 * @param key 按键名称
 * @param duration 持续时间（毫秒），默认 10ms
 */
export async function pressKey(key: GbaKey, duration: number = 10): Promise<void> {
    const keyCode = GBA_KEY_CODES[key];

    // 按下按键（新连接）
    const addController = new MgbaClient();
    try {
        await addController.connect();
        await addController.addKey(keyCode);
    } finally {
        addController.disconnect();
    }
    
    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // 释放按键（新连接）
    const clearController = new MgbaClient();
    try {
        await clearController.connect();
        await clearController.clearKey(keyCode);
    } finally {
        clearController.disconnect();
    }
}

/**
 * 捕获游戏画面截图
 * 返回游戏画面的 Buffer 数据
 * @returns 图像 Buffer 数据
 */
export async function screenshot(): Promise<Buffer> {
    const controller = new MgbaClient();
    const tempPath = path.join(
        process.cwd(),
        "screenshots",
        `capture_${Date.now()}.png`,
    );

    try {
        await controller.connect();
        return await controller.captureScreen(tempPath);
    } finally {
        controller.disconnect();
    }
}
