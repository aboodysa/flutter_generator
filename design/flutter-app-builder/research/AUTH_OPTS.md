# Auth options for the generated Flutter apps — research report

> Research date: 2026-08-16 · Method: author knowledge of Supabase/Firebase/Clerk/Keycloak/JWT
> and biometrics/passkeys (2026). **Web search disabled this run (hangs in this env)** — provider
> facts below are from memory and MUST be re-verified at go-live; marked accordingly in §8.
> Scope: what the **generator** should be able to emit for real authentication, and how that maps
> onto the existing MF2 demo-auth (`builder/src/generators/auth.ts`) and CAPABILITIES.md MF2.
> This is research + future design only — **no code changes**. Report references the repo as of
> today's state (working tree has unrelated in-flight MF3/attachment work, untouched).

## 0. Where MF2 sits today — what a real provider must slot into

The generator's current auth is deliberately **offline and structural** (0% LLM):

- `builder/src/generators/auth.ts` (`AuthSessionGenerator`) emits two files:
  - `lib/core/session.dart` — the `Session` singleton (`isAuthenticated`, `role`, `actorId`,
    `tenantId`, `displayName`; `signIn`/`signOut`) plus the demo persona list `kPersonas`. Header
    comment is explicit: *"MF2: in-memory offline session — the app's auth boundary for this
    iteration. No network/no persistence: personas are demo accounts."*
  - `lib/core/auth_login_screen.dart` — a demo login: one tappable `AppListCard` per persona.
    Tapping calls `Session.instance.signIn(...)` then `context.go(kHomeRoutes[role] ?? '/')`.
- Who consumes `Session` (nothing else knows the auth exists):
  - `route.ts` emits `guardPath()` + `kHomeRoutes` (role→home entity route); redirects to `/login`
    when unauthenticated, and rejects any path outside the role's home/`allow` prefixes.
  - `repository_impl.ts` emits `_inScope(e)` (read filter) and `_stampTenant(e)` (write stamp) so
    every CRUD op is isolated to `Session.instance.tenantId` on tenant-scoped entities.
  - `crud_form.ts` pre-fills `tenantId` from `Session.instance.tenantId`.
  - `operations.ts::authPersonas` derives personas deterministically (explicit `auth.personas`
    win; else one per role over `TENANT_POOL = ["acme","globex"]`).
- Contract (CAPABILITIES.md MF2): *"Auth + roles: demo login (multiple personas), tenant-scoped
  repos (actorId/tenantId on every read/write)"*; acceptance: *"Every repo read/write carries
  tenantId + actorId"*. `validate.ts` enforces the `[tenant]` gate **on the generated code** — a
  repo that lost its scoping while the IR claims a `tenantId` field fails validation (same
  philosophy as `[money]`, `[oracle]`, `[secrets]`).

