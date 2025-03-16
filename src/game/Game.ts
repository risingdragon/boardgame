import { GameManager } from './GameManager';

export class Game {
    private gameManager: GameManager;
    private gameContainer: HTMLElement | null;
    private boardElement: HTMLElement | null;
    private pieceTrayElement: HTMLElement | null;
    private gameInfoElement: HTMLElement | null;

    constructor() {
        this.gameContainer = document.getElementById('game-container');
        this.boardElement = document.getElementById('game-board');
        this.pieceTrayElement = document.getElementById('piece-tray');
        this.gameInfoElement = document.getElementById('game-info');

        // 创建游戏管理器
        this.gameManager = new GameManager(
            this.boardElement,
            this.pieceTrayElement,
            this.gameInfoElement
        );
    }

    public initialize(): void {
        console.log('Initializing Blokus game...');

        // 使用GameManager初始化游戏
        this.gameManager.initialize();

        console.log('Game initialized successfully!');
    }
} 