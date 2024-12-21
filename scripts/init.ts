import { ensureFile, exists } from "jsr:@std/fs";
import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import {
  daySchema,
  getIODir,
  handleError,
  inputStringArgsSchema,
  runtimeSchema,
  partSchema,
  yearSchema,
  getProgramFile,
  Part,
} from "./lib/shared.ts";
import z from "npm:zod";
import { solutionTemplates } from "./lib/solutionTemplates.ts";

/**
 * Fetch data for the given day and year.
 */

const inputArgsSchema = z.object({
  year: yearSchema,
  day: daySchema,
  runtime: runtimeSchema.optional(),
  part: partSchema.optional(),
});

const args = handleError(
  inputArgsSchema.safeParse({
    day: Deno.args[0],
    year: Deno.args[1],
    runtime: Deno.args[2],
    part: Deno.args[3],
  })
);

const argsStr = handleError(inputStringArgsSchema.safeParse(args));
const inputDir = getIODir(argsStr.year, argsStr.day);

const apiUrl = "https://adventofcode.com";
const userAgentHeader = {
  "User-Agent": "github.com/srflp/advent-of-code by sauer.filip@gmail.com",
};

await fetchAndSaveActualInput();
await createBoilerplate();
await fetchDescription();
await createSolutions();

async function createBoilerplate() {
  const files = [
    "example.part1.input",
    "example.part1.output",
    "example.part2.input",
    "example.part2.output",
  ].map((fileName) => getInputFilePath(fileName));
  const created = await Promise.all(files.map(checkExistenceOrCreate));
  created.map((created, index) => {
    if (created) {
      logCreation(files[index]);
    } else {
      logExistence(files[index]);
    }
  });
}

/**
 * Returns true if the file was created.
 */
async function checkExistenceOrCreate(path: string) {
  if (await exists(path)) {
    return false;
  } else {
    await ensureFile(path);
    return true;
  }
}

async function fetchAndSaveActualInput() {
  const fileName = `actual.input`;
  const inputPath = getInputFilePath(fileName);

  if (await exists(inputPath)) {
    logExistence(inputPath);
    return;
  }

  const response = await aocFetch(`${args.year}/day/${args.day}/input`);

  if (response.status !== 200) {
    throw new Error(
      `Description fetch failed: status ${String(response.status)}`
    );
  }

  const inputFile = await Deno.open(inputPath, {
    create: true,
    write: true,
  });

  await response.body?.pipeTo(inputFile.writable);

  logCreation(fileName);
}

function aocFetch(path: string) {
  const sessionKey = Deno.env.get("AOC_SESSION_KEY");

  if (!sessionKey) {
    throw new Error("AOC_SESSION_KEY environment variable is not set");
  }

  return fetch(`${apiUrl}/${path}`, {
    headers: {
      cookie: `session=${sessionKey}`,
      ...userAgentHeader,
    },
  });
}

function getInputFilePath(fileName: string) {
  return `${inputDir}/${fileName}`;
}

function logExistence(filePath: string = "") {
  console.log(`E ${filePath}`);
  openInCursor(filePath);
}

function logCreation(filePath: string = "") {
  console.log(`C ${filePath}`);
  openInCursor(filePath);
}

function openInCursor(filePath: string) {
  const command = new Deno.Command("cursor", {
    args: [filePath],
  });
  command.spawn();
}

async function fetchDescription() {
  let partsExisting = 0;

  const descriptionPart1Path = getInputFilePath("description.part1.md");
  if (await exists(descriptionPart1Path)) {
    logExistence(descriptionPart1Path);
    partsExisting++;
  }

  const descriptionPart2Path = getInputFilePath("description.part2.md");
  if (await exists(descriptionPart2Path)) {
    logExistence(descriptionPart2Path);
    partsExisting++;
  }

  if (partsExisting === 2) {
    return;
  }

  const response = await aocFetch(`${args.year}/day/${args.day}`);

  if (response.status !== 200) {
    throw new Error(String(response.status));
  }

  const html = await response.text();

  const parser = new DOMParser();

  const document = parser.parseFromString(html, "text/html");
  const description = document.querySelectorAll("article.day-desc");
  if (description.length === 0) {
    console.log("ERROR: No descriptions found");
    return;
  } else if (description.length === 1 && partsExisting !== 1) {
    await saveDescription("description.part1.md", description[0]);
  } else if (description.length === 2 && partsExisting !== 2) {
    await saveDescription("description.part1.md", description[0]);
    await saveDescription("description.part2.md", description[1]);
  } else if (description.length > 2) {
    console.error("ERROR: Found 2+ descriptions...");
  }
}

async function saveDescription(fileName: string, description: Element) {
  const descriptionPath = getInputFilePath(fileName);
  if (description.textContent) {
    await Deno.writeTextFile(descriptionPath, description.textContent);
    logCreation(fileName);
  } else {
    console.error("ERROR: No description found");
  }
}

async function createSolutions() {
  if (!args.runtime) {
    return;
  }

  if (!args.part) {
    await createSolution("1");
    await createSolution("2");
  } else {
    await createSolution(args.part);
  }
}

async function createSolution(part: Part) {
  if (!args.runtime) {
    return;
  }

  const solutionPath = getProgramFile(
    argsStr.year,
    argsStr.day,
    part,
    args.runtime
  );
  if (await exists(solutionPath)) {
    logExistence(solutionPath);
    return;
  }

  await ensureFile(solutionPath);
  await Deno.writeTextFile(solutionPath, solutionTemplates[args.runtime]);
  logCreation(solutionPath);
}
