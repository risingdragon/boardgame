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
    private gameInfoElement: HTMLElement | null;
    private controlTipsElement: HTMLElement | null;
    private selectedPieceId: number | null = null;
    private selectedPieceElement: HTMLElement | null = null;
    private hoveredPieceElement: HTMLElement | null = null;

    constructor() {
        this.board = new Board(14, 14); // 14x14棋盘
        this.pieceFactory = new PieceFactory();
        this.humanPlayer = new Player('玩家', 'blue', this.pieceFactory.createAllPieces());
        this.aiPlayer = new AIPlayer('AI', 'red', this.pieceFactory.createAllPieces());
        this.currentPlayer = this.humanPlayer; // 人类玩家先行

        this.gameContainer = document.getElementById('game-container');
        this.boardElement = document.getElementById('game-board');
        this.pieceTrayElement = document.getElementById('piece-tray');
        this.gameInfoElement = document.getElementById('game-info');
        this.controlTipsElement = null;
    }

    public initialize(): void {
        console.log('Initializing Blokus game...');

        // Initialize the board UI
        if (this.boardElement) {
            this.board.render(this.boardElement);

            // 创建控制提示区域并添加到棋盘下方
            this.createControlTips();
        }

        // Initialize player piece tray
        this.renderPieceTray();

        // Set up event listeners
        this.setupEventListeners();

        // 显示当前玩家信息
        this.updateGameInfo();

        console.log('Game initialized successfully!');
    }

    // 创建控制提示区域
    private createControlTips(): void {
        if (!this.boardElement) return;

        // 创建控制提示元素
        this.controlTipsElement = document.createElement('div');
        this.controlTipsElement.id = 'control-tips';
        this.controlTipsElement.style.width = '100%';
        this.controlTipsElement.style.padding = '10px';
        this.controlTipsElement.style.marginTop = '10px';
        this.controlTipsElement.style.backgroundColor = '#f5f5f5';
        this.controlTipsElement.style.borderRadius = '5px';
        this.controlTipsElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        this.controlTipsElement.style.textAlign = 'center';
        this.controlTipsElement.style.fontSize = '14px';

        // 设置控制提示内容
        this.controlTipsElement.innerHTML = `
            <p><strong>操作提示:</strong> 点击选择棋子，R键旋转，F键翻转，ESC取消选择</p>
        `;

        // 添加到棋盘元素后面
        this.boardElement.insertAdjacentElement('afterend', this.controlTipsElement);
    }

    private renderPieceTray(): void {
        if (!this.pieceTrayElement) return;

        // Clear previous pieces
        this.pieceTrayElement.innerHTML = '';

        // 只在人类玩家回合显示棋子托盘内容
        if (this.currentPlayer === this.humanPlayer) {
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
        } else {
            // AI回合时显示提示信息
            const aiTurnMessage = document.createElement('div');
            aiTurnMessage.style.padding = '20px';
            aiTurnMessage.style.textAlign = 'center';
            aiTurnMessage.style.fontSize = '18px';
            aiTurnMessage.innerHTML = 'AI正在思考中...';
            this.pieceTrayElement.appendChild(aiTurnMessage);
        }
    }

    private setupEventListeners(): void {
        // 添加键盘事件监听器
        document.addEventListener('keydown', (event) => {
            // 检查是否有选中的棋子，并且是人类玩家回合
            if (this.selectedPieceId !== null && this.currentPlayer === this.humanPlayer) {
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
                if (this.selectedPieceId !== null && this.currentPlayer === this.humanPlayer) {
                    this.createHoveredPiece();
                }
            });

            // 鼠标离开棋盘时移除悬浮棋子
            this.boardElement.addEventListener('mouseleave', () => {
                this.removeHoveredPiece();
            });

            // 鼠标在棋盘上移动时更新悬浮棋子位置
            this.boardElement.addEventListener('mousemove', (event) => {
                if (this.selectedPieceId !== null && this.hoveredPieceElement && this.boardElement && this.currentPlayer === this.humanPlayer) {
                    const rect = this.boardElement.getBoundingClientRect();
                    // 计算鼠标相对于棋盘的位置
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;

                    // 棋盘有15px的内边距，需要考虑这个偏移
                    const boardPadding = 15;

                    // 调整鼠标位置，考虑内边距
                    const adjustedX = x - boardPadding;
                    const adjustedY = y - boardPadding;

                    // 计算棋盘格子坐标
                    const cellSize = 30; // 与Board类中定义的一致
                    const gridX = Math.floor(adjustedX / cellSize);
                    const gridY = Math.floor(adjustedY / cellSize);

                    // 只有当鼠标在有效的棋盘区域内才更新棋子位置
                    if (gridX >= 0 && gridY >= 0) {
                        // 获取选中的棋子
                        const piece = this.humanPlayer.getPiece(this.selectedPieceId);
                        if (piece) {
                            // 获取棋子尺寸
                            const pieceWidth = piece.shape[0].length;
                            const pieceHeight = piece.shape.length;

                            // 计算棋子左上角对应的格子坐标（考虑居中调整）
                            const adjustedGridX = Math.max(0, gridX - Math.floor(pieceWidth / 2));
                            const adjustedGridY = Math.max(0, gridY - Math.floor(pieceHeight / 2));

                            // 计算棋子应该贴合的位置 - 需要加回棋盘内边距
                            const snapX = adjustedGridX * cellSize + boardPadding;
                            const snapY = adjustedGridY * cellSize + boardPadding;

                            // 使用直接定位方式
                            this.hoveredPieceElement.style.left = `${snapX}px`;
                            this.hoveredPieceElement.style.top = `${snapY}px`;
                            this.hoveredPieceElement.style.transform = ''; // 移除transform，直接使用left/top定位

                            // 检查放置是否有效
                            const humanPlayerId = 1;
                            const isValid = this.board.isValidPlacement(piece, adjustedGridX, adjustedGridY, humanPlayerId);

                            // 根据有效性更新悬浮棋子的外观
                            if (isValid) {
                                this.hoveredPieceElement.style.opacity = '0.7';
                                this.hoveredPieceElement.style.filter = 'drop-shadow(0 0 5px green)';
                            } else {
                                this.hoveredPieceElement.style.opacity = '0.5';
                                this.hoveredPieceElement.style.filter = 'drop-shadow(0 0 5px red)';
                            }

                            // 将调整后的坐标存储在悬浮元素上，以便点击时使用
                            this.hoveredPieceElement.dataset.gridX = adjustedGridX.toString();
                            this.hoveredPieceElement.dataset.gridY = adjustedGridY.toString();

                            // 添加网格辅助线以更清晰地显示棋子将放置的位置
                            this.updateGridHighlight(adjustedGridX, adjustedGridY, pieceWidth, pieceHeight, isValid);
                        }
                    }
                }
            });

            // 添加棋盘点击事件用于放置棋子
            this.boardElement.addEventListener('click', (event) => {
                if (this.selectedPieceId !== null && this.hoveredPieceElement && this.boardElement && this.currentPlayer === this.humanPlayer) {
                    // 使用存储在悬浮元素上的坐标，而不是再次计算
                    const gridX = parseInt(this.hoveredPieceElement.dataset.gridX || '0', 10);
                    const gridY = parseInt(this.hoveredPieceElement.dataset.gridY || '0', 10);

                    console.log(`Attempting to place piece at grid position: ${gridX}, ${gridY}`);

                    // 尝试放置棋子
                    this.tryPlacePiece(gridX, gridY);
                }
            });
        }
    }

    // 创建悬浮棋子显示
    private createHoveredPiece(): void {
        if (this.selectedPieceId === null || !this.boardElement || this.currentPlayer !== this.humanPlayer) return;

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
        hoveredPiece.style.transition = 'filter 0.2s'; // 添加过渡效果使颜色变化更平滑
        hoveredPiece.style.transformOrigin = 'top left'; // 修改变换原点为左上角

        // 确保棋盘元素为相对定位，这样悬浮棋子才能正确定位
        if (this.boardElement.style.position !== 'relative') {
            this.boardElement.style.position = 'relative';
        }

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

        // 创建网格高亮显示
        const gridHighlight = document.createElement('div');
        gridHighlight.classList.add('grid-highlight');
        gridHighlight.style.position = 'absolute';
        gridHighlight.style.pointerEvents = 'none';
        gridHighlight.style.zIndex = '99';
        gridHighlight.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
        gridHighlight.style.display = 'none'; // 初始时隐藏
        this.boardElement.appendChild(gridHighlight);

        this.boardElement.appendChild(hoveredPiece);
        this.hoveredPieceElement = hoveredPiece;

        // 初始定位到鼠标位置
        const mouseEvent = window.event as MouseEvent;
        if (mouseEvent && this.boardElement) {
            const rect = this.boardElement.getBoundingClientRect();
            // 计算鼠标相对于棋盘的位置（不是相对于窗口）
            const x = mouseEvent.clientX - rect.left;
            const y = mouseEvent.clientY - rect.top;

            // 棋盘有15px的内边距，需要考虑这个偏移
            const boardPadding = 15;

            // 调整鼠标位置，考虑内边距
            const adjustedX = x - boardPadding;
            const adjustedY = y - boardPadding;

            // 计算初始格子坐标
            const cellSize = 30;
            const gridX = Math.floor(adjustedX / cellSize);
            const gridY = Math.floor(adjustedY / cellSize);

            // 计算棋子左上角对应的格子坐标（考虑居中调整）
            const pieceWidth = piece.shape[0].length;
            const pieceHeight = piece.shape.length;
            const adjustedGridX = Math.max(0, gridX - Math.floor(pieceWidth / 2));
            const adjustedGridY = Math.max(0, gridY - Math.floor(pieceHeight / 2));

            // 计算棋子应该贴合的位置 - 需要加回棋盘内边距
            const snapX = adjustedGridX * cellSize + boardPadding;
            const snapY = adjustedGridY * cellSize + boardPadding;

            // 更新悬浮棋子的CSS样式，直接使用left/top定位
            hoveredPiece.style.left = `${snapX}px`;
            hoveredPiece.style.top = `${snapY}px`;

            hoveredPiece.dataset.gridX = adjustedGridX.toString();
            hoveredPiece.dataset.gridY = adjustedGridY.toString();

            // 更新网格高亮
            const humanPlayerId = 1;
            const isValid = this.board.isValidPlacement(piece, adjustedGridX, adjustedGridY, humanPlayerId);
            this.updateGridHighlight(adjustedGridX, adjustedGridY, pieceWidth, pieceHeight, isValid);
        }
    }

    // 更新悬浮棋子显示
    private updateHoveredPieceDisplay(piece: Piece): void {
        if (!this.hoveredPieceElement || this.currentPlayer !== this.humanPlayer) return;

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

        // 更新当前位置，防止画布大小变化导致位置错误
        if (this.hoveredPieceElement.dataset.gridX && this.hoveredPieceElement.dataset.gridY) {
            const gridX = parseInt(this.hoveredPieceElement.dataset.gridX, 10);
            const gridY = parseInt(this.hoveredPieceElement.dataset.gridY, 10);

            // 棋盘有15px的内边距
            const boardPadding = 15;
            const cellSize = 30;

            this.hoveredPieceElement.style.left = `${gridX * cellSize + boardPadding}px`;
            this.hoveredPieceElement.style.top = `${gridY * cellSize + boardPadding}px`;

            // 更新网格高亮
            this.updateGridHighlight(gridX, gridY, piece.shape[0].length, piece.shape.length,
                this.hoveredPieceElement.style.filter.includes('green'));
        }
    }

    // 移除悬浮棋子
    private removeHoveredPiece(): void {
        if (this.hoveredPieceElement && this.hoveredPieceElement.parentNode) {
            this.hoveredPieceElement.parentNode.removeChild(this.hoveredPieceElement);
            this.hoveredPieceElement = null;
        }

        // 移除网格高亮
        const gridHighlight = document.querySelector('.grid-highlight');
        if (gridHighlight && gridHighlight.parentNode) {
            gridHighlight.parentNode.removeChild(gridHighlight);
        }
    }

    // 选择棋子
    private selectPiece(pieceId: number, element: HTMLElement): void {
        // 只在人类玩家回合可以选择棋子
        if (this.currentPlayer !== this.humanPlayer) return;

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

    // 尝试在指定位置放置选中的棋子
    private tryPlacePiece(gridX: number, gridY: number): void {
        if (this.selectedPieceId === null || this.currentPlayer !== this.humanPlayer) return;

        // 获取选中的棋子
        const piece = this.humanPlayer.getPiece(this.selectedPieceId);
        if (!piece) return;

        console.log(`Trying to place piece ${this.selectedPieceId} at position (${gridX}, ${gridY})`);
        console.log(`Piece shape:`, piece.shape);

        // 验证放置位置是否合法
        const humanPlayerId = 1;
        if (this.board.isValidPlacement(piece, gridX, gridY, humanPlayerId)) {
            console.log(`Placement is valid! Placing piece ${piece.id} at position (${gridX}, ${gridY})`);

            // 在棋盘上放置棋子
            this.board.placePiece(piece, gridX, gridY, humanPlayerId);

            // 使用Player的placePiece方法来移除棋子
            this.humanPlayer.placePiece(piece.id);

            // 更新棋盘UI
            if (this.boardElement) {
                this.board.render(this.boardElement);
            }

            // 取消选择棋子
            this.deselectPiece();

            // 切换到AI玩家
            this.switchToAIPlayer();
        } else {
            console.log(`Invalid placement at position (${gridX}, ${gridY}). Piece shape:`, piece.shape);

            // 显示放置无效的提示
            if (this.hoveredPieceElement) {
                // 添加一个短暂的视觉提示
                this.hoveredPieceElement.style.filter = 'drop-shadow(0 0 10px red)';
                this.hoveredPieceElement.style.opacity = '0.3';

                // 0.5秒后恢复
                setTimeout(() => {
                    if (this.hoveredPieceElement) {
                        this.hoveredPieceElement.style.filter = '';
                        this.hoveredPieceElement.style.opacity = '0.7';
                    }
                }, 500);
            }
        }
    }

    // 判断是否是玩家的第一步棋
    private isFirstMove(player: Player): boolean {
        return player.getAvailablePieces().length === this.pieceFactory.createAllPieces().length;
    }

    // 切换到AI玩家并执行AI回合
    private switchToAIPlayer(): void {
        this.currentPlayer = this.aiPlayer;
        console.log("AI的回合");

        // 更新玩家棋盘UI
        this.renderPieceTray();

        // 更新游戏信息显示
        this.updateGameInfo();

        // 给AI一些思考时间
        setTimeout(() => {
            this.performAIMove();
        }, 1000);
    }

    // 执行AI玩家的移动
    private performAIMove(): void {
        // AI尝试放置一个棋子
        const moveResult = this.aiPlayer.makeMove(this.board);

        if (moveResult) {
            console.log(`AI placed piece at (${moveResult.x}, ${moveResult.y})`);

            // 从AI的可用棋子中移除该棋子
            this.aiPlayer.placePiece(moveResult.piece.id);

            // 在棋盘上放置棋子
            const aiPlayerId = 2;
            this.board.placePiece(moveResult.piece, moveResult.x, moveResult.y, aiPlayerId);

            // 更新棋盘UI
            if (this.boardElement) {
                this.board.render(this.boardElement);
            }
        } else {
            console.log("AI无法进行有效的移动");
        }

        // 切换回人类玩家
        this.switchToHumanPlayer();
    }

    // 切换回人类玩家
    private switchToHumanPlayer(): void {
        this.currentPlayer = this.humanPlayer;
        console.log("玩家回合");

        // 更新玩家棋盘UI
        this.renderPieceTray();

        // 更新游戏信息显示
        this.updateGameInfo();
    }

    // 更新游戏信息显示
    private updateGameInfo(): void {
        if (this.gameInfoElement) {
            if (this.currentPlayer === this.humanPlayer) {
                this.gameInfoElement.innerHTML = `
                    <h2>当前回合: 玩家 (蓝色)</h2>
                    <p>可用棋子: ${this.humanPlayer.getAvailablePieces().length}</p>
                `;
            } else {
                this.gameInfoElement.innerHTML = `
                    <h2>当前回合: AI (红色)</h2>
                    <p>AI正在思考...</p>
                `;
            }
        }
    }

    // 更新网格高亮显示
    private updateGridHighlight(gridX: number, gridY: number, width: number, height: number, isValid: boolean): void {
        const gridHighlight = document.querySelector('.grid-highlight') as HTMLElement;
        if (!gridHighlight || !this.boardElement) return;

        const cellSize = 30;
        const boardPadding = 15; // 棋盘内边距

        gridHighlight.style.display = 'block';
        gridHighlight.style.left = `${gridX * cellSize + boardPadding}px`;
        gridHighlight.style.top = `${gridY * cellSize + boardPadding}px`;
        gridHighlight.style.width = `${width * cellSize}px`;
        gridHighlight.style.height = `${height * cellSize}px`;
        gridHighlight.style.borderColor = isValid ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    }

    // Additional game methods will be added here
} 