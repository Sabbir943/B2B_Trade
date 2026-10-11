# Admin authentication & access control

How a person gets into `/admin` and `/console`, and why the public sign-in
page never mentions staff.

> Read this together with `src/lib/permissions.js` (the permission source of
> truth) and `src/lib/session.js` (the enforcement point).

---

## 1. The core idea

There is **no admin registration**. Admin rights are just data:

| Field | Where | Meaning |
|---|---|---|
| `user.role` | `user` collection | *What* the account may reach (`super_admin`, `staff_support`, …) |
| `user.staff2faAt` | `user` collection | *When* the staff member last proved the 2nd factor (8h window) |
| `user.suspendedAt` / `suspendedReason` | `user` collection | Blocked entirely (sign-in refused, live sessions revoked) |
| `session.token` | `session` collection | better-auth cookie value, stored **signed**: `token.base64(hmac-sha256(BETTER_AUTH_SECRET, token))` |
| `account` | `account` collection | `providerId: "credential"`, `accountId` = user id (string), `userId` = **ObjectId**, `password` = scrypt hash |

Two facts that cost debugging time:

- `account.userId` must be an **ObjectId**. A hex string never matches at
  sign-in → `INVALID_EMAIL_OR_PASSWORD`.
- `session.userId` is a **string**. Delete sessions with `String(userId)`.

---

## 2. Roles

Seven spec roles (`ROLES` in `src/lib/permissions.js`):

```
visitor · company_member (tier: free|silver|gold|platinum) · brand_partner
verification_partner · staff_verifier · staff_support · staff_content
staff_sales · super_admin            ← exactly ONE super_admin allowed
```

* `GRANTS[role]` → permissions the role holds; `super_admin: null` = everything.
* Each staff role ships a fixed `admin.*` set (source: `GRANTS` in
  `src/lib/permissions.js`):

  | Role | Default admin permissions |
  |---|---|
  | `staff_verifier` | `admin.overview`, `admin.verification_queue` |
  | `staff_support` | `admin.overview`, `admin.members`, `admin.inquiries`, `admin.market_entry`, `admin.reports` |
  | `staff_content` | `admin.overview`, `admin.content`, `admin.listings`, `admin.requirements`, `admin.reports` |
  | `staff_sales` | `admin.overview`, `admin.leads`, `admin.inquiries`, `admin.payments`, `admin.reports` |
  | `super_admin` | everything (`null` = no restriction) |

  Note `admin.roles` is not granted to any staff role — only the Super Admin
  gets it unless someone adds it as an extra permission.
* Anything beyond the role's default comes from **extra permissions**
  (`user.extraPermissions[]`), granted per user in `/admin/roles`; the check is
  `can(role, permission) || extraPermissions.includes(permission)`
  (`src/lib/session.js:73`).
* `homeFor(role)` decides where a denied/unauthenticated user is sent:
  `super_admin → /console`, `staff_* → /admin`, workspace roles → `/dashboard`,
  everyone else → `/`.

---

## 3. Login state machine

Entry point: **`/secure-admin-login`** (never linked from the public site).

```
                         ┌────────────────────────────────────────────┐
   GET /secure-admin-login│ state: "password"                         │
                         └───────────────┬────────────────────────────┘
                                         │ submit email + password
                                         ▼
                    authClient.signIn.email()  ──────────────┐
                    (better-auth POST /api/auth/sign-in/email)
                                         │                   │ error
                          ┌──────────────┴─────────┐         ▼
                          ▼                        │   state: "password"
                   getSession() → role             │   INVALID_EMAIL_OR_PASSWORD
                          │                        │   EMAIL_NOT_VERIFIED …
          ┌───────────────┴───────────────┐        │
          │ role not staff                │        │
          ▼                               ▼        │
   authClient.signOut()          state: "code" ────┘  (password step passed,
   error: "staff only"                  │              session cookie now set)
                                        │ useEffect auto-fire
                                        ▼
                       POST /api/staff-2fa/send   (session required)
                                        │
                    ┌───────────────────┼────────────────────┐
                    ▼                   ▼                    ▼
             401 no session      403 not staff          200 {ok,
                                        │                    expiresInSeconds,
                              (page already signed           resendAfterSeconds,
                               the user out,                 devOtp? (devMode only)
                               so this is rare)              }
                                        │
                                        ▼
                          state: "code" · resend cooldown ticking
                          user types 6 digits → POST /api/staff-2fa/verify
                                        │
                    ┌───────────────────┼──────────────────────────┐
                    ▼                   ▼                          ▼
             400 wrong/expired   400 too many attempts       200 {ok:true}
             (attempts left)     (code row deleted)                 │
                                                                     ▼
                                              user.staff2faAt = new Date()
                                              state: "done"
                                              destination = next
                                                || (super_admin ? /console : /admin)
                                              router.push(destination)
```

