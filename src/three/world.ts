import * as THREE from 'three';
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { PAPER_STUDIO, type Hotspot } from '@onigam/lab-kit/three';

// What the two worlds share: the lighting of a workshop world (paper, soft shadows, like the other labs of the series), the
// hotspot declarations, and the helpers of the tests (positions of anchors).

export interface WorkshopOptions {
  name: string;
  /** Fog start and end, metres. */
  fog: [number, number];
  /** Position of the key light and the point it looks at. */
  key: [number, number, number];
  target: [number, number, number];
  /** Half size of the shadow box and its far plane. */
  shadowHalf: number;
  shadowFar: number;
}

export function workshopScene(o: WorkshopOptions): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = o.name;
  scene.background = new THREE.Color(0xefe6d3);
  scene.fog = new THREE.Fog(0xefe6d3, o.fog[0], o.fog[1]);
  // the stage fills scene.environment from a shared PMREM environment
  scene.userData.wantsEnv = true;
  // the paper studio of kit 0.5: Neutral tone mapping keeps the paper the paper, the warm studio lights the metal
  scene.userData.look = { ...PAPER_STUDIO };
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0xb6a68c, 1.1));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(...o.key);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -o.shadowHalf;
  sc.right = o.shadowHalf;
  sc.top = o.shadowHalf;
  sc.bottom = -o.shadowHalf;
  sc.near = 0.1;
  sc.far = o.shadowFar;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = o.shadowHalf * 0.0035;
  key.target.position.set(...o.target);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.7);
  fill.position.set(-o.key[0], o.key[1] * 0.6, o.key[2] * 0.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(o.key[0] * 0.2, o.key[1], -o.key[2]);
  scene.add(rim);
  return scene;
}

/** A direction to look at a part from, as the camera sees it: its elevation over the horizon and its bearing from +Z towards +X, in degrees. */
export function viewFrom(elevation: number, bearing: number): THREE.Vector3 {
  const e = (elevation * Math.PI) / 180;
  const b = (bearing * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e));
}

export interface HotspotDef {
  id: string;
  fr: string;
  en: string;
  minor?: boolean;
  /** World to open when the label is clicked. */
  goto?: string;
}

/** An empty marker at a position of `parent`: the label follows it, also during the explode. */
export function anchor(parent: THREE.Object3D, x: number, y: number, z: number, name = 'anchor'): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}

export function hotspots(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): Hotspot[] {
  return defs.map((d) => ({
    partId: d.id.replace(/#.*$/, ''),
    anchor: anchors[d.id],
    label: l(d.fr, d.en),
    minor: d.minor,
    goto: d.goto,
  }));
}

/** Below this width of the page the 3D view is too narrow for a label's whole name to the right of its dot: a tablet or a phone, with the panel beside the view or the sheet under it. */
const NARROW_LABEL = 1100;

/**
 * A label that a narrow view would cut, kept whole (kit request 19 is the real answer: a label's side). `left`: it reads to the left of its anchor, its right end at the part. `short`: a shorter name.
 * `at`: where its dot stands on the part, by the width.
 * The kit writes a label's text when the display changes, not every frame, so this is written each frame, and only if it differs. No DOM under vitest: nothing happens there.
 */
export function holdLabel(
  a: THREE.Object3D,
  o: { left?: boolean; full?: L; short?: L; at?: { wide: THREE.Vector3; narrow: THREE.Vector3 } },
): void {
  const css = a.children[0] as (THREE.Object3D & { element?: HTMLElement; center?: THREE.Vector2 }) | undefined;
  if (!css?.element) return;
  const narrow = css.element.ownerDocument.documentElement.clientWidth < NARROW_LABEL;
  if (o.left && css.center) css.center.x = narrow ? 1 : 0;
  if (o.at) a.position.copy(narrow ? o.at.narrow : o.at.wide);
  if (o.short && o.full) {
    const text = css.element.querySelector<HTMLElement>('.hotspot__text');
    const want = tr(narrow ? o.short : o.full);
    if (text && text.textContent !== want) text.textContent = want;
  }
}

/** Meshes of a sub-tree whose position is not finite: the tests and the animation share this guard. */
export function allFinite(root: THREE.Object3D): boolean {
  let ok = true;
  root.traverse((o) => {
    const v = [
      o.position.x,
      o.position.y,
      o.position.z,
      o.rotation.x,
      o.rotation.y,
      o.rotation.z,
      o.scale.x,
      o.scale.y,
      o.scale.z,
    ];
    if (!v.every(Number.isFinite)) ok = false;
  });
  return ok;
}
