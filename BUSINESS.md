# Modular House Business System README

## 1. Purpose of the System

This system is designed to manage a modular house business from end to end.

The business buys modular houses from suppliers, ships them in containers, tracks them as inventory, advertises them to potential customers, follows up with leads, sells houses to customers, collects deposits and payments, manages supplier and customer invoices, and keeps a full audit trail of every important action.

The system is not only for houses that are already in stock. It is also designed to manage houses that are planned, ordered, in production, inside a container, on the way, reserved, sold, or delivered.

The core idea is that the business needs visibility across the whole lifecycle:

```text
Marketing lead → Customer interest → Reservation → Customer order
                                      ↓
Supplier quote → Supplier order → Container → Inventory → Delivery
                                      ↓
                            Invoices, payments, documents, audit logs
```

---

## 1.1 Multi-Brand SaaS, Tenant Isolation, and Identity Providers

This system is designed to support **multiple isolated brands/organizations** from a single codebase and (optionally) a single deployment.

### Tenant isolation model (Postgres RLS)

- Each brand/org is an `organization`.
- Nearly every business table is tenant-scoped and contains `organization_id`.
- PostgreSQL enforces tenant isolation with **Row-Level Security (RLS)** using a per-request session setting:
  - The app sets `app.organization_id` at the start of the request/transaction.
  - RLS policies ensure every read/write only touches rows matching that org.
  - Tenant tables use `FORCE ROW LEVEL SECURITY` so even owner-level access paths are constrained by policy.
  - Policy expression uses `COALESCE(organization_id = NULLIF(current_setting('app.organization_id', true), '')::bigint, false)` so missing context always denies access.
- The application DB role is hardened as a non-owner role with `NOBYPASSRLS`, `NOINHERIT`, and no schema-create privilege.
- Tenant context is applied through a transaction wrapper (`set_config(..., true)`) so context clears automatically when the transaction ends.

### Auth provider portability (WorkOS today, swap later)

To avoid locking the business data to a specific auth provider (WorkOS, Logto, etc.):

- Business tables reference **internal IDs**:
  - `organizations.id` (internal numeric id)
  - `app_users.id` (internal numeric id)
- Provider-specific IDs are stored only in identity mapping tables:
  - `organization_identities` maps `(provider, provider_organization_id)` → internal org
  - `user_identities` maps `(provider, provider_user_id)` → internal user

Swapping providers later is a data-migration in the identity tables, not a rewrite of business tables.

### Initial authentication bootstrap flow (implemented baseline)

- Callback endpoint: `POST /auth/workos/callback`
- Tenant selection source: request host/subdomain only (no user-driven org switch endpoint in this phase).
- Bootstrap sequence:
  1. Resolve internal org from host subdomain.
  2. Exchange auth code with provider (WorkOS) and map provider user/org ids.
  3. Link provider identities in `user_identities` and `organization_identities`.
  4. Resolve membership from internal DB (`organization_memberships`) as source of truth.
  5. If no membership exists, allow bootstrap only through a valid invite token (`organization_invites`), then activate membership.
  6. Audit any provider-vs-DB mismatch and fail safe.

This preserves portability because provider-specific fields never become foreign keys in business tables.

### Authorization (roles & permissions)

- `permissions` is a **global catalog** of allowed actions (e.g. `catalog.manage`, `finance.manage`).
- `roles` are **per organization** (each org can define roles differently).
- `role_permissions` maps roles to permissions within an org.
- `organization_memberships` assigns users to orgs (and optionally a role).

### Internal access-control enforcement (implemented baseline)

- Route-level checks use explicit required permission keys (metadata + guard model).
- Service-level checks re-validate actor membership, role mapping, and permission keys before sensitive mutations.
- Role assignment is constrained to the resolved organization boundary:
  - actor must have `tenant.role.assign`
  - target membership must belong to the same org
  - target role must belong to the same org
  - mutation is written to `audit_logs`

### Manual tenant operations (implemented baseline)

The initial phase keeps tenant administration manual and backend-only:

- Internal admin API endpoints (permission-protected):
  - `GET /admin/organizations/:organizationId/memberships`
  - `POST /admin/organizations/:organizationId/memberships`
  - `PATCH /admin/organizations/:organizationId/memberships/:membershipId`
- Manual CLI scripts for operator workflows:
  - `tenant:create`, `tenant:add-user`, `tenant:set-role`, `tenant:list-members`

Business behavior:
- Membership creation is idempotent for repeated add-member requests.
- One-user-one-org policy is enforced; cross-tenant reassignment attempts are blocked and audited.
- Membership updates (role/status) are tenant-scoped and auditable.
- No public org self-serve creation endpoint exists in this phase.

### Auth control plane sync (WorkOS strategy)

- WorkOS is the operational control plane for hosted login, provider users, organizations, and provider memberships.
- Internal DB remains the runtime authorization authority for tenant membership, roles, permissions, and RLS.
- Roles and permissions are not managed in WorkOS. Provider role labels can be synced as metadata/mapping inputs only.
- Provider operations are routed through the `AuthProvider` contract and `AUTH_PROVIDER` DI token. Current adapter: WorkOS.
- Active provider is global and explicit (`IDENTITY_PROVIDER_ACTIVE=workos`), with one provider active at a time in this phase.
- Platform-admin endpoints:
  - `GET /admin/organizations`
  - `POST /admin/organizations`
  - `GET /admin/users`
  - `POST /admin/users`
  - `POST /admin/auth/organizations/:providerOrganizationId/memberships`
  - `POST /admin/auth/reconcile`
- Browser login endpoints:
  - `GET /auth/login`
  - `GET /auth/callback`
- Webhook ingress endpoint:
  - `POST /auth/webhook`
  - requires the WorkOS signature header and Nest raw body for cryptographic verification through the WorkOS SDK.
- Business behavior:
  - API-created organizations/users/memberships are created in WorkOS first, then mirrored into `organizations`, `app_users`, identity mapping tables, and `organization_memberships`.
  - WorkOS dashboard organization/user/membership lifecycle changes flow into the app through `/auth/webhook`; missed events are repaired by `POST /admin/auth/reconcile`.
  - The synced WorkOS lifecycle events are `organization.created|updated|deleted`, `user.created|updated|deleted`, and `organization_membership.created|updated|deleted`.
  - Authentication, invitation, connection, directory, API key, and domain events are verified and acknowledged but do not change app authorization state until a concrete business use-case is added.
  - Listing orgs/users returns the synced DB mirror. If WorkOS already has objects, run reconciliation before expecting them in app admin lists.

