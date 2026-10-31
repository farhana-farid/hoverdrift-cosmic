/**
 * Boundless Drifting Asteroid Field & Destructible Space Rocks
 * Generates procedural tumbling asteroids across an infinite cosmic expanse.
 * Asteroids can be shattered by lasers, dropping collectible mineral/energy crystals.
 */
export class AsteroidManager {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;

    this.asteroids = [];
    this.minerals = [];
    this.maxAsteroids = 45;
    this.spawnRadius = 420;
    this.despawnRadius = 520;

    // Shared Materials
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x3d4350,
      roughness: 0.88,
      metalness: 0.18,
      flatShading: true
    });

    this.mineralMat = new THREE.MeshStandardMaterial({
      color: 0x3d4b5c,
      roughness: 0.75,
      metalness: 0.45,
      flatShading: true
    });

    this.crystalGeom = new THREE.OctahedronGeometry(0.8, 0);

    this.crystalMats = {
      score: new THREE.MeshBasicMaterial({
        color: 0xffc247,
        wireframe: false
      }),
      shield: new THREE.MeshBasicMaterial({
        color: 0x5cff9d,
        wireframe: false
      }),
      energy: new THREE.MeshBasicMaterial({
        color: 0x3ef0ff,
        wireframe: false
      })
    };
  }

  init(playerPos) {
    for (let i = 0; i < this.maxAsteroids; i++) {
      this._spawnAsteroid(playerPos, true);
    }
  }

  _createAsteroidGeometry(radius) {
    const THREE = this.THREE;
    // Displace vertices on an icosahedron to generate unique jagged asteroid shapes
    const geom = new THREE.IcosahedronGeometry(radius, 1);
    const pos = geom.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      // Pseudo-random crater displacement
      const noise = (Math.sin(vertex.x * 2.1) + Math.cos(vertex.y * 1.8) + Math.sin(vertex.z * 2.4)) * 0.18;
      const scale = 1.0 + noise + (Math.random() - 0.5) * 0.22;
      vertex.multiplyScalar(scale);
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();
    return geom;
  }

  _spawnAsteroid(playerPos, initial = false) {
    const THREE = this.THREE;

    // Determine position: full 360-degree distribution
    let angle = Math.random() * Math.PI * 2;
    let dist = initial
      ? 50 + Math.random() * (this.spawnRadius - 50)
      : this.spawnRadius * (0.85 + Math.random() * 0.3);

    const x = playerPos.x + Math.sin(angle) * dist;
    const z = playerPos.z + Math.cos(angle) * dist;
    const y = (Math.random() - 0.5) * 45; // Gentle cosmic depth variation

    // Determine Size Tier: Large (9-14m), Medium (5-8m), Small (2.5-4m)
    const tierRoll = Math.random();
    let radius, maxHp, points;
    if (tierRoll > 0.65) {
      radius = 9 + Math.random() * 5;
      maxHp = 6;
      points = 250;
    } else if (tierRoll > 0.25) {
      radius = 5 + Math.random() * 3.5;
      maxHp = 3;
      points = 150;
    } else {
      radius = 2.5 + Math.random() * 2;
      maxHp = 1;
      points = 80;
    }

    const geom = this._createAsteroidGeometry(radius);
    const mat = (Math.random() > 0.3) ? this.rockMat : this.mineralMat;
    const mesh = new THREE.Mesh(geom, mat);

    mesh.position.set(x, y, z);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.add(mesh);

    // Drifting velocity and tumble
    const driftSpeed = 1.5 + Math.random() * 3.5;
    const driftAngle = Math.random() * Math.PI * 2;

    this.asteroids.push({
      mesh,
      radius,
      hp: maxHp,
      maxHp,
      points,
      vx: Math.sin(driftAngle) * driftSpeed,
      vy: (Math.random() - 0.5) * 0.5,
      vz: Math.cos(driftAngle) * driftSpeed,
      rotX: (Math.random() - 0.5) * 0.4,
      rotY: (Math.random() - 0.5) * 0.5,
      rotZ: (Math.random() - 0.5) * 0.3
    });
  }

  update(dt, playerPos, onAsteroidDestroyed) {
    const THREE = this.THREE;

    // 1. UPDATE ASTEROIDS
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.mesh.position.x += ast.vx * dt;
      ast.mesh.position.y += ast.vy * dt;
      ast.mesh.position.z += ast.vz * dt;

      ast.mesh.rotation.x += ast.rotX * dt;
      ast.mesh.rotation.y += ast.rotY * dt;
      ast.mesh.rotation.z += ast.rotZ * dt;

      // Boundless Streaming: If an asteroid drifts too far, recycle it ahead of the player
      const distToPlayer = Math.hypot(ast.mesh.position.x - playerPos.x, ast.mesh.position.z - playerPos.z);
      if (distToPlayer > this.despawnRadius) {
        this.scene.remove(ast.mesh);
        ast.mesh.geometry.dispose();
        this.asteroids.splice(i, 1);
        this._spawnAsteroid(playerPos, false);
      }
    }

    // Keep active count populated
    while (this.asteroids.length < this.maxAsteroids) {
      this._spawnAsteroid(playerPos, false);
    }

    // 2. UPDATE MINERAL CRYSTAL PICKUPS
    for (let i = this.minerals.length - 1; i >= 0; i--) {
      const m = this.minerals[i];
      m.life -= dt;
      m.mesh.rotation.y += 2.5 * dt;
      m.mesh.rotation.x += 1.8 * dt;

      // Magnetize towards player if close
      const dx = playerPos.x - m.mesh.position.x;
      const dz = playerPos.z - m.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 40) {
        const pullSpeed = 45 * (1 - dist / 40);
        m.mesh.position.x += (dx / dist) * pullSpeed * dt;
        m.mesh.position.z += (dz / dist) * pullSpeed * dt;
      }

      if (m.life <= 0 || dist > 600) {
        this.scene.remove(m.mesh);
        this.minerals.splice(i, 1);
      }
    }
  }

  damageAsteroid(asteroidIndex, damage, particles, audio) {
    const ast = this.asteroids[asteroidIndex];
    if (!ast) return null;

    ast.hp -= damage;
    if (ast.hp <= 0) {
      // Shatter Asteroid!
      const pos = ast.mesh.position.clone();
      const points = ast.points;
      const radius = ast.radius;

      // Debris and dust particles
      particles.createRockExplosion(pos, radius);
      audio.explode(false);

      // Spawn Mineral Crystals
      this._spawnMineralCrystals(pos, radius > 7 ? 3 : 1);

      // Remove Asteroid
      this.scene.remove(ast.mesh);
      ast.mesh.geometry.dispose();
      this.asteroids.splice(asteroidIndex, 1);

      return { destroyed: true, points, pos };
    } else {
      // Chip effect
      particles.createSparks(ast.mesh.position, 6, 0x99aabb);
      audio.hit();
      return { destroyed: false };
    }
  }

  _spawnMineralCrystals(pos, count) {
    const THREE = this.THREE;
    const kinds = ['score', 'shield', 'energy'];

    for (let i = 0; i < count; i++) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const mesh = new THREE.Mesh(this.crystalGeom, this.crystalMats[kind]);
      mesh.position.copy(pos);
      mesh.position.x += (Math.random() - 0.5) * 4;
      mesh.position.z += (Math.random() - 0.5) * 4;

      this.scene.add(mesh);
      this.minerals.push({
        mesh,
        kind,
        life: 25.0 // Lasts 25 seconds in space
      });
    }
  }

  checkLaserCollisions(laser, damage, particles, audio) {
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      const dx = laser.position.x - ast.mesh.position.x;
      const dz = laser.position.z - ast.mesh.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < ast.radius * ast.radius) {
        return { hit: true, result: this.damageAsteroid(i, damage, particles, audio) };
      }
    }
    return { hit: false };
  }

  checkShipCollision(ship) {
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      const dx = ship.position.x - ast.mesh.position.x;
      const dz = ship.position.z - ast.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      const minDist = ast.radius + 2.0;

      if (dist < minDist && dist > 0.001) {
        // Bounce ship smoothly away from asteroid surface
        const nx = dx / dist;
        const nz = dz / dist;
        const penetration = minDist - dist;

        ship.position.x += nx * penetration;
        ship.position.z += nz * penetration;

        // Dampen velocity along normal
        const vDotN = ship.velocity.x * nx + ship.velocity.z * nz;
        if (vDotN < 0) {
          ship.velocity.x -= vDotN * nx * 1.4;
          ship.velocity.z -= vDotN * nz * 1.4;
        }

        return { hit: true, asteroid: ast };
      }
    }
    return { hit: false };
  }

  checkMineralPickups(ship, onPickup) {
    for (let i = this.minerals.length - 1; i >= 0; i--) {
      const m = this.minerals[i];
      const dx = ship.position.x - m.mesh.position.x;
      const dz = ship.position.z - m.mesh.position.z;
      if (Math.hypot(dx, dz) < 4.0) {
        onPickup(m.kind);
        this.scene.remove(m.mesh);
        this.minerals.splice(i, 1);
      }
    }
  }
}
