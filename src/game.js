/**
 * Main Game Engine & Loop Orchestrator
 * Connects Multi-Ship Selection, Photorealistic Environment, Asteroids,
 * Dynamic Drone Squadrons, Capital Boss Battles, Power-ups, Audio, and HUD.
 */
import { Starfighter } from './ship.js';
import { CosmicEnvironment } from './environment.js';
import { AsteroidManager } from './asteroids.js';
import { DroneManager } from './drones.js';
import { ParticleSystem } from './particles.js';
import { InputController } from './controls.js';
import { SoundEngine } from './audio.js';
import { TacticalHUD } from './hud.js';

export class CosmicGame {
  constructor(canvas, hudContainer, THREE, selectedShipType = 'aether') {
    this.canvas = canvas;
    this.hudContainer = hudContainer;
    this.THREE = THREE;
    this.selectedShipType = selectedShipType;

    // Game State
    this.running = false;
    this.isPaused = false;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.sector = 1;
    this.shake = 0;

    // Three.js Core
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a);
    this.scene.fog = new THREE.FogExp2(0x02040a, 0.0009);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 5000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Audio & Systems
    this.audio = new SoundEngine();
    this.hud = new TacticalHUD(this.hudContainer);
    this.input = new InputController(this.canvas, this.camera, THREE);
    this.particles = new ParticleSystem(this.scene, THREE);
    this.environment = new CosmicEnvironment(this.scene, this.renderer, THREE);
    this.player = new Starfighter(this.scene, THREE, this.selectedShipType);
    this.asteroids = new AsteroidManager(this.scene, THREE);
    this.drones = new DroneManager(this.scene, THREE);

