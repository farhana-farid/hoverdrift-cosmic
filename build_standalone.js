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

    .hud-top-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .hud-top-actions {
      display: flex;
      gap: 6px;
      pointer-events: auto;
    }

    .hud-action-pill {
      background: rgba(10, 22, 38, 0.85);
      border: 1px solid var(--panel-line);
      color: var(--cyan);
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      padding: 5px 11px;
      border-radius: 3px;
      cursor: pointer;
      touch-action: manipulation;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .hud-action-pill:hover, .hud-action-pill:active {
      transform: scale(0.96);
      background: rgba(62, 240, 255, 0.22);
      border-color: var(--cyan);
      box-shadow: 0 0 12px var(--cyan-glow);
      color: #fff;
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

    /* Mission Objectives, Weapons Rack, Cockpit Overlay & Modals */
    .hud-mission-panel {
      display: flex;
      flex-direction: column;
      gap: 3px;
      background: rgba(6, 14, 24, 0.75);
      border: 1px solid var(--panel-line);
      border-left: 3px solid var(--cyan);
      padding: 6px 14px;
      border-radius: 2px;
    }

    .mission-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: #fff;
    }

    .mission-objective {
      font-family: var(--mono);
      font-size: 9.5px;
      letter-spacing: 0.12em;
      color: var(--cyan);
    }

    .cockpit-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 4;
      display: flex;
      justify-content: space-between;
    }

    .cockpit-frame-left {
      width: 140px;
      height: 100%;
      background: linear-gradient(90deg, rgba(12, 16, 24, 0.95) 0%, rgba(12, 16, 24, 0.6) 70%, transparent 100%);
      border-right: 2px solid rgba(62, 240, 255, 0.2);
      clip-path: polygon(0 0, 100% 15%, 80% 85%, 0 100%);
    }

    .cockpit-frame-right {
      width: 140px;
      height: 100%;
      background: linear-gradient(270deg, rgba(12, 16, 24, 0.95) 0%, rgba(12, 16, 24, 0.6) 70%, transparent 100%);
      border-left: 2px solid rgba(62, 240, 255, 0.2);
      clip-path: polygon(100% 0, 0 15%, 20% 85%, 100% 100%);
    }

    .cockpit-hud-glass {
      position: absolute;
      inset: 10%;
      border: 1px solid rgba(62, 240, 255, 0.12);
      border-radius: 24px;
      box-shadow: inset 0 0 40px rgba(62, 240, 255, 0.05);
      background: radial-gradient(circle at 50% 50%, rgba(62, 240, 255, 0.02) 0%, transparent 80%);
    }

    .weapons-rack {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px solid var(--panel-line);
    }

    .w-slot {
      font-family: var(--mono);
      font-size: 8px;
      letter-spacing: 0.12em;
      color: var(--muted);
      background: rgba(10, 20, 32, 0.6);
      border: 1px solid var(--panel-line);
      padding: 4px 6px;
      border-radius: 2px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .w-slot.active {
      color: #fff;
      border-color: var(--cyan);
      background: rgba(62, 240, 255, 0.2);
      box-shadow: 0 0 10px rgba(62, 240, 255, 0.3);
    }

    .w-slot.emp-slot.ready {
      color: var(--purple);
      border-color: var(--purple);
      background: rgba(191, 0, 255, 0.2);
      box-shadow: 0 0 12px rgba(191, 0, 255, 0.4);
      animation: alertPulse 1.5s infinite alternate;
    }

    .w-key {
      display: inline-block;
      color: var(--cyan);
      font-weight: 700;
      margin-right: 2px;
    }

    .cam-badge {
      font-family: var(--mono);
      font-size: 9.5px;
      letter-spacing: 0.16em;
      color: var(--cyan);
      background: rgba(14, 28, 46, 0.85);
      border: 1px solid var(--cyan);
      padding: 4px 10px;
      border-radius: 2px;
      box-shadow: 0 0 12px var(--cyan-glow);
    }

    .missile-btn {
      color: #fff;
      background: radial-gradient(circle, #ff5500, #b31d00);
      box-shadow: 0 0 20px rgba(255, 85, 0, 0.5);
    }

    .hud-modal {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(2, 4, 10, 0.88);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .modal-card {
      width: 90%;
      max-width: 520px;
      background: rgba(8, 18, 30, 0.94);
      border: 1.5px solid var(--panel-line);
      border-radius: 6px;
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(62, 240, 255, 0.2);
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.22em;
      color: #fff;
      text-shadow: 0 0 16px var(--cyan);
    }

    .modal-sub {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.18em;
      color: var(--muted);
      margin-top: -8px;
    }

    .modal-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .modal-btn {
      font-family: inherit;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: #c0daf0;
      background: rgba(14, 26, 42, 0.8);
      border: 1px solid var(--panel-line);
      padding: 10px 18px;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .modal-btn:hover {
      background: rgba(24, 44, 70, 0.9);
      border-color: var(--cyan);
      color: #fff;
      box-shadow: 0 0 15px rgba(62, 240, 255, 0.3);
    }

    .modal-btn.primary {
      color: #02040a;
      background: linear-gradient(90deg, #3ef0ff, #82f6ff);
      border: none;
      box-shadow: 0 0 20px var(--cyan-glow);
    }

    .modal-btn.primary:hover {
      transform: scale(1.02);
      box-shadow: 0 0 30px rgba(62, 240, 255, 0.8);
    }

    .modal-btn.small {
      padding: 6px 12px;
      font-size: 9px;
    }

    .modal-section-title {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.18em;
      color: var(--muted);
      border-bottom: 1px solid var(--panel-line);
      padding-bottom: 4px;
      text-align: left;
    }

    .level-select-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
    }

    .lvl-select-btn {
      font-family: var(--mono);
      font-size: 8.5px;
      letter-spacing: 0.1em;
      background: rgba(10, 22, 36, 0.8);
      border: 1px solid var(--panel-line);
      color: #a0c2de;
      padding: 8px 4px;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .lvl-select-btn:hover, .lvl-select-btn.active {
      background: rgba(62, 240, 255, 0.25);
      border-color: var(--cyan);
      color: #fff;
      box-shadow: 0 0 12px var(--cyan-glow);
    }

    .modal-settings {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(5, 12, 20, 0.6);
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid var(--panel-line);
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--mono);
      font-size: 9.5px;
      color: var(--muted);
    }

    .setting-item input[type="range"] {
      accent-color: var(--cyan);
      cursor: pointer;
    }

    .victory-card {
      border-color: var(--green);
      box-shadow: 0 0 45px rgba(92, 255, 157, 0.35);
    }

    .victory-glow {
      color: #fff;
      text-shadow: 0 0 20px rgba(92, 255, 157, 0.8), 0 0 40px rgba(92, 255, 157, 0.4);
    }

    .victory-rank-badge {
      font-family: var(--mono);
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 0.2em;
      color: var(--amber);
      text-shadow: 0 0 25px var(--orange-glow);
      padding: 8px;
    }

    .vic-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      background: rgba(4, 10, 18, 0.7);
      padding: 12px;
      border-radius: 4px;
      border: 1px solid var(--panel-line);
    }

    .v-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 9px;
      letter-spacing: 0.14em;
      color: var(--muted);
    }

    .v-stat b {
      font-family: var(--mono);
      font-size: 13px;
      color: #fff;
    }

    /* =========================================================
       SCI-FI HANGAR & REFERENCE SHIP SELECTION UI
       ========================================================= */
    .hangar-overlay {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      z-index: 20;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: radial-gradient(circle at 50% 40%, rgba(8, 18, 32, 0.94) 0%, rgba(2, 4, 10, 0.99) 80%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 12px 24px;
      box-sizing: border-box;
    }

    .hangar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--panel-line);
      padding-bottom: 8px;
      flex-shrink: 0;
    }

    .hangar-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.24em;
      color: #fff;
      text-shadow: 0 0 20px var(--cyan-glow);
    }

    .hangar-title span {
      color: var(--cyan);
    }

    .hangar-subtitle {
      font-size: 10px;
      font-family: var(--mono);
      letter-spacing: 0.16em;
      color: var(--muted);
    }

    .hangar-content {
      display: grid;
      grid-template-columns: 310px 1fr 290px;
      gap: 16px;
      flex: 1;
      min-height: 0;
      align-items: stretch;
      padding: 8px 0;
      overflow: hidden;
    }

    .ship-cards-list {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
      height: 100%;
    }

    .ship-card {
      background: rgba(10, 20, 34, 0.70);
      border: 1px solid var(--panel-line);
      border-radius: 4px;
      padding: 8px 10px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
      display: grid;
      grid-template-columns: 88px 1fr;
      gap: 10px;
      align-items: center;
    }

    .ship-card:hover {
      background: rgba(16, 32, 54, 0.88);
      border-color: var(--cyan);
      transform: translateX(4px);
    }

    .ship-card.active {
      background: linear-gradient(90deg, rgba(62, 240, 255, 0.22), rgba(6, 14, 24, 0.90));
      border-color: var(--cyan);
      box-shadow: 0 0 22px rgba(62, 240, 255, 0.30);
    }

    .card-thumb {
      width: 88px;
      height: 60px;
      border-radius: 3px;
      background-size: cover;
      background-position: center;
      border: 1px solid var(--panel-line);
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .card-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #fff;
    }

    .card-type {
      font-family: var(--mono);
      font-size: 8px;
      color: var(--cyan);
      letter-spacing: 0.12em;
    }

    .card-desc {
      font-size: 9.5px;
      color: #8faec9;
      line-height: 1.3;
    }

    .hangar-turntable-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #hangar-turntable-canvas {
      width: 100%;
      height: 100%;
      max-height: 100%;
      display: block;
      cursor: grab;
    }

    #hangar-turntable-canvas:active {
      cursor: grabbing;
    }

    .turntable-hint {
      position: absolute;
      bottom: 8px;
      font-family: var(--mono);
      font-size: 8.5px;
      letter-spacing: 0.2em;
      color: var(--muted);
      background: rgba(4, 10, 18, 0.7);
      padding: 3px 10px;
      border-radius: 3px;
      border: 1px solid var(--panel-line);
    }

    .ship-stats-panel {
      background: rgba(8, 16, 28, 0.88);
      border: 1px solid var(--panel-line);
      border-radius: 4px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
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
      padding-top: 10px;
      flex-shrink: 0;
    }

    .mission-brief {
      display: flex;
      align-items: center;
      gap: 12px;
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
      font-size: 10px;
      letter-spacing: 0.16em;
      color: #a8c7e2;
    }

    .btn-launch-mission {
      font-family: inherit;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.24em;
      color: #02040a;
      background: linear-gradient(90deg, #3ef0ff, #82f6ff);
      border: none;
      padding: 12px 36px;
      border-radius: 3px;
      cursor: pointer;
      box-shadow: 0 0 28px var(--cyan-glow);
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
    }

    .btn-launch-mission:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 0 42px rgba(62, 240, 255, 0.85);
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
      bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      left: calc(20px + env(safe-area-inset-left, 0px));
      width: 124px;
      height: 124px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(62, 240, 255, 0.12) 0%, rgba(6, 14, 24, 0.72) 100%);
      border: 1.5px solid rgba(62, 240, 255, 0.4);
      box-shadow: 0 0 18px rgba(62, 240, 255, 0.22);
    }

    .stick-knob {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--cyan) 0%, #157b8c 100%);
      box-shadow: 0 0 16px var(--cyan);
      pointer-events: none;
    }

    .touch-buttons {
      pointer-events: auto;
      position: absolute;
      bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      right: calc(18px + env(safe-area-inset-right, 0px));
      display: flex;
      gap: 12px;
      align-items: center;
      touch-action: none;
    }

    .touch-action-btn {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      font-family: inherit;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      cursor: pointer;
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
      transition: transform 0.1s ease, filter 0.1s ease;
    }

    .touch-action-btn:active {
      transform: scale(0.92);
      filter: brightness(1.25);
    }

    .boost-btn {
      color: #2b1800;
      background: radial-gradient(circle, #ffc247, #ff8c00);
      box-shadow: 0 0 18px var(--orange-glow);
    }

    .missile-btn {
      color: #fff;
      background: radial-gradient(circle, #ff4422, #b31d00);
      box-shadow: 0 0 18px rgba(255, 68, 34, 0.6);
    }

    .fire-btn {
      color: #03121a;
      background: radial-gradient(circle, #66f5ff, #00c8e0);
      box-shadow: 0 0 20px var(--cyan-glow);
    }

    @media (max-width: 960px), (pointer: coarse), (hover: none) {
      .hangar-overlay {
        padding: calc(12px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) calc(14px + env(safe-area-inset-left, 0px));
      }
      .hangar-content { 
        grid-template-columns: 1fr; 
        overflow-y: auto; 
        -webkit-overflow-scrolling: touch;
        gap: 14px;
      }
      .hangar-turntable-container {
        height: 260px;
        min-height: 240px;
        order: -1;
      }
      .hangar-footer {
        flex-direction: column;
        gap: 12px;
      }
      .btn-launch-mission {
        width: 100%;
        padding: 14px 20px;
        font-size: 13px;
      }
      .hud-hints { display: none; }
      .hud-radar-panel { display: none; }
      .hud-top {
        padding: calc(10px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) 8px calc(14px + env(safe-area-inset-left, 0px));
      }
      .hud-title { font-size: 13px; }
      .hud-sector { font-size: 9px; }
      .mission-title { font-size: 11px; }
      .mission-objective { font-size: 10px; }
      .hud-vitals { 
        width: min(250px, 44vw); 
        bottom: calc(16px + env(safe-area-inset-bottom, 0px)); 
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 12px;
      }
      .touch-controls { display: block; }
    }

    @media (max-width: 600px) and (orientation: portrait) {
      .touch-stick {
        width: 110px;
        height: 110px;
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        left: calc(12px + env(safe-area-inset-left, 0px));
      }
      .touch-action-btn {
        width: 54px;
        height: 54px;
        font-size: 9px;
      }
      .touch-buttons {
        gap: 8px;
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        right: calc(12px + env(safe-area-inset-right, 0px));
      }
      .hud-vitals {
        bottom: calc(144px + env(safe-area-inset-bottom, 0px));
        width: 220px;
      }
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
      const hangarCamera = new THREE.PerspectiveCamera(45, (turntableCanvas.clientWidth || 600) / (turntableCanvas.clientHeight || 450), 0.1, 100);
      hangarCamera.position.set(3.4, 1.8, 4.4);
      hangarCamera.lookAt(0, 0.1, 0.2);

      const hangarRenderer = new THREE.WebGLRenderer({
        canvas: turntableCanvas,
        antialias: true,
        alpha: true
      });
      hangarRenderer.setSize(turntableCanvas.clientWidth || 600, turntableCanvas.clientHeight || 450, false);
      hangarRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      hangarRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      hangarRenderer.toneMappingExposure = 1.35;

      // Hangar PBR Environment & 3-Point Studio Lighting
      const hSun = new THREE.DirectionalLight(0xfff5ea, 3.2);
      hSun.position.set(6, 8, 6);
      hangarScene.add(hSun);

      const hFill = new THREE.DirectionalLight(0x4da6ff, 1.6);
      hFill.position.set(-5, 3, 5);
      hangarScene.add(hFill);

      const hRim = new THREE.DirectionalLight(0x3ef0ff, 2.8);
      hRim.position.set(-6, 4, -6);
      hangarScene.add(hRim);

      const hAmb = new THREE.AmbientLight(0x182436, 1.5);
      hangarScene.add(hAmb);

      // Sci-Fi Circular Turntable Docking Pad
      const padGroup = new THREE.Group();
      const padGeom = new THREE.CylinderGeometry(3.4, 3.6, 0.14, 36);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x0c1420,
        metalness: 0.88,
        roughness: 0.32
      });
      const padMesh = new THREE.Mesh(padGeom, padMat);
      padMesh.position.y = -0.07;
      padGroup.add(padMesh);

      const ringGeom = new THREE.TorusGeometry(3.42, 0.035, 8, 36);
      ringGeom.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x3ef0ff });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.y = 0.01;
      padGroup.add(ringMesh);

      const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.02, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.y = 0.01;
      padGroup.add(innerRing);

      const grid = new THREE.GridHelper(12, 24, 0x3ef0ff, 0x14283c);
      grid.position.y = -0.15;
      padGroup.add(grid);

      hangarScene.add(padGroup);

      let previewShipGroup = new THREE.Group();
      hangarScene.add(previewShipGroup);

      function updatePreviewModel(type) {
        while (previewShipGroup.children.length > 0) {
          previewShipGroup.remove(previewShipGroup.children[0]);
        }

        const tempShip = new Starfighter(previewShipGroup, THREE, type);
        tempShip.group.position.set(0, 0.12, 0);

        // Hide thruster flames while parked in hangar
        if (tempShip.thrusterFlames) {
          tempShip.thrusterFlames.forEach(f => {
            if (f.outer) f.outer.visible = false;
            if (f.inner) f.inner.visible = false;
          });
        }

        // Beautiful front 3/4 perspective angle
        previewShipGroup.rotation.y = -0.45;

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

      // Touch Drag Support for Mobile / Tablets
      turntableCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          isDragging = true;
          prevMouseX = e.touches[0].clientX;
          autoRotate = false;
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDragging = false;
        setTimeout(() => autoRotate = true, 2000);
      });

      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) {
          const deltaX = e.touches[0].clientX - prevMouseX;
          previewShipGroup.rotation.y += deltaX * 0.015;
          prevMouseX = e.touches[0].clientX;
        }
      }, { passive: true });

      function resizeTurntable() {
        if (!turntableCanvas.parentElement) return;
        const w = turntableCanvas.clientWidth;
        const h = turntableCanvas.clientHeight;
        if (w > 0 && h > 0) {
          hangarCamera.aspect = w / h;
          hangarCamera.updateProjectionMatrix();
          hangarRenderer.setSize(w, h, false);
        }
      }
      window.addEventListener('resize', resizeTurntable);
      setTimeout(resizeTurntable, 80);

      let turntableRunning = true;
      function animateTurntable() {
        if (!turntableRunning) return;
        requestAnimationFrame(animateTurntable);
        if (autoRotate) {
          previewShipGroup.rotation.y += 0.004;
        }
        hangarRenderer.render(hangarScene, hangarCamera);
      }
      animateTurntable();

      btnLaunch.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        turntableRunning = false;
        hangarOverlay.style.opacity = '0';
        hangarOverlay.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => hangarOverlay.style.display = 'none', 500);

        if (!mainGame) {
          mainGame = new CosmicGame(mainCanvas, hudContainer, THREE, selectedShip);
          mainGame.start();
        }
      });

      // Global one-shot touch unlock for Web Audio (iOS Safari & Android Chrome)
      const unlockAudio = () => {
        if (mainGame && mainGame.audio) mainGame.audio.unlock();
      };
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
      window.addEventListener('click', unlockAudio, { once: true, passive: true });
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
