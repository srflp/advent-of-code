import { input, output } from "../../utils.ts";

let correct = 0;

report: for await (const line of input) {
  const levels = line.split(" ").map(Number);
  const diff0 = levels[0] - levels[1];
  for (let i = 0; i < levels.length - 1; i++) {
    const diff = levels[i] - levels[i + 1];
    if (!inRange(diff) || diff0 > 0 !== diff > 0) {
      continue report;
    }
  }
  correct++;
}

function inRange(diff: number) {
  const absDiff = Math.abs(diff);
  return absDiff >= 1 && absDiff <= 3;
}

await output(correct);
