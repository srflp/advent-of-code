export default async function (input: ReadableStream<string>) {
  let correct = 0;

  report: for await (const line of input) {
    const levels = line.split(" ").map(Number);

    for (let i = 0; i < levels.length - 1; i++) {
      const diff = levels[i] - levels[i + 1];

      if (!inRange(diff)) {
        isValid(levels.toSpliced(i, 1)) || isValid(levels.toSpliced(i + 1, 1));
        continue report;
      }

      const hasConsecutiveDiffs = i + 2 < levels.length;
      if (hasConsecutiveDiffs) {
        const diff2 = levels[i + 1] - levels[i + 2];
        const consecutiveDiffsNotMonotonic = diff > 0 !== diff2 > 0;

        if (consecutiveDiffsNotMonotonic) {
          isValid(levels.toSpliced(i, 1)) ||
            isValid(levels.toSpliced(i + 1, 1)) ||
            isValid(levels.toSpliced(i + 2, 1));
          continue report;
        }
      }
    }
    correct++;
  }

  function isValid(levels: number[]) {
    const diff0 = levels[0] - levels[1];
    for (let i = 0; i < levels.length - 1; i++) {
      const diff = levels[i] - levels[i + 1];
      if (!inRange(diff) || diff0 > 0 !== diff > 0) {
        return false;
      }
    }
    correct++;
    return true;
  }

  function inRange(diff: number) {
    const absDiff = Math.abs(diff);
    return absDiff >= 1 && absDiff <= 3;
  }

  return correct;
}
