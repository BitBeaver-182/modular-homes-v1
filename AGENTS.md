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
| 2026-06-02 | Upload Confirmation Flow | Confirming uploaded files before the related business mutation succeeds, or re-uploading/confirming a fresh file on every invalid form retry | Default to a deferred-confirmation upload flow: presign and upload first, keep the file pending, send the pending file id with the business mutation, and only confirm/claim the upload after the backend mutation succeeds. Reuse the same pending file across validation retries until the file changes or the upload expires. Do not change existing features like `quotes` to this flow until the user explicitly approves that follow-up. | v1.0 |
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
| 2026-06-02 | Payment Domain Modeling | Assuming supplier-order invoice payments are always directed to a supplier because the UI lives under supplier orders | Model payments against the actual invoice counterparty rules, not the page context. Supplier-order invoices may be payable to suppliers, customs, logistics providers, or other counterparties, so do not hard-wire payment ownership or API contracts to suppliers only. | v1.0 |
| 2026-06-01 | Frontend Form Patterns | Replacing established dashboard form structure with ad hoc modal/form implementations, unlabeled inputs, or invented interaction patterns in new features | Follow the existing dashboard form structure used in `quotes` and `suppliers`: keep dialogs thin, split dedicated field components/files, use labeled fields with the standard wrappers, and do not introduce a new pattern unless the user explicitly approves it. | v1.1 |
| 2026-06-01 | Validation Flow | Replacing server-side validation with client-side blocking logic, generic toasts, or incomplete field-error wiring | Submit forms to the API and surface returned field errors back into the form UI. Backend validation is the default unless the user says otherwise. Map backend field paths onto RHF fields, keep backend validation keys/translations specific, and verify that the actual modal fields render invalid state and per-field messages in the same style as `quote-form-fields.tsx`. | v1.3 |
| 2026-06-03 | Validation Flow | Migrating a form to platform APIs while leaving it wired to an error helper that only understands Strapi errors, causing backend field paths to collapse into `root` | When a form submits to platform/Moduflow endpoints, verify the thrown client error type and ensure the form helper maps `error.details[].path` into the exact RHF field. Legacy helpers may only remain if they explicitly handle Moduflow errors with field-level paths. | v1.4 |
| 2026-06-03 | Validation Retry Flow | Clearing server errors only inside RHF's valid-submit callback, causing corrected resubmits to be blocked before the API is called | Clear previous server errors before invoking `handleSubmit`, so server-returned field errors do not permanently block the next API submission after the user edits the form. | v1.0 |
| 2026-06-01 | Frontend Structure | Leaving large feature components as monolithic files that combine dialog state, form fields, mutation wiring, table/card rendering, and helpers in one place | Follow the structural pattern used in `quotes`: split dialogs, field groups, helpers, and card/list rendering into focused files so feature directories stay modular and reviewable. | v1.0 |
| 2026-06-02 | Frontend Preservation | Replacing an existing frontend component structure or visual pattern with a new UI direction during feature work without explicit approval | Preserve the existing component hierarchy and visual direction when extending frontend features. For flows like `supplier-orders-detail` invoices, wire new API/data behavior into the existing `invoice-card` structure instead of redesigning the card/layout unless the user explicitly asks for a UI overhaul. | v1.0 |
| 2026-06-02 | Joint Debugging | Continuing to patch blindly after repeated runtime reports from the user without first confirming the actual runtime behavior together | Stop implementation, inspect the exact runtime object with the user, confirm which layer rewrites the error, and only then change code. For frontend issues that require browser console/runtime evidence I cannot obtain myself, ask the user and investigate together before proceeding. Apply the same rule to backend issues when I cannot verify directly from terminal/runtime access. | v1.1 |

---

## 🧠 Memory Log & Evolution Track

- **Log Entry #1:** Established the self-correcting `AGENTS.md` workflow and the rule to consult it before every response.
- **Log Entry #2:** Added PR workflow rules: micro-commits, stateless blind review, clarification before assumptions, impact assessment, and a DoD checklist.
- **Log Entry #3:** Added upload/storage rules covering bucket ownership, expiry handling, cleanup, and filename validation.
- **Log Entry #4:** Added backend contract discipline for shared types, validated query DTOs, service boundaries, and explicit update semantics.
- **Log Entry #5:** Added debugging discipline: use provided API curls directly, avoid blind runtime assumptions, and confirm runtime behavior when needed.
- **Log Entry #6:** Added domain rules for derived state, derived persistence, and safe UI behavior around existing related records.
- **Log Entry #7:** Added rollout and planning rules: one PR slice at a time, align each new slice with `PLAN.md` and the user before implementation.
- **Log Entry #8:** Added frontend implementation rules: preserve existing form patterns, keep validation server-driven, render explicit field errors, and avoid monolithic feature components.
- **Log Entry #9:** Added joint-investigation rules for frontend and backend issues when direct runtime verification is not available to the agent.
- **Log Entry #10:** Added the deferred upload-confirmation rule: upload first, confirm only after the related backend mutation succeeds, and do not proactively retrofit existing features like `quotes` without explicit approval.
- **Log Entry #11:** Added the payment-domain rule: invoice payments must follow the actual invoice counterparty model and cannot be narrowed to supplier-only just because the workflow originates from supplier orders.
- **Log Entry #12:** Added the frontend-preservation rule: when extending an existing screen, keep the established component structure and visual design, and wire new behavior into that structure instead of silently replacing it with a new UI direction.
- **Log Entry #13:** Tightened validation rules after supplier and quote forms collapsed platform validation paths into root errors: migrated platform forms must prove field-level backend errors survive the client/helper layer.
- **Log Entry #14:** Added validation retry discipline: server errors must be cleared before RHF validation runs so corrected resubmits still call the API.
