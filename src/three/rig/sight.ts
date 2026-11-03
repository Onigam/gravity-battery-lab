import * as THREE from 'three';

// What can be seen of a thing that moves. A part that rides on the weight goes up a lattice: a strut or a diagonal crosses any one line of sight at some height, and at the top of the stroke
// the head frame's ring beam stands in front of everything seen from above it. No single direction serves the whole stroke, and the camera may only go about 5° under its target (the kit's
// orbit limit). So such a part keeps a short list of directions in the order they read best, and the first that sees it whole is used when the kit asks for it. Only the steel in between
// is tested, not the hoist's thousands of triangles: this runs once per framing, never per frame, and costs a few milliseconds.

const shown = (o: THREE.Object3D): boolean => {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
};

/** How many of `points` can be seen from `eye`: a ray to each one, stopped by the first obstacle shown in solid (a part ghosted by X-ray stops nothing). */
export function pointsInSight(eye: THREE.Vector3, points: THREE.Vector3[], obstacles: THREE.Mesh[]): number {
  const rc = new THREE.Raycaster();
  const dir = new THREE.Vector3();
  let seen = 0;
  for (const p of points) {
    dir.copy(p).sub(eye);
    const dist = dir.length();
    rc.set(eye, dir.normalize());
    rc.far = Math.max(0.001, dist - 0.01);
    const hit = obstacles.some(
      (m) => m.material === m.userData.solidMaterial && shown(m) && rc.intersectObject(m, false).length > 0,
    );
    if (!hit) seen++;
  }
  return seen;
}

/**
 * The first of `dirs` from which at least `clear` of `points` can be seen from `dist` away from `centre`; failing that, the one that sees the most, the earlier one in a tie. A bolt in front of
 * a corner is no reason to fly round the tower, so `clear` is less than all.
 */
export function clearestDir(
  centre: THREE.Vector3,
  points: THREE.Vector3[],
  dirs: readonly THREE.Vector3[],
  dist: number,
  obstacles: THREE.Mesh[],
  clear = 0.7,
): THREE.Vector3 {
  let best = dirs[0]!;
  let most = -1;
  const eye = new THREE.Vector3();
  for (const d of dirs) {
    const seen = pointsInSight(eye.copy(centre).addScaledVector(d, dist), points, obstacles);
    if (seen >= clear * points.length) return d;
    if (seen > most) {
      most = seen;
      best = d;
    }
  }
  return best;
}

/** About `n` points of what a part is made of, spread over its meshes by size: chosen once, read where they are now. A mesh not shown gives none. */
export function partPoints(meshes: THREE.Mesh[], n: number): () => THREE.Vector3[] {
  const total = meshes.reduce((a, m) => a + m.geometry.attributes.position!.count, 0);
  const picks = meshes.map((m) => {
    const count = m.geometry.attributes.position!.count;
    const k = Math.max(1, Math.round((n * count) / total));
    return { m, step: Math.max(1, Math.floor(count / k)), count };
  });
  return () => {
    const out: THREE.Vector3[] = [];
    for (const { m, step, count } of picks) {
      if (!shown(m)) continue;
      for (let i = 0; i < count; i += step)
        out.push(
          new THREE.Vector3()
            .fromBufferAttribute(m.geometry.attributes.position as THREE.BufferAttribute, i)
            .applyMatrix4(m.matrixWorld),
        );
    }
    return out;
  };
}
