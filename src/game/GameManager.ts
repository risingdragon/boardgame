import { Board } from './Board';
import { Player } from './Player';
import { AIPlayer } from './AIPlayer';
import { PieceFactory } from './PieceFactory';
import { Piece } from './Piece';
import { GameRenderer } from './GameRenderer';
import { GameEventHandler } from './GameEventHandler';

export class GameManager {
    private board: Board;
    private humanPlayer: Player;
    private aiPlayer: AIPlayer;
    private currentPlayer: Player;
    private pieceFactory: PieceFactory;
    private renderer: GameRenderer;
    private eventHandler: GameEventHandler;
    private consecutivePasses: number = 0;
    private isGameOver: boolean = false;

    constructor(
        boardElement: HTMLElement | null,
        pieceTrayElement: HTMLElement | null,
        gameInfoElement: HTMLElement | null
    ) {
        this.board = new Board(14, 14); // 14x14棋盘
        this.pieceFactory = new PieceFactory();
        this.humanPlayer = new Player('玩家', 'blue', this.pieceFactory.createAllPieces());
        this.aiPlayer = new AIPlayer('AI', 'red', this.pieceFactory.createAllPieces());
        this.currentPlayer = this.humanPlayer; // 人类玩家先行

        // 创建渲染器
        this.renderer = new GameRenderer(boardElement, pieceTrayElement, gameInfoElement);

        // 创建事件处理器
        this.eventHandler = new GameEventHandler(this.board, boardElement, this.renderer);
    }

    // 初始化游戏
    public initialize(): void {
        console.log('Initializing Blokus game...');

        // 渲染棋盘
        this.renderer.renderBoard(this.board);

        // 创建控制提示区域
        const controlTipsElement = this.renderer.createControlTips();

        // 创建Pass按钮
        const passButton = this.renderer.createPassButton(() => this.handlePassTurn());

        // 渲染玩家棋子托盘
        this.renderer.renderPieceTray(
            this.humanPlayer,
            this.currentPlayer === this.humanPlayer,
            (pieceId, element) => this.selectPiece(pieceId, element)
        );

        // 设置事件监听器
        this.setupEventListeners();

        // 更新游戏信息
        this.updateGameInfo();

        // 检查是否需要显示pass按钮
        this.updatePassButtonVisibility();

        console.log('Game initialized successfully!');
    }

    // 设置事件监听器
    private setupEventListeners(): void {
        this.eventHandler.setupEventListeners(
            this.humanPlayer,
            // 旋转棋子回调
            (pieceId) => {
                const piece = this.humanPlayer.rotatePiece(pieceId);
                return piece || null; // 确保返回 Piece | null
            },
            // 翻转棋子回调
            (pieceId) => {
                const piece = this.humanPlayer.flipPiece(pieceId);
                return piece || null; // 确保返回 Piece | null
            },
            // 选择棋子回调
            (pieceId, element) => this.selectPiece(pieceId, element),
            // 取消选择棋子回调
            () => this.deselectPiece(),
            // 尝试放置棋子回调
            (gridX, gridY) => this.tryPlacePiece(gridX, gridY),
            // 跳过回合回调
            () => this.handlePassTurn()
        );
    }

    // 选择棋子
    private selectPiece(pieceId: number, element: HTMLElement): void {
        // 只在人类玩家回合可以选择棋子
        if (this.currentPlayer !== this.humanPlayer || this.isGameOver) return;

        // 如果已经选中了一个棋子，先取消选择
        this.deselectPiece();

        // 设置新选中的棋子
        this.eventHandler.setSelectedPieceId(pieceId);
        this.eventHandler.setSelectedPieceElement(element);
        element.classList.add('selected');

        console.log(`Piece ${pieceId} selected`);
    }

    // 取消棋子选择
    private deselectPiece(): void {
        const selectedPieceElement = this.eventHandler.getSelectedPieceElement();
        if (selectedPieceElement) {
            selectedPieceElement.classList.remove('selected');
        }
        this.eventHandler.setSelectedPieceId(null);
        this.eventHandler.setSelectedPieceElement(null);

        // 移除悬浮棋子
        this.eventHandler.removeHoveredPiece();
    }

