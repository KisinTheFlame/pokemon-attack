import { loadConfig } from "./config.js";
import { LlmClient } from "./llm.js";

console.log("🎮 宝可梦 绿宝石 LLM Agent 启动中...");

async function main() {
    try {
        const config = loadConfig();
        console.log("✅ 配置文件加载成功");
        
        const llmClient = new LlmClient(config.llm);
        console.log("🤖 LLM 客户端初始化完成");
        
        const testMessage = await llmClient.oneTurnChat([
            { role: "user", content: "Hello! 请用中文回复。" },
        ]);
        console.log("💬 LLM 测试响应:", testMessage);

        console.log("✨ 准备开始自主学习宝可梦游戏");

        console.log("📸 mGBA 控制器可用:");
        console.log("  - const { MGBAController } = require('./mgba_controller');");
        console.log("  - const controller = new MGBAController();");
        console.log("  - await controller.connect();");
        console.log("  - const screenshot = await controller.captureScreen('./screenshot.png');");
        console.log("  - controller.disconnect();");

        console.log("🚀 项目初始化完成！");
    } catch (error) {
        console.error("❌ 启动失败:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main().catch((error: unknown) => {
    console.error("❌ 启动失败:", error);
    process.exit(1);
});
