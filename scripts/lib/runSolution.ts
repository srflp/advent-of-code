import { exists } from "jsr:@std/fs";
import {
  DayString,
  getIOFile,
  getProgramFile,
  Part,
  Runtime,
  SolutionType,
  YearString,
} from "./shared.ts";

interface RunSolutionArgs {
  runtime: Runtime;
  year: YearString;
  day: DayString;
  part: Part;
  solutionType: SolutionType;
  reporter: (
    args:
      | {
          status: "success";
          result: string;
          expected: string;
          computationTime: number;
        }
      | {
          status: "success-no-expected";
          result: string;
          computationTime: number;
          outputFilePath: string;
        }
      | { status: "failure" }
  ) => Promise<void>;
}

export async function runSolution(args: RunSolutionArgs) {
  const { runtime, year, day, part, solutionType, reporter } = args;

  if (runtime === "ts-deno") {
    const tsDenoCommand = new Deno.Command("deno", {
      args: [
        "eval",
        "--ext=ts",
        `import program from "./${getProgramFile(year, day, part, runtime)}";
         import { toLines } from "jsr:@std/streams/unstable-to-lines";

         const input = toLines(Deno.stdin.readable);

         async function output(result: string | number) {
           await Deno.stdout.write(new TextEncoder().encode(result.toString()));
         }

         await output(await program(input));`,
      ],
      stdin: "piped",
      stdout: "piped",
    });
    const output = await runCommand({
      command: tsDenoCommand,
      year,
      day,
      part,
      solutionType,
    });
    if (!output) {
      reporter({ status: "failure" });
      return;
    }

    const outputFile = getIOFile("output", year, day, part, solutionType);
    const outputExists = await exists(outputFile);
    if (!outputExists) {
      await reporter({
        status: "success-no-expected",
        result: output.result,
        computationTime: output.computationTime,
        outputFilePath: outputFile,
      });
      return;
    }

    const expected = await Deno.readTextFile(outputFile);
    await reporter({
      status: "success",
      result: output.result,
      expected,
      computationTime: output.computationTime,
    });
  }
}

interface RunCommandArgs {
  command: Deno.Command;
  year: YearString;
  day: DayString;
  part: Part;
  solutionType: SolutionType;
}

export async function runCommand(args: RunCommandArgs) {
  const { command, year, day, part, solutionType } = args;

  const process = command.spawn();
  const inputFile = await Deno.open(
    getIOFile("input", year, day, part, solutionType)
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
