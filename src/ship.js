/**
 * Photorealistic Starfighter Models & Flight Controller
 * AAA Engineered Spacecraft with high-detail extruded aerospace geometries,
 * beveled armor plating, transparent cockpit glass with interior consoles,
 * mechanical VTOL rotors, RCS maneuvering thruster blocks, navigation strobes,
 * and multi-weapon hardpoints (Dual Plasma Cannons, Rapid Gatling, Homing Missiles, EMP).
 *
 * Ship 1: Crimson Interceptor (Flagship Reference 1 Design - Brushed Titanium, Red Accents)
 * Ship 2: Void Dreadnought (Heavy Armored Stealth Twin-Hull Warship)
 * Ship 3: Aether Vanguard (Reference 2 Blue Cosmic Interceptor)
 */
import { SHIP_IMAGES, createProceduralPanelTexture, createProceduralNormalMap, createProceduralRoughnessMap } from './textures.js';

export const SHIP_CONFIGS = {
  crimson: {
    id: 'crimson',
    name: 'CRIMSON VALKYRIE',
    type: 'Tactical Strike Fighter (Ref 1)',
    image: SHIP_IMAGES.crimson,
    description: 'Advanced strike fighter crafted with brushed titanium armor, racing crimson cowlings, twin circular VTOL turbine rings, dual heavy wing cannons, and homing missile racks.',
    maxSpeed: 44,
    boostSpeed: 82,
    accelRate: 36,
    turnRate: 2.8,
    rollRate: 5.2,
    maxShield: 150,
    maxHull: 140,
    shieldRegenRate: 30,
    boostDrainRate: 26,
    fireInterval: 0.12,
    primaryColor: 0xff1744,
    engineGlow: 0xff2244,
    laserColor: 0xff2244,
    weaponType: 'triple_pulse',
    stats: { speed: 88, agility: 88, shields: 92, hull: 90, firepower: 94 }
  },
  dreadnought: {
    id: 'dreadnought',
    name: 'VOID DREADNOUGHT',
    type: 'Heavy Twin-Hull Warship',
    image: SHIP_IMAGES.dreadnought,
    description: 'Monolithic stealth combat warship with multi-tiered composite armor plating, dual outboard catamaran hulls, and forward-facing heavy kinetic railguns.',
    maxSpeed: 38,
    boostSpeed: 70,
    accelRate: 28,
    turnRate: 2.2,
    rollRate: 3.8,
    maxShield: 220,
    maxHull: 240,
    shieldRegenRate: 26,
    boostDrainRate: 32,
    fireInterval: 0.16,
    primaryColor: 0xff7700,
    engineGlow: 0xff5500,
    laserColor: 0xff8800,
    weaponType: 'heavy_dual',
    stats: { speed: 70, agility: 64, shields: 100, hull: 100, firepower: 98 }
  },
  aether: {
    id: 'aether',
    name: 'AETHER VANGUARD',
    type: 'High-Agility Interceptor (Ref 2)',
    image: SHIP_IMAGES.aether,
    description: 'Sleek aerodynamic spaceframe with cranked-arrow delta wings, canted dorsal stabilizers, downturned winglet fences, and twin blue plasma bolters.',
    maxSpeed: 48,
    boostSpeed: 90,
    accelRate: 40,
    turnRate: 3.2,
    rollRate: 5.8,
    maxShield: 130,
    maxHull: 120,
    shieldRegenRate: 36,
    boostDrainRate: 24,
    fireInterval: 0.09,
    primaryColor: 0x3ef0ff,
    engineGlow: 0x3ef0ff,
    laserColor: 0x3ef0ff,
    weaponType: 'dual_rapid',
    stats: { speed: 98, agility: 100, shields: 84, hull: 82, firepower: 86 }
  }
};

