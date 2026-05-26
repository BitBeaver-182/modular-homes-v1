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

Apply local migrations:

```bash
pnpm prisma:deploy
```

## Local development

Required local env:

```env
JWT_SECRET=secret
```

Start the API:

```bash
pnpm start:local
```

`start:local` now runs `prisma migrate deploy` first, so local schema changes are applied before Nest boots.

Swagger:

- UI: `http://localhost:3000/api/docs`
- JSON: `http://localhost:3000/api/docs-json`
- Bearer auth scheme: use `{{token}}` as your Postman environment variable value

Generate the OpenAPI file without starting the server:

```bash
pnpm openapi:generate
```

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

Important:

- DB-backed Jest suites set Jest `testTimeout` from `TEST_TIMEOUT_MS`, otherwise they default to `15000`.
- `test:integration` and `test:e2e` share the same test database.
- Run them serially, not in parallel.

## System model

- `User` is a global account.
- `Organization` is a workspace.
- `OrganizationUser` is the membership join table.
- `OrganizationInvitation` is the invitation record for onboarding into an existing organization.

Governance lives on `OrganizationUser.governanceRole`, not on app RBAC roles.

Membership fields:

- `governanceRole`: `owner | member`
- `status`: `invited | active | removed`

Invitation fields:

- `status`: `pending | accepted | expired | revoked | rejected`

## Current business rules

- A user signs up first.
- An authenticated user can create an organization.
- Creating an organization automatically creates the first active owner membership for that user.
- A user can belong to many organizations.
- Joining another organization creates a new membership, not a new user.
- An organization must always have at least one active owner.
- Last active owner cannot be removed.
- Removing a membership only affects that organization.
- If a user loses their last active membership globally, the global user is soft deleted.
- Deleting an organization soft-deletes the organization, its memberships, and its invitations, but does not delete global users.

## Canonical frontend flow

### 1. Register

Create a global user account and receive a JWT:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"owner@example.com","name":"Owner"}'
```

Response shape:

```json
{
  "access_token": "<jwt>",
  "user": {
    "id": "1",
    "email": "owner@example.com",
    "name": "Owner",
    "avatarUrl": null
  }
}
```

### 2. Create an organization

Use the JWT from registration:

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <jwt>' \
  -d '{"name":"Acme","slug":"acme"}'
```

This creates:

- the organization
- the first `OrganizationUser` membership for the creator
- `governanceRole=owner`
- `status=active`

### 3. Invite someone else

Owner token required.

```bash
curl -X POST http://localhost:3000/api/organization-invitations \
  -H 'content-type: application/json' \
  -H 'x-organization-id: 1' \
  -H 'authorization: Bearer <owner-jwt>' \
  -d '{"email":"invitee@example.com","governanceRole":"member"}'
```

This creates a pending invitation record.

It does not create a membership yet.

### 4. Invitee signs up or signs in

If the invitee does not exist yet:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"invitee@example.com"}'
```

If the invitee already exists:

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H 'content-type: application/json' \
  -d '{"email":"invitee@example.com"}'
```

### 5. Invitee accepts the invitation

The invitee must accept with a token whose email matches the invitation email.

```bash
curl -X POST http://localhost:3000/api/organization-invitations/10/accept \
  -H 'authorization: Bearer <invitee-jwt>'
```

On acceptance:

- invitation becomes `accepted`
- membership is created or reactivated
- no duplicate user is created
- no duplicate membership is created

## Governance flows

Grant ownership:

```bash
curl -X POST http://localhost:3000/api/organization-memberships/2/owners \
  -H 'x-organization-id: 1' \
  -H 'authorization: Bearer <owner-jwt>'
```

Transfer ownership:

```bash
curl -X POST http://localhost:3000/api/organization-memberships/2/ownership-transfers \
  -H 'content-type: application/json' \
  -H 'x-organization-id: 1' \
  -H 'authorization: Bearer <owner-jwt>' \
  -d '{"fromUserId":"1"}'
```

Delete organization:

```bash
curl -X DELETE http://localhost:3000/api/organizations/1 \
  -H 'authorization: Bearer <owner-jwt>'
```

Only owners can delete organizations.

## Current route surface

Auth:

- `POST /api/auth/register`
- `POST /api/auth/token`
- `GET /api/auth/me`

Organizations:

- `POST /api/organizations`  
  Authenticated user creates an organization and becomes first owner.
- `GET /api/organizations`
- `GET /api/organizations/:id`
- `PATCH /api/organizations/:id`
- `DELETE /api/organizations/:id`  
  Owner-only.

Canonical invitation routes:

- `POST /api/organization-invitations`
- `POST /api/organization-invitations/:id/accept`

Membership governance routes:

- `POST /api/organization-memberships/:userId/owners`
- `POST /api/organization-memberships/:userId/ownership-transfers`

Org-scoped resource routes still use:

- `x-organization-id: <organization-id>`

## Important note about legacy routes

Some older membership-management routes still exist for compatibility and tests, especially under `/api/users` and `/api/organization-memberships`.

For new frontend onboarding work, prefer this canonical flow:

1. `auth/register` or `auth/token`
2. `POST /organizations`
3. `POST /organization-invitations`
4. `POST /organization-invitations/:id/accept`

Do not build new onboarding flows around pre-created invited memberships.

```
/apps
  /moduflow-api      # The single entry point for all products (or one per product)
  /moduflow-landing    # Your landing page (uses the platform SDK)
  /moduflow-dashboard  # A unified UI that imports widgets from products
/libs
  /platform-core    # 100% Shared: Auth, Billing, Org-Management, Permissions
  /moduflow-types     # Common interfaces
```
