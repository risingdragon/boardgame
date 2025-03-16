import { Piece } from './Piece';

/**
 * PieceUtilities类 - 负责处理棋子操作的工具函数
 */
export class PieceUtilities {
    /**
     * 检查指定位置是否与棋子的某个部分相邻
     */
    public hasAdjacentInPiece(x: number, y: number, occupiedCells: Record<string, boolean>): boolean {
        // 检查上、下、左、右四个方向
        const adjacentDirections = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];

        for (const dir of adjacentDirections) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (occupiedCells[`${nx},${ny}`]) {
                return true; // 有相邻的棋子部分
            }
        }

        return false;
    }

    /**
     * 计算棋子的扩展方向多样性
     */
    public calculateExpansionDirections(
        piece: Piece,
        x: number,
        y: number,
        occupiedCells: Record<string, boolean>,
        boardSize: number
    ): number {
        // 将对角线方向分为四个象限
        const quadrants = [
            { name: "topLeft", hasCorner: false },
            { name: "topRight", hasCorner: false },
            { name: "bottomLeft", hasCorner: false },
            { name: "bottomRight", hasCorner: false }
        ];

        // 检查每个已占据的格子
        for (const cellKey of Object.keys(occupiedCells)) {
            const [cellX, cellY] = cellKey.split(',').map(Number);

            // 检查每个象限的对角线方向
            // 左上象限
            if (this.checkCornerConnection(cellX, cellY, -1, -1, occupiedCells, boardSize)) {
                quadrants[0].hasCorner = true;
            }

            // 右上象限
            if (this.checkCornerConnection(cellX, cellY, 1, -1, occupiedCells, boardSize)) {
                quadrants[1].hasCorner = true;
            }

            // 左下象限
            if (this.checkCornerConnection(cellX, cellY, -1, 1, occupiedCells, boardSize)) {
                quadrants[2].hasCorner = true;
            }

            // 右下象限
            if (this.checkCornerConnection(cellX, cellY, 1, 1, occupiedCells, boardSize)) {
                quadrants[3].hasCorner = true;
            }
        }

        // 计算有多少个象限有角连接
        return quadrants.filter(q => q.hasCorner).length;
    }

    /**
     * 检查特定方向是否有有效的角连接
     */
    public checkCornerConnection(
        x: number,
        y: number,
        dx: number,
        dy: number,
        occupiedCells: Record<string, boolean>,
        boardSize: number
    ): boolean {
        const nx = x + dx;
        const ny = y + dy;

        // 检查这个点是否在边界内、不是棋子的一部分
        if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize
            && !occupiedCells[`${nx},${ny}`]) {

            // 检查这个点是否是有效的扩展点（即不相邻）
            return !this.hasAdjacentInPiece(nx, ny, occupiedCells);
        }

        return false;
    }

    /**
     * 计算棋子与棋盘边缘的接近程度
     */
    public calculateEdgeProximity(piece: Piece, x: number, y: number, boardSize: number): number {
        let minDistanceToEdge = boardSize;

        // 对于棋子的每个方块，计算到棋盘边缘的最短距离
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;

                    // 计算到四个边缘的距离
                    const distToLeft = gridX;
                    const distToRight = boardSize - 1 - gridX;
                    const distToTop = gridY;
                    const distToBottom = boardSize - 1 - gridY;

                    // 找出最短距离
                    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                    minDistanceToEdge = Math.min(minDistanceToEdge, minDist);
                }
            }
        }

        // 返回一个衡量接近程度的值（越小表示越接近边缘）
        return Math.max(0, 5 - minDistanceToEdge); // 0-5的评分，5表示非常接近边缘
    }

    /**
     * 克隆棋子
     */
    public clonePiece(piece: Piece): Piece {
        return piece.clone();
    }
} 