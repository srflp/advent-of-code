import { languageSchema, partSchema, runtimesByFolder } from "./lib/shared.ts";
import { walk } from "jsr:@std/fs/walk";
import { runSolution } from "./lib/runSolution.ts";

const entries = [];

let failures = 0;
for await (const entry of walk("solutions", {
  includeDirs: false,
  includeFiles: true,
  exts: [".ts"],
  // solutions/ts-deno/2024/01/part1.ts
  match: [/^.*\/\d{4}\/(?:0[1-9]|1[0-9]|2[0-5])\/part[1-2]\.ts$/],
})) {
  const [_, languageUnparsed, year, day, fileName] = entry.path.split("/");
  const part = partSchema.parse(
    fileName.replace("part", "").replace(".ts", "")
  );
  const language = languageSchema.parse(languageUnparsed);

  entries.push({
    language,
    year,
    day,
    part,
  });
}

entries.sort((a, b) => {
  // if (a.runtime !== b.runtime) {
  //   return a.runtime.localeCompare(b.runtime);
  // }
  if (a.year !== b.year) {
    return a.year.localeCompare(b.year);
  }
  if (a.day !== b.day) {
    return a.day.localeCompare(b.day);
  }
  if (a.part !== b.part) {
    return a.part.localeCompare(b.part);
  }
  return 0;
});

// 📋 2024 01 part1
// ✅ ts-deno example 🕐 23ms
// ✅ ts-deno actual  🕐 26ms
// 📋 2024 01 part2
// ✅ ts-deno example 🕐 23ms
// ✅ ts-deno actual  🕐 28ms
// 📋 2024 02 part1
// ✅ ts-deno example 🕐 23ms
// ✅ ts-deno actual  🕐 26ms
// 📋 2024 02 part2
// ✅ ts-deno example 🕐 23ms
// ❌ ts-deno actual  🕐 26ms
// ❌ 1 solution failed

let lastEntry: (typeof entries)[number] | undefined;
for (const entry of entries) {
  const { year, day, part, language } = entry;
  if (
    lastEntry?.year !== year ||
    lastEntry?.day !== day ||
    lastEntry?.part !== part
  ) {
    console.log(`📋 ${year} ${day} part${part}`);
  }
  lastEntry = entry;
  for (const solutionType of ["example", "actual"] as const) {
    for (const runtime of runtimesByFolder[language]) {
      await runSolution({
        year,
        day,
        part,
        runtime,
        solutionType,
        reporter: async (data) => {
          switch (data.status) {
            case "failure": {
              console.error("❌ FAILURE");
              failures++;
              break;
            }
            case "success-no-expected": {
              const { result, computationTime, outputFilePath } = data;
              console.log(`🆕 Output:   ${result}`);
              const answer = prompt(
                `❌ Output file does not exist. Do you want to create it with the current output? (y/n):`
              );
              if (answer?.toLowerCase() === "y") {
                await Deno.writeTextFile(outputFilePath, result);
                console.log(`✅ Created ${outputFilePath}`);
              }
              console.log(`🕐 Took:     ${Math.round(computationTime)}ms`);
              break;
            }
            case "success": {
              const { result, expected, computationTime } = data;
              if (result === expected) {
                console.log(
                  `✅ ${runtime} ${solutionType.padEnd(7, " ")} 🕐 ${Math.round(
                    computationTime
                  )}ms`
                );
              } else {
                console.log(
                  `❌ ${runtime} ${solutionType.padEnd(7, " ")} 🕐 ${Math.round(
                    computationTime
                  )}ms`
                );
                failures++;
              }
              break;
            }
          }
        },
      });
    }
  }
}

if (failures > 0) {
  console.log(
    `❌ ${failures} ${failures === 1 ? "solution" : "solutions"} failed`
  );
  Deno.exit(1);
} else {
  console.log("🎉 All solutions passed");
}
