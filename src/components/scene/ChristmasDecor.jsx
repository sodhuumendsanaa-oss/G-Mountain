import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { heightAt, H } from '../../lib/terrain.js';

/**
 * 4-Tiered Grand Christmas Tree for the Summit (8,848m)
 * Complete with glowing Bethlehem star, baubles, and wrapped presents!
 */
export function SummitChristmasTree({ conquered = false }) {
  const top = heightAt(0, 0);
  const starRef = useRef();

  useFrame(({ clock }) => {
    if (starRef.current) {
      starRef.current.rotation.y = clock.elapsedTime * 1.2;
    }
  });

  return (
    <group position={[0, top, 0]}>
      {/* Wooden Trunk */}
      <mesh castShadow position-y={0.25}>
        <cylinderGeometry args={[0.08, 0.11, 0.5, 8]} />
        <meshStandardMaterial color="#4a2e18" roughness={0.9} />
      </mesh>

      {/* Tier 1 (Base evergreen) */}
      <mesh castShadow position-y={0.65}>
        <coneGeometry args={[0.55, 0.7, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.8} />
      </mesh>
      {/* Tier 2 */}
      <mesh castShadow position-y={1.05}>
        <coneGeometry args={[0.42, 0.65, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      {/* Tier 3 */}
      <mesh castShadow position-y={1.45}>
        <coneGeometry args={[0.29, 0.55, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
      {/* Tier 4 (Top tier) */}
      <mesh castShadow position-y={1.75}>
        <coneGeometry args={[0.16, 0.4, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>

      {/* Golden Bethlehem Summit Star */}
      <group ref={starRef} position={[0, 2.05, 0]}>
        <mesh>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#ffb700"
            emissiveIntensity={conquered ? 2.5 : 1.8}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
        <pointLight color="#ffe066" intensity={conquered ? 3.0 : 2.0} distance={6.0} />
      </group>

      {/* Twinkling Ornaments / Baubles */}
      <mesh position={[0.28, 0.6, 0.28]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.25, 0.7, 0.25]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.22, 1.0, -0.2]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.2, 1.1, -0.2]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.35, 0.18]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>

      {/* Wrapped Gift Boxes under tree */}
      <group position={[0.3, 0.1, 0.15]} rotation={[0, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.091, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 0.18]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      </group>
      <group position={[-0.25, 0.08, 0.22]} rotation={[0, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial color="#2563eb" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.076, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 0.15]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      <group position={[0.05, 0.07, -0.28]} rotation={[0, 0.8, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#16a34a" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.071, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 0.14]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* Holiday Magic Sparkles */}
      <Sparkles count={conquered ? 120 : 60} scale={[3.5, 3.0, 3.5]} position-y={1.2} size={4.5} speed={0.8} color="#ffe28a" />
    </group>
  );
}

/**
 * Holiday Presents & Candy Canes Placed at Camps
 */
export function CampHolidayPresents({ position }) {
  if (!position) return null;
  const [x, y, z] = position;

  return (
    <group position={[x + 0.38, y, z - 0.25]}>
      {/* Red & Gold Ribbon Gift Box */}
      <group position={[0, 0.07, 0]} rotation={[0, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#e11d48" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.071, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.035, 0.14]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </group>

      {/* Green & Silver Gift Box */}
      <group position={[0.15, 0.055, 0.06]} rotation={[0, -0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.11, 0.11, 0.11]} />
          <meshStandardMaterial color="#059669" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.025, 0.11]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* Candy Cane Marker */}
      <group position={[-0.14, 0.16, 0.08]} rotation={[0.08, 0, 0.12]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.32, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Red stripe rings */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.04, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.04, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Gentle Peaceful Holiday Snowflakes
 */
export function HolidaySnow({ count = 300 }) {
  const ref = useRef();
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 8;
      positions.set([Math.cos(a) * r, H * 0.4 + Math.random() * 6, Math.sin(a) * r], i * 3);
      speeds[i] = 0.2 + Math.random() * 0.4;
    }
    return { positions, speeds };
  }, [count]);

  useFrame(({ clock }, dt) => {
    const attr = ref.current?.geometry.attributes.position;
    if (!attr) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let x = attr.getX(i), y = attr.getY(i), z = attr.getZ(i);
      y -= speeds[i] * dt;
      x += Math.sin(t * 0.6 + i) * 0.15 * dt;
      z += Math.cos(t * 0.5 + i * 0.2) * 0.15 * dt;
      if (y < heightAt(x, z) || Math.hypot(x, z) > 8.5) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 8;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        y = H * 0.7 + Math.random() * 4;
      }
      attr.setXYZ(i, x, y, z);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.065} transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}