### Scalability hardening record (2026-05-12)

- Tenant-safe identifiers: org-scoped uniqueness added for core business codes (orders, units, quotes, market/language codes where needed).
- Cross-tenant relational safety: composite tenant foreign keys are defined to prevent linking records across organizations.
- High-concurrency write safety:
  - reservation locking via `inventory_reservations.active_house_unit_lock_id`
  - idempotent command handling via `idempotency_keys`
  - async side-effects reliability via `outbox_events`
- SaaS monetization foundation: `plans`, `plan_features`, `organization_subscriptions`, `feature_entitlements`, `usage_counters`.
- Accounting foundation: immutable journal model with `ledger_accounts`, `ledger_entries`, and `ledger_entry_lines`.

---

## 2. Main Business Domains

The ERM is divided into business domains. This section is the **authoritative mapping of tables → domain** and must be updated whenever `database.dbml` changes.

### Domain 1: Platform, Tenancy & Access Control

Tables:

- `organizations`, `organization_identities`
- `app_users`, `user_identities`
- `organization_memberships`, `organization_invites`
- `roles`, `permissions`, `role_permissions`
- `api_keys`
- `idempotency_keys`
- `outbox_events`

### Domain 2: Product Catalog & Configuration

Tables:

- `house_models`, `house_model_translations`
- `component_slots`, `component_slot_translations`
- `house_model_slots`
- `slot_options`, `slot_option_translations`, `slot_option_prices`
- `product_configurations`, `configuration_options`

### Domain 3: Internationalization & Markets

Tables:

- `languages`
- `markets`, `market_configurations`
- `market_house_models`, `market_house_prices`
- `exchange_rates`

### Domain 4: Parties & Locations

Tables:

- `customers`
- `suppliers`
- `logistics_providers`
- `warehouse_locations`

### Domain 5: Marketing & CRM

Tables:

- `marketing_channels`, `marketing_campaigns`
- `leads`, `lead_activities`, `lead_interests`

### Domain 6: Supplier Procurement

Tables:

- `supplier_quotes`, `supplier_quote_lines`
- `supplier_orders`, `supplier_order_lines`

### Domain 7: Logistics, Shipments & Containers

Tables:

- `shipments`, `shipment_tracking_events`
- `containers`, `container_house_units`

### Domain 8: Inventory & Reservations

Tables:

- `house_units`
- `inventory_reservations`

### Domain 9: Customer Sales Orders

Tables:

- `customer_orders`, `customer_order_lines`, `customer_order_status_history`

### Domain 10: Finance (Invoices, Installments, Payments, Expenses)

Tables:

- `invoices`, `invoice_lines`, `invoice_installments`
- `payments`, `payment_allocations`
- `expenses`
- `ledger_accounts`, `ledger_entries`, `ledger_entry_lines`

### Domain 11: Documents & Collaboration

Tables:

- `documents`
- `notes`

### Domain 12: Audit & Compliance

Tables:

- `audit_logs`

### Domain 13: Billing, Plans & Entitlements

Tables:

- `plans`, `plan_features`
- `organization_subscriptions`
- `feature_entitlements`
- `usage_counters`

Each domain owns a specific part of the business, but they are connected through shared entities such as house models, house units, customer orders, supplier orders, invoices, and audit logs.

---

## 3. Product Catalog & Configuration

### What this domain manages

This domain defines what the business sells.

### Table map for this domain

- `house_models`: canonical product blueprint used across procurement, inventory, reservations, and customer sales.
- `house_model_translations`: localized customer-facing attributes for each house model (name/slug/description) by language.
- `component_slots`: structural configurable areas of a house model (for example flooring, windows, bathroom).
- `component_slot_translations`: localized labels/descriptions for each slot.
- `house_model_slots`: model-specific slot assignment and rules (`required_override`, quantity constraints, sort order).
- `slot_options`: selectable values per slot, with base price and cost modifiers and optional technical specs.
- `slot_option_translations`: localized option labels/descriptions.
- `product_configurations`: reusable or transaction-level configuration snapshots with calculated commercial totals.
- `configuration_options`: resolved option selections for a configuration, including quantity and per-option modifiers.

How it fits in the business:

- Catalog authoring starts in `house_models`, `component_slots`, `slot_options`.
- Valid combinations are governed by `house_model_slots`.
- Sales/procurement operationalize catalog choices through `product_configurations` + `configuration_options`.
- The configuration snapshot principle protects historical orders from future catalog edits.

A modular house is not just a simple product. Each house model can have configurable parts, such as wall panels, doors, windows, flooring, bathroom options, electric wiring, water heater, furniture, air conditioning, and other components.

The system separates the product into three concepts:

### House Model

A `house_model` is the base product.

Examples:

- 20ft Apple Cabin
- 20ft Empty House
- 40ft Modular House
- Custom Studio Unit

A house model stores information such as:

- SKU
- name
- base price
- promotional price
- dimensions
- weight
- status
- whether it is configurable

The house model is the catalog item that appears in sales, procurement, and inventory.
Dimension fields (`external_dimension`, `internal_dimension`) are stored as structured JSON payloads so unit + shape metadata can evolve without schema churn.

`house_models.status` uses `house_model_status` with this lifecycle:

- `draft`: model is being authored and is not sellable
- `active`: model is available for configuration and sales flows
- `inactive`: model is temporarily paused for new commercial use
- `archived`: model is retired from active catalog operations

### Component Slot

A `component_slot` is a configurable position or category inside a house.

Examples:

- Wall panels
- Entrance door
- Windows
- Flooring
- Bathroom
- Electrical system
- Kitchen
- Water heater
- Air conditioning

A slot answers the question:

> What part of the house can be configured?

Some slots are required. Others may be optional.

### Slot Option

A `slot_option` is one possible choice for a component slot.

For example, the `flooring` slot could have these options:

- Standard vinyl floor
- Premium vinyl floor
- Wood-effect flooring
- Tile flooring

Each option can have:

- price modifier
- supplier cost modifier
- technical specs
- default flag
- active/inactive status

This lets the business define a default configuration and also calculate upgrade prices.

### Product Configuration

A `product_configuration` is a specific combination of selected options for a house model.

For example:

```text
20ft Apple Cabin
- Premium wall panels
- Black entrance door
- Double-glazed windows
- Premium flooring
- Full bathroom
- Air conditioning included
```

Configurations can be used in different contexts:

- catalog presets
- supplier quotes
- supplier orders
- customer quotes
- customer orders
- inventory units