Anything holding a staff role hits this flow even if it already has a
session: the **layout** redirects to `/secure-admin-login` whenever
`staff2faFreshInDb(email)` is false (stamp missing or older than
`STAFF_2FA_WINDOW_HOURS = 8`).

### 2FA storage

`staff_2fa_codes` collection, one row per email:

```js
{ email, codeHash, attempts, lastSentAt, expiresAt }   // TTL index on expiresAt
```

* 6-digit code, `otpConfig.ttlMinutes` lifetime, `otpConfig.maxAttempts`
  tries before the row is deleted.
* Code is **hashed**, never stored in plain text, never returned in production
  (`devOtp` only appears when SMTP is unconfigured → `devMode`).
* On success the row is deleted and `user.staff2faAt` is stamped — that stamp
  is the only thing the guards look at, so it is revocable (suspend the user)
  and survives restarts.

---

## 4. The guards (in request order)

| # | Where | Check | Failure |
|---|---|---|---|
| 1 | `src/proxy.js` (middleware) | session **cookie present**? (UX shortcut only, no DB hit) | `/admin*` `/console*` → 307 `/sign-in` · `/dashboard*` → 307 `/sign-in?next=…` |
| 2 | `admin/layout.js` / `console/layout.js` | `await requireRole(...)` at the top, **no Suspense**, `instant = false` → the whole segment blocks server-side (real 307, no metadata leak) | |
| 3 | `src/lib/session.js` → `requireAuth` | session exists, not suspended | 307 `/sign-in` · suspended → `/sign-in?suspended=1` |
| 4 | `requirePermission` / `requireRole` | `staffRole ⇒ staff2faFreshInDb(email)` | 307 `/secure-admin-login` |
| 5 | `requirePermission` | `can(role, perm) || extraPermissions.includes(perm)` | 307 `homeFor(role)` |
| 6 | every server action | calls `requirePermission` again | action returns/redirects — **the UI checks are cosmetic** |
| 7 | `src/lib/auth.js` → `databaseHooks.session.create.before` | suspended user may not create a session | sign-in → `401 FAILED_TO_CREATE_SESSION` |
| 8 | API routes (`/api/upload`, `/api/admin/inquiries/export`) | can't redirect → JSON `401/403` | `{ok:false, error}` |

---

## 5. Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/sign-in/email` | — | better-auth password step |
| POST | `/api/staff-2fa/send` | session | 401 without session · 403 non-staff · 503 no SMTP in production · returns `resendAfterSeconds`, `devOtp` in dev |
| POST | `/api/staff-2fa/verify` | session | 400 wrong/expired/too many attempts · 200 stamps `staff2faAt` |
| POST | `/api/upload` | session + fresh 2FA + `admin.content` | 5 MB, PNG/JPEG/WebP/GIF/SVG → `.uploads/`, served by `GET /api/files/[id]`, audit-logged `content.upload` |
| GET | `/api/admin/inquiries/export?kind=inquiries\|reports&format=csv\|xlsx` | session + fresh 2FA + `admin.inquiries` | `Content-Disposition: attachment`, audit-logged |

---

## 6. Creating an admin account

**Bootstrap (once, terminal):**

```bash
# sign up normally at /sign-up first, then:
node scripts/set-role.mjs you@yourdomain.com super_admin   # only ONE allowed
node scripts/set-role.mjs list-roles                       # show roles + tiers
node scripts/list-staff.mjs                                # current staff + 2FA stamps
```

