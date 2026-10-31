/**
 * Futuristic Cockpit Tactical HUD, 360° Radar & Boss Health Bar
 */
export class TacticalHUD {
  constructor(container) {
    this.container = container;
    this.feedMessages = [];
    this._buildDOM();
  }

  _buildDOM() {
    this.container.innerHTML = `
      <div class="hud-layer">
        <!-- Top Tactical Status Bar -->
        <header class="hud-top">
          <div class="hud-brand">
            <span class="hud-title">COSMIC EXPANSE</span>
            <span class="hud-sector" id="hud-sector-badge">SECTOR 01</span>
          </div>

          <!-- Dedicated Boss Health Bar (Active during Capital Boss Battles) -->
          <div class="hud-boss-bar-panel" id="hud-boss-panel" style="display: none;">
            <div class="boss-title-row">
              <span class="boss-warning-tag">WARNING: CAPITAL THREAT</span>
              <span class="boss-name" id="hud-boss-name">LEVIATHAN DREADNOUGHT</span>
            </div>
            <div class="boss-bars">
              <!-- Boss Shield -->
              <div class="boss-track">
                <div class="boss-fill boss-shield-fill" id="hud-boss-shield" style="width: 100%;"></div>
              </div>
              <!-- Boss Hull -->
              <div class="boss-track">
                <div class="boss-fill boss-hull-fill" id="hud-boss-hull" style="width: 100%;"></div>
              </div>
            </div>
          </div>

          <!-- Central Alert Announcement -->
          <div class="hud-center-alert" id="hud-announcement" style="display: none;">
            <div class="alert-box" id="hud-alert-text">SECTOR COMPLETED</div>
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

        <!-- Center Crosshair & Target Tracking Canvas -->
        <canvas class="hud-tracking-canvas" id="hud-tracking-canvas"></canvas>

        <!-- Lower Left: 360-Degree Tactical Radar -->
        <div class="hud-radar-panel">
          <div class="radar-glass">
            <canvas class="radar-canvas" id="hud-radar-canvas" width="140" height="140"></canvas>
            <div class="radar-sweep"></div>
          </div>
          <div class="radar-label">360° TACTICAL SCANNER</div>
        </div>

        <!-- Lower Center: Vitals (Shields, Hull, Boost, Weapon Power) -->
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
            <span class="vital-label" id="hud-weapon-label">LASER LV1</span>
            <div class="bar-track thin">
              <div class="bar-fill heat-fill" id="hud-heat-fill" style="width: 0%;"></div>
            </div>
            <span class="vital-val" id="hud-heat-val">OK</span>
          </div>
        </div>

        <!-- Key Hints (Bottom Right) -->
        <div class="hud-hints">
          <div class="hint-chip"><kbd>W</kbd> THRUST</div>
          <div class="hint-chip"><kbd>S</kbd> BRAKE</div>
          <div class="hint-chip"><kbd>MOUSE</kbd> STEER</div>
          <div class="hint-chip"><kbd>SPACE</kbd> / <kbd>L-CLICK</kbd> FIRE</div>
          <div class="hint-chip"><kbd>SHIFT</kbd> / <kbd>R-CLICK</kbd> BOOST</div>
        </div>

        <!-- Mobile Touch Overlay -->
        <div class="touch-controls" id="touch-controls">
          <div class="touch-stick" id="touch-stick-left">
            <div class="stick-knob" id="stick-knob-left"></div>
          </div>
          <div class="touch-buttons">
            <button class="touch-action-btn boost-btn" id="btn-touch-boost">BOOST</button>
            <button class="touch-action-btn fire-btn" id="btn-touch-fire">FIRE</button>
          </div>
        </div>
      </div>
    `;

    // Cache DOM
    this.scoreEl = document.getElementById('hud-score');
    this.comboEl = document.getElementById('hud-combo');
    this.sectorBadge = document.getElementById('hud-sector-badge');
    this.shieldFill = document.getElementById('hud-shield-fill');
    this.shieldVal = document.getElementById('hud-shield-val');
    this.hullFill = document.getElementById('hud-hull-fill');
    this.hullVal = document.getElementById('hud-hull-val');
    this.energyFill = document.getElementById('hud-energy-fill');
    this.energyVal = document.getElementById('hud-energy-val');
    this.heatFill = document.getElementById('hud-heat-fill');
    this.heatVal = document.getElementById('hud-heat-val');
    this.weaponLabel = document.getElementById('hud-weapon-label');
    this.feedEl = document.getElementById('hud-feed');
    this.announcementEl = document.getElementById('hud-announcement');
    this.alertTextEl = document.getElementById('hud-alert-text');

    // Boss Bar Elements
    this.bossPanel = document.getElementById('hud-boss-panel');
    this.bossName = document.getElementById('hud-boss-name');
    this.bossShield = document.getElementById('hud-boss-shield');
    this.bossHull = document.getElementById('hud-boss-hull');

    this.trackingCanvas = document.getElementById('hud-tracking-canvas');
    this.trackingCtx = this.trackingCanvas.getContext('2d');
    this.radarCanvas = document.getElementById('hud-radar-canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');

    this._resizeCanvases();
    window.addEventListener('resize', () => this._resizeCanvases());
  }

