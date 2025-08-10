import { GameAgent, GameAnalysisResponse, HistoryTurn } from "./game_agent.js";
import { LlmClient } from "./llm.js";
import { AgentConfig } from "./config.js";


export class MultiTurnGameAgent {
    private gameAgent: GameAgent;
    private config: AgentConfig;
    private history: HistoryTurn[] = [];
    private currentTurn = 0;

    constructor(llmClient: LlmClient, config: AgentConfig) {
        this.gameAgent = new GameAgent(llmClient);
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
        // 执行一轮对话，传入历史记录
        const result = await this.gameAgent.executeOneTurn(this.history);
        
        // 添加到历史记录
        this.addToHistory(result.response, result.imageBase64);
    }

    /**
     * 添加记录到历史，并维护历史长度限制
     */
    private addToHistory(response: GameAnalysisResponse, imageBase64: string): void {
        const historyTurn: HistoryTurn = {
            turnNumber: this.currentTurn,
            imageBase64,
            response,
            timestamp: new Date(),
        };

        this.history.push(historyTurn);

        // 维护历史长度限制
        const maxTurns = this.config.history_turns;
        if (this.history.length > maxTurns) {
            this.history.shift(); // 移除最老的记录
        }

        const currentLength = this.history.length;
        console.log(`💾 历史记录: ${currentLength.toString()}/${maxTurns.toString()} 轮`);
    }

    /**
     * 获取当前轮次
     */
    getCurrentTurn(): number {
        return this.currentTurn;
    }
}