    // Player Lasers
    this.playerLasers = [];
    this.laserGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8);
    this.laserGeom.rotateX(Math.PI / 2);

    this.lastTime = performance.now();
    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start() {
    this.audio.unlock();
    this.running = true;
    this.score = 0;
    this.combo = 1;
    this.sector = 1;

    this.asteroids.init(this.player.position);
    this._startSector(1);

    this.hud.addFeedMessage(`PILOT INITIATED: ${this.player.config.name}`, '#3ef0ff');
    this.lastTime = performance.now();
    this._loop();
  }

  _startSector(sectorNum) {
    this.sector = sectorNum;
    const isBoss = (sectorNum % 3 === 0);

    if (isBoss) {
      this.hud.showAnnouncement(`ALERT: CAPITAL CLASS BOSS INCOMING!`, 3500);
      this.hud.addFeedMessage(`CAPITAL WARSHIP DETECTED IN SECTOR ${sectorNum}`, '#bf00ff');
    } else {
      this.hud.showAnnouncement(`SECTOR ${sectorNum.toString().padStart(2, '0')}: HOSTILE SQUADRONS`);
      this.hud.addFeedMessage(`SECTOR ${sectorNum} DRONE SQUADRON DETECTED`, '#ffaa00');
    }

    this.audio.waveAlert();
    this.drones.spawnWave(sectorNum, this.player.position);
  }

  _loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this._loop);

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this.isPaused) {
      this._update(dt, now / 1000);
    }

    this._render();
  };

  _update(dt, time) {
    // 1. SAMPLE INPUT & UPDATE PLAYER
    const inputState = this.input.sample(this.player);
    this.player.targetHeading = inputState.targetHeading;
    this.player.update(dt, inputState, time);

    const currentSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    this.audio.updateEngineHum(currentSpeed / this.player.config.maxSpeed);
    this.audio.setBoost(this.player.isBoosting);

    if (currentSpeed > 2.0 || this.player.isBoosting) {
      this.particles.createThrusterSparks(this.player.position, this.player.heading, this.player.isBoosting);
    }

    // 2. PLAYER WEAPON FIRING
    if (inputState.fire && this.player.canFire(time)) {
      this.player.recordShot(time);
      const laserSpawns = this.player.getLaserSpawns();

      laserSpawns.forEach(spawn => {
        const mat = new this.THREE.MeshBasicMaterial({
          color: spawn.color || this.player.config.laserColor,
          transparent: true,
          opacity: 0.95
        });
        const mesh = new this.THREE.Mesh(this.laserGeom, mat);
        mesh.position.set(spawn.x, spawn.y, spawn.z);
        mesh.rotation.y = spawn.heading;
        this.scene.add(mesh);

        this.playerLasers.push({
          mesh,
          vx: spawn.vx,
          vz: spawn.vz,
          life: 1.5,
          damage: this.player.weaponLevel >= 2 ? 2 : 1
        });
      });

      this.audio.shoot(this.player.isBoosting);
      this.addShake(0.06);
    }

    // 3. UPDATE PLAYER LASERS & COLLISIONS
    for (let i = this.playerLasers.length - 1; i >= 0; i--) {
      const laser = this.playerLasers[i];
      laser.mesh.position.x += laser.vx * dt;
      laser.mesh.position.z += laser.vz * dt;
      laser.life -= dt;

      // Enemy / Boss Collision
      const enemyHit = this.drones.checkPlayerLaserCollisions(laser.mesh, laser.damage, this.particles, this.audio);
      if (enemyHit.hit) {
        if (enemyHit.destroyed) {
          const pts = enemyHit.points * this.combo;
          this.score += pts;
          this._incrementCombo();
          this.hud.addFeedMessage(`+${pts} ${enemyHit.name} DESTROYED`, enemyHit.isBoss ? '#bf00ff' : '#5cff9d');
          this.addShake(enemyHit.isBoss ? 0.8 : 0.35);
        }

        this.scene.remove(laser.mesh);
        this.playerLasers.splice(i, 1);
        continue;
      }

      // Asteroid Collision
      const astHit = this.asteroids.checkLaserCollisions(laser.mesh, laser.damage, this.particles, this.audio);
      if (astHit.hit) {
        if (astHit.result && astHit.result.destroyed) {
          const pts = astHit.result.points;
          this.score += pts;
          this.hud.addFeedMessage(`+${pts} ASTEROID SHATTERED`, '#ffc247');
        }

        this.scene.remove(laser.mesh);
        this.playerLasers.splice(i, 1);
        continue;
      }

      if (laser.life <= 0) {
        this.scene.remove(laser.mesh);
        this.playerLasers.splice(i, 1);
      }
    }

    // 4. UPDATE ASTEROIDS & DRONES & POWERUPS
    this.asteroids.update(dt, this.player.position);
    this.drones.update(dt, this.player, time, this.audio);

    // Ship vs Asteroid Collision
    const shipAstHit = this.asteroids.checkShipCollision(this.player);
    if (shipAstHit.hit) {
      this.player.takeDamage(12, time);
      this.audio.hit();
      this.addShake(0.25);
    }

    // Mineral Pickups from shattered asteroids
    this.asteroids.checkMineralPickups(this.player, (kind) => {
      this.audio.pickup(kind);
      if (kind === 'shield') {
        this.player.repairShield(25);
        this.hud.addFeedMessage('SHIELD RESTORED +25', '#5cff9d');
      } else if (kind === 'energy') {
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 40);
        this.hud.addFeedMessage('OVERDRIVE CHARGED +40', '#3ef0ff');
      } else {
        const pts = 200 * this.combo;
        this.score += pts;
        this.hud.addFeedMessage(`+${pts} MINERAL CRYSTAL SECURED`, '#ffc247');
      }
    });

    // 5. CHECK SECTOR WAVE / BOSS COMPLETION
    const totalRemaining = (this.drones.boss ? 1 : 0) + this.drones.drones.length;
    if (totalRemaining === 0) {
      this.audio.sectorCleared();
      const bonus = (this.sector % 3 === 0) ? 5000 : 1500;
      this.hud.addFeedMessage(`SECTOR ${this.sector} CLEARED! +${bonus} VICTORY BONUS`, '#5cff9d');
      this.score += bonus;
      setTimeout(() => {
        this._startSector(this.sector + 1);
      }, 3200);
    }

    // Combo Decay
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    // 6. UPDATE PARTICLES & ENVIRONMENT
    this.particles.update(dt);
    this.environment.update(this.player.position, dt);

    // 7. CAMERA CHASE SMOOTHING & LOOKAHEAD
    this._updateCamera(dt);

    // 8. UPDATE HUD & TARGET TRACKING
    const trackingInfo = this.drones.getTargetTrackingInfo(
      this.player,
      this.camera,
      this.canvas.width,
      this.canvas.height
    );

    const radarData = {
      asteroids: this.asteroids.asteroids.map(a => ({ x: a.mesh.position.x, z: a.mesh.position.z })),
      powerups: this.drones.powerups.map(p => ({ x: p.group.position.x, z: p.group.position.z, type: p.type })),
      drones: [
        ...(this.drones.boss ? [{ x: this.drones.boss.group.position.x, z: this.drones.boss.group.position.z, isBoss: true }] : []),
        ...this.drones.drones.map(d => ({ x: d.group.position.x, z: d.group.position.z, isBoss: false }))
      ]
    };

    this.hud.update(this.player, this.score, this.combo, this.sector, trackingInfo, radarData, time);

    if (this.player.hull <= 0) {
      this._onGameOver();
    }
  }

  _incrementCombo() {
    this.combo = Math.min(6, this.combo + 1);
    this.comboTimer = 4.2;
  }

  _updateCamera(dt) {
    const forwardX = Math.sin(this.player.heading);
    const forwardZ = Math.cos(this.player.heading);

    const targetCamX = this.player.position.x - forwardX * 44;
    const targetCamZ = this.player.position.z - forwardZ * 44;
    const targetCamY = 26;

    this.camera.position.x += (targetCamX - this.camera.position.x) * (1 - Math.exp(-6.5 * dt));
    this.camera.position.z += (targetCamZ - this.camera.position.z) * (1 - Math.exp(-6.5 * dt));
    this.camera.position.y += (targetCamY - this.camera.position.y) * (1 - Math.exp(-6.5 * dt));

    const targetFov = this.player.isBoosting ? 70 : 62;
    this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-5.0 * dt));
    this.camera.updateProjectionMatrix();

    const lookTargetX = this.player.position.x + forwardX * 20;
    const lookTargetZ = this.player.position.z + forwardZ * 20;

    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 3.0;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 3.0;
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }

    this.camera.lookAt(lookTargetX, 0, lookTargetZ);
  }

  addShake(amount) {
    this.shake = Math.min(1.4, this.shake + amount);
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onGameOver() {
    this.running = false;
    this.audio.explode(true);
    this.particles.createShipExplosion(this.player.position, true);
    this.hud.showAnnouncement('STARFIGHTER DESTROYED - RECONNECTING', 4000);
    setTimeout(() => {
      location.reload();
    }, 3500);
  }
}
