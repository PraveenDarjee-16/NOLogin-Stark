'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { X, Shield, Activity, Cpu, Fingerprint } from 'lucide-react';

interface Props {
  origin: { x: number; y: number };
  onExit: () => void;
}

// ----------------------------------------------------------------------
// 1. Procedural 2D Letter Glyphs for Clean Geometric 3D Extrusion
// ----------------------------------------------------------------------
function createLetterShape(char: string): THREE.Shape {
  const s = new THREE.Shape();
  if (char === 'P') {
    s.moveTo(0, 0);
    s.lineTo(0, 42);
    s.lineTo(22, 42);
    s.lineTo(28, 36);
    s.lineTo(28, 24);
    s.lineTo(22, 18);
    s.lineTo(9, 18);
    s.lineTo(9, 0);
    s.closePath();

    const hole = new THREE.Path();
    hole.moveTo(9, 26);
    hole.lineTo(9, 34);
    hole.lineTo(19, 34);
    hole.lineTo(21, 32);
    hole.lineTo(21, 28);
    hole.lineTo(19, 26);
    hole.closePath();
    s.holes.push(hole);
  } else if (char === 'R') {
    s.moveTo(0, 0);
    s.lineTo(0, 42);
    s.lineTo(22, 42);
    s.lineTo(28, 36);
    s.lineTo(28, 24);
    s.lineTo(22, 18);
    s.lineTo(28, 0);
    s.lineTo(19, 0);
    s.lineTo(14, 18);
    s.lineTo(9, 18);
    s.lineTo(9, 0);
    s.closePath();

    const hole = new THREE.Path();
    hole.moveTo(9, 26);
    hole.lineTo(9, 34);
    hole.lineTo(19, 34);
    hole.lineTo(21, 32);
    hole.lineTo(21, 28);
    hole.lineTo(19, 26);
    hole.closePath();
    s.holes.push(hole);
  } else if (char === 'A') {
    s.moveTo(0, 0);
    s.lineTo(11, 42);
    s.lineTo(19, 42);
    s.lineTo(30, 0);
    s.lineTo(21, 0);
    s.lineTo(19, 9);
    s.lineTo(11, 9);
    s.lineTo(9, 0);
    s.closePath();

    const hole = new THREE.Path();
    hole.moveTo(12, 16);
    hole.lineTo(15, 30);
    hole.lineTo(18, 16);
    hole.closePath();
    s.holes.push(hole);
  } else if (char === 'V') {
    s.moveTo(0, 42);
    s.lineTo(11, 0);
    s.lineTo(19, 0);
    s.lineTo(30, 42);
    s.lineTo(21, 42);
    s.lineTo(15, 14);
    s.lineTo(9, 42);
    s.closePath();
  } else if (char === 'E') {
    s.moveTo(0, 0);
    s.lineTo(0, 42);
    s.lineTo(26, 42);
    s.lineTo(26, 34);
    s.lineTo(9, 34);
    s.lineTo(9, 25);
    s.lineTo(23, 25);
    s.lineTo(23, 18);
    s.lineTo(9, 18);
    s.lineTo(9, 8);
    s.lineTo(26, 8);
    s.lineTo(26, 0);
    s.closePath();
  } else if (char === 'N') {
    s.moveTo(0, 0);
    s.lineTo(0, 42);
    s.lineTo(9, 42);
    s.lineTo(21, 15);
    s.lineTo(21, 42);
    s.lineTo(29, 42);
    s.lineTo(29, 0);
    s.lineTo(20, 0);
    s.lineTo(9, 27);
    s.lineTo(9, 0);
    s.closePath();
  }
  return s;
}

// ----------------------------------------------------------------------
// 2. Configuration for the 7 Distinct 3D Letter Masterpieces
// ----------------------------------------------------------------------
interface LetterData {
  char: string;
  name: string;
  material: THREE.Material;
  edgeColor: number;
  launchDelay: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPitch: number;
  orbitPhase: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
}

