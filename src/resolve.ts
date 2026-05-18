import {
  SceneObjectManifest,
  SceneObjectObjectState,
  SceneObjectDefinition,
} from "./types.js";

export function resolveSceneObjectState(
  manifest: SceneObjectManifest,
  objectId: string,
): SceneObjectObjectState | undefined {
  if (!manifest.stateSnapshots || !Array.isArray(manifest.stateSnapshots)) {
    return undefined;
  }

  return manifest.stateSnapshots.find(
    (snapshot) => snapshot.objectId === objectId,
  );
}

export function resolveSceneObjectById(
  manifest: SceneObjectManifest,
  objectId: string,
): SceneObjectDefinition | undefined {
  return manifest.objects.find((object) => object.id === objectId);
}
