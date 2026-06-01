Plan

PR 1 Plan: Supplier Order Detail Foundation
Summary
Build the first reviewable PR as a read-only supplier-order detail page backed by the real platform API, using the current Prisma schema as the implementation boundary.

This PR should not include payments, audit logs, or broad DBML alignment. Its purpose is to replace the current frontend-only/legacy-shaped detail wiring with a stable backend contract and a usable page skeleton.

Key Changes
Add a platform GET /supplier-orders/:id endpoint in apps/api.
Add a shared SupplierOrderDetailResponse contract in libs/types.
Return only data already supported by current Prisma models:
supplier order core fields
supplier
source quote
supplier order lines
linked invoices summary
Keep contract fields aligned to backend naming and persisted enums; do not reintroduce legacy Strapi-only field shapes.
Replace the current detail page data loader in apps/react-dashboard so it reads from the new platform endpoint instead of the old Strapi-style adapter.
Ship the detail page as read-only:
header and breadcrumbs
supplier/order sidebar
products/order-lines card
invoices summary card
Remove or suppress unsupported fake timeline/history behavior until audit logs exist in the platform backend.
Public Interfaces
New SupplierOrderDetailResponse type in @moduflow/types
New supplier order detail DTO in apps/api
New GET /platform/supplier-orders/:id endpoint
Test Plan
API test: returns the detail payload for an order in the active organization
API test: returns not found for missing order
API test: tenant isolation is enforced
Mapper test: supplier, quote, order lines, and invoice summary serialize correctly
Frontend test: detail query uses the platform endpoint and renders read-only sections
Frontend test: page handles empty order lines and empty invoices cleanly
Assumptions
This PR is intentionally read-only.
Products in this PR mean operational supplier order lines only.
Payments and audit logs are explicitly out of scope for PR 1.
After this PR is reviewed, the next plan will be written only for PR 2 rather than for the whole remaining roadmap at once.
