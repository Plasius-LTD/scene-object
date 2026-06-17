import { type SceneObjectDefinition,
  type SceneObjectManifest,
  type SceneObjectPoint,
  type SceneObjectValidationIssue,
  type SceneObjectValidationResult,
  type SceneObjectVector3,
} from "./types.js";
import { validateSceneObjectManifest } from "./validation.js";

export const SCENE_OBJECT_PLAYER_SYSTEM_INTERFACE_FLAG_ID =
  "isekai.player-system.interface.enabled";

export type SceneObjectAnchorKind =
  | "target"
  | "focus-pane"
  | "localized-alert"
  | "line-of-sight-popup";

export type SceneObjectAnchorVisibility =
  | "always"
  | "combat-safe"
  | "focused-only"
  | "line-of-sight";

export interface SceneObjectAnchorDefinition {
  id: string;
  kind: SceneObjectAnchorKind;
  objectId: string;
  pointId: string;
  visibility: SceneObjectAnchorVisibility;
  localeKey?: string;
  offset?: SceneObjectVector3;
  tags?: string[];
}

export interface SceneObjectFocusScreenDefinition {
  id: string;
  objectId: string;
  anchorId: string;
  paneId: string;
  variant: "single-pane" | "multi-pane" | "combat-safe";
  headingKey?: string;
}

export interface SceneObjectPlayerSystemManifest extends SceneObjectManifest {
  anchors?: SceneObjectAnchorDefinition[];
  focusScreens?: SceneObjectFocusScreenDefinition[];
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ANCHOR_KINDS = new Set<SceneObjectAnchorKind>([
  "target",
  "focus-pane",
  "localized-alert",
  "line-of-sight-popup",
]);
const ANCHOR_VISIBILITIES = new Set<SceneObjectAnchorVisibility>([
  "always",
  "combat-safe",
  "focused-only",
  "line-of-sight",
]);
const FOCUS_SCREEN_VARIANTS = new Set<SceneObjectFocusScreenDefinition["variant"]>([
  "single-pane",
  "multi-pane",
  "combat-safe",
]);

function pushIssue(
  issues: SceneObjectValidationIssue[],
  issue: SceneObjectValidationIssue,
): void {
  issues.push(issue);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isKebabId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function validateKebabId(
  value: unknown,
  path: string,
  issues: SceneObjectValidationIssue[],
): value is string {
  if (typeof value !== "string") {
    pushIssue(issues, {
      code: "invalid-type",
      path,
      message: "Expected a string identifier.",
    });
    return false;
  }

  if (!ID_PATTERN.test(value)) {
    pushIssue(issues, {
      code: "invalid-id",
      path,
      message: "Identifiers must be kebab-case tokens.",
    });
    return false;
  }

  return true;
}

function findObjectPoint(
  object: SceneObjectDefinition | undefined,
  pointId: string,
): SceneObjectPoint | undefined {
  return object?.attachmentPoints?.find((point) => point.id === pointId);
}

function validateAnchorDefinition(
  anchor: unknown,
  path: string,
  issues: SceneObjectValidationIssue[],
  objectsById: Map<string, SceneObjectDefinition>,
  anchorIds: Set<string>,
): anchor is SceneObjectAnchorDefinition {
  if (!anchor || typeof anchor !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected anchor definition object.",
    });
    return false;
  }

  const value = anchor as Record<string, unknown>;
  let valid = true;

  if (!validateKebabId(value.id, `${path}.id`, issues)) {
    valid = false;
  } else if (anchorIds.has(value.id)) {
    pushIssue(issues, {
      code: "duplicate-id",
      path: `${path}.id`,
      message: "Anchor identifiers must be unique.",
    });
    valid = false;
  } else {
    anchorIds.add(value.id);
  }

  if (!validateKebabId(value.objectId, `${path}.objectId`, issues)) {
    valid = false;
  }

  if (!validateKebabId(value.pointId, `${path}.pointId`, issues)) {
    valid = false;
  }