**Opinion, up front:** the `Session` facade is the perfect seam. A real provider should **not
change any downstream consumer** — it only needs to answer "who is this user, what role, what
tenant" exactly the way `signIn(role, actorId, tenantId)` already does. The right move is the
payments trick (`research/PAYMENTS_OPTS.md` §5): emit an **`AuthProvider` port + `MockAuthProvider`**
(byte-for-byte today's behavior) plus optional real **adapter shells**, switched by a `provider:`
IR attribute. Nothing is deleted; live identity flows in behind the port.

---

## 1. 2026 ground truths (shapes every provider decision)

| Fact | Detail | Design impact |
|---|---|---|
| **JWT is the default, the token is not the auth** | All four IdPs mint signed JWTs; the app validates signature (server-side; or RS256 + cached JWKS if it must verify offline), or trusts claims and lets the backend re-verify | Generator maps claims → `role/actorId/tenantId`; it never re-implements signature math client-side except the RS256+JWKS offline case |
| **Roles live in signed claims, never the client** | Supabase `app_metadata`/custom claims, Firebase custom claims (admin-SDK set), Clerk custom claims, Keycloak `realm_access` roles | Role is a *server-set* claim; the generator emits a claims→Session mapper — "role" can't be user-editable in-app |
| **Multi-tenancy is first-class everywhere** | Supabase RLS + `auth.uid()`/`auth.jwt()`; Clerk Organizations; Keycloak realms; Firebase multi-tenancy (Identity Platform) | `tenantId` maps 1:1 to IdP tenant primitives — the generated `_inScope`/`_stampTenant` translate to server-side row security |
| **Passkeys won the password fight** | WebAuthn/FIDO2 passkeys (platform authenticators: Keychain/keystore/Windows Hello) are the 2026 default ask; every provider here exposes them | Platform authenticator *is* the biometric gate, and its challenge-response is server-verifiable — unlike `local_auth` booleans |
| **`local_auth` proves the device, not the person** | Face/Touch ID + Android BiometricPrompt return a `bool` — device-local, replayable, not identity to a server | Biometric is an **app-unlock layer** (unlocks a stored refresh token in Keychain/keystore), never the IdP credential by itself — the SAMA/GCC banking norm is PIN + biometric unlock |
| **Secrets never ship in Dart** | `google-services.json`/`GoogleService-Info.plist`, Supabase **anon** key, Clerk publishable key are public; service keys / admin SDKs / HS256 shared secrets are server-only | Mirrors the repo's `[secrets]` gate + `approve.ts` trust boundary; any privileged provider flow needs the P9 backend seam |

---

## 2. Provider deep-dives

### 2.1 Firebase Auth (Google-managed)
- **What:** the most turnkey identity stack: email/password, phone (reCAPTCHA/Play Integrity gated),
  OAuth providers, **anonymous auth**, plus MFA (TOTP/SMS) and **passkeys via Identity Platform**
  (Blaze). Tight platform tie-ins (FCM, Firestore security rules `request.auth`).
- **Integration surface:** first-party `firebase_auth`; per-platform config files; session persists
  locally by default; `auth.currentUser.getIdToken()` for the JWT.
- **Fit:** broad but **Google/Play-dependent** — in SA/GCC, phone-auth depends on Play services and
  reCAPTCHA behaves differently; fine for global B2B lanes, weakest for pure-SS0/on-prem asks.
- **Offline-first testability:** good on Android/web (mock auth apps), more ceremony on iOS.
- **Generator-emittable:** a `FirebaseAuthAdapter` behind the port; `idToken` → claims →
  `role/actorId/tenantId`. Effort **M** (heavy platform config, not the auth logic). Multi-tenancy
  via Identity Platform only (enterprise plan).
- **Impact:** H breadth, M for the tenant-first B2B lane (RLS-style enforcement is Firestore, not
  Postgres — less natural for our `tenantId`-on-row model).

### 2.2 Supabase Auth (GoTrue-based, Postgres-first)
- **What:** email/password, magic links, phone (via message providers), OAuth, **MFA (TOTP)**,
  **SSO (SAML/OIDC, enterprise)**, and **passkeys**; hosted (EU/US regions) or self-hosted.
  Minted JWT carries `sub`, `role` (`anon`/`authenticated`), and custom claims from
  `app_metadata`/`user_metadata`.
- **Killer fit for this generator:** **Row Level Security.** One `tenantId` column + a
  `tenant_id = auth.jwt()->>'tenantId'` policy is *exactly* the generated `_inScope`/`_stampTenant`
  model, lifted to the server. `supabase_flutter` gives `onAuthStateChange`,
  `signInWithPassword`/`signInWithOAuth`/`signInWithIdToken`, refresh-token handling and
  realtime — which also rides the persistence capability (MF6 outbox, F2) cleanly.
- **Offline-first testability:** excellent — local/self-hosted instance, anon key is public,
  offline JWTs decode without network (claims trust for demo; RLS still guards on the server).
- **Generator-emittable:** a `SupabaseAuthAdapter` (small — `supabase_flutter` API matches the
  port), plus optionally **emitted RLS SQL** (a `tenant_id` policy per tenant-scoped entity).
  Effort **S–M**. Self-host path also removes region/compliance concerns.
- **Impact:** H for the Postgres + tenant-scoped repo lane; H for the B2B samples.

### 2.3 Clerk (headless hosted auth)
- **What:** hosted, developer-first: sessions, MFA, **passkeys**, social OAuth, impersonation, and
  **Organizations** (multi-tenant) — the closest to a hosted Keycloak-for-frontend. First-party
  `clerk_flutter` (email/phone/OAuth/passkeys) and `clerk_dart`; emits JWTs with optional custom
  claims; web model is a signed `__session` cookie.
- **Fit:** fastest to a polished login UI (prebuilt components) — but **no data layer**: no RLS,
  bring-your-own-backend for anything row-level. Org roles (admin/member) map to `role` neatly.
- **Offline-first testability:** good for flows (mock/token fixtures), but the value is the hosted
  surface, not offline determinism.
- **Generator-emittable:** `ClerkAuthAdapter` (Org membership → `role`, org id → `tenantId`).
  Effort **S–M**. Not self-hostable (a constraint for on-prem/compliance asks).
- **Impact:** M–H for demo/sales velocity; L for offline/self-host.

### 2.4 Keycloak (self-hosted OIDC/OAuth2/SAML IdP)
- **What:** the open-source IdP: realms (each a tenant), realm/client roles, fine-grained
  authorization, MFA, user federation/LDAP, token introspection/revocation. Standard mobile flow is
  **OIDC Authorization Code + PKCE** via `openid_client`/`keycloak_flutter`; JWTs carry
  `realm_access.roles`.
- **Fit:** the enterprise/compliance and **on-prem** choice; **realm-per-tenant maps 1:1 to the
  generated `tenantId`** — arguably the cleanest tenant primitive of all four. Heavier to run
  (JVM, Postgres) — natural for the P9 backend era rather than an adapter-first slice.
- **Offline-first testability:** self-host = full control, refresh tokens work offline once issued;
  determinism is only as good as your fixture strategy.
- **Generator-emittable:** a `KeycloakOidcAdapter` (standard PKCE + `realm_access`/custom-claim →
  role/tenant mapping). Effort **M–L**; worth it when a sample needs real SSO.
- **Impact:** H for enterprise/on-prem/compliance; L for demo velocity.

### 2.5 DIY JWT / OIDC (the P9 default)
- **What:** the P9 NestJS backend signs its own JWTs (`HS256` shared secret or `RS256` keypair) —
  claims `sub`/`role`/`tenantId` mirror the IR; app stores the token and maps claims as usual.
- **Trust pitfalls:** an HS256 secret on the device defeats the signature — so either
  RS256 + cached JWKS (offline-verifiable) or treat offline claims as *idempotent-but-unverified*
  and let the backend re-verify on every privileged op (the honest offline-first stance, same as
  MF6's "server wins on approved" conflict rule). Refresh rotation + revocation are DIY.
- **Fit:** not an adapter — it's the **fallback contract** the `AuthProvider` port is written
  against, and the natural target for the generated apps when no third-party IdP is wanted.
- **Impact:** H once P9 exists; today it's a spec, not code.

### 2.6 Biometric & passkeys (2026) — the layer above the IdP
- **Passkeys (WebAuthn/FIDO2):** challenge-response signed by a platform authenticator; verifiable
  by the relying party (Supabase/Firebase-Identity-Platform/Clerk/Keycloak all support). In Flutter:
  `passkey_flutter`/`flutter_webauthn` (or the provider SDK's built-in passkey flow). iOS/Android
  route biometric through the authenticator automatically — **this is the correct "biometric auth"
  for server identity in 2026**.
- **App-lock biometric (`local_auth` + `flutter_secure_storage`):** Face ID/Touch ID/BiometricPrompt
  gate access to a stored refresh token (Keychain/EncryptedSharedPreferences). Biometric is a
  *bool gate* — pair it with a PIN fallback (the GCC banking norm) so a lost face/fingerprint or a
  fresh-restore re-provisions the token. Never send the bool anywhere; it authenticates the local
  keychain read, not the user.
- **What the generator can emit deterministically:** the app-lock layer (local_auth + secure
  storage + PIN fallback) is pure client code with a `MockBiometric` for goldens/CDP; passkeys
  need the IdP adapter + network but the **UI/state** is emittable. Do app-lock first, passkey
  surface second.

---

## 3. Provider comparison table

| Provider | Hosted / self-host | Tenant primitive | MFA / passkeys | Flutter SDK | RLS / row-level | Offline story | Generator effort |
|---|---|---|---|---|---|---|---|
| **Firebase Auth** | Hosted only | Multi-tenancy (Identity Platform, enterprise) | MFA ✓, passkeys ✓ | First-party `firebase_auth` | Firestore rules (no Postgres) | Good (Android/web mocks) | **M** (platform config) |
| **Supabase Auth** | Hosted **or self-host** | `tenantId` row + RLS | MFA (TOTP) ✓, SSO ✓, passkeys ✓ | First-party `supabase_flutter` | **Yes — RLS `auth.jwt()->>'tenantId'`** | Excellent (decode offline, local/self-host) | **S–M** |
| **Clerk** | Hosted only | Organizations | MFA ✓, passkeys ✓ | First-party `clerk_flutter` | No (BYO backend) | Good (token fixtures) | **S–M** |
| **Keycloak** | **Self-host** (or hosted) | **Realms** | MFA ✓, passkeys (WebAuthn) ✓, SAML ✓ | `openid_client`/`keycloak_flutter` | Via adapter + your app SQL | Full control; fixture-driven | **M–L** |
| **DIY JWT / OIDC (P9)** | Your backend | claim `tenantId` | whatever you build | none needed | via backend | Honest offline claims; server re-verifies | **S** (port contract only) |

---

## 4. Trust / secrecy posture (non-negotiable, mirrors PAYMENTS_OPTS §4)

1. **No IdP secrets in generated Dart.** Service keys, admin SDKs, HS256 shared secrets never ship
   client-side; only *publishable/anon* keys may appear, and even those are better injected via
   runtime config. The existing `[secrets]` gate + `approve.ts` trust boundary apply unchanged.
2. **Role/tenant are signed claims, not UI state.** The mapper reads them from the verified token;
   the generated login screen can offer *demo* personas but never lets a user type a role.
3. **`[auth]` validator gate (validate.ts):** `provider` values are allowlisted; a real provider
   implies the port + `MockAuthProvider` are present (offline build/test always works); `biometric`
   implies `secureSession`; claim paths are validated against the IR role vocabulary. Same
   philosophy as `[tenant]`/`[money]`/`[oracle]` — enforced on generated output.
4. **Biometric is never the identity.** `local_auth` gates a keychain read; only the passkey /
   IdP-issued token proves identity to a server.

---

## 5. Recommended generator design (future; no code today)

### 5.1 `AuthProvider` port + `MockAuthProvider` (deterministic, offline truth)
```dart
// core/auth/auth_provider.dart  (header: // [generated] generator=auth.v2 ownership=generated)
abstract class AuthProvider {
  Future<AuthResult> signIn(SignInRequest req);          // password | oauth | passkey
  Future<void> signOut();
  Future<String?> token();                                // signed JWT, null when signed out
  Future<bool> isSignedIn();
}
class MockAuthProvider implements AuthProvider { /* personas from kPersonas — today's behavior */ }
```
The `AuthResult` maps claims → `role/actorId/tenantId` and calls the **existing** `Session.signIn`.
`guardPath()`, `_inScope`/`_stampTenant`, and the CRUD form keep reading `Session.instance` —
**downstream output stays byte-identical**; only `session.dart`/`auth_login_screen.dart` grow a
provider wire-up. `AuthLoginScreen` stays as the persona picker when `provider: demo|none` and
becomes a real form only when a provider is set.

### 5.2 Claims → Session mapper (`identity.dart`)
Pure, testable: `IdentityClaims{sub, role, tenantId}`; a `claimsMapper(provider, jwt)` helper
resolves `tenantClaim` and `roleClaim` paths per provider (Supabase `app_metadata.role` /
`auth.jwt()->>'tenantId'`; Keycloak `realm_access.roles` + `$tenant`; Clerk org role). Unit-testable
with canned JWTs — 0% LLM, deterministic.

### 5.3 IR shape (additive to `AuthModel`, types.ts)
```
attributes.auth: {
  roles, home, allow, personas, loginEntity,          // existing MF2 — unchanged
  provider:    "none" | "demo" | "supabase" | "firebase" | "clerk" | "keycloak" | "oidc",
  tenantClaim?: string,   // claim path holding tenantId (default "tenantId")
  roleClaim?:   string,   // claim path holding role (default "role")
  secureSession?: boolean,// persist Session token to flutter_secure_storage
  biometric?:    boolean, // app-unlock layer: local_auth + secure storage + PIN fallback
}
```
Rule (union of the payments §5.5 and PERSISTENCE_ARCH rules): `provider: none|demo` emits exactly
today's code; any real provider **always also emits port + mock**, so every generated app builds,
runs, goldens and CDP-tests offline; the real adapter activates only when runtime config/endpoint
is present.

### 5.4 Biometric + secure-session emission
- `secureSession: true` → `Session` (or a `SessionStore`) persists token/identity via
  `flutter_secure_storage` (Keychain / EncryptedSharedPreferences) and restores on boot; goldens
  keep the in-memory default (mock storage in tests).
- `biometric: true` → app-lock screen: biometric-or-PIN unlocks the stored refresh token before
  the guarded router proceeds; `MockBiometric` for tests. This is SAMA-style app locking, and it is
  the only piece that is 100% client-side today.
- Passkey flows are per-adapter (Supabase/Firebase/Clerk/Keycloak expose them) — emit the
  **state/UI**, let the SDK do the authenticator dance.

---

## 6. Which adapters to ship first (recommendation)

1. **Supabase** — the natural first adapter: hosted-or-self-host, RLS mirrors the generated
   `tenantId` row model (the acceptance line "every read/write carries tenantId" lifts to the
   server), anon key is safe client-side, offline decoding is honest, `supabase_flutter` is mature.
   *Pair with emitting RLS SQL per tenant-scoped entity.*
2. **Firebase** — second: broadest identity breadth, but the Postgres gap and Play-services
   regional friction make it a breadth play, not the tenant-first lane.
3. **Keycloak** — third, and really a **P9-backend-era** item: realm-per-tenant is the cleanest
   primitive and the enterprise/compliance answer, but the infra weight belongs beside the backend.
4. **Clerk** — fourth: highest demo velocity, but hosted-only and no row-level layer; adopt when a
   sample's brief demands the fastest real login.
DIY/OIDC is the **P9 default contract** the port is written against, not a shipped adapter.

---

## 7. Priority roadmap

**Now (offline, deterministic, in `builder/src`):**
- Refactor `auth.ts` behind the port: `AuthProvider` + `MockAuthProvider` (+ `identity.dart`
  mapper) — **zero behavior change, all existing auth tests stay green**, byte-identical output
  for `provider: demo`.
- `secureSession` (flutter_secure_storage) + `biometric` app-lock (local_auth + PIN fallback) with
  mock storage/biometric for goldens/CDP.
- `attributes.auth.provider|tenantClaim|roleClaim` + `[auth]` validator gate; validate on ≥2
  sample apps of different types per the capability contract; iPhone goldens + CDP unlock flow.

**P9 / backend era (server-side, keeps secrets off-device):**
- Supabase (first) and Keycloak (when SSO/on-prem shows up) adapter activation behind the port;
  emitted RLS SQL / realm provisioning.
- DIY JWT signing in the generated NestJS module; refresh rotation + revocation; `AuthProvider`
  HTTP adapter; MF6 outbox + refresh-retry on recovery.
- Passkeys surfaced through whichever IdP the app is bound to; SAML/OIDC SSO where a sample needs
  enterprise federation.

**Acceptance checklist for the capability:**
- [ ] `provider: none|demo` output is byte-identical to today (no regressions on the 4 sample apps).
- [ ] Real adapters compile offline without keys; tests/goldens/CDP use the mock; `[auth]` gate,
      `npm run typecheck:builder`, and `validate.ts` all pass.
- [ ] role/tenant never readable-writable in-app — only from signed claims (mapper unit tests with
      canned JWTs).
- [ ] `secureSession` + `biometric` gate the guarded router; unlock flow CDP-tested on iPhone-sized
      goldens with real text.
- [ ] No IdP secret appears in any generated file (secrets gate enforced).

---

## 8. Sources & follow-ups

Written from author knowledge (2026-08-16); web search was disabled this run, so **verify at
go-live**:
- Supabase: docs.supabase.com/auth (RLS + `auth.jwt()`, MFA, SSO, passkeys), pub.dev
  `supabase_flutter`.
- Firebase: firebase.google.com/docs/auth, Identity Platform passkeys/multi-tenancy, `firebase_auth`.
- Clerk: clerk.com/docs (organizations, passkeys, custom claims), `clerk_flutter`.
- Keycloak: keycloak.org (realm roles, WebAuthn, OIDC/PKCE), `openid_client`.
- Biometric/passkeys 2026: W3C WebAuthn/FIDO2, `local_auth` + `flutter_secure_storage` patterns,
  SAMA mobile-app guidance (PIN + biometric unlock norm in GCC banking/government apps).

Open items to confirm before implementing adapters: exact Supabase/Keycloak passkey maturity in
their Flutter SDKs; Firebase phone-auth behavior on SA/Play-free devices; Clerk `__session` cookie
vs mobile-token story for Flutter; and whether any sample brief genuinely needs SSO/SAML (drives
Keycloak priority).

---

*End of report. Research only — no generator or Flutter code changed.*
