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
    private hoveredPieceElement: HTMLElement | null = null;

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
                        // 更新悬浮显示
                        if (this.hoveredPieceElement) {
                            this.updateHoveredPieceDisplay(rotatedPiece);
                        }
                    }
                } else if (event.key === 'f' || event.key === 'F') {
                    // 翻转选中的棋子
                    const flippedPiece = this.humanPlayer.flipPiece(this.selectedPieceId);
                    if (flippedPiece) {
                        // 更新棋子的显示
                        this.updatePieceDisplay(flippedPiece);
                        // 更新悬浮显示
                        if (this.hoveredPieceElement) {
                            this.updateHoveredPieceDisplay(flippedPiece);
                        }
                    }
                } else if (event.key === 'Escape') {
                    // 取消选择棋子
                    this.deselectPiece();
                }
            }
        });

        // 添加鼠标移动事件用于显示棋子悬浮效果
        if (this.boardElement) {
            // 确保棋盘元素为相对定位
            if (this.boardElement.style.position !== 'relative') {
                this.boardElement.style.position = 'relative';
            }

            // 鼠标进入棋盘时创建悬浮棋子
            this.boardElement.addEventListener('mouseenter', (event) => {
                if (this.selectedPieceId !== null) {
                    this.createHoveredPiece();
                }
            });

            // 鼠标离开棋盘时移除悬浮棋子
            this.boardElement.addEventListener('mouseleave', () => {
                this.removeHoveredPiece();
            });

            // 鼠标在棋盘上移动时更新悬浮棋子位置
            this.boardElement.addEventListener('mousemove', (event) => {
                if (this.selectedPieceId !== null && this.hoveredPieceElement && this.boardElement) {
                    const rect = this.boardElement.getBoundingClientRect();
                    // 计算鼠标相对于棋盘的位置
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;

                    // 使用transform来定位悬浮棋子，这样可以精确控制中心点
                    this.hoveredPieceElement.style.left = '0';
                    this.hoveredPieceElement.style.top = '0';
                    this.hoveredPieceElement.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

                    // 计算棋盘格子坐标（用于之后的放置逻辑）
                    const cellSize = 30; // 假设每个格子是30px
                    const gridX = Math.floor(x / cellSize);
                    const gridY = Math.floor(y / cellSize);

                    // 可以在这里添加代码来高亮显示有效/无效放置位置
                    console.log(`Grid position: ${gridX}, ${gridY}`);
                }
            });

            // 添加棋盘点击事件用于放置棋子
            this.boardElement.addEventListener('click', (event) => {
                if (this.selectedPieceId !== null && this.boardElement) {
                    const rect = this.boardElement.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;

                    // 计算棋盘格子坐标
                    const cellSize = 30; // 假设每个格子是30px
                    const gridX = Math.floor(x / cellSize);
                    const gridY = Math.floor(y / cellSize);

                    // 尝试放置棋子 (这部分逻辑需要实现)
                    console.log(`Attempting to place piece at grid position: ${gridX}, ${gridY}`);

                    // 放置棋子后应该调用this.deselectPiece()并移除悬浮棋子
                }
            });
        }
    }

    // 创建悬浮棋子显示
    private createHoveredPiece(): void {
        if (this.selectedPieceId === null || !this.boardElement) return;

        // 移除已有的悬浮棋子
        this.removeHoveredPiece();

        // 获取选中的棋子
        const piece = this.humanPlayer.getPiece(this.selectedPieceId);
        if (!piece) return;

        // 创建悬浮棋子元素
        const hoveredPiece = document.createElement('div');
        hoveredPiece.classList.add('hovered-piece');
        hoveredPiece.style.position = 'absolute';
        hoveredPiece.style.pointerEvents = 'none'; // 防止干扰鼠标事件
        hoveredPiece.style.opacity = '0.7'; // 半透明效果
        hoveredPiece.style.zIndex = '100';

        // 确保棋盘元素为相对定位，这样悬浮棋子才能正确定位
        if (this.boardElement.style.position !== 'relative') {
            this.boardElement.style.position = 'relative';
        }

        // 为悬浮棋子添加CSS变换原点设置，以确保旋转和翻转时以中心为轴
        hoveredPiece.style.transformOrigin = 'center center';

        // 创建画布显示棋子
        const canvas = document.createElement('canvas');
        const cellSize = 30; // 与棋盘格子尺寸匹配
        canvas.width = piece.shape[0].length * cellSize;
        canvas.height = piece.shape.length * cellSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 绘制棋子
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        ctx.fillStyle = this.humanPlayer.color;
                        ctx.fillRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
                    }
                });
            });
        }

        hoveredPiece.appendChild(canvas);
        this.boardElement.appendChild(hoveredPiece);
        this.hoveredPieceElement = hoveredPiece;

        // 初始定位到鼠标位置
        const mouseEvent = window.event as MouseEvent;
        if (mouseEvent && this.boardElement) {
            const rect = this.boardElement.getBoundingClientRect();
            // 计算鼠标相对于棋盘的位置（不是相对于窗口）
            const x = mouseEvent.clientX - rect.left;
            const y = mouseEvent.clientY - rect.top;

            // 更新悬浮棋子的CSS样式，设置为绝对定位
            hoveredPiece.style.left = '0';
            hoveredPiece.style.top = '0';
            hoveredPiece.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        }
    }

    // 更新悬浮棋子显示
    private updateHoveredPieceDisplay(piece: Piece): void {
        if (!this.hoveredPieceElement) return;

        // 移除旧画布
        const oldCanvas = this.hoveredPieceElement.querySelector('canvas');
        if (!oldCanvas) return;

        // 创建新画布
        const canvas = document.createElement('canvas');
        const cellSize = 30; // 与棋盘格子尺寸匹配
        canvas.width = piece.shape[0].length * cellSize;
        canvas.height = piece.shape.length * cellSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 绘制棋子
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        ctx.fillStyle = this.humanPlayer.color;
                        ctx.fillRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
                    }
                });
            });
        }

        // 替换旧画布
        this.hoveredPieceElement.replaceChild(canvas, oldCanvas);
    }

    // 移除悬浮棋子
    private removeHoveredPiece(): void {
        if (this.hoveredPieceElement && this.hoveredPieceElement.parentNode) {
            this.hoveredPieceElement.parentNode.removeChild(this.hoveredPieceElement);
            this.hoveredPieceElement = null;
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
        this.removeHoveredPiece();
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