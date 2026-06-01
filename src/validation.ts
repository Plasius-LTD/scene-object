import {
  SCENE_OBJECT_SCHEMA_VERSION,
  type SceneObjectBounds,
  type SceneObjectCoordinateSpace,
  type SceneObjectManifest,
  type SceneObjectObjectState,
  type SceneObjectPoint,
  type SceneObjectValidationIssue,
  type SceneObjectValidationResult,
  type SceneObjectDefinition,
  type SceneObjectAttachment,
  type SceneObjectResolutionRequest,
  type SceneObjectTransform,
} from "./types.js";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COORDINATE_SPACES = new Set<SceneObjectCoordinateSpace>([
  "normalized-viewport",
  "pixel-viewport",
  "world",
  "local",
]);
const UNITS = new Set(["ratio", "pixels"]);

function pushIssue(
  issues: SceneObjectValidationIssue[],
  issue: SceneObjectValidationIssue,
): void {
  issues.push(issue);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

function validateTransform(
  value: SceneObjectTransform,
  path: string,
  issues: SceneObjectValidationIssue[],
): boolean {
  const vectorChecks = ["translate", "rotate", "scale"] as const;
  let valid = true;

  for (const field of vectorChecks) {
    const vector = value[field];
    if (!vector || typeof vector !== "object") {
      pushIssue(issues, {
        code: "required",
        path: `${path}.${field}`,
        message: `Expected a ${field} vector.`,
      });
      valid = false;
      continue;
    }

    for (const axis of ["x", "y", "z"] as const) {
      const raw = vector[axis];
      if (!isFiniteNumber(raw)) {
        pushIssue(issues, {
          code: "invalid-type",
          path: `${path}.${field}.${axis}`,
          message: `Vector ${axis} must be finite.`,
        });
        valid = false;
      }
    }
  }

  return valid;
}

function validatePoint(point: SceneObjectPoint, path: string, issues: SceneObjectValidationIssue[]): boolean {
  let valid = true;

  if (!validateKebabId(point.id, `${path}.id`, issues)) {
    valid = false;
  }

  for (const field of ["x", "y", "z"] as const) {
    const value = point[field];
    if (field === "z" && value === undefined) {
      continue;
    }
    if (!isFiniteNumber(value)) {
      pushIssue(issues, {
        code: "invalid-type",
        path: `${path}.${field}`,
        message: "Attachment point axis must be finite.",
      });
      valid = false;
    }
  }

  return valid;
}

function validateBounds(bounds: SceneObjectBounds, path: string, issues: SceneObjectValidationIssue[]): boolean {
  if (!bounds || typeof bounds !== "object") {
    pushIssue(issues, { code: "required", path, message: "Expected bounds block." });
    return false;
  }

  if (!COORDINATE_SPACES.has(bounds.coordinateSpace as SceneObjectCoordinateSpace)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.coordinateSpace`,
      message: "coordinateSpace must be normalized-viewport, pixel-viewport, world, or local.",
    });
    return false;
  }

  const rect = bounds.rect;
  if (!rect || typeof rect !== "object") {
    pushIssue(issues, { code: "required", path: `${path}.rect`, message: "Expected rect bounds." });
    return false;
  }

  if (!UNITS.has(rect.unit as string)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.rect.unit`,
      message: "unit must be 'ratio' or 'pixels'.",
    });
    return false;
  }

  let valid = true;
  for (const field of ["x", "y", "width", "height"] as const) {
    const value = rect[field];
    if (!isFiniteNumber(value) || value < 0) {
      pushIssue(issues, {
        code: "invalid-type",
        path: `${path}.rect.${field}`,
        message: "Rect fields must be finite non-negative numbers.",
      });
      valid = false;
    }
  }

  if (rect.width === 0 || rect.height === 0) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.rect`,
      message: "Rect width and height must be positive.",
    });
    valid = false;
  }

  if (bounds.depth !== undefined && (!isFiniteNumber(bounds.depth) || bounds.depth < 0)) {
    pushIssue(issues, {
      code: "invalid-type",
      path: `${path}.depth`,
      message: "depth must be a non-negative number.",
    });
    valid = false;
  }

  return valid && isFiniteNumber(bounds.rect.width) && isFiniteNumber(bounds.rect.height);
}

function validateAttachmentTarget(
  attachment: {
    id: string;
    sourceObjectId: string;
    sourcePointId: string;
    targetObjectId: string;
    targetPointId: string;
  },
  path: string,
  issues: SceneObjectValidationIssue[],
  seenPoints: Map<string, Set<string>>,
): boolean {
  let valid = true;
  if (!validateKebabId(attachment.id, `${path}.id`, issues)) {
    valid = false;
  }

  if (!validateKebabId(attachment.sourceObjectId, `${path}.sourceObjectId`, issues)) {
    valid = false;
  }

  if (!validateKebabId(attachment.targetObjectId, `${path}.targetObjectId`, issues)) {
    valid = false;
  }

  if (!validateKebabId(attachment.sourcePointId, `${path}.sourcePointId`, issues)) {
    valid = false;
  }

  if (!validateKebabId(attachment.targetPointId, `${path}.targetPointId`, issues)) {
    valid = false;
  }

  const sourcePoints = seenPoints.get(attachment.sourceObjectId);
  const targetPoints = seenPoints.get(attachment.targetObjectId);

  if (sourcePoints && !sourcePoints.has(attachment.sourcePointId)) {
    pushIssue(issues, {
      code: "invalid-reference",
      path: `${path}.sourcePointId`,
      message: "sourcePointId does not exist on source object.",
    });
    valid = false;
  }

  if (targetPoints && !targetPoints.has(attachment.targetPointId)) {
    pushIssue(issues, {
      code: "invalid-reference",
      path: `${path}.targetPointId`,
      message: "targetPointId does not exist on target object.",
    });
    valid = false;
  }

  return valid;
}

export function validateSceneObjectManifest(
  manifest: unknown,
): SceneObjectValidationResult<SceneObjectManifest> {
  const issues: SceneObjectValidationIssue[] = [];

  if (!manifest || typeof manifest !== "object") {
    return {
      valid: false,
      issues: [{ code: "required", path: "$", message: "Expected a scene object manifest object." }],
    };
  }

  const value = manifest as Record<string, unknown>;
  let valid = true;

  if (value.schemaVersion !== SCENE_OBJECT_SCHEMA_VERSION) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.schemaVersion",
      message: `schemaVersion must equal ${SCENE_OBJECT_SCHEMA_VERSION}.`,
    });
    valid = false;
  }

  if (!Array.isArray(value.objects) || value.objects.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.objects",
      message: "Manifest must contain at least one object.",
    });
    return { valid: false, issues };
  }

  const objects = value.objects as SceneObjectDefinition[];
  const seenObjects = new Set<string>();
  const pointsByObject = new Map<string, Set<string>>();

  for (const [index, object] of objects.entries()) {
    const path = `$.objects[${index}]`;

    if (!object || typeof object !== "object") {
      pushIssue(issues, { code: "required", path, message: "Expected object definition." });
      valid = false;
      continue;
    }

    if (!validateKebabId(object.id, `${path}.id`, issues)) {
      valid = false;
    }

    if (seenObjects.has(object.id)) {
      pushIssue(issues, {
        code: "duplicate-id",
        path: `${path}.id`,
        message: `Duplicate object id '${object.id}' is not allowed.`,
      });
      valid = false;
    }
    seenObjects.add(object.id);

    if (!object.transform || typeof object.transform !== "object" || !validateTransform(object.transform as SceneObjectTransform, `${path}.transform`, issues)) {
      pushIssue(issues, {
        code: "required",
        path: `${path}.transform`,
        message: "Object must define a transform.",
      });
      valid = false;
    }

    if (!object.bounds) {
      pushIssue(issues, {
        code: "required",
        path: `${path}.bounds`,
        message: "Object must define bounds.",
      });
      valid = false;
    } else if (!validateBounds(object.bounds, `${path}.bounds`, issues)) {
      valid = false;
    }

    const attachmentPointIds = new Set<string>();
    const rawPoints = Array.isArray(object.attachmentPoints)
      ? object.attachmentPoints
      : [];
    for (const [pointIndex, point] of rawPoints.entries()) {
      if (!point || typeof point !== "object") {
        pushIssue(issues, {
          code: "required",
          path: `${path}.attachmentPoints[${pointIndex}]`,
          message: "Expected attachment point definition.",
        });
        valid = false;
        continue;
      }

      if (!validatePoint(point as SceneObjectPoint, `${path}.attachmentPoints[${pointIndex}]`, issues)) {
        valid = false;
        continue;
      }

      const pointId = (point as SceneObjectPoint).id;
      if (attachmentPointIds.has(pointId)) {
        pushIssue(issues, {
          code: "duplicate-id",
          path: `${path}.attachmentPoints[${pointIndex}].id`,
          message: `Duplicate attachment point '${pointId}' within object.`,
        });
        valid = false;
      }
      attachmentPointIds.add(pointId);
    }

    if (rawPoints.length > 0) {
      pointsByObject.set(object.id, attachmentPointIds);
    }

    if (Array.isArray(object.attachments)) {
      const attachmentIds = new Set<string>();
      for (const [attachmentIndex, attachment] of object.attachments.entries()) {
        if (!attachment || typeof attachment !== "object") {
          pushIssue(issues, {
            code: "required",
            path: `${path}.attachments[${attachmentIndex}]`,
            message: "Expected attachment definition.",
          });
          valid = false;
          continue;
        }

        if (!validateKebabId((attachment as SceneObjectAttachment).sourceObjectId, `${path}.attachments[${attachmentIndex}].sourceObjectId`, issues)) {
          valid = false;
        }

        if (!attachmentIds.has((attachment as { id?: string }).id ?? "")) {
          attachmentIds.add((attachment as { id?: string }).id ?? "");
        } else {
          pushIssue(issues, {
            code: "duplicate-id",
            path: `${path}.attachments[${attachmentIndex}].id`,
            message: "Duplicate attachment id.",
          });
          valid = false;
        }

        if (
          !validateAttachmentTarget(
            attachment as {
              id: string;
              sourceObjectId: string;
              sourcePointId: string;
              targetObjectId: string;
              targetPointId: string;
            },
            `${path}.attachments[${attachmentIndex}]`,
            issues,
            pointsByObject,
          )
        ) {
          valid = false;
        }
      }
    }
  }

  const objectIds = new Set(
    objects
      .filter((candidate): candidate is SceneObjectDefinition => Boolean(candidate && typeof candidate === "object"))
      .map((candidate) => candidate.id),
  );
  if (Array.isArray(value.stateSnapshots)) {
    for (const [stateIndex, state] of value.stateSnapshots.entries()) {
      const stateValue = state as SceneObjectObjectState;
      const path = `$.stateSnapshots[${stateIndex}]`;

      if (!stateValue || typeof stateValue !== "object") {
        pushIssue(issues, {
          code: "required",
          path,
          message: "Expected object state definition.",
        });
        valid = false;
        continue;
      }

      if (!validateKebabId(stateValue.objectId, `${path}.objectId`, issues)) {
        valid = false;
      }

      if (!objectIds.has(stateValue.objectId)) {
        pushIssue(issues, {
          code: "missing-reference",
          path: `${path}.objectId`,
          message: "objectId does not reference an object in objects.",
        });
        valid = false;
      }

      if (typeof stateValue.visible !== "boolean") {
        pushIssue(issues, {
          code: "invalid-type",
          path: `${path}.visible`,
          message: "visible must be a boolean.",
        });
        valid = false;
      }
    }
  }

  return valid
    ? { valid: true, issues, value: manifest as SceneObjectManifest }
    : { valid: false, issues };
}

export function createSceneObjectManifest(manifest: SceneObjectManifest): SceneObjectManifest {
  const result = validateSceneObjectManifest(manifest);
  if (!result.valid || !result.value) {
    const summary = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`Invalid scene object manifest. ${summary}`);
  }

  return result.value;
}

export function validateSceneObjectObjectState(state: unknown): SceneObjectValidationResult<SceneObjectObjectState> {
  if (!state || typeof state !== "object") {
    return {
      valid: false,
      issues: [{
        code: "required",
        path: "$",
        message: "Expected an object state.",
      }],
    };
  }

  const value = state as Record<string, unknown>;
  const issues: SceneObjectValidationIssue[] = [];
  let valid = true;

  if (!validateKebabId(value.objectId, "$.objectId", issues)) {
    valid = false;
  }

  if (typeof value.visible !== "boolean") {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.visible",
      message: "visible must be a boolean.",
    });
    valid = false;
  }

  return valid
    ? { valid: true, issues, value: state as SceneObjectObjectState }
    : { valid: false, issues };
}

export function resolveSceneObjectReferences(
  manifest: SceneObjectManifest,
): SceneObjectValidationResult<SceneObjectManifest> {
  const result = validateSceneObjectManifest(manifest);
  if (!result.valid || !result.value) {
    return { valid: false, issues: result.issues };
  }

  return { valid: true, issues: [], value: result.value };
}

export function resolveSceneObjectById(
  requestOrManifest:
    | SceneObjectResolutionRequest
    | SceneObjectManifest,
  objectId?: string,
): SceneObjectDefinition | undefined {
  const request: SceneObjectResolutionRequest = typeof objectId === "string"
    ? {
      manifest: requestOrManifest as SceneObjectManifest,
      objectId,
    }
    : requestOrManifest as SceneObjectResolutionRequest;

  const result = validateSceneObjectManifest(request.manifest);
  if (!result.valid || !result.value) {
    return undefined;
  }

  return result.value.objects.find((object) => object.id === request.objectId);
}
