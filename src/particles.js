/**
 * Particle Effects & Explosions System
 * High-performance particle bursts, shockwave rings, tumbling debris shards,
 * spark emitters, and afterburner trails.
 */
export class ParticleSystem {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;

    this.sparks = [];
    this.shards = [];
    this.shockwaves = [];
    this.speedLines = [];

    // Shared Geometries & Materials
    this.shardGeom = new THREE.TetrahedronGeometry(0.5, 0);
    this.ringGeom = new THREE.RingGeometry(0.8, 1.4, 32);
    this.ringGeom.rotateX(-Math.PI / 2);

    // Pre-allocated static materials (avoids runtime shader compiling, GC pauses & memory leaks)
    this.ringMatHeavy = new THREE.MeshBasicMaterial({
      color: 0xff4d79,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.ringMatNormal = new THREE.MeshBasicMaterial({
      color: 0xff7733,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.empRingMat = new THREE.MeshBasicMaterial({
      color: 0x3ef0ff,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.shardMatHeavy = new THREE.MeshBasicMaterial({ color: 0xff3355 });
    this.shardMatNormal = new THREE.MeshBasicMaterial({ color: 0xff8822 });
    this.rockShardMat = new THREE.MeshBasicMaterial({ color: 0x5a6476 });

    // Particle Point Cloud for Fast Spark Rendering
    this.maxSparks = 1200;
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);
    this.sparkSizes = new Float32Array(this.maxSparks);

    this.sparkGeom = new THREE.BufferGeometry();
    this.sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkGeom.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));
    this.sparkGeom.setAttribute('size', new THREE.BufferAttribute(this.sparkSizes, 1));

    this.sparkMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkPoints = new THREE.Points(this.sparkGeom, this.sparkMat);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);

    // Active Spark Index List
    this.activeSparks = [];
  }

  createShipExplosion(pos, isHeavy = false) {
    const THREE = this.THREE;
    const count = isHeavy ? 100 : 55;
    const shardCount = isHeavy ? 16 : 10;

    // 1. Shockwave Expansion Ring (Shared Material)
    const ringMat = isHeavy ? this.ringMatHeavy : this.ringMatNormal;
    const ring = new THREE.Mesh(this.ringGeom, ringMat);
    ring.position.copy(pos);
    ring.position.y = 0.5;
    this.scene.add(ring);

    this.shockwaves.push({
      mesh: ring,
      scale: 1,
      maxScale: isHeavy ? 28 : 18,
      speed: isHeavy ? 45 : 35,
      life: 1.0,
      decay: 1.6
    });

    // 2. Tumbling Hull Debris Shards (Shared Fast Material)
    const shardMat = isHeavy ? this.shardMatHeavy : this.shardMatNormal;

    for (let i = 0; i < shardCount; i++) {
      if (this.shards.length >= 50) break; // Hard limit active shards to prevent frame drops
      const shard = new THREE.Mesh(this.shardGeom, shardMat);
      shard.position.copy(pos);
      shard.scale.setScalar(0.6 + Math.random() * 0.9);

      const angle = Math.random() * Math.PI * 2;
      const speed = 18 + Math.random() * (isHeavy ? 40 : 25);
      const elevation = (Math.random() - 0.5) * 12;

      this.scene.add(shard);
      this.shards.push({
        mesh: shard,
        vx: Math.sin(angle) * speed,
        vy: elevation,
        vz: Math.cos(angle) * speed,
        rotX: (Math.random() - 0.5) * 12,
        rotY: (Math.random() - 0.5) * 12,
        rotZ: (Math.random() - 0.5) * 12,
        life: 1.6 + Math.random() * 0.6
      });
    }

    // 3. Fiery Spark Cloud
    const colors = isHeavy
      ? [new THREE.Color(0xffffff), new THREE.Color(0xff3366), new THREE.Color(0xff8800)]
      : [new THREE.Color(0xffffff), new THREE.Color(0xffaa22), new THREE.Color(0xff5511)];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * (isHeavy ? 55 : 35);
      const col = colors[Math.floor(Math.random() * colors.length)];

      this._addSpark({
        x: pos.x,
        y: pos.y + (Math.random() - 0.5) * 2,
        z: pos.z,
        vx: Math.sin(angle) * speed,
        vy: (Math.random() - 0.5) * 15,
        vz: Math.cos(angle) * speed,
        r: col.r,
        g: col.g,
        b: col.b,
        life: 0.8 + Math.random() * 0.7,
        maxLife: 1.5,
        size: 3.5 + Math.random() * 3
      });
    }
  }

