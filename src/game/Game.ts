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
    private passButtonElement: HTMLElement | null;
    private gameOverLayerElement: HTMLElement | null;
    private selectedPieceId: number | null = null;
    private selectedPieceElement: HTMLElement | null = null;
    private hoveredPieceElement: HTMLElement | null = null;
    private consecutivePasses: number = 0;
    private isGameOver: boolean = false;

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
        this.passButtonElement = null;
        this.gameOverLayerElement = null;
    }

    public initialize(): void {
        console.log('Initializing Blokus game...');

        // Initialize the board UI
        if (this.boardElement) {
            this.board.render(this.boardElement);

            // 创建控制提示区域并添加到棋盘下方
            this.createControlTips();
        }

        // 创建Pass按钮
        this.createPassButton();

        // Initialize player piece tray
        this.renderPieceTray();

        // Set up event listeners
        this.setupEventListeners();

        // 显示当前玩家信息
        this.updateGameInfo();

        // 检查是否需要显示pass按钮
        this.updatePassButtonVisibility();

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
        if (this.selectedPieceId === null || this.currentPlayer !== this.humanPlayer || this.isGameOver) return;

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

            // 重置连续跳过回合的计数（因为成功放置了棋子）
            this.consecutivePasses = 0;

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
        // 如果游戏已结束，不执行后续操作
        if (this.isGameOver) return;

        this.currentPlayer = this.aiPlayer;
        console.log("AI的回合");

        // 更新玩家棋盘UI
        this.renderPieceTray();

        // 更新游戏信息显示
        this.updateGameInfo();

        // 隐藏Pass按钮（AI回合不需要）
        if (this.passButtonElement) {
            this.passButtonElement.style.display = 'none';
        }

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

            // 重置连续跳过回合的计数（因为AI成功放置了棋子）
            this.consecutivePasses = 0;

            // 更新棋盘UI
            if (this.boardElement) {
                this.board.render(this.boardElement);
            }
        } else {
            console.log("AI无法进行有效的移动");

            // AI无法移动，增加连续跳过回合的计数
            this.consecutivePasses++;
        }

        // 检查是否游戏结束
        if (this.checkGameOver()) {
            this.showGameOverScreen();
            return;
        }

        // 切换回人类玩家
        this.switchToHumanPlayer();
    }

    // 切换回人类玩家
    private switchToHumanPlayer(): void {
        // 如果游戏已结束，不执行后续操作
        if (this.isGameOver) return;

        this.currentPlayer = this.humanPlayer;
        console.log("玩家回合");

        // 检查玩家是否还有有效移动
        const hasValidMoves = this.hasValidMoves(this.humanPlayer, 1);

        // 如果玩家没有有效移动且游戏还在进行，检查是否游戏结束
        if (!hasValidMoves && !this.isGameOver) {
            this.consecutivePasses++;

            if (this.checkGameOver()) {
                this.showGameOverScreen();
                return;
            }
        }

        // 更新玩家棋盘UI
        this.renderPieceTray();

        // 更新游戏信息显示
        this.updateGameInfo();

        // 检查是否需要显示pass按钮
        this.updatePassButtonVisibility();
    }

    // 更新游戏信息显示
    private updateGameInfo(): void {
        if (this.gameInfoElement) {
            if (this.currentPlayer === this.humanPlayer) {
                // 检查玩家是否还有有效移动
                const hasValidMoves = this.hasValidMoves(this.humanPlayer, 1);

                this.gameInfoElement.innerHTML = `
                    <h2>当前回合: 玩家 (蓝色)</h2>
                    <p>可用棋子: ${this.humanPlayer.getAvailablePieces().length}</p>
                    ${!hasValidMoves && this.humanPlayer.canPlacePieces() ? '<p style="color: #f44336; font-weight: bold;">没有可放置的位置！请使用Pass按钮跳过回合。</p>' : ''}
                `;

                // 重新添加Pass按钮，因为innerHTML会清除所有子元素
                if (this.passButtonElement) {
                    this.gameInfoElement.appendChild(this.passButtonElement);
                }
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

    // 检查玩家是否有有效的移动
    private hasValidMoves(player: Player, playerId: number): boolean {
        // 如果没有可用棋子，则没有有效移动
        if (!player.canPlacePieces()) {
            return false;
        }

        const availablePieces = player.getAvailablePieces();
        const boardSize = 14;

        // 尝试每一个可用棋子
        for (const originalPiece of availablePieces) {
            // 创建一个副本进行测试
            const basePiece = originalPiece.clone();

            // 尝试不同的旋转和翻转
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // 复制棋子以进行旋转和翻转
                    const pieceCopy = basePiece.clone();

                    // 应用旋转
                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    // 应用翻转
                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 在棋盘上每个位置尝试放置
                    for (let y = 0; y < boardSize; y++) {
                        for (let x = 0; x < boardSize; x++) {
                            if (this.board.isValidPlacement(pieceCopy, x, y, playerId)) {
                                return true; // 找到一个有效的放置位置
                            }
                        }
                    }
                }
            }
        }

        return false; // 没有找到有效的放置位置
    }

    // 创建pass按钮
    private createPassButton(): void {
        if (this.passButtonElement) return;

        this.passButtonElement = document.createElement('button');
        this.passButtonElement.id = 'pass-button';
        this.passButtonElement.textContent = '跳过回合 (Pass)';
        this.passButtonElement.style.display = 'none'; // 初始隐藏
        this.passButtonElement.style.padding = '10px 20px';
        this.passButtonElement.style.margin = '10px 0';
        this.passButtonElement.style.backgroundColor = '#f44336';
        this.passButtonElement.style.color = 'white';
        this.passButtonElement.style.border = 'none';
        this.passButtonElement.style.borderRadius = '4px';
        this.passButtonElement.style.fontSize = '16px';
        this.passButtonElement.style.cursor = 'pointer';
        this.passButtonElement.style.fontWeight = 'bold';

        // 鼠标悬停效果
        this.passButtonElement.style.transition = 'background-color 0.3s';
        this.passButtonElement.addEventListener('mouseover', () => {
            if (this.passButtonElement) {
                this.passButtonElement.style.backgroundColor = '#d32f2f';
            }
        });
        this.passButtonElement.addEventListener('mouseout', () => {
            if (this.passButtonElement) {
                this.passButtonElement.style.backgroundColor = '#f44336';
            }
        });

        // 点击事件
        this.passButtonElement.addEventListener('click', () => {
            this.handlePassTurn();
        });

        // 添加到游戏信息元素下方
        if (this.gameInfoElement) {
            this.gameInfoElement.appendChild(this.passButtonElement);
        }
    }

    // 处理玩家跳过回合
    private handlePassTurn(): void {
        console.log("玩家跳过回合");

        // 增加连续跳过回合的计数
        this.consecutivePasses++;

        // 取消选中的棋子
        this.deselectPiece();

        // 切换到AI玩家
        this.switchToAIPlayer();
    }

    // 检查并更新pass按钮的显示状态
    private updatePassButtonVisibility(): void {
        if (!this.passButtonElement) return;

        // 只在人类玩家回合并且没有有效移动时显示
        if (this.currentPlayer === this.humanPlayer && !this.hasValidMoves(this.humanPlayer, 1)) {
            this.passButtonElement.style.display = 'block';
        } else {
            this.passButtonElement.style.display = 'none';
        }
    }

    // 检查游戏是否结束
    private checkGameOver(): boolean {
        // 条件1：连续两次pass（双方都无法放置）
        if (this.consecutivePasses >= 2) {
            this.isGameOver = true;
            return true;
        }

        // 条件2：双方都没有棋子或无法放置任何棋子
        const humanHasValidMoves = this.hasValidMoves(this.humanPlayer, 1);
        const aiHasValidMoves = this.hasValidMoves(this.aiPlayer, 2);

        if (!humanHasValidMoves && !aiHasValidMoves) {
            this.isGameOver = true;
            return true;
        }

        return false;
    }

    // 显示游戏结束界面
    private showGameOverScreen(): void {
        if (!this.gameContainer) return;

        // 计算最终得分
        const humanScore = this.calculateFinalScore(this.humanPlayer);
        const aiScore = this.calculateFinalScore(this.aiPlayer);

        // 创建游戏结束遮罩层
        this.gameOverLayerElement = document.createElement('div');
        this.gameOverLayerElement.style.position = 'absolute';
        this.gameOverLayerElement.style.top = '0';
        this.gameOverLayerElement.style.left = '0';
        this.gameOverLayerElement.style.width = '100%';
        this.gameOverLayerElement.style.height = '100%';
        this.gameOverLayerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.gameOverLayerElement.style.display = 'flex';
        this.gameOverLayerElement.style.flexDirection = 'column';
        this.gameOverLayerElement.style.justifyContent = 'center';
        this.gameOverLayerElement.style.alignItems = 'center';
        this.gameOverLayerElement.style.zIndex = '1000';
        this.gameOverLayerElement.style.color = 'white';
        this.gameOverLayerElement.style.padding = '20px';
        this.gameOverLayerElement.style.boxSizing = 'border-box';

        // 创建游戏结束内容面板
        const gameOverPanel = document.createElement('div');
        gameOverPanel.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
        gameOverPanel.style.borderRadius = '10px';
        gameOverPanel.style.padding = '30px';
        gameOverPanel.style.maxWidth = '500px';
        gameOverPanel.style.width = '90%';
        gameOverPanel.style.textAlign = 'center';
        gameOverPanel.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';

        // 标题
        const titleElement = document.createElement('h1');
        titleElement.textContent = '游戏结束';
        titleElement.style.marginBottom = '20px';
        titleElement.style.color = '#fff';
        titleElement.style.fontSize = '32px';

        // 结果
        const resultElement = document.createElement('div');
        resultElement.style.fontSize = '20px';
        resultElement.style.marginBottom = '30px';

        let resultText = '';
        if (humanScore > aiScore) {
            resultText = `🎉 恭喜，你获胜了！`;
            resultElement.style.color = '#4CAF50';
        } else if (aiScore > humanScore) {
            resultText = `😔 AI获胜了！`;
            resultElement.style.color = '#F44336';
        } else {
            resultText = `🤝 平局！`;
            resultElement.style.color = '#FFC107';
        }
        resultElement.textContent = resultText;

        // 得分
        const scoreElement = document.createElement('div');
        scoreElement.innerHTML = `
            <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 18px; margin-bottom: 5px;">玩家得分</div>
                    <div style="font-size: 28px; color: #3F51B5;">${humanScore}</div>
                </div>
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 18px; margin-bottom: 5px;">AI得分</div>
                    <div style="font-size: 28px; color: #E91E63;">${aiScore}</div>
                </div>
            </div>
        `;

        // 剩余棋子信息
        const piecesInfoElement = document.createElement('div');
        piecesInfoElement.style.marginBottom = '20px';
        piecesInfoElement.style.lineHeight = '1.6';
        piecesInfoElement.innerHTML = `
            <div style="margin-bottom: 10px; color: #ccc;">玩家剩余棋子: ${this.humanPlayer.getAvailablePieces().length} 个</div>
            <div style="color: #ccc;">AI剩余棋子: ${this.aiPlayer.getAvailablePieces().length} 个</div>
        `;

        // 添加重新开始按钮
        const restartButton = document.createElement('button');
        restartButton.textContent = '重新开始游戏';
        restartButton.style.padding = '12px 24px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '4px';
        restartButton.style.fontSize = '16px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.marginTop = '20px';
        restartButton.style.transition = 'background-color 0.3s';

        restartButton.addEventListener('mouseover', () => {
            restartButton.style.backgroundColor = '#45a049';
        });

        restartButton.addEventListener('mouseout', () => {
            restartButton.style.backgroundColor = '#4CAF50';
        });

        restartButton.addEventListener('click', () => {
            window.location.reload();
        });

        // 组装面板
        gameOverPanel.appendChild(titleElement);
        gameOverPanel.appendChild(resultElement);
        gameOverPanel.appendChild(scoreElement);
        gameOverPanel.appendChild(piecesInfoElement);
        gameOverPanel.appendChild(restartButton);

        // 将面板添加到遮罩层
        this.gameOverLayerElement.appendChild(gameOverPanel);

        // 将遮罩层添加到游戏容器
        this.gameContainer.appendChild(this.gameOverLayerElement);

        console.log(`游戏结束！玩家得分：${humanScore}，AI得分：${aiScore}`);
    }

    // 计算最终得分
    private calculateFinalScore(player: Player): number {
        // 在俄罗斯方块中，最终得分是指未使用的棋子方块数的负数
        // 所以已使用的棋子方块数越多，分数越高

        // 获取所有棋子的总方块数
        const totalPieces = this.pieceFactory.createAllPieces();
        const totalSquares = totalPieces.reduce((sum, piece) => sum + piece.getSize(), 0);

        // 获取未使用棋子的方块数
        const unusedSquares = player.getScore();

        // 计算已使用的方块数
        return totalSquares - unusedSquares;
    }

    // Additional game methods will be added here
} 