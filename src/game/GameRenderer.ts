import { Board } from './Board';
import { Player } from './Player';
import { Piece } from './Piece';

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
    }

    // 渲染棋盘
    public renderBoard(board: Board): void {
        if (this.boardElement) {
            board.render(this.boardElement);

            // 如果有AI最后的移动位置，在渲染棋盘后高亮显示
            this.highlightLastAIMove();
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

        // 创建高亮元素
        const highlightElement = document.createElement('div');
        highlightElement.id = 'ai-last-move-highlight';
        highlightElement.style.position = 'absolute';
        highlightElement.style.pointerEvents = 'none'; // 确保不会干扰用户交互
        highlightElement.style.zIndex = '90';

        // 设置高亮样式
        const cellSize = this.board.getCellSize();
        const boardPadding = 15;
        const x = this.lastAIMovePosition.x * cellSize + boardPadding;
        const y = this.lastAIMovePosition.y * cellSize + boardPadding;
        const width = this.lastAIMovePosition.width * cellSize;
        const height = this.lastAIMovePosition.height * cellSize;

        highlightElement.style.left = `${x}px`;
        highlightElement.style.top = `${y}px`;
        highlightElement.style.width = `${width}px`;
        highlightElement.style.height = `${height}px`;
        highlightElement.style.border = '2px solid yellow';
        highlightElement.style.boxShadow = '0 0 10px rgba(255, 255, 0, 0.8)';
        highlightElement.style.borderRadius = '3px';
        highlightElement.style.animation = 'pulse-ai-move 2s infinite';

        // 添加闪烁动画样式
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes pulse-ai-move {
                0% { opacity: 0.8; }
                50% { opacity: 0.3; }
                100% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(styleElement);

        // 添加文字标签
        const labelElement = document.createElement('div');
        labelElement.textContent = 'AI';
        labelElement.style.position = 'absolute';
        labelElement.style.top = '0';
        labelElement.style.right = '0';
        labelElement.style.backgroundColor = 'red';
        labelElement.style.color = 'white';
        labelElement.style.padding = '2px 5px';
        labelElement.style.fontSize = '12px';
        labelElement.style.fontWeight = 'bold';
        labelElement.style.borderRadius = '2px';
        highlightElement.appendChild(labelElement);

        // 添加到棋盘
        this.boardElement.appendChild(highlightElement);

        // 5秒后自动移除高亮（可选，取决于你想要的效果）
        setTimeout(() => {
            if (highlightElement && highlightElement.parentNode) {
                highlightElement.style.transition = 'opacity 1s';
                highlightElement.style.opacity = '0';

                // 完全移除元素
                setTimeout(() => {
                    if (highlightElement && highlightElement.parentNode) {
                        highlightElement.parentNode.removeChild(highlightElement);
                    }
                }, 1000);
            }
        }, 5000);
    }

    // 创建控制提示区域
    public createControlTips(): HTMLElement | null {
        if (!this.boardElement) return null;

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

        // 检测是否为移动设备
        const isTouchDevice = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0;

        // 根据设备类型设置不同的提示内容
        if (isTouchDevice) {
            // 移动设备操作提示
            this.controlTipsElement.innerHTML = `
                <p><strong>操作提示:</strong> 点击选择棋子，点击下方按钮旋转或翻转，点击空白处放置</p>
            `;
        } else {
            // 桌面设备操作提示
            this.controlTipsElement.innerHTML = `
                <p><strong>操作提示:</strong> 点击选择棋子，R键旋转，F键翻转，ESC取消选择</p>
            `;
        }

        // 添加到棋盘元素后面
        this.boardElement.insertAdjacentElement('afterend', this.controlTipsElement);
        return this.controlTipsElement;
    }

    // 创建跳过回合按钮
    public createPassButton(onPassTurn: () => void): HTMLElement {
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
        this.passButtonElement.addEventListener('click', onPassTurn);

        // 添加到游戏信息元素下方
        if (this.gameInfoElement) {
            this.gameInfoElement.appendChild(this.passButtonElement);
        }

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

        // Clear previous pieces
        this.pieceTrayElement.innerHTML = '';

        // 获取当前的棋盘单元格尺寸
        const boardCellSize = this.board.getCellSize();

        // 为托盘中的棋子计算适当的单元格尺寸
        // 在移动设备上使用小一点的尺寸以便能展示更多棋子
        let trayCellSize = Math.min(20, boardCellSize * 0.8);

        // 如果是移动设备，进一步减小棋子尺寸
        if (window.innerWidth <= 768) {
            trayCellSize = Math.min(16, trayCellSize);
        }

        // 只在人类玩家回合显示棋子托盘内容
        if (isHumanTurn) {
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
                                ctx.strokeStyle = '#000';
                                ctx.strokeRect(colIndex * trayCellSize, rowIndex * trayCellSize, trayCellSize, trayCellSize);
                            }
                        });
                    });
                }

                // 添加点击事件用于选择棋子
                pieceElement.addEventListener('click', () => {
                    onPieceSelect(piece.id, pieceElement);
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

    // 更新游戏信息显示
    public updateGameInfo(isHumanTurn: boolean, hasValidMoves: boolean, canPlacePieces: boolean): void {
        if (!this.gameInfoElement) return;

        if (isHumanTurn) {
            this.gameInfoElement.innerHTML = `
                <h2>当前回合: 玩家 (蓝色)</h2>
                ${!hasValidMoves && canPlacePieces ? '<p style="color: #f44336; font-weight: bold;">没有可放置的位置！请使用Pass按钮跳过回合。</p>' : ''}
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

    // 创建移动设备的触摸控制按钮
    public createMobileTouchControls(
        onRotate: () => void,
        onFlip: () => void,
        isTouchDevice?: boolean
    ): HTMLElement | null {
        // 检测是否在触摸设备上（如果未提供参数）
        if (isTouchDevice === undefined) {
            isTouchDevice = 'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                (navigator as any).msMaxTouchPoints > 0;
        }

        // 在调试时强制显示触摸控制 - 无论是否触摸设备
        const forceShowControls = true;

        if (!forceShowControls && !isTouchDevice) return null;

        // 检查是否已经存在触摸控制
        const existingControls = document.getElementById('touch-controls');
        if (existingControls) return existingControls as HTMLElement;

        // 创建控制按钮容器
        const touchControlsContainer = document.createElement('div');
        touchControlsContainer.id = 'touch-controls';
        touchControlsContainer.style.display = 'flex';
        touchControlsContainer.style.justifyContent = 'center';
        touchControlsContainer.style.gap = '10px';
        touchControlsContainer.style.marginTop = '15px';
        touchControlsContainer.style.marginBottom = '10px';
        touchControlsContainer.style.width = '100%';

        // 移动设备上显示更突出的按钮
        if (isTouchDevice) {
            touchControlsContainer.style.padding = '10px';
            touchControlsContainer.style.backgroundColor = 'rgba(0,0,0,0.05)';
            touchControlsContainer.style.borderRadius = '8px';
        }

        // 创建旋转按钮
        const rotateButton = document.createElement('button');
        rotateButton.textContent = isTouchDevice ? '旋转' : '旋转 (R)';
        rotateButton.style.flex = '1';
        rotateButton.style.maxWidth = '45%';
        rotateButton.style.backgroundColor = '#2196F3';
        rotateButton.style.padding = isTouchDevice ? '15px 0' : '12px 0';
        rotateButton.style.fontSize = isTouchDevice ? '18px' : '16px';
        rotateButton.style.fontWeight = 'bold';
        rotateButton.style.borderRadius = '8px';
        rotateButton.style.border = '2px solid #1976D2';
        rotateButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

        rotateButton.addEventListener('click', onRotate);

        // 创建翻转按钮
        const flipButton = document.createElement('button');
        flipButton.textContent = isTouchDevice ? '翻转' : '翻转 (F)';
        flipButton.style.flex = '1';
        flipButton.style.maxWidth = '45%';
        flipButton.style.backgroundColor = '#FF9800';
        flipButton.style.padding = isTouchDevice ? '15px 0' : '12px 0';
        flipButton.style.fontSize = isTouchDevice ? '18px' : '16px';
        flipButton.style.fontWeight = 'bold';
        flipButton.style.borderRadius = '8px';
        flipButton.style.border = '2px solid #F57C00';
        flipButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

        flipButton.addEventListener('click', onFlip);

        // 添加按钮到容器
        touchControlsContainer.appendChild(rotateButton);
        touchControlsContainer.appendChild(flipButton);

        // 添加到游戏信息区域下方
        if (this.gameInfoElement) {
            this.gameInfoElement.appendChild(touchControlsContainer);
        }

        this.touchControlsElement = touchControlsContainer;
        return touchControlsContainer;
    }

    // 创建和更新悬浮显示的棋子
    public createHoveredPiece(piece: Piece, playerColor: string, boardRect: DOMRect): HTMLElement {
        // 创建悬浮棋子元素
        const hoveredPiece = document.createElement('div');
        hoveredPiece.classList.add('hovered-piece');
        hoveredPiece.style.position = 'absolute';
        hoveredPiece.style.pointerEvents = 'none'; // 防止干扰鼠标事件
        hoveredPiece.style.opacity = '0.7'; // 半透明效果
        hoveredPiece.style.zIndex = '100';
        hoveredPiece.style.transition = 'filter 0.2s'; // 添加过渡效果使颜色变化更平滑
        hoveredPiece.style.transformOrigin = 'top left'; // 修改变换原点为左上角

        // 使用board的动态cellSize，而不是固定值
        const cellSize = this.board.getCellSize();

        // 创建画布显示棋子
        const canvas = document.createElement('canvas');
        canvas.width = piece.shape[0].length * cellSize;
        canvas.height = piece.shape.length * cellSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 绘制棋子
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        ctx.fillStyle = playerColor;
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

        if (this.boardElement) {
            this.boardElement.appendChild(gridHighlight);
            this.boardElement.appendChild(hoveredPiece);
        }

        return hoveredPiece;
    }

    // 更新悬浮棋子的显示内容
    public updateHoveredPieceDisplay(hoveredPieceElement: HTMLElement, piece: Piece, playerColor: string): void {
        // 找到并移除旧的canvas
        const oldCanvas = hoveredPieceElement.querySelector('canvas');
        if (!oldCanvas) return;

        // 使用board的动态cellSize，而不是固定值
        const cellSize = this.board.getCellSize();

        // 创建新的canvas
        const canvas = document.createElement('canvas');
        canvas.width = piece.shape[0].length * cellSize;
        canvas.height = piece.shape.length * cellSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 绘制棋子
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        ctx.fillStyle = playerColor;
                        ctx.fillRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
                    }
                });
            });
        }

        // 替换旧的canvas
        hoveredPieceElement.replaceChild(canvas, oldCanvas);
    }

    // 更新悬浮棋子的位置和显示状态
    public updateHoveredPiecePosition(
        hoveredPieceElement: HTMLElement,
        gridX: number,
        gridY: number,
        isValidPlacement: boolean
    ): void {
        const boardPadding = 15;
        const cellSize = this.board.getCellSize();

        // 计算棋子应该贴合的位置 - 需要加回棋盘内边距
        const snapX = gridX * cellSize + boardPadding;
        const snapY = gridY * cellSize + boardPadding;

        // 更新悬浮棋子的位置
        hoveredPieceElement.style.left = `${snapX}px`;
        hoveredPieceElement.style.top = `${snapY}px`;
        hoveredPieceElement.style.transform = ''; // 移除transform，直接使用left/top定位

        // 存储网格坐标到数据集，用于后续放置
        hoveredPieceElement.dataset.gridX = gridX.toString();
        hoveredPieceElement.dataset.gridY = gridY.toString();

        // 根据放置有效性设置不同的视觉效果
        if (isValidPlacement) {
            hoveredPieceElement.style.opacity = '0.7';
            hoveredPieceElement.style.filter = 'drop-shadow(0 0 5px green)';
        } else {
            hoveredPieceElement.style.opacity = '0.5';
            hoveredPieceElement.style.filter = 'drop-shadow(0 0 5px red)';
        }
    }

    // 更新网格高亮的位置和大小
    public updateGridHighlight(piece: Piece, gridX: number, gridY: number, isValidPlacement: boolean): void {
        const gridHighlight = document.querySelector('.grid-highlight');
        if (!gridHighlight || !this.boardElement) return;

        const cellSize = this.board.getCellSize();
        const boardPadding = 15; // 棋盘内边距

        // 计算高亮区域的位置和大小
        const width = piece.shape[0].length * cellSize;
        const height = piece.shape.length * cellSize;
        const left = gridX * cellSize + boardPadding;
        const top = gridY * cellSize + boardPadding;

        // 更新高亮区域的样式
        (gridHighlight as HTMLElement).style.width = `${width}px`;
        (gridHighlight as HTMLElement).style.height = `${height}px`;
        (gridHighlight as HTMLElement).style.left = `${left}px`;
        (gridHighlight as HTMLElement).style.top = `${top}px`;
        (gridHighlight as HTMLElement).style.display = 'block';

        // 根据放置有效性设置不同颜色
        if (isValidPlacement) {
            (gridHighlight as HTMLElement).style.borderColor = 'rgba(0, 255, 0, 0.5)';
        } else {
            (gridHighlight as HTMLElement).style.borderColor = 'rgba(255, 0, 0, 0.5)';
        }
    }

    // 移除悬浮棋子
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

    // 更新棋子在托盘中的显示
    public updatePieceDisplay(pieceElement: HTMLElement, piece: Piece, playerColor: string): void {
        // 清除原有的 canvas
        const oldCanvas = pieceElement.querySelector('canvas');
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
                        ctx.fillStyle = playerColor;
                        ctx.fillRect(colIndex * 20, rowIndex * 20, 20, 20);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(colIndex * 20, rowIndex * 20, 20, 20);
                    }
                });
            });
        }

        // 替换旧的 canvas
        pieceElement.replaceChild(canvas, oldCanvas);
    }

    // 显示游戏结束界面
    public showGameOverScreen(humanScore: number, aiScore: number, humanPiecesLeft: number, aiPiecesLeft: number): void {
        if (!this.controlTipsElement) return;

        // 创建游戏结束面板
        this.gameOverLayerElement = document.createElement('div');
        this.gameOverLayerElement.id = 'game-over-panel';
        this.gameOverLayerElement.style.width = '100%';
        this.gameOverLayerElement.style.marginTop = '20px';
        this.gameOverLayerElement.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
        this.gameOverLayerElement.style.borderRadius = '10px';
        this.gameOverLayerElement.style.padding = '20px';
        this.gameOverLayerElement.style.color = 'white';
        this.gameOverLayerElement.style.boxSizing = 'border-box';
        this.gameOverLayerElement.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
        this.gameOverLayerElement.style.textAlign = 'center';

        // 标题
        const titleElement = document.createElement('h2');
        titleElement.textContent = '游戏结束';
        titleElement.style.marginTop = '0';
        titleElement.style.marginBottom = '15px';
        titleElement.style.color = '#fff';
        titleElement.style.fontSize = '24px';

        // 结果
        const resultElement = document.createElement('div');
        resultElement.style.fontSize = '18px';
        resultElement.style.marginBottom = '15px';

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
            <div style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                <div style="text-align: center; padding: 5px;">
                    <div style="font-size: 14px; margin-bottom: 3px;">玩家得分</div>
                    <div style="font-size: 24px; color: #3F51B5;">${humanScore}</div>
                </div>
                <div style="text-align: center; padding: 5px;">
                    <div style="font-size: 14px; margin-bottom: 3px;">AI得分</div>
                    <div style="font-size: 24px; color: #E91E63;">${aiScore}</div>
                </div>
            </div>
        `;

        // 剩余棋子信息
        const piecesInfoElement = document.createElement('div');
        piecesInfoElement.style.marginBottom = '15px';
        piecesInfoElement.style.fontSize = '14px';
        piecesInfoElement.style.lineHeight = '1.5';
        piecesInfoElement.innerHTML = `
            <div style="margin-bottom: 5px; color: #ddd;">玩家剩余棋子: ${humanPiecesLeft} 个</div>
            <div style="color: #ddd;">AI剩余棋子: ${aiPiecesLeft} 个</div>
        `;

        // 添加重新开始按钮
        const restartButton = document.createElement('button');
        restartButton.textContent = '重新开始游戏';
        restartButton.style.padding = '8px 20px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '4px';
        restartButton.style.fontSize = '16px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.marginTop = '5px';
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
        this.gameOverLayerElement.appendChild(titleElement);
        this.gameOverLayerElement.appendChild(resultElement);
        this.gameOverLayerElement.appendChild(scoreElement);
        this.gameOverLayerElement.appendChild(piecesInfoElement);
        this.gameOverLayerElement.appendChild(restartButton);

        // 将游戏结束面板添加到控制提示下方
        this.controlTipsElement.insertAdjacentElement('afterend', this.gameOverLayerElement);

        // 更新游戏信息显示，清晰地表明游戏已结束
        if (this.gameInfoElement) {
            this.gameInfoElement.innerHTML = `
                <h2 style="color: #f44336;">游戏已结束</h2>
                <p>请查看下方的游戏结果</p>
            `;
        }
    }
} 