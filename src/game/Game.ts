import { Board } from './Board';
import { Player } from './Player';
import { AIPlayer } from './AIPlayer';
import { PieceFactory } from './PieceFactory';

export class Game {
    private board: Board;
    private humanPlayer: Player;
    private aiPlayer: AIPlayer;
    private currentPlayer: Player;
    private pieceFactory: PieceFactory;
    private gameContainer: HTMLElement | null;
    private boardElement: HTMLElement | null;
    private pieceTrayElement: HTMLElement | null;

    constructor() {
        this.board = new Board(20, 20);
        this.pieceFactory = new PieceFactory();
        this.humanPlayer = new Player('Human', 'blue', this.pieceFactory.createAllPieces());
        this.aiPlayer = new AIPlayer('AI', 'red', this.pieceFactory.createAllPieces());
        this.currentPlayer = this.humanPlayer; // Human goes first

        this.gameContainer = document.getElementById('game-container');
        this.boardElement = document.getElementById('game-board');
        this.pieceTrayElement = document.getElementById('piece-tray');
    }

    public initialize(): void {
        console.log('Initializing Blokus game...');

        // Initialize the board UI
        if (this.boardElement) {
            this.board.render(this.boardElement);
        }

        // Initialize player piece tray
        this.renderPieceTray();

        // Set up event listeners
        this.setupEventListeners();

        console.log('Game initialized successfully!');
    }

    private renderPieceTray(): void {
        if (!this.pieceTrayElement) return;

        // Clear previous pieces
        this.pieceTrayElement.innerHTML = '';

        // Render human player's available pieces
        this.humanPlayer.getAvailablePieces().forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece');
            pieceElement.dataset.pieceId = piece.id.toString();

            // Create a mini canvas to display the piece
            const canvas = document.createElement('canvas');
            canvas.width = piece.shape[0].length * 20;
            canvas.height = piece.shape.length * 20;
            pieceElement.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Draw the piece
                piece.shape.forEach((row, rowIndex) => {
                    row.forEach((cell, colIndex) => {
                        if (cell) {
                            ctx.fillStyle = this.humanPlayer.color;
                            ctx.fillRect(colIndex * 20, rowIndex * 20, 20, 20);
                            ctx.strokeStyle = '#000';
                            ctx.strokeRect(colIndex * 20, rowIndex * 20, 20, 20);
                        }
                    });
                });
            }

            this.pieceTrayElement?.appendChild(pieceElement);
        });
    }

    private setupEventListeners(): void {
        // Add event listeners for piece selection and placement
        // This will be implemented in more detail later
        console.log('Setting up event listeners...');
    }

    // Additional game methods will be added here
} 