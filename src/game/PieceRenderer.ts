import { Board } from './Board';
import { Player } from './Player';
import { Piece } from './Piece';

export class PieceRenderer {
    private board: Board;

    constructor(board: Board) {
        this.board = board;
    }

    /**
     * 渲染玩家的棋子托盘
     */
    public renderPieceTray(
        pieceTrayElement: HTMLElement,
        currentPlayer: Player,
        isHumanTurn: boolean,
        onPieceSelect: (pieceId: number, element: HTMLElement) => void
    ): void {
        if (!pieceTrayElement) return;

        // Clear previous pieces
        pieceTrayElement.innerHTML = '';

        // 获取当前的棋盘单元格尺寸
        const boardCellSize = this.board.getCellSize();

        // 为托盘中的棋子计算适当的单元格尺寸
        let trayCellSize = Math.min(20, boardCellSize * 0.8);

        // 如果是移动设备，进一步减小棋子尺寸
        if (window.innerWidth <= 768) {
            trayCellSize = Math.min(16, trayCellSize);
        }

        // Render human player's available pieces
        currentPlayer.getAvailablePieces().forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece');
            pieceElement.dataset.pieceId = piece.id.toString();

            // Create a mini canvas to display the piece
            const canvas = document.createElement('canvas');
            canvas.width = piece.shape[0].length * trayCellSize;
            canvas.height = piece.shape.length * trayCellSize;
            pieceElement.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Draw the piece
                piece.shape.forEach((row, rowIndex) => {
                    row.forEach((cell, colIndex) => {
                        if (cell) {
                            ctx.fillStyle = currentPlayer.color;
                            ctx.fillRect(colIndex * trayCellSize, rowIndex * trayCellSize, trayCellSize, trayCellSize);
                        }
                    });
                });
            }

            // 添加点击事件用于选择棋子
            pieceElement.addEventListener('click', () => {
                onPieceSelect(piece.id, pieceElement);
            });

