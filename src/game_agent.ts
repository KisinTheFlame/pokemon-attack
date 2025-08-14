import { screenshot, pressKey, GbaKey } from "./gba.js";
import { LlmClient } from "./llm.js";
import { ContextManager } from "./context_manager.js";

export interface GameAnalysisResponse {
    analysis: string;
    thinking: string;
    action: GbaKey;
}

export interface GameTurnResult {
    response: GameAnalysisResponse;
    imageBase64: string;
}


export class GameAgent {
    private llmClient: LlmClient;
    private contextManager: ContextManager;

    constructor(llmClient: LlmClient, contextManager: ContextManager) {
        this.llmClient = llmClient;
        this.contextManager = contextManager;
    }

    /**
     * 执行一轮游戏对话：捕获画面 -> LLM分析 -> 执行按键
     */
    async executeOneTurn(): Promise<GameTurnResult> {
        let imageBuffer: Buffer;
        let base64Image: string;
        
        try {
            console.debug("📸 正在捕获游戏画面...");
            imageBuffer = await screenshot();
            base64Image = imageBuffer.toString("base64");
        } catch (error) {
            console.error("🚨 捕获游戏画面失败:");
            throw new Error(`截图失败: ${error instanceof Error ? error.message : String(error)}`);
        }

        let responseString: string;
        try {
            console.debug("🤖 正在分析游戏画面...");
            const messages = this.contextManager.genMessages(base64Image);
            responseString = await this.llmClient.oneTurnChat(messages);
        } catch (error) {
            console.error("🚨 LLM 分析失败:");
            throw new Error(`LLM 分析失败: ${error instanceof Error ? error.message : String(error)}`);
        }

        // 解析 JSON 响应
        const response = this.parseResponse(responseString);

        // 验证按键是否有效
        const validKeys: GbaKey[] = [
            "A",
            "B",
            "SELECT",
            "START",
            "RIGHT",
            "LEFT",
            "UP",
            "DOWN",
            "R",
            "L",
        ];
        if (!validKeys.includes(response.action)) {
            throw new Error(`无效的按键: ${response.action}`);
        }

        console.log("🎯 分析结果:", response.analysis);
        console.log("💭 决策思路:", response.thinking);
        console.log("⌨️ 执行按键:", response.action);

        // 执行按键操作
        try {
            await pressKey(response.action);
            console.log("✅ 按键执行完成");
        } catch (error) {
            console.error("🚨 按键执行失败:");
            throw new Error(`按键执行失败: ${error instanceof Error ? error.message : String(error)}`);
        }

        return {
            response,
            imageBase64: base64Image,
        };
    }

    private parseResponse(response: string) {
        try {
            return JSON.parse(response) as GameAnalysisResponse;
        } catch (error) {
            throw new Error(`解析 LLM 响应失败: ${String(error)}\n响应内容: ${response}`);
        }
    }

}