The system stores a configuration snapshot so that historical orders do not change if the catalog changes later.

This is important because a customer may buy a house with a certain configuration today, and later the available options or prices may change. The original order must still show exactly what was sold.

In sales contexts, a configuration can also store a calculated price for a specific market at a specific point in time. This price should be treated as a snapshot and should not be recalculated after an order is created.

---

## 4. Internationalization & Markets

### What this domain manages

This domain allows the business to sell the same catalog in different languages and markets without duplicating the product structure.

### Table map for this domain

- `languages`: per-organization language catalog used by translations and language preferences.
- `markets`: commercial contexts (currency, tax, shipping baseline, default language).
- `market_house_models`: per-market availability switch for each house model.
- `market_house_prices`: per-market base/promo overrides for `house_models`.
- `slot_option_prices`: per-market option-price overrides for `slot_options`.
- `market_configurations`: per-market availability switch for `product_configurations`.
- `exchange_rates`: historical conversion table for reporting and finance normalization.

How it fits in the business:

- Catalog rendering for a buyer market resolves language + market pricing + availability from this layer.
- Final transactional amounts are snapshotted downstream into reservations, order lines, invoices, and payments.
- `exchange_rates` supports analytics and accounting comparisons without changing operational local-currency amounts.

Two concerns must stay separate:

1. translation
2. market context

Translations handle customer-facing text such as names, labels, descriptions, and slugs.

Markets handle commercial rules such as:

- selling currency
- default language
- tax region
- market-specific pricing
- market-specific availability

### Languages

A `language` defines supported content languages such as English, Slovak, and German.

Languages are referenced by translation tables and by customer-facing records that need a language preference.

### Markets

A `market` defines where and how the business sells.

A market stores:

- market code
- name
- default language
- currency
- tax region
- tax rate
- base shipping cost
- active status

A market is a business context, not just a geography field. It determines which catalog entries are sellable and what commercial defaults apply.

### Translation strategy

Translatable catalog content should live in dedicated translation records for entities such as:

- house models
- component slots
- slot options

The base tables remain the structural source of truth and fallback values. The system should not use fields such as `name_en` or `name_de` in the main product tables.

### Pricing and availability strategy

Customer-facing prices should be resolved per market, then snapshotted into configurations, reservations, quotes, and orders when a transaction happens.

The pricing model is intentionally "base + modifiers":

```text
final_price = base_price_for_market + sum(option_price_modifiers_for_market)
```

To support multiple markets cleanly, the system uses a market override pattern with fallback:

- base price: use a market-specific base price if present, otherwise fall back to the global `house_models.base_price`
- option modifier: use a market-specific modifier if present, otherwise fall back to the global `slot_options.price_modifier`

This is important because the same model may need:

- different base prices per market
- different upgrade prices per market
- different active/inactive availability by market

Exchange rates can exist for reporting and finance, but the core sales catalog should store prices in the local market currency rather than depending on runtime conversion.

Supplier procurement stays global. Supplier quotes, supplier orders, and supplier invoices remain tied to supplier-side currencies and costs rather than to customer sales markets.

---

## 5. People, Suppliers, Customers & Users

### What this domain manages

This domain stores the main parties involved in the business.

### Table map for this domain

- `app_users`: internal actor profile used for ownership, assignment, approvals, and audit attribution.
- `user_identities`: auth-provider identity bridge (WorkOS/Logto/etc.) to internal `app_users`.
- `organization_memberships`: user-to-organization relation with role binding and membership state (initially one active org per user).
- Membership authority is internal DB state, not external provider role claims.
- `roles`: organization-defined role groups.
- `permissions`: global action catalog (stable keys used by backend authorization checks).
- `role_permissions`: mapping between org roles and global permissions.
- `organization_invites`: invitation workflow for onboarding internal users into an organization.
- `suppliers`: procurement counterparties; source for quotes/orders/payables.
- `customers`: sales counterparties; target for orders/receivables.
- `logistics_providers`: freight/customs/delivery counterparties used in shipment and payable flows.

How it fits in the business:

- Every operational action has an actor (`app_users`) and a permission context (`organization_memberships`, `roles`, `role_permissions`).
- External auth providers are replaceable because identity mapping is isolated in `user_identities`.
- Counterparty tables (`suppliers`, `customers`, `logistics_providers`) anchor money and operational documents.

### Users

`app_users` are internal system users.

Examples:

- owner
- sales person
- operations manager
- finance user
- admin

Users are connected to actions such as:

- creating supplier orders
- accepting quotes
- assigning leads
- recording payments
- uploading documents
- changing statuses
- writing notes
- triggering audit records

In the current operating model, a user belongs to exactly one organization:

- `organization_memberships` links a user to an organization.
- `organization_memberships.user_id` is globally unique in the schema, enforcing one-org-per-user in this phase.
- The membership can assign a `role` (org-defined), which grants `permissions` (global action catalog).
- Provider identities (WorkOS/Logto) are stored in `user_identities` so the business data stays stable if the auth provider changes later.

If multi-org membership is needed later, this can be enabled by relaxing the `organization_memberships.user_id` unique constraint.

### Suppliers

`suppliers` are the companies that manufacture or sell the houses to the business.

The supplier record stores:

- company name
- legal name
- tax ID
- contact details
- default loading port
- default payment terms
- default incoterm
- notes

A supplier can provide many quotes and many supplier orders.

### Customers

`customers` are people or companies that buy houses from the business.

A customer may come from a lead. They become a customer once they actually purchase something or are converted during the sales process.

A customer stores:

- personal or company details
- email
- phone
- tax ID
- market
- preferred language
- billing address
- delivery address
- notes
- original lead source, if applicable

---

## 6. Marketing & CRM

### What this domain manages

This domain manages the process before someone becomes a customer.

### Table map for this domain

- `marketing_channels`: top-level origin bucket for demand (Google, Meta, Referral, etc.).
- `marketing_campaigns`: campaign-level attribution metadata (UTM, budget, market alignment).
- `leads`: pre-customer commercial intent record with qualification state and target product/market details.
- `lead_activities`: timeline of touches and follow-ups, used for SLA discipline and sales accountability.
- `lead_interests`: structured demand shape (model/config/quantity/target price) before formal order creation.

How it fits in the business:

- Attribution starts with `marketing_channels` and `marketing_campaigns`.
- Commercial conversion starts with `leads`, matures through `lead_activities`, and is quantified in `lead_interests`.
- On conversion, downstream links connect leads to `customers`, reservations, and customer orders.

The business advertises through channels such as:

