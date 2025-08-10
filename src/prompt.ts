import * as fs from "fs";
import * as path from "path";

/**
 * 加载 prompt 模板
 */
export function loadPrompt(): string {
    const promptPath = path.join(process.cwd(), "static", "prompt.txt");
    return fs.readFileSync(promptPath, "utf-8");
}
