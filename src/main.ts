import { loadConfig } from "./config.js";
import { LlmClient } from "./llm.js";
import { GameAgent } from "./game_agent.js";

console.log("🎮 宝可梦 绿宝石 LLM Agent 启动中...");

async function main() {
    try {
        const config = loadConfig();
        console.log("✅ 配置文件加载成功");
        
        const llmClient = new LlmClient(config.llm);
        console.log("🤖 LLM 客户端初始化完成");
        
        // 初始化游戏 Agent
        const gameAgent = new GameAgent(llmClient);
        console.log("🎯 游戏 Agent 初始化完成");

        console.log("✨ 开始执行一轮游戏对话...");
        
        // 执行一轮对话
        const result = await gameAgent.executeOneTurn();
        
        console.log("\n📋 一轮对话结果:");
        console.log("-------------------");
        console.log("🔍 画面分析:", result.analysis);
        console.log("💭 决策思路:", result.thinking);
        console.log("⌨️  执行按键:", result.action);
        console.log("-------------------");
        
        console.log("🚀 一轮对话执行完成！");
    } catch (error) {
        console.error("❌ 启动失败:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main().catch((error: unknown) => {
    console.error("❌ 启动失败:", error);
    process.exit(1);
});
