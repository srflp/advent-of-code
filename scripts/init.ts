import { ensureDir, ensureFile, exists } from "jsr:@std/fs";
import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import {
  daySchema,
  getIODir,
  handleError,
  inputStringArgsSchema,
  Runtime,
  yearSchema,
} from "./shared.ts";
import z from "npm:zod";

/**
 * Fetch data for the given day and year.
 */

const inputArgsSchema = z.object({
  year: yearSchema,
  day: daySchema,
});

const args = handleError(
  inputArgsSchema.safeParse({
    day: Deno.args[0],
    year: Deno.args[1],
  })
);

const argsStr = handleError(inputStringArgsSchema.safeParse(args));
const inputDir = getIODir(argsStr);

const apiUrl = "https://adventofcode.com";
const userAgentHeader = {
  "User-Agent": "github.com/srflp/advent-of-code by sauer.filip@gmail.com",
};

await createDayFolder();
await fetchAndSaveActualInput();
await createBoilerplate();
await fetchDescription();

async function createDayFolder() {
  if (await exists(inputDir)) {
    logExistence();
  } else {
    await ensureDir(inputDir);
    logCreation();
  }
}

async function createBoilerplate() {
  const files = [
    "example.part1.input",
    "example.part1.output",
    "example.part2.input",
    "example.part2.output",
  ];
  const created = await Promise.all(files.map(checkExistanceOrCreate));
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
async function checkExistanceOrCreate(fileName: string) {
  const path = `${inputDir}/${fileName}`;
  if (await exists(path)) {
    return false;
  } else {
    await ensureFile(path);
    return true;
  }
}

async function fetchAndSaveActualInput() {
  const fileName = `actual.input`;
  const inputPath = getFilePath(fileName);

  if (await exists(inputPath)) {
    logExistence(fileName);
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

function getFilePath(fileName: string) {
  return `${inputDir}/${fileName}`;
}

function logExistence(fileName: string = "") {
  console.log(`E ${getFilePath(fileName)}`);
}

function logCreation(fileName: string = "") {
  console.log(`C ${getFilePath(fileName)}`);
}

async function fetchDescription() {
  let partsExisting = 0;
  if (await exists(getFilePath("description.part1.md"))) {
    logExistence("description.part1.md");
    partsExisting++;
  }
  if (await exists(getFilePath("description.part2.md"))) {
    logExistence("description.part2.md");
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
  const descriptionPath = getFilePath(fileName);
  if (description.textContent) {
    await Deno.writeTextFile(descriptionPath, description.textContent);
    logCreation(fileName);
  } else {
    console.error("ERROR: No description found");
  }
}

// TODO: use it
const _solutionTemplate: Record<Runtime, string> = {
  "ts-deno": `import { input, output } from "../../utils.ts";

for await (const line of input) {
  // parse input here
}

await output();`,
};
