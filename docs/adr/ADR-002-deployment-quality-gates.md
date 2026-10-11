# ADR-002: Deployment Quality Gates and Explicit GCP Project

- **Status:** PROPOSED
- **Date:** 2026-10-11

## Context

The current deployment workflow builds the application, but does not run the package test and lint scripts as release gates. Its post-deploy health request is informational rather than blocking, and the project ID is not explicitly pinned in the workflow. The application source hardcodes port 3000 while the Dockerfile sets `PORT=8080`; the app does not read that environment variable in this version, so the container port configuration is inconsistent.

## Decision proposed

Before describing a workflow run as a validated release, require typecheck/lint and tests, configure the intended GCP project explicitly, and fail the workflow if the deployed service does not pass its health check. Keep deployment and health-check results distinct in the workflow summary.

## Consequences

- A green deployment workflow should imply that required gates passed.
- The workflow must be tested before the decision is accepted and merged.
- This ADR records a proposed improvement, not current workflow behavior.
