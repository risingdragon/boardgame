import { Board } from './Board';
import { Player } from './Player';
import { AIPlayer } from './AIPlayer';
import { PieceFactory } from './PieceFactory';
import { Piece } from './Piece';

export class Game {
    private board: Board;
    private humanPlayer: Player;
    private aiPlayer: AIPlayer;
    private currentPlayer: Player;
    private pieceFactory: PieceFactory;
    private gameContainer: HTMLElement | null;
    private boardElement: HTMLElement | null;
    private pieceTrayElement: HTMLElement | null;
    private selectedPieceId: number | null = null;
    private selectedPieceElement: HTMLElement | null = null;

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

            // 添加点击事件用于选择棋子
            pieceElement.addEventListener('click', () => {
                this.selectPiece(piece.id, pieceElement);
            });

            this.pieceTrayElement?.appendChild(pieceElement);
        });
    }

    private setupEventListeners(): void {
        // 添加键盘事件监听器
        document.addEventListener('keydown', (event) => {
            // 检查是否有选中的棋子
            if (this.selectedPieceId !== null) {
                if (event.key === 'r' || event.key === 'R') {
                    // 旋转选中的棋子
                    const rotatedPiece = this.humanPlayer.rotatePiece(this.selectedPieceId);
                    if (rotatedPiece) {
                        // 更新棋子的显示
                        this.updatePieceDisplay(rotatedPiece);
                    }
                } else if (event.key === 'f' || event.key === 'F') {
                    // 翻转选中的棋子
                    const flippedPiece = this.humanPlayer.flipPiece(this.selectedPieceId);
                    if (flippedPiece) {
                        // 更新棋子的显示
                        this.updatePieceDisplay(flippedPiece);
                    }
                } else if (event.key === 'Escape') {
                    // 取消选择棋子
                    this.deselectPiece();
                }
            }
        });

        // 添加棋盘点击事件用于放置棋子
        if (this.boardElement) {
            this.boardElement.addEventListener('click', (event) => {
                if (this.selectedPieceId !== null) {
                    // 根据点击位置计算棋盘坐标并尝试放置棋子
                    // 这部分逻辑需要稍后实现
                    console.log('Board clicked, attempting to place piece');
                }
            });
        }
    }

    // 选择棋子
    private selectPiece(pieceId: number, element: HTMLElement): void {
        // 如果已经选中了一个棋子，先取消选择
        this.deselectPiece();

        // 设置新选中的棋子
        this.selectedPieceId = pieceId;
        this.selectedPieceElement = element;
        element.classList.add('selected');

        console.log(`Piece ${pieceId} selected`);
    }

    // 取消棋子选择
    private deselectPiece(): void {
        if (this.selectedPieceElement) {
            this.selectedPieceElement.classList.remove('selected');
        }
        this.selectedPieceId = null;
        this.selectedPieceElement = null;
    }

    // 更新棋子显示
    private updatePieceDisplay(piece: Piece): void {
        if (!this.selectedPieceElement) return;

        // 清除原有的 canvas
        const oldCanvas = this.selectedPieceElement.querySelector('canvas');
        if (!oldCanvas) return;

        // 创建新的 canvas 以正确显示旋转或翻转后的棋子
        const canvas = document.createElement('canvas');
        canvas.width = piece.shape[0].length * 20;
        canvas.height = piece.shape.length * 20;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 绘制更新后的棋子形状
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

        // 替换旧的 canvas
        this.selectedPieceElement.replaceChild(canvas, oldCanvas);

        console.log(`Piece ${piece.id} display updated`);
    }

    // Additional game methods will be added here
} 