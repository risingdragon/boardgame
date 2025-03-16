import { Board } from './Board';
import { Player } from './Player';
import { Piece } from './Piece';
import { GameRenderer } from './GameRenderer';

export class GameEventHandler {
    private board: Board;
    private boardElement: HTMLElement | null;
    private renderer: GameRenderer;
    private selectedPieceId: number | null = null;
    private selectedPieceElement: HTMLElement | null = null;
    private hoveredPieceElement: HTMLElement | null = null;
    private isHumanTurn: boolean = true;

    constructor(
        board: Board,
        boardElement: HTMLElement | null,
        renderer: GameRenderer
    ) {
        this.board = board;
        this.boardElement = boardElement;
        this.renderer = renderer;
    }

    // 设置选中的棋子ID
    public setSelectedPieceId(id: number | null): void {
        this.selectedPieceId = id;
    }

    // 获取选中的棋子ID
    public getSelectedPieceId(): number | null {
        return this.selectedPieceId;
    }

    // 设置选中的棋子元素
    public setSelectedPieceElement(element: HTMLElement | null): void {
        this.selectedPieceElement = element;
    }

    // 获取选中的棋子元素
    public getSelectedPieceElement(): HTMLElement | null {
        return this.selectedPieceElement;
    }

    // 设置悬浮棋子元素
    public setHoveredPieceElement(element: HTMLElement | null): void {
        this.hoveredPieceElement = element;
    }

    // 获取悬浮棋子元素
    public getHoveredPieceElement(): HTMLElement | null {
        return this.hoveredPieceElement;
    }

    // 设置当前是否为人类玩家回合
    public setIsHumanTurn(isHumanTurn: boolean): void {
        this.isHumanTurn = isHumanTurn;
    }

    // 初始化所有事件监听器
    public setupEventListeners(
        humanPlayer: Player,
        onRotate: (pieceId: number) => Piece | null,
        onFlip: (pieceId: number) => Piece | null,
        onSelectPiece: (pieceId: number, element: HTMLElement) => void,
        onDeselectPiece: () => void,
        onTryPlacePiece: (gridX: number, gridY: number) => void,
        onPassTurn: () => void
    ): void {
        // 添加键盘事件监听器
        this.setupKeyboardEvents(humanPlayer, onRotate, onFlip, onDeselectPiece);

        // 添加触摸设备操作按钮
        this.setupTouchControls(humanPlayer, onRotate, onFlip);

        // 添加鼠标和触摸事件
        this.setupMouseAndTouchEvents(humanPlayer, onTryPlacePiece);
    }

    // 设置键盘事件
    private setupKeyboardEvents(
        humanPlayer: Player,
        onRotate: (pieceId: number) => Piece | null,
        onFlip: (pieceId: number) => Piece | null,
        onDeselectPiece: () => void
    ): void {
        document.addEventListener('keydown', (event) => {
            // 检查是否有选中的棋子，并且是人类玩家回合
            if (this.selectedPieceId !== null && this.isHumanTurn) {
                if (event.key === 'r' || event.key === 'R') {
                    // 旋转选中的棋子
                    const rotatedPiece = onRotate(this.selectedPieceId);
                    if (rotatedPiece && this.selectedPieceElement) {
                        // 更新棋子的显示
                        this.renderer.updatePieceDisplay(this.selectedPieceElement, rotatedPiece, humanPlayer.color);
                        // 更新悬浮显示
                        if (this.hoveredPieceElement) {
                            this.renderer.updateHoveredPieceDisplay(this.hoveredPieceElement, rotatedPiece, humanPlayer.color);
                        }
                    }
                } else if (event.key === 'f' || event.key === 'F') {
                    // 翻转选中的棋子
                    const flippedPiece = onFlip(this.selectedPieceId);
                    if (flippedPiece && this.selectedPieceElement) {
                        // 更新棋子的显示
                        this.renderer.updatePieceDisplay(this.selectedPieceElement, flippedPiece, humanPlayer.color);
                        // 更新悬浮显示
                        if (this.hoveredPieceElement) {
                            this.renderer.updateHoveredPieceDisplay(this.hoveredPieceElement, flippedPiece, humanPlayer.color);
                        }
                    }
                } else if (event.key === 'Escape') {
                    // 取消选择棋子
                    onDeselectPiece();
                }
            }
        });
    }