    // 尝试在指定位置放置选中的棋子
    private tryPlacePiece(gridX: number, gridY: number): void {
        const selectedPieceId = this.eventHandler.getSelectedPieceId();
        if (selectedPieceId === null || this.currentPlayer !== this.humanPlayer || this.isGameOver) return;

        // 获取选中的棋子
        const piece = this.humanPlayer.getPiece(selectedPieceId);
        if (!piece) return;

        console.log(`Trying to place piece ${selectedPieceId} at position (${gridX}, ${gridY})`);
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
            this.renderer.renderBoard(this.board);

            // 取消选择棋子
            this.deselectPiece();

            // 切换到AI玩家
            this.switchToAIPlayer();
        } else {
            console.log(`Invalid placement at position (${gridX}, ${gridY}). Piece shape:`, piece.shape);

            // 显示放置无效的视觉提示
            const hoveredPieceElement = this.eventHandler.getHoveredPieceElement();
            if (hoveredPieceElement) {
                // 添加一个短暂的视觉提示
                hoveredPieceElement.style.filter = 'drop-shadow(0 0 10px red)';
                hoveredPieceElement.style.opacity = '0.3';

                // 0.5秒后恢复
                setTimeout(() => {
                    const currentHoveredPiece = this.eventHandler.getHoveredPieceElement();
                    if (currentHoveredPiece === hoveredPieceElement) {
                        hoveredPieceElement.style.filter = '';
                        hoveredPieceElement.style.opacity = '0.7';
                    }
                }, 500);
            }
        }
    }

    // 处理玩家跳过回合
    private handlePassTurn(): void {
        if (this.isGameOver) return;

        console.log("玩家跳过回合");

        // 增加连续跳过回合的计数
        this.consecutivePasses++;

        // 取消选中的棋子
        this.deselectPiece();

        // 切换到AI玩家
        this.switchToAIPlayer();
    }

    // 切换到AI玩家并执行AI回合
    private switchToAIPlayer(): void {
        // 如果游戏已结束，不执行后续操作
        if (this.isGameOver) return;

        this.currentPlayer = this.aiPlayer;
        console.log("AI的回合");

        // 更新事件处理器中的玩家回合状态
        this.eventHandler.setIsHumanTurn(false);

        // 更新玩家棋盘UI
        this.renderer.renderPieceTray(
            this.aiPlayer,
            false,
            () => { } // AI回合没有棋子选择
        );

        // 更新游戏信息显示
        this.updateGameInfo();

        // 隐藏Pass按钮（AI回合不需要）
        this.renderer.updatePassButtonVisibility(false);

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
            this.renderer.renderBoard(this.board);

            // 标记并高亮AI最后放置的棋子位置
            this.renderer.setLastAIMove(moveResult.x, moveResult.y, moveResult.piece);
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

        // 更新事件处理器中的玩家回合状态
        this.eventHandler.setIsHumanTurn(true);

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
        this.renderer.renderPieceTray(
            this.humanPlayer,
            true,
            (pieceId, element) => this.selectPiece(pieceId, element)
        );

        // 更新游戏信息显示
        this.updateGameInfo();

        // 检查是否需要显示pass按钮
        this.updatePassButtonVisibility();
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

    // 更新游戏信息显示
    private updateGameInfo(): void {
        const isHumanTurn = this.currentPlayer === this.humanPlayer;
        const hasValidMoves = isHumanTurn ? this.hasValidMoves(this.humanPlayer, 1) : true;
        const canPlacePieces = isHumanTurn ? this.humanPlayer.canPlacePieces() : true;

        this.renderer.updateGameInfo(isHumanTurn, hasValidMoves, canPlacePieces);

        // 检测是否为移动设备
        const isTouchDevice = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0;

        // 如果是人类玩家回合，重新创建触摸控制按钮
        if (isHumanTurn) {
            this.renderer.createMobileTouchControls(
                // 旋转按钮回调
                () => {
                    const selectedPieceId = this.eventHandler.getSelectedPieceId();
                    if (selectedPieceId !== null) {
                        const rotatedPiece = this.humanPlayer.rotatePiece(selectedPieceId);
                        if (rotatedPiece) {
                            const selectedPieceElement = this.eventHandler.getSelectedPieceElement();
                            if (selectedPieceElement) {
                                this.renderer.updatePieceDisplay(selectedPieceElement, rotatedPiece, this.humanPlayer.color);
                            }

                            const hoveredPieceElement = this.eventHandler.getHoveredPieceElement();
                            if (hoveredPieceElement) {
                                this.renderer.updateHoveredPieceDisplay(hoveredPieceElement, rotatedPiece, this.humanPlayer.color);
                            }
                        }
                    }
                },
                // 翻转按钮回调
                () => {
                    const selectedPieceId = this.eventHandler.getSelectedPieceId();
                    if (selectedPieceId !== null) {
                        const flippedPiece = this.humanPlayer.flipPiece(selectedPieceId);
                        if (flippedPiece) {
                            const selectedPieceElement = this.eventHandler.getSelectedPieceElement();
                            if (selectedPieceElement) {
                                this.renderer.updatePieceDisplay(selectedPieceElement, flippedPiece, this.humanPlayer.color);
                            }

                            const hoveredPieceElement = this.eventHandler.getHoveredPieceElement();
                            if (hoveredPieceElement) {
                                this.renderer.updateHoveredPieceDisplay(hoveredPieceElement, flippedPiece, this.humanPlayer.color);
                            }
                        }
                    }
                },
                // 传递设备类型
                isTouchDevice
            );
        }
    }

    // 检查并更新pass按钮的显示状态
    private updatePassButtonVisibility(): void {
        // 只在人类玩家回合并且没有有效移动时显示
        const shouldShowPassButton = this.currentPlayer === this.humanPlayer && !this.hasValidMoves(this.humanPlayer, 1);
        this.renderer.updatePassButtonVisibility(shouldShowPassButton);
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
        // 计算最终得分
        const humanScore = this.calculateFinalScore(this.humanPlayer);
        const aiScore = this.calculateFinalScore(this.aiPlayer);

        // 显示游戏结束界面
        this.renderer.showGameOverScreen(
            humanScore,
            aiScore,
            this.humanPlayer.getAvailablePieces().length,
            this.aiPlayer.getAvailablePieces().length
        );

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
} 