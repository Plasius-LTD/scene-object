import { describe, expect, it } from "vitest";
import {
  SCENE_OBJECT_RUNTIME_FLAG_ID,
  SCENE_OBJECT_SCHEMA_VERSION,
  createSceneObjectManifest,
  resolveSceneObjectById,
  resolveSceneObjectReferences,
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

  it("throws with validation details when creating invalid manifests", () => {
    expect(() =>
      createSceneObjectManifest({
        ...validManifest,
        objects: [],
      }),
    ).toThrow("Manifest must contain at least one object");
  });

  it("rejects missing manifest objects", () => {
    const result = validateSceneObjectManifest(undefined);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$" }),
    ]);
  });

  it("reports invalid top-level manifest fields", () => {
    const result = validateSceneObjectManifest({
      schemaVersion: "0.1.0",
      objects: [],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.schemaVersion" }),
        expect.objectContaining({ code: "required", path: "$.objects" }),
      ]),
    );
  });

  it("rejects non-object scene object entries", () => {
    const result = validateSceneObjectManifest({
      ...validManifest,
      objects: [null],
      stateSnapshots: [],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$.objects[0]" }),
    ]);
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

  it("reports malformed transforms and bounds", () => {
    const result = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        {
          id: "bad-object",
          transform: {
            translate: { x: Number.NaN, y: 0, z: 0 },
            scale: { x: 1, y: "wide", z: 1 },
          },
          bounds: {
            coordinateSpace: "world",
            rect: {
              x: -1,
              y: 0,
              width: 0,
              height: Number.POSITIVE_INFINITY,
              unit: "pixels",
            },
            depth: -1,
          },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-type", path: "$.objects[0].transform.translate.x" }),
        expect.objectContaining({ code: "required", path: "$.objects[0].transform.rotate" }),
        expect.objectContaining({ code: "invalid-type", path: "$.objects[0].transform.scale.y" }),
        expect.objectContaining({ code: "invalid-type", path: "$.objects[0].bounds.rect.x" }),
        expect.objectContaining({ code: "invalid-type", path: "$.objects[0].bounds.rect.height" }),
        expect.objectContaining({ code: "invalid-value", path: "$.objects[0].bounds.rect" }),
        expect.objectContaining({ code: "invalid-type", path: "$.objects[0].bounds.depth" }),
      ]),
    );
  });

  it("reports missing and invalid bounds blocks", () => {
    const missingBounds = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        {
          ...validManifest.objects[0]!,
          bounds: undefined,
        },
      ],
    });
    const invalidCoordinateSpace = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        {
          ...validManifest.objects[0]!,
          bounds: {
            ...validManifest.objects[0]!.bounds,
            coordinateSpace: "screen",
          },
        },
      ],
    });
    const missingRect = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        {
          ...validManifest.objects[0]!,
          bounds: {
            coordinateSpace: "world",
          },
        },
      ],
    });
    const invalidUnit = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        {
          ...validManifest.objects[0]!,
          bounds: {
            coordinateSpace: "world",
            rect: {
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              unit: "percent",
            },
          },
        },
      ],
    });

    expect(missingBounds.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.objects[0].bounds" }),
      ]),
    );
    expect(invalidCoordinateSpace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.objects[0].bounds.coordinateSpace" }),
      ]),
    );
    expect(missingRect.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.objects[0].bounds.rect" }),
      ]),
    );
    expect(invalidUnit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.objects[0].bounds.rect.unit" }),
      ]),
    );
  });

  it("reports malformed attachment points and attachments", () => {
    const result = validateSceneObjectManifest({
      ...validManifest,
      objects: [
        {
          ...validManifest.objects[0]!,
          attachmentPoints: [
            null,
            { id: "Center", x: "left", y: 0.5 },
            { id: "center", x: 0.25, y: 0.25 },
            { id: "center", x: 0.75, y: 0.75 },
            { id: "top", x: 0.5, y: 0, z: Number.NaN },
          ],
          attachments: [
            null,
            {
              id: "bad-attachment",
              sourceObjectId: "Hero",
              sourcePointId: "missing",
              targetObjectId: "support-entity",
              targetPointId: "center",
            },
            {
              id: "bad-attachment",
              sourceObjectId: "hero-entity",
              sourcePointId: "missing",
              targetObjectId: "support-entity",
              targetPointId: "missing",
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.objects[0].attachmentPoints[0]" }),
        expect.objectContaining({ code: "invalid-id", path: "$.objects[0].attachmentPoints[1].id" }),
        expect.objectContaining({ code: "invalid-type", path: "$.objects[0].attachmentPoints[1].x" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.objects[0].attachmentPoints[3].id" }),
        expect.objectContaining({ code: "invalid-type", path: "$.objects[0].attachmentPoints[4].z" }),
        expect.objectContaining({ code: "required", path: "$.objects[0].attachments[0]" }),
        expect.objectContaining({ code: "invalid-id", path: "$.objects[0].attachments[1].sourceObjectId" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.objects[0].attachments[2].id" }),
        expect.objectContaining({ code: "invalid-reference", path: "$.objects[0].attachments[2].sourcePointId" }),
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

  it("rejects malformed manifest state snapshots", () => {
    const result = validateSceneObjectManifest({
      ...validManifest,
      stateSnapshots: [
        null,
        {
          objectId: "missing-entity",
          visible: "yes",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.stateSnapshots[0]" }),
        expect.objectContaining({ code: "missing-reference", path: "$.stateSnapshots[1].objectId" }),
        expect.objectContaining({ code: "invalid-type", path: "$.stateSnapshots[1].visible" }),
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

  it("rejects missing standalone state snapshot objects", () => {
    const snapshotResult = validateSceneObjectObjectState(null);

    expect(snapshotResult.valid).toBe(false);
    expect(snapshotResult.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$" }),
    ]);
  });

  it("rejects standalone state snapshot ids that are not valid scene ids", () => {
    const snapshotResult = validateSceneObjectObjectState({
      objectId: "Hero",
      visible: true,
    });

    expect(snapshotResult.valid).toBe(false);
    expect(snapshotResult.issues).toEqual([
      expect.objectContaining({ code: "invalid-id", path: "$.objectId" }),
    ]);
  });

  it("accepts valid standalone state snapshots", () => {
    const snapshotResult = validateSceneObjectObjectState({
      objectId: "hero-entity",
      visible: false,
    });

    expect(snapshotResult.valid).toBe(true);
    expect(snapshotResult.value?.visible).toBe(false);
  });

  it("resolves valid manifests through reference validation", () => {
    const result = resolveSceneObjectReferences(validManifest);

    expect(result.valid).toBe(true);
    expect(result.value?.objects).toHaveLength(2);
  });

  it("returns validation issues while resolving invalid manifest references", () => {
    const result = resolveSceneObjectReferences({
      ...validManifest,
      objects: [],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$.objects" }),
    ]);
  });

  it("resolves object by id", () => {
    const hero = resolveSceneObjectById({
      manifest: validManifest,
      objectId: "hero-entity",
    });

    expect(hero?.id).toBe("hero-entity");
  });

  it("returns undefined when resolving from an invalid manifest", () => {
    const hero = resolveSceneObjectById({
      manifest: {
        ...validManifest,
        objects: [],
      },
      objectId: "hero-entity",
    });

    expect(hero).toBeUndefined();
  });
});
