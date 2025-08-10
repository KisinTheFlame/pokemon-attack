import { loadConfig } from "./config.js";
import { LlmClient } from "./llm.js";
import { MultiTurnGameAgent } from "./multi_turn_agent.js";

// 全局错误处理
process.on("uncaughtException", error => {
    console.error("\n💥 未捕获的异常:");
    console.error("错误类型:", error.name);
    console.error("错误信息:", error.message);
    console.error("错误堆栈:", error.stack);
    console.error("\n程序将退出...");
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("\n💥 未处理的 Promise 拒绝:");
    console.error("Promise:", promise);
    console.error("原因:", reason);
    console.error("\n程序将退出...");
    process.exit(1);
});

process.on("exit", code => {
    console.log(`\n👋 程序退出，退出码: ${code.toString()}`);
});

console.log("🎮 宝可梦 绿宝石 LLM Agent 启动中...");

async function main() {
    try {
        const config = loadConfig();
        console.log("✅ 配置文件加载成功");
        
        const llmClient = new LlmClient(config.llm);
        console.log("🤖 LLM 客户端初始化完成");
        
        // 初始化多轮游戏 Agent
        const multiTurnAgent = new MultiTurnGameAgent(llmClient, config.agent);
        console.log("🎯 多轮游戏 Agent 初始化完成");

        // 启动多轮对话
        await multiTurnAgent.startMultiTurnConversation();
    } catch (error) {
        console.error("❌ 启动失败:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main().catch((error: unknown) => {
    console.error("❌ 启动失败:", error);
    process.exit(1);
});
