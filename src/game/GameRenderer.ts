import { Board } from './Board';
import { Player } from './Player';
import { Piece } from './Piece';
import { UIElementManager } from './UIElementManager';
import { PieceRenderer } from './PieceRenderer';
import { GameStateRenderer } from './GameStateRenderer';

export class GameRenderer {
    private boardElement: HTMLElement | null;
    private pieceTrayElement: HTMLElement | null;
    private gameInfoElement: HTMLElement | null;
    private controlTipsElement: HTMLElement | null;
    private touchControlsElement: HTMLElement | null;
    private passButtonElement: HTMLElement | null;
    private gameOverLayerElement: HTMLElement | null;
    private lastAIMovePosition: { x: number; y: number; width: number; height: number } | null = null;
    private board: Board;
    private newGameButtonElement: HTMLElement | null = null;
    private aiPieceTrayElement: HTMLElement | null = null;

    // 子渲染器
    private uiManager: UIElementManager;
    private pieceRenderer: PieceRenderer;
    private gameStateRenderer: GameStateRenderer;

    constructor(
        boardElement: HTMLElement | null,
        pieceTrayElement: HTMLElement | null,
        gameInfoElement: HTMLElement | null,
        board: Board
    ) {
        this.boardElement = boardElement;
        this.pieceTrayElement = pieceTrayElement;
        this.gameInfoElement = gameInfoElement;
        this.controlTipsElement = null;
        this.touchControlsElement = null;
        this.passButtonElement = null;
        this.gameOverLayerElement = null;
        this.board = board;
        this.aiPieceTrayElement = document.getElementById('ai-piece-tray');

        // 初始化子渲染器
        this.uiManager = new UIElementManager();
        this.pieceRenderer = new PieceRenderer(board);
        this.gameStateRenderer = new GameStateRenderer(gameInfoElement);

        // 在初始化后记录棋盘位置
        setTimeout(() => this.logBoardPosition(), 500);
    }

    // 记录棋盘位置的帮助方法
    private logBoardPosition(): void {
        if (!this.boardElement) return;

        console.log('======= 棋盘位置信息 =======');

        // 获取棋盘元素的位置和尺寸
        const boardRect = this.boardElement.getBoundingClientRect();
        console.log(`棋盘元素: left=${boardRect.left}, top=${boardRect.top}, width=${boardRect.width}, height=${boardRect.height}`);

        // 获取棋盘样式信息
        const boardStyle = window.getComputedStyle(this.boardElement);
        console.log(`棋盘样式: position=${boardStyle.position}, display=${boardStyle.display}`);
        console.log(`棋盘边框: left=${boardStyle.borderLeftWidth}, top=${boardStyle.borderTopWidth}`);
        console.log(`棋盘边距: margin=${boardStyle.margin}, padding=${boardStyle.padding}`);

        // 获取Canvas元素信息
        const canvasElement = this.boardElement.querySelector('canvas');
        if (canvasElement) {
            const canvasRect = canvasElement.getBoundingClientRect();
            console.log(`Canvas元素: left=${canvasRect.left}, top=${canvasRect.top}, width=${canvasRect.width}, height=${canvasRect.height}`);

            // 相对于棋盘的位置
            console.log(`Canvas相对位置: left=${canvasRect.left - boardRect.left}, top=${canvasRect.top - boardRect.top}`);

            // Canvas样式信息
            const canvasStyle = window.getComputedStyle(canvasElement);
            console.log(`Canvas样式: position=${canvasStyle.position}, display=${canvasStyle.display}`);
            console.log(`Canvas边框: left=${canvasStyle.borderLeftWidth}, top=${canvasStyle.borderTopWidth}`);
            console.log(`Canvas边距: margin=${canvasStyle.margin}, padding=${canvasStyle.padding}`);
        } else {
            console.log('未找到Canvas元素');
        }

        console.log('======= 棋盘位置信息结束 =======');
    }

