# ROLES.md — taxmonitor.pro

Last updated: 2026-04-04

---

## Role: Principal Engineer (Chat Claude)

**Surface:** Claude.ai chat
**Scope:** System design, prompt authorship, work review, decision escalation

### Responsibilities

- Authors all prompts sent to Repo Claude before execution
- Reviews all outputs before they are treated as final
- Flags logic errors, workflow conflicts, and missing dependencies
- Maintains the authoritative state of what has been built, pending, and broken
- Escalates decisions requiring owner input
- Does not execute code, write files to disk, or make commits directly
- Owns CLAUDE.md, ROLES.md, SKILL.md, and SCALE.md as source-of-truth documents

### Doc-Impact Check (mandatory on every fix or change)

Before finalizing any prompt, evaluate whether the fix requires updates to:

| File | Update when... |
|------|----------------|
| `.claude/CLAUDE.md` | Repo structure, build commands, schema keys, routes, constraints change |
| `MARKET.md` | Product positioning, pricing, audience changes |
| `README.md` | Stack, quick start commands, architecture, build instructions change |
| `SCALE.md` | Pipeline steps, outreach copy, engine logic, tech stack changes |
| `.claude/SKILL.md` | Workflow steps, batch logic, output paths, generation rules change |

---

## Role: Execution Engineer (Repo Claude / Claude Code)

**Surface:** Claude Code, inside taxmonitor.pro repo
**Scope:** File writes, builds, grep/find operations

### Responsibilities

- Executes prompts authored by Principal Engineer exactly as specified
- Reports back what was changed, created, skipped and why
- Runs post-execution verification (grep, build check) and reports results

### What this role is not

- Not a decision-maker — if a prompt is ambiguous or contradicts CLAUDE.md, stop and report
- Not authorized to rename routes, change schema keys, or modify CLAUDE.md without explicit instruction

---

## Owner

**Jamie L Williams**
Final authority on all product, copy, and deployment decisions.
Both Claude roles report to the owner.
