/**
 * Starfighter Model & Controller: Dark Armored Twin-Hull Cruiser
 * Features glowing orange energy strips, rear thruster flames, dual-laser systems,
 * and responsive arcade flight physics with roll banking.
 */
export class Starfighter {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;

    // Movement & Physics State
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0;          // Yaw angle in radians (0 = pointing +Z or -Z)
    this.targetHeading = 0;
    this.roll = 0;             // Banking angle in radians
    this.pitch = 0;

    // Vitals
    this.maxHull = 100;
    this.hull = 100;
    this.maxShield = 100;
    this.shield = 100;
    this.shieldRegenDelay = 3.0; // Seconds after damage before recharge
    this.lastDamageTime = 0;
    this.shieldRegenRate = 18;   // Shield points per second

    // Energy / Boost
    this.maxEnergy = 100;
    this.energy = 100;
    this.boostDrainRate = 28;
    this.energyRegenRate = 20;
    this.isBoosting = false;

    // Speeds & Acceleration (Arcade Flight Tuning)
    this.cruisingSpeed = 48;
    this.boostSpeed = 110;
    this.accelRate = 55;
    this.brakingRate = 75;
    this.friction = 0.985;
    this.turnRate = 6.5;

    // Weapons
    this.fireInterval = 0.12;   // Rapid dual laser fire
    this.lastFireTime = 0;
    this.laserAlternator = false;
    this.heat = 0;
    this.overheated = false;
    this.heatPerShot = 0.045;
    this.coolRate = 0.35;

    // Build the 3D Starfighter Mesh Group
    this.group = new THREE.Group();
    this.thrusterFlames = [];
    this.thrusterLights = [];
    this.shieldMesh = null;
    this.laserMuzzleOffsets = [];