- Google
- Meta
- TikTok
- website forms
- referrals
- offline campaigns

The result of advertising is usually not an immediate sale. The result is a lead.

### Marketing Channels

A `marketing_channel` represents where a lead came from.

Examples:

- Google Ads
- Meta Ads
- Website
- Referral
- WhatsApp campaign

### Marketing Campaigns

A `marketing_campaign` represents a specific campaign inside a channel.

For example:

```text
Channel: Google Ads
Campaign: 20ft Apple Cabin Slovakia May Campaign
```

Campaigns can store:

- external campaign ID
- UTM fields
- budget
- start and end dates
- currency

This helps track which campaigns generate leads and customers.

### Leads

A `lead` is a potential customer.

A lead may have:

- name
- email
- phone
- market
- preferred language
- desired house model
- desired configuration
- delivery location
- budget
- expected purchase date
- assigned salesperson
- source campaign
- status

Lead statuses include:

```text
new → contacted → qualified → proposal_sent → negotiating → won/lost
```

A lead is not yet a customer. A lead becomes a customer when they purchase or when the business decides to convert them into a customer record.

### Lead Activities

`lead_activities` track every interaction with a lead.

Examples:

- call
- WhatsApp message
- email
- meeting
- follow-up task
- note

This makes it possible to know:

- when the lead was last contacted
- who contacted them
- what was discussed
- what the next follow-up should be
- why the lead was lost or won

### Lead Interests

A lead can be interested in one or more house models or configurations.

For example, a lead may be interested in:

- one 20ft Apple Cabin
- two empty container houses
- a house with bathroom but no kitchen

`lead_interests` allows the system to capture this before there is a formal customer order.

---

## 7. Supplier Procurement

### What this domain manages

This domain manages how the business buys houses from suppliers.

### Table map for this domain

- `supplier_quotes`: commercial offers from suppliers (pre-commitment procurement stage).
- `supplier_quote_lines`: quoted line details (model/config/quantity/cost) used for comparison and acceptance.
- `supplier_orders`: committed purchase contracts derived from accepted quotes or direct purchase decisions.
- `supplier_order_lines`: operational purchase line items that drive planned inventory creation.

How it fits in the business:

- Commercial negotiation happens in `supplier_quotes` and `supplier_quote_lines`.
- Commitment and execution move into `supplier_orders` and `supplier_order_lines`.
- `supplier_order_lines` are the upstream source for future `house_units` lifecycle tracking.

The typical procurement process is:

```text
Request / receive supplier quote → Review quote → Accept or reject quote → Create supplier order → Track production and shipment
```

### Supplier Quotes

A `supplier_quote` is the supplier's offer.

It includes:

- supplier
- quote number
- quote date
- validity date
- currency
- subtotal
- shipping amount
- tax amount
- total amount
- incoterm
- payment terms
- loading port
- destination port
- status

Quote statuses include:

```text
draft → received → under_review → accepted / rejected / expired
```

A quote does not automatically mean the business has ordered the houses.

The business can review the quote and decide whether to accept or reject it.

### Supplier Quote Lines

A quote can contain multiple house models and configurations.

For example:

```text
Supplier Quote #Q-001
- 2 × 20ft Apple Cabin
- 1 × 20ft Empty House
- 3 × 40ft Modular House
```

Each quote line stores:

- house model
- configuration
- quantity
- unit cost
- total cost
- estimated production time

### Supplier Orders

A `supplier_order` is created when the business accepts a supplier quote and proceeds with the actual purchase.

A supplier order stores:

- supplier
- related quote
- internal order number
- supplier PO number
- status
- order date
- expected production ready date
- expected shipping date
- expected arrival date
- total cost
- payment terms
- incoterm
- ports

Supplier order statuses include:

```text
draft → placed → confirmed → in_production → ready_to_ship → shipped → arrived → closed
```

### Supplier Order Lines

Supplier order lines represent the exact houses being purchased.

Each line has:

- house model
- configuration
- quantity
- unit cost
- line total

Supplier order lines are important because they eventually create inventory.

If the business orders five houses from a supplier, the system can create five planned `house_units`, even before the houses physically arrive.

---

## 8. Logistics, Shipments & Containers

### What this domain manages

This domain tracks how houses move from the supplier to the business.

### Table map for this domain

- `shipments`: voyage-level movement record for a supplier order leg.
- `containers`: physical container records inside a shipment.
- `container_house_units`: many-to-many assignment between containers and house units.
- `shipment_tracking_events`: chronological movement milestones/events.
- `warehouse_locations`: receiving/storage destinations for arrived units.

How it fits in the business:

- `supplier_orders` transition into `shipments`, then `containers`, then `house_units` receiving.
- `shipment_tracking_events` drives operational transparency and exception management.
- `warehouse_locations` closes the transport leg and opens the availability-for-sale leg.

A supplier order may be shipped in one or more shipments. Each shipment may contain one or more containers. Each container may contain one or more houses.

The flow is:

```text
Supplier Order → Shipment → Container → House Units
```

### Logistics Providers

`logistics_providers` are companies involved in transport, freight forwarding, customs, or delivery.

Examples:

- freight forwarder
- customs broker
- trucking company
- port agent

### Shipments

A `shipment` represents a transport movement related to a supplier order.

It stores:

- supplier order
- logistics provider
- shipment number
- booking reference
- vessel name
- voyage number
- origin port
- destination port
- ETD
- ETA
- actual departure date
- actual arrival date
- customs clearance date
- tracking URL
- status

Shipment statuses include:

```text
planned → booking_requested → booked → at_origin_port → in_transit → at_destination_port → customs_clearance → delivered
```

A shipment can also be marked as delayed or cancelled.

### Containers

A `container` represents a physical shipping container.

It stores:

- container number
- seal number
- container type
- shipment
- supplier order
- status
- loading date
- departure date
- arrival date
- unloading date
- storage location

A container can contain one or more houses.

### Shipment Tracking Events

`shipment_tracking_events` store the detailed tracking history.

Examples:

- container loaded
- vessel departed
- arrived at destination port
- customs hold
- customs released
- delayed
- delivered to warehouse

This allows the business to see not only the current shipment status but also the full movement history.

---

## 9. Inventory & Reservations

### What this domain manages

This is the central domain of the business.

The inventory system connects procurement, logistics, CRM, and sales.

The most important table is `house_units`.

### Table map for this domain

- `house_units`: atomic inventory asset (one physical or planned house instance).
- `inventory_reservations`: demand-to-inventory commitment layer before final sale completion.

Concurrency and anti-oversell controls:

