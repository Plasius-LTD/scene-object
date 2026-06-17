import { describe, expect, it } from "vitest";
import {
  SCENE_OBJECT_PLAYER_SYSTEM_INTERFACE_FLAG_ID,
  SCENE_OBJECT_SCHEMA_VERSION,
  resolveSceneObjectAnchorById,
  resolveSceneObjectFocusScreenById,
  validateSceneObjectPlayerSystemManifest,
  type SceneObjectPlayerSystemManifest,
} from "../src/index.js";

const manifest: SceneObjectPlayerSystemManifest = {
  schemaVersion: SCENE_OBJECT_SCHEMA_VERSION,
  objects: [
    {
      id: "player-core",
      transform: {
        translate: { x: 0, y: 0, z: 0 },
        rotate: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      bounds: {
        coordinateSpace: "world",
        rect: {
          x: 0,
          y: 0,
          width: 2,
          height: 2,
          unit: "pixels",
        },
      },
      attachmentPoints: [
        { id: "target-reticle", x: 0.5, y: 0.5, z: 0 },
        { id: "focus-pane-root", x: 0.2, y: 0.8, z: 0 },
        { id: "alert-beacon", x: 0.9, y: 0.1, z: 0 },
      ],
    },
  ],
  anchors: [
    {
      id: "target-reticle-anchor",
      kind: "target",
      objectId: "player-core",
      pointId: "target-reticle",
      visibility: "line-of-sight",
    },
    {
      id: "focus-pane-anchor",
      kind: "focus-pane",
      objectId: "player-core",
      pointId: "focus-pane-root",
      visibility: "focused-only",
    },
    {
      id: "attack-warning",
      kind: "localized-alert",
      objectId: "player-core",
      pointId: "alert-beacon",
      visibility: "combat-safe",
      localeKey: "player-system.alert.attack-warning",
    },
  ],
  focusScreens: [
    {
      id: "missions-pane",
      objectId: "player-core",
      anchorId: "focus-pane-anchor",
      paneId: "missions",
      variant: "combat-safe",
      headingKey: "player-system.missions.heading",
    },
  ],
};

describe("player-system scene-object extensions", () => {
  it("exports the inherited feature flag for player-system interface foundations", () => {
    expect(SCENE_OBJECT_PLAYER_SYSTEM_INTERFACE_FLAG_ID).toBe(
      "isekai.player-system.interface.enabled",
    );
  });

  it("validates target anchors, localized alerts, and focus-screen contracts", () => {
    const result = validateSceneObjectPlayerSystemManifest(manifest);

    expect(result.valid).toBe(true);
    expect(result.value?.anchors).toHaveLength(3);
    expect(result.value?.focusScreens?.[0]?.anchorId).toBe("focus-pane-anchor");
  });

  it("resolves exported anchors and focus screens by identifier", () => {
    expect(resolveSceneObjectAnchorById(manifest, "attack-warning")?.kind).toBe(
      "localized-alert",
    );
    expect(
      resolveSceneObjectFocusScreenById(manifest, "missions-pane")?.variant,
    ).toBe("combat-safe");
  });

  it("rejects missing locale keys and invalid focus-pane references", () => {
    const result = validateSceneObjectPlayerSystemManifest({
      ...manifest,
      anchors: [
        {
          id: "broken-alert",
          kind: "localized-alert",
          objectId: "player-core",
          pointId: "alert-beacon",
          visibility: "combat-safe",
        },
      ],
      focusScreens: [
        {
          id: "bad-focus",
          objectId: "player-core",
          anchorId: "target-reticle-anchor",
          paneId: "missions",
          variant: "multi-pane",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.anchors[0].localeKey" }),
        expect.objectContaining({ path: "$.focusScreens[0].anchorId" }),
      ]),
    );
  });

  it("rejects malformed optional player-system extension fields", () => {
    const result = validateSceneObjectPlayerSystemManifest({
      ...manifest,
      anchors: [
        {
          id: "focus-pane-anchor",
          kind: "focus-pane",
          objectId: "player-core",
          pointId: "focus-pane-root",
          visibility: "focused-only",
          localeKey: "",
          offset: { x: 0, y: Number.NaN, z: 1 },
          tags: ["valid", ""],
        },
      ],
      focusScreens: [
        {
          id: "bad-focus",
          objectId: "missing-object",
          anchorId: "focus-pane-anchor",
          paneId: "missions",
          variant: "unknown",
          headingKey: "",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.anchors[0].localeKey" }),
        expect.objectContaining({ path: "$.anchors[0].offset.y" }),
        expect.objectContaining({ path: "$.anchors[0].tags" }),
        expect.objectContaining({ path: "$.focusScreens[0].objectId" }),
        expect.objectContaining({ path: "$.focusScreens[0].variant" }),
        expect.objectContaining({ path: "$.focusScreens[0].headingKey" }),
      ]),
    );
  });

  it("rejects non-array extension blocks and guards invalid lookup identifiers", () => {
    const result = validateSceneObjectPlayerSystemManifest({
      ...manifest,
      anchors: "not-an-array",
      focusScreens: "not-an-array",
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.anchors" }),
        expect.objectContaining({ path: "$.focusScreens" }),
      ]),
    );
    expect(resolveSceneObjectAnchorById(manifest, "Not-Kebab")).toBeUndefined();
    expect(resolveSceneObjectFocusScreenById(manifest, "invalid id")).toBeUndefined();
  });
});
