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

          <!-- Score & Multiplier -->
          <div class="hud-score-panel">
            <div class="score-display">
              <span class="score-label">SCORE</span>
              <span class="score-val" id="hud-score">000000</span>
            </div>
            <div class="combo-badge" id="hud-combo">x1 COMBO</div>
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
            <div class="w-slot" id="w-slot-3"><span class="w-key">3</span> MISSILES (<span id="hud-missiles-val">8</span>)</div>
            <div class="w-slot emp-slot" id="w-slot-emp"><span class="w-key">Q</span> EMP [READY]</div>
          </div>
        </div>

        <!-- Camera Mode Badge & Key Hints (Bottom Right) -->
        <div class="hud-hints">
          <div class="cam-badge" id="hud-cam-badge"><kbd>C</kbd> CAM: TACTICAL CHASE</div>
          <div class="hint-chip"><kbd>W</kbd>/<kbd>S</kbd> THRUST / BRAKE</div>
          <div class="hint-chip"><kbd>L-CLICK</kbd> FIRE // <kbd>R-CLICK</kbd>/<kbd>E</kbd> MISSILE</div>
          <div class="hint-chip"><kbd>Q</kbd> EMP DISCHARGE // <kbd>SHIFT</kbd> BOOST</div>
          <div class="hint-chip"><kbd>ESC</kbd> PAUSE MENU</div>
        </div>

        <!-- Mobile Touch Controls -->
        <div class="touch-controls" id="touch-controls">
          <div class="touch-stick" id="touch-stick-left">
            <div class="stick-knob" id="stick-knob-left"></div>
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
    this.empSlot = document.getElementById('w-slot-emp');
    this.camBadge = document.getElementById('hud-cam-badge');
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

    document.getElementById('btn-toggle-mute')?.addEventListener('click', () => {
      if (this.callbacks.onMute) this.callbacks.onMute();
    });
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
    // 1. Update Top Bar Score & Combo
    this.scoreEl.textContent = Math.floor(score).toString().padStart(6, '0');
    this.comboEl.textContent = `x${combo} COMBO`;
    this.comboEl.style.opacity = combo > 1 ? '1' : '0.4';

    // 2. Update Vitals
    const shieldPct = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
    const hullPct = Math.max(0, Math.min(100, (player.hull / player.maxHull) * 100));
    const energyPct = Math.max(0, Math.min(100, (player.energy / player.maxEnergy) * 100));
    const heatPct = Math.max(0, Math.min(100, player.heat * 100));

    this.shieldFill.style.width = `${shieldPct}%`;
    this.shieldVal.textContent = `${Math.round(shieldPct)}%`;

    this.hullFill.style.width = `${hullPct}%`;
    this.hullVal.textContent = `${Math.round(hullPct)}%`;

    this.energyFill.style.width = `${energyPct}%`;
    this.energyVal.textContent = `${Math.round(energyPct)}%`;

    this.heatFill.style.width = `${heatPct}%`;
    this.heatVal.textContent = player.overheated ? 'OVERHEAT' : `${Math.round(heatPct)}%`;
    this.heatVal.style.color = player.overheated ? 'var(--danger)' : '#fff';

    // 3. Update Weapons & Ordnance
    this.weaponLabel.textContent = player.selectedWeapon ? player.selectedWeapon.toUpperCase() : 'CANNONS';
    this.missilesVal.textContent = player.missiles;

    ['1', '2', '3'].forEach(k => {
      const el = document.getElementById(`w-slot-${k}`);
      if (el) el.classList.remove('active');
    });
    if (player.selectedWeapon === 'cannons') document.getElementById('w-slot-1')?.classList.add('active');
    else if (player.selectedWeapon === 'rapid') document.getElementById('w-slot-2')?.classList.add('active');
    else if (player.selectedWeapon === 'missiles') document.getElementById('w-slot-3')?.classList.add('active');

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

    // Center Crosshair
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

    if (!info || !info.inFront) return;

    const sx = info.screenX;
    const sy = info.screenY;
    const lx = info.leadScreenX;
    const ly = info.leadScreenY;

    // Target Diamond Box
    const isLock = info.isLocked;
    ctx.strokeStyle = isLock ? '#ff2244' : '#ffc247';
    ctx.lineWidth = 2;
    const size = 18;

    ctx.beginPath();
    ctx.moveTo(sx, sy - size);
    ctx.lineTo(sx + size, sy);
    ctx.lineTo(sx, sy + size);
    ctx.lineTo(sx - size, sy);
    ctx.closePath();
    ctx.stroke();

    // Target Info Label
    ctx.fillStyle = isLock ? '#ff2244' : '#ffc247';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${info.target.name || 'HOSTILE'} [${info.distance}m]`, sx + size + 6, sy - 4);

    // Target HP Mini Bar
    const hpPct = Math.max(0, (info.target.hp / info.target.maxHp));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(sx - size, sy + size + 4, size * 2, 4);
    ctx.fillStyle = isLock ? '#ff2244' : '#3ef0ff';
    ctx.fillRect(sx - size, sy + size + 4, size * 2 * hpPct, 4);

    // Predictive Dogfight Lead Pip (Where to aim!)
    ctx.strokeStyle = '#3ef0ff';
    ctx.fillStyle = 'rgba(62, 240, 255, 0.2)';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.arc(lx, ly, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lx - 5, ly); ctx.lineTo(lx + 5, ly);
    ctx.moveTo(lx, ly - 5); ctx.lineTo(lx, ly + 5);
    ctx.stroke();

    // Subtle lead guide dashed line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(62, 240, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.setLineDash([]);
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
