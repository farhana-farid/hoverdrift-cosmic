/**
 * Main Game Engine & Loop Orchestrator
 * Connects Multi-Ship Selection, Photorealistic Environment, Asteroids,
 * 5 Mission Levels, 5 Enemy Classes, Capital Boss Battles, Homing Missiles,
 * EMP Shockwaves, Cockpit / Chase Camera Modes, and Tactical HUD.
 */
import { Starfighter } from './ship.js';
import { CosmicEnvironment } from './environment.js';
import { AsteroidManager } from './asteroids.js';
import { DroneManager } from './drones.js';
import { ParticleSystem } from './particles.js';
import { InputController } from './controls.js';
import { SoundEngine } from './audio.js';
import { TacticalHUD } from './hud.js';

export const MISSION_DEFINITIONS = [
  {
    level: 1,
    title: 'Deep-Space Patrol',
    briefing: 'Patrol sector perimeter and eliminate the hostile Scout Interceptor wing.',
    targetKills: 5,
    envPreset: 1
  },
  {
    level: 2,
    title: 'Asteroid Field',
    briefing: 'Navigate the dense asteroid belt, neutralize 9 enemy fighters, and collect mineral crystals.',
    targetKills: 9,
    envPreset: 2
  },
  {
    level: 3,
    title: 'Orbital Station Defense',
    briefing: 'Defend Valiance Orbital Space Station against 9 hostile Fighters and Heavy Gunships.',
    targetKills: 9,
    envPreset: 3
  },
  {
    level: 4,
    title: 'Nebula Frontier',
    briefing: 'Infiltrate the deep cobalt nebula and eliminate 8 Elite Viper Aces.',
    targetKills: 8,
    envPreset: 4
  },
  {
    level: 5,
    title: 'Capital Ship Assault',
    briefing: 'Assault and destroy the massive Leviathan Omega Capital Dreadnought!',
    targetKills: 5,
    envPreset: 5
  }
];

export class CosmicGame {
  constructor(canvas, hudContainer, THREE, selectedShipType = 'crimson') {
    this.canvas = canvas;
    this.hudContainer = hudContainer;
    this.THREE = THREE;
    this.selectedShipType = selectedShipType;

    // Game & Mission State
    this.running = false;
    this.isPaused = false;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.currentLevel = 1;
    this.levelKills = 0;
    this.shake = 0;

    // Camera Modes: 0 = Tactical Chase, 1 = Close Action Chase, 2 = Cockpit View
    this.cameraMode = 0;
    this.cameraModes = ['Tactical Chase', 'Close Action', 'Cockpit View'];

    // Three.js Core
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010308);
    // Deep crystal-clear cosmic space (no artificial fog obscuring celestial bodies)

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.4, 6000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Audio & Systems
    this.audio = new SoundEngine();
    this.hud = new TacticalHUD(this.hudContainer);
    this.input = new InputController(this.canvas, this.camera, THREE);
    this.hud.bindTouchInput(this.input);
    this.particles = new ParticleSystem(this.scene, THREE);
    this.environment = new CosmicEnvironment(this.scene, this.renderer, THREE);
    this.player = new Starfighter(this.scene, THREE, this.selectedShipType);
    this.asteroids = new AsteroidManager(this.scene, THREE);
    this.drones = new DroneManager(this.scene, THREE);