- `inventory_reservations.active_house_unit_lock_id` is used as the active lock key for specific-unit reservation mode.
- Only one active reservation can lock the same house unit at a time.
- Model-level reservations remain possible without a physical `house_unit_id` until assignment time.

How it fits in the business:

- Procurement creates future `house_units`.
- Logistics updates location/status until units become saleable.
- CRM/Sales consume inventory through reservations first, then convert to customer-order fulfillment.

### House Units

A `house_unit` represents one actual or expected house.

It can be:

- planned
- ordered
- in production
- incoming
- in stock
- reserved
- sold
- delivered
- damaged
- cancelled

This means the system does not only track houses physically in the warehouse. It also tracks future inventory.

For example, when the business places a supplier order for three houses, the system can create three house units:

```text
HU-001: 20ft Apple Cabin — ordered
HU-002: 20ft Apple Cabin — ordered
HU-003: 20ft Empty House — ordered
```

Later, those units can be linked to a container:

```text
Container MSKU1234567
- HU-001
- HU-002
- HU-003
```

When the container arrives, the units can move to:

```text
in_stock
```

When a customer reserves or buys a unit, the status can become:

```text
reserved → sold → delivered
```

A `house_unit` can store `sale_price_amount` as the historical amount the unit was actually sold for. This value must never be recomputed from catalog rules after the sale, even if market pricing changes later.

### Why House Units Are Central

`house_units` is the bridge between:

- supplier order
- supplier order line
- container
- warehouse
- product configuration
- customer order
- inventory reservation
- invoices
- expenses
- documents
- audit logs

This allows the business to answer questions like:

- Which supplier did this house come from?
- Which container was it in?
- Is it already in stock?
- Is it reserved?
- Which customer is waiting for it?
- What configuration does it have?
- What did it cost?
- What was it sold for?
- Which invoices and expenses are related to it?

### Warehouse Locations

`warehouse_locations` represent where houses are stored after arrival.

This matters because modular houses require space, and the business wants to avoid too much stock piling up.

A warehouse location can store:

- name
- address
- capacity
- notes
- active/inactive status

### Inventory Reservations

`inventory_reservations` solve one of the most important business problems.

A customer may want a house that is not physically in stock yet.

The system must allow the business to connect a lead or customer order to inventory that is:

- already in stock
- inside an incoming container
- ordered but not shipped yet
- planned but not assigned to a specific physical unit yet

An inventory reservation can therefore work in two ways.

#### 1. Specific Unit Reservation

The business reserves a specific house unit.

Example:

```text
Customer wants HU-001, which is already incoming in Container MSKU1234567.
```

The reservation points directly to `house_unit_id`.

#### 2. Model-Level or Future Reservation

The business reserves a future house that has not been assigned a physical unit yet.

Example:

```text
Customer wants one 20ft Apple Cabin with bathroom and air conditioning.
The business has ordered this type, but the exact unit has not been assigned yet.
```

The reservation points to:

- house model
- configuration
- lead or customer
- quantity

Later, when a specific house unit is available, the reservation can be linked to that unit.

Reservation statuses include:

```text
active → converted_to_sale / released / expired / cancelled
```

This gives the business visibility into demand before stock arrives.

Reservations may also carry market context so the business can reserve inventory under the same pricing and availability rules that will later apply to the sale.

---

## 10. Customer Sales Orders

### What this domain manages

This domain manages customer purchases.

A customer order is similar to a supplier order in that it can involve invoices, payments, installments, documents, and status changes. But it is different because it is focused on selling to the customer, collecting deposits, reserving inventory, and delivering the house.

### Table map for this domain

- `customer_orders`: order header with commercial totals, deposit policy, lifecycle status, and delivery intent.
- `customer_order_lines`: item-level sale commitments (model/config/reservation/unit and final commercial values).
- `customer_order_status_history`: status transition timeline for process and support traceability.

Assignment integrity:

- `customer_order_lines.house_unit_id` supports direct assignment when known.
- At most one order line can claim the same `house_unit_id` within an organization, preventing double-selling the same physical unit.

How it fits in the business:

- Reservation-first selling writes intent in `inventory_reservations`, then materializes in `customer_order_lines`.
- Unit assignment may happen at order creation (in-stock) or later (incoming/planned inventory).

### Customer Orders

A `customer_order` represents a sale or intended sale to a customer.

It stores:

- order number
- customer
- original lead, if any
- assigned salesperson
- market
- language
- status
- order date
- required deposit percentage
- required deposit amount
- deposit due date
- deposit paid date
- subtotal
- discounts
- taxes
- delivery amount
- total amount
- delivery address
- desired delivery date
- notes

By default, the required deposit is 50%.

Customer order statuses include:

```text
draft → awaiting_deposit → deposit_paid → confirmed → awaiting_stock → ready_for_delivery → delivered → completed
```

The order may also be cancelled or refunded.

### Customer Order Lines

A customer order can contain one or more houses.

Each line stores:

- house model
- product configuration
- assigned house unit, if known
- inventory reservation, if any
- quantity
- unit price
- discount
- tax
- line total
- configuration snapshot

This supports different sales situations:

#### Selling a house already in stock

```text
Customer Order CO-001
- HU-001: 20ft Apple Cabin, already in warehouse
```

#### Selling a house that is incoming

```text
Customer Order CO-002
- HU-005: 20ft Apple Cabin, inside incoming container
```

#### Selling a house that is not assigned yet

```text
Customer Order CO-003
- 1 × 20ft Apple Cabin configuration X
- Reservation active
- House unit will be assigned later
```

### Customer Order Status History

`customer_order_status_history` records important status changes for customer orders.

For example:

```text
awaiting_deposit → deposit_paid
confirmed → awaiting_stock
awaiting_stock → ready_for_delivery
ready_for_delivery → delivered
```

This gives visibility into the customer order lifecycle.

---

## 11. Finance, Invoices, Installments & Payments

### What this domain manages

This domain manages all money moving in and out of the business.

The system supports both:

- money the business owes to others
- money customers owe to the business

This is handled through invoice direction.

```text
payable    = the business must pay someone
receivable = someone must pay the business
```

### Table map for this domain

Operational finance tables:

- `invoices`: financial obligation/claim documents (payable and receivable).
- `invoice_lines`: line-level financial breakdown and optional operational linkage (unit/order line).
- `invoice_installments`: payment schedule decomposition for staged settlement.
- `payments`: actual bank/cash/card money events.
- `payment_allocations`: mapping of payment amounts to invoices/installments.
- `expenses`: additional costs that may or may not originate from a formal invoice.

