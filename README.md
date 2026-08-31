# @plasius/scene-object

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
GitHub-hosted runners for same-repository pull requests and `main`, with
package-manager cache finalization disabled; fork PR code is denied.
Publication uses the GitHub-hosted `production` job with Node 24 and a pinned
npm 11.6.2 client. It is token-free and proceeds only while the prepared SHA
is the exact `main` head after successful push-triggered CI. Do not dispatch CD
until the npm trusted-publisher binding is verified.
<!-- END PLASIUS RELEASE INTEGRITY -->
