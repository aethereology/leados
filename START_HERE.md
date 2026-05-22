# Start Here

This folder is a ready-to-drop-in Claude Code project kit for LeadOS.

## Step 1: Create Project Folder

Create a folder named `leados`.

## Step 2: Add These Files

Place these files in the project root:

- `CLAUDE.md`
- `MEMORY.md`
- `README.md`
- `PRODUCT_SPEC.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `TASKS.md`
- `TEST_PLAN.md`
- `UI_DIRECTION.md`
- `SEED_DATA.md`
- `PROMPTS.md`
- `.env.example`

## Step 3: Open Claude Code

From the project root:

```bash
claude
```

## Step 4: Paste This Prompt

```text
Read CLAUDE.md and MEMORY.md first.

Then inspect the repository and summarize:
1. What exists
2. What is missing
3. What you will build first

After that, implement Phase 1 foundation from TASKS.md.

Do not ask broad questions. Make reasonable assumptions. Build the smallest production-quality version that satisfies the acceptance criteria.
```

## Step 5: Keep MEMORY.md Updated

At the end of every Claude Code session, require Claude to update `MEMORY.md`.

This prevents future sessions from starting over or making contradictory architecture decisions.

## Current Resume Path

This repository has already moved past the first build kit stage. New sessions should read `MEMORY.md`, `TASKS.md`, and `TEST_PLAN.md` before making changes.

The current validation loop is:

Public form submission with explicit opt-in -> contact -> form submission -> opportunity -> pipeline -> workflow run -> consent-gated SMS/email follow-up -> conversation history -> inbox -> audit event -> dashboard stats.

After Phase 2 validation is complete, the next build target is Phase 3 Automations Hardening from `ROADMAP.md`.
