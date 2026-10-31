const fs = require('fs');

try {
  const audioCode = fs.readFileSync('src/audio.js', 'utf8').replace(/export /g, '');
  const shipCode = fs.readFileSync('src/ship.js', 'utf8').replace(/export /g, '');
  const envCode = fs.readFileSync('src/environment.js', 'utf8').replace(/export /g, '');
  const astCode = fs.readFileSync('src/asteroids.js', 'utf8').replace(/export /g, '');
  const droneCode = fs.readFileSync('src/drones.js', 'utf8').replace(/export /g, '');
  const particleCode = fs.readFileSync('src/particles.js', 'utf8').replace(/export /g, '');
  const controlsCode = fs.readFileSync('src/controls.js', 'utf8').replace(/export /g, '');
  const hudCode = fs.readFileSync('src/hud.js', 'utf8').replace(/export /g, '');
  const gameCode = fs.readFileSync('src/game.js', 'utf8')
    .replace(/import .*\n/g, '')
    .replace(/export /g, '');

  const indexHtml = fs.readFileSync('index.html', 'utf8');

  const bundle = [
    '  <script>',
    '    // Self-Contained Standalone Cosmic Expanse Game Bundle',
    audioCode,
    shipCode,
    envCode,
    astCode,
    droneCode,
    particleCode,
    controlsCode,
    hudCode,
    gameCode,
    `
    window.addEventListener('DOMContentLoaded', () => {
      const canvas = document.getElementById('viewport');
      const hudContainer = document.getElementById('hud-container');
      const introModal = document.getElementById('intro-modal');
      const btnEngage = document.getElementById('btn-engage');

      let game = null;

      btnEngage.addEventListener('click', () => {
        introModal.style.opacity = '0';
        introModal.style.transition = 'opacity 0.4s ease-out';
        setTimeout(() => introModal.style.display = 'none', 400);

        if (!game) {
          game = new CosmicGame(canvas, hudContainer, THREE);
          game.start();
        }
      });

      // Touch controls
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
          if (game) game.input.touch.active = true;
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

              if (game) {
                game.input.touch.thrust = -dy / maxRadius;
                game.input.touch.steer = dx / maxRadius;
              }
            }
          }
        });

        const resetStick = (e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
              activeTouchId = null;
              knob.style.transform = 'translate(-50%, -50%)';
              if (game) {
                game.input.touch.thrust = 0;
                game.input.touch.steer = 0;
              }
            }
          }
        };

        window.addEventListener('touchend', resetStick);
        window.addEventListener('touchcancel', resetStick);

        if (btnTouchBoost) {
          btnTouchBoost.addEventListener('touchstart', () => { if (game) game.input.touch.boost = true; });
          btnTouchBoost.addEventListener('touchend', () => { if (game) game.input.touch.boost = false; });
        }
        if (btnTouchFire) {
          btnTouchFire.addEventListener('touchstart', () => { if (game) game.input.touch.fire = true; });
          btnTouchFire.addEventListener('touchend', () => { if (game) game.input.touch.fire = false; });
        }
      }
    });
    `,
    '  </script>'
  ].join('\n');

  const standaloneHtml = indexHtml.replace(/<script type="module">[\s\S]*?<\/script>/, bundle);
  fs.writeFileSync('standalone.html', standaloneHtml);
  console.log('Successfully generated standalone.html! Size:', standaloneHtml.length);
} catch (err) {
  console.error('Error generating standalone:', err);
}
