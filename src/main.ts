import { Game } from './app/Game';

function init() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const game = new Game(canvas);
  game.start();

  console.log('🕳️  Game started! Use WASD or arrow keys to move the hole.');
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
