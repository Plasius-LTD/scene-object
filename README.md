# @plasius/scene-object

[![npm version](https://img.shields.io/npm/v/@plasius/scene-object.svg)](https://www.npmjs.com/package/@plasius/scene-object)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/scene-object/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/scene-object/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/scene-object)](https://codecov.io/gh/Plasius-LTD/scene-object)
[![License](https://img.shields.io/github/license/Plasius-LTD/scene-object)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-yes-blue.svg)](./CODE_OF_CONDUCT.md)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

Reusable contracts for scene objects, transforms, bounds, attachments, and snapshot state.

## Installation

```bash
npm install @plasius/scene-object
```

## Rollout ownership

This package is controlled by a site-owned feature flag:

- `scene.object.runtime.enabled`
- Player System interface extensions inherit `isekai.player-system.interface.enabled`

## Package exports

- `SceneObjectManifest` and `SceneObjectDefinition`
- deterministic object validation and manifest creation helpers
- attachment and attachment-point helpers
- state lookup helpers
- Player System extension contracts for target anchors, focus-pane screens, and localized alert markers
- `validateSceneObjectPlayerSystemManifest()` plus focus/anchor lookup helpers

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run pack:check
```

## Validation model

- IDs must be kebab-case
- transforms and bounds must be finite numbers with valid units
- attachment points and links must reference existing objects/points
- state visibility and object references must be structurally valid
- Player System anchors must reference exported object attachment points
- focus screens must bind to `focus-pane` anchors and declare a bounded presentation variant

<!-- BEGIN PLASIUS RELEASE INTEGRITY -->
## Release integrity

CI keeps the administrative contributor registry outside Git and npm package
artifacts using exact, case-normalised path checks. CI accepts trusted repository pushes only and selects
`Public CI - Quarantined` with explicit `[self-hosted, Linux, X64]` labels. Every
job checks the repository identity, uses non-persistent checkout credentials,
disables npm cache finalization and has a bounded timeout. There is no PR/manual
trigger, hosted fallback or caller-selected runner. Strict `npm ci`, existing
quality and 80% coverage gates, and final package admission are required.

The group must admit this repository and `ci.yml@refs/heads/main`. For pre-merge
validation, review and lock the exact source branch including administrators,
forbid fork synchronization, verify its SHA, then temporarily admit only that
CI branch ref/SHA. Patch only `selected_workflows`; read back unchanged group
properties and repository IDs. Remove temporary entries before changing,
unlocking or deleting the branch. An absent admission fails closed. See
[ADR 0003](docs/adrs/adr-0003-trusted-self-hosted-ci.md).
Publication uses the GitHub-hosted `production` job with Node 24 and a pinned
npm 11.6.2 client. It is token-free and proceeds only while the prepared SHA
is the exact `main` head after successful push-triggered CI. Do not dispatch CD
until the npm trusted-publisher binding is verified. The existing hosted release
preparation/queue/packing/publication call graph remains the release route;
CI alone qualifies exact-main validation. The separate dependency-maintenance
workflow does not qualify release CI.

The stored parent flag `platform.public-artifact-integrity.enabled` governs
restoration. Disabled, missing, malformed or unavailable state retains
containment; enabled state admits only verified clean releases. Mandatory
integrity checks are never bypassed. No capability or env override is added.
Rollback disables the workflow/distribution channel and retains a known clean
artifact, without restoring private records, hosted CI or removed npm versions.
<!-- END PLASIUS RELEASE INTEGRITY -->
