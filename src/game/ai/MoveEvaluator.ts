import { Board } from '../Board';
import { Piece } from '../Piece';
import { Player } from '../Player';
import { BoardAnalyzer } from './BoardAnalyzer';
import { PieceUtilities } from './PieceUtilities';

// 着法评估结果接口
export interface MoveEvaluation {
    piece: Piece;
    x: number;
    y: number;
    score: number;
    rotation: number;
    flip: number;
}

/**
 * 着法评估器 - 负责评估所有可能的着法，根据战略价值排序
 */
export class MoveEvaluator {
    private board: Board;
    private boardAnalyzer: BoardAnalyzer;
    private pieceUtilities: PieceUtilities;
    private boardSize: number;

    constructor(board: Board) {
        this.board = board;
        this.boardAnalyzer = new BoardAnalyzer(board);
        this.pieceUtilities = new PieceUtilities();

        // 确定棋盘大小
        const grid = board.getGrid();
        this.boardSize = grid.length;
    }

    /**
     * 评估第一步棋的着法
     */
    public evaluateFirstMove(
        piece: Piece,
        x: number,
        y: number,
        player: Player,
        opponentPlayer: Player
    ): number {
        // 第一步棋的特殊评估逻辑
        let score = 0;

        // 1. 棋盘控制与中心靠近程度
        const centerX = Math.floor(this.boardSize / 2);
        const centerY = Math.floor(this.boardSize / 2);

        // 计算到中心的距离
        const distanceToCenter = Math.max(
            Math.abs(x + Math.floor(piece.shape[0].length / 2) - centerX),
            Math.abs(y + Math.floor(piece.shape.length / 2) - centerY)
        );

        // 靠近中心加分
        score += Math.max(0, 10 - distanceToCenter) * 2;

        // 2. 大型棋子优先
        score += piece.getSize() * 3;

        // 3. 扩展性好的摆放方式加分
        const occupiedCells: Record<string, boolean> = {};
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;
                    occupiedCells[`${gridX},${gridY}`] = true;
                }
            }
        }

        // 计算扩展方向的多样性
        const expansionDirections = this.pieceUtilities.calculateExpansionDirections(
            piece, x, y, occupiedCells, this.boardSize
        );
        score += expansionDirections * 5;

        return score;
    }

    /**
     * 评估一般着法
     */
    public evaluateMove(
        piece: Piece,
        x: number,
        y: number,
        player: Player,
        opponentPlayer: Player,
        gameProgress: number
    ): number {
        let score = 0;

        // 创建棋子占据格子的映射
        const occupiedCells: Record<string, boolean> = {};
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;
                    occupiedCells[`${gridX},${gridY}`] = true;
                }
            }
        }

        // 1. 棋子大小 - 优先使用大棋子
        const pieceSize = piece.getSize();
        score += pieceSize * 2;

        // 2. 位置价值 - 评估每个位置的竞争程度
        let totalCompetition = 0;
        let competitivePositions = 0;

        for (const cellKey of Object.keys(occupiedCells)) {
            const [cellX, cellY] = cellKey.split(',').map(Number);
            const competitionScore = this.boardAnalyzer.evaluateAreaCompetition(
                cellX, cellY, player, opponentPlayer
            );

            totalCompetition += competitionScore;
            if (competitionScore >= 8) {
                competitivePositions++;
            }
        }

        // 计算平均竞争分数，并根据游戏阶段调整权重
        const avgCompetition = totalCompetition / pieceSize;
        const competitionWeight = gameProgress < 0.4 ? 3.0 :
            gameProgress < 0.7 ? 2.0 : 1.0;

        score += avgCompetition * competitionWeight;

        // 加分：如果棋子放在高竞争区域
        if (competitivePositions / pieceSize > 0.6) {
            score += 10;
        }

        // 单格棋子特殊处理
        if (pieceSize === 1) {
            // 单格棋子优先放在竞争区域，惩罚放在孤立区域
            if (avgCompetition < 5) {
                score -= 15; // 严重惩罚放在孤立区域
            } else if (avgCompetition >= 8) {
                score += 20; // 奖励放在高竞争区域
            }
        }

        // 3. 扩展性分数
        const expansionDirections = this.pieceUtilities.calculateExpansionDirections(
            piece, x, y, occupiedCells, this.boardSize
        );

        // 扩展性权重随游戏进程变化
        const expansionWeight = gameProgress < 0.5 ? 5 : 3;
        score += expansionDirections * expansionWeight;

        // 4. 远离棋盘边缘的奖励（早期阶段）
        if (gameProgress < 0.3) {
            const edgeProximity = this.pieceUtilities.calculateEdgeProximity(piece, x, y, this.boardSize);
            // 早期远离边缘更好
            score -= edgeProximity * 2;
        }

        // 5. 威胁分析 - 堵住对手连接点
        const opponentConnectionPoints = this.boardAnalyzer.findOpponentConnectionPoints(opponentPlayer);

        // 检查是否阻止了对手的连接点
        for (const point of opponentConnectionPoints) {
            if (occupiedCells[`${point.x},${point.y}`]) {
                score += 15; // 堵住对手连接点加分
            }
        }

        return score;
    }

    /**
     * 评估防御着法
     */
    public evaluateDefensiveMove(
        piece: Piece,
        x: number,
        y: number,
        player: Player,
        opponentPlayer: Player
    ): number {
        let score = 0;

        // 创建棋子占据格子的映射
        const occupiedCells: Record<string, boolean> = {};
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;
                    occupiedCells[`${gridX},${gridY}`] = true;
                }
            }
        }

        // 1. 阻止对手连接点
        const opponentConnectionPoints = this.boardAnalyzer.findOpponentConnectionPoints(opponentPlayer);
        let blockedConnectionPoints = 0;

        for (const point of opponentConnectionPoints) {
            if (occupiedCells[`${point.x},${point.y}`]) {
                blockedConnectionPoints++;
            }
        }

        // 阻止的连接点越多，分数越高
        score += blockedConnectionPoints * 25;

        // 2. 占据战略位置
        const heatMap = this.boardAnalyzer.generateBoardHeatMap(player, opponentPlayer);
        let totalHeatValue = 0;

        for (const cellKey of Object.keys(occupiedCells)) {
            const [cellX, cellY] = cellKey.split(',').map(Number);
            totalHeatValue += heatMap[cellY][cellX];
        }

        // 热图值越高，位置越重要
        score += totalHeatValue;

        return score;
    }

    /**
     * 检查此着法能否切断对手连接
     */
    public canBlockOpponentConnections(
        piece: Piece,
        x: number,
        y: number,
        player: Player,
        opponentPlayer: Player
    ): boolean {
        // 找到所有对手连接点
        const opponentConnectionPoints = this.boardAnalyzer.findOpponentConnectionPoints(opponentPlayer);

        // 计算棋子将占据的格子
        const occupiedCells: Record<string, boolean> = {};
        for (let rowIndex = 0; rowIndex < piece.shape.length; rowIndex++) {
            for (let colIndex = 0; colIndex < piece.shape[0].length; colIndex++) {
                if (piece.shape[rowIndex][colIndex]) {
                    const gridX = x + colIndex;
                    const gridY = y + rowIndex;
                    occupiedCells[`${gridX},${gridY}`] = true;
                }
            }
        }

        // 检查是否占据了任何对手连接点
        for (const point of opponentConnectionPoints) {
            if (occupiedCells[`${point.x},${point.y}`]) {
                return true;
            }
        }

        return false;
    }

    /**
     * 寻找防御性着法
     */
    public findDefensiveMoves(
        aiPlayer: Player,
        humanPlayer: Player,
        gameProgress: number
    ): MoveEvaluation[] {
        const defensiveMoves: MoveEvaluation[] = [];
        const aiPlayerId = 2; // 假设AI的ID为2

        // 评估所有可能的着法作为防御
        for (const originalPiece of aiPlayer.getAvailablePieces()) {
            const basePiece = this.pieceUtilities.clonePiece(originalPiece);

            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    const pieceCopy = this.pieceUtilities.clonePiece(basePiece);

                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 检查是否可以阻止对手的关键连接点
                    for (let y = 0; y < this.boardSize; y++) {
                        for (let x = 0; x < this.boardSize; x++) {
                            if (this.board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                // 检查此着法是否能阻断对手连接
                                const canBlock = this.canBlockOpponentConnections(
                                    pieceCopy, x, y, aiPlayer, humanPlayer
                                );

                                if (canBlock) {
                                    // 评估防御价值
                                    const defensiveScore = this.evaluateDefensiveMove(
                                        pieceCopy, x, y, aiPlayer, humanPlayer
                                    );

                                    defensiveMoves.push({
                                        piece: originalPiece,
                                        x,
                                        y,
                                        rotation,
                                        flip,
                                        score: defensiveScore
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // 按防御价值排序
        defensiveMoves.sort((a, b) => b.score - a.score);

        return defensiveMoves;
    }

    /**
     * 后备方案 - 当没有找到理想着法时
     */
    public findFallbackMove(aiPlayer: Player): { piece: Piece, x: number, y: number } | null {
        console.log("Using fallback move strategy");
        const aiPlayerId = 2; // 假设AI的ID为2

        // 尝试放置最小的棋子
        const smallestPieces = [...aiPlayer.getAvailablePieces()].sort((a, b) => {
            const sizeA = this.pieceUtilities.getPieceSize(a);
            const sizeB = this.pieceUtilities.getPieceSize(b);
            return sizeA - sizeB;
        });

        for (const originalPiece of smallestPieces) {
            const basePiece = this.pieceUtilities.clonePiece(originalPiece);

            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    const pieceCopy = this.pieceUtilities.clonePiece(basePiece);

                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 尝试找到任何有效位置
                    for (let y = 0; y < this.boardSize; y++) {
                        for (let x = 0; x < this.boardSize; x++) {
                            if (this.board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                // 获取对应的实际棋子（不是副本）
                                const piece = aiPlayer.getPiece(originalPiece.id);
                                if (!piece) continue;

                                // 重置棋子的变形状态
                                this.pieceUtilities.resetPieceOrientation(piece);

                                // 应用最佳的旋转和翻转
                                for (let r = 0; r < rotation; r++) {
                                    piece.rotate();
                                }

                                if (flip === 1) {
                                    piece.flip();
                                }

                                return {
                                    piece,
                                    x,
                                    y
                                };
                            }
                        }
                    }
                }
            }
        }

        return null; // 如果找不到任何有效着法
    }

    /**
     * 计算游戏进度（0-1之间的值）
     */
    public calculateGameProgress(): number {
        const grid = this.board.getGrid();
        const totalCells = this.boardSize * this.boardSize;

        // 计数棋盘上已经放置的棋子数量
        let placedCellsCount = 0;
        for (const row of grid) {
            for (const cell of row) {
                if (cell !== 0) {
                    placedCellsCount++;
                }
            }
        }

        // 返回一个0-1之间的值表示游戏进度
        return Math.min(1, placedCellsCount / (totalCells * 0.6));
    }
} 