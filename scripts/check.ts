import z from "npm:zod";
import {
  daySchema,
  solutionTypeSchema,
  partSchema,
  runtimeSchema,
  yearSchema,
  handleError,
  inputStringArgsSchema,
} from "./lib/shared.ts";
import { runSolution } from "./lib/runSolution.ts";

/**
 * Example:
 * deno task check 1 2024 ts-deno 1 example
 */

const inputArgsSchema = z.object({
  year: yearSchema,
  day: daySchema,
  runtime: runtimeSchema,
  part: partSchema,
  input: solutionTypeSchema,
});

const args = handleError(
  inputArgsSchema.safeParse({
    day: Deno.args[0],
    year: Deno.args[1],
    runtime: Deno.args[2],
    part: Deno.args[3],
    input: Deno.args[4],
  })
);

if (!args.runtime) {
  console.error(
    "ERROR: No runtime provided `deno task check <day> <year> <runtime>`"
  );
  Deno.exit(1);
}

const argsStr = handleError(inputStringArgsSchema.safeParse(args));

await runSolution({
  year: argsStr.year,
  day: argsStr.day,
  part: args.part,
  runtime: args.runtime,
  solutionType: args.input,
  reporter: async (data) => {
    switch (data.status) {
      case "failure": {
        console.error("❌ FAILURE");
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
      case "success":
        {
          const { result, expected, computationTime } = data;
          if (result === expected) {
            console.log(`✅ Output:   ${result}`);
          } else {
            console.log(`❌ Output: ${result}`);
          }
          console.log(`📋 Expected: ${expected}`);
          console.log(`🕐 Took:     ${Math.round(computationTime)}ms`);
        }
        break;
    }
  },
});
