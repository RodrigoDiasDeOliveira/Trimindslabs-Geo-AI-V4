# ADR-001: Runtime and STAC Discovery Boundary

- **Status:** PROPOSED
- **Date:** 2026-10-11

## Context

The V4 deployment repository uses a Node.js/Express and TypeScript runtime. The implemented satellite scene discovery path uses the public Earth Search STAC catalog. The Earth Engine adapter can report provider connectivity, but scene search through that adapter is not implemented and returns an empty result.

## Decision proposed

Treat STAC discovery as the implemented scene-search path. Do not describe Earth Engine scene discovery as implemented until the adapter returns real scene results and has integration tests. Keep the earlier Python/ML/Terraform repository identified as a predecessor/related codebase, not the V4 deployment source.

## Consequences

- Provider health and provider feature completeness are separate facts.
- The README must not infer working scene discovery from a successful connectivity probe.
- This ADR remains proposed pending owner confirmation.
