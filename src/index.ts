import { Game } from './game/Game';

// Import CSS styles
import './styles.css';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.initialize();
}); 