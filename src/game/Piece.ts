export class Piece {
    public id: number;
    public shape: boolean[][];
    public name: string;

    constructor(id: number, shape: boolean[][], name: string) {
        this.id = id;
        this.shape = shape;
        this.name = name;
    }

    // Get the number of squares in the piece
    public getSize(): number {
        let count = 0;
        for (const row of this.shape) {
            for (const cell of row) {
                if (cell) {
                    count++;
                }
            }
        }
        return count;
    }

    // Rotate the piece 90 degrees clockwise
    public rotate(): void {
        const rows = this.shape.length;
        const cols = this.shape[0].length;
        const newShape: boolean[][] = [];

        // Initialize the new shape array
        for (let i = 0; i < cols; i++) {
            newShape.push(Array(rows).fill(false));
        }

        // Perform the rotation
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                newShape[col][rows - 1 - row] = this.shape[row][col];
            }
        }

        this.shape = newShape;
    }

    // Flip the piece horizontally
    public flip(): void {
        const rows = this.shape.length;
        const cols = this.shape[0].length;
        const newShape: boolean[][] = [];

        // Initialize the new shape array
        for (let i = 0; i < rows; i++) {
            newShape.push(Array(cols).fill(false));
        }

        // Perform the horizontal flip
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                newShape[row][cols - 1 - col] = this.shape[row][col];
            }
        }

        this.shape = newShape;
    }

    // Create a clone of this piece
    public clone(): Piece {
        const newShape = this.shape.map(row => [...row]);
        return new Piece(this.id, newShape, this.name);
    }
} 