Billing and SaaS monetization tables:

- `plans`: sellable subscription packages.
- `plan_features`: feature/limit matrix per plan.
- `organization_subscriptions`: active subscription lifecycle per organization.
- `feature_entitlements`: effective enabled features and limits for an organization.
- `usage_counters`: metered usage snapshots for limit checks and billing logic.

Accounting control tables:

- `ledger_accounts`: chart of accounts.
- `ledger_entries`: immutable journal headers.
- `ledger_entry_lines`: double-entry posting lines linked to invoices/payments when applicable.

How it fits in the business:

- Orders and procurement generate obligations/revenue through `invoices`.
- Cash movements are captured in `payments` and reconciled by `payment_allocations`.
- `expenses` completes landed-cost visibility beyond invoices.
- SaaS billing layer (`plans`/`organization_subscriptions`) governs tenant monetization.
- Ledger tables provide an auditable accounting backbone independent from operational status fields.

### Invoices

An `invoice` is a generic financial document.

It can be linked to many different business objects, including:

- supplier
- customer
- logistics provider
- supplier order
- shipment
- container
- customer order

This is important because supplier orders may have many different invoices.

Examples:

- supplier goods invoice
- customs invoice
- logistics invoice
- storage invoice
- delay fee invoice
- insurance invoice
- tax invoice
- customer sale invoice
- credit note

Invoice statuses include:

```text
draft → issued → partially_paid → paid
```

Invoices can also be overdue, disputed, cancelled, or void.

### Invoice Lines

`invoice_lines` store the detailed line items inside an invoice.

For example:

```text
Invoice INV-001
- 2 × 20ft Apple Cabin
- 1 × Shipping surcharge
- 1 × Documentation fee
```

Invoice lines can also be connected to:

- a specific house unit
- a supplier order line
- a customer order line

This allows detailed cost and profit tracking.

### Invoice Installments

Some invoices can be paid in installments.

This applies to both supplier-side invoices and customer-side invoices.

For example, a supplier invoice may be paid as:

```text
Installment 1: 30% deposit
Installment 2: 40% before shipment
Installment 3: 30% after arrival
```

A customer invoice may be paid as:

```text
Installment 1: 50% deposit
Installment 2: 50% before delivery
```

Each installment stores:

- installment number
- due date
- amount due
- amount paid
- status
- paid date

Installment statuses include:

```text
scheduled → due → partially_paid → paid
```

Installments can also become overdue or cancelled.

### Payments

A `payment` records actual money movement.

Payments can be:

- money paid by the business to a supplier
- money paid by the business to a logistics provider
- money received from a customer

Payments store:

- payment reference
- direction
- method
- status
- payment date
- amount
- bank account
- transaction ID
- notes
- user who recorded it

### Payment Allocations

A single payment may pay one invoice, part of an invoice, one installment, or multiple invoices.

`payment_allocations` connect payments to invoices and installments.

Example:

```text
Payment PAY-001: €10,000 from customer
Allocated to:
- Invoice INV-100, Installment 1: €10,000
```

Another example:

```text
Payment PAY-002: €15,000 to supplier
Allocated to:
- Supplier Invoice INV-S001: €10,000
- Supplier Invoice INV-S002: €5,000
```

This allows flexible accounting without forcing every payment to match exactly one invoice.

### Expenses

`expenses` track costs that may need to be analyzed separately or allocated into inventory cost.

Examples:

- customs
- storage
- delay fees
- repairs
- transport
- advertising
- insurance

An expense can be linked to:

- supplier order
- shipment
- container
- house unit
- invoice

This helps calculate the real landed cost of a house.

### Ledger Accounting (Immutable Journaling)

While invoices and payments track the operational state of money, the ledger provides the **immutable accounting backbone**. This is based on a double-entry bookkeeping model.

- `ledger_accounts`: The chart of accounts (e.g., "Cash at Bank", "Accounts Receivable", "Sales Revenue").
- `ledger_entries`: A header for a journal entry, representing a single financial event.
- `ledger_entry_lines`: The individual debit and credit lines. Every entry must balance (debits = credits).

The ledger is "downstream" from operations. When an invoice is issued or a payment is received, the system generates ledger entries. This separation allows the business to change operational statuses (like "marking an invoice as disputed") without breaking the historical audit trail of financial postings.

---

## 12. Documents, Notes & Audit

### What this domain manages

This domain gives traceability to the entire business.

Almost every important entity can have:

- documents
- notes
- audit logs

### Table map for this domain

- `documents`: binary/file metadata attachment layer by polymorphic entity reference.
- `notes`: internal human context/comments by polymorphic entity reference.
- `audit_logs`: immutable action/history records for critical state and data changes.

Operational reliability tables (cross-flow support):

- `idempotency_keys`: deduplication keys for command/API retries so write operations execute once.
- `outbox_events`: durable event queue records for asynchronous side effects (notifications, integrations, background workflows).

How it fits in the business:

- `documents`, `notes`, and `audit_logs` make operational decisions explainable and reviewable later.
- `idempotency_keys` and `outbox_events` make multi-step flows resilient under retries, failures, and eventual consistency.

Instead of creating separate document tables for every domain, the system uses a generic pattern:

```text
entity_type + entity_id
```

This allows one document, note, or audit table to be connected to many different parts of the business.

### Documents

`documents` store files related to business objects.

Examples:

- supplier quote PDF
- supplier invoice
- customer invoice
- bill of lading
- customs document
- container photos
- signed contract
- payment proof
- delivery note

A document can be linked to:

- supplier
- supplier quote
- supplier order
- shipment
- container
- house unit
- lead
- customer
- customer order
- invoice
- payment
- configuration

### Notes

`notes` allow users to write internal comments on any entity.

Examples:

```text
Lead note: Customer prefers delivery in July.
Supplier order note: Supplier confirmed production delay of 10 days.
House unit note: Minor scratch on left panel, photo uploaded.
Invoice note: Waiting for corrected customs invoice.
```

### Audit Logs

`audit_logs` are used to record important system actions.

Examples:

- supplier quote accepted
- supplier order status changed
- invoice created
- payment recorded
- reservation created
- customer order cancelled
- document uploaded
- house unit marked as delivered

An audit log stores:

- entity type
- entity ID
- action
- field changed
- old value
- new value
- change summary
- user who made the change
- IP address
- timestamp

This supports accountability and makes it possible to reconstruct what happened later.

### Technical Reliability & Event Integrity

To ensure the system is "hardened" for high-concurrency and distributed environments, two key patterns are used:

1. **Idempotency (`idempotency_keys`)**: Prevents the same action from being executed twice (e.g., double-charging a customer or creating duplicate orders). The app stores a key for every write request; if the same key is sent again, the system returns the previous result instead of performing the action again.
2. **Transactional Outbox (`outbox_events`)**: Guarantees that side effects (like sending a Slack notification or syncing data to an external CRM) happen eventually, even if the primary database transaction succeeds but the network fails. Events are written to the `outbox_events` table in the same transaction as the business data, then processed asynchronously by a background worker.

---

## 13. Billing, Plans & Entitlements

### What this domain manages

This domain manages the SaaS monetization layer, governing what features and limits apply to each organization.

### Table map for this domain

- `plans`: definitions of available subscription packages (e.g., "Basic", "Pro", "Enterprise").
- `plan_features`: the matrix of features and limits associated with a plan.
- `organization_subscriptions`: the active subscription record for a tenant.
- `feature_entitlements`: the effective, resolved permissions and limits for an organization (can be derived from a plan or overridden manually).
- `usage_counters`: metered snapshots for tracking usage against limits (e.g., "number of houses sold this month").

How it fits in the business:

- The system is a **Multi-Brand SaaS**. Each brand pays for access based on their selected plan.
- Entitlements act as a "gatekeeper" for features (e.g., "Custom Configurations" might be a Pro feature).
- Usage counters allow for metered billing or soft/hard limits on business volume.

---

## 14. Main End-to-End Business Flows

## Flow A: Buying Houses from Supplier

```text
1. Supplier sends quote
2. Quote is registered as supplier_quote
3. Quote lines define house models, configurations, quantities, and prices
4. Business reviews quote
5. Quote is accepted or rejected
6. If accepted, supplier_order is created
7. Supplier_order_lines define the houses being purchased
8. Planned house_units are created from the order lines
9. Supplier produces the houses
10. Supplier order status moves through production and shipping stages
```

Key tables:

- `suppliers`
- `supplier_quotes`
- `supplier_quote_lines`
- `supplier_orders`
- `supplier_order_lines`
- `house_units`

---

## Flow B: Shipping Houses in Containers

```text
1. Supplier order is ready to ship
2. Shipment is created
3. One or more containers are assigned
4. House units are linked to containers
5. Shipment tracking events are recorded
6. Containers arrive at destination port
7. Customs clearance happens
8. Houses are delivered to warehouse
9. House unit statuses become in_stock
```

Key tables:

- `shipments`
- `containers`
- `container_house_units`
- `shipment_tracking_events`
- `warehouse_locations`
- `house_units`

---

## Flow C: Generating and Managing Leads

```text
1. Business advertises on Google, Meta, or other channels
2. A person submits a form or contacts the business
3. A lead is created
4. Lead is assigned to a salesperson
5. Salesperson records calls, emails, messages, and follow-ups
6. Lead is qualified or lost
7. If the lead wants to buy, they can be linked to a desired model/configuration
8. Lead can become a customer
```

Key tables:

- `marketing_channels`
- `marketing_campaigns`
- `leads`
- `lead_activities`
- `lead_interests`
- `customers`

---

## Flow D: Reserving a House Before It Is in Stock

```text
1. Lead or customer wants a house
2. Business checks current and incoming inventory
3. If a matching house exists, reserve a specific house_unit
4. If no exact physical unit is assigned yet, reserve by model/configuration
5. Reservation stays active until deposit, expiry, release, or conversion to sale
6. Once sale is confirmed, reservation links to customer order line
7. Later, a specific house_unit can be assigned if needed
```

Key tables:

- `leads`
- `customers`
- `house_models`
- `product_configurations`
- `house_units`
- `inventory_reservations`
- `customer_orders`
- `customer_order_lines`

This flow is critical because the business does not want to wait until stock arrives before selling. At the same time, it needs to avoid overselling or losing track of which customer is waiting for which house.

---

## Flow E: Selling to a Customer

```text
1. Lead becomes a customer
2. Customer order is created
3. Customer order lines define house model, configuration, quantity, and price
4. A 50% deposit is required by default
5. Customer invoice is issued
6. Customer pays deposit
7. Payment is allocated to invoice or installment
8. Order is confirmed
9. House unit is assigned or reservation is maintained until stock arrives
10. House is delivered
11. Order is completed
```

Key tables:

- `customers`
- `customer_orders`
- `customer_order_lines`
- `inventory_reservations`
- `house_units`
- `invoices`
- `invoice_installments`
- `payments`
- `payment_allocations`

---

## Flow F: Managing Supplier and Other Invoices

```text
1. Supplier, logistics provider, customs agent, or other party sends invoice
2. Invoice is registered
3. Invoice is linked to supplier order, shipment, container, or house unit if relevant
4. Installments are created if invoice is not paid all at once
5. Payments are recorded
6. Payments are allocated to invoice/installments
7. Invoice status updates as partially paid or paid
```

Key tables:

- `invoices`
- `invoice_lines`
- `invoice_installments`
- `payments`
- `payment_allocations`
- `expenses`

This supports the fact that one supplier order may generate many invoices from different parties.

---

## Flow G: SaaS Subscription Lifecycle

```text
1. Organization signs up for the platform
2. Organization selects a plan (e.g., "Pro")
3. organization_subscription is created with status trialing or active
4. feature_entitlements are resolved based on the selected plan
5. System gates access to features based on entitlements
6. As business volume grows, usage_counters track activity
7. At the end of the period, subscription is renewed or moved to past_due
```

Key tables:

- `organizations`
- `plans`
- `organization_subscriptions`
- `feature_entitlements`
- `usage_counters`

---

## Flow H: Accounting Ledger Posting

```text
1. A financial event occurs (e.g., Customer payment received)
2. Operationally, the payment is recorded and allocated to an invoice
3. System triggers a ledger posting (manual or automatic via outbox)
4. A ledger_entry is created as a journal header
5. At least two ledger_entry_lines are created:
   - Debit: "Cash at Bank" account
   - Credit: "Accounts Receivable" account
6. The journal is permanently stored for audit and financial reporting
```

Key tables:

- `ledger_accounts`
- `ledger_entries`
- `ledger_entry_lines`
- `payments`
- `invoices`

---

## 15. Why the System Is Designed This Way

### 1. Inventory is the center of the business

The most important operational question is:

> What houses do we have, what houses are coming, and who are they for?

That is why `house_units` is central.

### 2. Future inventory must be sellable

The business often needs to sell or reserve houses before they are physically in stock.

