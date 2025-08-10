import { screenshot, pressKey, GbaKey } from "./gba.js";
import { LlmClient } from "./llm.js";
import { loadPrompt } from "./prompt.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface GameAnalysisResponse {
    analysis: string;
    thinking: string;
    action: GbaKey;
}

export interface GameTurnResult {
    response: GameAnalysisResponse;
    imageBase64: string;
}

export interface HistoryTurn {
    turnNumber: number;
    imageBase64: string;
    response: GameAnalysisResponse;
    timestamp: Date;
}

export class GameAgent {
    private llmClient: LlmClient;

    constructor(llmClient: LlmClient) {
        this.llmClient = llmClient;
    }

    /**
     * 执行一轮游戏对话：捕获画面 -> LLM分析 -> 执行按键
     */
    async executeOneTurn(history: HistoryTurn[] = []): Promise<GameTurnResult> {
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

        let prompt: string;
        try {
            console.debug("📄 正在加载 prompt...");
            prompt = loadPrompt();
        } catch (error) {
            console.error("🚨 加载 prompt 失败:");
            throw new Error(`加载 prompt 失败: ${error instanceof Error ? error.message : String(error)}`);
        }

        let responseString: string;
        try {
            console.debug("🤖 正在分析游戏画面...");
            const messages = this.buildMessagesWithHistory(prompt, base64Image, history);
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
        console.log("⌨️  执行按键:", response.action);

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

    /**
     * 构建包含历史上下文的消息链
     */
    private buildMessagesWithHistory(
        prompt: string, 
        currentImage: string, 
        history: HistoryTurn[],
    ): ChatCompletionMessageParam[] {
        const messages: ChatCompletionMessageParam[] = [];

        // 添加系统 prompt（仅第一条消息）
        messages.push({
            role: "system",
            content: [
                {
                    type: "text",
                    text: prompt,
                },
            ],
        });

        // 添加历史对话
        for (const turn of history) {
            // 添加历史的用户消息（图像）
            messages.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `第 ${turn.turnNumber.toString()} 轮游戏画面:`,
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${turn.imageBase64}`,
                        },
                    },
                ],
            });

            // 添加历史的助手回应
            messages.push({
                role: "assistant",
                content: JSON.stringify(turn.response),
            });
        }

        // 添加当前的用户消息（当前图像）
        messages.push({
            role: "user",
            content: [
                {
                    type: "text",
                    text: "当前游戏画面，请分析并给出下一步操作:",
                },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/png;base64,${currentImage}`,
                    },
                },
            ],
        });

        return messages;
    }
}
