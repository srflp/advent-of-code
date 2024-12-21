import z from "npm:zod";
import {
  daySchema,
  solutionTypeSchema,
  partSchema,
  runtimeSchema,
  yearSchema,
  handleError,
  inputStringArgsSchema,
  getIOFile,
  getProgramFile,
} from "./lib/shared.ts";
import { exists } from "jsr:@std/fs";

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

if (args.runtime === "ts-deno") {
  const tsDenoCommand = new Deno.Command("deno", {
    args: [
      "run",
      getProgramFile(argsStr.year, argsStr.day, args.part, args.runtime),
    ],
    stdin: "piped",
    stdout: "piped",
  });
  const output = await runCommand(tsDenoCommand);
  if (!output) {
    console.error("❌ FAILURE");
    Deno.exit(1);
  }

  const outputFile = getIOFile(
    "output",
    argsStr.year,
    argsStr.day,
    args.part,
    args.input
  );
  // const outputExists = await Deno.ensu(outputFile);
  const outputExists = await exists(outputFile);
  if (!outputExists) {
    console.log(`🆕 Output:   ${output.result}`);
    const answer = prompt(
      `❌ Output file does not exist. Do you want to create it with the current output? (y/n):`
    );
    if (answer?.toLowerCase() === "y") {
      await Deno.writeTextFile(outputFile, output.result);
      console.log(`✅ Created ${outputFile}`);
    }
    Deno.exit(0);
  }

  const expected = await Deno.readTextFile(outputFile);
  if (output.result === expected) {
    console.log(`✅ Output:   ${output.result}`);
  } else {
    console.log(`❌ Output: ${output.result}`);
  }
  console.log(`📋 Expected: ${expected}`);
  console.log(`🕐 Took:     ${Math.round(output.computationTime)}ms`);
}

async function runCommand(command: Deno.Command) {
  const process = command.spawn();
  const inputFile = await Deno.open(
    getIOFile("input", argsStr.year, argsStr.day, args.part, args.input)
  );
  performance.mark("start");
  await inputFile.readable.pipeTo(process.stdin);
  const output = await process.output();
  performance.mark("end");
  const computationTime = performance.measure(
    "computationTime",
    "start",
    "end"
  );
  if (output.success) {
    return {
      result: new TextDecoder().decode(output.stdout),
      computationTime: computationTime.duration,
    };
  }
  return null;
}
