"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BackSide, Vector3, type ShaderMaterial } from "three";
import { BAND_LATITUDE, CALM_INNER_LATITUDE, GLOBE_RADIUS } from "@/components/world3d/globe-math";

const DEG = Math.PI / 180;

/** Direction the sunlight comes from. Shared with the scene's directional light. */
export const SUN_DIRECTION = new Vector3(0.55, 0.45, 0.7).normalize();

const OCEAN_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vLocal = normalize(position);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * The sea is coloured by latitude: deep blue in the four Blues, a brighter band for the
 * Grand Line at the equator, and a pale, striped strip on each side of it for the Calm Belts.
 * Moving noise breaks it up into swells, and a soft highlight follows the sun.
 */
const OCEAN_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSun;
  uniform float uBand;
  uniform float uCalmInner;

  varying vec3 vLocal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  vec3 toLinear(vec3 srgb) {
    return pow(srgb, vec3(2.2));
  }

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }

  void main() {
    float lat = asin(clamp(vLocal.y, -1.0, 1.0));
    float absLat = abs(lat);
    float lon = atan(vLocal.x, vLocal.z);

    // Colours are written as they should look on screen, then moved into linear light,
    // because the renderer converts back to sRGB at the end.
    vec3 shallow = toLinear(vec3(0.06, 0.33, 0.49));
    vec3 deep = toLinear(vec3(0.02, 0.12, 0.22));
    vec3 grandLine = toLinear(vec3(0.13, 0.56, 0.70));
    vec3 calm = toLinear(vec3(0.56, 0.76, 0.80));

    // The Blues darken toward the poles.
    vec3 color = mix(shallow, deep, smoothstep(uBand, 1.35, absLat));

    // Grand Line proper, then the Calm Belt strip between it and the Blues.
    float edge = 0.006;
    float inGrandLine = 1.0 - smoothstep(uCalmInner - edge, uCalmInner + edge, absLat);
    float inCalm = smoothstep(uCalmInner - edge, uCalmInner + edge, absLat) * (1.0 - smoothstep(uBand - edge, uBand + edge, absLat));
    color = mix(color, grandLine, inGrandLine);
    float stripes = 0.5 + 0.5 * sin(lon * 150.0 + lat * 60.0);
    color = mix(color, mix(grandLine, calm, 0.45 + 0.2 * stripes), inCalm * 0.8);

    // Swells: none in the Calm Belts, which is the whole point of them.
    float swell = noise(vLocal * 16.0 + vec3(uTime * 0.14, 0.0, uTime * 0.1));
    float ripple = noise(vLocal * 58.0 - vec3(0.0, uTime * 0.24, uTime * 0.18));
    float waves = (swell * 0.34 + ripple * 0.16 - 0.25) * (1.0 - inCalm * 0.85);
    color *= 1.0 + waves;

    vec3 normal = normalize(vWorldNormal);
    vec3 view = normalize(cameraPosition - vWorldPosition);
    float daylight = max(dot(normal, uSun), 0.0);
    color *= 0.62 + 0.68 * daylight;

    // A wide, faint sheen where the sun reflects toward the viewer.
    float sheen = pow(max(dot(reflect(-uSun, normal), view), 0.0), 26.0);
    color += vec3(1.0, 0.96, 0.85) * sheen * 0.07;

    float rim = pow(1.0 - max(dot(normal, view), 0.0), 3.0);
    color += toLinear(vec3(0.30, 0.62, 0.80)) * rim * 0.35;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float glow = pow(max(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.2);
    gl_FragColor = vec4(0.35, 0.72, 1.0, 1.0) * glow;
  }
`;

interface OceanProps {
  /** Called when the bare sea is clicked (not dragged). */
  onClickSea: () => void;
}

/** The globe itself: a shaded sea and a thin glowing atmosphere. */
export function Ocean({ onClickSea }: OceanProps) {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSun: { value: SUN_DIRECTION },
      uBand: { value: BAND_LATITUDE * DEG },
      uCalmInner: { value: CALM_INNER_LATITUDE * DEG },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <group>
      <mesh
        // The sea swallows pointer events, so markers on the far side of the globe never react.
        onPointerMove={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          if (event.delta < 4) onClickSea();
        }}
      >
        <sphereGeometry args={[GLOBE_RADIUS, 128, 96]} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={OCEAN_VERTEX} fragmentShader={OCEAN_FRAGMENT} />
      </mesh>

      <mesh scale={1.13} raycast={() => null}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 48]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX}
          fragmentShader={ATMOSPHERE_FRAGMENT}
          side={BackSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
