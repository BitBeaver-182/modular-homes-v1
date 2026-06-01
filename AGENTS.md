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
| 2026-05-30 | Logic            | Assuming user intent on vague prompts | Halt and ask for explicit clarification. [REVISION - 2026-05-31: when a user reports a runtime failure, do not infer likely causes from code paths alone; reproduce the failing request or capture the actual runtime error/log before concluding.] | v1.1 |
| 2026-05-30 | Upload Storage   | Letting callers branch on public/private buckets or hardcoding bucket names outside storage service | Callers pass file context; `StorageService` owns bucket resolution and public/private URL behavior. | v1.0 |
| 2026-05-30 | Upload Expiry    | Treating Supabase signed upload URL lifetime as the product contract | Use an app-level 300 second upload window stored in `expiresAt`; cleanup expired pending uploads by `expiresAt`. | v1.0 |
| 2026-05-30 | Upload Cleanup   | Marking expired uploads `ORPHANED` without deleting the storage object or making it sweepable | Delete the storage object immediately when confirm expires a pending upload, or explicitly keep cleanup responsible for that status. | v1.0 |
| 2026-05-30 | Filename Validation | Guessing vague filename sanitization rules or letting filenames affect storage paths | Require filenames to match `/^[\w\-. ]+$/`, max 255 chars; use `{organizationId}/{context}/{fileId}` as the bucket key and store filename only as metadata. | v1.0 |
| 2026-05-31 | Frontend Types | Re-exporting shared API contract types from local feature `types.ts` files as aliases | Import shared contract types directly from `@moduflow/types` whenever possible; keep local `types.ts` files only for frontend-specific shapes and UI-only constants. | v1.0 |
| 2026-05-31 | Frontend Filters | Hand-writing query-string builders without locking them to the actual available route filters | Keep list query serialization narrowly aligned to the validated route search schema, sanitize optional filter values, and cover the mapping with tests so filter drift fails early. | v1.0 |
| 2026-05-31 | Nest Query DTOs | Using Strapi-style bracket query keys like `sort[field]` as DTO property names | Use explicit validated DTO fields or proper nested DTOs for API query params; keep sortable fields whitelisted in the DTO/service layer. | v1.0 |
| 2026-05-31 | Service Boundaries | Exposing service dependencies to controllers through getters like `getStorageService()` | The service should own mapping and dependency usage internally; controllers should call service methods, not reach through to internal collaborators. | v1.0 |
| 2026-05-31 | Update Semantics | Letting optional array updates silently delete existing records when the caller passes an empty array | Define array-update behavior explicitly; `undefined` means untouched, and empty arrays must not clear data unless the contract explicitly supports clearing. | v1.0 |
| 2026-05-31 | API Debugging | Starting unrelated frontend processes or asking for more reproduction when the user has already provided an API curl | Run the provided API curl against the running backend, capture the actual HTTP response and server/runtime stack, and avoid touching unrelated services unless needed. | v1.0 |
| 2026-05-31 | Derived State | Reintroducing removed lifecycle values like supplier quote `expired` as persisted or response `status` values | Keep persisted/contract status enums limited to real writable states; expose derived lifecycle state through explicit booleans like `isExpired`. | v1.0 |
| 2026-06-01 | Frontend Conflict UX | Showing create actions that are expected to fail because a related record already exists | Hide the create action when the related supplier order already exists and show a direct link to the existing order in the list/table instead. | v1.0 |
| 2026-06-01 | PR Sequencing | Planning or implementing multiple PR slices in one pass for a large feature rollout | Complete exactly one PR slice at a time, stop for user review, and only then plan or implement the next PR. | v1.0 |
| 2026-06-01 | Planning Workflow | Starting implementation for a new PR slice before aligning with `PLAN.md` and the user | For each new PR slice in a staged rollout, pause first, align the implementation plan with `PLAN.md`, confirm that plan with the user, and only then write code. | v1.0 |
| 2026-06-01 | Persistence Design | Accepting user-entered values for fields that can be derived reliably from other stored fields | Prefer deriving values instead of storing redundant client-supplied values; for invoices in this codebase, compute `totalAmount` from `subtotalAmount` and `taxAmount` server-side. | v1.0 |
| 2026-06-01 | Frontend Form Patterns | Inventing new form layouts, unlabeled inputs, or ad hoc interaction patterns when the app already has an established form implementation | Follow the existing dashboard form pattern used in features like `suppliers`: labeled fields, consistent field wrappers, and the same interaction structure unless the user explicitly asks for a new pattern. | v1.0 |
| 2026-06-01 | Validation Flow | Replacing server-side validation with custom client-side blocking logic and generic toast errors by default | Submit forms to the API and surface returned field errors back into the form UI; field-level invalid states and messages must visibly match the established form pattern, and backend validation keys/translations must be specific rather than falling back to `validation.unknown`, unless the user explicitly asks for a different validation approach. [REVISION - 2026-06-01: do not stop after wiring a generic error mapper; verify that the actual modal fields render invalid state and translated messages for the returned backend keys.] | v1.1 |

---

## 🧠 Memory Log & Evolution Track

- **Log Entry #1 (System Genesis):** Established `AGENTS.md` with basic self-correcting memory loop.
- **Log Entry #2 (Multi-Agent PR Workflow):** Implemented the "Stateless Blind Reviewer" protocol and the "No Assumptions" gate to ensure code quality and communication clarity.
- **Log Entry #3 (Upload Storage Rules):** Added upload-specific storage ownership, expiry, cleanup, and filename validation rules.
- **Log Entry #4 (Frontend Type + Filter Discipline):** Added rules to avoid local aliases for shared contracts and to test query serialization against the real route filter surface.
- **Log Entry #5 (DTO + Service Semantics):** Added rules for clean Nest query DTOs, service/controller boundaries, and explicit semantics for optional array updates.
- **Log Entry #6 (API Debugging Discipline):** Added a rule to use provided API curls directly and avoid unrelated frontend work during backend incident debugging.
- **Log Entry #7 (Derived State Discipline):** Added a rule to keep derived lifecycle state out of persisted/response status enums.
- **Log Entry #8 (Frontend Conflict UX):** Added a rule to remove create actions that are known to fail and replace them with links to the existing related record.
- **Log Entry #9 (PR Sequencing Discipline):** Added a rule to deliver large feature rollouts one PR at a time and stop for user review between PRs.
- **Log Entry #10 (Plan Alignment Discipline):** Added a rule to align each new staged PR with `PLAN.md` and the user before implementation starts.
- **Log Entry #11 (Derived Persistence Discipline):** Added a rule to derive calculable fields server-side instead of storing redundant client-entered values.
- **Log Entry #12 (Frontend Form Discipline):** Added a rule to preserve existing dashboard form patterns instead of inventing new unlabeled form UI.
- **Log Entry #13 (Server Validation Discipline):** Added a rule to keep validation server-driven by default and map API field errors back into forms.
