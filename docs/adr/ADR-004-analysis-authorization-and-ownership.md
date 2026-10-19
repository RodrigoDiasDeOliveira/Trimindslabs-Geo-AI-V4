# ADR-004: Analysis Authorization and Ownership Boundaries

- **Status:** PROPOSED
- **Date:** 2026-10-19
- **Related:** ADR-003-production-authentication-secrets.md

## Context

Geo AI V4 exposes analysis-related API routes that can return job status,
analysis results, and geospatial output. Authentication alone does not
establish whether an authenticated user is authorized to access a specific
analysis.

The security-hardening changes introduce a shared authorization rule for
analysis ownership and tests covering authentication, ownership, and access
to analysis endpoints.

ADR-003 addresses production authentication secrets. This ADR addresses
authorization decisions after the identity has been established.

## Decision proposed

Adopt a centralized authorization policy for access to analysis jobs:

- When authentication is enabled, a request must have an authenticated
  identity with a non-empty username.
- Administrators (`admin`) may access analysis jobs regardless of ownership.
- Operators (`operator` and the legacy role `operador`) may access only
  jobs whose `ownerUsername` exactly matches their authenticated username.
- Unknown roles, missing identities, empty usernames, and jobs without a
  valid matching owner must be denied when authentication is enabled.
- Authorization must be enforced consistently across analysis status,
  job-detail, result, and GeoJSON routes.
- Client-supplied identity or role data must not override the identity
  established by the authentication middleware.

When authentication is disabled, the current authorization helper allows
access. This behavior must be restricted to explicitly approved development
or test configurations. Production must not be deployed with authentication
disabled; production configuration and deployment safeguards must enforce
this requirement.

## Implementation and validation

The implementation introduces `server/analysisAuthorization.ts` and tests
for role and ownership rules, authentication middleware, and HTTP integration
for analysis endpoints.

The recorded local validation for the security-hardening branch includes:

- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`

These checks were reported as passing for the local security-hardening
commit. They do not, by themselves, establish that the changes have been
published, deployed, or independently verified in production.

## Consequences

- Authentication and resource-level authorization remain distinct controls.
- Analysis ownership rules are centralized and can be tested independently.
- Existing operator role spelling is retained for compatibility.
- Future routes that expose analysis data must apply the same authorization
  policy and include appropriate tests.
- Production secret configuration and fail-closed behavior remain governed
  by ADR-003 and must be verified separately.
- This ADR remains proposed until the repository owner accepts the decision.

## Non-goals

- This ADR does not authorize a production deployment.
- It does not claim that all production authentication or secret-management
  concerns are resolved.
- It does not change the data model or define a new ownership-transfer flow.
