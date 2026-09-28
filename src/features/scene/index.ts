/** Public interface of the 3D scene. Pages direct it; they never import three.js themselves. */
export { SceneDirective } from './SceneDirective';
export { SceneRoot } from './SceneRoot';
export { activeWorld, useScene, type CameraPreset, type Focus, type Source } from './store';
