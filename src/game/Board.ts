export class Board {
    private grid: number[][];
    private width: number;
    private height: number;
    private cellSize: number = 30; // Default size for desktop
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    // 定义特定的起始位置，而不是角落
    private startingPositions = [
        { x: 4, y: 4 },   // 人类玩家起始位置
        { x: 9, y: 9 }    // AI玩家起始位置
    ];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        // Initialize grid with zeros (empty cells)
        this.grid = Array(height).fill(0).map(() => Array(width).fill(0));
    }

    // 提供一个公共方法获取当前的cellSize
    public getCellSize(): number {
        return this.cellSize;
    }

    // 计算合适的单元格大小
    private calculateCellSize(): number {
        // 根据是否移动设备，使用不同的计算逻辑
        const isMobile = window.innerWidth <= 768 ||
            ('ontouchstart' in window && window.innerWidth <= 1024);

        if (!isMobile) {
            // PC设备 - 使用更大的单元格尺寸
            // 根据容器宽度计算可能的单元格尺寸
            const containerWidth = document.getElementById('center-column')?.clientWidth || 600;
            const boardContainerPadding = 40; // 考虑内边距
            const availableWidth = containerWidth - boardContainerPadding;

            // 计算可能的单元格尺寸 (考虑有20个单元格的宽度)
            let calculatedSize = Math.floor(availableWidth / 20);

            // 确保单元格尺寸在合理范围内
            calculatedSize = Math.max(30, calculatedSize); // 最小不低于30px
            calculatedSize = Math.min(38, calculatedSize); // 最大不超过38px

            return calculatedSize;
        } else {
            // 移动设备 - 使用较小的自适应单元格尺寸
            // 初始尺寸
            let cellSize = Math.min(22, Math.floor((window.innerWidth - 40) / 14));
            cellSize = Math.max(16, cellSize); // 保证最小可视性

            return cellSize;
        }
    }

    // 调整画布尺寸方法
    private resizeCanvas(): void {
        if (!this.canvas) return;

        // 重新计算单元格大小
        this.cellSize = this.calculateCellSize();

        // 更新画布尺寸
        this.canvas.width = this.width * this.cellSize;
        this.canvas.height = this.height * this.cellSize;

        // 重绘棋盘
        this.drawGrid();
    }

    public render(container: HTMLElement): void {
        // Create canvas element if it doesn't exist
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');

            // 明确设置Canvas的样式，防止边框和边距的影响
            this.canvas.style.display = 'block';
            this.canvas.style.border = 'none';
            this.canvas.style.margin = '0';
            this.canvas.style.padding = '0';
            this.canvas.style.boxSizing = 'content-box';
            this.canvas.style.imageRendering = 'pixelated';

            // 创建时先设置单元格大小
            this.cellSize = this.calculateCellSize();

            this.canvas.width = this.width * this.cellSize;
            this.canvas.height = this.height * this.cellSize;
            this.ctx = this.canvas.getContext('2d');

            container.appendChild(this.canvas);

            // 添加窗口大小改变事件监听
            window.addEventListener('resize', () => {
                this.resizeCanvas();
            });
        } else {
            // 更新尺寸
            this.resizeCanvas();
        }

        this.drawGrid();
    }

    private drawGrid(): void {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines - 使用更淡的颜色
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= this.width; x++) {
            const pixelX = x * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, 0);
            this.ctx.lineTo(pixelX, this.height * this.cellSize);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.height; y++) {
            const pixelY = y * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(this.width * this.cellSize, pixelY);
            this.ctx.stroke();
        }

        // Draw colored cells based on grid values
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellValue = this.grid[y][x];
                if (cellValue !== 0) {
                    // Different colors for different players
                    this.ctx.fillStyle = cellValue === 1 ? 'blue' : 'red';

                    // 计算像素坐标
                    const pixelX = x * this.cellSize;
                    const pixelY = y * this.cellSize;

                    // 移除+1和-2的偏移，让棋子完全填充单元格
                    this.ctx.fillRect(
                        pixelX,
                        pixelY,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        // 高亮显示起始位置，而不是角落
        this.highlightStartingPosition(this.startingPositions[0].x, this.startingPositions[0].y, 'rgba(0, 0, 255, 0.3)'); // 人类玩家起始位置
        this.highlightStartingPosition(this.startingPositions[1].x, this.startingPositions[1].y, 'rgba(255, 0, 0, 0.3)'); // AI玩家起始位置
    }

    private highlightStartingPosition(x: number, y: number, color: string): void {
        if (!this.ctx) return;

        this.ctx.fillStyle = color;
        // 绘制圆圈标记起始位置
        this.ctx.beginPath();
        this.ctx.arc(
            x * this.cellSize + this.cellSize / 2,
            y * this.cellSize + this.cellSize / 2,
            this.cellSize / 3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    public placePiece(piece: any, x: number, y: number, playerId: number): boolean {
        // Check if placement is valid
        if (!this.isValidPlacement(piece, x, y, playerId)) {
            return false;
        }

        // Place the piece on the grid
        piece.shape.forEach((row: boolean[], rowIndex: number) => {
            row.forEach((cell: boolean, colIndex: number) => {
                if (cell) {
                    // 计算最终网格坐标
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;

                    this.grid[gridY][gridX] = playerId;
                }
            });
        });

        // Redraw the board
        this.drawGrid();
        return true;
    }

    public isValidPlacement(piece: any, x: number, y: number, playerId: number): boolean {
        // Check if piece is within bounds
        if (
            x < 0 ||
            y < 0 ||
            x + piece.shape[0].length > this.width ||
            y + piece.shape.length > this.height
        ) {
            return false;
        }

        // Check if all cells are empty and at least one corner touches
        let touchesCorner = false;

        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[rowIndex].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;

                    // Check if cell is already occupied
                    if (this.grid[gridY][gridX] !== 0) {
                        return false;
                    }

                    // Check for adjacency to same player's pieces (not allowed)
                    if (
                        this.isAdjacent(gridX, gridY, playerId)
                    ) {
                        return false;
                    }

                    // Check for corner touch to same player's pieces
                    if (this.isTouchingCorner(gridX, gridY, playerId)) {
                        touchesCorner = true;
                    }
                }
            }
        }

        // First move must be on the designated starting position
        if (this.isFirstMove(playerId)) {
            return this.isPlacementOnStartingPosition(piece, x, y, playerId);
        }

        return touchesCorner;
    }

    private isFirstMove(playerId: number): boolean {
        // Check if this is the player's first move
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === playerId) {
                    return false;
                }
            }
        }
        return true;
    }

    // 修改为检查是否在起始位置上放置
    private isPlacementOnStartingPosition(piece: any, x: number, y: number, playerId: number): boolean {
        // 获取对应玩家的起始位置
        const startingPos = this.startingPositions[playerId - 1]; // playerId从1开始，索引从0开始

        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[rowIndex].length; colIndex++) {
                if (
                    piece.shape[rowIndex][colIndex] &&
                    x + colIndex === startingPos.x &&
                    y + rowIndex === startingPos.y
                ) {
                    return true; // 棋子覆盖了起始位置
                }
            }
        }

        return false; // 棋子没有覆盖起始位置
    }

    private isAdjacent(x: number, y: number, playerId: number): boolean {
        // Check if adjacent cells contain pieces of the same player
        const adjacentPositions = [
            { x: x - 1, y: y },
            { x: x + 1, y: y },
            { x: x, y: y - 1 },
            { x: x, y: y + 1 }
        ];

        for (const pos of adjacentPositions) {
            if (
                pos.x >= 0 &&
                pos.x < this.width &&
                pos.y >= 0 &&
                pos.y < this.height &&
                this.grid[pos.y][pos.x] === playerId
            ) {
                return true;
            }
        }

        return false;
    }

    private isTouchingCorner(x: number, y: number, playerId: number): boolean {
        // Check if the cell touches the corner of same player's piece
        const cornerPositions = [
            { x: x - 1, y: y - 1 },
            { x: x - 1, y: y + 1 },
            { x: x + 1, y: y - 1 },
            { x: x + 1, y: y + 1 }
        ];

        for (const pos of cornerPositions) {
            if (
                pos.x >= 0 &&
                pos.x < this.width &&
                pos.y >= 0 &&
                pos.y < this.height &&
                this.grid[pos.y][pos.x] === playerId
            ) {
                return true;
            }
        }

        return false;
    }

    // Get the current state of the board
    public getGrid(): number[][] {
        return this.grid;
    }
} 