    // 设置触摸控制
    private setupTouchControls(
        humanPlayer: Player,
        onRotate: (pieceId: number) => Piece | null,
        onFlip: (pieceId: number) => Piece | null
    ): void {
        // 检测是否为移动设备
        const isTouchDevice = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0;

        // 无论设备类型，都创建触摸控制按钮，但移动设备会更加突出显示
        this.renderer.createMobileTouchControls(
            // 旋转按钮回调
            () => {
                if (this.selectedPieceId !== null && this.isHumanTurn) {
                    const rotatedPiece = onRotate(this.selectedPieceId);
                    if (rotatedPiece && this.selectedPieceElement) {
                        this.renderer.updatePieceDisplay(this.selectedPieceElement, rotatedPiece, humanPlayer.color);
                        if (this.hoveredPieceElement) {
                            this.renderer.updateHoveredPieceDisplay(this.hoveredPieceElement, rotatedPiece, humanPlayer.color);
                        }
                    }
                }
            },
            // 翻转按钮回调
            () => {
                if (this.selectedPieceId !== null && this.isHumanTurn) {
                    const flippedPiece = onFlip(this.selectedPieceId);
                    if (flippedPiece && this.selectedPieceElement) {
                        this.renderer.updatePieceDisplay(this.selectedPieceElement, flippedPiece, humanPlayer.color);
                        if (this.hoveredPieceElement) {
                            this.renderer.updateHoveredPieceDisplay(this.hoveredPieceElement, flippedPiece, humanPlayer.color);
                        }
                    }
                }
            }
        );
    }

    // 设置鼠标和触摸事件
    private setupMouseAndTouchEvents(
        humanPlayer: Player,
        onTryPlacePiece: (gridX: number, gridY: number) => void
    ): void {
        if (!this.boardElement) return;

        // 确保棋盘元素为相对定位
        if (this.boardElement.style.position !== 'relative') {
            this.boardElement.style.position = 'relative';
        }

        // 鼠标/触摸进入棋盘时创建悬浮棋子
        this.boardElement.addEventListener('mouseenter', () => {
            if (this.selectedPieceId !== null && this.isHumanTurn) {
                this.createHoveredPiece(humanPlayer);
            }
        });

        this.boardElement.addEventListener('touchstart', (event) => {
            if (this.selectedPieceId !== null && this.isHumanTurn) {
                // 阻止默认行为，避免滚动和缩放
                event.preventDefault();
                this.createHoveredPiece(humanPlayer);

                // 获取第一个触摸点位置
                const touch = event.touches[0];
                this.updateHoveredPiecePositionForTouch(touch, humanPlayer);
            }
        }, { passive: false });

        // 鼠标离开棋盘时移除悬浮棋子
        this.boardElement.addEventListener('mouseleave', () => {
            this.removeHoveredPiece();
        });

        this.boardElement.addEventListener('touchend', () => {
            // 不要立即移除，让click事件能够触发
            setTimeout(() => {
                this.removeHoveredPiece();
            }, 100);
        });

        this.boardElement.addEventListener('touchcancel', () => {
            this.removeHoveredPiece();
        });

        // 鼠标在棋盘上移动时更新悬浮棋子位置
        this.boardElement.addEventListener('mousemove', (event) => {
            if (this.selectedPieceId !== null && this.hoveredPieceElement && this.boardElement && this.isHumanTurn) {
                this.updateHoveredPiecePosition(event.clientX, event.clientY, humanPlayer);
            }
        });

        // 触摸移动事件
        this.boardElement.addEventListener('touchmove', (event) => {
            if (this.selectedPieceId !== null && this.hoveredPieceElement && this.boardElement && this.isHumanTurn) {
                // 阻止默认行为，避免滚动
                event.preventDefault();
                const touch = event.touches[0];
                this.updateHoveredPiecePositionForTouch(touch, humanPlayer);
            }
        }, { passive: false });

        // 添加棋盘点击事件用于放置棋子
        this.boardElement.addEventListener('click', () => {
            this.tryPlacePieceAtHoveredPosition(onTryPlacePiece);
        });

        // 触摸结束事件也尝试放置棋子
        this.boardElement.addEventListener('touchend', (event) => {
            // 阻止默认行为，防止点击事件被触发
            event.preventDefault();
            this.tryPlacePieceAtHoveredPosition(onTryPlacePiece);
        }, { passive: false });
    }

