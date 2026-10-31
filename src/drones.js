/**
 * Enemy Drone AI & Dynamic Spawner
 * Spawns Scout, Assault, and Interceptor drones in tactical waves.
 * Features smart spatial AI, weapons, health, and clean target tracking.
 */
export class DroneManager {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;

    this.drones = [];
    this.enemyLasers = [];
    this.laserGeom = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8);
    this.laserGeom.rotateX(Math.PI / 2);

    this.droneLaserMat = new THREE.MeshBasicMaterial({
      color: 0xff2244,
      transparent: true,
      opacity: 0.95
    });

    // Drone Materials
    this.droneArmorMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      metalness: 0.85,
      roughness: 0.35
    });

    this.crimsonGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff1744,
      emissiveIntensity: 3.0,
      roughness: 0.2
    });

    this.amberGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff9100,
      emissive: 0xff9100,
      emissiveIntensity: 3.0,
      roughness: 0.2
    });
  }

  spawnWave(sectorNumber, playerPos) {
    // Clear old drones if any
    this.clearAll();

    // Scale wave composition with Sector Number
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
      speed = 38;
      fireRate = 1.8;
      points = 150;
      radius = 1.8;

      // Delta Wing Scout Model
      const wingGeom = new THREE.ConeGeometry(1.6, 2.4, 3);
      wingGeom.rotateX(Math.PI / 2);
      wingGeom.rotateY(Math.PI);
      const wing = new THREE.Mesh(wingGeom, this.droneArmorMat);
      group.add(wing);

      // Red Core Sensor Eye
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), this.crimsonGlowMat);
      eye.position.set(0, 0.12, 0.8);
      group.add(eye);

      // Wingtip Lasers
      [-0.8, 0.8].forEach(side => {
        const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.2), this.crimsonGlowMat);
        gun.position.set(side, 0, 0.2);
        group.add(gun);
      });
    } else if (type === 'assault') {
      name = 'ASSAULT CRUISER';
      hp = maxHp = 7;
      speed = 24;
      fireRate = 2.4;
      points = 400;
      radius = 3.2;

      // Hexagonal Gunship
      const hullGeom = new THREE.CylinderGeometry(2.2, 2.6, 0.9, 6);
      hullGeom.rotateX(Math.PI / 2);
      const hull = new THREE.Mesh(hullGeom, this.droneArmorMat);
      group.add(hull);

      // Heavy Armor Plates
      const armorPlate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 3.2), this.droneArmorMat);
      armorPlate.position.set(0, 0.2, 0);
      group.add(armorPlate);

      // Dual Heavy Plasma Cannons
      [-1.2, 1.2].forEach(side => {
        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.4, 8), this.crimsonGlowMat);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(side, -0.1, 1.4);
        group.add(cannon);
      });
    } else {
      // Interceptor
      name = 'SEEKER INTERCEPTOR';
      hp = maxHp = 3;
      speed = 52;
      fireRate = 1.3;
      points = 250;
      radius = 1.6;

      // Dart Wing
      const dartGeom = new THREE.ConeGeometry(0.9, 3.2, 4);
      dartGeom.rotateX(Math.PI / 2);
      const dart = new THREE.Mesh(dartGeom, this.droneArmorMat);
      group.add(dart);

      const glowFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 1.8), this.amberGlowMat);
      glowFin.position.set(0, 0.4, -0.4);
      group.add(glowFin);
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
      strafeAngle: Math.random() * Math.PI * 2,
      strafeTimer: 0
    });
  }

  update(dt, player, time, audio) {
    const THREE = this.THREE;

    // 1. UPDATE DRONE BEHAVIOR & AI
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const drone = this.drones[i];
      const dx = player.position.x - drone.group.position.x;
      const dz = player.position.z - drone.group.position.z;
      const dist = Math.hypot(dx, dz);

      // Calculate Target Angle toward player
      const angleToPlayer = Math.atan2(dx, dz);

      // Smooth turning towards player
      let angleDiff = Math.atan2(Math.sin(angleToPlayer - drone.heading), Math.cos(angleToPlayer - drone.heading));
      drone.heading += angleDiff * Math.min(1.0, 4.0 * dt);
      drone.group.rotation.y = drone.heading;

      // Flight Movement Logic based on Drone Type
      let forwardMove = 0;
      let strafeMove = 0;

      if (drone.type === 'scout') {
        // Scout maintains optimal engagement distance (40-75 units) while strafing
        if (dist > 75) {
          forwardMove = drone.speed;
        } else if (dist < 40) {
          forwardMove = -drone.speed * 0.6;
        } else {
          forwardMove = drone.speed * 0.2;
        }
        strafeMove = Math.sin(time * 1.5 + drone.strafeAngle) * drone.speed * 0.65;
      } else if (drone.type === 'assault') {
        // Assault moves slowly and steadily, suppressing with firepower
        if (dist > 60) forwardMove = drone.speed;
        else forwardMove = Math.sin(time) * 6;
      } else {
        // Interceptor aggressively closes distance
        forwardMove = drone.speed;
        strafeMove = Math.sin(time * 3.0) * 12;
      }

      // Compute World Velocities
      const cosH = Math.cos(drone.heading);
      const sinH = Math.sin(drone.heading);

      const vx = sinH * forwardMove + cosH * strafeMove;
      const vz = cosH * forwardMove - sinH * strafeMove;

      drone.group.position.x += vx * dt;
      drone.group.position.z += vz * dt;

      // Natural Banking roll
      drone.group.rotation.z = -strafeMove * 0.02;

      // Weapon Firing Logic
      if (dist < 140 && (time - drone.lastFireTime >= drone.fireRate)) {
        // Check if roughly facing player (within 35 degrees)
        if (Math.abs(angleDiff) < 0.6) {
          drone.lastFireTime = time;
          this._droneFire(drone, player, audio);
        }
      }
    }

    // 2. UPDATE ENEMY LASER PROJECTILES
    for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
      const laser = this.enemyLasers[i];
      laser.mesh.position.x += laser.vx * dt;
      laser.mesh.position.z += laser.vz * dt;
      laser.life -= dt;

      // Check collision with Player Starfighter
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
  }

  _droneFire(drone, player, audio) {
    const THREE = this.THREE;
    const mesh = new THREE.Mesh(this.laserGeom, this.droneLaserMat);
    mesh.position.copy(drone.group.position);
    mesh.position.y = 0;
    mesh.rotation.y = drone.heading;

    // Laser velocity towards player
    const speed = 120;
    const vx = Math.sin(drone.heading) * speed;
    const vz = Math.cos(drone.heading) * speed;

    this.scene.add(mesh);
    this.enemyLasers.push({
      mesh,
      vx,
      vz,
      damage: drone.type === 'assault' ? 18 : 10,
      life: 2.2
    });

    audio.enemyShoot();
  }

  checkPlayerLaserCollisions(laser, damage, particles, audio) {
    for (let i = 0; i < this.drones.length; i++) {
      const drone = this.drones[i];
      const dx = laser.position.x - drone.group.position.x;
      const dz = laser.position.z - drone.group.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < drone.radius * drone.radius) {
        drone.hp -= damage;
        particles.createSparks(drone.group.position, 8, 0xff2244);

        if (drone.hp <= 0) {
          // Drone Destroyed!
          const pos = drone.group.position.clone();
          const points = drone.points;
          const name = drone.name;

          particles.createShipExplosion(pos, drone.type === 'assault');
          audio.explode(true);

          this.scene.remove(drone.group);
          this.drones.splice(i, 1);

          return { hit: true, destroyed: true, points, name, pos };
        } else {
          audio.hit();
          return { hit: true, destroyed: false };
        }
      }
    }
    return { hit: false };
  }

  getTargetTrackingInfo(player, camera, canvasWidth, canvasHeight) {
    // Find closest and most centered enemy drone in front of player
    let bestTarget = null;
    let minScore = Infinity;

    const targets = [];

    this.drones.forEach(drone => {
      const dx = drone.group.position.x - player.position.x;
      const dz = drone.group.position.z - player.position.z;
      const dist = Math.hypot(dx, dz);

      // Angle relative to player heading
      const angleToDrone = Math.atan2(dx, dz);
      const angleDiff = Math.abs(Math.atan2(Math.sin(angleToDrone - player.heading), Math.cos(angleToDrone - player.heading)));

      // Score: distance + forward angle penalty
      const trackingScore = dist + angleDiff * 50;

      // Project 3D position to 2D Screen Coordinates
      const screenPos = drone.group.position.clone();
      screenPos.project(camera);

      const isBehind = screenPos.z > 1;
      const screenX = (screenPos.x * 0.5 + 0.5) * canvasWidth;
      const screenY = (-screenPos.y * 0.5 + 0.5) * canvasHeight;

      const targetData = {
        drone,
        name: drone.name,
        dist: Math.round(dist),
        hpRatio: drone.hp / drone.maxHp,
        screenX,
        screenY,
        isBehind,
        isInView: !isBehind && screenX >= 0 && screenX <= canvasWidth && screenY >= 0 && screenY <= canvasHeight
      };

      targets.push(targetData);

      if (trackingScore < minScore && !isBehind) {
        minScore = trackingScore;
        bestTarget = targetData;
      }
    });

    return { primaryTarget: bestTarget, allTargets: targets, remainingDrones: this.drones.length };
  }

  clearAll() {
    this.drones.forEach(d => {
      this.scene.remove(d.group);
    });
    this.drones = [];

    this.enemyLasers.forEach(l => {
      this.scene.remove(l.mesh);
    });
    this.enemyLasers = [];
  }
}
