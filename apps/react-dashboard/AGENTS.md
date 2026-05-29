# React Dashboard Agent Guide

## Project Purpose
This React application is the internal operations dashboard for the modular-homes business. It should give the team a clear view of procurement, inventory, sales, marketing, and financing workflows.

## Business Responsibilities
- Manage suppliers, quotes, and supplier orders.
- Surface document-driven workflows such as quote PDFs and invoice attachments.
- Show operational status, financial progress, and shipment visibility.
- Later support inventory, products, leads, customers, customer orders, marketing, and analytics.

## Current Priority
- Finish the supplier-order experience already in progress.
- Ensure the detail view is reliable enough for daily operations.
- Keep the UI aligned with the Strapi schema instead of the earlier quote field naming.

## UX Expectations
- Optimize for speed and clarity for internal operators.
- Critical business relationships should be visible without drilling excessively: supplier, quote, totals, attachments, status, invoices, partial payments, and tracking.
- Avoid placeholder admin patterns for core workflows once a route becomes active.
- Preserve clear error states and recovery actions for mutation-heavy screens.

## Frontend Rules
- Backend field names and enums are the source of truth.
- Normalize any legacy frontend naming mismatches as the workflow is completed.
- Keep query hooks and mutation hooks narrowly scoped and invalidate the minimum required caches.
- Treat money, dates, and attachments consistently across list and detail views.
- Do not overwrite unrelated user changes already present in this repo.

## Near-Term Roadmap
- PR 1: complete supplier-order list/detail and invoice/payment interactions.
- PR 2: build products for configurable modular houses.
- PR 3: build inventory receiving and stock status views.
- PR 4: build leads, customers, and customer-order workflows.
- PR 5: build financing/installment management views.
- PR 6: build marketing spend and attribution views.
- PR 7: build executive analytics dashboards.

## UI Data Priorities
- Supplier orders need supplier, quote, status, tracking, invoices, partial payments, and product visibility.
- Inventory should later show unit status, location, reservation, and sale linkage.
- Leads and customers should preserve marketing source attribution through conversion.
- Analytics should connect operational activity to sales and cash performance.

## Verification
- Run lint and targeted tests when touched code paths support it.
- Manually verify supplier-order detail flows after backend or frontend changes.
- Prefer fixing type drift and payload drift immediately rather than layering workarounds.