    // 渲染棋盘
    public renderBoard(board: Board): void {
        if (this.boardElement) {
            board.render(this.boardElement);

            // 如果有AI最后的移动位置，在渲染棋盘后高亮显示
            this.highlightLastAIMove();

            // 记录最新的棋盘位置
            setTimeout(() => this.logBoardPosition(), 100);
        }
    }

    // 设置AI最后放置的棋子位置
    public setLastAIMove(x: number, y: number, piece: Piece): void {
        this.lastAIMovePosition = {
            x: x,
            y: y,
            width: piece.shape[0].length,
            height: piece.shape.length
        };

        // 立即高亮显示
        this.highlightLastAIMove();
    }

    // 高亮显示AI最后放置的棋子
    private highlightLastAIMove(): void {
        // 移除之前的高亮效果
        const existingHighlight = document.getElementById('ai-last-move-highlight');
        if (existingHighlight && existingHighlight.parentNode) {
            existingHighlight.parentNode.removeChild(existingHighlight);
        }

        // 如果没有最后移动位置或没有棋盘元素，则返回
        if (!this.lastAIMovePosition || !this.boardElement) return;

        // 检测棋盘元素及其边框
        const boardStyle = window.getComputedStyle(this.boardElement);
        const boardBorderLeft = parseInt(boardStyle.borderLeftWidth || '0', 10);
        const boardBorderTop = parseInt(boardStyle.borderTopWidth || '0', 10);

        // 创建高亮元素
        const highlightElement = document.createElement('div');
        highlightElement.id = 'ai-last-move-highlight';
        this.setupHighlightStyles(highlightElement);

        // 设置高亮位置和尺寸
        const cellSize = this.board.getCellSize();
        const boardPadding = 20;
        const x = this.lastAIMovePosition.x * cellSize + boardPadding + boardBorderLeft;
        const y = this.lastAIMovePosition.y * cellSize + boardPadding + boardBorderTop;
        const width = this.lastAIMovePosition.width * cellSize;
        const height = this.lastAIMovePosition.height * cellSize;

        highlightElement.style.left = `${Math.floor(x)}px`;
        highlightElement.style.top = `${Math.floor(y)}px`;
        highlightElement.style.width = `${Math.floor(width)}px`;
        highlightElement.style.height = `${Math.floor(height)}px`;

        // 添加AI标签
        const labelElement = this.createAILabel();
        highlightElement.appendChild(labelElement);

        // 添加到棋盘
        this.boardElement.appendChild(highlightElement);

        // 5秒后自动移除高亮
        this.setupHighlightRemoval(highlightElement);
    }

