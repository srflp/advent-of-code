import { Runtime } from "./shared.ts";

export const solutionTemplates: Record<Runtime, string> = {
  "ts-deno": `import { input, output } from "../../utils.ts";

for await (const line of input) {
// parse input here
}

await output();`,
};
