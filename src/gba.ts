import * as path from "path";
import { MgbaClient } from "./mgba_client.js";

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