**Steady state (UI):** `/admin/roles` → **Staff accounts** →
`createStaffAccount()` inserts `user` + `account` directly (ObjectId `_id`,
`accountId` = hex, `userId` = ObjectId, scrypt password, `emailVerified: true`
because staff are provisioned, not self-serve). Same table offers
**Deactivate** (role → `company_member`, suspend, revoke sessions) and
**grant/revoke extra permissions**.

Every one of those writes an audit entry
(`staff.account.create`, `staff.account.deactivate`,
`staff.permission.grant|revoke`, `member.suspend|reinstate|approve`,
`listing|requirement.delete`, `inquiry.export.*`) readable at
`/console/audit-log`.

---

## 7. Suspension

`suspendMember(email, reason)` (reason **required**, Super Admin can't be
suspended):

1. `$set suspendedAt / suspendedReason / suspendedBy`
2. delete every `session` row for that user
3. audit `member.suspend`

Enforcement is at **session creation**: `databaseHooks.session.create.before`
returns `false` → sign-in fails with `401 FAILED_TO_CREATE_SESSION`, which the
sign-in page maps to *"This account has been suspended."*
`reinstateMember()` `$unset`s the fields and access returns immediately.

---

## 8. Debugging recipes

```bash
# who is staff, and is their 2FA stamp fresh?
node scripts/list-staff.mjs

# watch the three calls in DevTools → Network on /secure-admin-login:
#   /api/auth/sign-in/email  →  /api/staff-2fa/send  →  /api/staff-2fa/verify

# guard behaviour without a browser
curl -i http://localhost:3000/admin/members                 # 307 → /sign-in

# mint a signed super-admin cookie for curl (local testing only)
node scripts/smoke-session.mjs owner@alliedone.test         # prints COOKIE=…
curl -i -H "Cookie: better-auth.session_token=$COOKIE" \
     http://localhost:3000/api/admin/inquiries/export?format=csv

# full action-level smoke tests (needs `npm run dev`)
SMOKE_COOKIE=… node scripts/smoke-actions.mjs               # content + categories
SMOKE_COOKIE=… node scripts/smoke-actions2.mjs              # members, staff, deletes
node scripts/smoke-suspend.mjs                              # suspension blocks sign-in
node scripts/smoke-upload.mjs                               # /api/upload guard (401/200/403)
node scripts/smoke-cleanup.mjs                              # reset what they wrote
```

Common errors:

| Symptom | Cause |
|---|---|
| `MISSING_OR_NULL_ORIGIN` | Node `fetch` sends `Origin: null` — send `origin: http://localhost:3000` (browsers are fine) |
| `INVALID_EMAIL_OR_PASSWORD` on a hand-made staff account | `account.userId` stored as string instead of ObjectId |
| `FAILED_TO_CREATE_SESSION` | suspended user (by design) |
| Redirect to `/secure-admin-login` on every admin page | `staff2faAt` missing/stale (>8h) or written for a different email |
| 503 from `/api/staff-2fa/send` in production | SMTP env vars missing (`SMTP_*` in `.env` / Vercel) |

---

## 9. File map

```
src/proxy.js                       # guard 1: cookie presence, no staff hints
src/lib/permissions.js             # ROLES, GRANTS, PATH_PERMISSIONS, can(), homeFor()
src/lib/session.js                 # getSessionContext / requireAuth / requirePermission / requireRole
src/lib/staff-2fa.js               # send + verify codes, staff2faFreshInDb(), 8h window
src/lib/auth.js                    # better-auth config: additionalFields, suspended-session hook
src/lib/member-admin-actions.js    # approve / suspend / reinstate / staff CRUD / extra permissions
src/app/secure-admin-login/page.js # the two-step flow (client)
src/app/api/staff-2fa/{send,verify}/route.js
src/app/admin/layout.js            # guard 2 (blocking, no Suspense)
src/app/console/layout.js          # guard 2 (super admin only)
src/app/admin/roles/page.js        # staff account management UI
src/app/admin/members/page.js      # member lifecycle UI
src/app/sign-in/page.js            # member sign-in + suspended messaging
scripts/set-role.mjs | list-staff.mjs | smoke-*.mjs
```
