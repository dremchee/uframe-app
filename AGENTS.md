# Project guidance

## Git conventions

- **Do not add a `Co-Authored-By` trailer** (or any Codex/Anthropic
  attribution) to commit messages or PR descriptions. Commit as the user only.

## Tests

- Unit tests live in a `__tests__/` folder next to the entity they cover:
  `foo.ts` is tested by `__tests__/foo.test.ts` in the same directory.
- Do not place `*.test.ts` files directly alongside the source file.