    private setupHighlightStyles(element: HTMLElement): void {
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.zIndex = '90';
        element.style.boxSizing = 'content-box';
        element.style.border = '2px solid yellow';
        element.style.boxShadow = '0 0 10px rgba(255, 255, 0, 0.8)';
        element.style.borderRadius = '3px';
        element.style.animation = 'pulse-ai-move 2s infinite';

        // 添加动画样式
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes pulse-ai-move {
                0% { opacity: 0.8; }
                50% { opacity: 0.3; }
                100% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(styleElement);
    }

    private createAILabel(): HTMLElement {
        const label = document.createElement('div');
        label.textContent = 'AI';
        label.style.position = 'absolute';
        label.style.top = '0';
        label.style.right = '0';
        label.style.backgroundColor = 'red';
        label.style.color = 'white';
        label.style.padding = '2px 5px';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.borderRadius = '2px';
        return label;
    }

    private setupHighlightRemoval(element: HTMLElement): void {
        setTimeout(() => {
            if (element && element.parentNode) {
                element.style.transition = 'opacity 1s';
                element.style.opacity = '0';

                setTimeout(() => {
                    if (element && element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                }, 1000);
            }
        }, 5000);
    }

    // 创建控制提示区域
    public createControlTips(): HTMLElement | null {
        if (!this.boardElement) return null;
        this.controlTipsElement = this.uiManager.createControlTips(this.boardElement);
        return this.controlTipsElement;
    }

    // 创建跳过回合按钮
    public createPassButton(onPassTurn: () => void): HTMLElement {
        this.passButtonElement = this.uiManager.createPassButton(onPassTurn);
        return this.passButtonElement;
    }

    // 更新Pass按钮的显示状态
    public updatePassButtonVisibility(shouldShow: boolean): void {
        if (!this.passButtonElement) return;
        this.passButtonElement.style.display = shouldShow ? 'block' : 'none';
    }

    // 渲染玩家的棋子托盘
    public renderPieceTray(currentPlayer: Player, isHumanTurn: boolean, onPieceSelect: (pieceId: number, element: HTMLElement) => void): void {
        if (!this.pieceTrayElement) return;
        this.pieceRenderer.renderPieceTray(this.pieceTrayElement, currentPlayer, isHumanTurn, onPieceSelect);
    }

    // 更新游戏信息显示
    public updateGameInfo(isHumanTurn: boolean, hasValidMoves: boolean, canPlacePieces: boolean): void {
        this.gameStateRenderer.updateGameInfo(
            isHumanTurn,
            hasValidMoves,
            canPlacePieces,
            this.passButtonElement,
            this.newGameButtonElement
        );
    }

    // 创建移动设备的触摸控制按钮
    public createMobileTouchControls(onRotate: () => void, onFlip: () => void, isTouchDevice?: boolean): HTMLElement | null {
        this.touchControlsElement = this.uiManager.createMobileTouchControls(onRotate, onFlip, isTouchDevice);
        return this.touchControlsElement;
    }

    // 创建和更新悬浮显示的棋子
    public createHoveredPiece(piece: Piece, playerColor: string, boardRect: DOMRect): HTMLElement {
        if (!this.boardElement) {
            throw new Error('Cannot create hovered piece: board element is null');
        }
        return this.pieceRenderer.createHoveredPiece(piece, playerColor, boardRect, this.boardElement);
    }

    // 更新悬浮棋子的显示内容
    public updateHoveredPieceDisplay(hoveredPieceElement: HTMLElement, piece: Piece, playerColor: string): void {
        this.pieceRenderer.updateHoveredPieceDisplay(hoveredPieceElement, piece, playerColor);
    }

    // 更新悬浮棋子的位置和显示状态
    public updateHoveredPiecePosition(
        hoveredPieceElement: HTMLElement,
        gridX: number,
        gridY: number,
        isValidPlacement: boolean
    ): void {
        this.pieceRenderer.updateHoveredPiecePosition(
            hoveredPieceElement,
            gridX,
            gridY,
            isValidPlacement,
            this.boardElement
        );
    }

    // 移除悬浮棋子
    public removeHoveredPiece(hoveredPieceElement: HTMLElement | null): void {
        this.pieceRenderer.removeHoveredPiece(hoveredPieceElement);
    }

    // 更新棋子在托盘中的显示
    public updatePieceDisplay(pieceElement: HTMLElement, piece: Piece, playerColor: string): void {
        this.pieceRenderer.updatePieceDisplay(pieceElement, piece, playerColor);
    }

    // 显示游戏结束界面
    public showGameOverScreen(humanScore: number, aiScore: number, humanPiecesLeft: number, aiPiecesLeft: number): void {
        this.gameStateRenderer.showGameOverScreen(
            humanScore,
            aiScore,
            humanPiecesLeft,
            aiPiecesLeft,
            this.controlTipsElement
        );
    }

    // 创建新游戏按钮
    public createNewGameButton(): HTMLElement {
        this.newGameButtonElement = this.uiManager.createNewGameButton();
        return this.newGameButtonElement;
    }

    // 渲染AI的棋子托盘
    public renderAIPieceTray(aiPlayer: Player): void {
        this.pieceRenderer.renderAIPieceTray(this.aiPieceTrayElement, aiPlayer);
    }
} 