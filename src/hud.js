/**
 * Futuristic Cockpit Tactical HUD, 360° Radar, Predictive Dogfight Lead Pip,
 * Mission Objectives, Weapon Status Rack, and Interactive Pause / Settings Menu.
 */
export class TacticalHUD {
  constructor(container) {
    this.container = container;
    this.feedMessages = [];
    this.callbacks = {};
    this._buildDOM();
  }

  _buildDOM() {
    this.container.innerHTML = `
      <div class="hud-layer">
        <!-- Top Tactical Status Bar -->
        <header class="hud-top">
          <div class="hud-brand">
            <span class="hud-title">HOVERDRIFT // COSMIC</span>
            <span class="hud-sector" id="hud-sector-badge">LEVEL 01: PATROL</span>
            <span class="hud-alt" id="hud-alt-badge" style="font-family: var(--mono); font-size: 10px; color: var(--cyan); letter-spacing: 0.12em; background: rgba(62,240,255,0.12); padding: 2px 7px; border-radius: 3px; border: 1px solid rgba(62,240,255,0.35);">ALT: 0m</span>
          </div>

          <!-- Mission Objective Panel (Top Left Center) -->
          <div class="hud-mission-panel">
            <div class="mission-title" id="hud-mission-title">MISSION 01: DEEP-SPACE PATROL</div>
            <div class="mission-objective" id="hud-mission-objective">OBJECTIVE: Neutralize hostile patrol [0/5]</div>
          </div>

          <!-- Dedicated Boss Health Bar (Active during Capital Boss Battles) -->
          <div class="hud-boss-bar-panel" id="hud-boss-panel" style="display: none;">
            <div class="boss-title-row">
              <span class="boss-warning-tag">WARNING: CAPITAL CLASS THREAT</span>
              <span class="boss-name" id="hud-boss-name">LEVIATHAN OMEGA DREADNOUGHT</span>
            </div>
            <div class="boss-bars">
              <div class="boss-track">
                <div class="boss-fill boss-shield-fill" id="hud-boss-shield" style="width: 100%;"></div>
              </div>
              <div class="boss-track">
                <div class="boss-fill boss-hull-fill" id="hud-boss-hull" style="width: 100%;"></div>
              </div>
            </div>
          </div>

          <!-- Central Alert Announcement -->
          <div class="hud-center-alert" id="hud-announcement" style="display: none;">
            <div class="alert-box" id="hud-alert-text">MISSION UPDATED</div>
          </div>

          <div class="hud-top-right">
            <!-- Score & Multiplier -->
            <div class="hud-score-panel">
              <div class="score-display">
                <span class="score-label">SCORE</span>
                <span class="score-val" id="hud-score">000000</span>
              </div>
              <div class="combo-badge" id="hud-combo">x1 COMBO</div>
            </div>

            <!-- Mobile & Tactical Action Buttons -->
            <div class="hud-top-actions">
              <button class="hud-action-pill" id="hud-btn-cam">CAM</button>
              <button class="hud-action-pill" id="hud-btn-pause">PAUSE ⏸</button>
            </div>
          </div>
        </header>

        <!-- Dynamic Combat Feed (Top Right) -->
        <div class="hud-feed" id="hud-feed"></div>

        <!-- Center Crosshair & Predictive Target Lead Canvas -->
        <canvas class="hud-tracking-canvas" id="hud-tracking-canvas"></canvas>

        <!-- First-Person Cockpit Canopy Frame Overlay (Visible in Cockpit Mode) -->
        <div class="cockpit-overlay" id="cockpit-overlay" style="display: none;">
          <div class="cockpit-frame-left"></div>
          <div class="cockpit-frame-right"></div>
          <div class="cockpit-hud-glass"></div>
        </div>

        <!-- Lower Left: 360-Degree Tactical Radar -->
        <div class="hud-radar-panel">
          <div class="radar-glass">
            <canvas class="radar-canvas" id="hud-radar-canvas" width="140" height="140"></canvas>
            <div class="radar-sweep"></div>
          </div>
          <div class="radar-label">360° TACTICAL SCANNER</div>
        </div>

        <!-- Lower Center: Vitals & Weapon Ordnance Rack -->
        <div class="hud-vitals">
          <!-- Shield Bar -->
          <div class="vital-row">
            <span class="vital-label">SHIELD</span>
            <div class="bar-track">
              <div class="bar-fill shield-fill" id="hud-shield-fill" style="width: 100%;"></div>
            </div>
            <span class="vital-val" id="hud-shield-val">100%</span>
          </div>

          <!-- Hull Bar -->
          <div class="vital-row">
            <span class="vital-label">HULL</span>
            <div class="bar-track">
              <div class="bar-fill hull-fill" id="hud-hull-fill" style="width: 100%;"></div>
            </div>
            <span class="vital-val" id="hud-hull-val">100%</span>
          </div>

          <!-- Boost / Energy Bar -->
          <div class="vital-row">
            <span class="vital-label">BOOST</span>
            <div class="bar-track thin">
              <div class="bar-fill energy-fill" id="hud-energy-fill" style="width: 100%;"></div>
            </div>
            <span class="vital-val" id="hud-energy-val">100%</span>
          </div>

          <!-- Weapon Status & Heat -->
          <div class="vital-row">
            <span class="vital-label" id="hud-weapon-label">CANNONS</span>
            <div class="bar-track thin">
              <div class="bar-fill heat-fill" id="hud-heat-fill" style="width: 0%;"></div>
            </div>
            <span class="vital-val" id="hud-heat-val">OK</span>
          </div>

          <!-- Weapon Ordnance Selector Rack -->
          <div class="weapons-rack">
            <div class="w-slot active" id="w-slot-1"><span class="w-key">1</span> CANNONS</div>
            <div class="w-slot" id="w-slot-2"><span class="w-key">2</span> GATLING</div>
            <div class="w-slot" id="w-slot-3"><span class="w-key">3</span> <span id="hud-missile-mode">HOMING</span> (<span id="hud-missiles-val">8</span>)</div>
            <div class="w-slot emp-slot" id="w-slot-emp"><span class="w-key">Q</span> EMP [READY]</div>
          </div>
        </div>

        <!-- Camera Mode Badge & Key Hints (Bottom Right) -->
        <div class="hud-hints">
          <div class="cam-badge" id="hud-cam-badge"><kbd>V</kbd> CAM: TACTICAL CHASE</div>
          <div class="hint-chip"><kbd>W</kbd>/<kbd>S</kbd> THRUST / BRAKE</div>
          <div class="hint-chip"><kbd>R</kbd>/<kbd>F</kbd> CLIMB UP / DIVE DOWN</div>
          <div class="hint-chip"><kbd>MOUSE</kbd> 3D AIM & PITCH // <kbd>L-CLICK</kbd> FIRE</div>
          <div class="hint-chip"><kbd>R-CLICK</kbd>/<kbd>E</kbd> MISSILE // <kbd>X</kbd> TYPE // <kbd>Q</kbd> EMP</div>
          <div class="hint-chip"><kbd>ESC</kbd> PAUSE MENU</div>
        </div>

        <!-- Mobile Touch Controls -->
        <div class="touch-controls" id="touch-controls">
          <div class="touch-stick" id="touch-stick-left">
            <div class="stick-knob" id="stick-knob-left"></div>
          </div>
          <!-- Mobile Dedicated Altitude Thrusters -->
          <div class="touch-altitude-buttons">
            <button class="touch-alt-btn" id="btn-touch-climb">▲ UP</button>
            <button class="touch-alt-btn" id="btn-touch-dive">▼ DN</button>
          </div>
          <div class="touch-buttons">
            <button class="touch-action-btn boost-btn" id="btn-touch-boost">BOOST</button>
            <button class="touch-action-btn missile-btn" id="btn-touch-missile">MISSILE</button>
            <button class="touch-action-btn fire-btn" id="btn-touch-fire">FIRE</button>
          </div>
        </div>

        <!-- Interactive Pause & Settings Menu -->
        <div class="hud-modal" id="pause-modal" style="display: none;">
          <div class="modal-card">
            <h2 class="modal-title">MISSION PAUSED</h2>
            <div class="modal-sub">HOVERDRIFT // TACTICAL COMMAND</div>
            <div class="modal-buttons">
              <button class="modal-btn primary" id="btn-resume-mission">RESUME MISSION [ESC]</button>
              <button class="modal-btn" id="btn-restart-mission">RESTART CURRENT MISSION</button>
            </div>

            <div class="modal-section-title">SELECT MISSION DEPLOYMENT</div>
            <div class="level-select-grid">
              <button class="lvl-select-btn" data-lvl="1">M1: PATROL</button>
              <button class="lvl-select-btn" data-lvl="2">M2: ASTEROIDS</button>
              <button class="lvl-select-btn" data-lvl="3">M3: ORBITAL</button>
              <button class="lvl-select-btn" data-lvl="4">M4: NEBULA</button>
              <button class="lvl-select-btn" data-lvl="5">M5: CAPITAL</button>
            </div>

            <div class="modal-settings">
              <div class="setting-item">
                <span>AUDIO VOLUME</span>
                <input type="range" id="setting-vol-slider" min="0" max="1" step="0.05" value="0.7">
              </div>
              <button class="modal-btn small" id="btn-toggle-mute">MUTE AUDIO</button>
            </div>

            <div class="modal-settings" style="margin-top: 8px;">
              <div class="setting-item" style="width: 100%; justify-content: space-between;">
                <span>JOYSTICK & FLIGHT SENSITIVITY</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="range" id="setting-sens-slider" min="0.3" max="2.0" step="0.05" value="0.9">
                  <span id="setting-sens-val" style="font-family: var(--mono); color: var(--cyan); min-width: 44px; text-align: right;">90%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mission Accomplished Modal -->
        <div class="hud-modal" id="victory-modal" style="display: none;">
          <div class="modal-card victory-card">
            <h1 class="modal-title victory-glow">MISSION ACCOMPLISHED</h1>
            <div class="modal-sub" id="vic-sub-title">SECTOR SECURED</div>
            <div class="victory-rank-badge" id="vic-rank">RANK: S</div>
            <div class="vic-stats-grid">
              <div class="v-stat"><span>SCORE</span><b id="vic-score">000000</b></div>
              <div class="v-stat"><span>HOSTILES DESTROYED</span><b id="vic-kills">0</b></div>
              <div class="v-stat"><span>NEXT MISSION</span><b id="vic-next-title">LEVEL 02</b></div>
            </div>
            <button class="modal-btn primary" id="btn-proceed-mission">LAUNCH NEXT MISSION</button>
          </div>
        </div>

        <!-- Mission Failed / Redeploy Modal -->
        <div class="hud-modal" id="gameover-modal" style="display: none;">
          <div class="modal-card" style="border-color: rgba(255, 34, 68, 0.45); box-shadow: 0 0 32px rgba(255, 34, 68, 0.25);">
            <h1 class="modal-title" style="color: var(--danger); text-shadow: 0 0 20px rgba(255, 34, 68, 0.7);">STARFIGHTER DESTROYED</h1>
            <div class="modal-sub">TACTICAL EMERGENCY EVACUATION PROTOCOL</div>
            <div class="vic-stats-grid">
              <div class="v-stat"><span>SCORE</span><b id="go-score">000000</b></div>
              <div class="v-stat"><span>SECTOR</span><b id="go-sector">SECTOR 01</b></div>
              <div class="v-stat"><span>HOSTILES ELIMINATED</span><b id="go-kills">0</b></div>
            </div>
            <div class="modal-buttons" style="margin-top: 14px;">
              <button class="modal-btn primary" id="btn-redeploy-mission" style="background: linear-gradient(90deg, #ff2244, #ff6600); border-color: #ff3366; color: #fff;">REDEPLOY STARFIGHTER [RETRY]</button>
              <button class="modal-btn" id="btn-go-hangar">RETURN TO HANGAR BAY</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cache DOM
    this.scoreEl = document.getElementById('hud-score');
    this.comboEl = document.getElementById('hud-combo');
    this.sectorBadge = document.getElementById('hud-sector-badge');
    this.missionTitle = document.getElementById('hud-mission-title');
    this.missionObjective = document.getElementById('hud-mission-objective');
    this.shieldFill = document.getElementById('hud-shield-fill');
    this.shieldVal = document.getElementById('hud-shield-val');
    this.hullFill = document.getElementById('hud-hull-fill');
    this.hullVal = document.getElementById('hud-hull-val');
    this.energyFill = document.getElementById('hud-energy-fill');
    this.energyVal = document.getElementById('hud-energy-val');
    this.heatFill = document.getElementById('hud-heat-fill');
    this.heatVal = document.getElementById('hud-heat-val');
    this.weaponLabel = document.getElementById('hud-weapon-label');
    this.missilesVal = document.getElementById('hud-missiles-val');
    this.missileModeEl = document.getElementById('hud-missile-mode');
    this.empSlot = document.getElementById('w-slot-emp');
    this.wSlot1 = document.getElementById('w-slot-1');
    this.wSlot2 = document.getElementById('w-slot-2');
    this.wSlot3 = document.getElementById('w-slot-3');
    this.camBadge = document.getElementById('hud-cam-badge');
    this.altBadgeEl = document.getElementById('hud-alt-badge');

    // DOM Dirty-Checking State (eliminates 60 FPS layout recalculations & UI stutter)
    this._lastScore = -1;
    this._lastCombo = -1;
    this._lastShield = -1;
    this._lastHull = -1;
    this._lastEnergy = -1;
    this._lastHeat = -1;
    this._lastWeapon = '';
    this._lastMissiles = -1;
    this._lastMissileMode = '';
    this.cockpitOverlay = document.getElementById('cockpit-overlay');
    this.feedEl = document.getElementById('hud-feed');
    this.announcementEl = document.getElementById('hud-announcement');
    this.alertTextEl = document.getElementById('hud-alert-text');

    // Boss Panel
    this.bossPanel = document.getElementById('hud-boss-panel');
    this.bossName = document.getElementById('hud-boss-name');
    this.bossShield = document.getElementById('hud-boss-shield');
    this.bossHull = document.getElementById('hud-boss-hull');

    // Modals
    this.pauseModal = document.getElementById('pause-modal');
    this.victoryModal = document.getElementById('victory-modal');
    this.gameOverModal = document.getElementById('gameover-modal');

    // Canvases
    this.trackingCanvas = document.getElementById('hud-tracking-canvas');
    this.trackingCtx = this.trackingCanvas.getContext('2d');
    this.radarCanvas = document.getElementById('hud-radar-canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');

    this._bindModalEvents();
    this._resizeCanvases();
    window.addEventListener('resize', () => this._resizeCanvases());
  }

  _bindModalEvents() {
    document.getElementById('btn-resume-mission')?.addEventListener('click', () => {
      if (this.callbacks.onResume) this.callbacks.onResume();
    });
    document.getElementById('btn-restart-mission')?.addEventListener('click', () => {
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });
    document.getElementById('btn-proceed-mission')?.addEventListener('click', () => {
      if (this.callbacks.onNextMission) this.callbacks.onNextMission();
    });

    document.querySelectorAll('.lvl-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.dataset.lvl, 10);
        if (this.callbacks.onSelectLevel) this.callbacks.onSelectLevel(lvl);
      });
    });

    const volSlider = document.getElementById('setting-vol-slider');
    volSlider?.addEventListener('input', (e) => {
      if (this.callbacks.onVolume) this.callbacks.onVolume(parseFloat(e.target.value));
    });

    const sensSlider = document.getElementById('setting-sens-slider');
    const sensValLabel = document.getElementById('setting-sens-val');
    sensSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (sensValLabel) sensValLabel.textContent = Math.round(val * 100) + '%';
      if (this.callbacks.onSensitivity) this.callbacks.onSensitivity(val);
    });

    document.getElementById('btn-toggle-mute')?.addEventListener('click', () => {
      if (this.callbacks.onMute) this.callbacks.onMute();
    });

    document.getElementById('hud-btn-pause')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
    });

    document.getElementById('hud-btn-cam')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.callbacks.onCycleCamera) this.callbacks.onCycleCamera();
    });

    document.getElementById('btn-redeploy-mission')?.addEventListener('click', () => {
      this.showGameOverModal(false);
      if (this.callbacks.onRedeploy) this.callbacks.onRedeploy();
    });

    document.getElementById('btn-go-hangar')?.addEventListener('click', () => {
      this.showGameOverModal(false);
      if (this.callbacks.onGoHangar) this.callbacks.onGoHangar();
    });
  }

  bindTouchInput(inputController) {
    if (!inputController) return;
    const stick = document.getElementById('touch-stick-left');
    const knob = document.getElementById('stick-knob-left');
    const btnTouchBoost = document.getElementById('btn-touch-boost');
    const btnTouchMissile = document.getElementById('btn-touch-missile');
    const btnTouchFire = document.getElementById('btn-touch-fire');
    const btnTouchClimb = document.getElementById('btn-touch-climb');
    const btnTouchDive = document.getElementById('btn-touch-dive');

    if (btnTouchClimb) {
      btnTouchClimb.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.climb = true;
      }, { passive: false });
      btnTouchClimb.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.climb = false;
      }, { passive: false });
      btnTouchClimb.addEventListener('touchcancel', () => {
        inputController.touch.climb = false;
      }, { passive: true });
    }

    if (btnTouchDive) {
      btnTouchDive.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.dive = true;
      }, { passive: false });
      btnTouchDive.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.dive = false;
      }, { passive: false });
      btnTouchDive.addEventListener('touchcancel', () => {
        inputController.touch.dive = false;
      }, { passive: true });
    }

    if (stick && knob) {
      let activeTouchId = null;
      let startX = 0, startY = 0;

      stick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        const rect = stick.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        inputController.touch.active = true;
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (activeTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === activeTouchId) {
            e.preventDefault();
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const dist = Math.hypot(dx, dy);
            const maxRadius = 45;
            const clampedDist = Math.min(maxRadius, dist);
            const angle = Math.atan2(dy, dx);
            const knobX = Math.cos(angle) * clampedDist;
            const knobY = Math.sin(angle) * clampedDist;

            knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

            inputController.touch.thrust = -dy / maxRadius;
            inputController.touch.steer = dx / maxRadius;
          }
        }
      }, { passive: false });

      const resetStick = (e) => {
        if (activeTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            activeTouchId = null;
            knob.style.transition = 'transform 0.15s ease-out';
            knob.style.transform = 'translate(-50%, -50%)';
            setTimeout(() => { knob.style.transition = ''; }, 160);
            inputController.touch.thrust = 0;
            inputController.touch.steer = 0;
            inputController.touch.active = false;
          }
        }
      };

      window.addEventListener('touchend', resetStick, { passive: true });
      window.addEventListener('touchcancel', resetStick, { passive: true });
    }

    if (btnTouchBoost) {
      btnTouchBoost.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.boost = true;
      }, { passive: false });
      btnTouchBoost.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.boost = false;
      }, { passive: false });
      btnTouchBoost.addEventListener('touchcancel', () => {
        inputController.touch.boost = false;
      }, { passive: true });
    }

    if (btnTouchMissile) {
      btnTouchMissile.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.missile = true;
      }, { passive: false });
      btnTouchMissile.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.missile = false;
      }, { passive: false });
      btnTouchMissile.addEventListener('touchcancel', () => {
        inputController.touch.missile = false;
      }, { passive: true });
    }

    if (btnTouchFire) {
      btnTouchFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.fire = true;
      }, { passive: false });
      btnTouchFire.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputController.touch.fire = false;
      }, { passive: false });
      btnTouchFire.addEventListener('touchcancel', () => {
        inputController.touch.fire = false;
      }, { passive: true });
    }
  }

  _resizeCanvases() {
    this.trackingCanvas.width = window.innerWidth;
    this.trackingCanvas.height = window.innerHeight;
  }

  setCallbacks(cbs) {
    this.callbacks = cbs;
  }

  showPauseMenu(show) {
    this.pauseModal.style.display = show ? 'flex' : 'none';
  }

  showVictoryModal(show, data = {}) {
    this.victoryModal.style.display = show ? 'flex' : 'none';
    if (show && data) {
      document.getElementById('vic-sub-title').textContent = data.title || 'SECTOR SECURED';
      document.getElementById('vic-rank').textContent = `RANK: ${data.rank || 'S'}`;
      document.getElementById('vic-score').textContent = (data.score || 0).toString().padStart(6, '0');
      document.getElementById('vic-kills').textContent = data.kills || 0;
      document.getElementById('vic-next-title').textContent = data.nextTitle || 'NEXT SECTOR';
    }
  }

  showGameOverModal(show, data = {}) {
    this.gameOverModal.style.display = show ? 'flex' : 'none';
    if (show && data) {
      const sEl = document.getElementById('go-score');
      const secEl = document.getElementById('go-sector');
      const kEl = document.getElementById('go-kills');
      if (sEl) sEl.textContent = (data.score || 0).toString().padStart(6, '0');
      if (secEl) secEl.textContent = data.sector || 'SECTOR 01';
      if (kEl) kEl.textContent = data.kills || 0;
    }
  }

  showAnnouncement(text, durationMs = 2800) {
    this.alertTextEl.textContent = text;
    this.announcementEl.style.display = 'block';
    clearTimeout(this.announcementTimeout);
    this.announcementTimeout = setTimeout(() => {
      this.announcementEl.style.display = 'none';
    }, durationMs);
  }

  addFeedMessage(text, color = '#3ef0ff') {
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.style.color = color;
    item.textContent = text;
    this.feedEl.appendChild(item);

    setTimeout(() => {
      item.style.opacity = '0';
      item.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => item.remove(), 500);
    }, 4500);

    while (this.feedEl.children.length > 5) {
      this.feedEl.removeChild(this.feedEl.children[0]);
    }
  }

  setMissionInfo(levelNum, levelName, objectiveText) {
    this.sectorBadge.textContent = `LEVEL 0${levelNum}: ${levelName.toUpperCase()}`;
    this.missionTitle.textContent = `MISSION 0${levelNum}: ${levelName.toUpperCase()}`;
    this.missionObjective.textContent = `OBJECTIVE: ${objectiveText}`;
  }

  setCameraMode(modeName, isCockpit = false) {
    this.camBadge.innerHTML = `<kbd>C</kbd> CAM: ${modeName.toUpperCase()}`;
    this.cockpitOverlay.style.display = isCockpit ? 'block' : 'none';
  }

  update(player, score, combo, levelNum, trackingInfo, radarData, time, missionStats) {
    if (this.altBadgeEl) {
      const altM = Math.round(player.position.y * 10);
      this.altBadgeEl.textContent = `ALT: ${altM >= 0 ? '+' : ''}${altM}m`;
    }

    // 1. Dirty-check Score & Combo
    const intScore = Math.floor(score);
    if (this._lastScore !== intScore) {
      this._lastScore = intScore;
      this.scoreEl.textContent = intScore.toString().padStart(6, '0');
    }
    if (this._lastCombo !== combo) {
      this._lastCombo = combo;
      this.comboEl.textContent = `x${combo} COMBO`;
      this.comboEl.style.opacity = combo > 1 ? '1' : '0.4';
    }

    // 2. Dirty-check Vitals (rounded to integers to eliminate fractional layout thrashing)
    const sRound = Math.round(Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100)));
    if (this._lastShield !== sRound) {
      this._lastShield = sRound;
      this.shieldFill.style.width = `${sRound}%`;
      this.shieldVal.textContent = `${sRound}%`;
    }

    const hRound = Math.round(Math.max(0, Math.min(100, (player.hull / player.maxHull) * 100)));
    if (this._lastHull !== hRound) {
      this._lastHull = hRound;
      this.hullFill.style.width = `${hRound}%`;
      this.hullVal.textContent = `${hRound}%`;
    }

    const eRound = Math.round(Math.max(0, Math.min(100, (player.energy / player.maxEnergy) * 100)));
    if (this._lastEnergy !== eRound) {
      this._lastEnergy = eRound;
      this.energyFill.style.width = `${eRound}%`;
      this.energyVal.textContent = `${eRound}%`;
    }

    const heatRound = player.overheated ? -99 : Math.round(Math.max(0, Math.min(100, player.heat * 100)));
    if (this._lastHeat !== heatRound) {
      this._lastHeat = heatRound;
      if (player.overheated) {
        this.heatFill.style.width = '100%';
        this.heatVal.textContent = 'OVERHEAT';
        this.heatVal.style.color = 'var(--danger)';
      } else {
        this.heatFill.style.width = `${heatRound}%`;
        this.heatVal.textContent = `${heatRound}%`;
        this.heatVal.style.color = '#fff';
      }
    }

    // 3. Dirty-check Weapons & Missiles
    const curW = player.selectedWeapon || 'cannons';
    if (this._lastWeapon !== curW) {
      this._lastWeapon = curW;
      this.weaponLabel.textContent = curW.toUpperCase();
      this.wSlot1?.classList.toggle('active', curW === 'cannons');
      this.wSlot2?.classList.toggle('active', curW === 'rapid');
      this.wSlot3?.classList.toggle('active', curW === 'missiles');
    }

    if (this._lastMissiles !== player.missiles) {
      this._lastMissiles = player.missiles;
      this.missilesVal.textContent = player.missiles;
    }

    const curMissileMode = (player.missileMode || 'homing').toUpperCase();
    if (this._lastMissileMode !== curMissileMode && this.missileModeEl) {
      this._lastMissileMode = curMissileMode;
      this.missileModeEl.textContent = curMissileMode;
    }

    if (this.empSlot) {
      if (player.empCooldown <= 0) {
        this.empSlot.classList.add('ready');
        this.empSlot.innerHTML = `<span class="w-key">Q</span> EMP [READY]`;
      } else {
        this.empSlot.classList.remove('ready');
        this.empSlot.innerHTML = `<span class="w-key">Q</span> EMP [${Math.ceil(player.empCooldown)}s]`;
      }
    }

    // 4. Update Mission Objective Progress
    if (missionStats && missionStats.objectiveText) {
      this.missionObjective.textContent = `OBJECTIVE: ${missionStats.objectiveText}`;
    }

    // 5. Boss Bar
    if (missionStats && missionStats.boss) {
      const b = missionStats.boss;
      this.bossPanel.style.display = 'block';
      this.bossName.textContent = b.name;
      this.bossShield.style.width = `${Math.max(0, (b.shield / b.maxShield) * 100)}%`;
      this.bossHull.style.width = `${Math.max(0, (b.hp / b.maxHp) * 100)}%`;
    } else {
      this.bossPanel.style.display = 'none';
    }

    // 6. Draw Predictive Dogfight Lead Pip on Tracking Canvas
    this._renderTrackingHUD(trackingInfo, time);

    // 7. Render 360° Tactical Radar
    this._renderRadar(player, radarData);
  }

  _renderTrackingHUD(info, time) {
    const ctx = this.trackingCtx;
    ctx.clearRect(0, 0, this.trackingCanvas.width, this.trackingCanvas.height);

    const centerX = this.trackingCanvas.width / 2;
    const centerY = this.trackingCanvas.height / 2;

    // 1. Center Flight Crosshair
    ctx.strokeStyle = 'rgba(62, 240, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - 24, centerY); ctx.lineTo(centerX - 8, centerY);
    ctx.moveTo(centerX + 8, centerY); ctx.lineTo(centerX + 24, centerY);
    ctx.moveTo(centerX, centerY - 24); ctx.lineTo(centerX, centerY - 8);
    ctx.moveTo(centerX, centerY + 8); ctx.lineTo(centerX, centerY + 24);
    ctx.stroke();

    if (!info) return;

    const allTargets = info.targets || (info.primary ? [info.primary] : []);
    const primary = info.primary || null;

    // 2. Render Secondary / Off-Screen Hostiles First
    allTargets.forEach(t => {
      const isPrimary = primary && (t.target === primary.target);
      if (isPrimary && t.isOnScreen) return; // Primary on-screen rendered prominently in pass 3

      if (t.isOnScreen) {
        // Secondary On-Screen Hostile (Clean subtle red tactical bracket)
        const size = t.isBoss ? 26 : 14;
        ctx.strokeStyle = t.isBoss ? '#bf00ff' : 'rgba(255, 68, 68, 0.75)';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        // Top-Left corner
        ctx.moveTo(t.screenX - size, t.screenY - size + 5);
        ctx.lineTo(t.screenX - size, t.screenY - size);
        ctx.lineTo(t.screenX - size + 5, t.screenY - size);
        // Top-Right corner
        ctx.moveTo(t.screenX + size - 5, t.screenY - size);
        ctx.lineTo(t.screenX + size, t.screenY - size);
        ctx.lineTo(t.screenX + size, t.screenY - size + 5);
        // Bottom-Right corner
        ctx.moveTo(t.screenX + size, t.screenY + size - 5);
        ctx.lineTo(t.screenX + size, t.screenY + size);
        ctx.lineTo(t.screenX + size - 5, t.screenY + size);
        // Bottom-Left corner
        ctx.moveTo(t.screenX - size + 5, t.screenY + size);
        ctx.lineTo(t.screenX - size, t.screenY + size);
        ctx.lineTo(t.screenX - size, t.screenY + size - 5);
        ctx.stroke();

        // Distance readout
        ctx.fillStyle = 'rgba(255, 100, 100, 0.85)';
        ctx.font = '9px ui-monospace, monospace';
        ctx.fillText(`${t.distance}m`, t.screenX + size + 4, t.screenY + 3);
      } else {
        // Off-Screen Directional Indicator (Edge Chevron + Distance)
        const angle = t.edgeAngle;
        const ex = t.edgeX;
        const ey = t.edgeY;

        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);

        ctx.fillStyle = t.isBoss ? '#bf00ff' : (isPrimary ? '#ff2244' : 'rgba(255, 68, 68, 0.85)');
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Off-screen distance tag pinned adjacent to chevron
        ctx.fillStyle = '#ff8888';
        ctx.font = '8.5px ui-monospace, monospace';
        const tagX = Math.max(12, Math.min(this.trackingCanvas.width - 50, ex + Math.cos(angle) * 14 - 15));
        const tagY = Math.max(16, Math.min(this.trackingCanvas.height - 10, ey + Math.sin(angle) * 14 + 4));
        ctx.fillText(`${t.distance}m`, tagX, tagY);
      }
    });

    // 3. Render Primary Locked Target with Full Dogfight Computer
    if (primary && primary.isOnScreen) {
      const sx = primary.screenX;
      const sy = primary.screenY;
      const lx = primary.leadScreenX;
      const ly = primary.leadScreenY;

      const isLock = primary.isLocked;
      const size = primary.isBoss ? 32 : 20;

      // Primary Diamond Target Reticle
      ctx.strokeStyle = isLock ? '#ff2244' : '#3ef0ff';
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(sx, sy - size);
      ctx.lineTo(sx + size, sy);
      ctx.lineTo(sx, sy + size);
      ctx.lineTo(sx - size, sy);
      ctx.closePath();
      ctx.stroke();

      // Corner Tech Brackets
      const bSize = size + 6;
      ctx.strokeStyle = isLock ? 'rgba(255, 34, 68, 0.8)' : 'rgba(62, 240, 255, 0.7)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(sx - bSize, sy - bSize + 6); ctx.lineTo(sx - bSize, sy - bSize); ctx.lineTo(sx - bSize + 6, sy - bSize);
      ctx.moveTo(sx + bSize - 6, sy - bSize); ctx.lineTo(sx + bSize, sy - bSize); ctx.lineTo(sx + bSize, sy - bSize + 6);
      ctx.moveTo(sx + bSize, sy + bSize - 6); ctx.lineTo(sx + bSize, sy + bSize); ctx.lineTo(sx + bSize - 6, sy + bSize);
      ctx.moveTo(sx - bSize + 6, sy + bSize); ctx.lineTo(sx - bSize, sy + bSize); ctx.lineTo(sx - bSize, sy + bSize - 6);
      ctx.stroke();

      // Target Name & Distance Banner
      ctx.fillStyle = isLock ? '#ff3b3b' : '#3ef0ff';
      ctx.font = '10.5px ui-monospace, monospace';
      ctx.fillText(`${primary.name} [${primary.distance}m]`, sx + size + 8, sy - 6);

      // Segmented Shield & Hull Mini Health Bars
      const barW = size * 2.2;
      const barH = 3.5;
      const barX = sx - barW / 2;
      const barY = sy + size + 8;

      if (primary.maxShield > 0) {
        const shPct = Math.max(0, primary.shield / primary.maxShield);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(barX, barY - 5, barW, 2.5);
        ctx.fillStyle = '#bf00ff';
        ctx.fillRect(barX, barY - 5, barW * shPct, 2.5);
      }

      const hpPct = Math.max(0, primary.hp / primary.maxHp);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = isLock ? '#ff2244' : '#5cff9d';
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // Predictive Dogfight Lead Pip (Aim Here to Hit!)
      ctx.strokeStyle = '#3ef0ff';
      ctx.fillStyle = 'rgba(62, 240, 255, 0.25)';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.arc(lx, ly, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(lx - 6, ly); ctx.lineTo(lx + 6, ly);
      ctx.moveTo(lx, ly - 6); ctx.lineTo(lx, ly + 6);
      ctx.stroke();

      // Subtle dashed flight vector lead guide
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(62, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  _renderRadar(player, data) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radarScale = 0.28;

    ctx.clearRect(0, 0, w, h);

    // Range concentric rings
    ctx.strokeStyle = 'rgba(62, 240, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();

    const pX = player.position.x;
    const pZ = player.position.z;
    const heading = player.heading;

    const toRadarCoord = (worldX, worldZ) => {
      const dx = worldX - pX;
      const dz = worldZ - pZ;
      const rx = (dx * Math.cos(-heading) - dz * Math.sin(-heading)) * radarScale;
      const rz = (dx * Math.sin(-heading) + dz * Math.cos(-heading)) * radarScale;
      return { x: cx + rx, y: cy - rz };
    };

    // Draw Asteroids
    if (data.asteroids) {
      ctx.fillStyle = 'rgba(255, 194, 71, 0.45)';
      data.asteroids.forEach(a => {
        const pt = toRadarCoord(a.x, a.z);
        if (Math.hypot(pt.x - cx, pt.y - cy) < 64) {
          ctx.fillRect(pt.x - 1, pt.y - 1, 2, 2);
        }
      });
    }

    // Draw Enemies
    if (data.drones) {
      data.drones.forEach(d => {
        const pt = toRadarCoord(d.x, d.z);
        if (Math.hypot(pt.x - cx, pt.y - cy) < 66) {
          ctx.fillStyle = d.isBoss ? '#bf00ff' : '#ff2244';
          const sz = d.isBoss ? 4.5 : 2.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw Player Ship at Center
    ctx.fillStyle = '#3ef0ff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4.5);
    ctx.lineTo(cx + 3.5, cy + 3.5);
    ctx.lineTo(cx - 3.5, cy + 3.5);
    ctx.closePath();
    ctx.fill();
  }
}
