import { GameAgent } from "./game_agent.js";
import { LlmClient } from "./llm.js";
import { AgentConfig } from "./config.js";
import { ContextManager } from "./context_manager.js";


export class MultiTurnGameAgent {
    private gameAgent: GameAgent;
    private config: AgentConfig;
    private contextManager: ContextManager;
    private currentTurn = 0;

    constructor(llmClient: LlmClient, config: AgentConfig) {
        this.contextManager = new ContextManager(config);
        this.gameAgent = new GameAgent(llmClient, this.contextManager);
        this.config = config;
    }

    /**
     * 启动多轮对话，无限循环
     */
    async startMultiTurnConversation(): Promise<void> {
        const maxHistoryTurns = this.config.history_turns;
        console.log("🚀 开始多轮对话");
        console.log(`📝 历史轮数配置: ${maxHistoryTurns.toString()} 轮\n`);

        try {
            for (;;) {
                this.currentTurn++;
                console.log(`\n=== 第 ${this.currentTurn.toString()} 轮 ===`);

                await this.executeOneTurnWithHistory();
            }
        } catch (error) {
            console.error("\n💥 多轮对话执行失败:");
            if (error instanceof Error) {
                console.error("错误类型:", error.name);
                console.error("错误信息:", error.message);
                if (error.stack) {
                    console.error("错误堆栈:", error.stack);
                }
            } else {
                console.error("未知错误:", String(error));
            }
            throw error;
        }
    }

    /**
     * 执行一轮对话并更新历史记录
     */
    private async executeOneTurnWithHistory(): Promise<void> {
        // 执行一轮对话
        const result = await this.gameAgent.executeOneTurn();
        
        // 添加到历史记录
        this.contextManager.addHistoryTurn(result.imageBase64, result.response);
    }
}
