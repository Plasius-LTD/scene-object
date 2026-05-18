export const SCENE_OBJECT_SCHEMA_VERSION = "1.0.0";
export const SCENE_OBJECT_RUNTIME_FLAG_ID = "scene.object.runtime.enabled";

export type SceneObjectStateKind = "idle" | "visible" | "hidden" | "disabled";

export type SceneObjectCoordinateSpace =
  | "normalized-viewport"
  | "pixel-viewport"
  | "world"
  | "local";

export type SceneObjectUnits = "ratio" | "pixels";

export interface SceneObjectVector3 {
  x: number;
  y: number;
  z: number;
}

export interface SceneObjectTransform {
  translate: SceneObjectVector3;
  rotate: SceneObjectVector3;
  scale: SceneObjectVector3;
}

export interface SceneObjectBounds {
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    unit: SceneObjectUnits;
  };
  depth?: number;
  coordinateSpace: SceneObjectCoordinateSpace;
}

export interface SceneObjectPoint {
  id: string;
  x: number;
  y: number;
  z?: number;
}

export interface SceneObjectAttachment {
  id: string;
  sourceObjectId: string;
  sourcePointId: string;
  targetObjectId: string;
  targetPointId: string;
  offset?: SceneObjectVector3;
}

export type SceneObjectAttachmentPoint = SceneObjectPoint;

export interface SceneObjectObjectState {
  objectId: string;
  visible: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SceneObjectReference {
  objectId: string;
  pointId: string;
}

export interface SceneObjectManifest {
  schemaVersion: string;
  objects: SceneObjectDefinition[];
  stateSnapshots?: SceneObjectObjectState[];
}

export interface SceneObjectDefinition {
  id: string;
  name?: string;
  transform: SceneObjectTransform;
  bounds: SceneObjectBounds;
  attachmentPoints?: SceneObjectPoint[];
  attachments?: SceneObjectAttachment[];
}

export type SceneObjectValidationCode =
  | "required"
  | "invalid-type"
  | "invalid-value"
  | "invalid-id"
  | "duplicate-id"
  | "invalid-reference"
  | "missing-reference";

export interface SceneObjectValidationIssue {
  code: SceneObjectValidationCode;
  path: string;
  message: string;
}

export interface SceneObjectValidationResult<T> {
  valid: boolean;
  issues: SceneObjectValidationIssue[];
  value?: T;
}

export interface SceneObjectResolutionRequest {
  manifest: SceneObjectManifest;
  objectId: string;
}

export interface SceneObjectResolutionResult {
  manifest: SceneObjectManifest;
  object: SceneObjectDefinition;
}
