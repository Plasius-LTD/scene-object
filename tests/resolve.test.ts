import { describe, expect, it } from "vitest";
import { resolveSceneObjectById, resolveSceneObjectState, type SceneObjectManifest } from "../src/index.js";
import { SCENE_OBJECT_SCHEMA_VERSION } from "../src/index.js";
import { resolveSceneObjectById as resolveSceneObjectByIdFromResolveModule } from "../src/resolve.js";

const manifest: SceneObjectManifest = {
  schemaVersion: SCENE_OBJECT_SCHEMA_VERSION,
  objects: [
    {
      id: "hero-entity",
      transform: {
        translate: { x: 1, y: 0, z: 0 },
        rotate: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      bounds: {
        coordinateSpace: "normalized-viewport",
        rect: {
          x: 0,
          y: 0,
          width: 0.4,
          height: 0.4,
          unit: "ratio",
        },
      },
      attachmentPoints: [{ id: "center", x: 0.5, y: 0.5 }],
    },
    {
      id: "enemy-entity",
      transform: {
        translate: { x: 0.2, y: 0.2, z: 0 },
        rotate: { x: 0, y: 45, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      bounds: {
        coordinateSpace: "normalized-viewport",
        rect: {
          x: 0.6,
          y: 0.25,
          width: 0.2,
          height: 0.3,
          unit: "ratio",
        },
      },
      attachments: [
        {
          id: "hero-link",
          sourceObjectId: "hero-entity",
          sourcePointId: "center",
          targetObjectId: "enemy-entity",
          targetPointId: "center",
        },
      ],
    },
  ],
  stateSnapshots: [{ objectId: "hero-entity", visible: true }],
};

describe("scene object resolution", () => {
  it("resolves an object by id", () => {
    const result = resolveSceneObjectById(manifest, "enemy-entity");

    expect(result?.id).toBe("enemy-entity");
    expect(result?.attachments?.length).toBe(1);
  });

  it("returns attachment state snapshot by object id", () => {
    const state = resolveSceneObjectState(manifest, "hero-entity");

    expect(state?.objectId).toBe("hero-entity");
    expect(state?.visible).toBe(true);
  });

  it("returns undefined when no state snapshots are available", () => {
    const state = resolveSceneObjectState(
      {
        ...manifest,
        stateSnapshots: undefined,
      },
      "hero-entity",
    );

    expect(state).toBeUndefined();
  });

  it("returns undefined for missing object", () => {
    const missing = resolveSceneObjectById(manifest, "missing");
    const missingState = resolveSceneObjectState(manifest, "missing");

    expect(missing).toBeUndefined();
    expect(missingState).toBeUndefined();
  });

  it("resolves objects through the resolve module helper", () => {
    const result = resolveSceneObjectByIdFromResolveModule(manifest, "hero-entity");

    expect(result?.id).toBe("hero-entity");
  });
});