  _resizeCanvases() {
    this.trackingCanvas.width = window.innerWidth;
    this.trackingCanvas.height = window.innerHeight;
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

    while (this.feedEl.children.length > 5) {
      this.feedEl.removeChild(this.feedEl.firstChild);
    }

    setTimeout(() => {
      if (item.parentNode) {
        item.style.opacity = '0';
        setTimeout(() => item.remove(), 300);
      }
    }, 3500);
  }

  update(player, score, combo, sector, trackingInfo, radarData, time) {
    // 1. UPDATE VITALS
    const shieldPct = Math.round((player.shield / player.maxShield) * 100);
    const hullPct = Math.round((player.hull / player.maxHull) * 100);
    const energyPct = Math.round((player.energy / player.maxEnergy) * 100);
    const heatPct = Math.round(player.heat * 100);

    this.shieldFill.style.width = `${shieldPct}%`;
    this.shieldVal.textContent = `${shieldPct}%`;

    this.hullFill.style.width = `${hullPct}%`;
    this.hullVal.textContent = `${hullPct}%`;
    if (hullPct <= 25) {
      this.hullFill.style.background = '#ff2244';
      this.hullFill.classList.add('pulse-critical');
    } else if (hullPct <= 50) {
      this.hullFill.style.background = '#ffaa00';
      this.hullFill.classList.remove('pulse-critical');
    } else {
      this.hullFill.style.background = 'linear-gradient(90deg, #37e88a, #5cff9d)';
      this.hullFill.classList.remove('pulse-critical');
    }

    this.energyFill.style.width = `${energyPct}%`;
    this.energyVal.textContent = `${energyPct}%`;

    this.heatFill.style.width = `${heatPct}%`;
    if (player.overheated) {
      this.heatVal.textContent = 'OVERHEAT';
      this.heatVal.style.color = '#ff2244';
      this.heatFill.style.background = '#ff2244';
    } else {
      this.heatVal.textContent = `${heatPct}%`;
      this.heatVal.style.color = '#7d93a8';
      this.heatFill.style.background = 'linear-gradient(90deg, #ffaa00, #ff4400)';
    }

    // Weapon Level Badge
    this.weaponLabel.textContent = `LASER LV${player.weaponLevel}`;
    if (player.weaponLevel >= 2) {
      this.weaponLabel.style.color = '#ffc247';
    } else {
      this.weaponLabel.style.color = 'var(--muted)';
    }

    // 2. BOSS HEALTH BAR
    if (trackingInfo.bossData) {
      this.bossPanel.style.display = 'flex';
      this.bossName.textContent = trackingInfo.bossData.name;
      const bShieldPct = Math.max(0, Math.round((trackingInfo.bossData.shield / trackingInfo.bossData.maxShield) * 100));
      const bHullPct = Math.max(0, Math.round((trackingInfo.bossData.hp / trackingInfo.bossData.maxHp) * 100));
      this.bossShield.style.width = `${bShieldPct}%`;
      this.bossHull.style.width = `${bHullPct}%`;
    } else {
      this.bossPanel.style.display = 'none';
    }

    // 3. SCORE & SECTOR
    this.scoreEl.textContent = score.toString().padStart(6, '0');
    this.sectorBadge.textContent = `SECTOR ${sector.toString().padStart(2, '0')}`;
    this.comboEl.textContent = `x${combo} COMBO`;
    this.comboEl.style.opacity = combo > 1 ? '1' : '0.4';

    // 4. DRAW 2D TRACKING OVERLAY & RADAR
    this._renderTrackingOverlay(trackingInfo);
    this._renderRadar(player, radarData);
  }

  _renderTrackingOverlay(trackingInfo) {
    const ctx = this.trackingCtx;
    const w = this.trackingCanvas.width;
    const h = this.trackingCanvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!trackingInfo) return;

