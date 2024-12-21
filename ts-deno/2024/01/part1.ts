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

for (let i = 0; i < A.length; i++) {
  sum += Math.abs(A[i] - B[i]);
}

await output(sum);
