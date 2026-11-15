import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Html, Line, Sparkles } from '@react-three/drei';
import { heightAt, H } from '../lib/terrain.js';
import { layoutNodes, baseCampPosition, trailPoints, pointAtFraction, placeCamps } from '../lib/layout.js';
import { scheduleSlices, hoursProgress, isCampReached } from '../lib/schedule.js';
import { Terrain, Trees, Rocks, Clouds, Snow } from './scene/Landscape.jsx';
import { Camp } from './scene/Camps.jsx';
import { STRINGS } from '../lib/i18n.js';

const STATUS_COLOR = { completed: '#ffc845', available: '#6fe0ff', locked: '#8a93a3' };

function TopicNode({ node, position, status, selected, isNight, onSelect }) {
  const mesh = useRef();
  const ring = useRef();
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLOR[status];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (mesh.current) {
      const pulse = status === 'available' ? 1 + Math.sin(t * 3) * 0.12 : 1;
      mesh.current.scale.setScalar(pulse * (hovered || selected ? 1.25 : 1));
    }
    if (ring.current) ring.current.rotation.z = t * 1.5;
  });

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => (document.body.style.cursor = 'auto');
  }, [hovered]);

  const select = (e) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const emissiveBoost = isNight ? 1.45 : 1;

  return (
    <group position={position}>
      {/* Cairn / milestone base */}
      <mesh position-y={-0.16} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.22, 0.16, 7]} />
        <meshStandardMaterial color="#5b5752" roughness={0.95} flatShading />
      </mesh>
      <mesh
        ref={mesh}
        castShadow
        onClick={select}
        onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
        onPointerOut={() => setHovered(false)}
      >
        {status === 'completed' ? <octahedronGeometry args={[0.26, 0]} /> : <sphereGeometry args={[0.2, 24, 24]} />}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={(status === 'locked' ? 0.08 : status === 'completed' ? 0.95 : 0.65) * emissiveBoost}
          roughness={0.35}
        />
      </mesh>
      {selected && (
        <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={-0.15}>
          <ringGeometry args={[0.38, 0.46, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      {status === 'completed' && (
        <pointLight color="#ffc845" intensity={isNight ? 1.2 : 0.6} distance={isNight ? 3 : 2} />
      )}
      {status === 'available' && isNight && (
        <pointLight color="#6fe0ff" intensity={0.85} distance={2.4} />
      )}
      <Html center position={[0, 0.55, 0]} distanceFactor={16} zIndexRange={[10, 0]}>
        <div className={`node-label ${status} ${selected ? 'selected' : ''}`} onClick={() => onSelect(node.id)}>
          {status === 'completed' ? '✓ ' : status === 'locked' ? '🔒 ' : ''}
          {node.title}
          {node.difficulty >= 4 && <span className="diff-tag">⚡{node.difficulty}/5</span>}
        </div>
      </Html>
    </group>
  );
}

function Trail({ from, to, state }) {
  const points = useMemo(() => trailPoints(from, to), [from, to]);
  const style = {
    done: { color: '#ffc845', lineWidth: 3.5, dashed: false },
    open: { color: '#e9fbff', lineWidth: 2.5, dashed: false },
    locked: { color: '#5c6372', lineWidth: 1.5, dashed: true },
    camp: { color: '#ffae52', lineWidth: 2, dashed: true },
  }[state];
  return <Line points={points} {...style} dashSize={0.22} gapSize={0.16} transparent opacity={state === 'locked' ? 0.55 : 0.95} />;
}

function Climber({ target, label = 'You', restingLabel = '🔥 Resting', ghost = false, resting = false, onFocus }) {
  const group = useRef();
  const goal = useMemo(() => new THREE.Vector3(...target), [target]);
  const initialized = useRef(false);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    if (!initialized.current) {
      g.position.copy(goal);
      initialized.current = true;
    }
    const k = 1 - Math.exp(-dt * (ghost ? 6 : 2.2));
    g.position.x += (goal.x - g.position.x) * k;
    g.position.z += (goal.z - g.position.z) * k;
    const ground = heightAt(g.position.x, g.position.z);
    const ny = g.position.y + (goal.y - g.position.y) * k;
    g.position.y = Math.max(ground, ny);
    if (!ghost) {
      g.children[0].position.y = resting ? -0.04 : Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.06;
    }
  });

  const mat = (color, emissive = '#000000', emissiveIntensity = 0) => (
    <meshStandardMaterial
      color={ghost ? '#bfe9ff' : color}
      emissive={ghost ? '#38bdf8' : emissive}
      emissiveIntensity={ghost ? 0.3 : emissiveIntensity}
      roughness={0.5}
      metalness={0.1}
      transparent={ghost}
      opacity={ghost ? 0.45 : 1}
      depthWrite={!ghost}
    />
  );

  const hairColor = ghost ? '#c7f1ff' : resting ? '#ffe600' : '#141418';
  const hairEmissive = ghost ? '#38bdf8' : resting ? '#ffaa00' : '#000000';
  const hairEmissiveInt = ghost ? 0.4 : resting ? 0.9 : 0;
  const hairMat = (
    <meshStandardMaterial
      color={hairColor}
      emissive={hairEmissive}
      emissiveIntensity={hairEmissiveInt}
      roughness={0.4}
      metalness={resting ? 0.3 : 0.1}
      transparent={ghost}
      opacity={ghost ? 0.5 : 1}
      depthWrite={!ghost}
    />
  );

  return (
    <group
      ref={group}
      onClick={(e) => {
        if (!ghost && onFocus) {
          e.stopPropagation();
          onFocus();
        }
      }}
      onPointerOver={() => {
        if (!ghost) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <group>
        {/* Golden Super Saiyan energy aura when resting at camp */}
        {!ghost && resting && (
          <pointLight position={[0, 0.45, 0]} color="#ffe066" intensity={2.2} distance={1.8} />
        )}

        {/* --- Boots (Dark Navy / Blue) --- */}
        <mesh castShadow={!ghost} position={[-0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#1b2845')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.035, 0]}>
          <boxGeometry args={[0.045, 0.07, 0.07]} />
          {mat('#1b2845')}
        </mesh>

        {/* --- Baggy Dogi Pants (Vibrant Orange) --- */}
        <mesh castShadow={!ghost} position={[-0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#f97316')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.045, 0.11, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          {mat('#f97316')}
        </mesh>

        {/* --- Sash / Obi Belt (Navy Blue with hanging tie knot) --- */}
        <mesh castShadow={!ghost} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.035, 10]} />
          {mat('#1d3557')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.04, 0.125, 0.065]} rotation={[0.1, 0, -0.2]}>
          <boxGeometry args={[0.025, 0.07, 0.015]} />
          {mat('#1d3557')}
        </mesh>

        {/* --- Torso Gi Vest (Orange Dogi with V-neck cutout) --- */}
        <mesh castShadow={!ghost} position={[0, 0.255, 0]}>
          <boxGeometry args={[0.14, 0.135, 0.095]} />
          {mat('#f97316')}
        </mesh>
        {/* Navy Blue Undershirt chest inner */}
        <mesh position={[0, 0.275, 0.05]}>
          <planeGeometry args={[0.07, 0.08]} />
          {mat('#1d3557')}
        </mesh>
        {/* White Turtle School Style Back Crest (Circle Badge) */}
        {!ghost && (
          <mesh position={[0, 0.26, -0.05]}>
            <circleGeometry args={[0.032, 12]} />
            {mat('#f8fafc')}
          </mesh>
        )}

        {/* --- Arms & Navy Blue Wristbands --- */}
        <mesh castShadow={!ghost} position={[-0.095, 0.26, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.08, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        <mesh castShadow={!ghost} position={[-0.095, 0.20, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.05, 8]} />
          {mat('#1d3557')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.26, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.08, 8]} />
          {mat('#fbd3b6')}
        </mesh>
        <mesh castShadow={!ghost} position={[0.095, 0.20, 0]}>
          <cylinderGeometry args={[0.03, 0.028, 0.05, 8]} />
          {mat('#1d3557')}
        </mesh>

        {/* --- Red Power-Pole Climbing Staff (Strapped on back) --- */}
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

        {/* --- Head --- */}
        <mesh castShadow={!ghost} position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.072, 16, 16]} />
          {mat('#fbd3b6')}
        </mesh>

        {/* --- Stylized Multi-Spiked Goku Anime Hair --- */}
        {/* Top center upward sweep */}
        <mesh castShadow={!ghost} position={[0, 0.49, -0.01]} rotation={[-0.15, 0, 0]}>
          <coneGeometry args={[0.045, 0.15, 5]} />
          {hairMat}
        </mesh>
        {/* Left main flare */}
        <mesh castShadow={!ghost} position={[-0.055, 0.46, 0.01]} rotation={[0, 0, 0.65]}>
          <coneGeometry args={[0.042, 0.14, 5]} />
          {hairMat}
        </mesh>
        {/* Left lower swept spike */}
        <mesh castShadow={!ghost} position={[-0.08, 0.40, -0.01]} rotation={[-0.1, 0.15, 1.05]}>
          <coneGeometry args={[0.036, 0.13, 5]} />
          {hairMat}
        </mesh>
        {/* Right main flare */}
        <mesh castShadow={!ghost} position={[0.055, 0.45, 0.01]} rotation={[0, 0, -0.55]}>
          <coneGeometry args={[0.04, 0.13, 5]} />
          {hairMat}
        </mesh>
        {/* Right lower swept spike */}
        <mesh castShadow={!ghost} position={[0.075, 0.39, -0.01]} rotation={[-0.1, -0.15, -0.95]}>
          <coneGeometry args={[0.035, 0.12, 5]} />
          {hairMat}
        </mesh>
        {/* Back top volume spike */}
        <mesh castShadow={!ghost} position={[0, 0.42, -0.065]} rotation={[-0.75, 0, 0]}>
          <coneGeometry args={[0.042, 0.13, 5]} />
          {hairMat}
        </mesh>
        {/* Back left spike */}
        <mesh castShadow={!ghost} position={[-0.045, 0.37, -0.055]} rotation={[-0.55, 0.3, 0.45]}>
          <coneGeometry args={[0.035, 0.11, 5]} />
          {hairMat}
        </mesh>
        {/* Back right spike */}
        <mesh castShadow={!ghost} position={[0.045, 0.37, -0.055]} rotation={[-0.55, -0.3, -0.45]}>
          <coneGeometry args={[0.035, 0.11, 5]} />
          {hairMat}
        </mesh>

        {/* --- Label --- */}
        <Html center position={[0, ghost ? 0.74 : 0.8, 0]} distanceFactor={16} zIndexRange={[11, 0]}>
          <div
            className={ghost ? 'climber-label ghost' : resting ? 'climber-label resting' : 'climber-label'}
            style={{ cursor: ghost ? 'default' : 'pointer', pointerEvents: ghost ? 'none' : 'auto' }}
            onClick={(e) => {
              if (!ghost && onFocus) {
                e.stopPropagation();
                onFocus();
              }
            }}
          >
            {resting ? restingLabel : label}
          </div>
        </Html>
      </group>
    </group>
  );
}

function SummitFlag({ conquered }) {
  const top = heightAt(0, 0);
  const flag = useRef();
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.25;
  });
  return (
    <group position={[0, top, 0]}>
      <mesh castShadow position-y={0.6}>
        <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={flag} position={[0.28, 1.05, 0]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial
          color={conquered ? '#ffc845' : '#ff5d5d'}
          emissive={conquered ? '#ffc845' : '#ff5d5d'}
          emissiveIntensity={conquered ? 0.9 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      {conquered && <Sparkles count={70} scale={[3.2, 2.5, 3.2]} position-y={1} size={4} speed={0.6} color="#ffe28a" />}
    </group>
  );
}

function Moon() {
  return (
    <group position={[-28, 26, -24]}>
      <mesh>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshStandardMaterial color="#f5f8ff" emissive="#cfe2ff" emissiveIntensity={1.6} />
      </mesh>
      <pointLight color="#9ec5ff" intensity={1.2} distance={120} />
    </group>
  );
}

function BaseCamp({ position, lightBoost, lang = 'en', onClick }) {
  const s = STRINGS[lang] || STRINGS.en;
  return (
    <Camp
      camp={{ id: 'base', name: s.baseCamp, f: 0 }}
      position={position}
      reached
      isNext={false}
      lightBoost={lightBoost}
      lang={lang}
      onClick={onClick}
    />
  );
}

function CameraController({ mode, setMode, climberTarget }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const animating = useRef(false);
  const animTarget = useRef(new THREE.Vector3());
  const animCamPos = useRef(new THREE.Vector3());

  // Handle camera mode transitions
  useEffect(() => {
    if (!controlsRef.current) return;
    if (mode === 'avatar' && climberTarget) {
      animating.current = true;
      const [tx, ty, tz] = climberTarget;
      animTarget.current.set(tx, ty + 0.35, tz);
      // Place camera ~1.25m offset from avatar at a friendly eye-level angle
      animCamPos.current.set(tx + 1.15, ty + 0.55, tz + 1.15);
    } else if (mode === 'mountain') {
      animating.current = true;
      animTarget.current.set(0, H * 0.42, 0);
      animCamPos.current.set(17, 11.5, 17);
    }
  }, [mode, climberTarget]);

  useFrame((_, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (animating.current) {
      const k = 1 - Math.exp(-dt * 4.5);
      controls.target.lerp(animTarget.current, k);
      camera.position.lerp(animCamPos.current, k);
      controls.update();

      if (
        controls.target.distanceTo(animTarget.current) < 0.04 &&
        camera.position.distanceTo(animCamPos.current) < 0.06
      ) {
        controls.target.copy(animTarget.current);
        camera.position.copy(animCamPos.current);
        controls.update();
        animating.current = false;
      }
    }

    // Keep camera comfortably above the ground so it never clips under the mountain
    const ground = heightAt(camera.position.x, camera.position.z);
    if (camera.position.y < ground + 0.18) {
      camera.position.y = ground + 0.18;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      screenSpacePanning={true}
      minDistance={0.25}
      maxDistance={60}
      maxPolarAngle={Math.PI * 0.54}
      enableDamping
      dampingFactor={0.08}
      onStart={() => {
        // When user manually manipulates the camera, release animation so they have full free control
        animating.current = false;
      }}
    />
  );
}

export default React.memo(function MountainScene({
  lang = 'en',
  climberName = null,
  roadmap,
  camps = [],
  timeInfo,
  statusOf,
  completed,
  selectedId,
  onSelect,
  paceFrac = 0,
  restingCampId = null,
  onSelectCamp,
}) {
  const [hasSnow, setHasSnow] = useState(false); // Cleared by default!
  const [cameraMode, setCameraMode] = useState('free'); // 'free' | 'avatar' | 'mountain'

  const s = STRINGS[lang] || STRINGS.en;
  const positions = useMemo(() => layoutNodes(roadmap.nodes), [roadmap]);
  const camp = useMemo(() => baseCampPosition(), []);
  const slices = useMemo(() => scheduleSlices(roadmap.nodes), [roadmap]);
  const campPos = useMemo(() => placeCamps(camps, slices, positions, camp), [camps, slices, positions, camp]);
  const { frac: progressFrac } = useMemo(() => hoursProgress(roadmap.nodes, completed), [roadmap.nodes, completed]);

  // Keep trees clear of nodes and camps.
  const avoidList = useMemo(
    () => [...Object.values(positions), camp, ...Object.values(campPos)],
    [positions, camp, campPos]
  );

  // Where you *should* be by now: interpolate along the trail of the topic scheduled at this moment.
  const paceTarget = useMemo(() => {
    const p = pointAtFraction(paceFrac, slices, positions, camp);
    return [p[0], p[1], p[2]];
  }, [paceFrac, slices, positions, camp]);

  // Climber stands at the resting camp if resting, or on the highest completed topic (latest one wins ties).
  const climberTarget = useMemo(() => {
    if (restingCampId) {
      const cp = restingCampId === 'base' ? camp : campPos[restingCampId];
      if (cp) return [cp[0] + 0.16, heightAt(cp[0] + 0.16, cp[2] + 0.35), cp[2] + 0.35];
    }
    let best = null;
    for (const id of completed) {
      const n = roadmap.nodes.find((x) => x.id === id);
      if (n && (!best || n.level >= best.level)) best = n;
    }
    return best ? positions[best.id] : [camp[0] + 0.16, heightAt(camp[0] + 0.16, camp[2] + 0.35), camp[2] + 0.35];
  }, [restingCampId, completed, roadmap, positions, camp, campPos]);

  const allDone = roadmap.nodes.length > 0 && completed.length === roadmap.nodes.length;
  const doneSet = new Set(completed);
  const nextCamp = camps.find((c) => !isCampReached(c, completed, progressFrac));
  const isNight = Boolean(timeInfo?.isNight);
  const lightBoost = timeInfo?.campfireBoost ?? 1;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Scene Viewport Toolbar */}
      <div className="scene-toolbar">
        <button
          className={`scene-btn ${cameraMode === 'avatar' ? 'active' : ''}`}
          onClick={() => setCameraMode((m) => (m === 'avatar' ? 'mountain' : 'avatar'))}
          title={cameraMode === 'avatar' ? 'Switch to Full Mountain View' : 'Focus closely on avatar'}
        >
          {cameraMode === 'avatar' ? '🏔️ Mountain View' : '🥋 Focus Avatar'}
        </button>
        <button
          className={`scene-btn ${!hasSnow ? 'active' : ''}`}
          onClick={() => setHasSnow((s) => !s)}
          title="Toggle snow on/off"
        >
          {hasSnow ? '❄️ Snow: On' : '☀️ Snow: Cleared'}
        </button>
        <button
          className="scene-btn"
          onClick={() => setCameraMode('mountain')}
          title="Reset camera perspective"
        >
          🧭 Reset View
        </button>
        <span className="scene-tip">
          🖱️ Right-drag / 2-finger drag to pan freely
        </span>
      </div>

      <Canvas
        shadows
        camera={{ position: [17, 11.5, 17], fov: 45, near: 0.05, far: 300 }}
        onPointerMissed={() => onSelect(null)}
        dpr={[1, 2]}
      >
        <color attach="background" args={[timeInfo?.bgColor || '#b8d4ee']} />
        <fog attach="fog" args={[timeInfo?.fogColor || '#c9dff2', 28, 125]} />
        {timeInfo?.showSky !== false ? (
          <Sky
            sunPosition={timeInfo?.sunPosition || [55, 28, 35]}
            turbidity={timeInfo?.turbidity ?? 5}
            rayleigh={timeInfo?.rayleigh ?? 1.35}
          />
        ) : (
          <>
            <Stars radius={90} depth={45} count={2600} factor={4} saturation={0.2} fade speed={0.6} />
            <Moon />
          </>
        )}
        <ambientLight intensity={timeInfo?.ambientIntensity ?? 0.5} />
        <hemisphereLight
          args={[
            timeInfo?.hemiSky || '#e3f1ff',
            timeInfo?.hemiGround || '#2c442e',
            timeInfo?.hemiIntensity ?? 0.55,
          ]}
        />
        <directionalLight
          castShadow
          position={timeInfo?.sunPosition || [16, 24, 12]}
          intensity={timeInfo?.sunIntensity ?? 1.75}
          color={timeInfo?.sunColor || '#fff6e8'}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
        />

        <Terrain hasSnow={hasSnow} />
        <Trees avoid={avoidList} />
        <Rocks />
        <Clouds color={timeInfo?.cloudColor || '#ffffff'} opacity={timeInfo?.cloudOpacity ?? 0.85} />
        {hasSnow && <Snow />}
        <SummitFlag conquered={allDone} />
        <BaseCamp position={camp} lightBoost={lightBoost} lang={lang} onClick={() => onSelectCamp?.('base')} />

        {camps.map((c) => {
          const reached = isCampReached(c, completed, progressFrac);
          const trailPt = (c.nodeId && positions[c.nodeId]) || pointAtFraction(c.f, slices, positions, camp);
          return (
            <React.Fragment key={c.id}>
              <Trail from={trailPt} to={campPos[c.id]} state={reached ? 'done' : 'camp'} />
              <Camp
                camp={c}
                position={campPos[c.id]}
                reached={reached}
                isNext={nextCamp?.id === c.id}
                lightBoost={lightBoost}
                lang={lang}
                onClick={() => onSelectCamp?.(c.id)}
              />
            </React.Fragment>
          );
        })}

        {roadmap.nodes.map((n) =>
          n.prerequisites.map((p) => {
            const state = doneSet.has(n.id) && doneSet.has(p) ? 'done' : doneSet.has(p) ? 'open' : 'locked';
            return <Trail key={`${p}->${n.id}`} from={positions[p]} to={positions[n.id]} state={state} />;
          })
        )}
        {roadmap.nodes
          .filter((n) => n.prerequisites.length === 0)
          .map((n) => (
            <Trail key={`camp->${n.id}`} from={camp} to={positions[n.id]} state={doneSet.has(n.id) ? 'done' : 'open'} />
          ))}

        {roadmap.nodes.map((n) => (
          <TopicNode
            key={n.id}
            node={n}
            position={positions[n.id]}
            status={statusOf(n)}
            selected={selectedId === n.id}
            isNight={isNight}
            onSelect={onSelect}
          />
        ))}

        <Climber
          target={climberTarget}
          label={climberName || s.you3d}
          restingLabel={s.resting3d}
          resting={Boolean(restingCampId)}
          onFocus={() => setCameraMode('avatar')}
        />
        <Climber target={paceTarget} label={s.pace3d} ghost />

        <CameraController
          mode={cameraMode}
          setMode={setCameraMode}
          climberTarget={climberTarget}
        />
      </Canvas>
    </div>
  );
});
