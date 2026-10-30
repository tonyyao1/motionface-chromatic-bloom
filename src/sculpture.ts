import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;
export const SETTINGS = {
  seed: 317,
  filaments: 224,
  clusters: 420,
  grainsPerCluster: 180,
  background: '#a7afb0',
};

// Seeded randomness is essential: workers must generate identical geometry.
function randomGenerator(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

// A fluted, folded toroidal membrane. u follows the ring; v wraps its section.
export function surface(u: number, v: number, layer = 1): THREE.Vector3 {
  const ring = 0.86 + 0.115 * Math.sin(3 * u + 0.7);
  const tube = (0.54 + 0.16 * Math.sin(3 * u - 0.6)) * layer;
  const flute = 1 + 0.023 * Math.sin(28 * u + 3 * v);
  const radial = ring + tube * Math.cos(v) * flute;
  return new THREE.Vector3(
    radial * Math.cos(u),
    radial * Math.sin(u) * 1.12,
    0.30 * Math.sin(2 * u + 0.6) + tube * Math.sin(v) * 0.82,
  );
}

function normal(u: number, v: number) {
  const p = surface(u, v, 0.75);
  const du = surface(u + 0.001, v, 0.75).sub(p);
  const dv = surface(u, v + 0.001, 0.75).sub(p);
  return du.cross(dv).normalize();
}

const palette = ['#d893c4', '#879ce0', '#8ec6b8', '#547875', '#cc605d', '#c5b584', '#c9bfdc'];

export function makeSculpture() {
  const random = randomGenerator(SETTINGS.seed);
  const tubes: THREE.BufferGeometry[] = [];
  const beads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 6, 5),
    new THREE.MeshStandardMaterial({color: '#fafafa', roughness: 0.28, metalness: 0.1}),
    SETTINGS.filaments * 2,
  );
  const helper = new THREE.Object3D();
  for (let i = 0; i < SETTINGS.filaments; i++) {
    const u = (i / SETTINGS.filaments) * TAU;
    const points = Array.from({length: 97}, (_, j) => surface(u, (j / 96) * TAU, 1.23));
    const curve = new THREE.CatmullRomCurve3(points, true);
    tubes.push(new THREE.TubeGeometry(curve, 96, 0.0034, 4, true));
    for (let end = 0; end < 2; end++) {
      helper.position.copy(surface(u, end * Math.PI, 1.23));
      helper.scale.setScalar(0.010 + random() * 0.003);
      helper.updateMatrix();
      beads.setMatrixAt(i * 2 + end, helper.matrix);
    }
  }
  const filamentGeometry = mergeGeometries(tubes);
  tubes.forEach((g) => g.dispose());
  const filaments = new THREE.Mesh(filamentGeometry, new THREE.MeshPhysicalMaterial({
    color: '#f7f8fc', emissive: '#dbe9eb', emissiveIntensity: 0.55,
    roughness: 0.30, metalness: 0.18,
    clearcoat: 0.65, clearcoatRoughness: 0.23,
  }));

  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const us = 224;
  const vs = 80;
  for (let i = 0; i <= us; i++) {
    const u = (i / us) * TAU;
    for (let j = 0; j <= vs; j++) {
      const v = (j / vs) * TAU;
      const p = surface(u, v, 0.73);
      vertices.push(p.x, p.y, p.z);
      const hue = 0.64 + 0.18 * Math.sin(u * 3 + v * 1.8);
      const color = new THREE.Color().setHSL(hue, 0.23, 0.59 + 0.10 * Math.sin(v));
      colors.push(color.r, color.g, color.b);
      if (i < us && j < vs) {
        const a = i * (vs + 1) + j;
        const b = (i + 1) * (vs + 1) + j;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const skinGeometry = new THREE.BufferGeometry();
  skinGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  skinGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  skinGeometry.setIndex(indices);
  skinGeometry.computeVertexNormals();
  const skin = new THREE.Mesh(skinGeometry, new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.33, metalness: 0.08,
    clearcoat: 0.75, iridescence: 0.75, iridescenceIOR: 1.32,
    iridescenceThicknessRange: [120, 380], side: THREE.DoubleSide,
  }));

  const count = SETTINGS.clusters * SETTINGS.grainsPerCluster;
  const grains = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({roughness: 0.92, metalness: 0}),
    count,
  );
  let index = 0;
  for (let cluster = 0; cluster < SETTINGS.clusters; cluster++) {
    let u = random() * TAU;
    // The top-right opening stays mostly exposed, revealing the white skeleton.
    if (u > 0.15 && u < 1.9 && random() < 0.85) u = Math.PI + random() * Math.PI;
    const v = 0.40 + random() * 2.18;
    const root = surface(u, v, 1.04);
    const n = normal(u, v);
    const height = 0.09 + random() * 0.17;
    const spread = 0.065 + random() * 0.075;
    const base = Math.floor((Math.sin(u * 4 + v * 3) * 0.5 + 0.5) * (palette.length - 1));
    const baseColor = new THREE.Color(palette[base]);
    for (let grain = 0; grain < SETTINGS.grainsPerCluster; grain++) {
      const growth = Math.pow(random(), 0.45);
      const azimuth = random() * TAU;
      const elevation = Math.acos(2 * random() - 1);
      const radius = spread * Math.cbrt(random());
      helper.position.copy(root).addScaledVector(n, height * growth);
      helper.position.add(new THREE.Vector3(
        Math.cos(azimuth) * Math.sin(elevation) * radius,
        Math.sin(azimuth) * Math.sin(elevation) * radius,
        Math.cos(elevation) * radius,
      ));
      helper.rotation.set(random() * TAU, random() * TAU, random() * TAU);
      const size = 0.004 + Math.pow(random(), 2) * 0.010;
      helper.scale.set(size, size * (1.1 + random() * 1.6), size * 0.80);
      helper.updateMatrix();
      grains.setMatrixAt(index, helper.matrix);
      const c = baseColor.clone().lerp(new THREE.Color('#faf0fa'), growth * 0.20);
      // Dark roots give the clusters depth without expensive real-time shadows.
      c.multiplyScalar(0.24 + 0.76 * growth);
      grains.setColorAt(index, c);
      index++;
    }
  }
  grains.instanceMatrix.needsUpdate = true;
  if (grains.instanceColor) grains.instanceColor.needsUpdate = true;
  beads.instanceMatrix.needsUpdate = true;
  const sculpture = new THREE.Group();
  sculpture.add(skin, filaments, grains, beads);
  return sculpture;
}