/** Helper to generate symmetric extruded 3D wing/fuselage shapes */
function createSymmetricExtrudedMesh(THREE, halfPoints, options, material) {
  const shape = new THREE.Shape();
  shape.moveTo(halfPoints[0][0], halfPoints[0][1]);
  for (let i = 1; i < halfPoints.length; i++) {
    shape.lineTo(halfPoints[i][0], halfPoints[i][1]);
  }
  for (let i = halfPoints.length - 1; i >= 0; i--) {
    shape.lineTo(-halfPoints[i][0], halfPoints[i][1]);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: options.depth || 0.25,
    bevelEnabled: options.bevel !== false,
    bevelSegments: options.bevelSegments || 3,
    bevelSize: options.bevelSize || 0.05,
    bevelThickness: options.bevelThickness || 0.05
  });

  geom.rotateX(Math.PI / 2);
  geom.translate(0, (options.depth || 0.25) / 2, 0);
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class Starfighter {
  constructor(scene, THREE, shipType = 'crimson') {
    this.scene = scene;
    this.THREE = THREE;
    this.config = SHIP_CONFIGS[shipType] || SHIP_CONFIGS.crimson;
    this.shipType = shipType;

    // Movement & Physics State
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this._forwardVec = new THREE.Vector3(0, 0, 0);
    this._desiredVel = new THREE.Vector3(0, 0, 0);
    this.heading = 0;
    this.targetHeading = 0;
    this.roll = 0;
    this.pitch = 0;
    this.sensitivity = this.sensitivity || 1.0;

    // Vitals from Config
    this.maxHull = this.config.maxHull;
    this.hull = this.maxHull;
    this.maxShield = this.config.maxShield;
    this.shield = this.maxShield;
    this.shieldRegenDelay = 1.6;
    this.lastDamageTime = 0;
    this.shieldRegenRate = this.config.shieldRegenRate;

    // Energy / Boost
    this.maxEnergy = 100;
    this.energy = 100;
    this.boostDrainRate = this.config.boostDrainRate;
    this.energyRegenRate = 24;
    this.isBoosting = false;
    this.invulnerableTimer = 0;

    // Weapons & Ordnance
    this.selectedWeapon = 'cannons'; // 'cannons' | 'rapid' | 'missiles'
    this.weaponLevel = 1;
    this.weaponLevelTimer = 0;
    this.fireInterval = this.config.fireInterval;
    this.lastFireTime = 0;
    this.heat = 0;
    this.overheated = false;
    this.coolRate = 0.42;

    // Secondary Homing Missiles
    this.missiles = 8;
    this.maxMissiles = 8;
    this.lastMissileTime = 0;
    this.missileCooldown = 1.0;

    // Special Weapon: EMP Pulse
    this.empCooldown = 0;
    this.empMaxCooldown = 20.0; // seconds

    // 3D Objects & FX
    this.group = new THREE.Group();
    this.shipMesh = null;
    this.thrusterFlames = [];
    this.laserMuzzleOffsets = [];
    this.missileHardpoints = [];
    this.missileMeshes = [];
    this.strobeLights = [];
    this.shieldMesh = null;
    this.cockpitAnchor = new THREE.Vector3(0, 0.45, 0.6);

    this._buildShipModel();
    this.scene.add(this.group);
  }

  _buildShipModel() {
    const THREE = this.THREE;
    const type = this.shipType;

    if (type === 'dreadnought') {
      this._buildVoidDreadnought();
    } else if (type === 'aether') {
      this._buildAetherVanguard();
    } else {
      this._buildCrimsonInterceptor();
    }

    // Reactive Holographic Shield Bubble
    const shieldGeom = new THREE.IcosahedronGeometry(3.8, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: this.config.primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.shieldMesh.scale.set(1.25, 0.65, 1.45);
    this.group.add(this.shieldMesh);
  }

  /**
   * SHIP 1: CRIMSON VALKYRIE (Reference 1 Signature Starfighter)
   * Detailed metallic silver & gunmetal hull, crimson accent cowlings,
   * realistic transparent reflective glass cockpit with interior pilot tub,
   * dual VTOL turbine rings with 8-blade rotating rotors, maneuvering RCS thrusters,
   * navigation lights, forward wing cannon pylons, and underwing missile racks.
   */
  _buildCrimsonInterceptor() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    const panelTex = createProceduralPanelTexture(THREE, '#b0bcc9', '#788698', '#c4d1de');
    const normalMap = createProceduralNormalMap(THREE);
    const roughnessMap = createProceduralRoughnessMap(THREE, 0.22);

    // 1. High-Quality PBR Materials
    const titaniumSilverMat = new THREE.MeshStandardMaterial({
      color: 0xc4d1de,
      map: panelTex,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 2.0
    });

    const gunmetalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      map: panelTex,
      normalMap: normalMap,
      metalness: 0.88,
      roughness: 0.35,
      envMapIntensity: 1.6
    });

    const crimsonAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      emissive: 0xff1744,
      emissiveIntensity: 1.4,
      metalness: 0.70,
      roughness: 0.18,
      envMapIntensity: 1.8
    });

    const glassCanopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f151e,
      metalness: 0.95,
      roughness: 0.03,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: 0x4a0a16,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.88
    });

    const cyanHoloMat = new THREE.MeshBasicMaterial({
      color: 0x3ef0ff
    });

    const rcsBurnishMat = new THREE.MeshStandardMaterial({
      color: 0x2d323b,
      metalness: 0.95,
      roughness: 0.4
    });

    // 2. Main Titanium Swept Wings & Carapace
    const wingProfile = [
      [0, 2.7],
      [0.75, 1.5],
      [1.6, 0.45],
      [2.3, 0.25],
      [2.9, -0.65],
      [1.7, -1.35],
      [0.65, -2.15],
      [0, -1.95]
    ];
    const mainWings = createSymmetricExtrudedMesh(THREE, wingProfile, {
      depth: 0.32,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3
    }, titaniumSilverMat);
    mainWings.position.y = 0.02;
    shipRoot.add(mainWings);

    // Raised Spine Armor Plates
    const spineArmor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 2.6), gunmetalDarkMat);
    spineArmor.position.set(0, 0.24, -0.2);
    shipRoot.add(spineArmor);

    // Heat Radiator Gills along the spine
    for (let g = 0; g < 4; g++) {
      const gill = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.12), crimsonAccentMat);
      gill.position.set(0, 0.34, -0.6 + g * 0.35);
      shipRoot.add(gill);
    }

    // 3. Elongated Chisel Needle Nose & Center Rotary Cannon
    const noseProfile = [
      [0, 3.6],
      [0.32, 2.3],
      [0.62, 0.85],
      [0, 0.85]
    ];
    const needleNose = createSymmetricExtrudedMesh(THREE, noseProfile, {
      depth: 0.28,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    }, titaniumSilverMat);
    needleNose.position.y = 0.12;
    shipRoot.add(needleNose);

    // Centerline Rotary Cannon
    const noseGun = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.8, 8), gunmetalDarkMat);
    noseGun.rotation.x = Math.PI / 2;
    noseGun.position.set(0, -0.06, 3.5);
    shipRoot.add(noseGun);

    const gunMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.35, 8), gunmetalDarkMat);
    gunMuzzle.rotation.x = Math.PI / 2;
    gunMuzzle.position.set(0, -0.06, 4.8);
    shipRoot.add(gunMuzzle);

    this.laserMuzzleOffsets.push({ side: 0, x: 0, y: -0.06, z: 4.9 });

    // 4. Detailed Transparent Cockpit with Interior Pilot Tub
    const canopyGeom = new THREE.ConeGeometry(0.42, 1.8, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 4);
    const canopy = new THREE.Mesh(canopyGeom, glassCanopyMat);
    canopy.position.set(0, 0.36, 0.5);
    canopy.scale.set(0.85, 0.48, 1.25);
    shipRoot.add(canopy);

    // Cockpit Tub & Pilot Seat
    const pilotSeat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.35), gunmetalDarkMat);
    pilotSeat.position.set(0, 0.26, 0.35);
    shipRoot.add(pilotSeat);

    // Glowing Holographic Flight HUD Console
    const flightConsole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.08), cyanHoloMat);
    flightConsole.position.set(0, 0.32, 0.75);
    flightConsole.rotation.x = -0.35;
    shipRoot.add(flightConsole);

    // 5. Side Air Intake Cowlings with Crimson Trims
    [-1, 1].forEach(side => {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 1.3), crimsonAccentMat);
      intake.position.set(side * 0.60, 0.22, 0.6);
      intake.rotation.y = side * 0.12;
      shipRoot.add(intake);

      const intakeDuct = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.2), gunmetalDarkMat);
      intakeDuct.position.set(side * 0.60, 0.22, 1.25);
      shipRoot.add(intakeDuct);
    });

    // 6. Dual VTOL Lift Turbine Rings with 8-Blade Rotors (Ref 1 Iconic Feature)
    [-1, 1].forEach(side => {
      const vtolGroup = new THREE.Group();
      vtolGroup.position.set(side * 1.50, 0.20, -0.7);

      // Outer Crimson Ring Cowling
      const ringCowling = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.09, 16, 32), crimsonAccentMat);
      ringCowling.rotation.x = Math.PI / 2;
      vtolGroup.add(ringCowling);

      // Gunmetal Duct Wall
      const innerDuct = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.50, 0.24, 24, 1, true), gunmetalDarkMat);
      vtolGroup.add(innerDuct);

      // Center Hub Axle Spinner
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16), gunmetalDarkMat);
      vtolGroup.add(axle);

      // 8 Real 3D Fan Rotor Blades inside Ring
      for (let b = 0; b < 8; b++) {
        const theta = (b / 8) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.34), gunmetalDarkMat);
        blade.position.set(Math.cos(theta) * 0.30, 0, Math.sin(theta) * 0.30);
        blade.rotation.y = -theta + 0.35;
        blade.rotation.x = 0.4;
        vtolGroup.add(blade);
      }

      shipRoot.add(vtolGroup);

      // 7. Forward Wing Cannon Pylons
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 2.4), titaniumSilverMat);
      pylon.position.set(side * 1.90, 0.08, 1.3);
      shipRoot.add(pylon);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.5, 8), gunmetalDarkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 1.90, 0.08, 2.3);
      shipRoot.add(barrel);

      const redMuzzle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.03, 8, 16), crimsonAccentMat);
      redMuzzle.position.set(side * 1.90, 0.08, 3.4);
      shipRoot.add(redMuzzle);

      this.laserMuzzleOffsets.push({ side, x: side * 1.90, y: 0.08, z: 3.5 });

      // 8. Underwing Homing Missile Ordnance Racks (3D Missiles Mounted!)
      const missilePylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 1.6), gunmetalDarkMat);
      missilePylon.position.set(side * 1.15, -0.16, 0.2);
      shipRoot.add(missilePylon);

      // 3D Missile Model
      const missileGroup = new THREE.Group();
      missileGroup.position.set(side * 1.15, -0.26, 0.2);

      const missileBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), titaniumSilverMat);
      missileBody.rotation.x = Math.PI / 2;
      missileGroup.add(missileBody);

      const missileTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), crimsonAccentMat);
      missileTip.rotation.x = Math.PI / 2;
      missileTip.position.set(0, 0, 0.75);
      missileGroup.add(missileTip);

      shipRoot.add(missileGroup);
      this.missileMeshes.push(missileGroup);
      this.missileHardpoints.push({ side, x: side * 1.15, y: -0.26, z: 0.8 });

      // 9. Maneuvering RCS Blocks (Forward & Wingtips)
      const rcsBlock = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.16), rcsBurnishMat);
      rcsBlock.position.set(side * 2.85, 0.06, -0.5);
      shipRoot.add(rcsBlock);

      // 10. Navigation Strobe Lights (Port = Red, Starboard = Green)
      const navLightColor = side < 0 ? 0xff0033 : 0x00ff66;
      const navLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: navLightColor }));
      navLight.position.set(side * 2.95, 0.06, -0.6);
      shipRoot.add(navLight);
      this.strobeLights.push({ mesh: navLight, color: navLightColor, type: 'nav' });

      // 11. Canted Angular Twin Tailfins
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.20, 0.95), titaniumSilverMat);
      tailFin.position.set(side * 0.46, 0.72, -1.35);
      tailFin.rotation.z = side * -0.28;
      tailFin.rotation.x = -0.24;
      shipRoot.add(tailFin);

      const finCap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.75), crimsonAccentMat);
      finCap.position.set(side * 0.64, 1.22, -1.45);
      finCap.rotation.z = side * -0.28;
      finCap.rotation.x = -0.24;
      shipRoot.add(finCap);

      // 12. Rear Jet Exhaust Nozzle
      const thrusterBell = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.75, 16), gunmetalDarkMat);
      thrusterBell.rotation.x = Math.PI / 2;
      thrusterBell.position.set(side * 0.40, 0.1, -2.1);
      shipRoot.add(thrusterBell);

      const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.04, 8, 16), crimsonAccentMat);
      glowRing.position.set(side * 0.40, 0.1, -2.4);
      shipRoot.add(glowRing);

      const outerFlame = this._createFlameMesh(0.24, 2.2, 0xff1744);
      outerFlame.position.set(side * 0.40, 0.1, -2.45);
      shipRoot.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.4, 0xffffff);
      innerFlame.position.set(side * 0.40, 0.1, -2.45);
      shipRoot.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });
    });

    // Dorsal White Strobe Beacon
    const whiteStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    whiteStrobe.position.set(0, 0.44, -1.2);
    shipRoot.add(whiteStrobe);
    this.strobeLights.push({ mesh: whiteStrobe, color: 0xffffff, type: 'beacon' });

    this.cockpitAnchor.set(0, 0.42, 0.6);
    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  /**
   * SHIP 2: VOID DREADNOUGHT
   * Heavy Armored Stealth Twin-Hull Warship
   */
  _buildVoidDreadnought() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    const panelTex = createProceduralPanelTexture(THREE, '#151b24', '#090d13', '#1c2635');
    const normalMap = createProceduralNormalMap(THREE);
    const roughnessMap = createProceduralRoughnessMap(THREE, 0.32);

    const stealthMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      map: panelTex,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      metalness: 0.88,
      roughness: 0.32,
      envMapIntensity: 1.6
    });

    const armorPlatesMat = new THREE.MeshStandardMaterial({
      color: 0x242e3d,
      map: panelTex,
      normalMap: normalMap,
      metalness: 0.92,
      roughness: 0.28,
      envMapIntensity: 1.8
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f131a,
      metalness: 0.85,
      roughness: 0.45
    });

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c12,
      metalness: 0.96,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: 0x1f1000,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.94
    });

    const amberEnergyMat = new THREE.MeshStandardMaterial({
      color: 0xff7700,
      emissive: 0xff7700,
      emissiveIntensity: 3.5,
      roughness: 0.15
    });

    // Main Lifting Body
    const centerProfile = [
      [0, 2.8],
      [0.6, 1.8],
      [1.1, 0.6],
      [1.3, -0.8],
      [1.1, -2.0],
      [0.5, -2.3],
      [0, -2.1]
    ];
    const mainHull = createSymmetricExtrudedMesh(THREE, centerProfile, {
      depth: 0.36,
      bevelThickness: 0.07,
      bevelSize: 0.07,
      bevelSegments: 3
    }, stealthMat);
    mainHull.position.y = 0.02;
    shipRoot.add(mainHull);

    // Stealth Beak Prow
    const beakProfile = [
      [0, 3.4],
      [0.45, 2.0],
      [0.65, 0.8],
      [0, 0.8]
    ];
    const prow = createSymmetricExtrudedMesh(THREE, beakProfile, {
      depth: 0.26,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3
    }, armorPlatesMat);
    prow.position.y = 0.14;
    shipRoot.add(prow);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 2.8), armorPlatesMat);
    spine.position.set(0, 0.32, -0.1);
    shipRoot.add(spine);

    const canopyGeom = new THREE.ConeGeometry(0.42, 1.8, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 4);
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 0.38, 1.1);
    canopy.scale.set(0.85, 0.42, 1.3);
    shipRoot.add(canopy);

    // Outboard Catamaran Hulls with Railguns
    [-1, 1].forEach(side => {
      const outriggerGroup = new THREE.Group();
      outriggerGroup.position.set(side * 1.9, 0, 0);

      const sponson = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.34, 4.2), stealthMat);
      sponson.position.set(0, 0.1, -0.2);
      outriggerGroup.add(sponson);

      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 3.4), armorPlatesMat);
      ridge.position.set(0, 0.32, -0.3);
      outriggerGroup.add(ridge);

      const rail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), darkTrimMat);
      rail1.rotation.x = Math.PI / 2;
      rail1.position.set(-0.09, 0.1, 2.6);
      outriggerGroup.add(rail1);

      const rail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), darkTrimMat);
      rail2.rotation.x = Math.PI / 2;
      rail2.position.set(0.09, 0.1, 2.6);
      outriggerGroup.add(rail2);

      [1.8, 2.4, 3.0].forEach(zPos => {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), amberEnergyMat);
        coil.position.set(0, 0.1, zPos);
        outriggerGroup.add(coil);
      });

      this.laserMuzzleOffsets.push({ side, x: side * 1.9, y: 0.1, z: 3.9 });

      // Missile hardpoint under sponson
      this.missileHardpoints.push({ side, x: side * 1.9, y: -0.15, z: 0.5 });

      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 1.2), armorPlatesMat);
      fin.position.set(side * 0.42, 0.65, -1.5);
      fin.rotation.z = side * -0.32;
      fin.rotation.x = -0.22;
      outriggerGroup.add(fin);

      shipRoot.add(outriggerGroup);
    });

    // Rear Exhausts
    [-0.55, 0.55].forEach(xOffset => {
      const exhaustBell = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 0.8, 16), darkTrimMat);
      exhaustBell.rotation.x = Math.PI / 2;
      exhaustBell.position.set(xOffset, 0.1, -2.3);
      shipRoot.add(exhaustBell);

      const interiorGlow = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), amberEnergyMat);
      interiorGlow.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(interiorGlow);

      const outerFlame = this._createFlameMesh(0.26, 2.2, 0xff6600);
      outerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.4, 0xffd278);
      innerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });
    });

    this.cockpitAnchor.set(0, 0.44, 1.1);
    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  /**
   * SHIP 3: AETHER VANGUARD (Reference 2 Blue Cosmic Interceptor)
   * High-Agility Cranked-Delta Interceptor
   */
  _buildAetherVanguard() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    const panelTex = createProceduralPanelTexture(THREE, '#7ca8ca', '#466e8c', '#9bcbf0');
    const normalMap = createProceduralNormalMap(THREE);
    const roughnessMap = createProceduralRoughnessMap(THREE, 0.22);

    const aeroWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xd8e8f5,
      map: panelTex,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      metalness: 0.72,
      roughness: 0.20,
      envMapIntensity: 1.8
    });

    const navalBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1b344c,
      map: panelTex,
      normalMap: normalMap,
      metalness: 0.85,
      roughness: 0.28,
      envMapIntensity: 1.6
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x121c26,
      metalness: 0.88,
      roughness: 0.38
    });

    const cyanPlasmaMat = new THREE.MeshStandardMaterial({
      color: 0x3ef0ff,
      emissive: 0x3ef0ff,
      emissiveIntensity: 3.5,
      roughness: 0.15
    });

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x061a2b,
      metalness: 0.94,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      emissive: 0x12486c,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.90
    });

    // Cranked-Arrow Delta Wings
    const wingProfile = [
      [0, 3.4],
      [0.6, 2.0],
      [1.7, 0.6],
      [3.2, -0.9],
      [1.8, -1.6],
      [0.6, -2.4],
      [0, -2.0]
    ];
    const mainWings = createSymmetricExtrudedMesh(THREE, wingProfile, {
      depth: 0.28,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3
    }, aeroWhiteMat);
    mainWings.position.y = 0.02;
    shipRoot.add(mainWings);

    // Supersonic Needle Nose
    const noseProfile = [
      [0, 3.8],
      [0.35, 2.4],
      [0.65, 0.8],
      [0, 0.8]
    ];
    const needleNose = createSymmetricExtrudedMesh(THREE, noseProfile, {
      depth: 0.24,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    }, navalBlueMat);
    needleNose.position.y = 0.14;
    shipRoot.add(needleNose);

    const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 8), darkTrimMat);
    pitot.rotation.x = Math.PI / 2;
    pitot.position.set(0, 0.14, 4.2);
    shipRoot.add(pitot);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 3.2), navalBlueMat);
    spine.position.set(0, 0.28, -0.2);
    shipRoot.add(spine);

    const canopyGeom = new THREE.ConeGeometry(0.38, 1.9, 5);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 5);
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 0.38, 0.9);
    canopy.scale.set(0.85, 0.48, 1.3);
    shipRoot.add(canopy);

    [-1, 1].forEach(side => {
      const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 1.4), navalBlueMat);
      winglet.position.set(side * 3.2, -0.15, -0.9);
      winglet.rotation.z = side * 0.25;
      winglet.rotation.x = -0.15;
      shipRoot.add(winglet);

      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 1.3), aeroWhiteMat);
      fin.position.set(side * 0.65, 0.75, -1.3);
      fin.rotation.z = side * -0.25;
      fin.rotation.x = -0.22;
      shipRoot.add(fin);

      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), darkTrimMat);
      pylon.rotation.x = Math.PI / 2;
      pylon.position.set(side * 1.6, 0.04, 1.4);
      shipRoot.add(pylon);

      const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8), cyanPlasmaMat);
      emitter.rotation.x = Math.PI / 2;
      emitter.position.set(side * 1.6, 0.04, 2.5);
      shipRoot.add(emitter);

      this.laserMuzzleOffsets.push({ side, x: side * 1.6, y: 0.04, z: 2.6 });
      this.missileHardpoints.push({ side, x: side * 1.2, y: -0.14, z: 0.4 });
    });

    [-0.42, 0.42].forEach(xOffset => {
      const engineBell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.8, 16), darkTrimMat);
      engineBell.rotation.x = Math.PI / 2;
      engineBell.position.set(xOffset, 0.1, -2.3);
      shipRoot.add(engineBell);

      const ionRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), cyanPlasmaMat);
      ionRing.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(ionRing);

      const outerFlame = this._createFlameMesh(0.24, 2.4, 0x00c8ff);
      outerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.5, 0xffffff);
      innerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });
    });

    this.cockpitAnchor.set(0, 0.42, 0.9);
    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  _createFlameMesh(radius, length, colorCore) {
    const THREE = this.THREE;
    const geom = new THREE.ConeGeometry(radius, length, 16);
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, 0, -length / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: colorCore,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    return mesh;
  }

  update(dt, inputState, time) {
    const THREE = this.THREE;

    // 1. Shield Recharge
    if (time - this.lastDamageTime > this.shieldRegenDelay && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
    }

    // 2. Boost & Energy
    const forwardThrust = inputState.thrust !== undefined ? inputState.thrust : 0;
    const boostRequested = (inputState.boost || inputState.shift) && this.energy > 5;
    if (boostRequested && Math.abs(forwardThrust) > 0.05) {
      this.isBoosting = true;
      this.energy = Math.max(0, this.energy - this.boostDrainRate * dt);
    } else {
      this.isBoosting = false;
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // 3. Weapon Cooling & EMP Cooldown
    if (this.heat > 0) {
      this.heat = Math.max(0, this.heat - this.coolRate * dt);
      if (this.overheated && this.heat < 0.25) {
        this.overheated = false;
      }
    }
    if (this.empCooldown > 0) {
      this.empCooldown = Math.max(0, this.empCooldown - dt);
    }

    if (this.weaponLevel > 1) {
      this.weaponLevelTimer -= dt;
      if (this.weaponLevelTimer <= 0) {
        this.weaponLevel = 1;
      }
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.shipMesh.visible = Math.floor(time * 20) % 2 === 0;
    } else {
      this.shipMesh.visible = true;
    }

    // 4. Navigation Strobe Light Blinking
    this.strobeLights.forEach(strobe => {
      if (strobe.type === 'beacon') {
        strobe.mesh.visible = (time % 1.2) < 0.15;
      } else {
        strobe.mesh.visible = (time % 2.0) < 1.6;
      }
    });

    // 5. Smooth, Responsive Arcade Flight Physics
    const targetSpeed = this.isBoosting ? this.config.boostSpeed : this.config.maxSpeed;
    const accel = this.config.accelRate;
    const sens = this.sensitivity || 1.0;

    // A. Steering / Heading Calculation
    let activeTurnRate = 0;

    if (inputState.steer && Math.abs(inputState.steer) > 0.02) {
      // Direct joystick / keyboard yaw with quadratic smooth ramp
      const turnSpeed = this.config.turnRate * sens;
      const turnDelta = inputState.steer * turnSpeed * dt;
      this.heading += turnDelta;
      this.targetHeading = this.heading;
      activeTurnRate = inputState.steer;
    } else if (inputState.hasMouseSteer) {
      // Smooth tracking towards mouse aim
      let headingDiff = inputState.targetHeading - this.heading;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

      // Soft progressive damping towards mouse cursor
      const maxTurn = this.config.turnRate * sens * dt;
      const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, headingDiff * 3.8 * dt * sens));
      this.heading += turnAmount;
      this.targetHeading = this.heading;
      activeTurnRate = Math.max(-1.0, Math.min(1.0, headingDiff * 1.5));
    }

    // Keep heading normalized within [-PI, PI]
    while (this.heading > Math.PI) this.heading -= Math.PI * 2;
    while (this.heading < -Math.PI) this.heading += Math.PI * 2;

    // B. Aerodynamic Banking Roll & Pitch
    const targetRoll = -activeTurnRate * 0.45;
    this.roll += (targetRoll - this.roll) * Math.min(1.0, this.config.rollRate * dt);

    const targetPitch = forwardThrust * -0.06;
    this.pitch += (targetPitch - this.pitch) * 8 * dt;

    // C. Linear Velocity Update (Decoupled Throttle & Momentum - 0 allocations)
    this._forwardVec.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    
    if (Math.abs(forwardThrust) > 0.02) {
      const speedMult = forwardThrust > 0 ? forwardThrust * targetSpeed : forwardThrust * (targetSpeed * 0.45);
      this._desiredVel.copy(this._forwardVec).multiplyScalar(speedMult);
      this.velocity.lerp(this._desiredVel, Math.min(1.0, accel * dt * 0.16));
    } else {
      // Natural cruising space drag - ship smoothly decelerates without harsh jolts
      this.velocity.multiplyScalar(Math.pow(0.88, dt * 60));
    }

    this.position.addScaledVector(this.velocity, dt);
    this.group.position.copy(this.position);

    // Apply 3D Orientation
    this.group.rotation.y = this.heading;
    this.shipMesh.rotation.z = this.roll;
    this.shipMesh.rotation.x = this.pitch;

    // Thruster Dynamic Plume Scaling
    const currentSpeed = this.velocity.length();
    const speedRatio = Math.min(1.0, currentSpeed / this.config.maxSpeed);
    const boostActive = this.isBoosting;
    const isAccelerating = forwardThrust > 0.05;
    const flameScale = 0.2 + speedRatio * 0.8 + (boostActive ? 1.4 : 0) + (isAccelerating ? 0.4 : 0) + Math.sin(time * 30) * 0.08;

    this.thrusterFlames.forEach(({ outer, inner }) => {
      outer.scale.set(1.0 + (boostActive ? 0.35 : 0), 1.0 + (boostActive ? 0.35 : 0), flameScale);
      inner.scale.set(1.0, 1.0, flameScale * 1.15);
      outer.visible = speedRatio > 0.03 || isAccelerating || boostActive;
      inner.visible = outer.visible;
    });

    // Reactive Shield Bubble Fade
    if (this.shieldMesh && this.shieldMesh.material.opacity > 0) {
      this.shieldMesh.material.opacity = Math.max(0, this.shieldMesh.material.opacity - dt * 2.5);
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return false;
    this.invulnerableTimer = 0.65; // Invulnerability i-frames to prevent instant death from tick collisions
    this.lastDamageTime = performance.now() * 0.001;

    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = 0.85;
    }

    if (this.shield > 0) {
      const remainingShield = this.shield - amount;
      if (remainingShield >= 0) {
        this.shield = remainingShield;
        return false;
      } else {
        this.shield = 0;
        this.hull += remainingShield;
      }
    } else {
      this.hull -= amount;
    }

    if (this.hull <= 0) {
      this.hull = 0;
      return true;
    }
    return false;
  }

  canFire(time, weaponType = 'cannons') {
    if (this.overheated) return false;
    const interval = weaponType === 'rapid' ? this.fireInterval * 0.55 : this.fireInterval;
    return time - this.lastFireTime >= interval;
  }

  recordShot(time, weaponType = 'cannons') {
    this.lastFireTime = time;
    const heatCost = weaponType === 'rapid' ? 0.055 : 0.085;
    this.heat = Math.min(1.0, this.heat + heatCost);
    if (this.heat >= 1.0) {
      this.overheated = true;
    }
  }

  canLaunchMissile(time) {
    return this.missiles > 0 && (time - this.lastMissileTime >= this.missileCooldown);
  }

  recordMissileLaunch(time) {
    if (this.missiles > 0) {
      this.missiles--;
      this.lastMissileTime = time;
      // Hide visible wing missile mesh if inventory depleting
      if (this.missileMeshes.length > 0) {
        const idx = this.missiles % this.missileMeshes.length;
        if (this.missileMeshes[idx]) {
          this.missileMeshes[idx].visible = this.missiles > 2;
        }
      }
      return true;
    }
    return false;
  }

  canTriggerEMP() {
    return this.empCooldown <= 0;
  }

  triggerEMP() {
    if (this.canTriggerEMP()) {
      this.empCooldown = this.empMaxCooldown;
      return true;
    }
    return false;
  }

  reloadMissiles(count = 4) {
    this.missiles = Math.min(this.maxMissiles, this.missiles + count);
    this.missileMeshes.forEach(m => m.visible = true);
  }

  repairShield(amount) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }

  repairHull(amount) {
    this.hull = Math.min(this.maxHull, this.hull + amount);
  }

  upgradeWeapon(level = 2, duration = 15.0) {
    this.weaponLevel = level;
    this.weaponLevelTimer = duration;
  }

  getLaserSpawns() {
    const THREE = this.THREE;
    const isUpgraded = this.weaponLevel >= 2;
    const speed = 210;

    return this.laserMuzzleOffsets.map(offset => {
      const v = new THREE.Vector3(offset.x, offset.y, offset.z);
      v.applyEuler(this.shipMesh.rotation);
      v.applyEuler(this.group.rotation);
      v.add(this.position);

      const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
      return {
        x: v.x,
        y: v.y,
        z: v.z,
        vx: forwardVec.x * speed + this.velocity.x * 0.4,
        vz: forwardVec.z * speed + this.velocity.z * 0.4,
        heading: this.heading,
        color: isUpgraded ? 0xffaa00 : this.config.laserColor
      };
    });
  }

  getMissileSpawn() {
    const THREE = this.THREE;
    const hardpoint = this.missileHardpoints[this.missiles % Math.max(1, this.missileHardpoints.length)] || { x: 0, y: -0.2, z: 0.8 };
    const v = new THREE.Vector3(hardpoint.x, hardpoint.y, hardpoint.z);
    v.applyEuler(this.shipMesh.rotation);
    v.applyEuler(this.group.rotation);
    v.add(this.position);
    return v;
  }

  getCockpitWorldPosition() {
    const THREE = this.THREE;
    const v = this.cockpitAnchor.clone();
    v.applyEuler(this.shipMesh.rotation);
    v.applyEuler(this.group.rotation);
    v.add(this.position);
    return v;
  }

  reset(shipType = null) {
    if (shipType && shipType !== this.shipType) {
      this.shipType = shipType;
      this.config = SHIP_CONFIGS[shipType];
      while (this.group.children.length > 0) {
        this.group.remove(this.group.children[0]);
      }
      this.thrusterFlames = [];
      this.laserMuzzleOffsets = [];
      this.missileHardpoints = [];
      this.missileMeshes = [];
      this.strobeLights = [];
      this._buildShipModel();
    }
    this.maxHull = this.config.maxHull;
    this.hull = this.maxHull;
    this.maxShield = this.config.maxShield;
    this.shield = this.maxShield;
    this.energy = this.maxEnergy;
    this.missiles = this.maxMissiles;
    this.empCooldown = 0;
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.heading = 0;
    this.targetHeading = 0;
    this.roll = 0;
    this.pitch = 0;
    this.sensitivity = this.sensitivity || 1.0;
    this.heat = 0;
    this.overheated = false;
    this.weaponLevel = 1;
    this.invulnerableTimer = 0;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
    if (this.shipMesh) this.shipMesh.rotation.set(0, 0, 0);
    this.missileMeshes.forEach(m => m.visible = true);
  }
}
