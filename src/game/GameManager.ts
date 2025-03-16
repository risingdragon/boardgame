import { Board } from './Board';
import { Player } from './Player';
import { AIPlayer } from './AIPlayer';
import { PieceFactory } from './PieceFactory';
import { Piece } from './Piece';
import { GameRenderer } from './GameRenderer';
import { GameEventHandler } from './GameEventHandler';

// 定义游戏状态接口
export interface GameState {
    boardGrid: number[][];
    humanPlayerPieces: { [id: number]: boolean }; // true表示可用，false表示已使用
    aiPlayerPieces: { [id: number]: boolean };
    currentPlayerIsHuman: boolean;
    consecutivePasses: number;
    isGameOver: boolean;
    savedAt?: string; // 保存时间戳
    waitingForAIMove?: boolean; // 标记是否正在等待AI移动
}

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
    private saveGameCallback: (gameState: GameState) => void; // 保存游戏的回调函数

    constructor(
        boardElement: HTMLElement | null,
        pieceTrayElement: HTMLElement | null,
        gameInfoElement: HTMLElement | null,
        saveGameCallback: (gameState: GameState) => void
    ) {
        this.board = new Board(14, 14); // 14x14棋盘
        this.pieceFactory = new PieceFactory();
        this.humanPlayer = new Player('玩家', 'blue', this.pieceFactory.createAllPieces());
        this.aiPlayer = new AIPlayer('AI', 'red', this.pieceFactory.createAllPieces());
        this.currentPlayer = this.humanPlayer; // 人类玩家先行
        this.saveGameCallback = saveGameCallback;

        // 创建渲染器，传递board实例
        this.renderer = new GameRenderer(boardElement, pieceTrayElement, gameInfoElement, this.board);

        // 创建事件处理器
        this.eventHandler = new GameEventHandler(this.board, boardElement, this.renderer);
    }

    // 初始化游戏
    public initialize(savedState: GameState | null = null): void {
        console.log('Initializing Blokus game...');

        // 如果有保存的游戏状态，恢复游戏
        if (savedState) {
            console.log('Found saved state, restoring game...', savedState);
            this.restoreGameState(savedState);
        } else {
            console.log('No saved state found, starting new game with human player first');
            // 确保新游戏从人类玩家开始
            this.currentPlayer = this.humanPlayer;
            this.eventHandler.setIsHumanTurn(true);
        }

        console.log('Current player after initialization:', this.currentPlayer === this.humanPlayer ? 'Human' : 'AI');

        // 渲染棋盘
        this.renderer.renderBoard(this.board);

        // 创建控制提示区域
        const controlTipsElement = this.renderer.createControlTips();

        // 创建Pass按钮
        const passButton = this.renderer.createPassButton(() => this.handlePassTurn());

        // 创建新游戏按钮
        const newGameButton = this.renderer.createNewGameButton();

        // 确保棋盘UI反映当前玩家的回合
        const isHumanTurn = this.currentPlayer === this.humanPlayer;

        // 渲染玩家棋子托盘，确保它反映当前玩家的回合
        this.renderer.renderPieceTray(
            this.humanPlayer,
            isHumanTurn,
            (pieceId, element) => this.selectPiece(pieceId, element)
        );

        // 渲染AI棋子托盘
        this.renderer.renderAIPieceTray(this.aiPlayer);

        // 设置事件监听器
        this.setupEventListeners();

        // 更新游戏信息
        this.updateGameInfo();

        // 检查是否需要显示pass按钮
        this.updatePassButtonVisibility();

        console.log('Game initialized successfully with current player:', this.currentPlayer === this.humanPlayer ? 'Human' : 'AI');

        // 如果恢复的状态显示当前是AI回合，且标记为等待AI移动，则自动执行AI的移动
        if (savedState && !savedState.currentPlayerIsHuman && savedState.waitingForAIMove && !this.isGameOver) {
            console.log('Restored game state with AI turn waiting for move, triggering AI move...');
            // 给一些延迟以确保UI已更新
            setTimeout(() => {
                this.performAIMove();
            }, 1500);
        }
    }

    // 恢复游戏状态
    private restoreGameState(savedState: GameState): void {
        console.log('Restoring game state...', savedState);

        // 恢复棋盘状态
        const grid = this.board.getGrid();
        for (let y = 0; y < savedState.boardGrid.length; y++) {
            for (let x = 0; x < savedState.boardGrid[y].length; x++) {
                grid[y][x] = savedState.boardGrid[y][x];
            }
        }

        // 恢复玩家棋子状态
        this.restorePlayerPieces(this.humanPlayer, savedState.humanPlayerPieces);
        this.restorePlayerPieces(this.aiPlayer, savedState.aiPlayerPieces);

        // 恢复当前玩家
        const isHumanTurn = savedState.currentPlayerIsHuman;
        console.log('Saved state indicates it is human turn:', isHumanTurn);

        this.currentPlayer = isHumanTurn ? this.humanPlayer : this.aiPlayer;
        this.eventHandler.setIsHumanTurn(isHumanTurn);

        // 恢复其他游戏状态
        this.consecutivePasses = savedState.consecutivePasses;
        this.isGameOver = savedState.isGameOver;

        console.log('Game state restored successfully, current player:', this.currentPlayer === this.humanPlayer ? 'Human' : 'AI');
    }

    // 恢复玩家的棋子状态
    private restorePlayerPieces(player: Player, piecesState: { [id: number]: boolean }): void {
        // 对于每个棋子ID，如果它在状态中标记为false（已使用），则从玩家可用棋子中移除
        Object.entries(piecesState).forEach(([pieceIdStr, isAvailable]) => {
            const pieceId = parseInt(pieceIdStr);
            if (!isAvailable) {
                player.placePiece(pieceId);
            }
        });
    }

    // 创建当前游戏状态的快照
    private createGameState(waitingForAIMove: boolean = false): GameState {
        const humanPlayerPieces: { [id: number]: boolean } = {};
        const aiPlayerPieces: { [id: number]: boolean } = {};

        // 获取所有可能的棋子ID
        this.pieceFactory.createAllPieces().forEach(piece => {
            // 默认所有棋子都是可用的
            humanPlayerPieces[piece.id] = true;
            aiPlayerPieces[piece.id] = true;
        });

        // 标记已使用的棋子
        this.humanPlayer.getUsedPieceIds().forEach(id => {
            humanPlayerPieces[id] = false;
        });

        this.aiPlayer.getUsedPieceIds().forEach(id => {
            aiPlayerPieces[id] = false;
        });

        // 确保currentPlayerIsHuman反映当前的游戏状态
        const currentPlayerIsHuman = this.currentPlayer === this.humanPlayer;

        console.log('Creating game state snapshot. Current player is:', currentPlayerIsHuman ? 'Human' : 'AI',
            'Waiting for AI move:', waitingForAIMove);

        const gameState: GameState = {
            boardGrid: this.board.getGrid(),
            humanPlayerPieces,
            aiPlayerPieces,
            currentPlayerIsHuman,
            consecutivePasses: this.consecutivePasses,
            isGameOver: this.isGameOver,
            waitingForAIMove: waitingForAIMove
        };

        return gameState;
    }

    // 保存当前游戏状态
    private saveGameState(waitingForAIMove: boolean = false): void {
        // 如果游戏已结束，不需要保存
        if (this.isGameOver) return;

        const gameState = this.createGameState(waitingForAIMove);
        this.saveGameCallback(gameState);
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

            // 保存游戏状态 - 显式设置为false，表示不是在等待AI移动
            this.saveGameState(false);

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

        // 保存游戏状态 - 显式设置为false，表示不是在等待AI移动
        this.saveGameState(false);

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

        // 确保AI棋子托盘显示最新状态
        this.renderer.renderAIPieceTray(this.aiPlayer);

        // 更新游戏信息显示
        this.updateGameInfo();

        // 隐藏Pass按钮（AI回合不需要）
        this.renderer.updatePassButtonVisibility(false);

        // 保存游戏状态，标记为等待AI移动
        this.saveGameState(true);

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

            // 更新AI棋子托盘，反映AI使用的棋子
            this.renderer.renderAIPieceTray(this.aiPlayer);

            // 标记并高亮AI最后放置的棋子位置
            this.renderer.setLastAIMove(moveResult.x, moveResult.y, moveResult.piece);
        } else {
            console.log("AI无法进行有效的移动");

            // AI无法移动，增加连续跳过回合的计数
            this.consecutivePasses++;

            // AI无法放置棋子，立即更新UI显示玩家的棋子托盘而不是"AI正在思考中..."
            this.renderer.renderPieceTray(
                this.humanPlayer,
                true,
                (pieceId, element) => this.selectPiece(pieceId, element)
            );
        }

        // 保存游戏状态，AI已完成移动，不再等待
        this.saveGameState(false);

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

        // 确保AI棋子托盘显示最新状态
        this.renderer.renderAIPieceTray(this.aiPlayer);

        // 更新游戏信息显示
        this.updateGameInfo();

        // 检查是否需要显示pass按钮
        this.updatePassButtonVisibility();

        // 保存游戏状态 - 明确表示不是在等待AI移动
        this.saveGameState(false);
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

        // 确保两个棋子托盘都显示最终状态
        this.renderer.renderPieceTray(
            this.humanPlayer,
            false,  // 游戏结束后不允许选择棋子
            () => { }
        );
        this.renderer.renderAIPieceTray(this.aiPlayer);

        // 清除保存的游戏状态（游戏已结束，下次开始新游戏）
        localStorage.removeItem('blokus_game_save');

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