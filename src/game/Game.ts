import { GameManager, GameState } from './GameManager';

export class Game {
    private gameManager: GameManager;
    private gameContainer: HTMLElement | null;
    private boardElement: HTMLElement | null;
    private pieceTrayElement: HTMLElement | null;
    private gameInfoElement: HTMLElement | null;
    private readonly SAVE_KEY = 'blokus_game_save'; // 本地存储的键名

    constructor() {
        this.gameContainer = document.getElementById('game-container');
        this.boardElement = document.getElementById('game-board');
        this.pieceTrayElement = document.getElementById('piece-tray');
        this.gameInfoElement = document.getElementById('game-info');

        // 创建游戏管理器
        this.gameManager = new GameManager(
            this.boardElement,
            this.pieceTrayElement,
            this.gameInfoElement,
            // 传递保存游戏状态的回调函数
            (gameState) => this.saveGameState(gameState)
        );
    }

    public initialize(): void {
        console.log('Initializing Blokus game...');

        // 检查是否有保存的游戏状态
        const savedState = this.loadGameState();

        // 使用GameManager初始化游戏（如果有保存的状态则加载）
        this.gameManager.initialize(savedState);

        console.log('Game initialized successfully!');
    }

    // 保存游戏状态到本地存储
    private saveGameState(gameState: GameState): void {
        try {
            // 添加保存时间戳
            gameState.savedAt = new Date().toISOString();
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(gameState));
            console.log('Game state saved successfully');
        } catch (error) {
            console.error('Failed to save game state:', error);
        }
    }

    // 从本地存储加载游戏状态
    private loadGameState(): GameState | null {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) return null;

            const gameState = JSON.parse(savedData);
            console.log('Loaded saved game from:', gameState.savedAt);
            return gameState;
        } catch (error) {
            console.error('Failed to load game state:', error);
            return null;
        }
    }

    // 清除保存的游戏状态
    public clearSavedGame(): void {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            console.log('Saved game cleared');
        } catch (error) {
            console.error('Failed to clear saved game:', error);
        }
    }
} 