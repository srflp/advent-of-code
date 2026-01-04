# Advent of Code multi-language multi-year repo

- `deno task init` downloads data for the current day and year
- `deno task init <day (1-25)>` downloads data for the given day and current year
- `deno task init <day (1-25)> <year (2015+)>` downloads data for the given day and year
- `deno task init <day (1-25)> <year (2015+)> <runtime (ts-deno)>` initializes a new solution folder with the given runtime and both parts
- `deno task init <day (1-25)> <year (2015+)> <runtime (ts-deno)> <part (1|2)>` initializes a new solution folder with the given runtime and part

- `deno task check <day (1-25)> <year (2015+)> <runtime (ts-deno)> <part (1|2)> <input (actual|example)>` checks the current solution against the expected output

# Assumptions

- all input / output files and descriptions are stored under `io/` and are encrypted with `git-crypt` to comply with the [rules](https://adventofcode.com/about)
- TypeScript solution is a .ts file with a default exported module
- in other languages a solution file receives input via stdin and outputs to stdout
