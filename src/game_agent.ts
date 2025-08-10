import { screenshot, pressKey, GbaKey } from "./gba.js";
import { LlmClient } from "./llm.js";
import { loadPrompt } from "./prompt.js";

export interface GameAnalysisResponse {
    analysis: string;
    thinking: string;
    action: GbaKey;
}

export class GameAgent {
    private llmClient: LlmClient;

    constructor(llmClient: LlmClient) {
        this.llmClient = llmClient;
    }

    /**
     * 执行一轮游戏对话：捕获画面 -> LLM分析 -> 执行按键
     */
    async executeOneTurn(): Promise<GameAnalysisResponse> {
        console.log("📸 正在捕获游戏画面...");
        const imageBuffer = await screenshot();

        console.log("🤖 正在分析游戏画面...");
        const base64Image = imageBuffer.toString("base64");

        const prompt = loadPrompt();

        const responseString = await this.llmClient.oneTurnChat([
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt,
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${base64Image}`,
                        },
                    },
                ],
            },
        ]);

        console.log("📝 LLM 原始响应:", responseString);

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
        console.log("⌨️  执行按键:", response.action);

        // 执行按键操作
        await pressKey(response.action);
        console.log("✅ 按键执行完成");

        return response;
    }

    private parseResponse(response: string) {
        try {
            return JSON.parse(response) as GameAnalysisResponse;
        } catch (error) {
            throw new Error(`解析 LLM 响应失败: ${String(error)}\n响应内容: ${response}`);
        }
    }
}
