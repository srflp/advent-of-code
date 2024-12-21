import { toLines } from "jsr:@std/streams/unstable-to-lines";

export const input = toLines(Deno.stdin.readable);

export async function output(result: string | number) {
  await Deno.stdout.write(new TextEncoder().encode(result.toString()));
}
