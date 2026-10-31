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

    // Spacecraft PBR Materials
    this.armorDarkMat = new THREE.MeshStandardMaterial({
      color: 0x161a22,
      metalness: 0.88,
      roughness: 0.32
    });

    this.armorGunmetalMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      metalness: 0.92,
      roughness: 0.28,
      envMapIntensity: 1.5
    });

    this.crimsonTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      emissive: 0xff1744,
      emissiveIntensity: 2.2,
      roughness: 0.2
    });

    this.amberGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: 0xff8800,
      emissiveIntensity: 3.0,
      roughness: 0.2
    });

    this.shieldMat = new THREE.MeshBasicMaterial({
      color: 0xff2244,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bossArmorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      metalness: 0.94,
      roughness: 0.26,
      envMapIntensity: 1.6
    });

    this.bossCoreMat = new THREE.MeshStandardMaterial({
      color: 0xbf00ff,
      emissive: 0xd946ef,
      emissiveIntensity: 4.8,
      roughness: 0.1
    });

    // Power-up geometries
    this.powerupGeom = new THREE.OctahedronGeometry(1.2, 0);
    this.powerupRingGeom = new THREE.TorusGeometry(1.6, 0.08, 8, 24);
  }

  /**
   * Spawns structured waves tailored to the 5 Mission Levels
   */
  spawnLevelWave(levelNumber, playerPos) {
    this.clearAll();

    if (levelNumber === 1) {
      // Level 1: Deep-Space Patrol (Small Scout Interceptor Patrol)
      for (let i = 0; i < 5; i++) {
        this._createDrone('interceptor', playerPos, i * (Math.PI * 2 / 5), 180 + i * 20);
      }
    } else if (levelNumber === 2) {
      // Level 2: Asteroid Field (Agile Interceptors + Balanced Fighters)
      for (let i = 0; i < 4; i++) {
        this._createDrone('interceptor', playerPos, i * (Math.PI / 2), 190);
      }
      for (let i = 0; i < 5; i++) {
        this._createDrone('fighter', playerPos, (i + 0.5) * (Math.PI * 2 / 5), 210);
      }
    } else if (levelNumber === 3) {
      // Level 3: Orbital Space Station Battle (Fighters + Heavy Gunships)
      for (let i = 0; i < 6; i++) {
        this._createDrone('fighter', playerPos, i * (Math.PI * 2 / 6), 200);
      }
      for (let i = 0; i < 3; i++) {
        this._createDrone('gunship', playerPos, i * (Math.PI * 2 / 3), 230);
      }
    } else if (levelNumber === 4) {
      // Level 4: Nebula Frontier (Heavy Gunships + Elite Viper Aces)
      for (let i = 0; i < 4; i++) {
        this._createDrone('gunship', playerPos, i * (Math.PI / 2), 220);
      }
      for (let i = 0; i < 4; i++) {
        this._createDrone('elite', playerPos, (i + 0.5) * (Math.PI / 2), 240);
      }
    } else {
      // Level 5: Capital Ship Assault (Massive Capital Dreadnought + Escorts)
      this._spawnBoss(levelNumber, playerPos);
      for (let i = 0; i < 2; i++) {
        this._createDrone('interceptor', playerPos, i * Math.PI, 180);
      }
      for (let i = 0; i < 2; i++) {
        this._createDrone('fighter', playerPos, (i + 0.5) * Math.PI, 210);
      }
    }
  }

  _createDrone(type, playerPos, angle, spawnDist = 200) {
    const THREE = this.THREE;
    const x = playerPos.x + Math.sin(angle) * spawnDist;
    const z = playerPos.z + Math.cos(angle) * spawnDist;

    const group = new THREE.Group();
    let hp, maxHp, shield = 0, maxShield = 0, speed, fireRate, points, radius, name;
    let behavior = 'dogfight';

    if (type === 'interceptor') {
      // 1. INTERCEPTOR ("Shadow Dart")
      name = 'SHADOW INTERCEPTOR';
      hp = maxHp = 3;
      speed = 58;
      fireRate = 1.3;
      points = 200;
      radius = 2.2;
      behavior = 'hit_and_run';

      const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.4, 4), this.armorDarkMat);
      fuselage.rotation.x = Math.PI / 2;
      group.add(fuselage);

      // Forward-swept razor wings
      [-1, 1].forEach(s => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), this.crimsonTrimMat);
        wing.position.set(s * 1.0, 0, -0.4);
        wing.rotation.y = s * -0.35;
        group.add(wing);

        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), this.armorGunmetalMat);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(s * 1.5, 0, 0.5);
        group.add(cannon);
      });

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.6), this.crimsonTrimMat);
      eye.position.set(0, 0.16, 0.8);
      group.add(eye);
    } else if (type === 'fighter') {
      // 2. FIGHTER ("Phantom Raider")
      name = 'PHANTOM FIGHTER';
      hp = maxHp = 8;
      speed = 38;
      fireRate = 1.6;
      points = 350;
      radius = 2.8;
      behavior = 'dogfight';

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 3.2), this.armorDarkMat);
      group.add(body);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.8, 4), this.armorGunmetalMat);
      nose.rotation.x = Math.PI / 2;
      nose.rotation.y = Math.PI / 4;
      nose.position.set(0, 0.08, 2.2);
      group.add(nose);

      [-1, 1].forEach(s => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.6), this.armorGunmetalMat);
        wing.position.set(s * 1.3, 0, -0.3);
        wing.rotation.y = s * 0.2;
        group.add(wing);

        const wingTrim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 1.4), this.crimsonTrimMat);
        wingTrim.position.set(s * 2.1, 0, -0.3);
        group.add(wingTrim);

        const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8), this.crimsonTrimMat);
        gun.rotation.x = Math.PI / 2;
        gun.position.set(s * 1.5, -0.06, 1.2);
        group.add(gun);

        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.9), this.armorDarkMat);
        fin.position.set(s * 0.5, 0.5, -1.2);
        fin.rotation.z = s * -0.22;
        group.add(fin);
      });
    } else if (type === 'gunship') {
      // 3. HEAVY GUNSHIP ("Goliath Fortress")
      name = 'GOLIATH GUNSHIP';
      hp = maxHp = 22;
      shield = maxShield = 15;
      speed = 22;
      fireRate = 2.2;
      points = 700;
      radius = 4.2;
      behavior = 'standoff_flak';

      const mainHull = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 1.4, 6), this.armorDarkMat);
      mainHull.rotation.x = Math.PI / 2;
      group.add(mainHull);

      const topTurretArmor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 2.2), this.armorGunmetalMat);
      topTurretArmor.position.set(0, 0.8, -0.2);
      group.add(topTurretArmor);

      // Dual Twin Heavy Cannon Turrets
      [-1.4, 1.4].forEach(s => {
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 8), this.crimsonTrimMat);
        turret.rotation.x = Math.PI / 2;
        turret.position.set(s, 0.4, 1.8);
        group.add(turret);

        const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), this.amberGlowMat);
        muzzle.position.set(s, 0.4, 3.4);
        group.add(muzzle);
      });

      // Frontal Shield Dish
      const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(3.6, 16, 16), this.shieldMat);
      shieldMesh.scale.set(1.2, 0.6, 1.2);
      group.add(shieldMesh);
      group.shieldMesh = shieldMesh;
    } else if (type === 'elite') {
      // 4. ELITE SPACECRAFT ("Viper Ace")
      name = 'VIPER ACE';
      hp = maxHp = 16;
      shield = maxShield = 14;
      speed = 48;
      fireRate = 1.4;
      points = 850;
      radius = 3.0;
      behavior = 'elite_ace';

      const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.85, 4.2, 5), this.armorDarkMat);
      fuselage.rotation.x = Math.PI / 2;
      fuselage.rotation.y = Math.PI / 5;
      group.add(fuselage);

      const cockpitVisor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 1.2), this.crimsonTrimMat);
      cockpitVisor.position.set(0, 0.28, 0.6);
      group.add(cockpitVisor);

      [-1, 1].forEach(s => {
        const sweptWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.8), this.armorGunmetalMat);
        sweptWing.position.set(s * 1.5, 0, -0.6);
        sweptWing.rotation.y = s * -0.3;
        group.add(sweptWing);

        // Micro-seeker missile pods
        const pod = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 1.2), this.crimsonTrimMat);
        pod.position.set(s * 1.8, -0.12, 0.2);
        group.add(pod);
      });

      const shieldMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), this.shieldMat);
      group.add(shieldMesh);
      group.shieldMesh = shieldMesh;
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
      disabledTimer: 0 // for EMP
    });
  }

  /**
   * Spawns the massive Capital Dreadnought "Leviathan Omega" (Level 5 Boss)
   */
  _spawnBoss(levelNumber, playerPos) {
    const THREE = this.THREE;
    const bossName = 'LEVIATHAN OMEGA CAPITAL DREADNOUGHT';
    const maxHp = 120;
    const maxShield = 80;

    const spawnDist = 260;
    const angle = Math.random() * Math.PI * 2;
    const x = playerPos.x + Math.sin(angle) * spawnDist;
    const z = playerPos.z + Math.cos(angle) * spawnDist;

    const group = new THREE.Group();

    // 1. Massive 45m Capital Ship Core Superstructure
    const coreHull = new THREE.Mesh(new THREE.BoxGeometry(9.0, 3.8, 36.0), this.bossArmorMat);
    coreHull.castShadow = true;
    group.add(coreHull);

    // Multi-Tiered Command Bridge
    const bridgeTier1 = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.4, 12.0), this.bossArmorMat);
    bridgeTier1.position.set(0, 2.8, -6.0);
    group.add(bridgeTier1);

    const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.0, 6.0), this.armorGunmetalMat);
    bridgeTower.position.set(0, 4.8, -7.0);
    group.add(bridgeTower);

    const bridgeVisor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.8), this.crimsonTrimMat);
    bridgeVisor.position.set(0, 5.2, -4.0);
    group.add(bridgeVisor);

    // Glowing Alien Hyper-Matter Reactor Core
    const coreReactor = new THREE.Mesh(new THREE.SphereGeometry(2.8, 24, 24), this.bossCoreMat);
    coreReactor.position.set(0, 0.8, 3.0);
    group.add(coreReactor);

    // 2. Outrigger Battleship Sponsons with Dual Broadside Batteries
    [-6.8, 6.8].forEach(side => {
      const sponson = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 28.0), this.bossArmorMat);
      sponson.position.set(side, 0, -2.0);
      group.add(sponson);

      // Rotating Heavy Broadside Turrets
      [-8.0, -1.0, 6.0].forEach(zOff => {
        const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 12), this.armorGunmetalMat);
        turretBase.position.set(side, 1.6, zOff);
        group.add(turretBase);

        const cannonL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.2, 8), this.crimsonTrimMat);
        cannonL.rotation.x = Math.PI / 2;
        cannonL.position.set(side - 0.35, 1.8, zOff + 2.2);
        group.add(cannonL);

        const cannonR = cannonL.clone();
        cannonR.position.x = side + 0.35;
        group.add(cannonR);
      });
    });

    // Rear Quad Engine Thruster Array
    [-3.0, -1.0, 1.0, 3.0].forEach(xOff => {
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 2.4, 16), this.armorGunmetalMat);
      bell.rotation.x = Math.PI / 2;
      bell.position.set(xOff, 0.4, -19.0);
      group.add(bell);

      const glow = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.15, 8, 16), this.bossCoreMat);
      glow.position.set(xOff, 0.4, -20.2);
      group.add(glow);
    });

    // Massive Ellipsoid Shield Bubble
    const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(18.0, 24, 24), this.shieldMat);
    shieldMesh.scale.set(1.4, 0.55, 1.8);
    group.add(shieldMesh);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.boss = {
      name: bossName,
      group,
      hp: maxHp,
      maxHp,
      shield: maxShield,
      maxShield,
      speed: 14,
      fireRate: 2.2,
      lastFireTime: 0,
      lastBeamTime: 0,
      lastMissileTime: 0,
      missileRate: 4.5,
      heading: angle + Math.PI,
      radius: 18.0,
      points: 8000,
      shieldMesh,
      phase: 1, // Phase 1 (100-65%), Phase 2 (65-30%), Phase 3 (30-0%)
      isDestroying: false,
      destroyTimer: 0,
      disabledTimer: 0
    };
  }

  /**
   * Player Fires a Homing Missile toward locked target
   */
  launchPlayerMissile(player, target) {
    const THREE = this.THREE;
    const spawnPos = player.getMissileSpawn();
    const mesh = new THREE.Mesh(this.missileGeom, this.playerMissileMat);
    mesh.position.copy(spawnPos);
    mesh.rotation.y = player.heading;
    this.scene.add(mesh);

    this.playerMissiles.push({
      mesh,
      target,
      heading: player.heading,
      speed: 110,
      life: 5.0,
      damage: 16
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
          this.scene.remove(b.group);
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

      // Guide toward target if still active
      if (pm.target && (pm.target.hp > 0 || (pm.target.group && pm.target.group.parent))) {
        const tPos = pm.target.group.position;
        const dx = tPos.x - pm.mesh.position.x;
        const dz = tPos.z - pm.mesh.position.z;
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = Math.atan2(Math.sin(targetAngle - pm.heading), Math.cos(targetAngle - pm.heading));
        pm.heading += angleDiff * Math.min(1.0, 4.5 * dt);
      }

      pm.mesh.rotation.y = pm.heading;
      pm.mesh.position.x += Math.sin(pm.heading) * pm.speed * dt;
      pm.mesh.position.z += Math.cos(pm.heading) * pm.speed * dt;

      particles.createMissileSmoke(pm.mesh.position);

      // Check collision with any hostile
      let detonated = false;

      // Boss check
      if (this.boss && !this.boss.isDestroying) {
        if (pm.mesh.position.distanceTo(this.boss.group.position) < this.boss.radius) {
          this._applyDamageToTarget(this.boss, pm.damage, particles, audio);
          detonated = true;
        }
      }

      // Standard drones check
      if (!detonated) {
        for (let j = this.drones.length - 1; j >= 0; j--) {
          const d = this.drones[j];
          if (pm.mesh.position.distanceTo(d.group.position) < d.radius + 1.2) {
            this._applyDamageToTarget(d, pm.damage, particles, audio);
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

      particles.createMissileSmoke(m.mesh.position);

      if (dist < 3.4) {
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
      laser.mesh.position.z += laser.vz * dt;
      laser.life -= dt;

      const pDx = player.position.x - laser.mesh.position.x;
      const pDz = player.position.z - laser.mesh.position.z;
      if (Math.hypot(pDx, pDz) < 2.6) {
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
    audio.enemyLaser();
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
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 4.5, 8), this.beamLaserMat);
    mesh.rotation.x = Math.PI / 2;
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
    audio.enemyLaser();
  }

  _droneFire(drone, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.laserGeom, this.droneLaserMat);
    mesh.position.copy(drone.group.position);
    mesh.position.y += 0.1;

    // Lead player velocity slightly
    const dx = (player.position.x + player.velocity.x * 0.25) - mesh.position.x;
    const dz = (player.position.z + player.velocity.z * 0.25) - mesh.position.z;
    const aimHeading = Math.atan2(dx, dz);
    mesh.rotation.y = aimHeading;

    const speed = drone.type === 'gunship' ? 140 : 130;
    const damage = drone.type === 'gunship' ? 12 : 8;

    this.enemyLasers.push({
      mesh,
      vx: Math.sin(aimHeading) * speed,
      vz: Math.cos(aimHeading) * speed,
      life: 2.2,
      damage
    });
    this.scene.add(mesh);
    audio.enemyLaser();
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
      } else {
        this._destroyDrone(target, particles, audio);
      }
    }
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

    this.scene.remove(drone.group);
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
   * Calculates Target Tracking & Predictive Dogfight Lead Pip
   */
  getTargetTrackingInfo(player, camera, canvasWidth, canvasHeight) {
    const THREE = this.THREE;
    const candidates = [];

    if (this.boss && !this.boss.isDestroying) {
      candidates.push({ ...this.boss, isBoss: true });
    }
    this.drones.forEach(d => candidates.push({ ...d, isBoss: false }));

    if (candidates.length === 0) return null;

    // Find closest target in front of player
    let bestTarget = null;
    let minDist = Infinity;

    const pPos = player.position;
    const pHeadingVec = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));

    candidates.forEach(c => {
      const cPos = c.group.position;
      const toVec = new THREE.Vector3().subVectors(cPos, pPos);
      const dist = toVec.length();

      // Dot product to check if candidate is in front
      const forwardDot = toVec.clone().normalize().dot(pHeadingVec);
      const score = dist - forwardDot * 60;

      if (score < minDist) {
        minDist = score;
        bestTarget = { candidate: c, dist };
      }
    });

    if (!bestTarget) return null;

    const target = bestTarget.candidate;
    const tPos = target.group.position.clone();

    // Screen Space Projection of Target
    const screenPos = tPos.clone().project(camera);
    const sx = (screenPos.x * 0.5 + 0.5) * canvasWidth;
    const sy = (-screenPos.y * 0.5 + 0.5) * canvasHeight;

    // Calculate Dogfight Lead Pip (Where to aim)
    const laserSpeed = 210;
    const timeToHit = bestTarget.dist / laserSpeed;
    const leadWorldPos = tPos.clone();
    leadWorldPos.x += (target.vx || 0) * timeToHit;
    leadWorldPos.z += (target.vz || 0) * timeToHit;

    const leadScreenPos = leadWorldPos.clone().project(camera);
    const lx = (leadScreenPos.x * 0.5 + 0.5) * canvasWidth;
    const ly = (-leadScreenPos.y * 0.5 + 0.5) * canvasHeight;

    return {
      target,
      screenX: sx,
      screenY: sy,
      leadScreenX: lx,
      leadScreenY: ly,
      distance: Math.round(bestTarget.dist),
      inFront: screenPos.z < 1.0,
      isLocked: bestTarget.dist < 180
    };
  }

  clearAll() {
    this.drones.forEach(d => this.scene.remove(d.group));
    this.drones = [];

    if (this.boss) {
      this.scene.remove(this.boss.group);
      this.boss = null;
    }

    this.enemyLasers.forEach(l => this.scene.remove(l.mesh));
    this.enemyLasers = [];

    this.enemyMissiles.forEach(m => this.scene.remove(m.mesh));
    this.enemyMissiles = [];

    this.playerMissiles.forEach(pm => this.scene.remove(pm.mesh));
    this.playerMissiles = [];

    this.powerups.forEach(p => this.scene.remove(p.group));
    this.powerups = [];
  }
}