export default function PraveenExperienceOverlay({ origin, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lifecycle, setLifecycle] = useState<'INTRO' | 'LETTER_ORBIT' | 'PORTRAIT_REVEAL' | 'ACTIVE'>('INTRO');
  const [isExiting, setIsExiting] = useState(false);
  const [portraitError, setPortraitError] = useState(false);

  const animFrameId = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const triggerExit = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onExit();
    }, 400);
  }, [isExiting, onExit]);

  // Keyboard navigation: Enter or Escape immediately disengages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [triggerExit]);

  // Interactive mouse parallax tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseRef.current.targetX = (e.clientX - cx) / cx;
      mouseRef.current.targetY = (e.clientY - cy) / cy;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ----------------------------------------------------------------------
  // 3. Main Real-Time WebGL Three.js Scene Setup & Loop
  // ----------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.0006);

    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);
    camera.position.set(0, 0, 680);

    // Coordinate conversion: map screen button coordinates to 3D world space at z = 0
    function getOriginWorld(): THREE.Vector3 {
      const ndcX = (origin.x / width) * 2 - 1;
      const ndcY = -(origin.y / height) * 2 + 1;
      const v = new THREE.Vector3(ndcX, ndcY, 0.5);
      v.unproject(camera);
      const dir = v.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      return camera.position.clone().add(dir.multiplyScalar(dist));
    }
    const originWorld = getOriginWorld();

    // ----------------------------------------------------
    // Lighting Rig
    // ----------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0x0a1a36, 1.4);
    scene.add(ambientLight);

    // Key Light (Crisp White / Ice-Blue)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(300, 450, 450);
    scene.add(keyLight);

    // Rim / Accent Light (Stark Violet / Magenta)
    const fillLight = new THREE.DirectionalLight(0x8b5cf6, 2.2);
    fillLight.position.set(-350, -250, 250);
    scene.add(fillLight);

    // Central Reactor Point Light (Pulsing Cyan Core)
    const corePointLight = new THREE.PointLight(0x00f0ff, 3.5, 750, 1.2);
    corePointLight.position.set(0, 0, 70);
    scene.add(corePointLight);

    // Warm Gold Backlight
    const backGoldLight = new THREE.DirectionalLight(0xf59e0b, 1.6);
    backGoldLight.position.set(0, 300, -250);
    scene.add(backGoldLight);

    // ----------------------------------------------------
    // 3D Letter Extrusion Geometries & Distinct Materials
    // ----------------------------------------------------
    const lettersData: LetterData[] = [
      {
        char: 'P',
        name: 'Titanium Hologram',
        material: new THREE.MeshStandardMaterial({
          color: 0xdde6ed,
          metalness: 0.95,
          roughness: 0.18,
          emissive: 0x00f0ff,
          emissiveIntensity: 0.25,
        }),
        edgeColor: 0x00f0ff,
        launchDelay: 0.5,
        orbitRadius: 240,
        orbitSpeed: 0.72,
        orbitPitch: 0.35,
        orbitPhase: 0,
        rotSpeedX: 0.8,
        rotSpeedY: 1.2,
        rotSpeedZ: 0.4,
      },
      {
        char: 'R',
        name: 'Crimson Energy Alloy',
        material: new THREE.MeshStandardMaterial({
          color: 0x8b0000,
          metalness: 0.9,
          roughness: 0.2,
          emissive: 0xef4444,
          emissiveIntensity: 0.45,
        }),
        edgeColor: 0xef4444,
        launchDelay: 0.68,
        orbitRadius: 265,
        orbitSpeed: -0.78,
        orbitPitch: -0.4,
        orbitPhase: (Math.PI * 2) / 7,
        rotSpeedX: 1.4,
        rotSpeedY: 0.9,
        rotSpeedZ: 1.1,
      },
      {
        char: 'A',
        name: 'Crystal Prism',
        material: new THREE.MeshPhysicalMaterial({
          color: 0xe0f7fa,
          metalness: 0.1,
          roughness: 0.08,
          transmission: 0.88,
          ior: 1.52,
          transparent: true,
          opacity: 0.92,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.35,
        }),
        edgeColor: 0xbae6fd,
        launchDelay: 0.86,
        orbitRadius: 290,
        orbitSpeed: 0.6,
        orbitPitch: 0.25,
        orbitPhase: ((Math.PI * 2) / 7) * 2,
        rotSpeedX: 0.7,
        rotSpeedY: 1.4,
        rotSpeedZ: 0.5,
      },
      {
        char: 'V',
        name: 'Obsidian Chrome',
        material: new THREE.MeshStandardMaterial({
          color: 0x0c0618,
          metalness: 0.98,
          roughness: 0.08,
          emissive: 0xa855f7,
          emissiveIntensity: 0.42,
        }),
        edgeColor: 0xc084fc,
        launchDelay: 1.04,
        orbitRadius: 310,
        orbitSpeed: -0.85,
        orbitPitch: -0.32,
        orbitPhase: ((Math.PI * 2) / 7) * 3,
        rotSpeedX: 1.2,
        rotSpeedY: 1.1,
        rotSpeedZ: 1.3,
      },
      {
        char: 'E',
        name: 'Neon Glass',
        material: new THREE.MeshPhysicalMaterial({
          color: 0x00f0ff,
          metalness: 0.25,
          roughness: 0.05,
          transmission: 0.75,
          transparent: true,
          opacity: 0.88,
          emissive: 0x00f0ff,
          emissiveIntensity: 0.8,
        }),
        edgeColor: 0x00f0ff,
        launchDelay: 1.22,
        orbitRadius: 275,
        orbitSpeed: 0.75,
        orbitPitch: 0.42,
        orbitPhase: ((Math.PI * 2) / 7) * 4,
        rotSpeedX: 0.9,
        rotSpeedY: 1.5,
        rotSpeedZ: 0.6,
      },
      {
        char: 'E',
        name: 'Golden Plasma Metal',
        material: new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.92,
          roughness: 0.16,
          emissive: 0xd97706,
          emissiveIntensity: 0.45,
        }),
        edgeColor: 0xfbbf24,
        launchDelay: 1.4,
        orbitRadius: 300,
        orbitSpeed: -0.65,
        orbitPitch: -0.38,
        orbitPhase: ((Math.PI * 2) / 7) * 5,
        rotSpeedX: 1.1,
        rotSpeedY: 0.8,
        rotSpeedZ: 1.2,
      },
      {
        char: 'N',
        name: 'Quantum Alloy',
        material: new THREE.MeshStandardMaterial({
          color: 0x111827,
          metalness: 0.95,
          roughness: 0.14,
          emissive: 0xec4899,
          emissiveIntensity: 0.45,
        }),
        edgeColor: 0x00f0ff,
        launchDelay: 1.58,
        orbitRadius: 325,
        orbitSpeed: 0.82,
        orbitPitch: 0.28,
        orbitPhase: ((Math.PI * 2) / 7) * 6,
        rotSpeedX: 1.4,
        rotSpeedY: 1.3,
        rotSpeedZ: 0.9,
      },
    ];

    // Build extruded meshes with beveled edges and wireframe glowing rims
    const letterMeshes: THREE.Group[] = [];
    lettersData.forEach((cfg) => {
      const shape = createLetterShape(cfg.char);
      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 10,
        bevelEnabled: true,
        bevelThickness: 2.2,
        bevelSize: 1.6,
        bevelSegments: 3,
      });
      geom.center();

      const mainMesh = new THREE.Mesh(geom, cfg.material);

      // Glowing edge outline
      const edgesGeom = new THREE.EdgesGeometry(geom, 22);
      const edgeMat = new THREE.LineBasicMaterial({
        color: cfg.edgeColor,
        transparent: true,
        opacity: 0.85,
        linewidth: 2,
      });
      const edgeLines = new THREE.LineSegments(edgesGeom, edgeMat);

      const group = new THREE.Group();
      group.add(mainMesh);
      group.add(edgeLines);
      group.position.copy(originWorld);
      group.scale.set(0.001, 0.001, 0.001);
      group.visible = false;

      scene.add(group);
      letterMeshes.push(group);
    });

    // ----------------------------------------------------
    // Central Holographic Portal & User Photo Medallion
    // ----------------------------------------------------
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 20, 0);
    portalGroup.scale.set(0.001, 0.001, 0.001);
    scene.add(portalGroup);

    // 1. Portrait Texture Disc
    const portraitRadius = 105;
    const portraitGeom = new THREE.CircleGeometry(portraitRadius, 64);

    const textureLoader = new THREE.TextureLoader();
    let portraitMat: THREE.MeshStandardMaterial;

    const portraitTexture = textureLoader.load(
      '/images/praveen-identity.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.center.set(0.5, 0.5);
        // Slight scale adjustment to frame Praveen's face and Iron Spider suit beautifully
        tex.repeat.set(1.1, 1.1);
        tex.offset.set(-0.05, -0.05);
      },
      undefined,
      (err) => {
        console.warn('Custom portrait texture load failed:', err);
        setPortraitError(true);
      }
    );

    portraitMat = new THREE.MeshStandardMaterial({
      map: portraitTexture,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const portraitMesh = new THREE.Mesh(portraitGeom, portraitMat);
    portalGroup.add(portraitMesh);

    // 2. Metallic Beveled Ring hugging the portrait
    const borderRingGeom = new THREE.TorusGeometry(portraitRadius + 3, 4, 16, 64);
    const borderRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.3,
    });
    const borderRingMesh = new THREE.Mesh(borderRingGeom, borderRingMat);
    portalGroup.add(borderRingMesh);

    // 3. Counter-rotating Holographic HUD Rings
    const midRingGeom = new THREE.RingGeometry(portraitRadius + 16, portraitRadius + 18, 64);
    const midRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const midRingMesh = new THREE.Mesh(midRingGeom, midRingMat);
    portalGroup.add(midRingMesh);

    const outerRingGeom = new THREE.RingGeometry(portraitRadius + 28, portraitRadius + 30, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeom, outerRingMat);
    portalGroup.add(outerRingMesh);

    // Segmented cyan HUD ticks
    const tickRingGeom = new THREE.RingGeometry(portraitRadius + 40, portraitRadius + 44, 48);
    const tickRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const tickRingMesh = new THREE.Mesh(tickRingGeom, tickRingMat);
    portalGroup.add(tickRingMesh);

    // 4. Sweeping Laser Scanner Bar
    const laserGeom = new THREE.CylinderGeometry(1.6, 1.6, portraitRadius * 2 + 10, 16);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
    });
    const laserMesh = new THREE.Mesh(laserGeom, laserMat);
    laserMesh.rotation.z = Math.PI / 2;
    laserMesh.position.set(0, 0, 4);
    portalGroup.add(laserMesh);

    // ----------------------------------------------------
    // Floating Atmospheric Particle Field
    // ----------------------------------------------------
    const particleCount = 450;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cCyan = new THREE.Color(0x00f0ff);
    const cGold = new THREE.Color(0xf59e0b);
    const cViolet = new THREE.Color(0xa855f7);

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 1200;
      particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 800;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 600;

      const pick = Math.random();
      const col = pick > 0.6 ? cCyan : pick > 0.3 ? cGold : cViolet;
      particleColors[p * 3] = col.r;
      particleColors[p * 3 + 1] = col.g;
      particleColors[p * 3 + 2] = col.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(particleGeom, particleMat);
    scene.add(particleField);

    // ----------------------------------------------------
    // Resize Handler
    // ----------------------------------------------------
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // ----------------------------------------------------
    // 4. ANIMATION CHOREOGRAPHY LOOP
    // ----------------------------------------------------
    const startTime = performance.now();

    const render = (now: number) => {
      const t = (now - startTime) / 1000; // elapsed time in seconds

      // Mouse Parallax Lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x = mouseRef.current.x * 65;
      camera.position.y = -mouseRef.current.y * 45;
      camera.lookAt(0, 0, 0);

      // Core Point Light pulse
      corePointLight.intensity = 2.8 + Math.sin(t * 4) * 0.9;

      // Rotate particle field slowly
      particleField.rotation.y = t * 0.03;
      particleField.rotation.z = t * 0.015;

      // Rotate HUD rings
      midRingMesh.rotation.z = -t * 0.4;
      outerRingMesh.rotation.z = t * 0.25;
      tickRingMesh.rotation.z = -t * 0.15;

      // Laser scanner sweep across portrait
      const scanPeriod = (t * 1.8) % 2; // sweeps down over ~1.1s
      laserMesh.position.y = (1 - scanPeriod) * portraitRadius;

      // ----------------------------------------------------
      // LIFECYCLE STAGE 1: INTRO (0s - 2.0s)
      // Letters launch from the actual PRAVEEN button position
      // ----------------------------------------------------
      if (t < 2.0) {
        setLifecycle('INTRO');

        lettersData.forEach((cfg, i) => {
          const group = letterMeshes[i];
          if (t < cfg.launchDelay) {
            group.visible = false;
            group.position.copy(originWorld);
            group.scale.set(0.001, 0.001, 0.001);
          } else {
            group.visible = true;
            const p = (t - cfg.launchDelay) / (2.0 - cfg.launchDelay);
            const easeOut = 1 - Math.pow(1 - p, 3); // High-speed cubic burst outward

            group.scale.setScalar(0.2 + easeOut * 0.85);

            // Fly outward from button into initial 3D orbital trajectory
            const burstAngle = (Math.PI / 4) + (i / 6) * (Math.PI * 1.5) + cfg.orbitPhase;
            const targetX = Math.cos(burstAngle) * (200 + i * 20);
            const targetY = Math.sin(burstAngle) * (140 + i * 15);
            const targetZ = Math.sin(burstAngle * 2) * 80;

            group.position.x = originWorld.x + (targetX - originWorld.x) * easeOut;
            group.position.y = originWorld.y + (targetY - originWorld.y) * easeOut;
            group.position.z = originWorld.z + (targetZ - originWorld.z) * easeOut;

            group.rotation.x = p * Math.PI * 4 * cfg.rotSpeedX;
            group.rotation.y = p * Math.PI * 4 * cfg.rotSpeedY;
            group.rotation.z = p * Math.PI * 2 * cfg.rotSpeedZ;
          }
        });
      }

      // ----------------------------------------------------
      // LIFECYCLE STAGE 2: LETTER ORBIT (2.0s - 4.5s)
      // Letters sweep across the desktop in wide 3D trajectories
      // ----------------------------------------------------
      else if (t >= 2.0 && t < 4.5) {
        setLifecycle('LETTER_ORBIT');
        const dt = t - 2.0;

        lettersData.forEach((cfg, i) => {
          const group = letterMeshes[i];
          group.visible = true;
          group.scale.set(1, 1, 1);

          const angle = dt * cfg.orbitSpeed + cfg.orbitPhase;
          const radius = cfg.orbitRadius;

          const rawX = Math.cos(angle) * radius;
          const rawY = Math.sin(angle) * (radius * 0.58);
          // 3D inclination tilt
          const posX = rawX;
          const posY = rawY * Math.cos(cfg.orbitPitch) - Math.sin(angle) * 70 * Math.sin(cfg.orbitPitch);
          const posZ = rawY * Math.sin(cfg.orbitPitch) + Math.sin(angle) * 120;

          group.position.set(posX, posY, posZ);

          group.rotation.x = dt * 1.2 * cfg.rotSpeedX;
          group.rotation.y = dt * 1.5 * cfg.rotSpeedY;
          group.rotation.z = dt * 0.8 * cfg.rotSpeedZ;
        });
      }

      // ----------------------------------------------------
      // LIFECYCLE STAGE 3: PORTRAIT REVEAL (4.5s - 6.5s)
      // Portal materializes & letters converge to 3D title arc
      // ----------------------------------------------------
      else if (t >= 4.5 && t < 6.5) {
        setLifecycle('PORTRAIT_REVEAL');
        const pReveal = (t - 4.5) / 2.0;
        const easeInOut =
          pReveal < 0.5
            ? 2 * pReveal * pReveal
            : 1 - Math.pow(-2 * pReveal + 2, 2) / 2;

        // Portal emerges
        portalGroup.scale.setScalar(easeInOut);
        portraitMat.opacity = easeInOut;

        // Letters converge toward lower 3D title arrangement below portrait
        lettersData.forEach((cfg, i) => {
          const group = letterMeshes[i];
          group.visible = true;
          group.scale.set(1, 1, 1);

          const dt = 2.5; // end of free flight
          const angle = dt * cfg.orbitSpeed + cfg.orbitPhase;
          const startX = Math.cos(angle) * cfg.orbitRadius;
          const startY = Math.sin(angle) * (cfg.orbitRadius * 0.58);
          const startZ = Math.sin(angle) * 100;

          // Target panoramic arc across bottom
          const letterSpacing = width < 768 ? 44 : 68;
          const targetX = (i - 3) * letterSpacing;
          const targetY = -145;
          const targetZ = -Math.abs(i - 3) * 18 + 40;

          group.position.x = startX + (targetX - startX) * easeInOut;
          group.position.y = startY + (targetY - startY) * easeInOut;
          group.position.z = startZ + (targetZ - startZ) * easeInOut;

          // Rotate to face camera gracefully
          const targetRotY = (i - 3) * -0.09;
          group.rotation.x = (1 - easeInOut) * Math.PI;
          group.rotation.y = targetRotY * easeInOut + (1 - easeInOut) * Math.PI * 2;
          group.rotation.z = (1 - easeInOut) * 0.4;
        });
      }

      // ----------------------------------------------------
      // LIFECYCLE STAGE 4: ACTIVE PERSISTENT IDENTITY MODE (6.5s+)
      // Portrait stays alive; letters orbit in 3D around it
      // Periodic 10s cycle smoothly harmonizes into readable title!
      // ----------------------------------------------------
      else {
        setLifecycle('ACTIVE');
        portalGroup.scale.set(1, 1, 1);
        portraitMat.opacity = 1;

        const cycleTime = (t - 6.5) % 10.0;
        // Periodic alignment: between 7.0s and 9.5s of every 10s cycle
        let alignFactor = 0;
        if (cycleTime > 6.8 && cycleTime < 9.6) {
          if (cycleTime < 7.6) {
            alignFactor = (cycleTime - 6.8) / 0.8;
          } else if (cycleTime < 8.8) {
            alignFactor = 1.0;
          } else {
            alignFactor = 1.0 - (cycleTime - 8.8) / 0.8;
          }
        }

        lettersData.forEach((cfg, i) => {
          const group = letterMeshes[i];
          group.visible = true;
          group.scale.set(1, 1, 1);

          // 1. Orbital position
          const orbitAngle = t * cfg.orbitSpeed + cfg.orbitPhase;
          const rawX = Math.cos(orbitAngle) * cfg.orbitRadius;
          const rawY = Math.sin(orbitAngle) * (cfg.orbitRadius * 0.58);
          const orbitX = rawX;
          const orbitY = rawY * Math.cos(cfg.orbitPitch) - Math.sin(orbitAngle) * 70 * Math.sin(cfg.orbitPitch);
          const orbitZ = rawY * Math.sin(cfg.orbitPitch) + Math.sin(orbitAngle) * 120;

          // 2. Aligned readable title position (panoramic arc below portrait)
          const letterSpacing = width < 768 ? 44 : 68;
          const alignedX = (i - 3) * letterSpacing;
          const alignedY = -145;
          const alignedZ = -Math.abs(i - 3) * 18 + 40;

          // Smooth interpolation
          group.position.x = orbitX * (1 - alignFactor) + alignedX * alignFactor;
          group.position.y = orbitY * (1 - alignFactor) + alignedY * alignFactor;
          group.position.z = orbitZ * (1 - alignFactor) + alignedZ * alignFactor;

          // Individual tumble when orbiting, crisp front alignment when harmonized
          const freeRotX = t * 0.9 * cfg.rotSpeedX;
          const freeRotY = orbitAngle + t * 0.7 * cfg.rotSpeedY;
          const freeRotZ = Math.sin(t + i) * 0.35;

          const alignedRotX = 0;
          const alignedRotY = (i - 3) * -0.09;
          const alignedRotZ = 0;

          group.rotation.x = freeRotX * (1 - alignFactor) + alignedRotX * alignFactor;
          group.rotation.y = freeRotY * (1 - alignFactor) + alignedRotY * alignFactor;
          group.rotation.z = freeRotZ * (1 - alignFactor) + alignedRotZ * alignFactor;
        });
      }

      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    // ----------------------------------------------------
    // Cleanup / Disposal on Exit
    // ----------------------------------------------------
    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js scene, geometries, materials & textures
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
      portraitTexture.dispose();
      renderer.dispose();
    };
  }, [origin]);

  return (
    <div
      ref={containerRef}
      className={`praveen-overlay ${isExiting ? 'exiting' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerExit();
        }
      }}
    >
      {/* Real-time WebGL Three.js Canvas */}
      <canvas ref={canvasRef} className="praveen-canvas" />

      {/* Top Futuristic Telemetry Ribbon */}
      <header className="praveen-top-hud">
        <div className="praveen-top-pill">
          <Fingerprint size={13} style={{ color: '#00f0ff' }} />
          <span>STARK IDENTITY SEQUENCE // SUBJECT: PRAVEEN</span>
        </div>
        <div className="praveen-top-pill" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <Activity size={13} style={{ color: '#f59e0b' }} />
          <span>STAGE: {lifecycle}</span>
        </div>
        <div className="praveen-top-pill">
          <Cpu size={13} style={{ color: '#38bdf8' }} />
          <span>RENDER: REAL-TIME WEBGL 3D</span>
        </div>
      </header>

      {/* Biometric Scan Telemetry Overlay Under Portrait */}
      {(lifecycle === 'PORTRAIT_REVEAL' || lifecycle === 'ACTIVE') && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 140px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.74rem',
            letterSpacing: '0.12em',
            color: '#00f0ff',
            textShadow: '0 0 10px rgba(0, 240, 255, 0.8)',
            background: 'rgba(3, 8, 24, 0.88)',
            padding: '6px 20px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 240, 255, 0.45)',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.25)',
            pointerEvents: 'none',
            animation: 'praveenFadeIn 0.8s ease-out forwards',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={12} style={{ color: '#00f0ff' }} />
            <span>SUBJECT: PRAVEEN // CLEARANCE: LEVEL 10</span>
          </div>
          <div style={{ fontSize: '0.64rem', color: '#94a3b8', letterSpacing: '0.08em' }}>
            BIOMETRIC SCAN: VERIFIED // SUIT: IRON SPIDER MK-IV
          </div>
        </div>
      )}

      {/* Exit HUD Pill at Bottom Center */}
      <footer className="praveen-exit-hud">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="praveen-btn-dot" />
          <span>PRESS <strong>ENTER</strong> OR <strong>ESC</strong> TO EXIT</span>
        </div>
        <button
          onClick={triggerExit}
          className="praveen-exit-btn"
          title="Exit 3D Identity Experience"
        >
          <X size={12} />
          <span>DISENGAGE</span>
        </button>
      </footer>
    </div>
  );
}
