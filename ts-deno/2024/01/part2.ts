import { input, output } from "../../utils.ts";

const A = [];
const B = [];

for await (const line of input) {
  const [numberA, numberB] = line.split("   ").map(Number);

  A.push(numberA);
  B.push(numberB);
}

A.sort();
B.sort();

let sum = 0;

for (const a of A) {
  let multiplier = 0;
  for (const b of B) {
    if (a === b) {
      multiplier++;
    }
  }
  sum += a * multiplier;
}

await output(sum);
