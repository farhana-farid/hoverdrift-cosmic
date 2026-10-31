/**
 * Advanced Drone AI, Dynamic Wave Spawner & Epic Boss Battles
 * Features Scout, Assault, and Interceptor drones, plus multi-stage Capital Bosses
 * and holographic power-up drops (Shield Overcharge, Weapon Upgrades, Overdrive Cores).
 */
export class DroneManager {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;

    this.drones = [];
    this.boss = null;
    this.enemyLasers = [];
    this.enemyMissiles = [];
    this.powerups = [];

    // Shared Geometries & Materials
    this.laserGeom = new THREE.CylinderGeometry(0.14, 0.14, 2.0, 8);
    this.laserGeom.rotateX(Math.PI / 2);

    this.droneLaserMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.95
    });

    this.bossLaserMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.98
    });

    this.missileGeom = new THREE.ConeGeometry(0.35, 1.4, 8);
    this.missileGeom.rotateX(Math.PI / 2);
    this.missileMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff5500,
      emissiveIntensity: 3.0
    });

    // Drone Materials
    this.droneArmorMat = new THREE.MeshStandardMaterial({
      color: 0x161a22,
      metalness: 0.88,
      roughness: 0.32
    });

    this.crimsonGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff1744,
      emissiveIntensity: 3.2,
      roughness: 0.2
    });

    this.bossArmorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f16,
      metalness: 0.94,
      roughness: 0.26,
      envMapIntensity: 1.4
    });

    this.bossCoreMat = new THREE.MeshStandardMaterial({
      color: 0x9400d3,
      emissive: 0xbf00ff,
      emissiveIntensity: 4.5,
      roughness: 0.1
    });

    // Power-up geometries
    this.powerupGeom = new THREE.OctahedronGeometry(1.2, 0);
    this.powerupRingGeom = new THREE.TorusGeometry(1.6, 0.08, 8, 24);
  }

  spawnWave(sectorNumber, playerPos) {
    this.clearAll();

    // Every 3rd Sector is an EPIC CAPITAL SHIP BOSS BATTLE!
    const isBossSector = (sectorNumber % 3 === 0);

    if (isBossSector) {
      this._spawnBoss(sectorNumber, playerPos);
      // Spawn light escort squadron
      for (let i = 0; i < 2; i++) {
        this._createDrone('scout', playerPos, i * Math.PI);
      }
    } else {
      // Dynamic standard wave
      const scoutCount = 3 + sectorNumber * 2;
      const assaultCount = Math.floor(sectorNumber / 2);
      const interceptorCount = Math.max(0, sectorNumber - 1);

      for (let i = 0; i < scoutCount; i++) {
        this._createDrone('scout', playerPos, i * (Math.PI * 2 / scoutCount));
      }
      for (let i = 0; i < assaultCount; i++) {
        this._createDrone('assault', playerPos, (i + 0.5) * (Math.PI * 2 / assaultCount));
      }
      for (let i = 0; i < interceptorCount; i++) {
        this._createDrone('interceptor', playerPos, Math.random() * Math.PI * 2);
      }
    }
  }

  _spawnBoss(sectorNumber, playerPos) {
    const THREE = this.THREE;
    const bossName = sectorNumber >= 6 ? 'VOID OMEGA CRUCIBLE' : 'LEVIATHAN DREADNOUGHT';
    const maxHp = sectorNumber >= 6 ? 90 : 55;
    const maxShield = sectorNumber >= 6 ? 60 : 40;

    const spawnDist = 240;
    const angle = Math.random() * Math.PI * 2;
    const x = playerPos.x + Math.sin(angle) * spawnDist;
    const z = playerPos.z + Math.cos(angle) * spawnDist;

    const group = new THREE.Group();

    // 1. Massive Capital Ship Core Superstructure
    const coreHull = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.2, 28.0), this.bossArmorMat);
    coreHull.castShadow = true;
    group.add(coreHull);

    // Elevated command bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.2, 8.5), this.bossArmorMat);
    bridge.position.set(0, 2.4, -4.0);
    group.add(bridge);

    // Glowing alien hyper-matter core
    const coreReactor = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 16), this.bossCoreMat);
    coreReactor.position.set(0, 0.4, 2.0);
    group.add(coreReactor);

    // 2. Outrigger Heavy Sponsons with Dual Weapon Batteries
    [-5.8, 5.8].forEach(side => {
      const sponson = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 22.0), this.bossArmorMat);
      sponson.position.set(side, 0, -1.0);
      group.add(sponson);

      // Heavy Cannon Barrels
      [-4.0, 4.0].forEach(zOff => {
        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 4.8, 8), this.crimsonGlowMat);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(side * 1.15, -0.2, zOff);
        group.add(cannon);
      });

      // Lateral glowing crimson conduits
      const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 18.0), this.crimsonGlowMat);
      conduit.position.set(side * 1.25, 0.8, -1.0);
      group.add(conduit);
    });

    // 3. Reactive Boss Shield Mesh
    const bossShieldGeom = new THREE.IcosahedronGeometry(18.0, 2);
    const bossShieldMat = new THREE.MeshBasicMaterial({
      color: 0xbf00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const bossShield = new THREE.Mesh(bossShieldGeom, bossShieldMat);
    bossShield.scale.set(1.1, 0.45, 1.3);
    group.add(bossShield);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.boss = {
      name: bossName,
      group,
      shieldMesh: bossShield,
      hp: maxHp,
      maxHp,
      shield: maxShield,
      maxShield,
      speed: 16,
      heading: angle + Math.PI,
      radius: 14.0,
      lastFireTime: 0,
      fireRate: 1.2,
      lastMissileTime: 0,
      missileRate: 4.8,
      points: 8000
    };
  }

  _createDrone(type, playerPos, angle) {
    const THREE = this.THREE;
    const spawnDist = 180 + Math.random() * 80;
    const x = playerPos.x + Math.sin(angle) * spawnDist;
    const z = playerPos.z + Math.cos(angle) * spawnDist;

    const group = new THREE.Group();
    let hp, maxHp, speed, fireRate, points, radius, name;

    if (type === 'scout') {
      name = 'SCOUT DRONE';
      hp = maxHp = 2;
      speed = 42;
      fireRate = 1.6;
      points = 150;
      radius = 2.0;

      const wingGeom = new THREE.ConeGeometry(1.8, 2.8, 3);
      wingGeom.rotateX(Math.PI / 2);
      wingGeom.rotateY(Math.PI);
      const wing = new THREE.Mesh(wingGeom, this.droneArmorMat);
      group.add(wing);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), this.crimsonGlowMat);
      eye.position.set(0, 0.15, 0.9);
      group.add(eye);
    } else if (type === 'assault') {
      name = 'ASSAULT CRUISER';
      hp = maxHp = 8;
      speed = 26;
      fireRate = 2.2;
      points = 450;
      radius = 3.6;

      const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.1, 6), this.droneArmorMat);
      hull.rotation.x = Math.PI / 2;
      group.add(hull);

      const gunL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.6, 8), this.crimsonGlowMat);
      gunL.rotation.x = Math.PI / 2;
      gunL.position.set(-1.4, 0, 1.4);
      group.add(gunL);

      const gunR = gunL.clone();
      gunR.position.x = 1.4;
      group.add(gunR);
    } else {
      name = 'SEEKER INTERCEPTOR';
      hp = maxHp = 4;
      speed = 54;
      fireRate = 1.4;
      points = 280;
      radius = 1.8;

      const dart = new THREE.Mesh(new THREE.ConeGeometry(1.0, 3.6, 4), this.droneArmorMat);
      dart.rotation.x = Math.PI / 2;
      group.add(dart);

      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 2.0), this.crimsonGlowMat);
      fin.position.set(0, 0.45, -0.4);
      group.add(fin);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.drones.push({
      type,
      name,
      group,
      hp,
      maxHp,
      speed,
      fireRate,
      lastFireTime: Math.random() * fireRate,
      points,
      radius,
      heading: angle + Math.PI,
      strafeAngle: Math.random() * Math.PI * 2
    });
  }

  update(dt, player, time, audio) {
    const THREE = this.THREE;

    // 1. UPDATE BOSS (if active)
    if (this.boss) {
      const b = this.boss;
      const dx = player.position.x - b.group.position.x;
      const dz = player.position.z - b.group.position.z;
      const dist = Math.hypot(dx, dz);

      // Smooth turning towards player
      const angleToPlayer = Math.atan2(dx, dz);
      let angleDiff = Math.atan2(Math.sin(angleToPlayer - b.heading), Math.cos(angleToPlayer - b.heading));
      b.heading += angleDiff * Math.min(1.0, 1.2 * dt);
      b.group.rotation.y = b.heading;

      // Slow deliberate pursuit
      if (dist > 80) {
        b.group.position.x += Math.sin(b.heading) * b.speed * dt;
        b.group.position.z += Math.cos(b.heading) * b.speed * dt;
      }

      // Update Shield Mesh Opacity
      if (b.shieldMesh) {
        b.shieldMesh.material.opacity = (b.shield > 0) ? (0.35 + Math.sin(time * 4) * 0.15) : 0;
      }

      // Boss Weapon Battery Volley
      if (dist < 220 && (time - b.lastFireTime >= b.fireRate)) {
        b.lastFireTime = time;
        this._bossFire(b, player, audio);
      }

      // Boss Homing Seeker Missiles
      if (dist < 250 && (time - b.lastMissileTime >= b.missileRate)) {
        b.lastMissileTime = time;
        this._bossLaunchMissile(b, player, audio);
      }
    }

    // 2. UPDATE STANDARD DRONES
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const drone = this.drones[i];
      const dx = player.position.x - drone.group.position.x;
      const dz = player.position.z - drone.group.position.z;
      const dist = Math.hypot(dx, dz);

      const angleToPlayer = Math.atan2(dx, dz);
      let angleDiff = Math.atan2(Math.sin(angleToPlayer - drone.heading), Math.cos(angleToPlayer - drone.heading));
      drone.heading += angleDiff * Math.min(1.0, 4.0 * dt);
      drone.group.rotation.y = drone.heading;

      let forwardMove = 0;
      let strafeMove = 0;

      if (drone.type === 'scout') {
        if (dist > 75) forwardMove = drone.speed;
        else if (dist < 40) forwardMove = -drone.speed * 0.6;
        else forwardMove = drone.speed * 0.2;
        strafeMove = Math.sin(time * 1.5 + drone.strafeAngle) * drone.speed * 0.65;
      } else if (drone.type === 'assault') {
        if (dist > 60) forwardMove = drone.speed;
        else forwardMove = Math.sin(time) * 8;
      } else {
        forwardMove = drone.speed;
        strafeMove = Math.sin(time * 3.0) * 14;
      }

      const cosH = Math.cos(drone.heading);
      const sinH = Math.sin(drone.heading);
      drone.group.position.x += (sinH * forwardMove + cosH * strafeMove) * dt;
      drone.group.position.z += (cosH * forwardMove - sinH * strafeMove) * dt;
      drone.group.rotation.z = -strafeMove * 0.02;

      if (dist < 150 && (time - drone.lastFireTime >= drone.fireRate)) {
        if (Math.abs(angleDiff) < 0.6) {
          drone.lastFireTime = time;
          this._droneFire(drone, player, audio);
        }
      }
    }

    // 3. UPDATE HOMING MISSILES
    for (let i = this.enemyMissiles.length - 1; i >= 0; i--) {
      const m = this.enemyMissiles[i];
      m.life -= dt;

      // Homing tracking towards player
      const dx = player.position.x - m.mesh.position.x;
      const dz = player.position.z - m.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = Math.atan2(Math.sin(targetAngle - m.heading), Math.cos(targetAngle - m.heading));
      m.heading += angleDiff * Math.min(1.0, 3.2 * dt);

      m.mesh.rotation.y = m.heading;
      const speed = 75;
      m.mesh.position.x += Math.sin(m.heading) * speed * dt;
      m.mesh.position.z += Math.cos(m.heading) * speed * dt;

      // Hit Player
      if (dist < 3.2) {
        player.takeDamage(m.damage, time);
        audio.explode(false);
        this.scene.remove(m.mesh);
        this.enemyMissiles.splice(i, 1);
        continue;
      }

      if (m.life <= 0) {
        this.scene.remove(m.mesh);
        this.enemyMissiles.splice(i, 1);
      }
    }

    // 4. UPDATE ENEMY LASER PROJECTILES
    for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
      const laser = this.enemyLasers[i];
      laser.mesh.position.x += laser.vx * dt;
      laser.mesh.position.z += laser.vz * dt;
      laser.life -= dt;

      const pDx = player.position.x - laser.mesh.position.x;
      const pDz = player.position.z - laser.mesh.position.z;
      if (Math.hypot(pDx, pDz) < 2.5) {
        player.takeDamage(laser.damage, time);
        audio.shieldHit();

        this.scene.remove(laser.mesh);
        this.enemyLasers.splice(i, 1);
        continue;
      }

      if (laser.life <= 0) {
        this.scene.remove(laser.mesh);
        this.enemyLasers.splice(i, 1);
      }
    }

    // 5. UPDATE HOLOGRAPHIC POWER-UP PICKUPS
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.life -= dt;
      p.group.rotation.y += 2.8 * dt;
      p.group.rotation.x += 1.4 * dt;

      // Magnetize towards player if within 42m
      const dx = player.position.x - p.group.position.x;
      const dz = player.position.z - p.group.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 42) {
        const pull = 50 * (1 - dist / 42);
        p.group.position.x += (dx / dist) * pull * dt;
        p.group.position.z += (dz / dist) * pull * dt;
      }

      // Collect Power-up
      if (dist < 4.0) {
        this._applyPowerup(p.type, player, audio);
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
    // Quad broadside plasma volley
    [-3.5, -1.2, 1.2, 3.5].forEach(offset => {
      const mesh = new THREE.Mesh(this.laserGeom, this.bossLaserMat);
      mesh.scale.set(1.6, 1.6, 1.6);
      mesh.position.copy(boss.group.position);
      mesh.position.x += Math.cos(boss.heading) * offset;
      mesh.position.z -= Math.sin(boss.heading) * offset;
      mesh.rotation.y = boss.heading;

      const speed = 135;
      this.scene.add(mesh);
      this.enemyLasers.push({
        mesh,
        vx: Math.sin(boss.heading) * speed,
        vz: Math.cos(boss.heading) * speed,
        damage: 18,
        life: 2.5
      });
    });
    audio.enemyShoot();
  }

  _bossLaunchMissile(boss, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.missileGeom, this.missileMat);
    mesh.position.copy(boss.group.position);
    mesh.position.y = 1.0;
    mesh.rotation.y = boss.heading;

    this.scene.add(mesh);
    this.enemyMissiles.push({
      mesh,
      heading: boss.heading,
      damage: 28,
      life: 7.0
    });
    audio.waveAlert();
  }

  _droneFire(drone, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.laserGeom, this.droneLaserMat);
    mesh.position.copy(drone.group.position);
    mesh.rotation.y = drone.heading;

    const speed = 125;
    this.scene.add(mesh);
    this.enemyLasers.push({
      mesh,
      vx: Math.sin(drone.heading) * speed,
      vz: Math.cos(drone.heading) * speed,
      damage: drone.type === 'assault' ? 16 : 10,
      life: 2.2
    });
    audio.enemyShoot();
  }

  checkPlayerLaserCollisions(laser, damage, particles, audio) {
    // 1. Check against Capital Boss
    if (this.boss) {
      const b = this.boss;
      const dx = laser.position.x - b.group.position.x;
      const dz = laser.position.z - b.group.position.z;
      if (Math.hypot(dx, dz) < b.radius) {
        // Damage Shield first
        if (b.shield > 0) {
          b.shield -= damage;
          particles.createSparks(laser.position, 10, 0xbf00ff);
          audio.shieldHit();
        } else {
          b.hp -= damage;
          particles.createSparks(laser.position, 12, 0xff0055);
          audio.hit();
        }

        if (b.hp <= 0) {
          // Boss Destroyed!
          const pos = b.group.position.clone();
          const points = b.points;
          const name = b.name;

          particles.createShipExplosion(pos, true);
          audio.explode(true);

          // Drop massive power-up cache
          this._spawnPowerup(pos, 'shield_boost');
          this._spawnPowerup(pos, 'weapon_upgrade');
          this._spawnPowerup(pos, 'overdrive');

          this.scene.remove(b.group);
          this.boss = null;
          return { hit: true, destroyed: true, isBoss: true, points, name, pos };
        }
        return { hit: true, destroyed: false, isBoss: true };
      }
    }

    // 2. Check against Standard Drones
    for (let i = 0; i < this.drones.length; i++) {
      const drone = this.drones[i];
      const dx = laser.position.x - drone.group.position.x;
      const dz = laser.position.z - drone.group.position.z;

      if (dx * dx + dz * dz < drone.radius * drone.radius) {
        drone.hp -= damage;
        particles.createSparks(drone.group.position, 8, 0xff1744);

        if (drone.hp <= 0) {
          const pos = drone.group.position.clone();
          const points = drone.points;
          const name = drone.name;

          particles.createShipExplosion(pos, drone.type === 'assault');
          audio.explode(true);

          // Chance to drop powerup (35%)
          if (Math.random() < 0.35) {
            const types = ['shield_boost', 'weapon_upgrade', 'overdrive'];
            this._spawnPowerup(pos, types[Math.floor(Math.random() * types.length)]);
          }

          this.scene.remove(drone.group);
          this.drones.splice(i, 1);

          return { hit: true, destroyed: true, isBoss: false, points, name, pos };
        } else {
          audio.hit();
          return { hit: true, destroyed: false };
        }
      }
    }
    return { hit: false };
  }

  _spawnPowerup(pos, type) {
    const THREE = this.THREE;
    const group = new THREE.Group();

    let color = 0x5cff9d;
    if (type === 'weapon_upgrade') color = 0xffc247;
    if (type === 'overdrive') color = 0x3ef0ff;

    const core = new THREE.Mesh(this.powerupGeom, new THREE.MeshBasicMaterial({ color }));
    group.add(core);

    const ring = new THREE.Mesh(this.powerupRingGeom, new THREE.MeshBasicMaterial({ color, wireframe: true }));
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.copy(pos);
    group.position.x += (Math.random() - 0.5) * 6;
    group.position.z += (Math.random() - 0.5) * 6;

    this.scene.add(group);
    this.powerups.push({ group, type, life: 25.0 });
  }

  _applyPowerup(type, player, audio) {
    audio.pickup(type);
    if (type === 'shield_boost') {
      player.applyOvercharge();
    } else if (type === 'weapon_upgrade') {
      player.upgradeWeapons();
    } else if (type === 'overdrive') {
      player.energy = player.maxEnergy;
      player.isBoosting = true;
    }
  }

  getTargetTrackingInfo(player, camera, canvasWidth, canvasHeight) {
    let bestTarget = null;
    let minScore = Infinity;
    const targets = [];

    // Boss target priority
    if (this.boss) {
      const b = this.boss;
      const dx = b.group.position.x - player.position.x;
      const dz = b.group.position.z - player.position.z;
      const dist = Math.hypot(dx, dz);

      const screenPos = b.group.position.clone();
      screenPos.project(camera);
      const isBehind = screenPos.z > 1;
      const screenX = (screenPos.x * 0.5 + 0.5) * canvasWidth;
      const screenY = (-screenPos.y * 0.5 + 0.5) * canvasHeight;

      const bossTarget = {
        name: b.name,
        dist: Math.round(dist),
        hpRatio: b.hp / b.maxHp,
        shieldRatio: b.shield / b.maxShield,
        screenX,
        screenY,
        isBehind,
        isInView: !isBehind && screenX >= 0 && screenX <= canvasWidth && screenY >= 0 && screenY <= canvasHeight,
        isBoss: true
      };
      targets.push(bossTarget);
      bestTarget = bossTarget;
    }

    this.drones.forEach(drone => {
      const dx = drone.group.position.x - player.position.x;
      const dz = drone.group.position.z - player.position.z;
      const dist = Math.hypot(dx, dz);

      const angleToDrone = Math.atan2(dx, dz);
      const angleDiff = Math.abs(Math.atan2(Math.sin(angleToDrone - player.heading), Math.cos(angleToDrone - player.heading)));
      const trackingScore = dist + angleDiff * 50;

      const screenPos = drone.group.position.clone();
      screenPos.project(camera);
      const isBehind = screenPos.z > 1;
      const screenX = (screenPos.x * 0.5 + 0.5) * canvasWidth;
      const screenY = (-screenPos.y * 0.5 + 0.5) * canvasHeight;

      const targetData = {
        name: drone.name,
        dist: Math.round(dist),
        hpRatio: drone.hp / drone.maxHp,
        screenX,
        screenY,
        isBehind,
        isInView: !isBehind && screenX >= 0 && screenX <= canvasWidth && screenY >= 0 && screenY <= canvasHeight,
        isBoss: false
      };
      targets.push(targetData);

      if (!this.boss && trackingScore < minScore && !isBehind) {
        minScore = trackingScore;
        bestTarget = targetData;
      }
    });

    const activeCount = (this.boss ? 1 : 0) + this.drones.length;
    return {
      primaryTarget: bestTarget,
      allTargets: targets,
      remainingDrones: activeCount,
      bossData: this.boss ? { name: this.boss.name, hp: this.boss.hp, maxHp: this.boss.maxHp, shield: this.boss.shield, maxShield: this.boss.maxShield } : null
    };
  }

  clearAll() {
    if (this.boss) {
      this.scene.remove(this.boss.group);
      this.boss = null;
    }
    this.drones.forEach(d => this.scene.remove(d.group));
    this.drones = [];

    this.enemyLasers.forEach(l => this.scene.remove(l.mesh));
    this.enemyLasers = [];

    this.enemyMissiles.forEach(m => this.scene.remove(m.mesh));
    this.enemyMissiles = [];

    this.powerups.forEach(p => this.scene.remove(p.group));
    this.powerups = [];
  }
}