    // A. Primary Locked Target
    const target = trackingInfo.primaryTarget;
    if (target && target.isInView) {
      const x = target.screenX;
      const y = target.screenY;
      const size = target.isBoss ? 48 : Math.max(26, Math.min(60, 4200 / Math.max(10, target.dist)));

      ctx.save();
      ctx.strokeStyle = target.isBoss ? '#bf00ff' : '#ff3366';
      ctx.lineWidth = target.isBoss ? 3 : 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;

      const arm = size * 0.35;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x - size, y - size + arm);
      ctx.lineTo(x - size, y - size);
      ctx.lineTo(x - size + arm, y - size);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + size - arm, y - size);
      ctx.lineTo(x + size, y - size);
      ctx.lineTo(x + size, y - size + arm);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x - size, y + size - arm);
      ctx.lineTo(x - size, y + size);
      ctx.lineTo(x - size + arm, y + size);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + size - arm, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size, y + size - arm);
      ctx.stroke();

      // Target Name & Distance
      ctx.fillStyle = target.isBoss ? '#ff88ff' : '#ff88aa';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${target.name} [${target.dist}M]`, x, y - size - 8);

      // Micro Health Bar
      const barW = size * 1.8;
      const barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - barW / 2, y + size + 6, barW, barH);
      ctx.fillStyle = target.isBoss ? '#bf00ff' : '#ff2244';
      ctx.fillRect(x - barW / 2, y + size + 6, barW * target.hpRatio, barH);

      ctx.restore();
    }

    // B. Off-Screen Chevrons
    if (trackingInfo.allTargets) {
      ctx.save();
      trackingInfo.allTargets.forEach(t => {
        if (!t.isInView) {
          const cx = w / 2;
          const cy = h / 2;
          let dx = t.screenX - cx;
          let dy = t.screenY - cy;
          if (t.isBehind) {
            dx = -dx;
            dy = -dy;
          }

          const angle = Math.atan2(dy, dx);
          const margin = 35;
          const edgeX = Math.max(margin, Math.min(w - margin, cx + Math.cos(angle) * (w / 2 - margin)));
          const edgeY = Math.max(margin, Math.min(h - margin, cy + Math.sin(angle) * (h / 2 - margin)));

          ctx.fillStyle = t.isBoss ? '#bf00ff' : '#ff2244';
          ctx.save();
          ctx.translate(edgeX, edgeY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(t.isBoss ? 12 : 8, 0);
          ctx.lineTo(-6, -6);
          ctx.lineTo(-2, 0);
          ctx.lineTo(-6, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      });
      ctx.restore();
    }
  }

  _renderRadar(player, radarData) {
    const ctx = this.radarCtx;
    const size = 140;
    const center = size / 2;
    const radius = center - 6;
    const radarScale = radius / 360;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 14, 24, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(62, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    [0.35, 0.7, 1.0].forEach(rRatio => {
      ctx.beginPath();
      ctx.arc(center, center, radius * rRatio, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(62, 240, 255, 0.12)';
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(center, center - radius);
    ctx.lineTo(center, center + radius);
    ctx.moveTo(center - radius, center);
    ctx.lineTo(center + radius, center);
    ctx.strokeStyle = 'rgba(62, 240, 255, 0.15)';
    ctx.stroke();

    ctx.translate(center, center);
    ctx.rotate(-player.heading);

    // 1. Asteroids
    if (radarData.asteroids) {
      ctx.fillStyle = 'rgba(150, 170, 190, 0.6)';
      radarData.asteroids.forEach(ast => {
        const rx = (ast.x - player.position.x) * radarScale;
        const rz = (ast.z - player.position.z) * radarScale;
        if (Math.hypot(rx, rz) <= radius) ctx.fillRect(rx - 1.5, -rz - 1.5, 3, 3);
      });
    }

    // 2. Power-ups & Minerals
    if (radarData.powerups) {
      radarData.powerups.forEach(p => {
        const rx = (p.x - player.position.x) * radarScale;
        const rz = (p.z - player.position.z) * radarScale;
        if (Math.hypot(rx, rz) <= radius) {
          ctx.fillStyle = (p.type === 'shield_boost') ? '#5cff9d' : (p.type === 'weapon_upgrade' ? '#ffc247' : '#3ef0ff');
          ctx.fillRect(rx - 2, -rz - 2, 4, 4);
        }
      });
    }

    // 3. Enemy Drones & Boss
    if (radarData.drones) {
      radarData.drones.forEach(d => {
        const rx = (d.x - player.position.x) * radarScale;
        const rz = (d.z - player.position.z) * radarScale;
        if (Math.hypot(rx, rz) <= radius) {
          if (d.isBoss) {
            ctx.fillStyle = '#bf00ff';
            ctx.beginPath();
            ctx.arc(rx, -rz, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#ff2244';
            ctx.beginPath();
            ctx.arc(rx, -rz, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }

    // 4. Player Icon (Chevron)
    ctx.fillStyle = '#3ef0ff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
