import { describe, expect, it } from "vitest";
import {
  SCENE_OBJECT_RUNTIME_FLAG_ID,
  SCENE_OBJECT_SCHEMA_VERSION,
  createSceneObjectManifest,
  resolveSceneObjectById,
  validateSceneObjectManifest,
  validateSceneObjectObjectState,
  type SceneObjectManifest,
} from "../src/index.js";

const validManifest: SceneObjectManifest = {
  schemaVersion: SCENE_OBJECT_SCHEMA_VERSION,
  objects: [
    {
      id: "hero-entity",
      name: "Hero",
      transform: {
        translate: { x: 0, y: 0, z: 0 },
        rotate: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      bounds: {
        coordinateSpace: "normalized-viewport",
        rect: {
          x: 0.1,
          y: 0.1,
          width: 0.3,
          height: 0.3,
          unit: "ratio",
        },
      },
      attachmentPoints: [
        {
          id: "center",
          x: 0.5,
          y: 0.5,
        },
      ],
    },
    {
      id: "support-entity",
      transform: {
        translate: { x: 0, y: 1, z: 0 },
        rotate: { x: 0, y: 90, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      bounds: {
        coordinateSpace: "normalized-viewport",
        rect: {
          x: 0.4,
          y: 0.2,
          width: 0.2,
          height: 0.2,
          unit: "ratio",
        },
      },
      attachments: [
        {
          id: "hero-attach",
          sourceObjectId: "hero-entity",
          sourcePointId: "center",
          targetObjectId: "support-entity",
          targetPointId: "center",
        },
      ],
    },
  ],
  stateSnapshots: [
    {
      objectId: "hero-entity",
      visible: true,
      tags: ["core"],
    },
  ],
};

describe("scene object manifest validation", () => {
  it("accepts a valid manifest", () => {
    const result = validateSceneObjectManifest(validManifest);

    expect(result.valid).toBe(true);
    expect(result.value?.objects[0]?.id).toBe("hero-entity");
  });

  it("exports the documented parent rollout flag", () => {
    expect(SCENE_OBJECT_RUNTIME_FLAG_ID).toBe("scene.object.runtime.enabled");
  });

  it("builds a canonical manifest", () => {
    const result = createSceneObjectManifest(validManifest);
    expect(result.schemaVersion).toBe(SCENE_OBJECT_SCHEMA_VERSION);
  });

  it("rejects duplicate object ids", () => {
    const duplicate = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        ...validManifest.objects,
        {
          ...validManifest.objects[0]!,
        },
      ],
    });

    expect(duplicate.valid).toBe(false);
    expect(duplicate.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-id" }),
      ]),
    );
  });

  it("rejects attachment points that do not exist", () => {
    const result = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        {
          ...validManifest.objects[0],
          attachmentPoints: [{ id: "center", x: 0.5, y: 0.5 }],
        },
        {
          ...validManifest.objects[1],
          attachments: [
            {
              id: "hero-attach",
              sourceObjectId: "hero-entity",
              sourcePointId: "missing-point",
              targetObjectId: "support-entity",
              targetPointId: "center",
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-reference" }),
      ]),
    );
  });

  it("rejects malformed state snapshots", () => {
    const snapshotResult = validateSceneObjectObjectState({
      objectId: "hero-entity",
      visible: "yes",
    });

    expect(snapshotResult.valid).toBe(false);
    expect(snapshotResult.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.visible", code: "invalid-type" }),
      ]),
    );
  });

  it("resolves object by id", () => {
    const hero = resolveSceneObjectById({
      manifest: validManifest,
      objectId: "hero-entity",
    });

    expect(hero?.id).toBe("hero-entity");
  });
});
