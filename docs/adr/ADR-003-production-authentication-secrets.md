# ADR-003: Production Authentication Secrets Must Be Explicitly Configured

- **Status:** PROPOSED
- **Date:** 2026-10-11

## Context

The current authentication source includes fallback development values for the HMAC signing secret and administrator/operator passwords. The deployment workflow allows unauthenticated network access to the Cloud Run service, so application-level authentication and strong runtime secrets are material security controls.

## Decision proposed

Production deployment must explicitly configure strong, unique values for `AUTH_SECRET`, `ADMIN_PASSWORD`, and `OPERATOR_PASSWORD` through Secret Manager or an equivalent protected mechanism. The runtime should fail closed if production authentication secrets are missing or equal to development defaults. The deploy workflow should verify required secret configuration without printing secret values.

## Consequences

- Repository defaults must never be treated as production credentials.
- Release validation must verify authentication configuration and test unauthenticated access to protected routes.
- This ADR records a proposed security requirement; the current runtime and deployment workflow have not been changed by this documentation PR.