  if (!ANCHOR_KINDS.has(value.kind as SceneObjectAnchorKind)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.kind`,
      message:
        "Anchor kind must be target, focus-pane, localized-alert, or line-of-sight-popup.",
    });
    valid = false;
  }

  if (!ANCHOR_VISIBILITIES.has(value.visibility as SceneObjectAnchorVisibility)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.visibility`,
      message:
        "Anchor visibility must be always, combat-safe, focused-only, or line-of-sight.",
    });
    valid = false;
  }

  const object =
    typeof value.objectId === "string"
      ? objectsById.get(value.objectId)
      : undefined;
  if (!object) {
    pushIssue(issues, {
      code: "missing-reference",
      path: `${path}.objectId`,
      message: "Anchor objectId must reference an existing scene object.",
    });
    valid = false;
  } else if (
    typeof value.pointId === "string" &&
    !findObjectPoint(object, value.pointId)
  ) {
    pushIssue(issues, {
      code: "missing-reference",
      path: `${path}.pointId`,
      message:
        "Anchor pointId must reference an attachment point on the target object.",
    });
    valid = false;
  }

  if (value.kind === "localized-alert") {
    if (typeof value.localeKey !== "string" || value.localeKey.trim().length === 0) {
      pushIssue(issues, {
        code: "required",
        path: `${path}.localeKey`,
        message: "localized-alert anchors require a localeKey.",
      });
      valid = false;
    }
  } else if (
    value.localeKey !== undefined &&
    (typeof value.localeKey !== "string" || value.localeKey.trim().length === 0)
  ) {
    pushIssue(issues, {
      code: "invalid-type",
      path: `${path}.localeKey`,
      message: "localeKey must be a non-empty string when present.",
    });
    valid = false;
  }

  if (value.offset !== undefined) {
    if (!value.offset || typeof value.offset !== "object") {
      pushIssue(issues, {
        code: "invalid-type",
        path: `${path}.offset`,
        message: "offset must be a finite x/y/z vector when present.",
      });
      valid = false;
    } else {
      for (const axis of ["x", "y", "z"] as const) {
        if (!isFiniteNumber((value.offset as Record<string, unknown>)[axis])) {
          pushIssue(issues, {
            code: "invalid-type",
            path: `${path}.offset.${axis}`,
            message: "offset axes must be finite numbers.",
          });
          valid = false;
        }
      }
    }
  }

  if (value.tags !== undefined) {
    if (
      !Array.isArray(value.tags) ||
      value.tags.some((tag) => typeof tag !== "string" || tag.trim().length === 0)
    ) {
      pushIssue(issues, {
        code: "invalid-type",
        path: `${path}.tags`,
        message: "tags must be an array of non-empty strings when present.",
      });
      valid = false;
    }
  }

  return valid;
}

