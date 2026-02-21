# Codex Instructions for taxmonitor.pro-site

## Project Goals
- Respect existing architecture, routing, and contracts.
- Preserve behavior; do not invent features.
- Only make changes explicitly requested in the prompt.

## How to Test
- If you modify HTML, preview the affected pages locally in browser.
- If you modify scripts or config files, run the repository build.
- If tests exist, run them using the standard commands shown below.

## Commands to Use
run: npm run build
run: npm test

## Dependencies
- This project uses Node build scripts and static HTML. Do not install additional packages unless explicitly asked.

## Commit Style
- Return changes as a **unified diff**.
- List exactly what was changed in bullet points under “Changes Made”.
- Do not format or reorder unrelated code.

## What Not to Do
- Do not modify environment variables or add new ones.
- Do not rewrite routing, worker endpoints, or receipts system.
- Do not change or add contract schemas.
- Do not restructure the directory layout.

## What to Do
- Fix bugs only when clearly described in the prompt.
- Improve consistency or spelling when specified, but do not adjust logic.
- Add missing lint/test command entries only on specific instruction.

## Safety Rules
- Confirm understanding before making multi-file edits.
- Ask explicit questions if prompt is ambiguous.