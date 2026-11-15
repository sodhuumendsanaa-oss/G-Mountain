import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Procedural 3D Low-Poly Character Mesh for the 6 Pro Shop Avatars:
 * 1. 'goku' (Saiyan Hero)
 * 2. 'cyber_ninja' (Neo Shinobi)
 * 3. 'summit_mage' (Summit Archmage)
 * 4. 'astronaut' (Lunar Pioneer)
 * 5. 'mountaineer_pro' (Alpine Legend)
 * 6. 'gold_saiyan' (Ascended Champion - VIP)
 */
export function AvatarMesh({ avatarId = 'goku', ghost = false, resting = false }) {
  const staffRef = useRef();

  // Gentle float / spin for mage crystal staff
  useFrame(({ clock }) => {
    if (staffRef.current) {
      staffRef.current.rotation.y = clock.elapsedTime * 1.5;
      staffRef.current.position.y = 0.54 + Math.sin(clock.elapsedTime * 3) * 0.02;
    }
  });

  const mat = (color, emissive = '#000000', emissiveIntensity = 0, roughness = 0.5, metalness = 0.1) => (
    <meshStandardMaterial
      color={ghost ? '#bfe9ff' : color}
      emissive={ghost ? '#38bdf8' : emissive}
      emissiveIntensity={ghost ? 0.3 : emissiveIntensity}
      roughness={roughness}
      metalness={metalness}
      transparent={ghost}
      opacity={ghost ? 0.45 : 1}
      depthWrite={!ghost}
    />
  );

  // ----------------------------------------------------
  // 1. GOKU / SAIYAN HERO
  // ----------------------------------------------------
  if (avatarId === 'goku') {
    const hairColor = ghost ? '#c7f1ff' : resting ? '#ffe600' : '#141418';
    const hairEmissive = ghost ? '#38bdf8' : resting ? '#ffaa00' : '#000000';
    const hairEmissiveInt = ghost ? 0.4 : resting ? 0.9 : 0;
    const hairMat = mat(hairColor, hairEmissive, hairEmissiveInt, 0.4, resting ? 0.3 : 0.1);

    return (
      <group>
        {!ghost && resting && (
          <pointLight position={[0, 0.45, 0]} color="#ffe066" intensity={2.2} distance={1.8} />
        )}
        {/* Boots */}
        <mesh castShadow={!ghost} position={[-0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#1b2845')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#1b2845')}
        </mesh>
        {/* Orange Dogi Pants */}
        <mesh castShadow={!ghost} position={[-0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#f97316')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#f97316')}
        </mesh>
        {/* Blue Sash Belt with knot */}
        <mesh castShadow={!ghost} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.035, 10]} />
          {mat('#1d3557')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.04, 0.125, 0.065]} rotation={[0.1, 0, -0.2]}>
          <boxGeometry args={[0.025, 0.07, 0.015]} />
          {mat('#1d3557')}
        </mesh>
        {/* Orange Vest & V-Neck Undershirt */}
        <mesh castShadow={!ghost} position={[0, 0.255, 0]}>
          <boxGeometry args={[0.14, 0.135, 0.095]} />
          {mat('#f97316')}
        </mesh>
        <mesh position={[0, 0.275, 0.05]}>
          <planeGeometry args={[0.07, 0.08]} />
          {mat('#1d3557')}
        </mesh>
        {!ghost && (
          <mesh position={[0, 0.26, -0.05]}>
            <circleGeometry args={[0.032, 12]} />
            {mat('#f8fafc')}
          </mesh>
        )}
        {/* Arms & Wristbands */}
        <mesh castShadow={!ghost} position={[-0.095, 0.26, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.08, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.095, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.05, 8]} />
          {mat('#1d3557')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.26, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.08, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.05, 8]} />
          {mat('#1d3557')}
        </mesh>
        {/* Power Pole Staff */}
        {!ghost && (
          <group position={[0, 0.28, -0.075]} rotation={[0.35, 0.25, 0.65]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.42, 8]} />
              <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.21, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.03, 8]} />
              <meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.21, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.03, 8]} />
              <meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        )}
        {/* Head */}
        <mesh castShadow={!ghost} position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.072, 16, 16]} />
          {mat('#fbd3b6')}
        </mesh>
        {/* Spiky Hair (7 angled spikes) */}
        <mesh castShadow={!ghost} position={[0, 0.49, -0.01]} rotation={[-0.15, 0, 0]}>
          <coneGeometry args={[0.045, 0.15, 5]} />
          {hairMat}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.055, 0.46, 0.01]} rotation={[0, 0, 0.65]}>
          <coneGeometry args={[0.042, 0.14, 5]} />
          {hairMat}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.08, 0.4, -0.01]} rotation={[-0.1, 0.15, 1.05]}>
          <coneGeometry args={[0.036, 0.13, 5]} />
          {hairMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0.055, 0.45, 0.01]} rotation={[0, 0, -0.55]}>
          <coneGeometry args={[0.04, 0.13, 5]} />
          {hairMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0.075, 0.39, -0.01]} rotation={[-0.1, -0.15, -0.95]}>
          <coneGeometry args={[0.035, 0.12, 5]} />
          {hairMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0, 0.42, -0.065]} rotation={[-0.75, 0, 0]}>
          <coneGeometry args={[0.042, 0.13, 5]} />
          {hairMat}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.045, 0.37, -0.055]} rotation={[-0.55, 0.3, 0.45]}>
          <coneGeometry args={[0.035, 0.11, 5]} />
          {hairMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.37, -0.055]} rotation={[-0.55, -0.3, -0.45]}>
          <coneGeometry args={[0.035, 0.11, 5]} />
          {hairMat}
        </mesh>
      </group>
    );
  }

  // ----------------------------------------------------
  // 2. CYBER NINJA (NEO SHINOBI)
  // ----------------------------------------------------
  if (avatarId === 'cyber_ninja') {
    return (
      <group>
        {/* Subtle Cyan Cyber Glow */}
        {!ghost && <pointLight position={[0, 0.35, 0]} color="#06b6d4" intensity={1.1} distance={1.6} />}
        {/* Boots with Cyan Sole */}
        <mesh castShadow={!ghost} position={[-0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#0f172a')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#0f172a')}
        </mesh>
        {/* Slate Carbon Pants */}
        <mesh castShadow={!ghost} position={[-0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.042, 0.038, 0.09, 8]} />
          {mat('#1e293b')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.042, 0.038, 0.09, 8]} />
          {mat('#1e293b')}
        </mesh>
        {/* High-tech Belt with Cyan Glowing Buckle */}
        <mesh castShadow={!ghost} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.074, 0.074, 0.035, 10]} />
          {mat('#0f172a')}
        </mesh>
        <mesh position={[0, 0.17, 0.075]}>
          <boxGeometry args={[0.03, 0.025, 0.01]} />
          {mat('#06b6d4', '#06b6d4', 1.2)}
        </mesh>
        {/* Matte Black Carbon Chest */}
        <mesh castShadow={!ghost} position={[0, 0.255, 0]}>
          <boxGeometry args={[0.14, 0.135, 0.095]} />
          {mat('#0f172a')}
        </mesh>
        {/* Cyan Energy Seam Stripe on chest */}
        <mesh position={[0, 0.26, 0.05]}>
          <planeGeometry args={[0.02, 0.11]} />
          {mat('#06b6d4', '#06b6d4', 1.0)}
        </mesh>
        {/* Arms & Cyber Bracers */}
        <mesh castShadow={!ghost} position={[-0.095, 0.25, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.1, 8]} />
          {mat('#1e293b')}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.095, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.045, 8]} />
          {mat('#06b6d4', '#06b6d4', 0.8)}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.25, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.1, 8]} />
          {mat('#1e293b')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.045, 8]} />
          {mat('#06b6d4', '#06b6d4', 0.8)}
        </mesh>
        {/* Twin Crossed Katanas on Back */}
        {!ghost && (
          <group position={[0, 0.28, -0.07]}>
            {/* Katana 1 */}
            <group rotation={[0.25, 0.2, 0.6]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.44, 6]} />
                {mat('#1e293b')}
              </mesh>
              <mesh position={[0, 0.23, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.07, 6]} />
                {mat('#94a3b8', '#ffffff', 0.2, 0.2, 0.8)}
              </mesh>
            </group>
            {/* Katana 2 */}
            <group rotation={[0.25, -0.2, -0.6]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.44, 6]} />
                {mat('#1e293b')}
              </mesh>
              <mesh position={[0, 0.23, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.07, 6]} />
                {mat('#94a3b8', '#ffffff', 0.2, 0.2, 0.8)}
              </mesh>
            </group>
          </group>
        )}
        {/* Ninja Head Hood */}
        <mesh castShadow={!ghost} position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.074, 16, 16]} />
          {mat('#0f172a')}
        </mesh>
        {/* Glowing Neon Cyan Visor */}
        <mesh position={[0, 0.395, 0.065]}>
          <boxGeometry args={[0.11, 0.032, 0.02]} />
          {mat('#06b6d4', '#06b6d4', 1.8)}
        </mesh>
        {/* Ninja Headband Tails trailing back */}
        <mesh position={[-0.035, 0.36, -0.08]} rotation={[-0.4, 0.2, 0.4]}>
          <boxGeometry args={[0.02, 0.16, 0.005]} />
          {mat('#0f172a')}
        </mesh>
        <mesh position={[0.035, 0.35, -0.08]} rotation={[-0.4, -0.2, -0.4]}>
          <boxGeometry args={[0.02, 0.18, 0.005]} />
          {mat('#06b6d4', '#06b6d4', 0.6)}
        </mesh>
      </group>
    );
  }

  // ----------------------------------------------------
  // 3. SUMMIT ARCHMAGE
  // ----------------------------------------------------
  if (avatarId === 'summit_mage') {
    return (
      <group>
        {!ghost && <pointLight position={[0.12, 0.54, -0.06]} color="#c084fc" intensity={1.5} distance={2.0} />}
        {/* Robe Lower Gown */}
        <mesh castShadow={!ghost} position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.06, 0.095, 0.16, 12]} />
          {mat('#3b0764')}
        </mesh>
        {/* Robe Torso */}
        <mesh castShadow={!ghost} position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.075, 0.065, 0.16, 12]} />
          {mat('#4c1d95')}
        </mesh>
        {/* Gold Rune Sash */}
        <mesh position={[0, 0.24, 0.07]}>
          <planeGeometry args={[0.03, 0.14]} />
          {mat('#facc15', '#facc15', 0.5)}
        </mesh>
        {/* Robe Sleeves */}
        <mesh castShadow={!ghost} position={[-0.095, 0.23, 0]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.045, 0.14, 8]} />
          {mat('#4c1d95')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.23, 0]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.045, 0.14, 8]} />
          {mat('#4c1d95')}
        </mesh>
        {/* Hands */}
        <mesh position={[-0.11, 0.17, 0]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        <mesh position={[0.11, 0.17, 0]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        {/* Head */}
        <mesh castShadow={!ghost} position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.072, 16, 16]} />
          {mat('#fbd3b6')}
        </mesh>
        {/* Wizard Hat Brim */}
        <mesh castShadow={!ghost} position={[0, 0.435, 0]} rotation={[-0.1, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.012, 16]} />
          {mat('#3b0764')}
        </mesh>
        {/* Wizard Hat Band */}
        <mesh position={[0, 0.455, -0.01]} rotation={[-0.1, 0, 0]}>
          <cylinderGeometry args={[0.076, 0.076, 0.024, 12]} />
          {mat('#facc15')}
        </mesh>
        {/* Pointed Wizard Cone */}
        <mesh castShadow={!ghost} position={[0, 0.555, -0.03]} rotation={[-0.2, 0, 0]}>
          <coneGeometry args={[0.075, 0.22, 12]} />
          {mat('#4c1d95')}
        </mesh>
        {/* Floating Crystal Staff */}
        {!ghost && (
          <group position={[0.1, 0, 0]}>
            <mesh castShadow position={[0, 0.28, -0.06]}>
              <cylinderGeometry args={[0.01, 0.01, 0.44, 8]} />
              {mat('#78350f')}
            </mesh>
            {/* Floating Amethyst Gem */}
            <mesh ref={staffRef} position={[0, 0.54, -0.06]}>
              <octahedronGeometry args={[0.042, 0]} />
              {mat('#c084fc', '#d8b4fe', 1.8)}
            </mesh>
          </group>
        )}
      </group>
    );
  }

  // ----------------------------------------------------
  // 4. ASTRONAUT (LUNAR PIONEER)
  // ----------------------------------------------------
  if (avatarId === 'astronaut') {
    return (
      <group>
        {/* Bulky Lunar Boots */}
        <mesh castShadow={!ghost} position={[-0.05, 0.04, 0]}>
          <boxGeometry args={[0.055, 0.08, 0.085]} />
          {mat('#e2e8f0')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.05, 0.04, 0]}>
          <boxGeometry args={[0.055, 0.08, 0.085]} />
          {mat('#e2e8f0')}
        </mesh>
        {/* Pressurized White Pants */}
        <mesh castShadow={!ghost} position={[-0.05, 0.12, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 0.1, 8]} />
          {mat('#f8fafc')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.05, 0.12, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 0.1, 8]} />
          {mat('#f8fafc')}
        </mesh>
        {/* Utility Belt */}
        <mesh castShadow={!ghost} position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.078, 0.078, 0.035, 12]} />
          {mat('#64748b')}
        </mesh>
        {/* Bulky Space Suit Torso */}
        <mesh castShadow={!ghost} position={[0, 0.265, 0]}>
          <boxGeometry args={[0.155, 0.145, 0.11]} />
          {mat('#f8fafc')}
        </mesh>
        {/* NASA Chest Control Box */}
        <mesh position={[0, 0.28, 0.06]}>
          <boxGeometry args={[0.07, 0.06, 0.02]} />
          {mat('#3b82f6')}
        </mesh>
        <mesh position={[0.02, 0.29, 0.072]}>
          <sphereGeometry args={[0.007, 6, 6]} />
          {mat('#ef4444', '#ef4444', 1)}
        </mesh>
        <mesh position={[-0.02, 0.29, 0.072]}>
          <sphereGeometry args={[0.007, 6, 6]} />
          {mat('#10b981', '#10b981', 1)}
        </mesh>
        {/* Arms with elbow pads */}
        <mesh castShadow={!ghost} position={[-0.105, 0.26, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.11, 8]} />
          {mat('#f8fafc')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.105, 0.26, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.11, 8]} />
          {mat('#f8fafc')}
        </mesh>
        {/* Dual Oxygen Tanks on Back */}
        {!ghost && (
          <group position={[0, 0.27, -0.09]}>
            <mesh castShadow position={[-0.038, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
              {mat('#f1f5f9')}
            </mesh>
            <mesh castShadow position={[0.038, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
              {mat('#f1f5f9')}
            </mesh>
            {/* Antenna */}
            <mesh position={[0.05, 0.14, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.1, 4]} />
              {mat('#94a3b8')}
            </mesh>
            <mesh position={[0.05, 0.19, 0]}>
              <sphereGeometry args={[0.008, 6, 6]} />
              {mat('#ef4444', '#ef4444', 1.2)}
            </mesh>
          </group>
        )}
        {/* White Spherical Space Helmet */}
        <mesh castShadow={!ghost} position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          {mat('#f8fafc')}
        </mesh>
        {/* Reflective Golden Bubble Visor */}
        <mesh position={[0, 0.405, 0.035]}>
          <sphereGeometry args={[0.076, 16, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.3}
            roughness={0.08}
            metalness={0.92}
          />
        </mesh>
      </group>
    );
  }

  // ----------------------------------------------------
  // 5. MOUNTAINEER PRO (ALPINE LEGEND)
  // ----------------------------------------------------
  if (avatarId === 'mountaineer_pro') {
    return (
      <group>
        {/* Brown Heavy Alpine Boots */}
        <mesh castShadow={!ghost} position={[-0.045, 0.035, 0]}>
          <boxGeometry args={[0.048, 0.07, 0.075]} />
          {mat('#78350f')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.035, 0]}>
          <boxGeometry args={[0.048, 0.07, 0.075]} />
          {mat('#78350f')}
        </mesh>
        {/* Reinforced Alpine Trousers */}
        <mesh castShadow={!ghost} position={[-0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#334155')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#334155')}
        </mesh>
        {/* Climbing Harness */}
        <mesh castShadow={!ghost} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.076, 0.076, 0.035, 12]} />
          {mat('#0f172a')}
        </mesh>
        {/* Red Puffer Down Parka */}
        <mesh castShadow={!ghost} position={[0, 0.265, 0]}>
          <cylinderGeometry args={[0.08, 0.072, 0.15, 10]} />
          {mat('#dc2626')}
        </mesh>
        {/* Puffer Baffle Rings */}
        <mesh position={[0, 0.29, 0]}>
          <torusGeometry args={[0.08, 0.012, 6, 16]} />
          {mat('#b91c1c')}
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <torusGeometry args={[0.076, 0.012, 6, 16]} />
          {mat('#b91c1c')}
        </mesh>
        {/* Red Sleeves */}
        <mesh castShadow={!ghost} position={[-0.105, 0.26, 0]}>
          <cylinderGeometry args={[0.032, 0.028, 0.1, 8]} />
          {mat('#dc2626')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.105, 0.26, 0]}>
          <cylinderGeometry args={[0.032, 0.028, 0.1, 8]} />
          {mat('#dc2626')}
        </mesh>
        {/* Dual Ice Axes on Back */}
        {!ghost && (
          <group position={[0, 0.28, -0.075]}>
            <group rotation={[0.3, 0.2, 0.65]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.38, 6]} />
                {mat('#ea580c')}
              </mesh>
              <mesh position={[0, 0.19, 0.02]} rotation={[0, 0, 1.57]}>
                <cylinderGeometry args={[0.012, 0.005, 0.1, 4]} />
                {mat('#94a3b8', '#ffffff', 0.1, 0.2, 0.8)}
              </mesh>
            </group>
            <group rotation={[0.3, -0.2, -0.65]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.38, 6]} />
                {mat('#ea580c')}
              </mesh>
              <mesh position={[0, 0.19, 0.02]} rotation={[0, 0, -1.57]}>
                <cylinderGeometry args={[0.012, 0.005, 0.1, 4]} />
                {mat('#94a3b8', '#ffffff', 0.1, 0.2, 0.8)}
              </mesh>
            </group>
          </group>
        )}
        {/* Head */}
        <mesh castShadow={!ghost} position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.072, 16, 16]} />
          {mat('#fbd3b6')}
        </mesh>
        {/* Grey Winter Beanie Hat */}
        <mesh castShadow={!ghost} position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.076, 0.078, 0.045, 12]} />
          {mat('#475569')}
        </mesh>
        <mesh castShadow={!ghost} position={[0, 0.455, 0]}>
          <sphereGeometry args={[0.074, 12, 12]} />
          {mat('#475569')}
        </mesh>
        {/* Beanie Pom-Pom */}
        <mesh position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          {mat('#f8fafc')}
        </mesh>
      </group>
    );
  }

  // ----------------------------------------------------
  // 6. GOLDEN SAIYAN (ASCENDED CHAMPION - VIP)
  // ----------------------------------------------------
  if (avatarId === 'gold_saiyan') {
    const goldMat = mat('#fde047', '#eab308', 1.2, 0.3, 0.4);

    return (
      <group>
        {/* Permanent Radiant Divine Golden Aura Light */}
        {!ghost && (
          <pointLight position={[0, 0.45, 0]} color="#fde047" intensity={2.6} distance={2.4} />
        )}
        {/* Royal Gold Boots */}
        <mesh castShadow={!ghost} position={[-0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#eab308', '#eab308', 0.6, 0.3, 0.5)}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#eab308', '#eab308', 0.6, 0.3, 0.5)}
        </mesh>
        {/* Pure White Master Pants */}
        <mesh castShadow={!ghost} position={[-0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#ffffff')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#ffffff')}
        </mesh>
        {/* Royal Golden Sash Belt */}
        <mesh castShadow={!ghost} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.035, 10]} />
          {mat('#eab308', '#eab308', 0.5)}
        </mesh>
        <mesh castShadow={!ghost} position={[0.04, 0.125, 0.065]} rotation={[0.1, 0, -0.2]}>
          <boxGeometry args={[0.025, 0.07, 0.015]} />
          {mat('#eab308', '#eab308', 0.5)}
        </mesh>
        {/* Pure White Gi Vest with Gold Trim */}
        <mesh castShadow={!ghost} position={[0, 0.255, 0]}>
          <boxGeometry args={[0.14, 0.135, 0.095]} />
          {mat('#ffffff')}
        </mesh>
        <mesh position={[0, 0.275, 0.05]}>
          <planeGeometry args={[0.07, 0.08]} />
          {mat('#1e3a8a')}
        </mesh>
        {/* Golden Emblem on Back */}
        {!ghost && (
          <mesh position={[0, 0.26, -0.05]}>
            <circleGeometry args={[0.034, 16]} />
            {mat('#eab308', '#fde047', 0.8)}
          </mesh>
        )}
        {/* Arms & Gold Wristbands */}
        <mesh castShadow={!ghost} position={[-0.095, 0.26, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.08, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.095, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.05, 8]} />
          {mat('#eab308', '#eab308', 0.8)}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.26, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.08, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.05, 8]} />
          {mat('#eab308', '#eab308', 0.8)}
        </mesh>
        {/* Head */}
        <mesh castShadow={!ghost} position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.072, 16, 16]} />
          {mat('#fbd3b6')}
        </mesh>
        {/* Ascended Super Saiyan Golden Flared Hair */}
        <mesh castShadow={!ghost} position={[0, 0.5, -0.01]} rotation={[-0.15, 0, 0]}>
          <coneGeometry args={[0.05, 0.17, 5]} />
          {goldMat}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.06, 0.47, 0.01]} rotation={[0, 0, 0.65]}>
          <coneGeometry args={[0.046, 0.16, 5]} />
          {goldMat}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.09, 0.41, -0.01]} rotation={[-0.1, 0.15, 1.1]}>
          <coneGeometry args={[0.04, 0.15, 5]} />
          {goldMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0.06, 0.46, 0.01]} rotation={[0, 0, -0.55]}>
          <coneGeometry args={[0.044, 0.15, 5]} />
          {goldMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0.085, 0.4, -0.01]} rotation={[-0.1, -0.15, -1.0]}>
          <coneGeometry args={[0.038, 0.14, 5]} />
          {goldMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0, 0.43, -0.07]} rotation={[-0.75, 0, 0]}>
          <coneGeometry args={[0.046, 0.15, 5]} />
          {goldMat}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.05, 0.38, -0.06]} rotation={[-0.55, 0.3, 0.45]}>
          <coneGeometry args={[0.038, 0.13, 5]} />
          {goldMat}
        </mesh>
        <mesh castShadow={!ghost} position={[0.05, 0.38, -0.06]} rotation={[-0.55, -0.3, -0.45]}>
          <coneGeometry args={[0.038, 0.13, 5]} />
          {goldMat}
        </mesh>
      </group>
    );
  }

  return null;
}
