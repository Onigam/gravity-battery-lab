import * as THREE from 'three';
import { emissive, MAT } from '@onigam/lab-kit/three';
import { COLOURS } from '../dims';

// The materials of the machine, made per world (the section of the `hoist` world clips its own materials and no other world's), and the two shader patches it needs:
// a smallest width on the screen for what is thin (a rope 20 mm across, seen from 90 m, is a fifth of a pixel: it would flicker), and the helical groove of the drum.

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

export interface MachineLook {
  galvanised: THREE.MeshStandardMaterial;
  galvanisedDark: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  block: THREE.MeshStandardMaterial;
  carrier: THREE.MeshStandardMaterial;
  hoist: THREE.MeshStandardMaterial;
  hoistDark: THREE.MeshStandardMaterial;
  yellow: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  bright: THREE.MeshStandardMaterial;
  drum: THREE.MeshStandardMaterial;
  brake: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  checker: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  red: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  laminations: THREE.MeshStandardMaterial;
  rope: THREE.MeshStandardMaterial;
  ropeWound: THREE.MeshStandardMaterial;
  governorRope: THREE.MeshStandardMaterial;
  cable: THREE.MeshStandardMaterial;
  led: THREE.MeshStandardMaterial;
  /** The red lamp on the ridge of the tower's roof (a 28 m tower has one). */
  beacon: THREE.MeshStandardMaterial;
  blur: THREE.MeshStandardMaterial;
  scaleLight: THREE.MeshStandardMaterial;
  scaleDark: THREE.MeshStandardMaterial;
  scaleCopper: THREE.MeshStandardMaterial;
}

/** The world keeps a line at least this many pixels wide at a canvas 800 pixels high. */
export function patchMinWidth<T extends THREE.MeshStandardMaterial>(mat: T, px: number): T {
  const prev = mat.onBeforeCompile;
  const before = mat.customProgramCacheKey.bind(mat);
  mat.customProgramCacheKey = () => `${before()}|minw${px}`;
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `#include <begin_vertex>
      {
        vec4 mvAxis = modelViewMatrix * vec4( 0.0, transformed.y, 0.0, 1.0 );
        float wr = length( modelMatrix[ 0 ].xyz );
        float widen = max( 1.0, ${px.toFixed(2)} * ( - mvAxis.z ) / ( projectionMatrix[ 1 ][ 1 ] * 800.0 * wr ) );
        transformed.xz *= widen;
      }`,
    );
  };
  return mat;
}

/**
 * The drum's helical groove, drawn on its barrel in object space (x along the drum, y and z around the axis), in the drum's own frame: a groove every `pitch` of x per turn,
 * in phase with the rope laid on it. `x0` is the axial position of the rope's first point, at the angle −90°. The pattern fades before a groove is under a few pixels.
 */
export function patchGroove(mat: THREE.MeshStandardMaterial, pitch: number, x0: number, radius: number): void {
  const prev = mat.onBeforeCompile;
  const before = mat.customProgramCacheKey.bind(mat);
  mat.customProgramCacheKey = () => `${before()}|groove`;
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGrooveP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrooveP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGrooveP;')
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          float gr = length( vGrooveP.yz );
          float onBarrel = smoothstep( ${(radius - 0.004).toFixed(4)}, ${(radius - 0.001).toFixed(4)}, gr ) * ( 1.0 - smoothstep( ${(radius + 0.002).toFixed(4)}, ${(radius + 0.006).toFixed(4)}, gr ) );
          float ga = atan( vGrooveP.z, vGrooveP.y );
          float gf = ( vGrooveP.x - ${x0.toFixed(5)} ) / ${pitch.toFixed(5)} - ( ga + 1.5707963 ) / 6.2831853;
          float gw = fwidth( vGrooveP.x / ${pitch.toFixed(5)} );
          float keep = 1.0 - smoothstep( 0.17, 0.4, gw );
          float wave = 0.5 + 0.5 * cos( 6.2831853 * gf );
          diffuseColor.rgb *= 1.0 - onBarrel * keep * 0.42 * smoothstep( 0.0, 1.0, wave );
        }`,
      );
  };
}

export function machineLook(): MachineLook {
  // two families, each with one roughness: the merge bakes the colours of a family into one mesh (fewer draw calls for the same picture)
  const metal = (color: number) => std({ color, metalness: 0.62, roughness: 0.58 });
  const paint = (color: number) => std({ color, metalness: 0.15, roughness: 0.55 });
  const led = emissive(0x53d36b, 0);
  const blur = std({
    color: 0x9aa0a6,
    metalness: 0.5,
    roughness: 0.5,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  return {
    galvanised: metal(COLOURS.galvanised),
    galvanisedDark: metal(COLOURS.galvanisedDark),
    concrete: std({ color: COLOURS.concrete, roughness: 0.95, metalness: 0 }),
    block: std({ color: COLOURS.block, roughness: 0.95, metalness: 0 }),
    carrier: paint(COLOURS.carrier),
    hoist: paint(COLOURS.hoist),
    hoistDark: paint(COLOURS.hoistDark),
    yellow: paint(COLOURS.yellow),
    steel: metal(COLOURS.steel),
    bright: MAT.inox(),
    drum: metal(COLOURS.drum),
    brake: paint(COLOURS.brake),
    rubber: MAT.rubber(),
    checker: metal(COLOURS.checker),
    roof: metal(COLOURS.roof),
    red: paint(0x9d2d22),
    copper: MAT.copper(),
    laminations: MAT.laminations(),
    rope: patchMinWidth(metal(COLOURS.rope), 1.15),
    ropeWound: metal(COLOURS.rope),
    governorRope: patchMinWidth(metal(COLOURS.ropeLight), 0.9),
    cable: std({ color: 0x1e2022, roughness: 0.75, metalness: 0 }),
    led,
    beacon: emissive(0xff3a20, 0.25),
    blur,
    scaleLight: paint(0xe8e0cd),
    scaleDark: paint(0x34373a),
    scaleCopper: paint(0xb56a2d),
  };
}
