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
    private newGameButtonElement: HTMLElement | null = null;
    private aiPieceTrayElement: HTMLElement | null = null;

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

        console.log('======= AI最后移动高亮 =======');
        console.log(`AI最后移动位置: x=${this.lastAIMovePosition.x}, y=${this.lastAIMovePosition.y}`);
        console.log(`棋子尺寸: width=${this.lastAIMovePosition.width}, height=${this.lastAIMovePosition.height}`);

        // 检测棋盘元素及其边框
        let boardBorderLeft = 0;
        let boardBorderTop = 0;

        // 获取棋盘元素的计算样式
        const boardStyle = window.getComputedStyle(this.boardElement);
        // 获取边框宽度
        boardBorderLeft = parseInt(boardStyle.borderLeftWidth || '0', 10);
        boardBorderTop = parseInt(boardStyle.borderTopWidth || '0', 10);
        console.log(`棋盘边框: left=${boardBorderLeft}px, top=${boardBorderTop}px`);

        // 创建高亮元素
        const highlightElement = document.createElement('div');
        highlightElement.id = 'ai-last-move-highlight';
        highlightElement.style.position = 'absolute';
        highlightElement.style.pointerEvents = 'none'; // 确保不会干扰用户交互
        highlightElement.style.zIndex = '90';
        highlightElement.style.boxSizing = 'content-box';

        // 设置高亮样式
        const cellSize = this.board.getCellSize();
        const boardPadding = 20; // 棋盘内边距，匹配CSS中的20px

        // 计算坐标时考虑边框宽度
        const x = this.lastAIMovePosition.x * cellSize + boardPadding + boardBorderLeft;
        const y = this.lastAIMovePosition.y * cellSize + boardPadding + boardBorderTop;
        const width = this.lastAIMovePosition.width * cellSize;
        const height = this.lastAIMovePosition.height * cellSize;

        console.log(`计算后的高亮坐标: x=${x}, y=${y}, width=${width}, height=${height}`);

        // 使用整数像素值
        highlightElement.style.left = `${Math.floor(x)}px`;
        highlightElement.style.top = `${Math.floor(y)}px`;
        highlightElement.style.width = `${Math.floor(width)}px`;
        highlightElement.style.height = `${Math.floor(height)}px`;
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
        console.log('======= AI最后移动高亮结束 =======');

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
            // 修改布局，使用flex布局让标题和新游戏按钮在同一行
            this.gameInfoElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2 style="margin: 0;">当前回合: 玩家 (蓝色)</h2>
                </div>
                ${!hasValidMoves && canPlacePieces ? '<p style="color: #f44336; font-weight: bold;">没有可放置的位置！请使用Pass按钮跳过回合。</p>' : ''}
            `;

            // 获取我们创建的flex容器
            const headerContainer = this.gameInfoElement.querySelector('div');
            if (headerContainer && this.newGameButtonElement) {
                // 新游戏按钮添加到标题行
                headerContainer.appendChild(this.newGameButtonElement);
            }

            // 重新添加Pass按钮，因为innerHTML会清除所有子元素
            if (this.passButtonElement) {
                this.gameInfoElement.appendChild(this.passButtonElement);
            }
        } else {
            // AI回合使用相同的布局方式
            this.gameInfoElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2 style="margin: 0;">当前回合: AI (红色)</h2>
                </div>
                <p>AI正在思考...</p>
            `;

            // 获取我们创建的flex容器
            const headerContainer = this.gameInfoElement.querySelector('div');
            if (headerContainer && this.newGameButtonElement) {
                // 在AI回合也显示新游戏按钮
                headerContainer.appendChild(this.newGameButtonElement);
            }
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
        touchControlsContainer.style.marginTop = '10px'; // 减小上边距
        touchControlsContainer.style.marginBottom = '10px';
        touchControlsContainer.style.width = '100%';

        // 移动设备上显示更突出的按钮
        if (isTouchDevice) {
            touchControlsContainer.style.padding = '5px'; // 减小内边距
            touchControlsContainer.style.backgroundColor = 'rgba(0,0,0,0.05)';
            touchControlsContainer.style.borderRadius = '8px';
        }

        // 创建旋转按钮，尺寸更小
        const rotateButton = document.createElement('button');
        rotateButton.textContent = isTouchDevice ? '旋转' : '旋转 (R)';
        rotateButton.style.flex = '1';
        rotateButton.style.maxWidth = '40%'; // 减小宽度
        rotateButton.style.backgroundColor = '#2196F3';
        rotateButton.style.padding = isTouchDevice ? '8px 0' : '6px 0'; // 减小内边距
        rotateButton.style.fontSize = isTouchDevice ? '16px' : '14px'; // 减小字体大小
        rotateButton.style.fontWeight = 'bold';
        rotateButton.style.borderRadius = '6px'; // 减小圆角
        rotateButton.style.border = '2px solid #1976D2';
        rotateButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; // 减小阴影

        rotateButton.addEventListener('click', onRotate);

        // 创建翻转按钮，尺寸更小
        const flipButton = document.createElement('button');
        flipButton.textContent = isTouchDevice ? '翻转' : '翻转 (F)';
        flipButton.style.flex = '1';
        flipButton.style.maxWidth = '40%'; // 减小宽度
        flipButton.style.backgroundColor = '#FF9800';
        flipButton.style.padding = isTouchDevice ? '8px 0' : '6px 0'; // 减小内边距
        flipButton.style.fontSize = isTouchDevice ? '16px' : '14px'; // 减小字体大小
        flipButton.style.fontWeight = 'bold';
        flipButton.style.borderRadius = '6px'; // 减小圆角
        flipButton.style.border = '2px solid #F57C00';
        flipButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; // 减小阴影

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
        console.log('======= 创建悬浮棋子 =======');
        console.log(`棋子ID: ${piece.id}`);
        console.log(`玩家颜色: ${playerColor}`);
        console.log(`棋盘矩形: left=${boardRect.left}, top=${boardRect.top}, width=${boardRect.width}, height=${boardRect.height}`);

        // 创建悬浮棋子元素
        const hoveredPiece = document.createElement('div');
        hoveredPiece.classList.add('hovered-piece');
        hoveredPiece.style.position = 'absolute';
        hoveredPiece.style.pointerEvents = 'none'; // 防止干扰鼠标事件
        hoveredPiece.style.opacity = '0.7'; // 半透明效果
        hoveredPiece.style.zIndex = '100';
        hoveredPiece.style.transition = 'filter 0.2s'; // 添加过渡效果使颜色变化更平滑
        hoveredPiece.style.transformOrigin = 'top left'; // 修改变换原点为左上角
        hoveredPiece.style.outline = 'none'; // 移除可能的轮廓
        hoveredPiece.style.border = 'none'; // 确保没有边框
        hoveredPiece.style.margin = '0'; // 移除可能的外边距
        hoveredPiece.style.padding = '0'; // 移除可能的内边距
        hoveredPiece.style.backgroundColor = 'transparent'; // 确保背景透明
        hoveredPiece.style.boxSizing = 'content-box'; // 使用content-box确保与棋盘格子精确对齐
        hoveredPiece.style.imageRendering = 'pixelated'; // 像素化渲染，防止模糊
        hoveredPiece.style.willChange = 'left, top'; // 优化性能
        hoveredPiece.style.backfaceVisibility = 'hidden'; // 禁用3D效果

        // 使用board的动态cellSize，与Board类保持一致
        const cellSize = this.board.getCellSize();
        console.log(`单元格尺寸: cellSize=${cellSize}`);

        // 记录棋子形状
        console.log('棋子形状:');
        piece.shape.forEach(row => {
            console.log(row.map(cell => cell ? '■' : '□').join(''));
        });

        // 创建画布显示棋子
        const canvas = document.createElement('canvas');

        // 确保使用整数像素值
        canvas.width = Math.floor(piece.shape[0].length * cellSize);
        canvas.height = Math.floor(piece.shape.length * cellSize);
        console.log(`Canvas尺寸: width=${canvas.width}, height=${canvas.height}`);

        canvas.style.display = 'block'; // 防止canvas周围出现额外空白
        canvas.style.border = 'none'; // 确保canvas没有边框
        canvas.style.margin = '0'; // 移除可能的外边距
        canvas.style.padding = '0'; // 移除可能的内边距
        canvas.style.backgroundColor = 'transparent'; // 确保背景透明
        canvas.style.imageRendering = 'pixelated'; // 像素化渲染，防止模糊

        const ctx = canvas.getContext('2d', { alpha: true });
        if (ctx) {
            // 完全禁用抗锯齿
            ctx.imageSmoothingEnabled = false;

            // 清除整个Canvas，确保透明
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 使用与Board.drawGrid方法相同的绘制逻辑
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        // 计算绘制坐标
                        const drawX = colIndex * cellSize;
                        const drawY = rowIndex * cellSize;
                        console.log(`绘制单元格: colIndex=${colIndex}, rowIndex=${rowIndex}`);
                        console.log(`绘制坐标: drawX=${drawX}, drawY=${drawY}, width=${cellSize}, height=${cellSize}`);

                        // 完全匹配Board.drawGrid的绘制方式，去除任何偏移
                        ctx.fillStyle = playerColor;
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

        hoveredPiece.appendChild(canvas);

        console.log('悬浮棋子创建完成');
        console.log('======= 创建悬浮棋子结束 =======');

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
        console.log('======= 更新悬浮棋子显示 =======');
        console.log(`棋子ID: ${piece.id}`);
        console.log(`玩家颜色: ${playerColor}`);

        // 找到并移除旧的canvas
        const oldCanvas = hoveredPieceElement.querySelector('canvas');
        if (!oldCanvas) {
            console.log('未找到Canvas元素，更新中止');
            console.log('======= 更新悬浮棋子显示结束 =======');
            return;
        }

        // 使用board的动态cellSize
        const cellSize = this.board.getCellSize();
        console.log(`单元格尺寸: cellSize=${cellSize}`);

        // 记录棋子形状
        console.log('棋子形状:');
        piece.shape.forEach(row => {
            console.log(row.map(cell => cell ? '■' : '□').join(''));
        });

        // 创建新的canvas
        const canvas = document.createElement('canvas');

        // 确保使用整数像素值
        canvas.width = Math.floor(piece.shape[0].length * cellSize);
        canvas.height = Math.floor(piece.shape.length * cellSize);
        console.log(`新Canvas尺寸: width=${canvas.width}, height=${canvas.height}`);

        canvas.style.display = 'block'; // 防止canvas周围出现额外空白
        canvas.style.border = 'none'; // 确保canvas没有边框
        canvas.style.margin = '0'; // 移除可能的外边距
        canvas.style.padding = '0'; // 移除可能的内边距
        canvas.style.backgroundColor = 'transparent'; // 确保背景透明
        canvas.style.imageRendering = 'pixelated'; // 像素化渲染，防止模糊

        const ctx = canvas.getContext('2d', { alpha: true });
        if (ctx) {
            // 完全禁用抗锯齿
            ctx.imageSmoothingEnabled = false;

            // 清除整个Canvas，确保透明
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 使用与Board.drawGrid方法相同的绘制逻辑
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        // 计算绘制坐标
                        const drawX = colIndex * cellSize;
                        const drawY = rowIndex * cellSize;
                        console.log(`绘制单元格: colIndex=${colIndex}, rowIndex=${rowIndex}`);
                        console.log(`绘制坐标: drawX=${drawX}, drawY=${drawY}, width=${cellSize}, height=${cellSize}`);

                        // 完全匹配Board.drawGrid的绘制方式，去除任何偏移
                        ctx.fillStyle = playerColor;
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

        // 替换旧的canvas
        hoveredPieceElement.replaceChild(canvas, oldCanvas);
        console.log('Canvas已替换');

        // 更新悬浮棋子元素的样式，确保一致性
        hoveredPieceElement.style.margin = '0';
        hoveredPieceElement.style.padding = '0';
        hoveredPieceElement.style.border = 'none';
        hoveredPieceElement.style.outline = 'none';
        hoveredPieceElement.style.backgroundColor = 'transparent';
        hoveredPieceElement.style.boxSizing = 'content-box';
        hoveredPieceElement.style.imageRendering = 'pixelated';
        hoveredPieceElement.style.willChange = 'left, top';
        hoveredPieceElement.style.backfaceVisibility = 'hidden';

        console.log('======= 更新悬浮棋子显示结束 =======');
    }

    // 更新悬浮棋子的位置和显示状态
    public updateHoveredPiecePosition(
        hoveredPieceElement: HTMLElement,
        gridX: number,
        gridY: number,
        isValidPlacement: boolean
    ): void {
        const boardPadding = 20; // 棋盘内边距，匹配CSS中的20px
        const cellSize = this.board.getCellSize();

        // 检测棋盘元素及其边框
        let boardBorderLeft = 0;
        let boardBorderTop = 0;

        if (this.boardElement) {
            // 获取棋盘元素的计算样式
            const boardStyle = window.getComputedStyle(this.boardElement);
            // 获取边框宽度
            boardBorderLeft = parseInt(boardStyle.borderLeftWidth || '0', 10);
            boardBorderTop = parseInt(boardStyle.borderTopWidth || '0', 10);

            console.log(`棋盘边框: left=${boardBorderLeft}px, top=${boardBorderTop}px`);
        }

        // 添加日志输出计算过程
        console.log('======= 悬浮棋子坐标计算 =======');
        console.log(`网格坐标: gridX=${gridX}, gridY=${gridY}`);
        console.log(`单元格尺寸: cellSize=${cellSize}`);
        console.log(`棋盘内边距: boardPadding=${boardPadding}`);

        // 如果canvas本身有边框，或者棋盘容器有边框，考虑这些边框的宽度
        // 完全匹配Board.drawGrid中的坐标计算方式并考虑边框宽度
        const snapX = gridX * cellSize + boardPadding + boardBorderLeft;
        const snapY = gridY * cellSize + boardPadding + boardBorderTop;

        console.log(`精确计算坐标(考虑边框): snapX=${snapX}, snapY=${snapY}`);

        // 取整后的坐标值
        const finalX = Math.floor(snapX);
        const finalY = Math.floor(snapY);
        console.log(`取整后坐标: finalX=${finalX}, finalY=${finalY}`);

        // 应用整数像素值，避免子像素渲染的模糊
        hoveredPieceElement.style.position = 'absolute';
        hoveredPieceElement.style.left = `${finalX}px`;
        hoveredPieceElement.style.top = `${finalY}px`;
        hoveredPieceElement.style.transform = ''; // 移除transform，直接使用left/top定位
        hoveredPieceElement.style.boxSizing = 'content-box'; // 使用content-box确保与棋盘格子精确对齐
        hoveredPieceElement.style.imageRendering = 'pixelated'; // 像素化渲染，防止模糊

        // 记录元素的最终样式属性
        console.log(`设置的DOM样式: left=${hoveredPieceElement.style.left}, top=${hoveredPieceElement.style.top}`);
        console.log(`元素宽高: width=${hoveredPieceElement.offsetWidth}px, height=${hoveredPieceElement.offsetHeight}px`);

        // 获取棋盘元素上Canvas的位置信息
        if (this.boardElement) {
            const canvasElement = this.boardElement.querySelector('canvas');
            if (canvasElement) {
                const canvasRect = canvasElement.getBoundingClientRect();
                const boardRect = this.boardElement.getBoundingClientRect();
                console.log(`Canvas位置: left=${canvasRect.left - boardRect.left}px, top=${canvasRect.top - boardRect.top}px`);
                console.log(`Canvas尺寸: width=${canvasRect.width}px, height=${canvasRect.height}px`);
            }
        }

        console.log('======= 悬浮棋子坐标计算结束 =======');

        // 优化渲染性能
        hoveredPieceElement.style.backfaceVisibility = 'hidden';
        hoveredPieceElement.style.willChange = 'left, top';

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

        // 根据实际测试情况，暂时禁用网格高亮，避免干扰视觉效果
        (gridHighlight as HTMLElement).style.display = 'none';

        /* 如需启用网格高亮，可取消下面注释并删除上面的display:none行
        const cellSize = this.board.getCellSize();
        const boardPadding = 20; // 棋盘内边距，匹配CSS中的20px

        // 使用与Board.drawGrid和updateHoveredPiecePosition相同的计算方式
        const width = piece.shape[0].length * cellSize;
        const height = piece.shape.length * cellSize;
        const left = gridX * cellSize + boardPadding;
        const top = gridY * cellSize + boardPadding;

        // 应用整数像素值
        (gridHighlight as HTMLElement).style.width = `${Math.floor(width)}px`;
        (gridHighlight as HTMLElement).style.height = `${Math.floor(height)}px`;
        (gridHighlight as HTMLElement).style.left = `${Math.floor(left)}px`;
        (gridHighlight as HTMLElement).style.top = `${Math.floor(top)}px`;
        (gridHighlight as HTMLElement).style.display = 'block';
        (gridHighlight as HTMLElement).style.boxSizing = 'content-box';

        // 根据放置有效性设置不同颜色
        if (isValidPlacement) {
            (gridHighlight as HTMLElement).style.borderColor = 'rgba(0, 255, 0, 0.5)';
        } else {
            (gridHighlight as HTMLElement).style.borderColor = 'rgba(255, 0, 0, 0.5)';
        }
        */
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

    // 创建新游戏按钮
    public createNewGameButton(): HTMLElement {
        const newGameButtonElement = document.createElement('button');
        newGameButtonElement.id = 'new-game-button';
        newGameButtonElement.textContent = '新游戏';
        // 调整样式使按钮更紧凑
        newGameButtonElement.style.padding = '5px 12px';
        newGameButtonElement.style.margin = '0';
        newGameButtonElement.style.backgroundColor = '#4CAF50';
        newGameButtonElement.style.color = 'white';
        newGameButtonElement.style.border = 'none';
        newGameButtonElement.style.borderRadius = '4px';
        newGameButtonElement.style.fontSize = '14px';
        newGameButtonElement.style.cursor = 'pointer';
        newGameButtonElement.style.fontWeight = 'bold';
        newGameButtonElement.style.display = 'inline-block';

        // 鼠标悬停效果
        newGameButtonElement.style.transition = 'background-color 0.3s';
        newGameButtonElement.addEventListener('mouseover', () => {
            newGameButtonElement.style.backgroundColor = '#45a049';
        });
        newGameButtonElement.addEventListener('mouseout', () => {
            newGameButtonElement.style.backgroundColor = '#4CAF50';
        });

        // 点击事件 - 重新加载页面，开始新游戏
        newGameButtonElement.addEventListener('click', () => {
            // 清除本地存储中的游戏数据
            localStorage.removeItem('blokus_game_save');
            // 重新加载页面
            window.location.reload();
        });

        // 保存按钮引用
        this.newGameButtonElement = newGameButtonElement;

        return newGameButtonElement;
    }

    // 新增：渲染AI的棋子托盘
    public renderAIPieceTray(aiPlayer: Player): void {
        if (!this.aiPieceTrayElement) return;

        // 清除旧的内容
        this.aiPieceTrayElement.innerHTML = '';

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

            this.aiPieceTrayElement?.appendChild(pieceElement);
        });

        // 如果没有剩余棋子，显示一条消息
        if (aiPlayer.getAvailablePieces().length === 0) {
            const noMorePieces = document.createElement('div');
            noMorePieces.style.padding = '10px';
            noMorePieces.style.textAlign = 'center';
            noMorePieces.style.fontSize = '14px';
            noMorePieces.innerHTML = 'AI 没有剩余棋子';
            this.aiPieceTrayElement.appendChild(noMorePieces);
        }
    }
} 