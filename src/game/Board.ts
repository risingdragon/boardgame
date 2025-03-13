export class Board {
    private grid: number[][];
    private width: number;
    private height: number;
    private cellSize: number = 30; // Size of each cell in pixels
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        // Initialize grid with zeros (empty cells)
        this.grid = Array(height).fill(0).map(() => Array(width).fill(0));
    }

    public render(container: HTMLElement): void {
        // Create canvas element if it doesn't exist
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width * this.cellSize;
            this.canvas.height = this.height * this.cellSize;
            this.ctx = this.canvas.getContext('2d');
            container.appendChild(this.canvas);
        }

        this.drawGrid();
    }

    private drawGrid(): void {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);

        // Draw grid lines
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= this.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.height * this.cellSize);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.width * this.cellSize, y * this.cellSize);
            this.ctx.stroke();
        }

        // Draw colored cells based on grid values
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellValue = this.grid[y][x];
                if (cellValue !== 0) {
                    // Different colors for different players
                    this.ctx.fillStyle = cellValue === 1 ? 'blue' : 'red';
                    this.ctx.fillRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }

        // Highlight starting corners
        this.highlightCorner(0, 0); // Top-left
        this.highlightCorner(0, this.height - 1); // Bottom-left
        this.highlightCorner(this.width - 1, 0); // Top-right
        this.highlightCorner(this.width - 1, this.height - 1); // Bottom-right
    }

    private highlightCorner(x: number, y: number): void {
        if (!this.ctx) return;

        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.fillRect(
            x * this.cellSize + 1,
            y * this.cellSize + 1,
            this.cellSize - 2,
            this.cellSize - 2
        );
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
                    this.grid[y + rowIndex][x + colIndex] = playerId;
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

        // First move must be in a corner
        if (this.isFirstMove(playerId)) {
            return this.isPlacementInCorner(piece, x, y);
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

    private isPlacementInCorner(piece: any, x: number, y: number): boolean {
        const corners = [
            { x: 0, y: 0 },
            { x: 0, y: this.height - 1 },
            { x: this.width - 1, y: 0 },
            { x: this.width - 1, y: this.height - 1 }
        ];

        for (const corner of corners) {
            for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
                for (let colIndex = 0; colIndex < piece.shape[rowIndex].length; colIndex++) {
                    if (
                        piece.shape[rowIndex][colIndex] &&
                        x + colIndex === corner.x &&
                        y + rowIndex === corner.y
                    ) {
                        return true;
                    }
                }
            }
        }

        return false;
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