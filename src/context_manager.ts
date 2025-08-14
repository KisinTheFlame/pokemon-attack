import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { GameAnalysisResponse } from "./game_agent.js";
import { loadPrompt } from "./prompt.js";
import { AgentConfig } from "./config.js";

export interface HistoryTurn {
    imageBase64: string;
    response: GameAnalysisResponse;
}

export class ContextManager {
    private history: HistoryTurn[] = [];
    private systemPrompt: string;
    private maxHistoryTurns: number;

    constructor(agentConfig: AgentConfig) {
        this.systemPrompt = loadPrompt();
        this.maxHistoryTurns = agentConfig.history_turns;
    }

    addHistoryTurn(imageBase64: string, response: GameAnalysisResponse): void {
        const historyTurn: HistoryTurn = {
            imageBase64,
            response,
        };
        this.history.push(historyTurn);
    }


    genMessages(currentImage: string): ChatCompletionMessageParam[] {
        const messages: ChatCompletionMessageParam[] = [];

        messages.push({
            role: "system",
            content: [
                {
                    type: "text",
                    text: this.systemPrompt,
                },
            ],
        });

        // 只使用最近的 maxHistoryTurns 条历史记录
        const recentHistory = this.history.slice(-this.maxHistoryTurns);
        for (const turn of recentHistory) {
            messages.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "游戏画面:",
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${turn.imageBase64}`,
                        },
                    },
                ],
            });

            messages.push({
                role: "assistant",
                content: JSON.stringify(turn.response),
            });
        }

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
