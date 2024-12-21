import { z } from "npm:zod";

const currentYear = new Date().getFullYear();
const currentDay = new Date().getDate();

export const yearSchema = z.coerce
  .number()
  .min(2015, "First Advent of Code was in 2015")
  .default(currentYear);
export const daySchema = z.coerce.number().min(1).max(25).default(currentDay);
export const runtimeSchema = z.enum(["ts-deno"]);
export type Runtime = z.infer<typeof runtimeSchema>;
export const partSchema = z.enum(["1", "2"]);
export const solutionTypeSchema = z.enum(["actual", "example"]);

export const yearStringSchema = z.coerce
  .string()
  .transform((year) => year.padStart(4, "0"));
export const dayStringSchema = z.coerce
  .string()
  .transform((day) => day.padStart(2, "0"));

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

export function getIODir(args: z.infer<typeof inputStringArgsSchema>) {
  return `io/${args.year}/${args.day}`;
}

export function getIOFile(
  io: "input" | "output",
  args: z.infer<typeof inputStringArgsSchema>,
  part: z.infer<typeof partSchema>,
  solutionType: z.infer<typeof solutionTypeSchema>
) {
  return `${getIODir(args)}/${solutionType}${
    io === "input" && solutionType === "actual" ? "" : `.part${part}`
  }.${io}`;
}

const extensionByRuntime: Record<Runtime, string> = {
  "ts-deno": "ts",
};

export function getProgramFile(
  args: z.infer<typeof inputStringArgsSchema>,
  part: z.infer<typeof partSchema>,
  runtime: z.infer<typeof runtimeSchema>
) {
  return `solutions/${runtime}/${args.year}/${args.day}/part${part}.${extensionByRuntime[runtime]}`;
}
