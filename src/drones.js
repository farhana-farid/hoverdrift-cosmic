/**
 * Advanced Enemy Combat AI, 5 Distinct Spacecraft Classes & Capital Boss Battles
 * 1. Interceptor ("Shadow Dart"): Small, agile, hit-and-run strafing passes.
 * 2. Fighter ("Phantom Raider"): Balanced combat dogfighter with predictive aiming.
 * 3. Heavy Gunship ("Goliath Fortress"): Armored weapons platform with dual turrets & frontal shields.
 * 4. Elite Spacecraft ("Viper Ace"): Advanced stealth ace with barrel rolls, micro-missiles, and tactical shield retreats.
 * 5. Capital Boss ("Leviathan Omega Dreadnought"): Massive 45m capital ship with 3 combat phases & cascading destruction.
 *
 * Also manages Player Homing Missiles, EMP Shockwaves, and Holographic Power-ups.
 */
export class DroneManager {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;

    this.drones = [];
    this.boss = null;
    this.enemyLasers = [];
    this.enemyMissiles = [];
    this.playerMissiles = [];
    // Kills scored by ordnance, drained by CosmicGame so missiles count toward
    // score, combo and the mission objective exactly like laser kills do.
    this.missileKills = [];
    this.powerups = [];
    this.activeEMPWave = null;

    // Shared Geometries & Materials
    this.laserGeom = new THREE.CylinderGeometry(0.14, 0.14, 2.2, 8);
    this.laserGeom.rotateX(Math.PI / 2);

    this.droneLaserMat = new THREE.MeshBasicMaterial({
      color: 0xff2244,
      transparent: true,
      opacity: 0.95
    });

