# API Agent Notes

## Domain rules

- `User` is a global identity.
- `Organization` is a workspace.
- `OrganizationUser` is the membership join table between `User` and `Organization`.
- `OrganizationInvitation` is the canonical invitation record.
- Ownership lives on `OrganizationUser.governanceRole`, not in app RBAC roles.

## Canonical product flow

1. Register or resolve a global user with `POST /api/auth/register` or `POST /api/auth/token`.
2. Create an organization as an authenticated user with `POST /api/organizations`.
3. The creator becomes the first active `owner` membership automatically.
4. Owners invite other people with `POST /api/organization-invitations`.
5. Invitees register or sign in as themselves.
6. Invitees accept their own invitation with `POST /api/organization-invitations/:id/accept`.

Do not build new frontend flows around the legacy membership invitation shortcuts under `/api/organization-memberships/*` for onboarding. Those routes still exist for compatibility, but the canonical invitation flow uses `OrganizationInvitation`.

## Governance rules

- An organization must always have at least one active owner.
- Last active owner cannot be removed.
- Only owners may:
  - create invitations
  - grant ownership
  - transfer ownership
  - delete the organization
- Deleting an organization soft-deletes:
  - the organization
  - its memberships
  - its invitations
- Deleting an organization does not delete global users.

## Invitation rules

- Invitations are keyed by organization and email.
- `OrganizationInvitation.status` values are:
  - `pending`
  - `accepted`
  - `expired`
  - `revoked`
  - `rejected`
- Acceptance requires:
  - authenticated user
  - invitation status `pending`
  - matching authenticated email
- Accepting an invitation creates or reactivates a membership.
- Accepting an invitation must not create a duplicate membership.

## Membership rules

- `OrganizationUser.status` values are:
  - `invited`
  - `active`
  - `removed`
- The first active membership in an organization becomes `owner`.
- Removing a membership only affects that organization.
- If a user loses their last active membership globally, the global user is soft deleted.

## Current implementation boundaries

- `POST /api/organizations` is authenticated and user-first.
- `DELETE /api/organizations/:id` is authenticated and owner-only.
- Organization invitation routes are authenticated as needed.
- Not every older platform route is fully JWT-protected yet.

When extending the API, prefer:

- `JwtGuard`
- `PlatformOrganizationContextGuard`
- `PlatformMembershipGuard`
- `PlatformOwnerGuard`

Do not expand anonymous access to org-scoped routes. Prefer tightening legacy routes rather than adding more unauthenticated surface area.

## Testing rules

- Run before committing:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test:unit`
  - `pnpm test:integration`
  - `pnpm test:e2e`
- The integration and e2e suites share the same test database.
- Do not run `test:integration` and `test:e2e` in parallel.
- When DB-backed tests fail in strange ways, first rerun them serially before debugging application logic.

## Editing rules

- Update Swagger docs for any new public route or DTO.
- Prefer TDD-style slices:
  - add failing test
  - implement
  - run gates
  - commit
- Keep commits atomic.
