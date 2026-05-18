export {
  SCENE_OBJECT_RUNTIME_FLAG_ID,
  SCENE_OBJECT_SCHEMA_VERSION,
  type SceneObjectAttachment,
  type SceneObjectAttachmentPoint,
  type SceneObjectBounds,
  type SceneObjectManifest,
  type SceneObjectObjectState,
  type SceneObjectPoint,
  type SceneObjectReference,
  type SceneObjectResolutionRequest,
  type SceneObjectResolutionResult,
  type SceneObjectStateKind,
  type SceneObjectTransform,
  type SceneObjectValidationIssue,
  type SceneObjectValidationResult,
  type SceneObjectVector3,
} from "./types.js";
export {
  createSceneObjectManifest,
  resolveSceneObjectById,
  resolveSceneObjectReferences,
  validateSceneObjectManifest,
  validateSceneObjectObjectState,
} from "./validation.js";
export { resolveSceneObjectState } from "./resolve.js";
