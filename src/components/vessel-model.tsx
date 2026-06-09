'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// ── Dimensions (all in meters) ──────────────────────────────────────

/** Inner diameter of the main cylinder */
const CYL_INNER_DIA = 0.410;
/** Wall thickness */
const WALL = 0.0045;
/** Height of the cylindrical section */
const CYL_HEIGHT = 0.310;
/** Inner diameter of the outlet pipe */
const PIPE_INNER_DIA = 0.100;
/** Slant length of the conical transition */
const CONE_SLANT = 0.900;
/** Length of the outlet pipe */
const PIPE_LENGTH = 0.200;
/** Fillet radius at transitions (10 mm) */
const FILLET_R = 0.010;
/** Number of segments per fillet arc */
const FILLET_SEGMENTS = 6;

// ── Derived dimensions ────────────────────────────────────────────

const R_CYL_INNER = CYL_INNER_DIA / 2;   // 0.205
const R_CYL_OUTER = R_CYL_INNER + WALL;  // 0.2095
const R_PIPE_INNER = PIPE_INNER_DIA / 2; // 0.050
const R_PIPE_OUTER = R_PIPE_INNER + WALL; // 0.0545

/** Cone axial height computed from slant length: h = √(L² - Δr²) */
const DELTA_R = (CYL_INNER_DIA - PIPE_INNER_DIA) / 2; // 0.155
const CONE_HEIGHT = Math.sqrt(CONE_SLANT ** 2 - DELTA_R ** 2); // ≈ 0.8866

// ── Profile generation ─────────────────────────────────────────────

/**
 * Builds the 2D cross-section profile of the vessel as a closed loop.
 * The profile is revolved around the Y-axis by LatheGeometry.
 *
 * Coordinate system: X = radius, Y = height
 * y=0 is the cylinder-cone junction plane
 *
 * Profile traces: outer surface top→bottom, then inner surface bottom→top
 */
function buildProfile(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  const fr = FILLET_R;
  const segs = FILLET_SEGMENTS;
  const H = CYL_HEIGHT;
  const Hc = CONE_HEIGHT;
  const Hp = PIPE_LENGTH;
  const Ro = R_CYL_OUTER;
  const Ri = R_CYL_INNER;
  const ro = R_PIPE_OUTER;
  const ri = R_PIPE_INNER;

  // ── OUTER SURFACE (top → bottom) ──

  // Top center → top outer rim
  pts.push(new THREE.Vector2(0, H));
  pts.push(new THREE.Vector2(Ro, H));

  // Cylinder wall down to fillet start
  pts.push(new THREE.Vector2(Ro, fr));

  // Fillet arc at cylinder→cone junction (outer)
  // Center at (Ro - fr, -fr)
  // Arc from θ=0 (right, on cylinder wall) → θ=π/2 (up, toward cone)
  {
    const fcx = Ro - fr;
    const fcy = -fr;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * (Math.PI / 2);
      pts.push(new THREE.Vector2(fcx + fr * Math.cos(a), fcy + fr * Math.sin(a)));
    }
  }

  // Cone outer: linear from r=Ro at y=0 to r=ro at y=-Hc
  // Starting from (Ro - fr, 0) after fillet to (ro, -Hc)
  // We'll add a couple intermediate points for the straight line
  pts.push(new THREE.Vector2(ro, -Hc));

  // Fillet arc at cone→pipe junction (outer)
  // Corner at (ro, -Hc). Center at (ro - fr, -Hc + fr).
  // Arc from θ=0 (right, on pipe) → θ=-π/2 (down, toward cone)
  {
    const fcx2 = ro - fr;
    const fcy2 = -Hc + fr;
    for (let i = 0; i <= segs; i++) {
      const a = - (i / segs) * (Math.PI / 2);
      pts.push(new THREE.Vector2(fcx2 + fr * Math.cos(a), fcy2 + fr * Math.sin(a)));
    }
  }

  // Pipe outer down to bottom
  pts.push(new THREE.Vector2(ro, -Hc - Hp));
  // Bottom center
  pts.push(new THREE.Vector2(0, -Hc - Hp));

  // ── INNER SURFACE (bottom → top) ──

  // Pipe inner
  pts.push(new THREE.Vector2(ri, -Hc - Hp));
  pts.push(new THREE.Vector2(ri, -Hc));

  // Cone inner: linear from ri at y=-Hc to Ri at y=0
  pts.push(new THREE.Vector2(Ri, 0));

  // Cylinder inner
  pts.push(new THREE.Vector2(Ri, H));
  // Top center (close the loop)
  pts.push(new THREE.Vector2(0, H));

  return pts;
}

// ── Exported component ──────────────────────────────────────────────

export default function VesselModel(props: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const geometry = useMemo(() => {
    const profile = buildProfile();
    // LatheGeometry revolves the profile around the Y-axis
    const geo = new THREE.LatheGeometry(profile, 96);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group position={props.position} rotation={props.rotation} scale={props.scale}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.7}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Top rim ring — emphasizes the opening */}
      <mesh position={[0, CYL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R_CYL_OUTER - WALL / 2, WALL, 16, 64]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Bottom rim ring */}
      <mesh position={[0, -CONE_HEIGHT - PIPE_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R_PIPE_OUTER - WALL / 2, WALL, 16, 64]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ── Re-export dimensions for external use ────────────────────────────

export const VESSEL_DIMS = {
  /** Total height of the vessel */
  totalHeight: CYL_HEIGHT + CONE_HEIGHT + PIPE_LENGTH,
  /** Maximum outer diameter */
  maxDiameter: R_CYL_OUTER * 2,
  /** Cylinder outer diameter */
  cylinderDia: R_CYL_OUTER * 2,
  /** Cone axial height (computed) */
  coneHeight: CONE_HEIGHT,
  /** Cone slant length */
  coneSlant: CONE_SLANT,
  /** Outlet pipe diameter */
  pipeDia: R_PIPE_OUTER * 2,
  /** Wall thickness */
  wallThickness: WALL,
  /** Inner volume (approximate, m³) */
  innerVolume:
    Math.PI * R_CYL_INNER ** 2 * CYL_HEIGHT +
    (Math.PI * CONE_HEIGHT / 3) * (R_CYL_INNER ** 2 + R_PIPE_INNER ** 2 + R_CYL_INNER * R_PIPE_INNER) +
    Math.PI * R_PIPE_INNER ** 2 * PIPE_LENGTH,
};