    this.bossLaserMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.98
    });

    this.beamLaserMat = new THREE.MeshBasicMaterial({
      color: 0xff0088,
      transparent: true,
      opacity: 0.95
    });

    // Missile Geometry
    this.missileGeom = new THREE.ConeGeometry(0.28, 1.4, 8);
    this.missileGeom.rotateX(Math.PI / 2);
    this.missileMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff5500,
      emissiveIntensity: 3.0
    });

    this.playerMissileMat = new THREE.MeshStandardMaterial({
      color: 0x3ef0ff,
      emissive: 0x00c8ff,
      emissiveIntensity: 3.5
    });

    // High-Visibility Spacecraft Materials
    this.armorHullMat = new THREE.MeshStandardMaterial({
      color: 0x8fa0b2, // High-albedo brushed titanium alloy (stands out crisply against black space)
      metalness: 0.86,
      roughness: 0.26,
      envMapIntensity: 2.0
    });

    this.armorDarkMat = new THREE.MeshStandardMaterial({
      color: 0x384454, // Contrast gunmetal plating
      metalness: 0.88,
      roughness: 0.32,
      envMapIntensity: 1.6
    });

    this.armorGunmetalMat = new THREE.MeshStandardMaterial({
      color: 0x4e5e72, // Mechanical hardpoints & cannon barrels
      metalness: 0.90,
      roughness: 0.28,
      envMapIntensity: 1.8
    });

    this.crimsonTrimMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff0033,
      emissiveIntensity: 3.5,
      metalness: 0.70,
      roughness: 0.18
    });

    this.amberGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff6600,
      emissiveIntensity: 4.2,
      roughness: 0.15
    });

    // Blazing Engine Exhaust Thruster Materials (Bright plasma visible from any angle)
    this.engineFlameOuter = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.90,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.engineFlameInner = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bossFlameOuter = new THREE.MeshBasicMaterial({
      color: 0xbf00ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.shieldMat = new THREE.MeshBasicMaterial({
      color: 0xff2244,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bossArmorMat = new THREE.MeshStandardMaterial({
      color: 0x323e50,
      metalness: 0.92,
      roughness: 0.26,
      envMapIntensity: 2.0
    });

    this.bossCoreMat = new THREE.MeshStandardMaterial({
      color: 0xbf00ff,
      emissive: 0xd946ef,
      emissiveIntensity: 5.2,
      roughness: 0.1
    });

    // Power-up geometries
    this.powerupGeom = new THREE.OctahedronGeometry(1.2, 0);
    this.powerupRingGeom = new THREE.TorusGeometry(1.6, 0.08, 8, 24);

    // Pre-allocated beam laser geometry (0 runtime allocations)
    this.beamLaserGeom = new THREE.CylinderGeometry(0.35, 0.35, 4.5, 8);
    this.beamLaserGeom.rotateX(Math.PI / 2);

    // Reusable Scratch Vectors to eliminate 3,000+ Vector3 allocations/sec
    this._pHeadingVec = new THREE.Vector3();
    this._toVec = new THREE.Vector3();
    this._tempPos = new THREE.Vector3();
    this._tempLead = new THREE.Vector3();
    this._projVec = new THREE.Vector3();
  }

  _disposeGroup(group) {
    if (!group) return;
    group.traverse(child => {
      if (child.isMesh && child.geometry) {
        child.geometry.dispose();
      }
    });
    this.scene.remove(group);
  }

  /**
   * Helper to attach dual animated engine plasma plumes to enemy starfighters
   */
  _attachThrusters(parentGroup, xOffsets, yPos, zPos, scale = 1.0, isBoss = false) {
    const THREE = this.THREE;
    const flames = [];
    xOffsets.forEach(ox => {
      const outerMat = isBoss ? this.bossFlameOuter : this.engineFlameOuter;
      const outerGeom = new THREE.ConeGeometry(0.35 * scale, 2.4 * scale, 8);
      outerGeom.rotateX(-Math.PI / 2);
      const outer = new THREE.Mesh(outerGeom, outerMat);
      outer.position.set(ox, yPos, zPos - 1.2 * scale);
      parentGroup.add(outer);

      const innerGeom = new THREE.ConeGeometry(0.18 * scale, 2.8 * scale, 8);
      innerGeom.rotateX(-Math.PI / 2);
      const inner = new THREE.Mesh(innerGeom, this.engineFlameInner);
      inner.position.set(ox, yPos, zPos - 1.4 * scale);
      parentGroup.add(inner);

      flames.push({ outer, inner, baseScale: scale });
    });
    return flames;
  }

  /**
   * Spawns structured waves tailored to the 5 Mission Levels
   * All hostiles are positioned in tactical combat formations IN FRONT of the player
   */
  spawnLevelWave(levelNumber, playerPos, playerHeading = 0) {
    this.clearAll();

    if (levelNumber === 1) {
      // Level 1: Deep-Space Patrol — 5 Interceptors in forward tactical V-formation
      const patrol = [
        { angleOff: 0, dist: 80 },
        { angleOff: -0.22, dist: 95 },
        { angleOff: 0.22, dist: 95 },
        { angleOff: -0.42, dist: 115 },
        { angleOff: 0.42, dist: 115 }
      ];
      patrol.forEach(p => {
        this._createDrone('interceptor', playerPos, playerHeading + p.angleOff, p.dist);
      });
    } else if (levelNumber === 2) {
      // Level 2: Asteroid Field — 3 Interceptors & 4 Balanced Fighters in forward echelon
      const wave = [
        { type: 'interceptor', angleOff: -0.15, dist: 75 },
        { type: 'interceptor', angleOff: 0.15, dist: 75 },
        { type: 'interceptor', angleOff: 0, dist: 90 },
        { type: 'fighter', angleOff: -0.35, dist: 110 },
        { type: 'fighter', angleOff: 0.35, dist: 110 },
        { type: 'fighter', angleOff: -0.55, dist: 130 },
        { type: 'fighter', angleOff: 0.55, dist: 130 }
      ];
      wave.forEach(w => {
        this._createDrone(w.type, playerPos, playerHeading + w.angleOff, w.dist);
      });
    } else if (levelNumber === 3) {
      // Level 3: Orbital Space Station Battle — 4 Fighters & 2 Heavy Gunships
      const wave = [
        { type: 'fighter', angleOff: -0.20, dist: 85 },
        { type: 'fighter', angleOff: 0.20, dist: 85 },
        { type: 'fighter', angleOff: -0.45, dist: 105 },
        { type: 'fighter', angleOff: 0.45, dist: 105 },
        { type: 'gunship', angleOff: -0.28, dist: 130 },
        { type: 'gunship', angleOff: 0.28, dist: 130 }
      ];
      wave.forEach(w => {
        this._createDrone(w.type, playerPos, playerHeading + w.angleOff, w.dist);
      });
    } else if (levelNumber === 4) {
      // Level 4: Nebula Frontier — 3 Elite Viper Aces & 3 Heavy Gunships
      const wave = [
        { type: 'elite', angleOff: 0, dist: 80 },
        { type: 'elite', angleOff: -0.28, dist: 95 },
        { type: 'elite', angleOff: 0.28, dist: 95 },
        { type: 'gunship', angleOff: -0.50, dist: 125 },
        { type: 'gunship', angleOff: 0.50, dist: 125 },
        { type: 'gunship', angleOff: 0, dist: 140 }
      ];
      wave.forEach(w => {
        this._createDrone(w.type, playerPos, playerHeading + w.angleOff, w.dist);
      });
    } else {
      // Level 5: Capital Ship Assault — Leviathan Omega Dreadnought + 4 Escorts
      this._spawnBoss(levelNumber, playerPos, playerHeading);
      const escorts = [
        { type: 'interceptor', angleOff: -0.24, dist: 85 },
        { type: 'interceptor', angleOff: 0.24, dist: 85 },
        { type: 'fighter', angleOff: -0.42, dist: 105 },
        { type: 'fighter', angleOff: 0.42, dist: 105 }
      ];
      escorts.forEach(e => {
        this._createDrone(e.type, playerPos, playerHeading + e.angleOff, e.dist);
      });
    }
  }

  _createDrone(type, playerPos, angle, spawnDist = 90) {
    const THREE = this.THREE;
    const x = playerPos.x + Math.sin(angle) * spawnDist;
    const z = playerPos.z + Math.cos(angle) * spawnDist;

    const group = new THREE.Group();
    let hp, maxHp, shield = 0, maxShield = 0, speed, fireRate, points, radius, name;
    let behavior = 'dogfight';
    let thrusters = [];

    if (type === 'interceptor') {
      // 1. INTERCEPTOR ("Shadow Dart") — Highly agile, forward-swept razor wings
      name = 'SHADOW INTERCEPTOR';
      hp = maxHp = 4;
      speed = 52;
      fireRate = 1.3;
      points = 200;
      radius = 3.2;
      behavior = 'hit_and_run';

      // Titanium needle fuselage (Length ~6.4m)
      const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5.2, 6), this.armorHullMat);
      fuselage.rotation.x = Math.PI / 2;
      group.add(fuselage);

      // Gunmetal canopy ridge
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 2.8), this.armorDarkMat);
      ridge.position.set(0, 0.35, -0.4);
      group.add(ridge);

      // Glowing crimson sensor eye
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.8), this.crimsonTrimMat);
      eye.position.set(0, 0.32, 1.2);
      group.add(eye);

      // Forward-swept titanium razor wings with crimson leading edges
      [-1, 1].forEach(s => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.8), this.armorHullMat);
        wing.position.set(s * 1.8, 0, -0.6);
        wing.rotation.y = s * -0.32;
        group.add(wing);

        const wingTrim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 1.9), this.crimsonTrimMat);
        wingTrim.position.set(s * 2.8, 0, -0.6);
        group.add(wingTrim);

        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), this.armorGunmetalMat);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(s * 2.4, -0.05, 0.8);
        group.add(cannon);

        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 1.2), this.crimsonTrimMat);
        fin.position.set(s * 1.2, 0.55, -1.6);
        fin.rotation.z = s * -0.22;
        group.add(fin);
      });

      // Twin glowing plasma thrusters on rear
      thrusters = this._attachThrusters(group, [-0.65, 0.65], 0, -2.4, 1.15);

    } else if (type === 'fighter') {
      // 2. FIGHTER ("Phantom Raider") — Balanced tactical strike fighter
      name = 'PHANTOM FIGHTER';
      hp = maxHp = 8;
      speed = 36;
      fireRate = 1.6;
      points = 350;
      radius = 4.0;
      behavior = 'dogfight';

      // Delta-wing chassis with titanium hull & gunmetal inlays (Length ~8.2m)
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 4.8), this.armorHullMat);
      group.add(body);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.8, 4), this.armorHullMat);
      nose.rotation.x = Math.PI / 2;
      nose.rotation.y = Math.PI / 4;
      nose.position.set(0, 0.1, 3.4);
      group.add(nose);

      // Red tactical scanner cockpit
      const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 1.8), this.crimsonTrimMat);
      cockpit.position.set(0, 0.55, 0.6);
      group.add(cockpit);

      [-1, 1].forEach(s => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 2.6), this.armorHullMat);
        wing.position.set(s * 2.2, 0, -0.5);
        wing.rotation.y = s * 0.18;
        group.add(wing);

        const wingTrim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.24, 2.4), this.crimsonTrimMat);
        wingTrim.position.set(s * 3.4, 0, -0.5);
        group.add(wingTrim);

        const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), this.armorGunmetalMat);
        gun.rotation.x = Math.PI / 2;
        gun.position.set(s * 2.6, -0.1, 1.6);
        group.add(gun);

        const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), this.amberGlowMat);
        muzzleRing.position.set(s * 2.6, -0.1, 3.2);
        group.add(muzzleRing);

        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 1.4), this.armorDarkMat);
        fin.position.set(s * 0.9, 0.85, -1.8);
        fin.rotation.z = s * -0.22;
        group.add(fin);
      });

      // Twin glowing plasma thrusters
      thrusters = this._attachThrusters(group, [-0.85, 0.85], 0, -2.8, 1.35);

    } else if (type === 'gunship') {
      // 3. HEAVY GUNSHIP ("Goliath Fortress") — Massive armored siege platform
      name = 'GOLIATH GUNSHIP';
      hp = maxHp = 22;
      shield = maxShield = 15;
      speed = 22;
      fireRate = 2.0;
      points = 700;
      radius = 5.8;
      behavior = 'standoff_flak';

      // Armored siege hull (Width ~12m, Length ~14m)
      const mainHull = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 2.2, 6), this.armorHullMat);
      mainHull.rotation.x = Math.PI / 2;
      group.add(mainHull);

      const topTurretArmor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.0, 3.4), this.armorDarkMat);
      topTurretArmor.position.set(0, 1.3, -0.4);
      group.add(topTurretArmor);

      // Dual Twin Heavy Cannon Turrets with glowing muzzle coils
      [-2.2, 2.2].forEach(s => {
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 4.8, 8), this.armorGunmetalMat);
        turret.rotation.x = Math.PI / 2;
        turret.position.set(s, 0.6, 2.4);
        group.add(turret);

        const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 8, 16), this.amberGlowMat);
        muzzle.position.set(s, 0.6, 4.8);
        group.add(muzzle);
      });

      // Frontal Hexagonal Energy Shield Dish
      const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(5.2, 16, 16), this.shieldMat);
      shieldMesh.scale.set(1.25, 0.65, 1.25);
      group.add(shieldMesh);
      group.shieldMesh = shieldMesh;

      // Quad Heavy Thrusters
      thrusters = this._attachThrusters(group, [-2.2, -0.75, 0.75, 2.2], 0, -3.2, 1.45);

    } else if (type === 'elite') {
      // 4. ELITE SPACECRAFT ("Viper Ace") — Tactical stealth ace with micro-missiles
      name = 'VIPER ACE';
      hp = maxHp = 16;
      shield = maxShield = 14;
      speed = 46;
      fireRate = 1.4;
      points = 850;
      radius = 4.2;
      behavior = 'elite_ace';

      const fuselage = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6.2, 5), this.armorHullMat);
      fuselage.rotation.x = Math.PI / 2;
      fuselage.rotation.y = Math.PI / 5;
      group.add(fuselage);

      const cockpitVisor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 1.8), this.crimsonTrimMat);
      cockpitVisor.position.set(0, 0.42, 1.0);
      group.add(cockpitVisor);

      [-1, 1].forEach(s => {
        const sweptWing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 2.6), this.armorHullMat);
        sweptWing.position.set(s * 2.2, 0, -0.8);
        sweptWing.rotation.y = s * -0.28;
        group.add(sweptWing);

        const pod = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 1.8), this.crimsonTrimMat);
        pod.position.set(s * 2.8, -0.16, 0.4);
        group.add(pod);
      });

      const shieldMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(4.6, 1), this.shieldMat);
      group.add(shieldMesh);
      group.shieldMesh = shieldMesh;

      // Twin Afterburner Thruster Flames
      thrusters = this._attachThrusters(group, [-0.95, 0.95], 0, -3.4, 1.45);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.drones.push({
      type,
      name,
      group,
      hp,
      maxHp,
      shield,
      maxShield,
      speed,
      fireRate,
      lastFireTime: Math.random() * fireRate,
      lastMissileTime: 0,
      points,
      radius,
      behavior,
      heading: angle + Math.PI,
      targetHeading: angle + Math.PI,
      vx: 0,
      vz: 0,
      roll: 0,
      strafeAngle: Math.random() * Math.PI * 2,
      evadeTimer: 0,
      disabledTimer: 0,
      thrusters
    });
  }

  /**
   * Spawns the massive Capital Dreadnought "Leviathan Omega" (Level 5 Boss)
   * Positioned directly in front of the player's vector at 135m distance
   */
  _spawnBoss(levelNumber, playerPos, playerHeading = 0) {
    const THREE = this.THREE;
    const bossName = 'LEVIATHAN OMEGA CAPITAL DREADNOUGHT';
    const maxHp = 120;
    const maxShield = 80;

    const spawnDist = 135;
    const x = playerPos.x + Math.sin(playerHeading) * spawnDist;
    const z = playerPos.z + Math.cos(playerHeading) * spawnDist;

    const group = new THREE.Group();

    // 1. Massive 45m Capital Ship Core Superstructure
    const coreHull = new THREE.Mesh(new THREE.BoxGeometry(11.0, 4.5, 42.0), this.bossArmorMat);
    coreHull.castShadow = true;
    group.add(coreHull);

    // Multi-Tiered Command Bridge
    const bridgeTier1 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.8, 14.0), this.bossArmorMat);
    bridgeTier1.position.set(0, 3.2, -7.0);
    group.add(bridgeTier1);

    const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.4, 7.2), this.armorGunmetalMat);
    bridgeTower.position.set(0, 5.4, -8.0);
    group.add(bridgeTower);

    const bridgeVisor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 1.0), this.crimsonTrimMat);
    bridgeVisor.position.set(0, 5.8, -4.5);
    group.add(bridgeVisor);

    // Glowing Alien Hyper-Matter Reactor Core
    const coreReactor = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 24), this.bossCoreMat);
    coreReactor.position.set(0, 1.0, 4.0);
    group.add(coreReactor);

    // 2. Outrigger Battleship Sponsons with Dual Broadside Batteries
    [-8.0, 8.0].forEach(side => {
      const sponson = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.4, 32.0), this.bossArmorMat);
      sponson.position.set(side, 0, -2.0);
      group.add(sponson);

      // Rotating Heavy Broadside Turrets
      [-9.0, -1.0, 7.0].forEach(zOff => {
        const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.0, 12), this.armorGunmetalMat);
        turretBase.position.set(side, 2.0, zOff);
        group.add(turretBase);

        const cannonL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 5.0, 8), this.crimsonTrimMat);
        cannonL.rotation.x = Math.PI / 2;
        cannonL.position.set(side - 0.45, 2.2, zOff + 2.5);
        group.add(cannonL);

        const cannonR = cannonL.clone();
        cannonR.position.x = side + 0.45;
        group.add(cannonR);
      });
    });

    // Massive Ellipsoid Shield Bubble
    const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(22.0, 24, 24), this.shieldMat);
    shieldMesh.scale.set(1.45, 0.60, 1.85);
    group.add(shieldMesh);

    // Quad Massive Capital Thruster Plumes
    const thrusters = this._attachThrusters(group, [-3.4, -1.2, 1.2, 3.4], 0.6, -21.0, 2.4, true);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.boss = {
      name: bossName,
      group,
      hp: maxHp,
      maxHp,
      shield: maxShield,
      maxShield,
      speed: 15,
      fireRate: 2.2,
      lastFireTime: 0,
      lastBeamTime: 0,
      lastMissileTime: 0,
      missileRate: 4.5,
      heading: playerHeading + Math.PI,
      radius: 22.0,
      points: 8000,
      shieldMesh,
      phase: 1,
      isDestroying: false,
      destroyTimer: 0,
      disabledTimer: 0,
      thrusters
    };
  }

  /**
   * Player fires ordnance. `mode` selects the profile:
   *   homing  - one guided round, balanced
   *   salvo   - three guided rounds in a fan, lighter each
   *   torpedo - one heavy unguided round, slow but devastating
   */
  launchPlayerMissile(player, target, mode = 'homing') {
    if (mode === 'salvo') {
      for (let k = -1; k <= 1; k++) {
        this._spawnPlayerMissile(player, target, {
          spread: k * 0.17, speed: 100, damage: 9, homing: true, life: 5.0, scale: 0.8
        });
      }
      return;
    }

    if (mode === 'torpedo') {
      this._spawnPlayerMissile(player, target, {
        spread: 0, speed: 76, damage: 34, homing: false, life: 4.2, scale: 1.6
      });
      return;
    }

    this._spawnPlayerMissile(player, target, {
      spread: 0, speed: 110, damage: 16, homing: true, life: 5.0, scale: 1
    });
  }

  _spawnPlayerMissile(player, target, cfg) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.missileGeom, this.playerMissileMat);
    mesh.position.copy(player.getMissileSpawn());
    mesh.scale.setScalar(cfg.scale);
    mesh.rotation.y = player.heading + cfg.spread;
    this.scene.add(mesh);

    this.playerMissiles.push({
      mesh,
      target,
      heading: player.heading + cfg.spread,
      pitch: 0,
      speed: cfg.speed,
      life: cfg.life,
      damage: cfg.damage,
      homing: cfg.homing
    });
  }

  /**
   * Player Triggers EMP Shockwave Blast
   */
  triggerEMPBlast(pos, radius = 140, particles, audio) {
    audio.empBlast();
    particles.createEMPShockwave(pos, radius);

    // Detonate all incoming enemy missiles
    for (let i = this.enemyMissiles.length - 1; i >= 0; i--) {
      const m = this.enemyMissiles[i];
      if (m.mesh.position.distanceTo(pos) < radius) {
        particles.createExplosion(m.mesh.position, 1.2, 0x3ef0ff);
        this.scene.remove(m.mesh);
        this.enemyMissiles.splice(i, 1);
      }
    }

    // Strip enemy shields & disable weapons
    this.drones.forEach(d => {
      if (d.group.position.distanceTo(pos) < radius) {
        d.shield = 0;
        d.disabledTimer = 4.5;
        if (d.group.shieldMesh) d.group.shieldMesh.material.opacity = 0;
        particles.createShieldHit(d.group.position, 0x3ef0ff);
      }
    });

    if (this.boss && this.boss.group.position.distanceTo(pos) < radius) {
      this.boss.shield = Math.max(0, this.boss.shield - 35);
      this.boss.disabledTimer = 3.0;
      particles.createShieldHit(this.boss.group.position, 0x3ef0ff);
    }
  }

  update(dt, player, time, audio, particles) {
    const THREE = this.THREE;

    // =========================================================
    // 1. UPDATE BOSS (Leviathan Omega)
    // =========================================================
    if (this.boss) {
      const b = this.boss;

      if (b.isDestroying) {
        b.destroyTimer += dt;
        // Cascading explosions along the capital hull
        if (Math.random() < 0.45) {
          const rx = b.group.position.x + (Math.random() - 0.5) * 16;
          const rz = b.group.position.z + (Math.random() - 0.5) * 32;
          particles.createExplosion(new THREE.Vector3(rx, (Math.random() - 0.5) * 4, rz), 2.2, 0xff5500);
          audio.explode(false);
        }
        b.group.rotation.y += 0.08 * dt;
        b.group.rotation.z += 0.05 * dt;

        if (b.destroyTimer > 3.8) {
          particles.createShipExplosion(b.group.position, true);
          audio.explode(true);
          this._disposeGroup(b.group);
          this.boss = null;
        }
      } else {
        const dx = player.position.x - b.group.position.x;
        const dz = player.position.z - b.group.position.z;
        const dist = Math.hypot(dx, dz);

        // Turn towards player
        const angleToPlayer = Math.atan2(dx, dz);
        let angleDiff = Math.atan2(Math.sin(angleToPlayer - b.heading), Math.cos(angleToPlayer - b.heading));
        b.heading += angleDiff * Math.min(1.0, 0.9 * dt);
        b.group.rotation.y = b.heading;

        if (dist > 85) {
          b.group.position.x += Math.sin(b.heading) * b.speed * dt;
          b.group.position.z += Math.cos(b.heading) * b.speed * dt;
        }

        // Majestic 3D altitude alignment
        const bDY = player.position.y - b.group.position.y;
        b.group.position.y += Math.max(-14, Math.min(14, bDY * 0.9)) * dt;
        b.group.rotation.x = Math.max(-0.25, Math.min(0.25, -bDY * 0.015));

        // Engine Thruster Animation
        if (b.thrusters) {
          const pulse = 1.0 + Math.sin(time * 24) * 0.15;
          b.thrusters.forEach(t => {
            t.outer.scale.z = t.baseScale * pulse;
            t.inner.scale.z = t.baseScale * (pulse * 1.15);
          });
        }

        // Shield Mesh Opacity
        if (b.shieldMesh) {
          b.shieldMesh.material.opacity = (b.shield > 0) ? (0.35 + Math.sin(time * 5) * 0.15) : 0;
        }

        // Phase Transitions
        const hpPercent = (b.hp + b.shield) / (b.maxHp + b.maxShield);
        if (hpPercent < 0.35) b.phase = 3;
        else if (hpPercent < 0.65) b.phase = 2;
        else b.phase = 1;

        if (b.disabledTimer > 0) {
          b.disabledTimer -= dt;
        } else {
          // Broadside Volleys
          if (dist < 260 && (time - b.lastFireTime >= (b.phase === 3 ? 1.4 : b.fireRate))) {
            b.lastFireTime = time;
            this._bossFire(b, player, audio);
          }

          // Seeker Missiles
          if (dist < 280 && (time - b.lastMissileTime >= (b.phase >= 2 ? 3.0 : b.missileRate))) {
            b.lastMissileTime = time;
            this._bossLaunchMissile(b, player, audio);
          }

          // Phase 2/3 Sweeping Plasma Beam
          if (b.phase >= 2 && dist < 220 && (time - b.lastBeamTime >= 6.5)) {
            b.lastBeamTime = time;
            this._bossSweepBeam(b, player, audio);
          }
        }
      }
    }

    // =========================================================
    // 2. UPDATE STANDARD DRONES (With 5 Class Behaviors)
    // =========================================================
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const drone = this.drones[i];
      if (drone.disabledTimer > 0) drone.disabledTimer -= dt;

      const dx = player.position.x - drone.group.position.x;
      const dz = player.position.z - drone.group.position.z;
      const dist = Math.hypot(dx, dz);

      const angleToPlayer = Math.atan2(dx, dz);
      let angleDiff = Math.atan2(Math.sin(angleToPlayer - drone.heading), Math.cos(angleToPlayer - drone.heading));

      let forwardMove = drone.speed;
      let strafeMove = 0;

      if (drone.behavior === 'hit_and_run') {
        // Interceptor: Speeds in for high-speed strafe, then rolls and breaks away
        if (drone.evadeTimer > 0) {
          drone.evadeTimer -= dt;
          forwardMove = drone.speed * 1.2;
          drone.targetHeading = angleToPlayer + Math.PI * 0.7;
          drone.roll += (1.4 - drone.roll) * 8 * dt;
        } else {
          drone.targetHeading = angleToPlayer;
          drone.roll += (-angleDiff * 1.8 - drone.roll) * 6 * dt;
          if (dist < 45) {
            drone.evadeTimer = 2.4; // Trigger evasive breakaway!
          }
        }
      } else if (drone.behavior === 'dogfight') {
        // Fighter: Classic circling dogfight with predictive aiming
        drone.targetHeading = angleToPlayer + (player.velocity.x * Math.cos(drone.heading) - player.velocity.z * Math.sin(drone.heading)) * 0.015;
        if (dist > 80) forwardMove = drone.speed;
        else if (dist < 42) forwardMove = -drone.speed * 0.4;
        else forwardMove = drone.speed * 0.35;
        strafeMove = Math.sin(time * 1.8 + drone.strafeAngle) * drone.speed * 0.55;
        drone.roll += (-strafeMove * 0.04 - drone.roll) * 6 * dt;
      } else if (drone.behavior === 'standoff_flak') {
        // Heavy Gunship: Standoff firing platform, slow deliberate turns
        drone.targetHeading = angleToPlayer;
        if (dist > 110) forwardMove = drone.speed;
        else if (dist < 60) forwardMove = -drone.speed * 0.5;
        else forwardMove = Math.sin(time * 0.8) * 4;
        strafeMove = Math.cos(time * 0.5) * 6;
      } else if (drone.behavior === 'elite_ace') {
        // Elite Ace: Barrel rolls when targeted, flanking maneuvers
        drone.targetHeading = angleToPlayer;
        if (dist < 50) drone.roll += Math.PI * 3 * dt; // Barrel roll!
        else drone.roll += (-angleDiff * 2.2 - drone.roll) * 8 * dt;

        if (dist > 70) forwardMove = drone.speed;
        else forwardMove = drone.speed * 0.5;
        strafeMove = Math.sin(time * 2.5) * 18;

        // Elite Micro-Missiles
        if (drone.disabledTimer <= 0 && dist < 160 && (time - drone.lastMissileTime >= 4.2)) {
          drone.lastMissileTime = time;
          this._droneLaunchMissile(drone, player, audio);
        }
      }

      // Smooth turning
      let hDiff = Math.atan2(Math.sin(drone.targetHeading - drone.heading), Math.cos(drone.targetHeading - drone.heading));
      drone.heading += hDiff * Math.min(1.0, 3.8 * dt);
      drone.group.rotation.y = drone.heading;
      drone.group.rotation.z = drone.roll;

      // Position update
      const cosH = Math.cos(drone.heading);
      const sinH = Math.sin(drone.heading);
      drone.vx = sinH * forwardMove + cosH * strafeMove;
      drone.vz = cosH * forwardMove - sinH * strafeMove;

      drone.group.position.x += drone.vx * dt;
      drone.group.position.z += drone.vz * dt;

      // 3D Altitude Tracking & Natural Banking
      const dY = player.position.y - drone.group.position.y;
      drone.group.position.y += Math.max(-28, Math.min(28, dY * 1.6)) * dt;
      drone.group.rotation.x = Math.max(-0.45, Math.min(0.45, -dY * 0.03));

      // Pulse engine plasma exhaust
      if (drone.thrusters) {
        const pulse = 1.0 + Math.sin(time * 32 + i * 2) * 0.16;
        drone.thrusters.forEach(t => {
          t.outer.scale.z = t.baseScale * pulse;
          t.inner.scale.z = t.baseScale * (pulse * 1.15);
        });
      }

      // Firing
      if (drone.disabledTimer <= 0 && dist < 170 && (time - drone.lastFireTime >= drone.fireRate)) {
        if (Math.abs(angleDiff) < 0.65) {
          drone.lastFireTime = time;
          this._droneFire(drone, player, audio);
        }
      }
    }

    // =========================================================
    // 3. UPDATE PLAYER HOMING MISSILES
    // =========================================================
    for (let i = this.playerMissiles.length - 1; i >= 0; i--) {
      const pm = this.playerMissiles[i];
      pm.life -= dt;

      // Guided rounds steer in BOTH axes. The original update only moved x/z, so a
      // missile stayed at its launch altitude and flew straight past any enemy at a
      // different height -- which is most of them.
      const liveTarget = pm.target && pm.target.group && pm.target.group.parent;
      if (pm.homing && liveTarget) {
        const tPos = pm.target.group.position;
        const dx = tPos.x - pm.mesh.position.x;
        const dy = tPos.y - pm.mesh.position.y;
        const dz = tPos.z - pm.mesh.position.z;

        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = Math.atan2(Math.sin(targetAngle - pm.heading), Math.cos(targetAngle - pm.heading));
        pm.heading += angleDiff * Math.min(1.0, 4.5 * dt);

        const horiz = Math.hypot(dx, dz);
        const targetPitch = Math.atan2(dy, Math.max(0.001, horiz));
        pm.pitch = (pm.pitch || 0) + (targetPitch - (pm.pitch || 0)) * Math.min(1.0, 3.5 * dt);
      }

      pm.mesh.rotation.y = pm.heading;
      pm.mesh.rotation.x = -(pm.pitch || 0);

      const step = pm.speed * dt;
      const cosPitch = Math.cos(pm.pitch || 0);
      pm.mesh.position.x += Math.sin(pm.heading) * cosPitch * step;
      pm.mesh.position.y += Math.sin(pm.pitch || 0) * step;
      pm.mesh.position.z += Math.cos(pm.heading) * cosPitch * step;

      particles.createMissileSmoke(pm.mesh.position);

      // Check collision with any hostile
      let detonated = false;

      // Boss check
      if (this.boss && !this.boss.isDestroying) {
        if (pm.mesh.position.distanceTo(this.boss.group.position) < this.boss.radius) {
          const res = this._applyDamageToTarget(this.boss, pm.damage, particles, audio);
          if (res && res.destroyed) this.missileKills.push(res);
          detonated = true;
        }
      }

      // Standard drones check
      if (!detonated) {
        for (let j = this.drones.length - 1; j >= 0; j--) {
          const d = this.drones[j];
          if (pm.mesh.position.distanceTo(d.group.position) < d.radius + 1.2) {
            const res = this._applyDamageToTarget(d, pm.damage, particles, audio);
            if (res && res.destroyed) this.missileKills.push(res);
            detonated = true;
            break;
          }
        }
      }

      if (detonated || pm.life <= 0) {
        particles.createExplosion(pm.mesh.position, 1.8, 0x3ef0ff);
        audio.explode(false);
        this.scene.remove(pm.mesh);
        this.playerMissiles.splice(i, 1);
      }
    }

    // =========================================================
    // 4. UPDATE ENEMY HOMING MISSILES
    // =========================================================
    for (let i = this.enemyMissiles.length - 1; i >= 0; i--) {
      const m = this.enemyMissiles[i];
      m.life -= dt;

      const dx = player.position.x - m.mesh.position.x;
      const dz = player.position.z - m.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = Math.atan2(Math.sin(targetAngle - m.heading), Math.cos(targetAngle - m.heading));
      m.heading += angleDiff * Math.min(1.0, 3.4 * dt);

      m.mesh.rotation.y = m.heading;
      const speed = 76;
      m.mesh.position.x += Math.sin(m.heading) * speed * dt;
      m.mesh.position.z += Math.cos(m.heading) * speed * dt;

      // 3D Homing Pitch Tracking
      const dy = player.position.y - m.mesh.position.y;
      m.mesh.position.y += Math.max(-28, Math.min(28, dy * 2.0)) * dt;

      particles.createMissileSmoke(m.mesh.position);

      if (dist < 3.4 && Math.abs(dy) < 4.0) {
        player.takeDamage(m.damage, time);
        audio.explode(false);
        particles.createExplosion(m.mesh.position, 1.6, 0xff5500);
        this.scene.remove(m.mesh);
        this.enemyMissiles.splice(i, 1);
        continue;
      }

      if (m.life <= 0) {
        particles.createExplosion(m.mesh.position, 0.8, 0xff3b00);
        this.scene.remove(m.mesh);
        this.enemyMissiles.splice(i, 1);
      }
    }

    // =========================================================
    // 5. UPDATE ENEMY LASER PROJECTILES
    // =========================================================
    for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
      const laser = this.enemyLasers[i];
      laser.mesh.position.x += laser.vx * dt;
      laser.mesh.position.y += (laser.vy || 0) * dt;
      laser.mesh.position.z += laser.vz * dt;
      laser.life -= dt;

      const pDx = player.position.x - laser.mesh.position.x;
      const pDy = player.position.y - laser.mesh.position.y;
      const pDz = player.position.z - laser.mesh.position.z;
      const dist3D = Math.hypot(pDx, pDy, pDz);

      if (dist3D < 3.0) {
        player.takeDamage(laser.damage, time);
        audio.shieldHit();
        particles.createShieldHit(laser.mesh.position, 0xff1744);

        this.scene.remove(laser.mesh);
        this.enemyLasers.splice(i, 1);
        continue;
      }

      if (laser.life <= 0) {
        this.scene.remove(laser.mesh);
        this.enemyLasers.splice(i, 1);
      }
    }

    // =========================================================
    // 6. UPDATE HOLOGRAPHIC POWER-UP PICKUPS
    // =========================================================
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.life -= dt;
      p.group.rotation.y += 2.8 * dt;
      p.group.rotation.x += 1.4 * dt;

      const dx = player.position.x - p.group.position.x;
      const dz = player.position.z - p.group.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 45) {
        const pull = 55 * (1 - dist / 45);
        p.group.position.x += (dx / dist) * pull * dt;
        p.group.position.z += (dz / dist) * pull * dt;
      }

      if (dist < 4.2) {
        this._applyPowerup(p.type, player, audio);
        particles.createPowerupCollect(p.group.position, p.type);
        this.scene.remove(p.group);
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.scene.remove(p.group);
        this.powerups.splice(i, 1);
      }
    }
  }

  _bossFire(boss, player, audio) {
    const THREE = this.THREE;
    [-4.5, -1.8, 1.8, 4.5].forEach(offset => {
      const mesh = new THREE.Mesh(this.laserGeom, this.bossLaserMat);
      mesh.scale.set(1.8, 1.8, 1.8);
      mesh.position.copy(boss.group.position);
      mesh.position.x += Math.cos(boss.heading) * offset;
      mesh.position.z -= Math.sin(boss.heading) * offset;

      const dx = player.position.x - mesh.position.x;
      const dz = player.position.z - mesh.position.z;
      const aimHeading = Math.atan2(dx, dz);
      mesh.rotation.y = aimHeading;

      const speed = 125;
      this.enemyLasers.push({
        mesh,
        vx: Math.sin(aimHeading) * speed,
        vz: Math.cos(aimHeading) * speed,
        life: 2.8,
        damage: 14
      });
      this.scene.add(mesh);
    });
    audio.enemyShoot();
  }

  _bossLaunchMissile(boss, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.missileGeom, this.missileMat);
    mesh.position.copy(boss.group.position);
    mesh.position.y += 1.5;
    mesh.rotation.y = boss.heading;
    this.scene.add(mesh);

    this.enemyMissiles.push({
      mesh,
      heading: boss.heading,
      life: 6.5,
      damage: 24
    });
    audio.missileLaunch();
  }

  _bossSweepBeam(boss, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.beamLaserGeom, this.beamLaserMat);
    mesh.position.copy(boss.group.position);
    mesh.position.y += 0.8;

    const dx = player.position.x - mesh.position.x;
    const dz = player.position.z - mesh.position.z;
    const aimHeading = Math.atan2(dx, dz);
    mesh.rotation.y = aimHeading;

    const speed = 160;
    this.enemyLasers.push({
      mesh,
      vx: Math.sin(aimHeading) * speed,
      vz: Math.cos(aimHeading) * speed,
      life: 3.0,
      damage: 20
    });
    this.scene.add(mesh);
    audio.enemyShoot();
  }

  _droneFire(drone, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.laserGeom, this.droneLaserMat);
    mesh.position.copy(drone.group.position);
    mesh.position.y += 0.1;

    // Lead player velocity in 3D
    const dx = (player.position.x + player.velocity.x * 0.25) - mesh.position.x;
    const dy = (player.position.y + player.velocity.y * 0.25) - mesh.position.y;
    const dz = (player.position.z + player.velocity.z * 0.25) - mesh.position.z;
    const dist3D = Math.hypot(dx, dy, dz) || 1;
    const aimHeading = Math.atan2(dx, dz);
    mesh.rotation.y = aimHeading;
    mesh.rotation.x = -Math.asin(Math.max(-0.95, Math.min(0.95, dy / dist3D)));

    const speed = drone.type === 'gunship' ? 140 : 130;
    const damage = drone.type === 'gunship' ? 12 : 8;

    this.enemyLasers.push({
      mesh,
      vx: (dx / dist3D) * speed,
      vy: (dy / dist3D) * speed,
      vz: (dz / dist3D) * speed,
      life: 2.2,
      damage
    });
    this.scene.add(mesh);
    audio.enemyShoot();
  }

  _droneLaunchMissile(drone, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.missileGeom, this.missileMat);
    mesh.position.copy(drone.group.position);
    mesh.rotation.y = drone.heading;
    this.scene.add(mesh);

    this.enemyMissiles.push({
      mesh,
      heading: drone.heading,
      life: 5.0,
      damage: 18
    });
    audio.missileLaunch();
  }

  _applyDamageToTarget(target, damage, particles, audio) {
    if (target.shield > 0) {
      target.shield = Math.max(0, target.shield - damage);
      particles.createShieldHit(target.group.position, 0xff1744);
      audio.shieldHit();
    } else {
      target.hp -= damage;
      particles.createExplosion(target.group.position, 0.8, 0xff5500);
      audio.hit();
    }

    if (target.hp <= 0) {
      if (target === this.boss) {
        target.isDestroying = true;
        return { destroyed: true, name: target.name, points: target.points, isBoss: true };
      }
      this._destroyDrone(target, particles, audio);
      return { destroyed: true, name: target.name, points: target.points, isBoss: false };
    }

    return { destroyed: false };
  }

  checkPlayerLaserCollisions(laserMesh, damage, particles, audio) {
    // 1. Check Boss
    if (this.boss && !this.boss.isDestroying) {
      const b = this.boss;
      const dist = laserMesh.position.distanceTo(b.group.position);
      if (dist < b.radius) {
        if (b.shield > 0) {
          b.shield -= damage;
          particles.createShieldHit(laserMesh.position, 0xbf00ff);
          audio.shieldHit();
        } else {
          b.hp -= damage;
          particles.createExplosion(laserMesh.position, 0.6, 0xff1744);
          audio.hit();
        }

        if (b.hp <= 0) {
          b.isDestroying = true;
          this._spawnPowerup(b.group.position, 'weapon');
          return { hit: true, destroyed: true, name: b.name, points: b.points, isBoss: true };
        }
        return { hit: true, destroyed: false, name: b.name, isBoss: true };
      }
    }

    // 2. Check Standard Drones
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const drone = this.drones[i];
      const dist = laserMesh.position.distanceTo(drone.group.position);
      if (dist < drone.radius) {
        if (drone.shield > 0) {
          drone.shield -= damage;
          particles.createShieldHit(laserMesh.position, 0xff1744);
          audio.shieldHit();
        } else {
          drone.hp -= damage;
          particles.createExplosion(laserMesh.position, 0.5, 0xffaa00);
          audio.hit();
        }

        if (drone.hp <= 0) {
          this._destroyDrone(drone, particles, audio);
          return { hit: true, destroyed: true, name: drone.name, points: drone.points, isBoss: false };
        }
        return { hit: true, destroyed: false, name: drone.name, isBoss: false };
      }
    }

    return { hit: false };
  }

  _destroyDrone(drone, particles, audio) {
    particles.createShipExplosion(drone.group.position, drone.type === 'gunship');
    audio.explode(false);

    // Chance to spawn holographic power-up drop
    if (Math.random() < 0.45) {
      const roll = Math.random();
      const pType = roll > 0.6 ? 'missile' : (roll > 0.3 ? 'shield' : 'weapon');
      this._spawnPowerup(drone.group.position, pType);
    }

    this._disposeGroup(drone.group);
    const idx = this.drones.indexOf(drone);
    if (idx !== -1) this.drones.splice(idx, 1);
  }

  _spawnPowerup(pos, type) {
    const THREE = this.THREE;
    const group = new THREE.Group();

    const colors = {
      shield: 0x5cff9d,
      weapon: 0xffaa00,
      missile: 0x3ef0ff
    };
    const col = colors[type] || 0x3ef0ff;

    const core = new THREE.Mesh(this.powerupGeom, new THREE.MeshBasicMaterial({ color: col }));
    group.add(core);

    const ring = new THREE.Mesh(this.powerupRingGeom, new THREE.MeshBasicMaterial({ color: col, wireframe: true }));
    group.add(ring);

    group.position.copy(pos);
    this.scene.add(group);

    this.powerups.push({
      group,
      type,
      life: 25.0
    });
  }

  _applyPowerup(type, player, audio) {
    audio.pickup(type);
    if (type === 'shield') {
      player.repairShield(45);
      player.repairHull(25);
    } else if (type === 'weapon') {
      player.upgradeWeapon(2, 18.0);
    } else if (type === 'missile') {
      player.reloadMissiles(4);
    }
  }

  /**
   * Comprehensive Multi-Target Tracking Computer
   * Tracks all active hostiles in 3D space, calculates screen projections,
   * identifies locked primary targets, generates predictive dogfight lead pips,
   * and computes off-screen edge clamping with directional chevron angles.
   */
  getTargetTrackingInfo(player, camera, canvasWidth, canvasHeight) {
    const THREE = this.THREE;
    const candidates = [];

    // Keep a reference to the live entity: the spread copies are snapshots, so
    // homing off a copy tracked stale hp/position and never let go of dead targets.
    if (this.boss && !this.boss.isDestroying) {
      candidates.push({ ...this.boss, isBoss: true, ref: this.boss });
    }
    this.drones.forEach(d => candidates.push({ ...d, isBoss: false, ref: d }));

    if (candidates.length === 0) return null;

    const pPos = player.position;
    this._pHeadingVec.set(Math.sin(player.heading), 0, Math.cos(player.heading));

    const margin = 36;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    let bestScore = Infinity;
    let primaryTarget = null;
    const allTargets = [];

    candidates.forEach(c => {
      const cPos = c.group.position;
      const dx = cPos.x - pPos.x;
      const dz = cPos.z - pPos.z;
      const dist = Math.hypot(dx, dz);

      // Fast forward dot product without vector allocations
      const invDist = dist > 0.001 ? (1.0 / dist) : 0;
      const forwardDot = (dx * invDist) * this._pHeadingVec.x + (dz * invDist) * this._pHeadingVec.z;
      const score = dist - forwardDot * 80;

      // Project 3D world position to NDC [-1, 1] using scratch vector
      this._projVec.copy(cPos).project(camera);
      const inFront = this._projVec.z < 1.0;

      let sx = (this._projVec.x * 0.5 + 0.5) * canvasWidth;
      let sy = (-this._projVec.y * 0.5 + 0.5) * canvasHeight;

      const isOnScreen = inFront && (sx >= margin && sx <= canvasWidth - margin && sy >= margin && sy <= canvasHeight - margin);

      let edgeX = sx;
      let edgeY = sy;
      let edgeAngle = 0;

      if (!isOnScreen) {
        let dirX = this._projVec.x;
        let dirY = -this._projVec.y;
        if (!inFront) {
          dirX = -dirX;
          dirY = -dirY;
        }

        edgeAngle = Math.atan2(dirY, dirX);

        const maxW = (canvasWidth / 2) - margin;
        const maxH = (canvasHeight / 2) - margin;

        const slope = Math.abs(dirY / (dirX || 0.0001));
        const boxSlope = maxH / maxW;

        if (slope < boxSlope) {
          edgeX = centerX + Math.sign(dirX) * maxW;
          edgeY = centerY + Math.sign(dirX) * maxW * (dirY / (Math.abs(dirX) || 0.0001));
        } else {
          edgeY = centerY + Math.sign(dirY) * maxH;
          edgeX = centerX + Math.sign(dirY) * maxH * (dirX / (Math.abs(dirY) || 0.0001));
        }
      }

      // Calculate dogfight lead prediction using scratch vector (0 allocations)
      const laserSpeed = 210;
      const timeToHit = dist / laserSpeed;
      this._tempLead.set(
        cPos.x + (c.vx || 0) * timeToHit,
        cPos.y,
        cPos.z + (c.vz || 0) * timeToHit
      ).project(camera);

      const leadScreenX = (this._tempLead.x * 0.5 + 0.5) * canvasWidth;
      const leadScreenY = (-this._tempLead.y * 0.5 + 0.5) * canvasHeight;

      const targetData = {
        target: c.ref || c,
        name: c.name || 'HOSTILE',
        hp: c.hp,
        maxHp: c.maxHp,
        shield: c.shield || 0,
        maxShield: c.maxShield || 0,
        distance: Math.round(dist),
        screenX: sx,
        screenY: sy,
        leadScreenX,
        leadScreenY,
        inFront,
        isOnScreen,
        edgeX,
        edgeY,
        edgeAngle,
        isBoss: !!c.isBoss
      };

      allTargets.push(targetData);

      if (score < bestScore) {
        bestScore = score;
        primaryTarget = targetData;
      }
    });

    if (primaryTarget) {
      primaryTarget.isLocked = primaryTarget.distance < 160 && primaryTarget.isOnScreen;
    }

    return {
      primary: primaryTarget,
      targets: allTargets,
      // Backward compatibility for missile tracking & audio lock
      target: primaryTarget ? primaryTarget.target : null,
      screenX: primaryTarget ? primaryTarget.screenX : 0,
      screenY: primaryTarget ? primaryTarget.screenY : 0,
      leadScreenX: primaryTarget ? primaryTarget.leadScreenX : 0,
      leadScreenY: primaryTarget ? primaryTarget.leadScreenY : 0,
      distance: primaryTarget ? primaryTarget.distance : 0,
      inFront: primaryTarget ? primaryTarget.inFront : false,
      isLocked: primaryTarget ? primaryTarget.isLocked : false
    };
  }

  clearAll() {
    this.drones.forEach(d => this._disposeGroup(d.group));
    this.drones = [];

    if (this.boss) {
      this._disposeGroup(this.boss.group);
      this.boss = null;
    }

    this.enemyLasers.forEach(l => this.scene.remove(l.mesh));
    this.enemyLasers = [];

    this.enemyMissiles.forEach(m => this.scene.remove(m.mesh));
    this.enemyMissiles = [];

    this.playerMissiles.forEach(pm => this.scene.remove(pm.mesh));
    this.playerMissiles = [];
    this.missileKills = [];

    this.powerups.forEach(p => this.scene.remove(p.group));
    this.powerups = [];
  }
}
