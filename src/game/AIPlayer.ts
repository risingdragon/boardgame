import { Player } from './Player';
import { Piece } from './Piece';
import { Board } from './Board';

interface MoveEvaluation {
    piece: Piece;
    x: number;
    y: number;
    score: number;
    rotation: number;
    flip: number;
}

export class AIPlayer extends Player {
    constructor(name: string, color: string, pieces: Piece[]) {
        super(name, color, pieces);
    }

    // Method to decide the AI's move
    public makeMove(board: Board): { piece: Piece, x: number, y: number } | null {
        // 检查是否是第一步棋
        const isFirstMove = this.isFirstMove(board);

        // 获取AI玩家的ID (假设为2)
        const aiPlayerId = 2;

        if (isFirstMove) {
            // 如果是第一步棋，优先尝试在起始位置放置最大的棋子
            return this.findFirstMove(board, aiPlayerId);
        } else {
            // 不是第一步棋，使用评分系统寻找最佳放置
            return this.findBestMove(board, aiPlayerId);
        }
    }

    // 为第一步棋找到最佳放置位置
    private findFirstMove(board: Board, aiPlayerId: number): { piece: Piece, x: number, y: number } | null {
        // 获取棋盘上的起始位置坐标(9, 9)
        const startX = 9;
        const startY = 9;
        const boardSize = 14;

        // 创建评分列表存储所有可能的第一步放置
        const firstMoveCandidates: {
            piece: Piece;
            x: number;
            y: number;
            rotation: number;
            flip: number;
            score: number;
        }[] = [];

        // 按照棋子大小排序，但不完全以大小为唯一标准
        const sortedPieces = [...this.availablePieces].sort((a, b) => {
            // 计算每个棋子的方块数量
            const countA = a.shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
            const countB = b.shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
            return countB - countA; // 大的优先，但会在后续评分中考虑其他因素
        });

        // 尝试放置排序后的棋子
        for (const originalPiece of sortedPieces) {
            // 创建基础副本
            const basePiece = this.clonePiece(originalPiece);

            // 尝试不同的旋转和翻转
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // 创建当前旋转和翻转的副本
                    const pieceCopy = this.clonePiece(basePiece);

                    // 应用旋转和翻转
                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 遍历不同的放置方式，使得棋子能覆盖起始位置
                    for (let offsetY = 0; offsetY < pieceCopy.shape.length; offsetY++) {
                        for (let offsetX = 0; offsetX < pieceCopy.shape[0].length; offsetX++) {
                            if (pieceCopy.shape[offsetY][offsetX]) {
                                const x = startX - offsetX;
                                const y = startY - offsetY;

                                // 检查是否可以放置
                                if (x >= 0 && y >= 0 &&
                                    x + pieceCopy.shape[0].length <= boardSize &&
                                    y + pieceCopy.shape.length <= boardSize) {
                                    if (board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                        // 评估这个放置的得分
                                        const score = this.evaluateFirstMove(pieceCopy, x, y, boardSize);

                                        // 添加到候选列表
                                        firstMoveCandidates.push({
                                            piece: originalPiece,
                                            x,
                                            y,
                                            rotation,
                                            flip,
                                            score
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 如果有候选，选择得分最高的
        if (firstMoveCandidates.length > 0) {
            // 按得分降序排序
            firstMoveCandidates.sort((a, b) => b.score - a.score);

            // 选择得分最高的移动
            const bestMove = firstMoveCandidates[0];
            const piece = bestMove.piece;

            // 对原始棋子应用最佳的旋转和翻转
            // 先重置状态（旋转4次回到原始状态）
            for (let i = 0; i < 4; i++) {
                piece.rotate();
            }

            // 然后应用最佳的旋转
            for (let i = 0; i < bestMove.rotation; i++) {
                piece.rotate();
            }

            // 应用最佳的翻转
            if (bestMove.flip === 1) {
                piece.flip();
            }

            return {
                piece,
                x: bestMove.x,
                y: bestMove.y
            };
        }

        return null;
    }

    // 评估第一步移动的质量
    private evaluateFirstMove(piece: Piece, x: number, y: number, boardSize: number): number {
        let score = 0;

        // 1. 棋子大小因素 - 较大的棋子得分高，但不是唯一因素
        const pieceSize = piece.shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
        score += pieceSize * 5; // 每个方块5分（权重降低）

        // 2. 计算棋子可能创建的对角连接点（未来可放置的点）
        let cornerPoints = 0;

        // 创建一个映射来跟踪棋子占据的位置
        const occupiedCells: Record<string, boolean> = {};

        // 记录棋子占据的所有格子
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;
                    occupiedCells[`${gridX},${gridY}`] = true;
                }
            }
        }

        // 对每个被占据的格子，检查对角线方向的潜在连接点
        for (const cellKey of Object.keys(occupiedCells)) {
            const [cellX, cellY] = cellKey.split(',').map(Number);

            // 检查对角线方向
            const diagonalDirections = [
                { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
                { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
            ];

            for (const dir of diagonalDirections) {
                const nx = cellX + dir.dx;
                const ny = cellY + dir.dy;

                // 检查这个点是否在边界内、不是棋子的一部分、且没有被计算过
                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize
                    && !occupiedCells[`${nx},${ny}`]) {

                    // 检查这个点是否是有效的扩展点（即不相邻）
                    const isValidCorner = !this.hasAdjacentInPiece(nx, ny, occupiedCells);

                    if (isValidCorner) {
                        cornerPoints++;

                        // 额外奖励：如果连接点靠近棋盘中心，得分更高
                        const distanceToCenter = Math.sqrt(
                            Math.pow(nx - boardSize / 2, 2) +
                            Math.pow(ny - boardSize / 2, 2)
                        );

                        // 距离中心越近，额外得分越高
                        score += Math.max(0, 5 - distanceToCenter / 2);
                    }
                }
            }
        }

        // 将对角连接点数量加入总分，这是关键指标
        score += cornerPoints * 15; // 每个有效的连接点15分

        // 3. 扩展方向的多样性（防止被封锁的关键）
        // 计算棋子的扩展方向多样性得分，奖励全方向扩展的棋子
        const expansionDirections = this.calculateExpansionDirections(piece, x, y, occupiedCells, boardSize);

        // 扩展方向的数量（最多4个：左上、右上、左下、右下）
        score += expansionDirections * 20; // 每个方向20分

        // 4. 避开边缘 - 如果棋子太靠近棋盘边缘，可能会限制未来的扩展
        const edgeProximity = this.calculateEdgeProximity(piece, x, y, boardSize);
        score -= edgeProximity * 5; // 每单位边缘接近度减5分

        return score;
    }

    // 检查指定位置是否与棋子的某个部分相邻
    private hasAdjacentInPiece(x: number, y: number, occupiedCells: Record<string, boolean>): boolean {
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

    // 计算棋子的扩展方向多样性
    private calculateExpansionDirections(
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

    // 检查特定方向是否有有效的角连接
    private checkCornerConnection(
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

    // 计算棋子与棋盘边缘的接近程度
    private calculateEdgeProximity(piece: Piece, x: number, y: number, boardSize: number): number {
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

    // 使用评分系统寻找最佳放置位置
    private findBestMove(board: Board, aiPlayerId: number): { piece: Piece, x: number, y: number } | null {
        const validMoves: MoveEvaluation[] = [];
        const boardSize = 14;
        const boardCenter = boardSize / 2 - 0.5;
        const gridState = board.getGrid();

        // 计算游戏进度（0-1之间），根据已放置的棋子数量
        const placedCellsCount = this.countPlacedCells(gridState);
        const totalCells = boardSize * boardSize;
        const gameProgress = Math.min(placedCellsCount / (totalCells * 0.3), 1); // 最多到30%饱和度就认为是后期

        // 遍历所有可用棋子
        for (const originalPiece of this.availablePieces) {
            // 为每个棋子创建一个基础副本，以便不影响原始棋子
            const basePiece = this.clonePiece(originalPiece);

            // 尝试不同的旋转和翻转
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // 为每种旋转和翻转创建新的副本，而不是修改basePiece
                    const pieceCopy = this.clonePiece(basePiece);

                    // 应用旋转和翻转到副本上
                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 尝试棋盘上每个位置
                    for (let y = 0; y < boardSize; y++) {
                        for (let x = 0; x < boardSize; x++) {
                            // 检查当前位置是否可以放置
                            if (board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                // 计算这个位置的得分
                                const score = this.evaluateMove(pieceCopy, x, y, gridState, boardCenter, gameProgress);

                                // 添加到有效移动列表，存储旋转和翻转信息
                                validMoves.push({
                                    piece: originalPiece, // 保存原始棋子引用
                                    x,
                                    y,
                                    score,
                                    rotation,  // 保存旋转次数
                                    flip       // 保存是否翻转
                                });
                            }
                        }
                    }
                }
            }
        }

        // 找到最佳得分的移动
        if (validMoves.length > 0) {
            // 按得分降序排序
            validMoves.sort((a, b) => b.score - a.score);

            // 从最高得分的移动中返回第一个
            const bestMove = validMoves[0];
            const piece = bestMove.piece;

            // 对原始棋子应用最佳的旋转和翻转
            // 先重置状态（旋转4次回到原始状态）
            for (let i = 0; i < 4; i++) {
                piece.rotate();
            }

            // 然后应用最佳的旋转
            for (let i = 0; i < bestMove.rotation; i++) {
                piece.rotate();
            }

            // 应用最佳的翻转
            if (bestMove.flip === 1) {
                piece.flip();
            }

            return {
                piece,
                x: bestMove.x,
                y: bestMove.y
            };
        }

        // 如果没有找到有效移动，尝试简单策略
        return this.findFallbackMove(board, aiPlayerId);
    }

    // 评估一个移动的得分
    private evaluateMove(piece: Piece, x: number, y: number, gridState: number[][], boardCenter: number, gameProgress: number): number {
        let score = 0;
        const boardSize = 14;

        // 1. 棋子大小因素 - 优先使用大棋子
        const pieceSize = piece.shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
        score += pieceSize * 10; // 每个格子加10分

        // 2. 位置因素 - 评估与中心的接近程度
        const pieceCenterX = x + piece.shape[0].length / 2;
        const pieceCenterY = y + piece.shape.length / 2;

        // 计算到中心的距离
        const distanceToCenter = Math.sqrt(
            Math.pow(pieceCenterX - boardCenter, 2) +
            Math.pow(pieceCenterY - boardCenter, 2)
        );

        // 在游戏早期，接近中心更重要；在后期，这个因素减弱
        const centerImportance = 1 - gameProgress;
        score += (boardSize / 2 - distanceToCenter) * 5 * centerImportance;

        // 3. 扩展因素 - 评估是否向外扩展
        // 检查棋子周围8个方向是否有自己的棋子可以连接
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;

                    // 检查对角线连接（扩展）
                    const diagonalDirections = [
                        { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
                        { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
                    ];

                    for (const dir of diagonalDirections) {
                        const nx = gridX + dir.dx;
                        const ny = gridY + dir.dy;

                        if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                            if (gridState[ny][nx] === 2) { // 2 是AI的ID
                                score += 3; // 每个对角线连接加3分
                            }
                        }
                    }
                }
            }
        }

        // 4. 防御因素 - 评估是否阻碍对手
        // 这个因素在游戏中期更重要
        const defensiveImportance = gameProgress * (1 - gameProgress) * 4; // 在游戏中期达到峰值

        // 检查周围是否有对手的棋子
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;

                    // 检查周围8个方向
                    const allDirections = [
                        { dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 },
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                        { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }
                    ];

                    for (const dir of allDirections) {
                        const nx = gridX + dir.dx;
                        const ny = gridY + dir.dy;

                        if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                            if (gridState[ny][nx] === 1) { // 1 是玩家的ID
                                score += 2 * defensiveImportance; // 靠近对手棋子加分
                            }
                        }
                    }
                }
            }
        }

        return score;
    }

    // 计数棋盘上已经放置的棋子数量
    private countPlacedCells(gridState: number[][]): number {
        let count = 0;
        for (const row of gridState) {
            for (const cell of row) {
                if (cell !== 0) {
                    count++;
                }
            }
        }
        return count;
    }

    // 复制一个棋子对象
    private clonePiece(piece: Piece): Piece {
        // 使用Piece类的clone方法
        return piece.clone();
    }

    // 备用移动策略（当评分系统找不到好的移动时使用）
    private findFallbackMove(board: Board, aiPlayerId: number): { piece: Piece, x: number, y: number } | null {
        for (const originalPiece of this.availablePieces) {
            // 创建基础副本
            const basePiece = this.clonePiece(originalPiece);

            // 尝试不同的旋转和翻转
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // 创建当前旋转和翻转的副本
                    const pieceCopy = this.clonePiece(basePiece);

                    // 应用旋转和翻转
                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 尝试棋盘上每个位置
                    for (let y = 0; y < 14; y++) {
                        for (let x = 0; x < 14; x++) {
                            // 检查是否可以放置
                            if (board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                // 应用相同的旋转和翻转到原始棋子上
                                // 先重置
                                for (let i = 0; i < 4; i++) {
                                    originalPiece.rotate();
                                }

                                // 应用最佳旋转
                                for (let i = 0; i < rotation; i++) {
                                    originalPiece.rotate();
                                }

                                // 应用最佳翻转
                                if (flip === 1) {
                                    originalPiece.flip();
                                }

                                return { piece: originalPiece, x, y };
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    // 判断是否是AI的第一步棋
    private isFirstMove(board: Board): boolean {
        const grid = board.getGrid();
        const aiPlayerId = 2;

        // 检查棋盘上是否已有AI玩家的棋子
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] === aiPlayerId) {
                    return false; // 已经有AI棋子，不是第一步
                }
            }
        }

        return true; // 没有找到AI棋子，是第一步
    }
} 