    // Pre-allocated Shared Laser Materials (0 shader compiling & 0 memory leaks)
    this.laserMatStandard = new THREE.MeshBasicMaterial({ color: 0x3ef0ff, transparent: true, opacity: 0.95 });
    this.laserMatRapid = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.95 });
    this.laserMatCrimson = new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.95 });

    // High-Performance Laser Object Pool
    this.laserGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8);
    this.laserGeom.rotateX(Math.PI / 2);

    this.laserPool = [];
    this.playerLasers = [];
    for (let i = 0; i < 70; i++) {
      const mesh = new THREE.Mesh(this.laserGeom, this.laserMatStandard);
      mesh.visible = false;
      this.scene.add(mesh);
      this.laserPool.push(mesh);
    }

    this.lastTime = performance.now();
    this.lastTargetLockAudio = 0;

    this._bindHUDCallbacks();
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this._onResize(), 150));
  }

  _recycleLaser(laser, index) {
    laser.mesh.visible = false;
    this.playerLasers.splice(index, 1);
    this.laserPool.push(laser.mesh);
  }

  _bindHUDCallbacks() {
    this.hud.setCallbacks({
      onResume: () => this.togglePause(false),
      onRestart: () => this.startMission(this.currentLevel),
      onNextMission: () => {
        this.hud.showVictoryModal(false);
        this.startMission(Math.min(5, this.currentLevel + 1));
      },
      onSelectLevel: (lvl) => {
        this.togglePause(false);
        this.startMission(lvl);
      },
      onRedeploy: () => {
        this.togglePause(false);
        this.startMission(this.currentLevel);
      },
      onGoHangar: () => {
        this.togglePause(true);
        const hangar = document.getElementById('hangar-overlay');
        if (hangar) {
          hangar.style.display = 'flex';
          hangar.style.opacity = '1';
        }
      },
      onTogglePause: () => this.togglePause(),
      onCycleCamera: () => this.cycleCamera(),
      onVolume: (val) => this.audio.setVolume(val),
      onSensitivity: (val) => {
        if (this.player) this.player.sensitivity = val;
        if (this.input) this.input.setSensitivity(val);
      },
      onMute: () => this.audio.toggleMute()
    });
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
    this.audio.startCosmicMusic();
    this.running = true;
    this.score = 0;
    this.combo = 1;
    this.asteroids.init(this.player.position);
    this.startMission(1);
    this.lastTime = performance.now();
    this._loop();
  }

  startMission(levelNum) {
    this.isPaused = false;
    this.currentLevel = levelNum;
    this.levelKills = 0;
    const def = MISSION_DEFINITIONS[levelNum - 1] || MISSION_DEFINITIONS[0];

    this.player.reset();
    this.environment.setLevelEnvironment(def.envPreset);
    this.drones.spawnLevelWave(levelNum, this.player.position, this.player.heading);

    this.hud.setMissionInfo(def.level, def.title, `${def.briefing} [0/${def.targetKills}]`);
    this.hud.showAnnouncement(`MISSION 0${def.level}: ${def.title.toUpperCase()}`, 3500);
    this.hud.addFeedMessage(`MISSION 0${def.level} INITIATED: ${def.title}`, '#3ef0ff');

    this.audio.waveAlert();
  }

  togglePause(forceState = null) {
    this.isPaused = forceState !== null ? forceState : !this.isPaused;
    this.hud.showPauseMenu(this.isPaused);
  }

  cycleCamera() {
    this.cameraMode = (this.cameraMode + 1) % this.cameraModes.length;
    const modeName = this.cameraModes[this.cameraMode];
    const isCockpit = this.cameraMode === 2;
    this.hud.setCameraMode(modeName, isCockpit);
    this.hud.addFeedMessage(`CAMERA: ${modeName.toUpperCase()}`, '#ffc247');
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
    // 1. SAMPLE INPUT & CONTROLS
    const inputState = this.input.sample(this.player);

    if (inputState.togglePause) {
      this.togglePause();
      return;
    }

    if (inputState.switchCamera) {
      this.cycleCamera();
    }

    if (inputState.weaponSelect) {
      this.player.selectedWeapon = inputState.weaponSelect;
      this.hud.addFeedMessage(`WEAPON ARMED: ${inputState.weaponSelect.toUpperCase()}`, '#ffaa00');
    }

    // Update Player Movement & Physics
    this.player.targetHeading = inputState.targetHeading;
    this.player.update(dt, inputState, time);

    const currentSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    this.audio.updateEngineHum(currentSpeed / this.player.config.maxSpeed);
    this.audio.setBoost(this.player.isBoosting);

    if (currentSpeed > 2.0 || this.player.isBoosting) {
      this.particles.createThrusterSparks(this.player.position, this.player.heading, this.player.isBoosting);
    }

    // 2. WEAPON DISPATCH & FIRING
    const wType = this.player.selectedWeapon || 'cannons';

    // Primary & Rapid Fire
    if (inputState.fire && this.player.canFire(time, wType)) {
      this.player.recordShot(time, wType);
      const isRapid = wType === 'rapid';
      const laserSpawns = this.player.getLaserSpawns();

      laserSpawns.forEach(spawn => {
        let mesh = this.laserPool.pop();
        if (!mesh) {
          if (this.playerLasers.length > 0) {
            const oldest = this.playerLasers.shift();
            mesh = oldest.mesh;
          } else {
            mesh = new this.THREE.Mesh(this.laserGeom, this.laserMatStandard);
            this.scene.add(mesh);
          }
        }

        mesh.material = isRapid ? this.laserMatRapid : (this.selectedShipType === 'crimson' ? this.laserMatCrimson : this.laserMatStandard);
        mesh.scale.set(isRapid ? 0.75 : 1.0, isRapid ? 0.75 : 1.0, isRapid ? 0.75 : 1.0);
        mesh.position.set(spawn.x, spawn.y, spawn.z);
        mesh.rotation.y = spawn.heading;
        mesh.visible = true;

        this.playerLasers.push({
          mesh,
          vx: spawn.vx * (isRapid ? 1.15 : 1.0),
          vz: spawn.vz * (isRapid ? 1.15 : 1.0),
          life: 1.4,
          damage: isRapid ? 1.4 : (this.player.weaponLevel >= 2 ? 3 : 2)
        });
      });

      this.audio.shoot(this.player.isBoosting);
      this.addShake(isRapid ? 0.03 : 0.06);
    }

    // Secondary Homing Missiles (R-Click / E)
    if (inputState.fireMissile && this.player.canLaunchMissile(time)) {
      const trackingInfo = this.drones.getTargetTrackingInfo(this.player, this.camera, this.canvas.width, this.canvas.height);
      const target = trackingInfo ? trackingInfo.target : null;

      if (this.player.recordMissileLaunch(time)) {
        this.drones.launchPlayerMissile(this.player, target);
        this.audio.missileLaunch();
        this.addShake(0.18);
        this.hud.addFeedMessage(`HOMING MISSILE LAUNCHED [${this.player.missiles} REMAINING]`, '#3ef0ff');
      }
    }

    // Special Weapon: EMP Pulse (Q)
    if (inputState.triggerEMP && this.player.canTriggerEMP()) {
      this.player.triggerEMP();
      this.drones.triggerEMPBlast(this.player.position, 140, this.particles, this.audio);
      this.addShake(0.45);
      this.hud.showAnnouncement('EMP DISCHARGE: HOSTILE MISSILES & SHIELDS COLLAPSED', 3000);
      this.hud.addFeedMessage('EMP SHOCKWAVE DISCHARGED', '#bf00ff');
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
          this.levelKills++;
          this._incrementCombo();
          this.hud.addFeedMessage(`+${pts} ${enemyHit.name} ELIMINATED`, enemyHit.isBoss ? '#bf00ff' : '#5cff9d');
          this.addShake(enemyHit.isBoss ? 0.85 : 0.35);
        }

        this._recycleLaser(laser, i);
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

        this._recycleLaser(laser, i);
        continue;
      }

      if (laser.life <= 0) {
        this._recycleLaser(laser, i);
      }
    }

    // 4. UPDATE ASTEROIDS & DRONES
    this.asteroids.update(dt, this.player.position);
    this.drones.update(dt, this.player, time, this.audio, this.particles);

    // Ship vs Asteroid Collision
    const shipAstHit = this.asteroids.checkShipCollision(this.player);
    if (shipAstHit.hit) {
      if (this.player.takeDamage(12)) {
        this._onGameOver();
        return;
      }
      this.audio.hit();
      this.addShake(0.25);
    }

    // Mineral Pickups
    this.asteroids.checkMineralPickups(this.player, (kind) => {
      this.audio.pickup(kind);
      if (kind === 'shield') {
        this.player.repairShield(30);
        this.hud.addFeedMessage('SHIELDS CHARGED +30', '#5cff9d');
      } else if (kind === 'energy') {
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 45);
        this.hud.addFeedMessage('BOOST CELLS CHARGED +45', '#3ef0ff');
      } else {
        const pts = 250 * this.combo;
        this.score += pts;
        this.hud.addFeedMessage(`+${pts} MINERAL ORE SECURED`, '#ffc247');
      }
    });

    // 5. CHECK MISSION OBJECTIVE PROGRESS & COMPLETION
    const def = MISSION_DEFINITIONS[this.currentLevel - 1] || MISSION_DEFINITIONS[0];
    const totalRemaining = (this.drones.boss ? 1 : 0) + this.drones.drones.length;
    const killsProgress = `${this.levelKills}/${def.targetKills}`;

    if (totalRemaining === 0 && !this.victoryModalActive) {
      this._onMissionComplete(def);
    }

    // Combo Decay
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    // 6. UPDATE PARTICLES & ENVIRONMENT
    this.particles.update(dt);
    this.environment.update(this.player.position, dt);

    // 7. CAMERA POSITIONING & VIEW MODES
    this._updateCamera(dt);
    this.camera.updateMatrixWorld();

    // 8. UPDATE HUD & TARGET TRACKING
    const trackingInfo = this.drones.getTargetTrackingInfo(
      this.player,
      this.camera,
      this.canvas.width,
      this.canvas.height
    );

    // Target Lock Chime
    if (trackingInfo && trackingInfo.isLocked && time - this.lastTargetLockAudio > 1.8) {
      this.lastTargetLockAudio = time;
      this.audio.missileLock();
    }

    const radarData = {
      asteroids: this.asteroids.asteroids.map(a => ({ x: a.mesh.position.x, z: a.mesh.position.z })),
      powerups: this.drones.powerups.map(p => ({ x: p.group.position.x, z: p.group.position.z, type: p.type })),
      drones: [
        ...(this.drones.boss ? [{ x: this.drones.boss.group.position.x, z: this.drones.boss.group.position.z, isBoss: true }] : []),
        ...this.drones.drones.map(d => ({ x: d.group.position.x, z: d.group.position.z, isBoss: false }))
      ]
    };

    const missionStats = {
      objectiveText: `${def.briefing} [${killsProgress}]`,
      boss: this.drones.boss
    };

    this.hud.update(this.player, this.score, this.combo, this.currentLevel, trackingInfo, radarData, time, missionStats);

    if (this.player.hull <= 0) {
      this._onGameOver();
    }
  }

  _incrementCombo() {
    this.combo = Math.min(6, this.combo + 1);
    this.comboTimer = 4.5;
  }

  _updateCamera(dt) {
    const forwardX = Math.sin(this.player.heading);
    const forwardZ = Math.cos(this.player.heading);

    if (this.cameraMode === 2) {
      // MODE 2: FIRST-PERSON COCKPIT VIEW
      const cockPos = this.player.getCockpitWorldPosition();
      this.camera.position.copy(cockPos);
      const lookX = cockPos.x + forwardX * 60;
      const lookZ = cockPos.z + forwardZ * 60;
      this.camera.lookAt(lookX, cockPos.y, lookZ);

      // Subtle cockpit roll alignment
      this.camera.rotation.z = this.player.roll * 0.8;
      this.camera.fov = this.player.isBoosting ? 74 : 64;
      this.camera.updateProjectionMatrix();
    } else {
      // MODE 0 (Tactical Chase) & MODE 1 (Close Action Chase)
      // Tuned for crystal-clear forward dogfight sightlines (player in lower-third)
      const isClose = this.cameraMode === 1;
      const camDist = isClose ? 22 : 32;
      const camHeight = isClose ? 6.2 : 9.5;

      const targetCamX = this.player.position.x - forwardX * camDist;
      const targetCamZ = this.player.position.z - forwardZ * camDist;
      const targetCamY = camHeight;

      const followSpeed = isClose ? 15.0 : 13.5;
      this.camera.position.x += (targetCamX - this.camera.position.x) * (1 - Math.exp(-followSpeed * dt));
      this.camera.position.z += (targetCamZ - this.camera.position.z) * (1 - Math.exp(-followSpeed * dt));
      this.camera.position.y += (targetCamY - this.camera.position.y) * (1 - Math.exp(-followSpeed * dt));

      const targetFov = this.player.isBoosting ? 68 : 60;
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-5.0 * dt));
      this.camera.updateProjectionMatrix();

      // Look comfortably forward into the space battle arena
      const lookDist = isClose ? 55 : 68;
      const lookTargetX = this.player.position.x + forwardX * lookDist;
      const lookTargetZ = this.player.position.z + forwardZ * lookDist;
      const lookTargetY = isClose ? 2.6 : 3.4;
      this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
    }

    // Controlled Camera Shake (Cinematic without disorienting aim)
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 1.4;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 1.4;
      this.shake = Math.max(0, this.shake - dt * 3.5);
    }
  }

  addShake(amount) {
    this.shake = Math.min(1.5, this.shake + amount);
  }

  _onMissionComplete(def) {
    this.victoryModalActive = true;
    this.audio.sectorCleared();
    const rank = this.combo >= 4 ? 'S' : (this.combo >= 2 ? 'A' : 'B');
    const nextDef = MISSION_DEFINITIONS[this.currentLevel] || { title: 'MISSION COMPLETE' };

    this.hud.showVictoryModal(true, {
      title: `${def.title.toUpperCase()} SECURED`,
      rank,
      score: this.score,
      kills: this.levelKills,
      nextTitle: nextDef.title
    });
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onGameOver() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.audio.explode(true);
    this.particles.createShipExplosion(this.player.position, true);
    const def = MISSION_DEFINITIONS[this.currentLevel - 1] || { title: 'PATROL' };
    this.hud.showGameOverModal(true, {
      score: this.score,
      sector: `LEVEL 0${this.currentLevel}: ${def.title.toUpperCase()}`,
      kills: this.levelKills
    });
  }
}
