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

        // 创建一个数组来存储所有连接点的位置
        const connectionPoints: { x: number, y: number }[] = [];

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
                        connectionPoints.push({ x: nx, y: ny });

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

        // 5. 评估连接点的脆弱性 - 检查连接点是否容易被对手堵住
        const vulnerabilityScore = this.evaluateVulnerability(connectionPoints, occupiedCells, boardSize);
        score -= vulnerabilityScore; // 减去脆弱性得分（越高越容易被堵）

        // 6. 连接点的集中度 - 避免连接点过于集中
        const clusteringPenalty = this.evaluateConnectionClustering(connectionPoints);
        score -= clusteringPenalty; // 惩罚连接点的过度集中

        return score;
    }

    // 评估连接点的脆弱性
    private evaluateVulnerability(
        connectionPoints: { x: number, y: number }[],
        occupiedCells: Record<string, boolean>,
        boardSize: number
    ): number {
        let vulnerabilityScore = 0;

        // 对每个连接点，检查它是否易于被阻断
        for (const point of connectionPoints) {
            // 检查这个连接点周围8个方向
            const surroundingDirections = [
                { dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 },
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }
            ];

            // 计算周围的空格数量
            let emptySpacesAround = 0;
            for (const dir of surroundingDirections) {
                const nx = point.x + dir.dx;
                const ny = point.y + dir.dy;

                // 如果在边界内且不是棋子的一部分
                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize
                    && !occupiedCells[`${nx},${ny}`]) {
                    emptySpacesAround++;
                }
            }

            // 周围空格越少，越容易被对手堵住
            // 如果空格少于4个，认为是脆弱的
            if (emptySpacesAround <= 3) {
                vulnerabilityScore += (4 - emptySpacesAround) * 10;
            }

            // 检查该连接点是否只有一个扩展方向
            // 创建一个计数，记录该连接点在不同象限中有多少个其他连接点
            const quadrants = [false, false, false, false]; // [左上, 右上, 左下, 右下]

            for (const otherPoint of connectionPoints) {
                if (otherPoint.x === point.x && otherPoint.y === point.y) continue;

                // 判断其他连接点在该点的哪个象限
                if (otherPoint.x < point.x && otherPoint.y < point.y) quadrants[0] = true;
                if (otherPoint.x > point.x && otherPoint.y < point.y) quadrants[1] = true;
                if (otherPoint.x < point.x && otherPoint.y > point.y) quadrants[2] = true;
                if (otherPoint.x > point.x && otherPoint.y > point.y) quadrants[3] = true;
            }

            // 计算该点可以连接到的象限数量
            const quadrantCount = quadrants.filter(q => q).length;

            // 如果只能向一个或零个方向扩展，增加脆弱性分数
            if (quadrantCount <= 1) {
                vulnerabilityScore += (2 - quadrantCount) * 15;
            }
        }

        return vulnerabilityScore;
    }

    // 评估连接点的集中程度
    private evaluateConnectionClustering(connectionPoints: { x: number, y: number }[]): number {
        let clusteringPenalty = 0;

        // 如果连接点太少，不评估集中度
        if (connectionPoints.length <= 2) {
            return 0;
        }

        // 计算连接点之间的平均距离
        let totalDistance = 0;
        let pairCount = 0;

        for (let i = 0; i < connectionPoints.length; i++) {
            for (let j = i + 1; j < connectionPoints.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(connectionPoints[i].x - connectionPoints[j].x, 2) +
                    Math.pow(connectionPoints[i].y - connectionPoints[j].y, 2)
                );
                totalDistance += dist;
                pairCount++;
            }
        }

        if (pairCount === 0) return 0;

        const avgDistance = totalDistance / pairCount;

        // 如果平均距离小于阈值，增加集中度惩罚
        // 对于首次放置，我们希望连接点分散在不同区域
        if (avgDistance < 3) {
            clusteringPenalty = (3 - avgDistance) * 10;
        }

        return clusteringPenalty;
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
        // 创建一个映射来跟踪棋子占据的位置
        const occupiedCells: Record<string, boolean> = {};
        const newConnectionPoints: { x: number, y: number }[] = [];

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

        // 检查棋子是否与现有的AI棋子有对角连接
        let diagonalConnections = 0;
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
                                diagonalConnections++;
                            }
                        }
                    }
                }
            }
        }

        score += diagonalConnections * 8; // 每个对角线连接加8分（增加权重）

        // 计算新创建的连接点
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

                // 检查这个点是否在边界内、不是棋子的一部分、且没有其他棋子
                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize
                    && !occupiedCells[`${nx},${ny}`] && gridState[ny][nx] === 0) {

                    // 检查这个点是否是有效的扩展点（即不相邻）
                    let hasAdjacent = false;

                    // 检查上下左右是否有本方棋子（不包括新放置的棋子）
                    const adjacentDirections = [
                        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
                    ];

                    for (const adjDir of adjacentDirections) {
                        const adjX = nx + adjDir.dx;
                        const adjY = ny + adjDir.dy;

                        if (adjX >= 0 && adjX < boardSize && adjY >= 0 && adjY < boardSize) {
                            // 检查是否是棋子的一部分
                            if (occupiedCells[`${adjX},${adjY}`]) {
                                hasAdjacent = true;
                                break;
                            }

                            // 检查是否是已有的AI棋子
                            if (gridState[adjY][adjX] === 2) {
                                hasAdjacent = true;
                                break;
                            }
                        }
                    }

                    if (!hasAdjacent) {
                        newConnectionPoints.push({ x: nx, y: ny });
                    }
                }
            }
        }

        // 每个新连接点加分
        score += newConnectionPoints.length * 10;

        // 检查新连接点的脆弱性
        if (newConnectionPoints.length > 0) {
            // 创建一个新的网格状态，包含新放置的棋子
            const newGridState = gridState.map(row => [...row]);
            for (const cellKey of Object.keys(occupiedCells)) {
                const [cellX, cellY] = cellKey.split(',').map(Number);
                newGridState[cellY][cellX] = 2; // 标记为AI所有
            }

            // 评估新连接点的脆弱性
            const aiCells: Record<string, boolean> = {};

            // 记录所有AI棋子的位置
            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    if (newGridState[y][x] === 2) {
                        aiCells[`${x},${y}`] = true;
                    }
                }
            }

            const vulnerabilityScore = this.evaluateVulnerability(newConnectionPoints, aiCells, boardSize);
            score -= vulnerabilityScore * 0.7; // 减去一定比例的脆弱性得分
        }

        // 4. 防御因素 - 评估是否阻碍对手
        // 针对游戏进展调整防御权重
        const baseDefensiveImportance = gameProgress * (1 - gameProgress) * 4; // 在游戏中期达到峰值

        // 根据对手的扩展潜力增加防御重要性
        const opponentThreatLevel = this.evaluateOpponentThreat(gridState, boardSize);
        const defensiveImportance = baseDefensiveImportance * (1 + opponentThreatLevel * 0.5);

        // 检查周围是否有对手的棋子
        let opponentProximity = 0;
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
                                opponentProximity++;
                            }
                        }
                    }
                }
            }
        }

        score += opponentProximity * 2 * defensiveImportance; // 靠近对手棋子加分

        // 5. 阻断对手的潜在连接点
        let blockScore = 0;
        const opponentConnectionPoints = this.findOpponentConnectionPoints(gridState, boardSize);

        // 检查放置这个棋子是否会阻断对手的潜在连接点
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;

                    // 检查是否阻断了对手的连接点
                    for (const point of opponentConnectionPoints) {
                        if (point.x === gridX && point.y === gridY) {
                            // 计算这个连接点的战略价值
                            const pointValue = this.evaluateOpponentConnectionPointValue(point, gridState, boardSize);
                            blockScore += pointValue;
                            break;
                        }
                    }
                }
            }
        }

        // 6. 战略性阻断 - 阻断对手可能的扩展路径
        const strategicBlockingScore = this.evaluateStrategicBlocking(piece, x, y, gridState, boardSize);
        score += strategicBlockingScore * 15; // 战略阻断得高分

        // 7. 关键位置攻防 - 占据关键战略位置
        const keyPositionScore = this.evaluateKeyPositions(piece, x, y, gridState, boardSize, gameProgress);
        score += keyPositionScore * 12;

        // 根据游戏进程调整进攻性和防御性的平衡
        // 在游戏早期，更侧重于自身扩展；到了中后期，更注重阻断对手
        const offensiveWeight = Math.max(0.4, 1 - gameProgress * 1.2); // 最低为0.4
        const defensiveWeight = Math.min(1.5, 0.6 + gameProgress * 1.2); // 最高为1.5

        // 将blockScore乘以defensiveWeight加入总分
        score += blockScore * defensiveWeight;

        return score;
    }

    // 评估对手的威胁程度
    private evaluateOpponentThreat(gridState: number[][], boardSize: number): number {
        let threatLevel = 0;

        // 1. 计算对手控制的区域大小
        let opponentCellCount = 0;
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (gridState[y][x] === 1) { // 1是人类玩家ID
                    opponentCellCount++;
                }
            }
        }

        // 2. 计算对手的潜在扩展点数量
        const opponentConnectionPoints = this.findOpponentConnectionPoints(gridState, boardSize);

        // 根据对手占据的格子数量和连接点数量计算威胁等级
        threatLevel = opponentCellCount * 0.5 + opponentConnectionPoints.length * 1.5;

        // 3. 检查对手是否有机会形成大面积连通区域
        const connectedRegions = this.analyzeOpponentConnectedRegions(gridState, boardSize);
        if (connectedRegions.large > 0) {
            threatLevel += connectedRegions.large * 10; // 大连通区域威胁更高
        }
        if (connectedRegions.medium > 0) {
            threatLevel += connectedRegions.medium * 5; // 中等连通区域
        }

        return Math.min(10, threatLevel / 10); // 归一化到0-10的范围
    }

    // 分析对手的连通区域
    private analyzeOpponentConnectedRegions(gridState: number[][], boardSize: number): { large: number, medium: number, small: number } {
        // 创建访问标记数组
        const visited: boolean[][] = Array(boardSize).fill(0).map(() => Array(boardSize).fill(false));
        const regions = { large: 0, medium: 0, small: 0 };

        // 深度优先搜索查找连通区域
        const dfs = (x: number, y: number): number => {
            if (x < 0 || x >= boardSize || y < 0 || y >= boardSize ||
                visited[y][x] || gridState[y][x] !== 1) {
                return 0;
            }

            visited[y][x] = true;
            let size = 1;

            // 检查对角线方向的连通性
            const diagonalDirections = [
                { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
                { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
            ];

            for (const dir of diagonalDirections) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                size += dfs(nx, ny);
            }

            return size;
        };

        // 搜索所有连通区域
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (!visited[y][x] && gridState[y][x] === 1) {
                    const regionSize = dfs(x, y);

                    // 根据连通区域大小分类
                    if (regionSize >= 10) {
                        regions.large++;
                    } else if (regionSize >= 5) {
                        regions.medium++;
                    } else {
                        regions.small++;
                    }
                }
            }
        }

        return regions;
    }

    // 寻找对手所有可能的连接点
    private findOpponentConnectionPoints(gridState: number[][], boardSize: number): { x: number, y: number, value: number }[] {
        const connectionPoints: { x: number, y: number, value: number }[] = [];

        // 临时映射记录对手的格子位置
        const opponentCells: Record<string, boolean> = {};

        // 先记录所有对手格子
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (gridState[y][x] === 1) {
                    opponentCells[`${x},${y}`] = true;
                }
            }
        }

        // 检查每个对手格子的对角线方向，寻找可能的连接点
        for (const cellKey of Object.keys(opponentCells)) {
            const [cellX, cellY] = cellKey.split(',').map(Number);

            // 检查对角线方向
            const diagonalDirections = [
                { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
                { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
            ];

            for (const dir of diagonalDirections) {
                const nx = cellX + dir.dx;
                const ny = cellY + dir.dy;

                // 检查这个点是否在边界内、是空的
                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && gridState[ny][nx] === 0) {
                    // 检查这个点是否没有相邻的对手格子（根据规则，需要是对角连接）
                    let hasAdjacent = false;

                    // 检查上下左右
                    const adjacentDirections = [
                        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
                    ];

                    for (const adjDir of adjacentDirections) {
                        const adjX = nx + adjDir.dx;
                        const adjY = ny + adjDir.dy;

                        if (adjX >= 0 && adjX < boardSize && adjY >= 0 && adjY < boardSize) {
                            if (gridState[adjY][adjX] === 1) { // 相邻有对手格子
                                hasAdjacent = true;
                                break;
                            }
                        }
                    }

                    if (!hasAdjacent) {
                        // 计算连接点的价值
                        const value = this.evaluateOpponentConnectionPointValue({ x: nx, y: ny }, gridState, boardSize);

                        // 检查是否已有相同位置的连接点
                        const existingIndex = connectionPoints.findIndex(p => p.x === nx && p.y === ny);
                        if (existingIndex >= 0) {
                            // 更新价值为最高值
                            connectionPoints[existingIndex].value = Math.max(connectionPoints[existingIndex].value, value);
                        } else {
                            // 添加新的连接点
                            connectionPoints.push({ x: nx, y: ny, value });
                        }
                    }
                }
            }
        }

        // 按价值排序
        connectionPoints.sort((a, b) => b.value - a.value);

        return connectionPoints;
    }

    // 评估一个对手连接点的战略价值
    private evaluateOpponentConnectionPointValue(
        point: { x: number, y: number },
        gridState: number[][],
        boardSize: number
    ): number {
        let value = 15; // 基础价值

        // 1. 计算通过该点可连接的对手棋子数量
        let connectableOpponentCells = 0;

        // 检查对角线方向
        const diagonalDirections = [
            { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
            { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
        ];

        for (const dir of diagonalDirections) {
            const nx = point.x + dir.dx;
            const ny = point.y + dir.dy;

            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                if (gridState[ny][nx] === 1) { // 1是人类玩家ID
                    connectableOpponentCells++;
                }
            }
        }

        // 连接点能连接的对手棋子越多，价值越高
        value += connectableOpponentCells * 5;

        // 2. 评估连接点的位置（靠近中心价值更高）
        const distanceToCenter = Math.sqrt(
            Math.pow(point.x - boardSize / 2, 2) +
            Math.pow(point.y - boardSize / 2, 2)
        );

        // 距离中心越近，价值越高
        value += Math.max(0, (boardSize / 2 - distanceToCenter)) * 2;

        // 3. 评估连接点是否能连接对手的多个区域
        // 模拟添加该连接点后，对手区域的变化
        const tempGrid = gridState.map(row => [...row]);
        tempGrid[point.y][point.x] = 1; // 模拟对手占据该点

        const regionsBeforeAdd = this.analyzeOpponentConnectedRegions(gridState, boardSize);
        const regionsAfterAdd = this.analyzeOpponentConnectedRegions(tempGrid, boardSize);

        // 如果连接点能减少区域数量（意味着连接了多个区域），价值大幅提升
        const regionDifference =
            (regionsBeforeAdd.large + regionsBeforeAdd.medium + regionsBeforeAdd.small) -
            (regionsAfterAdd.large + regionsAfterAdd.medium + regionsAfterAdd.small);

        if (regionDifference > 0) {
            value += regionDifference * 25; // 连接区域的价值很高
        }

        // 如果连接点能增加大型区域的数量，价值更高
        if (regionsAfterAdd.large > regionsBeforeAdd.large) {
            value += (regionsAfterAdd.large - regionsBeforeAdd.large) * 30;
        }

        return value;
    }

    // 评估战略性阻断得分
    private evaluateStrategicBlocking(
        piece: Piece,
        x: number,
        y: number,
        gridState: number[][],
        boardSize: number
    ): number {
        let blockingScore = 0;

        // 创建一个新的网格状态，包含新放置的棋子
        const newGridState = gridState.map(row => [...row]);
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;
                    newGridState[gridY][gridX] = 2; // 标记为AI所有
                }
            }
        }

        // 计算放置前后对手可用的连接点数量变化
        const beforeConnectionPoints = this.findOpponentConnectionPoints(gridState, boardSize);
        const afterConnectionPoints = this.findOpponentConnectionPoints(newGridState, boardSize);

        // 计算被阻断的高价值连接点数量
        let blockedHighValuePoints = 0;
        let blockedMediumValuePoints = 0;

        for (const beforePoint of beforeConnectionPoints) {
            // 查看该点是否还在放置后的连接点列表中
            const stillExists = afterConnectionPoints.some(
                p => p.x === beforePoint.x && p.y === beforePoint.y
            );

            if (!stillExists) {
                // 根据被阻断连接点的价值加分
                if (beforePoint.value >= 30) {
                    blockedHighValuePoints++;
                } else if (beforePoint.value >= 15) {
                    blockedMediumValuePoints++;
                }
            }
        }

        // 阻断的高价值点得分更多
        blockingScore += blockedHighValuePoints * 3 + blockedMediumValuePoints * 1;

        // 评估放置后对手的扩展受限程度
        // 比较放置前后对手的总连接点价值
        const beforeTotalValue = beforeConnectionPoints.reduce((sum, p) => sum + p.value, 0);
        const afterTotalValue = afterConnectionPoints.reduce((sum, p) => sum + p.value, 0);

        // 如果总价值下降，加分
        if (beforeTotalValue > afterTotalValue) {
            blockingScore += (beforeTotalValue - afterTotalValue) / 20;
        }

        return blockingScore;
    }

    // 评估关键位置的战略价值
    private evaluateKeyPositions(
        piece: Piece,
        x: number,
        y: number,
        gridState: number[][],
        boardSize: number,
        gameProgress: number
    ): number {
        let keyPositionScore = 0;

        // 创建棋盘热点图，标记战略价值
        const heatMap = this.generateBoardHeatMap(gridState, boardSize, gameProgress);

        // 计算棋子覆盖的热点总价值
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;

                    // 如果位置有效，加上热点值
                    if (gridX >= 0 && gridX < boardSize && gridY >= 0 && gridY < boardSize) {
                        keyPositionScore += heatMap[gridY][gridX];
                    }
                }
            }
        }

        return keyPositionScore;
    }

    // 生成棋盘热点图（标记战略价值高的位置）
    private generateBoardHeatMap(gridState: number[][], boardSize: number, gameProgress: number): number[][] {
        // 创建热点图
        const heatMap: number[][] = Array(boardSize).fill(0).map(() => Array(boardSize).fill(0));

        // 找出对手所有可用的连接点
        const opponentConnectionPoints = this.findOpponentConnectionPoints(gridState, boardSize);

        // 将对手连接点周围区域标记为高价值区域
        for (const point of opponentConnectionPoints) {
            // 标记连接点本身
            heatMap[point.y][point.x] = point.value / 5;

            // 标记周围区域（值随距离衰减）
            const radius = 2; // 影响半径
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = point.x + dx;
                    const ny = point.y + dy;

                    if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && gridState[ny][nx] === 0) {
                        // 计算到中心的距离
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // 根据距离计算权重（越近权重越高）
                        const weight = Math.max(0, (radius - distance) / radius);

                        // 更新热点值（取最大值）
                        heatMap[ny][nx] = Math.max(
                            heatMap[ny][nx],
                            point.value / 10 * weight
                        );
                    }
                }
            }
        }

        // 在游戏早期，中心区域更有价值
        if (gameProgress < 0.3) {
            const centerX = boardSize / 2 - 0.5;
            const centerY = boardSize / 2 - 0.5;
            const centerRadius = boardSize / 4;

            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    if (gridState[y][x] === 0) { // 只处理空格子
                        // 计算到中心的距离
                        const distanceToCenter = Math.sqrt(
                            Math.pow(x - centerX, 2) +
                            Math.pow(y - centerY, 2)
                        );

                        // 如果在中心区域内，增加价值
                        if (distanceToCenter < centerRadius) {
                            const centralImportance = (1 - distanceToCenter / centerRadius) * 3 * (1 - gameProgress);
                            heatMap[y][x] += centralImportance;
                        }
                    }
                }
            }
        }

        return heatMap;
    }

    // 检查一个位置是否可能是对手的连接点
    private isOpponentConnectionPoint(x: number, y: number, gridState: number[][], boardSize: number): boolean {
        // 检查这个位置周围的对角线方向
        const diagonalDirections = [
            { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
            { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
        ];

        let opponentDiagonalCount = 0;

        for (const dir of diagonalDirections) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                if (gridState[ny][nx] === 1) { // 1是人类玩家ID
                    opponentDiagonalCount++;
                }
            }
        }

        // 如果周围有对手的棋子，且没有相邻的对手棋子，可能是连接点
        if (opponentDiagonalCount > 0) {
            // 检查上下左右是否有对手棋子（如果有，则不是有效连接点）
            const adjacentDirections = [
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
            ];

            for (const dir of adjacentDirections) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;

                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                    if (gridState[ny][nx] === 1) { // 有相邻对手棋子
                        return false;
                    }
                }
            }

            return true; // 有对角线对手棋子，且没有相邻对手棋子
        }

        return false;
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