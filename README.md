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
artifacts using exact, case-normalised path checks. CI runs on approved
self-hosted runners. Release preparation and npm publication use GitHub-hosted
runners with Node.js 24.18.0 LTS. CD remains disabled until the npm trusted
publisher binding is verified and the legacy token fallback is removed.
<!-- END PLASIUS RELEASE INTEGRITY -->