    // 创建悬浮棋子
    private createHoveredPiece(humanPlayer: Player): void {
        if (this.selectedPieceId === null || !this.boardElement || !this.isHumanTurn) return;

        // 移除已有的悬浮棋子
        this.removeHoveredPiece();

        // 获取选中的棋子
        const piece = humanPlayer.getPiece(this.selectedPieceId);
        if (!piece) return;

        // 获取棋盘位置
        const rect = this.boardElement.getBoundingClientRect();

        // 创建悬浮棋子
        const hoveredPieceElement = this.renderer.createHoveredPiece(piece, humanPlayer.color, rect);
        this.hoveredPieceElement = hoveredPieceElement;

        // 初始定位到鼠标位置
        const mouseEvent = window.event as MouseEvent;
        if (mouseEvent && this.boardElement) {
            const rect = this.boardElement.getBoundingClientRect();
            this.updateHoveredPiecePosition(mouseEvent.clientX, mouseEvent.clientY, humanPlayer);
        }
    }

    // 处理触摸事件的悬浮棋子位置更新
    private updateHoveredPiecePositionForTouch(touch: Touch, humanPlayer: Player): void {
        if (!this.boardElement || !this.hoveredPieceElement) return;
        this.updateHoveredPiecePosition(touch.clientX, touch.clientY, humanPlayer);
    }

    // 更新悬浮棋子位置
    private updateHoveredPiecePosition(clientX: number, clientY: number, humanPlayer: Player): void {
        if (!this.boardElement || !this.hoveredPieceElement || !this.selectedPieceId) return;

        const rect = this.boardElement.getBoundingClientRect();
        // 计算鼠标/触摸点相对于棋盘的位置
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // 棋盘有15px的内边距，需要考虑这个偏移
        const boardPadding = 15;

        // 调整位置，考虑内边距
        const adjustedX = x - boardPadding;
        const adjustedY = y - boardPadding;

        // 获取当前的cellSize
        const cellSize = this.board.getCellSize();

        // 计算棋盘格子坐标
        const gridX = Math.floor(adjustedX / cellSize);
        const gridY = Math.floor(adjustedY / cellSize);

        // 只有当鼠标在有效的棋盘区域内才更新棋子位置
        if (gridX >= 0 && gridY >= 0) {
            // 获取选中的棋子
            const piece = humanPlayer.getPiece(this.selectedPieceId);
            if (piece) {
                // 获取棋子尺寸
                const pieceWidth = piece.shape[0].length;
                const pieceHeight = piece.shape.length;

                // 计算棋子左上角对应的格子坐标（考虑居中调整）
                const adjustedGridX = Math.max(0, gridX - Math.floor(pieceWidth / 2));
                const adjustedGridY = Math.max(0, gridY - Math.floor(pieceHeight / 2));

                // 检查放置是否有效
                const humanPlayerId = 1;
                const isValid = this.board.isValidPlacement(piece, adjustedGridX, adjustedGridY, humanPlayerId);

                // 更新悬浮棋子位置和状态
                this.renderer.updateHoveredPiecePosition(
                    this.hoveredPieceElement,
                    adjustedGridX,
                    adjustedGridY,
                    isValid
                );
            }
        }
    }

    // 尝试在悬浮位置放置棋子
    private tryPlacePieceAtHoveredPosition(onTryPlacePiece: (gridX: number, gridY: number) => void): void {
        if (this.selectedPieceId !== null && this.hoveredPieceElement && this.boardElement && this.isHumanTurn) {
            // 使用存储在悬浮元素上的坐标
            const gridX = parseInt(this.hoveredPieceElement.dataset.gridX || '0', 10);
            const gridY = parseInt(this.hoveredPieceElement.dataset.gridY || '0', 10);

            console.log(`Attempting to place piece at grid position: ${gridX}, ${gridY}`);

            // 尝试放置棋子
            onTryPlacePiece(gridX, gridY);
        }
    }

    // 移除悬浮棋子
    public removeHoveredPiece(): void {
        if (this.hoveredPieceElement) {
            this.renderer.removeHoveredPiece(this.hoveredPieceElement);
            this.hoveredPieceElement = null;
        }
    }
} 