const fs = require('fs');

try {
  const texturesCode = fs.readFileSync('src/textures.js', 'utf8')
    .replace(/export const/g, 'const')
    .replace(/export function/g, 'function');
  const audioCode = fs.readFileSync('src/audio.js', 'utf8').replace(/export /g, '');
  const shipCode = fs.readFileSync('src/ship.js', 'utf8')
    .replace(/import .*\n/g, '')
    .replace(/export const/g, 'const')
    .replace(/export class/g, 'class');
  const envCode = fs.readFileSync('src/environment.js', 'utf8').replace(/export /g, '');
  const astCode = fs.readFileSync('src/asteroids.js', 'utf8').replace(/export /g, '');
  const droneCode = fs.readFileSync('src/drones.js', 'utf8').replace(/export /g, '');
  const particleCode = fs.readFileSync('src/particles.js', 'utf8').replace(/export /g, '');
  const controlsCode = fs.readFileSync('src/controls.js', 'utf8').replace(/export /g, '');
  const hudCode = fs.readFileSync('src/hud.js', 'utf8').replace(/export /g, '');
  const gameCode = fs.readFileSync('src/game.js', 'utf8')
    .replace(/import .*\n/g, '')
    .replace(/export /g, '');

  const template = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#03060c" />
  <meta name="description" content="HOVERDRIFT: COSMIC EXPANSE — Photorealistic 360° space combat starfighter simulation with custom reference ships, PBR nebulae, interactive hangar bay, and capital boss battles." />
  <title>HOVERDRIFT: COSMIC EXPANSE</title>

  <!-- Offline / Local Fallback Three.js with CDN safety -->
  <script src="./three.min.js"></script>
  <script src="./public/three.min.js"></script>
  <script>
    if (typeof THREE === 'undefined') {
      document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\\\\/script>');
    }
  </script>

  <style>
    :root {
      --bg: #02040a;
      --ink: #e3f3ff;
      --muted: #7d93a8;
      --cyan: #3ef0ff;
      --cyan-glow: rgba(62, 240, 255, 0.45);
      --orange: #ff7700;
      --orange-glow: rgba(255, 119, 0, 0.5);
      --green: #5cff9d;
      --danger: #ff2244;
      --amber: #ffc247;
      --purple: #bf00ff;
      --panel-bg: rgba(6, 14, 24, 0.85);
      --panel-line: rgba(110, 180, 220, 0.22);
      --font: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --mono: ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      overscroll-behavior: none;
    }

    #viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      cursor: crosshair;
    }

    .vignette {
      pointer-events: none;
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.8) 100%);
      z-index: 2;
    }

    .scanlines {
      pointer-events: none;
      position: absolute;
      inset: 0;
      opacity: 0.16;
      background: repeating-linear-gradient(rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 3px);
      z-index: 2;
    }

    .hud {
      pointer-events: none;
      position: absolute;
      inset: 0;
      z-index: 4;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .hud-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 18px 24px;
      gap: 16px;
    }

    .hud-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hud-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.22em;
      color: #fff;
      text-shadow: 0 0 14px var(--cyan-glow);
    }

    .hud-sector {
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: var(--orange);
      background: rgba(255, 119, 0, 0.12);
      border: 1px solid var(--orange);
      padding: 3px 8px;
      border-radius: 2px;
      box-shadow: 0 0 10px var(--orange-glow);
    }

    .hud-boss-bar-panel {
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      width: min(520px, 90vw);
      background: rgba(14, 8, 22, 0.88);
      border: 1.5px solid var(--purple);
      box-shadow: 0 0 25px rgba(191, 0, 255, 0.35);
      padding: 10px 18px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: none;
    }

    .boss-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .boss-warning-tag {
      font-family: var(--mono);
      font-size: 9px;
      font-weight: 800;
      color: #ff3366;
      letter-spacing: 0.2em;
      animation: alertPulse 0.8s infinite alternate;
    }

    .boss-name {
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 800;
      color: #f1b3ff;
      letter-spacing: 0.16em;
      text-shadow: 0 0 12px var(--purple);
    }

    .boss-bars {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .boss-track {
      height: 7px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 2px;
      overflow: hidden;
      border: 1px solid rgba(191, 0, 255, 0.3);
    }

    .boss-fill {
      height: 100%;
      transition: width 0.15s ease-out;
    }

    .boss-shield-fill {
      background: linear-gradient(90deg, #7b2cbf, var(--purple));
      box-shadow: 0 0 8px rgba(191, 0, 255, 0.6);
    }

    .boss-hull-fill {
      background: linear-gradient(90deg, #d90429, #ff1744);
      box-shadow: 0 0 8px rgba(255, 23, 68, 0.6);
    }

    .hud-center-alert {
      position: absolute;
      top: 22%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;
    }

    .alert-box {
      font-family: var(--mono);
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.26em;
      color: #fff;
      background: rgba(14, 25, 42, 0.94);
      border: 1px solid var(--cyan);
      box-shadow: 0 0 30px var(--cyan-glow);
      padding: 12px 28px;
      text-align: center;
      text-shadow: 0 0 12px var(--cyan);
      border-radius: 3px;
      animation: alertPulse 1.4s infinite alternate;
    }

    @keyframes alertPulse {
      0% { transform: scale(0.98); opacity: 0.85; }
      100% { transform: scale(1.02); opacity: 1.0; }
    }

    .hud-score-panel {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .score-display {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .score-label {
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--muted);
    }

    .score-val {
      font-family: var(--mono);
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #fff;
      text-shadow: 0 0 16px var(--cyan-glow);
    }

    .combo-badge {
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.16em;
      color: var(--amber);
      background: rgba(255, 194, 71, 0.14);
      border: 1px solid rgba(255, 194, 71, 0.4);
      padding: 2px 7px;
      border-radius: 2px;
      transition: opacity 0.2s;
    }

    .hud-feed {
      position: absolute;
      top: 90px;
      right: 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      pointer-events: none;
    }

    .feed-item {
      font-family: var(--mono);
      font-size: 10.5px;
      letter-spacing: 0.12em;
      background: rgba(5, 12, 22, 0.85);
      border-left: 2px solid var(--cyan);
      padding: 4px 10px;
      text-shadow: 0 0 8px currentColor;
      animation: feedIn 0.25s ease-out;
      transition: opacity 0.3s;
    }

    @keyframes feedIn {
      0% { opacity: 0; transform: translateX(16px); }
      100% { opacity: 1; transform: translateX(0); }
    }

    .hud-tracking-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
    }

    .hud-radar-panel {
      position: absolute;
      bottom: 20px;
      left: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .radar-glass {
      position: relative;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 1.5px solid var(--panel-line);
      box-shadow: 0 0 20px rgba(62, 240, 255, 0.18);
      overflow: hidden;
      background: radial-gradient(circle, rgba(10, 22, 38, 0.82) 0%, rgba(3, 7, 14, 0.96) 100%);
    }

    .radar-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .radar-sweep {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: conic-gradient(from 0deg, rgba(62, 240, 255, 0.22) 0deg, transparent 65deg, transparent 360deg);
      animation: radarSpin 2.4s linear infinite;
      pointer-events: none;
    }

    @keyframes radarSpin {
      to { transform: rotate(360deg); }
    }

    .radar-label {
      font-size: 8.5px;
      letter-spacing: 0.2em;
      color: var(--muted);
      font-weight: 600;
    }

    .hud-vitals {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 320px;
      background: var(--panel-bg);
      border: 1px solid var(--panel-line);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 12px 16px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .vital-row {
      display: grid;
      grid-template-columns: 75px 1fr 44px;
      align-items: center;
      gap: 10px;
      font-size: 9.5px;
      letter-spacing: 0.16em;
    }

    .vital-label {
      color: var(--muted);
      font-weight: 700;
    }

    .vital-val {
      font-family: var(--mono);
      text-align: right;
      color: #fff;
      font-size: 10.5px;
    }

    .bar-track {
      height: 9px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--panel-line);
      border-radius: 2px;
      overflow: hidden;
    }

    .bar-track.thin {
      height: 6px;
    }

    .bar-fill {
      height: 100%;
      transition: width 0.1s linear;
    }

    .shield-fill {
      background: linear-gradient(90deg, #1aa4b8, var(--cyan));
      box-shadow: 0 0 10px var(--cyan-glow);
    }

    .hull-fill {
      background: linear-gradient(90deg, #2ecc71, var(--green));
      box-shadow: 0 0 10px rgba(92, 255, 157, 0.4);
    }

    .energy-fill {
      background: linear-gradient(90deg, #ff9900, var(--amber));
      box-shadow: 0 0 8px var(--orange-glow);
    }

    .heat-fill {
      background: linear-gradient(90deg, #ffaa00, #ff4400);
    }

    .pulse-critical {
      animation: criticalBlink 0.4s infinite alternate;
    }

    @keyframes criticalBlink {
      0% { opacity: 0.4; }
      100% { opacity: 1.0; }
    }

    .hud-hints {
      position: absolute;
      bottom: 20px;
      right: 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    .hint-chip {
      font-size: 9px;
      letter-spacing: 0.14em;
      color: var(--muted);
      background: rgba(6, 14, 24, 0.65);
      border: 1px solid var(--panel-line);
      padding: 3px 7px;
      border-radius: 2px;
    }

    .hint-chip kbd {
      color: var(--cyan);
      font-family: var(--mono);
      font-weight: 700;
    }

    /* =========================================================
       SCI-FI HANGAR & REFERENCE SHIP SELECTION UI
       ========================================================= */
    .hangar-overlay {
      position: absolute;
      inset: 0;
      z-index: 20;
      display: flex;
      flex-direction: column;
      background: radial-gradient(circle at 50% 40%, rgba(8, 18, 32, 0.90) 0%, rgba(2, 4, 10, 0.98) 75%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 24px 32px;
    }

    .hangar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--panel-line);
      padding-bottom: 14px;
    }

    .hangar-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.28em;
      color: #fff;
      text-shadow: 0 0 20px var(--cyan-glow);
    }

    .hangar-title span {
      color: var(--cyan);
    }

    .hangar-subtitle {
      font-size: 11px;
      font-family: var(--mono);
      letter-spacing: 0.18em;
      color: var(--muted);
    }

    .hangar-content {
      display: grid;
      grid-template-columns: 380px 1fr 360px;
      gap: 24px;
      flex: 1;
      align-items: center;
      padding: 16px 0;
    }

    .ship-cards-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .ship-card {
      background: rgba(10, 20, 34, 0.65);
      border: 1px solid var(--panel-line);
      border-radius: 4px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 14px;
      align-items: center;
    }

    .ship-card:hover {
      background: rgba(16, 32, 54, 0.85);
      border-color: var(--cyan);
      transform: translateX(4px);
    }

    .ship-card.active {
      background: linear-gradient(90deg, rgba(62, 240, 255, 0.18), rgba(6, 14, 24, 0.85));
      border-color: var(--cyan);
      box-shadow: 0 0 22px rgba(62, 240, 255, 0.25);
    }

    .card-thumb {
      width: 100px;
      height: 72px;
      border-radius: 3px;
      background-size: cover;
      background-position: center;
      border: 1px solid var(--panel-line);
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .card-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: #fff;
    }

    .card-type {
      font-family: var(--mono);
      font-size: 8.5px;
      color: var(--cyan);
      letter-spacing: 0.12em;
    }

    .card-desc {
      font-size: 10px;
      color: #8faec9;
      line-height: 1.35;
    }

    .hangar-turntable-container {
      position: relative;
      height: 100%;
      min-height: 380px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    #hangar-turntable-canvas {
      width: 100%;
      height: 100%;
      max-height: 520px;
      display: block;
      cursor: grab;
    }

    #hangar-turntable-canvas:active {
      cursor: grabbing;
    }

    .turntable-hint {
      position: absolute;
      bottom: 12px;
      font-family: var(--mono);
      font-size: 9px;
      letter-spacing: 0.2em;
      color: var(--muted);
    }

    .ship-stats-panel {
      background: rgba(8, 16, 28, 0.85);
      border: 1px solid var(--panel-line);
      border-radius: 4px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .stats-header {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.22em;
      color: var(--cyan);
      border-bottom: 1px solid var(--panel-line);
      padding-bottom: 8px;
    }

    .stat-bar-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-meta {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      letter-spacing: 0.16em;
      color: var(--muted);
    }

    .stat-meta b {
      font-family: var(--mono);
      color: #fff;
    }

    .stat-track {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 2px;
      overflow: hidden;
    }

    .stat-fill {
      height: 100%;
      background: linear-gradient(90deg, #1aa4b8, var(--cyan));
      box-shadow: 0 0 8px var(--cyan-glow);
      transition: width 0.3s ease;
    }

    .hangar-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--panel-line);
      padding-top: 16px;
    }

    .mission-brief {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brief-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 10px var(--green);
      animation: alertPulse 1.2s infinite alternate;
    }

    .brief-text {
      font-size: 11px;
      letter-spacing: 0.18em;
      color: #a8c7e2;
    }

    .btn-launch-mission {
      font-family: inherit;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.28em;
      color: #02040a;
      background: linear-gradient(90deg, #3ef0ff, #82f6ff);
      border: none;
      padding: 16px 48px;
      border-radius: 3px;
      cursor: pointer;
      box-shadow: 0 0 32px var(--cyan-glow);
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
    }

    .btn-launch-mission:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 0 48px rgba(62, 240, 255, 0.75);
    }

    .touch-controls {
      display: none;
      pointer-events: none;
      position: absolute;
      inset: 0;
      z-index: 15;
    }

    .touch-stick {
      pointer-events: auto;
      touch-action: none;
      position: absolute;
      bottom: 28px;
      left: 24px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(62, 240, 255, 0.15) 0%, rgba(6, 14, 24, 0.6) 100%);
      border: 1.5px solid rgba(62, 240, 255, 0.35);
    }

    .stick-knob {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--cyan) 0%, #157b8c 100%);
      box-shadow: 0 0 16px var(--cyan);
    }

    .touch-buttons {
      pointer-events: auto;
      position: absolute;
      bottom: 28px;
      right: 24px;
      display: flex;
      gap: 14px;
    }

    .touch-action-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      font-family: inherit;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;
      cursor: pointer;
      border: none;
    }

    .boost-btn {
      color: #2b1800;
      background: radial-gradient(circle, #ffc247, #ff8c00);
      box-shadow: 0 0 20px var(--orange-glow);
    }

    .fire-btn {
      color: #03121a;
      background: radial-gradient(circle, #66f5ff, #00c8e0);
      box-shadow: 0 0 20px var(--cyan-glow);
    }

    @media (max-width: 960px) {
      .hangar-content { grid-template-columns: 1fr; overflow-y: auto; }
      .hud-hints { display: none; }
      .hud-vitals { width: 250px; bottom: 85px; }
      .touch-controls { display: block; }
    }
  </style>
</head>
<body>
  <!-- 3D WebGL Viewport -->
  <canvas id="viewport"></canvas>

  <!-- Atmospheric FX -->
  <div class="vignette"></div>
  <div class="scanlines"></div>

  <!-- Tactical HUD Container -->
  <div class="hud" id="hud-container"></div>

  <!-- Interactive Sci-Fi Hangar & Reference Ship Selection Overlay -->
  <div class="hangar-overlay" id="hangar-overlay">
    <header class="hangar-header">
      <div class="hangar-brand">
        <h1 class="hangar-title">HOVERDRIFT<span> // HANGAR BAY</span></h1>
        <div class="hangar-subtitle">SELECT REFERENCE STARFIGHTER // PHOTOREALISTIC PBR PROTOCOL</div>
      </div>
    </header>

    <div class="hangar-content">
      <!-- Ship Selection Cards (Left) -->
      <div class="ship-cards-list">
        <!-- Ship 1: Void Dreadnought (Ref Image 1) -->
        <div class="ship-card active" data-ship="dreadnought" id="card-dreadnought">
          <div class="card-thumb" id="thumb-dreadnought"></div>
          <div class="card-info">
            <span class="card-title">VOID DREADNOUGHT</span>
            <span class="card-type">TWIN-HULL WARSHIP</span>
            <p class="card-desc">Stealth composite armor, catamaran hulls, heavy rail-cannons.</p>
          </div>
        </div>

        <!-- Ship 2: Aether Vanguard (Ref Image 2) -->
        <div class="ship-card" data-ship="aether" id="card-aether">
          <div class="card-thumb" id="thumb-aether"></div>
          <div class="card-info">
            <span class="card-title">AETHER VANGUARD</span>
            <span class="card-type">HIGH-AGILITY INTERCEPTOR</span>
            <p class="card-desc">Cranked delta wings, canted stabilizers, cyan plasma bolters.</p>
          </div>
        </div>

        <!-- Ship 3: Crimson Interceptor (Ref Image 3) -->
        <div class="ship-card" data-ship="crimson" id="card-crimson">
          <div class="card-thumb" id="thumb-crimson"></div>
          <div class="card-info">
            <span class="card-title">CRIMSON INTERCEPTOR</span>
            <span class="card-type">TACTICAL STRIKE FIGHTER</span>
            <p class="card-desc">Brushed titanium, crimson cowlings, dual VTOL turbine rings.</p>
          </div>
        </div>
      </div>

      <!-- Center: 3D Holographic Turntable Showcase -->
      <div class="hangar-turntable-container">
        <canvas id="hangar-turntable-canvas"></canvas>
        <div class="turntable-hint">DRAG TO ROTATE 360° PBR MODEL</div>
      </div>

      <!-- Right: Ship Diagnostics & Stat Meters -->
      <div class="ship-stats-panel">
        <div class="stats-header" id="stats-ship-title">VOID DREADNOUGHT // STATS</div>
        <div class="stat-bar-group">
          <div class="stat-row">
            <div class="stat-meta"><span>TOP SPEED</span><b id="stat-speed-val">70%</b></div>
            <div class="stat-track"><div class="stat-fill" id="stat-speed-bar" style="width: 70%;"></div></div>
          </div>
          <div class="stat-row">
            <div class="stat-meta"><span>AGILITY & ROLL</span><b id="stat-agility-val">62%</b></div>
            <div class="stat-track"><div class="stat-fill" id="stat-agility-bar" style="width: 62%;"></div></div>
          </div>
          <div class="stat-row">
            <div class="stat-meta"><span>SHIELD CAPACITY</span><b id="stat-shields-val">98%</b></div>
            <div class="stat-track"><div class="stat-fill" id="stat-shields-bar" style="width: 98%;"></div></div>
          </div>
          <div class="stat-row">
            <div class="stat-meta"><span>HULL ARMOR</span><b id="stat-hull-val">100%</b></div>
            <div class="stat-track"><div class="stat-fill" id="stat-hull-bar" style="width: 100%;"></div></div>
          </div>
          <div class="stat-row">
            <div class="stat-meta"><span>FIREPOWER</span><b id="stat-firepower-val">96%</b></div>
            <div class="stat-track"><div class="stat-fill" id="stat-firepower-bar" style="width: 96%;"></div></div>
          </div>
        </div>
      </div>
    </div>

    <footer class="hangar-footer">
      <div class="mission-brief">
        <div class="brief-dot"></div>
        <div class="brief-text">SECTOR 01 PATROL READY // CAPITAL BOSS SIGNATURES DETECTED AT SECTOR 03 & 06</div>
      </div>
      <button class="btn-launch-mission" id="btn-launch-mission">LAUNCH MISSION</button>
    </footer>
  </div>

  <script>
    // Self-Contained Standalone Game Bundle
    ${texturesCode}
    ${audioCode}
    ${shipCode}
    ${envCode}
    ${astCode}
    ${droneCode}
    ${particleCode}
    ${controlsCode}
    ${hudCode}
    ${gameCode}

    // =========================================================
    // HANGAR 3D PREVIEW & MISSION LAUNCH CONTROLLER
    // =========================================================
    window.addEventListener('DOMContentLoaded', () => {
      const mainCanvas = document.getElementById('viewport');
      const hudContainer = document.getElementById('hud-container');
      const hangarOverlay = document.getElementById('hangar-overlay');
      const btnLaunch = document.getElementById('btn-launch-mission');
      const turntableCanvas = document.getElementById('hangar-turntable-canvas');

      // Populate reference image thumbnails
      document.getElementById('thumb-dreadnought').style.backgroundImage = 'url(' + SHIP_IMAGES.dreadnought + ')';
      document.getElementById('thumb-aether').style.backgroundImage = 'url(' + SHIP_IMAGES.aether + ')';
      document.getElementById('thumb-crimson').style.backgroundImage = 'url(' + SHIP_IMAGES.crimson + ')';

      let selectedShip = 'dreadnought';
      let mainGame = null;

      // Hangar 3D Turntable Scene
      const hangarScene = new THREE.Scene();
      const hangarCamera = new THREE.PerspectiveCamera(45, turntableCanvas.clientWidth / turntableCanvas.clientHeight, 0.1, 100);
      hangarCamera.position.set(0, 3.2, 8.2);
      hangarCamera.lookAt(0, 0.2, 0);

      const hangarRenderer = new THREE.WebGLRenderer({
        canvas: turntableCanvas,
        antialias: true,
        alpha: true
      });
      hangarRenderer.setSize(turntableCanvas.clientWidth, turntableCanvas.clientHeight);
      hangarRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      hangarRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      hangarRenderer.toneMappingExposure = 1.25;

      // Hangar PBR Environment & Lighting
      const hSun = new THREE.DirectionalLight(0xfff5ea, 2.8);
      hSun.position.set(6, 9, 7);
      hangarScene.add(hSun);

      const hRim = new THREE.DirectionalLight(0x3ef0ff, 2.2);
      hRim.position.set(-7, 3, -7);
      hangarScene.add(hRim);

      const hAmb = new THREE.AmbientLight(0x1a2638, 1.4);
      hangarScene.add(hAmb);

      const grid = new THREE.GridHelper(12, 24, 0x3ef0ff, 0x162c42);
      grid.position.y = -0.6;
      hangarScene.add(grid);

      let previewShipGroup = new THREE.Group();
      hangarScene.add(previewShipGroup);

      function updatePreviewModel(type) {
        while (previewShipGroup.children.length > 0) {
          previewShipGroup.remove(previewShipGroup.children[0]);
        }

        const tempShip = new Starfighter(previewShipGroup, THREE, type);
        tempShip.group.position.set(0, 0, 0);

        const cfg = SHIP_CONFIGS[type];
        document.getElementById('stats-ship-title').textContent = cfg.name + ' // STATS';
        document.getElementById('stat-speed-val').textContent = cfg.stats.speed + '%';
        document.getElementById('stat-speed-bar').style.width = cfg.stats.speed + '%';
        document.getElementById('stat-agility-val').textContent = cfg.stats.agility + '%';
        document.getElementById('stat-agility-bar').style.width = cfg.stats.agility + '%';
        document.getElementById('stat-shields-val').textContent = cfg.stats.shields + '%';
        document.getElementById('stat-shields-bar').style.width = cfg.stats.shields + '%';
        document.getElementById('stat-hull-val').textContent = cfg.stats.hull + '%';
        document.getElementById('stat-hull-bar').style.width = cfg.stats.hull + '%';
        document.getElementById('stat-firepower-val').textContent = cfg.stats.firepower + '%';
        document.getElementById('stat-firepower-bar').style.width = cfg.stats.firepower + '%';
      }

      updatePreviewModel('dreadnought');

      ['dreadnought', 'aether', 'crimson'].forEach(id => {
        const card = document.getElementById('card-' + id);
        card.addEventListener('click', () => {
          document.querySelectorAll('.ship-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          selectedShip = id;
          updatePreviewModel(id);
        });
      });

      let isDragging = false;
      let prevMouseX = 0;
      let autoRotate = true;

      turntableCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevMouseX = e.clientX;
        autoRotate = false;
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
        setTimeout(() => autoRotate = true, 2000);
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) {
          const deltaX = e.clientX - prevMouseX;
          previewShipGroup.rotation.y += deltaX * 0.015;
          prevMouseX = e.clientX;
        }
      });

      let turntableRunning = true;
      function animateTurntable() {
        if (!turntableRunning) return;
        requestAnimationFrame(animateTurntable);
        if (autoRotate) {
          previewShipGroup.rotation.y += 0.008;
        }
        hangarRenderer.render(hangarScene, hangarCamera);
      }
      animateTurntable();

      btnLaunch.addEventListener('click', () => {
        turntableRunning = false;
        hangarOverlay.style.opacity = '0';
        hangarOverlay.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => hangarOverlay.style.display = 'none', 500);

        if (!mainGame) {
          mainGame = new CosmicGame(mainCanvas, hudContainer, THREE, selectedShip);
          mainGame.start();
        }
      });

      // Mobile Touch stick helpers
      const stick = document.getElementById('touch-stick-left');
      const knob = document.getElementById('stick-knob-left');
      const btnTouchBoost = document.getElementById('btn-touch-boost');
      const btnTouchFire = document.getElementById('btn-touch-fire');

      if (stick && knob) {
        let activeTouchId = null;
        let startX = 0, startY = 0;

        stick.addEventListener('touchstart', (e) => {
          const touch = e.changedTouches[0];
          activeTouchId = touch.identifier;
          const rect = stick.getBoundingClientRect();
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
          if (mainGame) mainGame.input.touch.active = true;
        });

        window.addEventListener('touchmove', (e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === activeTouchId) {
              const dx = touch.clientX - startX;
              const dy = touch.clientY - startY;
              const dist = Math.hypot(dx, dy);
              const maxRadius = 45;
              const clampedDist = Math.min(maxRadius, dist);
              const angle = Math.atan2(dy, dx);
              const knobX = Math.cos(angle) * clampedDist;
              const knobY = Math.sin(angle) * clampedDist;

              knob.style.transform = 'translate(calc(-50% + ' + knobX + 'px), calc(-50% + ' + knobY + 'px))';

              if (mainGame) {
                mainGame.input.touch.thrust = -dy / maxRadius;
                mainGame.input.touch.steer = dx / maxRadius;
              }
            }
          }
        });

        const resetStick = (e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
              activeTouchId = null;
              knob.style.transform = 'translate(-50%, -50%)';
              if (mainGame) {
                mainGame.input.touch.thrust = 0;
                mainGame.input.touch.steer = 0;
              }
            }
          }
        };

        window.addEventListener('touchend', resetStick);
        window.addEventListener('touchcancel', resetStick);

        if (btnTouchBoost) {
          btnTouchBoost.addEventListener('touchstart', () => { if (mainGame) mainGame.input.touch.boost = true; });
          btnTouchBoost.addEventListener('touchend', () => { if (mainGame) mainGame.input.touch.boost = false; });
        }
        if (btnTouchFire) {
          btnTouchFire.addEventListener('touchstart', () => { if (mainGame) mainGame.input.touch.fire = true; });
          btnTouchFire.addEventListener('touchend', () => { if (mainGame) mainGame.input.touch.fire = false; });
        }
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync('standalone.html', template);
  fs.writeFileSync('index.html', template);
  console.log('Successfully generated updated index.html & standalone.html! Size:', template.length);
} catch (err) {
  console.error('Build error:', err);
}
