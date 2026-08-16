# WhatsApp Routing System

Incoming WhatsApp messages follow a WhatsApp menu flow: the customer chooses a
department, then a named attendant or option `0` to wait. Waiting assigns the
online attendant with the fewest open conversations in that department. An
assignment remains in place until the conversation is closed.

## First-time setup

1. Apply the database migration: `npx prisma migrate dev`.
2. Start the app with `npm run start:dev`.
3. Create a tenant: `POST /tenants` with `{ "name": "Acme" }`.
4. Put that returned tenant `id` in `DEFAULT_TENANT_ID` in `.env`.
5. Create departments with `POST /departments` and `{ "name", "tenantId", "sortOrder" }`.
6. Create attendants with `POST /attendants` and `{ "name", "email", "tenantId", "departmentId" }`.

Online attendants are eligible for routing. Set an attendant offline with
`PATCH /attendants/:id/status` and `{ "status": "OFFLINE" }`.
If no attendant is online, option `0` puts the customer in that department's
waiting queue. Creating an attendant or setting one back to `ONLINE`
automatically assigns waiting conversations, least-busy first.

Useful read endpoints:

- `GET /attendants?tenantId=:tenantId` — attendants and their open workload
- `GET /departments?tenantId=:tenantId` — the department menu configuration
- `GET /attendants/:id/conversations` — one attendant's open inbox
- `PATCH /conversations/:id/close` — closes a conversation so the next customer message is routed again

## Local Meta webhook

Run Ngrok:
`npx ngrok http 3000 --authtoken=NGROK_AUTHTOKEN`
