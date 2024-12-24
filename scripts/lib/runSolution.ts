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

const runtimeCommands: Record<
  Runtime,
  { command: string; args: (programPath: string) => string[] }
> = {
  "ts-deno": {
    command: "deno",
    args: (programPath) => [
      "eval",
      "--ext=ts",
      `
      import program from "./${programPath}";
      import { toLines } from "@std/streams/unstable-to-lines";
      const { stdin, stdout } = Deno;
      const input = toLines(stdin.readable);
      const result = await program(input);
      await stdout.write(new TextEncoder().encode(result.toString()));
      `,
    ],
  },
  "ts-node": {
    command: "tsx",
    args: (programPath) => [
      "--input-type=module",
      "-e",
      `
      import program from "./${programPath}";
      import { toLines } from "@std/streams/unstable-to-lines";
      import { ReadableStream } from "node:stream/web";
      import { stdin, stdout } from "node:process";
      const input = toLines(ReadableStream.from(stdin));
      const result = await program.default(input);
      await stdout.write(result.toString());
      `,
    ],
  },
  "ts-bun": {
    command: "bun",
    args: (programPath) => [
      "-e",
      `
      import program from "./${programPath}";
      import { toLines } from "@std/streams/unstable-to-lines";
      const input = toLines(Bun.stdin.stream());
      const result = await program(input);
      await Bun.write(Bun.stdout, result.toString());
      `,
    ],
  },
};

export async function runSolution(args: RunSolutionArgs) {
  const { runtime, year, day, part, solutionType, reporter } = args;

  const command = runtimeCommands[runtime];
  const output = await runCommand({
    command: new Deno.Command(command.command, {
      args: command.args(getProgramFile(year, day, part, runtime)),
      stdin: "piped",
      stdout: "piped",
    }),
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