function validateFocusScreenDefinition(
  focusScreen: unknown,
  path: string,
  issues: SceneObjectValidationIssue[],
  objectsById: Map<string, SceneObjectDefinition>,
  anchorsById: Map<string, SceneObjectAnchorDefinition>,
  focusScreenIds: Set<string>,
): focusScreen is SceneObjectFocusScreenDefinition {
  if (!focusScreen || typeof focusScreen !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected focus-screen definition object.",
    });
    return false;
  }

  const value = focusScreen as Record<string, unknown>;
  let valid = true;

  if (!validateKebabId(value.id, `${path}.id`, issues)) {
    valid = false;
  } else if (focusScreenIds.has(value.id)) {
    pushIssue(issues, {
      code: "duplicate-id",
      path: `${path}.id`,
      message: "Focus-screen identifiers must be unique.",
    });
    valid = false;
  } else {
    focusScreenIds.add(value.id);
  }

  if (!validateKebabId(value.objectId, `${path}.objectId`, issues)) {
    valid = false;
  } else if (!objectsById.has(value.objectId)) {
    pushIssue(issues, {
      code: "missing-reference",
      path: `${path}.objectId`,
      message: "Focus-screen objectId must reference an existing scene object.",
    });
    valid = false;
  }

  if (!validateKebabId(value.anchorId, `${path}.anchorId`, issues)) {
    valid = false;
  } else {
    const anchor = anchorsById.get(value.anchorId);
    if (!anchor) {
      pushIssue(issues, {
        code: "missing-reference",
        path: `${path}.anchorId`,
        message: "Focus-screen anchorId must reference an exported anchor.",
      });
      valid = false;
    } else if (anchor.kind !== "focus-pane") {
      pushIssue(issues, {
        code: "invalid-reference",
        path: `${path}.anchorId`,
        message: "Focus screens must bind to focus-pane anchors.",
      });
      valid = false;
    }
  }

  if (!validateKebabId(value.paneId, `${path}.paneId`, issues)) {
    valid = false;
  }

  if (!FOCUS_SCREEN_VARIANTS.has(value.variant as SceneObjectFocusScreenDefinition["variant"])) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.variant`,
      message: "Focus-screen variant must be single-pane, multi-pane, or combat-safe.",
    });
    valid = false;
  }

  if (
    value.headingKey !== undefined &&
    (typeof value.headingKey !== "string" || value.headingKey.trim().length === 0)
  ) {
    pushIssue(issues, {
      code: "invalid-type",
      path: `${path}.headingKey`,
      message: "headingKey must be a non-empty string when present.",
    });
    valid = false;
  }

  return valid;
}

export function validateSceneObjectPlayerSystemManifest(
  manifest: unknown,
): SceneObjectValidationResult<SceneObjectPlayerSystemManifest> {
  const base = validateSceneObjectManifest(manifest);
  if (!base.valid || !base.value) {
    return base as SceneObjectValidationResult<SceneObjectPlayerSystemManifest>;
  }

  const issues = [...base.issues];
  const value = manifest as SceneObjectPlayerSystemManifest;
  const objectsById = new Map(
    base.value.objects.map((object) => [object.id, object] as const),
  );
  const anchorIds = new Set<string>();
  const anchorsById = new Map<string, SceneObjectAnchorDefinition>();
  const focusScreenIds = new Set<string>();
  let valid = true;

  if (value.anchors !== undefined) {
    if (!Array.isArray(value.anchors)) {
      pushIssue(issues, {
        code: "invalid-type",
        path: "$.anchors",
        message: "anchors must be an array when present.",
      });
      valid = false;
    } else {
      value.anchors.forEach((anchor, index) => {
        const path = `$.anchors[${index}]`;
        if (
          validateAnchorDefinition(anchor, path, issues, objectsById, anchorIds)
        ) {
          anchorsById.set(anchor.id, anchor);
        } else {
          valid = false;
        }
      });
    }
  }

  if (value.focusScreens !== undefined) {
    if (!Array.isArray(value.focusScreens)) {
      pushIssue(issues, {
        code: "invalid-type",
        path: "$.focusScreens",
        message: "focusScreens must be an array when present.",
      });
      valid = false;
    } else {
      value.focusScreens.forEach((focusScreen, index) => {
        if (
          !validateFocusScreenDefinition(
            focusScreen,
            `$.focusScreens[${index}]`,
            issues,
            objectsById,
            anchorsById,
            focusScreenIds,
          )
        ) {
          valid = false;
        }
      });
    }
  }

  return {
    valid,
    issues,
    value: valid ? value : undefined,
  };
}

export function resolveSceneObjectAnchorById(
  manifest: SceneObjectPlayerSystemManifest,
  anchorId: string,
): SceneObjectAnchorDefinition | undefined {
  if (!isKebabId(anchorId)) {
    return undefined;
  }

  return manifest.anchors?.find((anchor) => anchor.id === anchorId);
}

export function resolveSceneObjectFocusScreenById(
  manifest: SceneObjectPlayerSystemManifest,
  focusScreenId: string,
): SceneObjectFocusScreenDefinition | undefined {
  if (!isKebabId(focusScreenId)) {
    return undefined;
  }

  return manifest.focusScreens?.find((focusScreen) => focusScreen.id === focusScreenId);
}
