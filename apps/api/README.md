# API

## Setup

Install dependencies:

```bash
pnpm install
```

Generate Prisma client:

```bash
pnpm prisma:generate
```

Apply local migrations when needed:

```bash
pnpm prisma:deploy
```

## Local development

Required local env:

```env
JWT_SECRET=secret
```

Start the API in local mode:

```bash
pnpm start:local
```

Swagger:

- UI: `http://localhost:3000/api/docs`
- JSON: `http://localhost:3000/api/docs-json`

Generate the OpenAPI file without starting the server:

```bash
pnpm openapi:generate
```

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

Test database helpers:

```bash
pnpm test:db:start
pnpm test:db:stop
```

## Domain model

- `User` is a global identity.
- `Organization` owns workspace data.
- `OrganizationUser` is the membership join table.
- Governance lives on membership, not on RBAC roles.

Current membership fields:

- `governanceRole`: `owner | member`
- `status`: `invited | active | removed`

Rules:

- The first active membership in an organization becomes `owner`.
- An organization must always have at least one active owner.
- Removing a user from one organization only affects that membership.
- If a user loses their last active membership anywhere, the global `User` is soft deleted.
- Ownership is managed through dedicated membership governance routes, not through normal role assignment.
- Invited memberships do not appear in active org-scoped user reads until activated.

## Auth flow

The API currently uses JWT bearer auth for membership governance routes.

1. Create an active user in an organization.
2. Issue a token for that user by email.
3. Send `Authorization: Bearer <token>` on owner-only governance endpoints.

Issue a token:

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H 'content-type: application/json' \
  -d '{"email":"owner@example.com"}'
```

Inspect the current actor:

```bash
curl http://localhost:3000/api/auth/me \
  -H 'authorization: Bearer <token>'
```

## Organization and membership flow

### 1. Create an organization

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H 'content-type: application/json' \
  -d '{"name":"Acme","slug":"acme"}'
```

### 2. Create the first active user in that organization

This user becomes the first owner automatically.

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'content-type: application/json' \
  -H 'x-organization-id: 1' \
  -d '{"email":"owner@example.com","name":"Owner"}'
```

### 3. Issue a token for the owner

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H 'content-type: application/json' \
  -d '{"email":"owner@example.com"}'
```

### 4. Create more active members

These default to `member`.

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'content-type: application/json' \
  -H 'x-organization-id: 1' \
  -d '{"email":"member@example.com","name":"Member"}'
```

### 5. Invite a member without activating them yet

Owner token required.

```bash
curl -X POST http://localhost:3000/api/organization-memberships/invitations \
  -H 'content-type: application/json' \
  -H 'x-organization-id: 1' \
  -H 'authorization: Bearer <owner-token>' \
  -d '{"email":"invited@example.com"}'
```

Result:

- membership is created with `status=invited`
- membership is not returned by `GET /api/users`

### 6. Activate an invited membership

Owner token required.

```bash
curl -X POST http://localhost:3000/api/organization-memberships/3/activations \
  -H 'x-organization-id: 1' \
  -H 'authorization: Bearer <owner-token>'
```

After activation:

- membership becomes `active`
- it now appears in org-scoped user reads
- it remains `member` unless it is the first active membership in the org

### 7. Grant another member ownership

Owner token required.

```bash
curl -X POST http://localhost:3000/api/organization-memberships/2/owners \
  -H 'x-organization-id: 1' \
  -H 'authorization: Bearer <owner-token>'
```

This is additive. The organization can have multiple active owners.

### 8. Transfer sole ownership

Owner token required.

This flow promotes the target first and demotes the source second.

```bash
curl -X POST http://localhost:3000/api/organization-memberships/2/ownership-transfers \
  -H 'content-type: application/json' \
  -H 'x-organization-id: 1' \
  -H 'authorization: Bearer <owner-token>' \
  -d '{"fromUserId":"1"}'
```

### 9. Remove a user from the organization

```bash
curl -X DELETE http://localhost:3000/api/users/2 \
  -H 'x-organization-id: 1'
```

Behavior:

- if the user still has another active membership elsewhere, only this membership is removed
- if this was the user’s last active membership, the user is soft deleted globally
- if this user is the last active owner in the organization, the request is rejected

## Route summary

Global routes:

- `POST /api/organizations`
- `GET /api/organizations`
- `GET /api/organizations/:id`
- `POST /api/auth/token`
- `GET /api/auth/me`

Organization-scoped user routes:

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

Owner-only governance routes:

- `POST /api/organization-memberships/invitations`
- `POST /api/organization-memberships/:userId/activations`
- `POST /api/organization-memberships/:userId/owners`
- `POST /api/organization-memberships/:userId/ownership-transfers`

All organization-scoped routes require:

- `x-organization-id: <organization-id>`

Governance routes also require:

- `Authorization: Bearer <jwt>`