            pieceTrayElement.appendChild(pieceElement);
        });
    }

    /**
     * 渲染AI的棋子托盘
     */
    public renderAIPieceTray(aiPieceTrayElement: HTMLElement | null, aiPlayer: Player): void {
        if (!aiPieceTrayElement) return;

        // 清除旧的内容
        aiPieceTrayElement.innerHTML = '';

        // 计算合适的棋子尺寸
        let trayCellSize = 14; // AI棋子托盘中的棋子尺寸比玩家的小

        // 如果是移动设备，进一步减小尺寸
        if (window.innerWidth <= 768) {
            trayCellSize = 12;
        }

        // 渲染AI的可用棋子
        aiPlayer.getAvailablePieces().forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece');
            pieceElement.dataset.pieceId = piece.id.toString();

            // 创建迷你画布显示棋子
            const canvas = document.createElement('canvas');
            canvas.width = piece.shape[0].length * trayCellSize;
            canvas.height = piece.shape.length * trayCellSize;
            pieceElement.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 绘制棋子
                piece.shape.forEach((row, rowIndex) => {
                    row.forEach((cell, colIndex) => {
                        if (cell) {
                            ctx.fillStyle = aiPlayer.color;
                            ctx.fillRect(colIndex * trayCellSize, rowIndex * trayCellSize, trayCellSize, trayCellSize);
                        }
                    });
                });
            }

            aiPieceTrayElement.appendChild(pieceElement);
        });

        // 如果没有剩余棋子，显示一条消息
        if (aiPlayer.getAvailablePieces().length === 0) {
            const noMorePieces = document.createElement('div');
            noMorePieces.style.padding = '10px';
            noMorePieces.style.textAlign = 'center';
            noMorePieces.style.fontSize = '14px';
            noMorePieces.innerHTML = 'AI 没有剩余棋子';
            aiPieceTrayElement.appendChild(noMorePieces);
        }
    }

    /**
     * 创建和更新悬浮显示的棋子
     */
    public createHoveredPiece(
        piece: Piece,
        playerColor: string,
        boardRect: DOMRect,
        boardElement: HTMLElement
    ): HTMLElement {
        // 创建悬浮棋子元素
        const hoveredPiece = document.createElement('div');
        hoveredPiece.classList.add('hovered-piece');
        this.setupHoveredPieceStyles(hoveredPiece);

        // 使用board的动态cellSize
        const cellSize = this.board.getCellSize();

        // 创建画布显示棋子
        const canvas = this.createPieceCanvas(piece, cellSize, playerColor);
        hoveredPiece.appendChild(canvas);

        // 创建网格高亮显示
        const gridHighlight = this.createGridHighlight();

        // 将悬浮棋子和网格高亮添加到棋盘
        boardElement.appendChild(gridHighlight);
        boardElement.appendChild(hoveredPiece);

        return hoveredPiece;
    }

    /**
     * 更新悬浮棋子的显示内容
     */
    public updateHoveredPieceDisplay(hoveredPieceElement: HTMLElement, piece: Piece, playerColor: string): void {
        const oldCanvas = hoveredPieceElement.querySelector('canvas');
        if (!oldCanvas) return;

        const cellSize = this.board.getCellSize();
        const canvas = this.createPieceCanvas(piece, cellSize, playerColor);

        // 替换旧的canvas
        hoveredPieceElement.replaceChild(canvas, oldCanvas);

        // 更新悬浮棋子元素的样式
        this.setupHoveredPieceStyles(hoveredPieceElement);
    }

    /**
     * 更新悬浮棋子的位置和显示状态
     */
    public updateHoveredPiecePosition(
        hoveredPieceElement: HTMLElement,
        gridX: number,
        gridY: number,
        isValidPlacement: boolean,
        boardElement: HTMLElement | null
    ): void {
        if (!boardElement) return;

        const boardPadding = 20;
        const cellSize = this.board.getCellSize();
        const boardStyle = window.getComputedStyle(boardElement);
        const boardBorderLeft = parseInt(boardStyle.borderLeftWidth || '0', 10);
        const boardBorderTop = parseInt(boardStyle.borderTopWidth || '0', 10);

        // 计算精确位置
        const snapX = gridX * cellSize + boardPadding + boardBorderLeft;
        const snapY = gridY * cellSize + boardPadding + boardBorderTop;

        // 应用位置
        hoveredPieceElement.style.left = `${Math.floor(snapX)}px`;
        hoveredPieceElement.style.top = `${Math.floor(snapY)}px`;

        // 根据放置有效性设置视觉效果
        this.updateHoveredPieceVisualState(hoveredPieceElement, isValidPlacement);

        // 存储网格坐标
        hoveredPieceElement.dataset.gridX = gridX.toString();
        hoveredPieceElement.dataset.gridY = gridY.toString();
    }

    /**
     * 移除悬浮棋子
     */
    public removeHoveredPiece(hoveredPieceElement: HTMLElement | null): void {
        if (hoveredPieceElement && hoveredPieceElement.parentNode) {
            hoveredPieceElement.parentNode.removeChild(hoveredPieceElement);
        }

        // 移除网格高亮
        const gridHighlight = document.querySelector('.grid-highlight');
        if (gridHighlight && gridHighlight.parentNode) {
            gridHighlight.parentNode.removeChild(gridHighlight);
        }
    }

    /**
     * 更新棋子在托盘中的显示
     */
    public updatePieceDisplay(pieceElement: HTMLElement, piece: Piece, playerColor: string): void {
        const oldCanvas = pieceElement.querySelector('canvas');
        if (!oldCanvas) return;

        const canvas = document.createElement('canvas');
        canvas.width = piece.shape[0].length * 20;
        canvas.height = piece.shape.length * 20;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        ctx.fillStyle = playerColor;
                        ctx.fillRect(colIndex * 20, rowIndex * 20, 20, 20);
                    }
                });
            });
        }

        pieceElement.replaceChild(canvas, oldCanvas);
    }

    // 私有辅助方法

    /**
     * 设置悬浮棋子的样式
     */
    private setupHoveredPieceStyles(element: HTMLElement): void {
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.opacity = '0.7';
        element.style.zIndex = '100';
        element.style.transition = 'filter 0.2s';
        element.style.transformOrigin = 'top left';
        element.style.outline = 'none';
        element.style.border = 'none';
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.backgroundColor = 'transparent';
        element.style.boxSizing = 'content-box';
        element.style.imageRendering = 'pixelated';
        element.style.willChange = 'left, top';
        element.style.backfaceVisibility = 'hidden';
    }

    /**
     * 创建棋子的Canvas
     */
    private createPieceCanvas(piece: Piece, cellSize: number, color: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(piece.shape[0].length * cellSize);
        canvas.height = Math.floor(piece.shape.length * cellSize);

        canvas.style.display = 'block';
        canvas.style.border = 'none';
        canvas.style.margin = '0';
        canvas.style.padding = '0';
        canvas.style.backgroundColor = 'transparent';
        canvas.style.imageRendering = 'pixelated';

        const ctx = canvas.getContext('2d', { alpha: true });
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        const drawX = colIndex * cellSize;
                        const drawY = rowIndex * cellSize;
                        ctx.fillStyle = color;
                        ctx.globalAlpha = 1.0;
                        ctx.fillRect(
                            drawX,
                            drawY,
                            cellSize,
                            cellSize
                        );
                    }
                });
            });
        }

        return canvas;
    }

    /**
     * 创建网格高亮显示
     */
    private createGridHighlight(): HTMLElement {
        const gridHighlight = document.createElement('div');
        gridHighlight.classList.add('grid-highlight');
        gridHighlight.style.position = 'absolute';
        gridHighlight.style.pointerEvents = 'none';
        gridHighlight.style.zIndex = '99';
        gridHighlight.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
        gridHighlight.style.display = 'none';
        return gridHighlight;
    }

    /**
     * 更新悬浮棋子的视觉状态
     */
    private updateHoveredPieceVisualState(element: HTMLElement, isValid: boolean): void {
        if (isValid) {
            element.style.opacity = '0.7';
            element.style.filter = 'drop-shadow(0 0 5px green)';
        } else {
            element.style.opacity = '0.5';
            element.style.filter = 'drop-shadow(0 0 5px red)';
        }
    }
} 