import { z } from "npm:zod";

const currentYear = new Date().getFullYear();
const currentDay = new Date().getDate();

export const yearSchema = z.coerce
  .number()
  .min(2015, "First Advent of Code was in 2015")
  .default(currentYear);
export type Year = z.infer<typeof yearSchema>;

export const daySchema = z.coerce.number().min(1).max(25).default(currentDay);
export type Day = z.infer<typeof daySchema>;

export const runtimeSchema = z.enum(["ts-deno"]);
export type Runtime = z.infer<typeof runtimeSchema>;

export const partSchema = z.enum(["1", "2"]);
export type Part = z.infer<typeof partSchema>;

export const solutionTypeSchema = z.enum(["actual", "example"]);
export type SolutionType = z.infer<typeof solutionTypeSchema>;

export const yearStringSchema = z.coerce
  .string()
  .transform((year) => year.padStart(4, "0"));
export type YearString = z.infer<typeof yearStringSchema>;

export const dayStringSchema = z.coerce
  .string()
  .transform((day) => day.padStart(2, "0"));
export type DayString = z.infer<typeof dayStringSchema>;

type IO = "input" | "output";

export function handleError<I, O>(argsOrError: z.SafeParseReturnType<I, O>): O {
  if (argsOrError.success) return argsOrError.data;
  console.error("Invalid arguments:");
  for (const issue of argsOrError.error.issues) {
    console.error(`${issue.path.join(".")}: ${issue.message}`);
  }
  Deno.exit(1);
}

export const inputStringArgsSchema = z.object({
  year: yearStringSchema,
  day: dayStringSchema,
});

export function getIODir(year: YearString, day: DayString) {
  return `io/${year}/${day}`;
}

export function getIOFile(
  io: IO,
  year: YearString,
  day: DayString,
  part: Part,
  solutionType: SolutionType
) {
  return `${getIODir(year, day)}/${solutionType}${
    io === "input" && solutionType === "actual" ? "" : `.part${part}`
  }.${io}`;
}

const extensionByRuntime: Record<Runtime, string> = {
  "ts-deno": "ts",
};

export function getProgramFile(
  year: YearString,
  day: DayString,
  part: Part,
  runtime: Runtime
) {
  return `solutions/${runtime}/${year}/${day}/part${part}.${extensionByRuntime[runtime]}`;
}