That is why the system supports:

- planned units
- ordered units
- incoming units
- model-level reservations
- specific-unit reservations

### 3. Supplier orders and customer orders are similar but not identical

Both involve:

- invoices
- payments
- installments
- documents
- status changes
- audit logs

But they are different flows.

Supplier orders are about buying inventory.
Customer orders are about selling inventory.

The ERM keeps them separate while connecting them through inventory.

### 4. Configuration must be planned from the beginning

Even if configuration is not fully digital today, the system is ready for it.

The slot/option model allows the business to later build:

- internal configurator
- customer-facing configurator
- price calculator
- supplier quote generator
- proforma invoice generator
- configuration-based inventory matching

### 5. Financial records must be flexible

Invoices can come from many parties and can be paid in installments.

The system supports:

- unlimited invoices per order
- payable and receivable invoices
- installment schedules
- partial payments
- payment allocation to one or multiple invoices
- extra costs and landed cost tracking

### 6. Auditability is required

Every important action should leave a record.

The audit system allows the business to know:

- who changed something
- what changed
- when it changed
- what the previous value was
- what the new value is

### 7. Reliability and Scalability are built-in

The SaaS architecture ensures that brands are isolated (RLS), while the reliability patterns (Idempotency, Outbox) ensure that the system remains consistent even during failures or high load. The immutable ledger provides a "source of truth" for finance that is decoupled from fast-moving operational statuses.

---

## 16. Example Scenario

### Step 1: Supplier Quote

The supplier sends a quote for:

```text
2 × 20ft Apple Cabin
1 × 20ft Empty House
```

The business enters this as a `supplier_quote` with three total units across quote lines.

### Step 2: Supplier Order

The business accepts the quote.

A `supplier_order` is created.

Three planned `house_units` are created:

```text
HU-001: 20ft Apple Cabin — ordered
HU-002: 20ft Apple Cabin — ordered
HU-003: 20ft Empty House — ordered
```

### Step 3: Marketing

The business runs Google and Meta ads.

A lead submits a form asking for a 20ft Apple Cabin.

The lead is created and assigned to a salesperson.

### Step 4: Reservation

The salesperson sees that two Apple Cabins are already ordered but not yet in stock.

The lead reserves one Apple Cabin.

The reservation can point to HU-001 directly, or it can reserve one Apple Cabin configuration without assigning the exact physical unit yet.

### Step 5: Customer Order

The lead decides to buy.

The lead becomes a customer.

A customer order is created with a 50% deposit requirement.

A customer invoice is issued with installments:

```text
Installment 1: 50% deposit
Installment 2: 50% before delivery
```

### Step 6: Shipping

The supplier ships the houses in a container.

The container is linked to the shipment and the house units.

Tracking events are recorded until arrival.

### Step 7: Delivery

The container arrives, customs clears, and the house is delivered to the warehouse or directly to the customer.

The house unit status moves from:

```text
incoming → in_stock → sold → delivered
```

The customer order is completed.

All invoices, payments, documents, and audit logs remain connected.

---

## 17. Operational Questions the System Can Answer

With this ERM, the business can answer questions such as:

### Inventory

- How many houses are in stock?
- How many houses are incoming?
- Which houses are inside each container?
- Which houses are already reserved?
- Which houses are available for sale?
- Which houses are delayed?
- What configuration does each house have?

### Sales

- Which leads are interested in which houses?
- Which leads need follow-up today?
- Which customers paid their deposit?
- Which customer orders are waiting for stock?
- Which customer orders are ready for delivery?

### Procurement

- Which supplier quotes are pending review?
- Which quotes were accepted or rejected?
- Which supplier orders are in production?
- Which orders are shipping now?
- Which supplier order created which house units?

### Finance

- Which supplier invoices are unpaid?
- Which customer invoices are overdue?
- Which installments are due this week?
- Which payments were received?
- Which payments were made?
- What is the landed cost of each house?
- What is the gross profit per house?

### Logistics

- Which containers are in transit?
- What is the ETA of each shipment?
- Which containers are delayed?
- Which house units are in each container?

### Audit

- Who accepted a supplier quote?
- Who changed an order status?
- Who recorded a payment?
- When was a reservation created or released?
- What documents were uploaded for a shipment or invoice?

### SaaS Billing

- Which organizations are on the "Pro" plan?
- Which tenants have exceeded their house sales limit?
- When do specific subscriptions expire?

---

## 18. Suggested Implementation Notes

### Start with the core operational flow

The first version of the system should focus on:

1. house models
2. supplier orders
3. house units
4. containers
5. leads
6. reservations
7. customer orders
8. invoices and payments
9. audit logs

The full configurator can be built gradually.

### Do not skip house units

Even if it feels easier to only track quantities, the business needs `house_units` because each physical house can have a different status, container, reservation, customer, cost, and delivery history.

### Use snapshots for historical accuracy

Configurations, prices, and order details should be snapshotted at the moment of quote/order/sale.

This prevents old orders from changing when the catalog is updated.

### Separate language from market logic

Language and market are related but not the same.

Use translation tables for customer-facing content and use market-aware tables for pricing, currency, and availability.

The application should resolve content with a fallback chain such as:

```text
requested language → market default language → system default language
```

The application should resolve sales pricing from market-specific price tables rather than from live FX conversion.

### Keep invoices generic

Invoices should not be limited to supplier or customer invoices only.

The business receives invoices from many parties, so a generic invoice model is more flexible.

### Make audit logging automatic

The application should automatically write audit logs when important records are created, updated, deleted, or have status changes.

### Implement Idempotency and Outbox early

Financial and status-heavy systems benefit greatly from early adoption of reliability patterns. This prevents data corruption during network failures or API retries.

---

## 19. Summary

This ERM describes a business where modular houses move through a complete lifecycle:

```text
Advertise → Generate leads → Reserve demand → Buy from supplier → Ship in containers → Track inventory → Sell to customer → Collect payments → Deliver house → Audit everything
```

The central object is the `house_unit`, because it connects what the business buys, what it ships, what it stores, what it reserves, and what it sells.

The system is designed to support the current business reality while also preparing for the future goal of a digital configurable product catalog.

It gives the business control over:

- supplier procurement
- future and current inventory
- customer demand
- lead follow-up
- reservations
- customer orders
- supplier and customer invoices
- installments
- payments
- logistics
- documents
- audit history
- SaaS monetization and feature gating
- Immutable financial accounting

The result is a single operational database that can power the internal dashboard and eventually support customer-facing configuration, quoting, ordering, and reporting.