    this._buildModel();
    this.scene.add(this.group);
  }

  _buildModel() {
    const THREE = this.THREE;

    // Core Materials
    const darkArmorMat = new THREE.MeshStandardMaterial({
      color: 0x121722,
      metalness: 0.88,
      roughness: 0.32,
      envMapIntensity: 1.2
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1d2535,
      metalness: 0.78,
      roughness: 0.42
    });

    const orangeEnergyMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff7700,
      emissiveIntensity: 2.8,
      roughness: 0.2,
      metalness: 0.5
    });

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x071b26,
      metalness: 0.92,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: 0x1a4566,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.88
    });

    const gunBarrelMat = new THREE.MeshStandardMaterial({
      color: 0x242e3f,
      metalness: 0.92,
      roughness: 0.25
    });

    this.orangeMat = orangeEnergyMat;

    // Ship Root Model Group
    const shipRoot = new THREE.Group();

    // 1. TWIN HULLS (Left and Right Catamaran Outriggers)
    const hullSpacing = 1.35;
    const hullGeom = new THREE.BoxGeometry(0.72, 0.44, 3.6);
    const prowGeom = new THREE.ConeGeometry(0.48, 1.4, 4);
    prowGeom.rotateX(Math.PI / 2);
    prowGeom.rotateY(Math.PI / 4);

    const energyStripSpineGeom = new THREE.BoxGeometry(0.12, 0.08, 2.8);
    const energyStripFlankGeom = new THREE.BoxGeometry(0.06, 0.08, 2.2);

    [-1, 1].forEach((side) => {
      const hullSideGroup = new THREE.Group();
      hullSideGroup.position.set(side * hullSpacing, 0, 0);

      // Main Hull Beam
      const hullMesh = new THREE.Mesh(hullGeom, darkArmorMat);
      hullMesh.castShadow = true;
      hullMesh.receiveShadow = true;
      hullSideGroup.add(hullMesh);

      // Forward Angled Prow
      const prowMesh = new THREE.Mesh(prowGeom, darkArmorMat);
      prowMesh.position.set(0, 0, 2.4);
      prowMesh.scale.set(0.9, 0.65, 1.3);
      prowMesh.castShadow = true;
      hullSideGroup.add(prowMesh);

      // Glowing Orange Energy Strips along Spine
      const spineStrip = new THREE.Mesh(energyStripSpineGeom, orangeEnergyMat);
      spineStrip.position.set(0, 0.24, 0.2);
      hullSideGroup.add(spineStrip);

      // Flank Glowing Strip
      const flankStrip = new THREE.Mesh(energyStripFlankGeom, orangeEnergyMat);
      flankStrip.position.set(side * 0.38, 0.05, 0);
      hullSideGroup.add(flankStrip);

      // Outboard Winglet / Stabilizer Fin
      const wingletGeom = new THREE.BoxGeometry(0.8, 0.08, 1.6);
      const winglet = new THREE.Mesh(wingletGeom, darkTrimMat);
      winglet.position.set(side * 0.55, 0.04, -0.4);
      winglet.rotation.z = side * 0.18;
      hullSideGroup.add(winglet);

      // Wingtip Glowing Beacon
      const wingTipStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.8), orangeEnergyMat);
      wingTipStrip.position.set(side * 0.95, 0.08, -0.3);
      hullSideGroup.add(wingTipStrip);

      // Dual Laser Cannons on Outboard Pylons
      const gunBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 8), darkTrimMat);
      gunBase.rotation.x = Math.PI / 2;
      gunBase.position.set(side * 0.42, -0.05, 1.8);
      hullSideGroup.add(gunBase);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 12), gunBarrelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 0.42, -0.05, 2.6);
      barrel.castShadow = true;
      hullSideGroup.add(barrel);

      const gunEmitterRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 16), orangeEnergyMat);
      gunEmitterRing.position.set(side * 0.42, -0.05, 3.4);
      hullSideGroup.add(gunEmitterRing);

      // Store Muzzle World Offset
      this.laserMuzzleOffsets.push({ side, x: side * (hullSpacing + 0.42), y: -0.05, z: 3.5 });

      // Rear Ion Engine Bell
      const engineBellGeom = new THREE.CylinderGeometry(0.28, 0.36, 0.7, 16);
      engineBellGeom.rotateX(Math.PI / 2);
      const engineBell = new THREE.Mesh(engineBellGeom, darkTrimMat);
      engineBell.position.set(0, 0.02, -1.9);
      hullSideGroup.add(engineBell);

      const engineGlowRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 16), orangeEnergyMat);
      engineGlowRing.position.set(0, 0.02, -2.25);
      hullSideGroup.add(engineGlowRing);

      // Outer Thruster Flame (Orange/Gold Plasma Flare)
      const outerFlameGeom = new THREE.ConeGeometry(0.26, 1.8, 16, 1, true);
      outerFlameGeom.rotateX(-Math.PI / 2);
      outerFlameGeom.translate(0, 0, -0.9);
      const outerFlameMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const outerFlame = new THREE.Mesh(outerFlameGeom, outerFlameMat);
      outerFlame.position.set(0, 0.02, -2.25);
      hullSideGroup.add(outerFlame);

      // Inner Thruster Flame (White-Cyan Core Jet)
      const innerFlameGeom = new THREE.ConeGeometry(0.14, 1.2, 12, 1, true);
      innerFlameGeom.rotateX(-Math.PI / 2);
      innerFlameGeom.translate(0, 0, -0.6);
      const innerFlameMat = new THREE.MeshBasicMaterial({
        color: 0x88ffff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const innerFlame = new THREE.Mesh(innerFlameGeom, innerFlameMat);
      innerFlame.position.set(0, 0.02, -2.25);
      hullSideGroup.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });

      shipRoot.add(hullSideGroup);
    });

    // 2. CENTRAL BRIDGE & COCKPIT CANOPY
    const centerBridge = new THREE.Group();

    // Cross-Spans linking the hulls
    const forwardCrossSpan = new THREE.Mesh(new THREE.BoxGeometry(hullSpacing * 2, 0.22, 1.2), darkArmorMat);
    forwardCrossSpan.position.set(0, 0.08, 0.3);
    centerBridge.add(forwardCrossSpan);

    const aftCrossSpan = new THREE.Mesh(new THREE.BoxGeometry(hullSpacing * 2, 0.18, 0.9), darkArmorMat);
    aftCrossSpan.position.set(0, 0.08, -1.1);
    centerBridge.add(aftCrossSpan);

    // Command Pod Body
    const podBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 2.1), darkArmorMat);
    podBody.position.set(0, 0.2, -0.2);
    centerBridge.add(podBody);

    // Sleek Beveled Cockpit Canopy
    const canopyGeom = new THREE.ConeGeometry(0.42, 1.5, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 4);
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 0.42, 0.25);
    canopy.scale.set(0.85, 0.55, 1.2);
    centerBridge.add(canopy);

    // Glowing Orange Center Crest
    const centerCrest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.4), orangeEnergyMat);
    centerCrest.position.set(0, 0.42, -0.6);
    centerBridge.add(centerCrest);

    // Ventral Sensor Array
    const ventralSensor = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), orangeEnergyMat);
    ventralSensor.position.set(0, -0.15, 0.4);
    centerBridge.add(ventralSensor);

    shipRoot.add(centerBridge);

    // 3. REACTIVE HOLOGRAPHIC FORCE SHIELD BUBBLE
    const shieldGeom = new THREE.IcosahedronGeometry(2.8, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x3ef0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.shieldMesh.scale.set(1.15, 0.65, 1.35);
    this.group.add(this.shieldMesh);

    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  update(dt, input, time) {
    const THREE = this.THREE;

    // 1. RECHARGE & ENERGY LOGIC
    if (this.isBoosting) {
      this.energy = Math.max(0, this.energy - this.boostDrainRate * dt);
      if (this.energy <= 0) {
        this.isBoosting = false;
      }
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // Shield Auto-Recharge (after delay out of combat)
    if (time - this.lastDamageTime > this.shieldRegenDelay && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
    }

    // Heat Dissipation
    this.heat = Math.max(0, this.heat - this.coolRate * dt);
    if (this.overheated && this.heat <= 0.05) {
      this.overheated = false;
    }

    // Shield Mesh Fade
    if (this.shieldMesh && this.shieldMesh.material.opacity > 0) {
      this.shieldMesh.material.opacity = Math.max(0, this.shieldMesh.material.opacity - dt * 2.5);
    }

    // 2. FLIGHT PHYSICS & STEERING
    // Target Speed Calculation
    const boostActive = input.boost && this.energy > 5;
    this.isBoosting = boostActive;
    const maxSpeed = boostActive ? this.boostSpeed : this.cruisingSpeed;

    // Heading calculation: Shortest angle interpolation to avoid 180° snap / lockup
    let angleDiff = Math.atan2(Math.sin(this.targetHeading - this.heading), Math.cos(this.targetHeading - this.heading));
    const smoothFactor = 1 - Math.exp(-this.turnRate * dt);
    this.heading += angleDiff * smoothFactor;

    // Banking (Roll) based on angular turning velocity
    const targetRoll = -angleDiff * 0.95;
    this.roll += (targetRoll - this.roll) * (1 - Math.exp(-9.0 * dt));

    // Pitch based on throttle acceleration
    const forwardThrust = input.thrust; // 1 = forward, -1 = reverse, 0 = neutral
    const targetPitch = forwardThrust * (boostActive ? 0.12 : 0.06);
    this.pitch += (targetPitch - this.pitch) * (1 - Math.exp(-8.0 * dt));

    // Forward Direction Vector in Open Cosmic Space
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);

    // Apply Acceleration along forward vector
    if (forwardThrust > 0) {
      const accel = this.accelRate * (boostActive ? 1.8 : 1.0) * forwardThrust;
      this.velocity.x += forwardX * accel * dt;
      this.velocity.z += forwardZ * accel * dt;
    } else if (forwardThrust < 0) {
      // Braking / Reverse
      this.velocity.x -= forwardX * this.brakingRate * 0.6 * dt;
      this.velocity.z -= forwardZ * this.brakingRate * 0.6 * dt;
    }

    // Soft velocity damping (cosmic inertia with arcade stability)
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }

    // Natural drag when not actively thrusting
    if (forwardThrust === 0) {
      const dragFactor = Math.pow(this.friction, dt * 60);
      this.velocity.x *= dragFactor;
      this.velocity.z *= dragFactor;
    }

    // UPDATE POSITION (Open 360-degree cosmic expanse, no walls)
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Sync 3D Group Transform
    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.y = this.heading;
    this.shipMesh.rotation.z = this.roll;
    this.shipMesh.rotation.x = this.pitch;

    // 3. REAR THRUSTER FLAME ANIMATION
    const speedRatio = Math.min(1.0, currentSpeed / this.cruisingSpeed);
    const flameScale = 0.5 + speedRatio * 0.8 + (boostActive ? 1.2 : 0) + Math.sin(time * 30) * 0.12;

    this.thrusterFlames.forEach(({ outer, inner }) => {
      outer.scale.set(1.0 + (boostActive ? 0.35 : 0), 1.0 + (boostActive ? 0.35 : 0), flameScale);
      inner.scale.set(1.0, 1.0, flameScale * 1.1);
      outer.visible = speedRatio > 0.05 || forwardThrust > 0 || boostActive;
      inner.visible = outer.visible;
    });

    // Gentle floating idle bobbing
    this.shipMesh.position.y = Math.sin(time * 2.2) * 0.08;
  }

  takeDamage(amount, time) {
    this.lastDamageTime = time;

    // Flash shield ripple
    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = 0.85;
    }

    // Absorb into shield first
    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        return { isFatal: false, hitShield: true };
      } else {
        const overflow = amount - this.shield;
        this.shield = 0;
        this.hull = Math.max(0, this.hull - overflow);
      }
    } else {
      this.hull = Math.max(0, this.hull - amount);
    }

    const isFatal = this.hull <= 0;
    return { isFatal, hitShield: false };
  }

  repairShield(amount) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = 0.5;
    }
  }

  repairHull(amount) {
    this.hull = Math.min(this.maxHull, this.hull + amount);
  }

  canFire(time) {
    return !this.overheated && (time - this.lastFireTime >= this.fireInterval);
  }

  getLaserSpawns() {
    // Alternating twin laser cannon fire from outboard hulls
    this.laserAlternator = !this.laserAlternator;
    const offsets = this.laserAlternator
      ? [this.laserMuzzleOffsets[0]]
      : [this.laserMuzzleOffsets[1]];

    // Or dual synchronized volley
    return this.laserMuzzleOffsets.map(offset => {
      const cosH = Math.cos(this.heading);
      const sinH = Math.sin(this.heading);
      // Rotate local offset into world coordinates
      const worldX = this.position.x + (offset.x * cosH + offset.z * sinH);
      const worldZ = this.position.z + (-offset.x * sinH + offset.z * cosH);
      return {
        x: worldX,
        y: offset.y,
        z: worldZ,
        vx: sinH * 160 + this.velocity.x * 0.4,
        vz: cosH * 160 + this.velocity.z * 0.4,
        heading: this.heading
      };
    });
  }

  recordShot(time) {
    this.lastFireTime = time;
    this.heat = Math.min(1.0, this.heat + this.heatPerShot);
    if (this.heat >= 1.0) {
      this.overheated = true;
    }
  }
}