  createRockExplosion(pos, radius) {
    const THREE = this.THREE;
    const shardCount = Math.min(10, Math.floor(radius * 1.2));
    const sparkCount = Math.min(30, Math.floor(radius * 3.5));

    // Tumbling Rock Shards (Shared Fast Material)
    for (let i = 0; i < shardCount; i++) {
      if (this.shards.length >= 50) break;
      const shard = new THREE.Mesh(this.shardGeom, this.rockShardMat);
      shard.position.copy(pos);
      shard.scale.setScalar(0.4 + Math.random() * (radius * 0.25));

      const angle = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 25;

      this.scene.add(shard);
      this.shards.push({
        mesh: shard,
        vx: Math.sin(angle) * speed,
        vy: (Math.random() - 0.5) * 8,
        vz: Math.cos(angle) * speed,
        rotX: (Math.random() - 0.5) * 8,
        rotY: (Math.random() - 0.5) * 8,
        rotZ: (Math.random() - 0.5) * 8,
        life: 1.4 + Math.random() * 0.6
      });
    }

    // Mineral Dust & Sparks
    const dustColors = [new THREE.Color(0x99aacc), new THREE.Color(0xffcc66), new THREE.Color(0x55eeff)];
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 28;
      const col = dustColors[Math.floor(Math.random() * dustColors.length)];

      this._addSpark({
        x: pos.x,
        y: pos.y + (Math.random() - 0.5) * 2,
        z: pos.z,
        vx: Math.sin(angle) * speed,
        vy: (Math.random() - 0.5) * 10,
        vz: Math.cos(angle) * speed,
        r: col.r,
        g: col.g,
        b: col.b,
        life: 0.6 + Math.random() * 0.6,
        maxLife: 1.2,
        size: 2.5 + Math.random() * 2.5
      });
    }
  }

  createSparks(pos, count, colorHex) {
    const col = new this.THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 20;
      this._addSpark({
        x: pos.x,
        y: pos.y + (Math.random() - 0.5) * 1.5,
        z: pos.z,
        vx: Math.sin(angle) * speed,
        vy: (Math.random() - 0.5) * 10,
        vz: Math.cos(angle) * speed,
        r: col.r,
        g: col.g,
        b: col.b,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 2.0 + Math.random() * 2.0
      });
    }
  }

  createThrusterSparks(pos, heading, isBoosting) {
    const col = isBoosting ? new this.THREE.Color(0x66ffff) : new this.THREE.Color(0xff7722);
    const speed = isBoosting ? 45 : 25;
    const spread = isBoosting ? 0.4 : 0.25;

    for (let i = 0; i < (isBoosting ? 3 : 1); i++) {
      // Eject behind ship (-heading direction)
      const ejectAngle = heading + Math.PI + (Math.random() - 0.5) * spread;
      this._addSpark({
        x: pos.x + (Math.random() - 0.5) * 0.4,
        y: pos.y + (Math.random() - 0.5) * 0.2,
        z: pos.z + (Math.random() - 0.5) * 0.4,
        vx: Math.sin(ejectAngle) * speed + (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 4,
        vz: Math.cos(ejectAngle) * speed + (Math.random() - 0.5) * 5,
        r: col.r,
        g: col.g,
        b: col.b,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        size: 2.0 + Math.random() * 2.0
      });
    }
  }

  createMissileSmoke(pos) {
    if (Math.random() < 0.6) {
      this._addSpark({
        x: pos.x + (Math.random() - 0.5) * 0.3,
        y: pos.y + (Math.random() - 0.5) * 0.3,
        z: pos.z + (Math.random() - 0.5) * 0.3,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
        r: 0.9,
        g: 0.65,
        b: 0.3,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.55,
        size: 3.5 + Math.random() * 2.5
      });
    }
  }

  createEMPShockwave(pos, radius = 140) {
    const THREE = this.THREE;
    const ring = new THREE.Mesh(this.ringGeom, this.empRingMat);
    ring.position.copy(pos);
    ring.position.y = 0.5;
    this.scene.add(ring);

    this.shockwaves.push({
      mesh: ring,
      scale: 1,
      maxScale: radius,
      speed: 90,
      life: 1.0,
      decay: 0.8
    });

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 50;
      this._addSpark({
        x: pos.x,
        y: pos.y + (Math.random() - 0.5) * 3,
        z: pos.z,
        vx: Math.sin(angle) * speed,
        vy: (Math.random() - 0.5) * 10,
        vz: Math.cos(angle) * speed,
        r: 0.24,
        g: 0.94,
        b: 1.0,
        life: 0.9 + Math.random() * 0.6,
        maxLife: 1.5,
        size: 3.8 + Math.random() * 3
      });
    }
  }

  createPowerupCollect(pos, type) {
    const col = type === 'shield' ? { r: 0.36, g: 1.0, b: 0.61 } : (type === 'missile' ? { r: 0.24, g: 0.94, b: 1.0 } : { r: 1.0, g: 0.76, b: 0.28 });
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 25;
      this._addSpark({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        vx: Math.sin(angle) * speed,
        vy: (Math.random() - 0.5) * 10,
        vz: Math.cos(angle) * speed,
        r: col.r,
        g: col.g,
        b: col.b,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        size: 3.2
      });
    }
  }

  _addSpark(spark) {
    if (this.activeSparks.length < this.maxSparks) {
      this.activeSparks.push(spark);
    }
  }

  update(dt) {
    // 1. UPDATE SHOCKWAVE RINGS
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.scale += sw.speed * dt;
      sw.mesh.scale.setScalar(sw.scale);
      sw.life -= sw.decay * dt;
      sw.mesh.material.opacity = Math.max(0, sw.life);

      if (sw.life <= 0 || sw.scale >= sw.maxScale) {
        this.scene.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    // 2. UPDATE DEBRIS SHARDS
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const shard = this.shards[i];
      shard.mesh.position.x += shard.vx * dt;
      shard.mesh.position.y += shard.vy * dt;
      shard.mesh.position.z += shard.vz * dt;

      shard.mesh.rotation.x += shard.rotX * dt;
      shard.mesh.rotation.y += shard.rotY * dt;
      shard.mesh.rotation.z += shard.rotZ * dt;

      shard.vx *= 0.985;
      shard.vz *= 0.985;

      shard.life -= dt;
      if (shard.life <= 0) {
        this.scene.remove(shard.mesh);
        this.shards.splice(i, 1);
      }
    }

    // 3. UPDATE ACTIVE SPARKS
    const pos = this.sparkPositions;
    const col = this.sparkColors;
    const sizes = this.sparkSizes;

    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const sp = this.activeSparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.z += sp.vz * dt;

      sp.vx *= 0.97;
      sp.vz *= 0.97;
      sp.life -= dt;

      if (sp.life <= 0) {
        this.activeSparks.splice(i, 1);
        continue;
      }

      // Write to BufferAttributes
      const idx3 = i * 3;
      pos[idx3] = sp.x;
      pos[idx3 + 1] = sp.y;
      pos[idx3 + 2] = sp.z;

      const alpha = sp.life / sp.maxLife;
      col[idx3] = sp.r * alpha;
      col[idx3 + 1] = sp.g * alpha;
      col[idx3 + 2] = sp.b * alpha;

      sizes[i] = sp.size * alpha;
    }

    // Blank out inactive vertices
    for (let i = this.activeSparks.length; i < this.maxSparks; i++) {
      sizes[i] = 0;
    }

    this.sparkGeom.attributes.position.needsUpdate = true;
    this.sparkGeom.attributes.color.needsUpdate = true;
    this.sparkGeom.attributes.size.needsUpdate = true;
  }
}
