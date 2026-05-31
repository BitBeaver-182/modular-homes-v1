# Dynamic Learning & Rule Protocol

This project utilizes a continuous learning loop. The agent must read this file at the start of **every** session/prompt and update it whenever the user provides corrections, feedback, or style preferences.

---

## 🤖 Core Agent Instructions

1. **Read Before Executing:** Before generating any code or architectural decisions, review the rules and workflows below.
2. **The Feedback Loop:** Every time the user corrects you, dislikes an approach, or changes a preference, you must immediately update this file using the [Update Protocol](https://www.google.com/search?q=%23update-protocol).
3. **No Repeat Mistakes:** A mistake made twice is a failure of the agent's memory system. If a rule already exists and you broke it, you must investigate _why_ you broke it and refine the rule to be more explicit.

---

## 🛠 Update Protocol

When the user says _"Don't do X, do Y"_ or _"Fix how you did Z"_, follow these steps immediately before proceeding with the task:

- **If it's a NEW correction:** Add a new row to the rules table. State the context, the forbidden behavior, and the correct approach.
- **If it's an OLD rule you broke:** Append a `[REVISION - Date]` note to the existing rule. Make the instruction stricter and more explicit so you do not miss it again.
- **Rewrite AGENTS.md:** Regenerate or overwrite this file with the updated table so the memory persists into the next prompt.

---

## 🔄 Workflow Directives (Git & PR Lifecycle)

These are strict operational workflows that the agent must execute during development.

### 1. The "Commit Often" Micro-Stepping Directive

- **Rule:** Do not write a massive feature and commit it all at once.
- **Action:** Break the task into logical sub-tasks. Write the code for a sub-task, verify it, and make a micro-commit. A single PR should consist of multiple clear, atomic commits tracking the evolution of the feature.

### 2. The "Stateless Agent" Blind Review Loop

Once a PR is ready, the current agent must spin up/hand over to a **completely stateless agent (No Memory)** to review the work.

- **The Blind Reviewer's Mandate:** This agent has _zero_ context of the conversation that led to the code. It must judge the PR purely on code quality, readability, and project architecture.
- **The Ping-Pong Loop:** The Blind Reviewer will generate a list of critiques. The main agent must address _every single critique_, commit the fixes, and hand it back to the Blind Reviewer. This loop repeats until the Blind Reviewer passes the PR with zero comments.

### 3. The "No Assumptions" Clarification Gate

- **Rule:** If a user requirement is ambiguous, has missing edge cases, or conflicts with an existing rule, **do not guess.**
- **Action:** Stop execution immediately. Present the ambiguity to the user with 2–3 explicit options or questions, and wait for clarification before writing any code.

### 4. Added Idea: The "Breaking Change" Impact Assessment

- **Rule:** Before modifying any existing utility function, database schema, or shared API endpoint, search the codebase for all files that import/depend on it.
- **Action:** Provide a brief "Impact Report" to the user showing what will break and how you plan to update those dependencies _before_ executing the change.

### 5. Added Idea: The "Definition of Done" (DoD) Checklist

- **Rule:** A task is not complete just because the code runs.
- **Action:** Before declaring a PR ready for the Blind Reviewer, the agent must check off these items:
- [ ] No temporary `console.log` or `TODO` comments left behind.
- [ ] Code complies with all rules in the [Project Rules & Constraints](https://www.google.com/search?q=%23project-rules--constraints) table.
- [ ] All impacted files have been updated without breaking existing functionality.

---

## 📋 Project Rules & Constraints

_This table tracks specific coding style, logic, and architectural mistakes corrected by the user._

| Date       | Category/Context | What to Avoid (Trigger)               | What to Do Instead (Correction)              | Version/Status |
| ---------- | ---------------- | ------------------------------------- | -------------------------------------------- | -------------- |
| 2026-05-30 | System           | Making the same mistake twice         | Check this table before every single output. | v1.0 (Initial) |
| 2026-05-30 | Git Workflow     | Submitting giant single-commit PRs    | Micro-commit often throughout development.   | v1.0 (Initial) |
| 2026-05-30 | Logic            | Assuming user intent on vague prompts | Halt and ask for explicit clarification.     | v1.0 (Initial) |
| 2026-05-30 | Upload Storage   | Letting callers branch on public/private buckets or hardcoding bucket names outside storage service | Callers pass file context; `StorageService` owns bucket resolution and public/private URL behavior. | v1.0 |
| 2026-05-30 | Upload Expiry    | Treating Supabase signed upload URL lifetime as the product contract | Use an app-level 300 second upload window stored in `expiresAt`; cleanup expired pending uploads by `expiresAt`. | v1.0 |
| 2026-05-30 | Upload Cleanup   | Marking expired uploads `ORPHANED` without deleting the storage object or making it sweepable | Delete the storage object immediately when confirm expires a pending upload, or explicitly keep cleanup responsible for that status. | v1.0 |
| 2026-05-30 | Filename Validation | Guessing vague filename sanitization rules or letting filenames affect storage paths | Require filenames to match `/^[\w\-. ]+$/`, max 255 chars; use `{organizationId}/{context}/{fileId}` as the bucket key and store filename only as metadata. | v1.0 |
| 2026-05-31 | Frontend Types | Re-exporting shared API contract types from local feature `types.ts` files as aliases | Import shared contract types directly from `@moduflow/types` whenever possible; keep local `types.ts` files only for frontend-specific shapes and UI-only constants. | v1.0 |
| 2026-05-31 | Frontend Filters | Hand-writing query-string builders without locking them to the actual available route filters | Keep list query serialization narrowly aligned to the validated route search schema, sanitize optional filter values, and cover the mapping with tests so filter drift fails early. | v1.0 |

---

## 🧠 Memory Log & Evolution Track

- **Log Entry #1 (System Genesis):** Established `AGENTS.md` with basic self-correcting memory loop.
- **Log Entry #2 (Multi-Agent PR Workflow):** Implemented the "Stateless Blind Reviewer" protocol and the "No Assumptions" gate to ensure code quality and communication clarity.
- **Log Entry #3 (Upload Storage Rules):** Added upload-specific storage ownership, expiry, cleanup, and filename validation rules.
- **Log Entry #4 (Frontend Type + Filter Discipline):** Added rules to avoid local aliases for shared contracts and to test query serialization against the real route filter surface.
