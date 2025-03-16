import { Player } from './Player';
import { Piece } from './Piece';
import { Board } from './Board';
import { BoardAnalyzer } from './BoardAnalyzer';
import { MoveEvaluator } from './MoveEvaluator';
import { PieceUtilities } from './PieceUtilities';

interface MoveEvaluation {
    piece: Piece;
    x: number;
    y: number;
    score: number;
    rotation: number;
    flip: number;
}

export class AIPlayer extends Player {
    private boardAnalyzer: BoardAnalyzer | null = null;
    private moveEvaluator: MoveEvaluator | null = null;
    private pieceUtilities: PieceUtilities | null = null;

    constructor(name: string, color: string, pieces: Piece[]) {
        super(name, color, pieces);
        this.pieceUtilities = new PieceUtilities();
    }

    /**
     * 初始化分析器和评估器
     * 在使用board前调用这个方法
     */
    private initializeTools(board: Board): void {
        if (!this.boardAnalyzer) {
            this.boardAnalyzer = new BoardAnalyzer(board);
        }

        if (!this.moveEvaluator) {
            this.moveEvaluator = new MoveEvaluator(board);
        }
    }

    // Method to decide the AI's move
    public makeMove(board: Board): { piece: Piece, x: number, y: number } | null {
        // 初始化工具
        this.initializeTools(board);

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
        if (!this.moveEvaluator) {
            throw new Error("MoveEvaluator not initialized");
        }

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

        // 假设对手是人类玩家
        const humanPlayer = new Player("Human", "blue", []);

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
            const basePiece = this.pieceUtilities!.clonePiece(originalPiece);

            // 尝试不同的旋转和翻转
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // 创建当前旋转和翻转的副本
                    const pieceCopy = this.pieceUtilities!.clonePiece(basePiece);

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
                                        const score = this.moveEvaluator.evaluateFirstMove(
                                            pieceCopy, x, y, this, humanPlayer
                                        );

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

        // 如果没有找到有效放置，返回null
        if (firstMoveCandidates.length === 0) {
            return null;
        }

        // 按得分排序，选择最高分
        firstMoveCandidates.sort((a, b) => b.score - a.score);
        const bestCandidate = firstMoveCandidates[0];

        // 将原始棋子旋转和翻转到最佳状态
        const piece = this.getPiece(bestCandidate.piece.id);
        if (!piece) return null;

        // 重置棋子的变形状态 - 由于Piece没有resetOrientation方法，我们手动实现
        this.resetPieceOrientation(piece);

        // 应用最佳的旋转和翻转
        for (let r = 0; r < bestCandidate.rotation; r++) {
            piece.rotate();
        }

        if (bestCandidate.flip === 1) {
            piece.flip();
        }

        return {
            piece,
            x: bestCandidate.x,
            y: bestCandidate.y
        };
    }

    // 寻找棋盘上的空白区域
    private findEmptyRegions(board: Board): { x: number, y: number, width: number, height: number, expansionPotential: number }[] {
        const grid = board.getGrid();
        const boardSize = grid.length;
        const regions: { x: number, y: number, width: number, height: number, expansionPotential: number }[] = [];
        const visited = Array(boardSize).fill(0).map(() => Array(boardSize).fill(false));

        // 寻找所有空白区域，包括1x2的小区域
        for (let y = 0; y < boardSize - 1; y++) {
            for (let x = 0; x < boardSize - 1; x++) {
                // 跳过已经访问过的单元格
                if (visited[y][x]) continue;

                // 检查是否是空白单元格
                if (grid[y][x] === 0) {
                    // 尝试找到最大的矩形空白区域
                    let maxWidth = 1;
                    let maxHeight = 1;

                    // 向右扩展
                    while (x + maxWidth < boardSize && grid[y][x + maxWidth] === 0) {
                        maxWidth++;
                    }

                    // 向下扩展
                    while (y + maxHeight < boardSize) {
                        let canExpand = true;
                        for (let i = 0; i < maxWidth; i++) {
                            if (x + i >= boardSize || grid[y + maxHeight][x + i] !== 0) {
                                canExpand = false;
                                break;
                            }
                        }
                        if (canExpand) {
                            maxHeight++;
                        } else {
                            break;
                        }
                    }

                    // 标记此区域为已访问
                    for (let j = 0; j < maxHeight; j++) {
                        for (let i = 0; i < maxWidth; i++) {
                            visited[y + j][x + i] = true;
                        }
                    }

                    // 只记录1x2及以上的区域（增加了对1x2和2x1区域的检测）
                    if ((maxWidth >= 2 && maxHeight >= 1) || (maxWidth >= 1 && maxHeight >= 2)) {
                        // 计算这个区域的扩展潜力
                        const expansionPotential = this.calculateExpansionPotential(grid, x, y, maxWidth, maxHeight, boardSize);

                        // 计算区域的面积
                        const area = maxWidth * maxHeight;

                        regions.push({
                            x,
                            y,
                            width: maxWidth,
                            height: maxHeight,
                            expansionPotential
                        });
                    }
                }
            }
        }

        // 增加对大面积区域的偏好，但保留小区域的价值
        regions.sort((a, b) => {
            // 计算综合评分
            const areaA = a.width * a.height;
            const areaB = b.width * b.height;

            // 大区域获得额外奖励
            const largeAreaBonusA = areaA > 25 ? 20 : (areaA > 16 ? 15 : (areaA > 9 ? 10 : 0));
            const largeAreaBonusB = areaB > 25 ? 20 : (areaB > 16 ? 15 : (areaB > 9 ? 10 : 0));

            const scoreA = areaA + a.expansionPotential * 2 + largeAreaBonusA;
            const scoreB = areaB + b.expansionPotential * 2 + largeAreaBonusB;

            return scoreB - scoreA;
        });

        return regions;
    }

    // 计算区域的扩展潜力 - 评估周围有多少可以扩展的空间
    private calculateExpansionPotential(grid: number[][], x: number, y: number, width: number, height: number, boardSize: number): number {
        let potential = 0;
        const directions = [
            { dx: -1, dy: 0 },  // 左
            { dx: 1, dy: 0 },   // 右
            { dx: 0, dy: -1 },  // 上
            { dx: 0, dy: 1 }    // 下
        ];

        // 检查区域周围的每个方向
        for (const dir of directions) {
            // 检查这个方向上的扩展潜力
            if (dir.dx < 0) { // 左侧
                for (let j = 0; j < height; j++) {
                    let expandCount = 0;
                    let nx = x - 1;
                    while (nx >= 0 && grid[y + j][nx] === 0) {
                        expandCount++;
                        nx--;
                    }
                    potential += expandCount;
                }
            } else if (dir.dx > 0) { // 右侧
                for (let j = 0; j < height; j++) {
                    let expandCount = 0;
                    let nx = x + width;
                    while (nx < boardSize && grid[y + j][nx] === 0) {
                        expandCount++;
                        nx++;
                    }
                    potential += expandCount;
                }
            } else if (dir.dy < 0) { // 上方
                for (let i = 0; i < width; i++) {
                    let expandCount = 0;
                    let ny = y - 1;
                    while (ny >= 0 && grid[ny][x + i] === 0) {
                        expandCount++;
                        ny--;
                    }
                    potential += expandCount;
                }
            } else if (dir.dy > 0) { // 下方
                for (let i = 0; i < width; i++) {
                    let expandCount = 0;
                    let ny = y + height;
                    while (ny < boardSize && grid[ny][x + i] === 0) {
                        expandCount++;
                        ny++;
                    }
                    potential += expandCount;
                }
            }
        }

        // 分析该区域是否靠近棋盘边缘
        const isNearLeftEdge = x <= 2;
        const isNearRightEdge = x + width >= boardSize - 2;
        const isNearTopEdge = y <= 2;
        const isNearBottomEdge = y + height >= boardSize - 2;

        // 为远离边缘的区域增加额外分数，鼓励AI向棋盘中心和空白区域发展
        if (!isNearLeftEdge && !isNearRightEdge && !isNearTopEdge && !isNearBottomEdge) {
            potential += 10;
        }

        // 检测该区域是否位于棋盘左侧
        if (x < boardSize / 2) {
            // 给左侧区域额外的扩展分数
            potential += width * height / 4;
        }

        return potential;
    }

    // 获取棋子的大小（格子数量）
    private getPieceSize(piece: Piece): number {
        let count = 0;
        for (const row of piece.shape) {
            for (const cell of row) {
                if (cell) {
                    count++;
                }
            }
        }
        return count;
    }

    // 寻找防御性着法
    private findDefensiveMoves(
        board: Board,
        aiPlayerId: number,
        gameProgress: number,
        humanPlayer: Player
    ): MoveEvaluation[] {
        if (!this.moveEvaluator) {
            throw new Error("MoveEvaluator not initialized");
        }

        const boardSize = 14;
        const defensiveMoves: MoveEvaluation[] = [];

        // 评估所有可能的着法作为防御
        for (const originalPiece of this.availablePieces) {
            const basePiece = this.pieceUtilities!.clonePiece(originalPiece);

            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    const pieceCopy = this.pieceUtilities!.clonePiece(basePiece);

                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 检查是否可以阻止对手的关键连接点
                    for (let y = 0; y < boardSize; y++) {
                        for (let x = 0; x < boardSize; x++) {
                            if (board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                // 检查此着法是否能阻断对手连接
                                const canBlock = this.moveEvaluator.canBlockOpponentConnections(
                                    pieceCopy, x, y, this, humanPlayer
                                );

                                if (canBlock) {
                                    // 评估防御价值
                                    const defensiveScore = this.moveEvaluator.evaluateDefensiveMove(
                                        pieceCopy, x, y, this, humanPlayer
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

    // 后备方案 - 当没有找到理想着法时
    private findFallbackMove(board: Board, aiPlayerId: number): { piece: Piece, x: number, y: number } | null {
        console.log("Using fallback move strategy");
        const boardSize = 14;

        // 尝试放置最小的棋子
        const smallestPieces = [...this.availablePieces].sort((a, b) => {
            const sizeA = this.getPieceSize(a);
            const sizeB = this.getPieceSize(b);
            return sizeA - sizeB;
        });

        for (const originalPiece of smallestPieces) {
            const basePiece = this.pieceUtilities!.clonePiece(originalPiece);

            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    const pieceCopy = this.pieceUtilities!.clonePiece(basePiece);

                    for (let r = 0; r < rotation; r++) {
                        pieceCopy.rotate();
                    }

                    if (flip === 1) {
                        pieceCopy.flip();
                    }

                    // 尝试找到任何有效位置
                    for (let y = 0; y < boardSize; y++) {
                        for (let x = 0; x < boardSize; x++) {
                            if (board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                const piece = this.getPiece(originalPiece.id);
                                if (!piece) continue;

                                // 重置棋子的变形状态 - 由于Piece没有resetOrientation方法，我们手动实现
                                this.resetPieceOrientation(piece);

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

    // 计数棋盘上已经放置的棋子数量
    private countPlacedCells(grid: number[][]): number {
        let count = 0;
        for (const row of grid) {
            for (const cell of row) {
                if (cell !== 0) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * 检查当前是否是第一步棋
     */
    private isFirstMove(board: Board): boolean {
        const grid = board.getGrid();

        // 检查AI玩家是否已经放置过棋子（假设AI玩家ID为2）
        for (const row of grid) {
            for (const cell of row) {
                if (cell === 2) {
                    return false; // 找到了AI放置的棋子，不是第一步
                }
            }
        }

        return true; // 没有找到AI放置的棋子，是第一步
    }

    /**
     * 重置棋子到原始状态
     * 由于Piece类没有resetOrientation方法，我们在这里实现
     */
    private resetPieceOrientation(piece: Piece): void {
        // 策略：创建一个新的棋子副本，然后用它的形状替换原来的
        const originalShape = this.getPieceOriginalShape(piece.id);
        if (originalShape) {
            // 直接替换形状
            piece.shape = originalShape;
        } else {
            // 如果找不到原始形状，可以旋转4次回到原始状态
            // (4次90度旋转等于360度，回到原始状态)
            for (let i = 0; i < 4; i++) {
                piece.rotate();
            }
        }
    }

    /**
     * 获取棋子的原始形状
     */
    private getPieceOriginalShape(pieceId: number): boolean[][] | null {
        // 在实际应用中，这里可能需要一个映射或其他机制来存储和获取原始形状
        // 这里简单起见，我们可以从一个新的副本中获取
        const originalPiece = this.availablePieces.find(p => p.id === pieceId);
        if (!originalPiece) return null;

        // 注意：这里假设availablePieces中的棋子没有被旋转或翻转过
        // 如果已经被修改，这种方法就不可靠了
        const clonedShape = originalPiece.shape.map(row => [...row]);
        return clonedShape;
    }

    // 克隆棋子 - 使用PieceUtilities替代
    private clonePiece(piece: Piece): Piece {
        if (this.pieceUtilities) {
            return this.pieceUtilities.clonePiece(piece);
        }
        return piece.clone();
    }

    // 不是第一步棋，找到最佳放置位置
    private findBestMove(board: Board, aiPlayerId: number): { piece: Piece, x: number, y: number } | null {
        if (!this.moveEvaluator || !this.boardAnalyzer) {
            throw new Error("Analysis tools not initialized");
        }

        const boardSize = 14;
        const grid = board.getGrid();

        // 计算游戏进程 (0-1范围), 用于调整策略
        const placedCellsCount = this.countPlacedCells(grid);
        const totalCells = boardSize * boardSize;
        const gameProgress = Math.min(1, placedCellsCount / (totalCells * 0.6));

        // 创建评分列表存储所有可能的放置方案
        const moveCandidates: MoveEvaluation[] = [];

        // 创建用于防御评估的人类玩家对象
        const humanPlayer = new Player("Human", "blue", []);

        // 首先检查是否有特别有价值的防御性着法
        // 例如，阻止对手的连接点或关键扩展路径
        const defensiveMoves = this.findDefensiveMoves(board, aiPlayerId, gameProgress, humanPlayer);

        // 如果找到高价值的防御性着法，直接使用
        // 但要确保不会过早使用小棋子，特别是单格棋子
        if (defensiveMoves.length > 0 && defensiveMoves[0].score > 50) {
            const bestDefense = defensiveMoves[0];
            const piece = this.getPiece(bestDefense.piece.id);
            if (!piece) return null;

            // 获取棋子大小
            const pieceSize = this.getPieceSize(piece);

            // 如果是单格棋子，且游戏进程不到50%，降低其优先级
            // 除非防御得分非常高（超过80）
            if (pieceSize === 1 && gameProgress < 0.5 && bestDefense.score < 80) {
                console.log("避免过早使用单格棋子进行防御");
                // 不使用这个防御着法，继续评估其他着法
            } else {
                // 重置棋子的变形状态
                this.resetPieceOrientation(piece);

                // 应用最佳的旋转和翻转
                for (let r = 0; r < bestDefense.rotation; r++) {
                    piece.rotate();
                }

                if (bestDefense.flip === 1) {
                    piece.flip();
                }

                return {
                    piece,
                    x: bestDefense.x,
                    y: bestDefense.y
                };
            }
        }

        // 寻找棋盘上的空白区域
        const emptyRegions = this.findEmptyRegions(board);

        // 分析棋盘左右两侧的空间分布
        const leftSideEmptyCount = this.countEmptyCellsInRegion(grid, 0, 0, Math.floor(boardSize / 2), boardSize);
        const rightSideEmptyCount = this.countEmptyCellsInRegion(grid, Math.floor(boardSize / 2), 0, boardSize, boardSize);

        // 如果左侧空间明显多于右侧，增加对左侧区域的偏好
        const favorLeftSide = leftSideEmptyCount > rightSideEmptyCount * 1.5;

        // 首先找出所有可能的放置候选项
        const placementCandidates: Array<{
            piece: Piece,
            region: { x: number, y: number, width: number, height: number, expansionPotential: number },
            sizeMatch: number,
            pieceSize: number,
            rotation: number,
            flip: number
        }> = [];

        // 为每个区域找到最适合的棋子
        for (const region of emptyRegions) {
            const regionArea = region.width * region.height;

            // 按照棋子大小排序，优先考虑大棋子但要确保能放入该区域
            const sortedPieces = [...this.availablePieces].sort((a, b) => {
                const sizeA = this.getPieceSize(a);
                const sizeB = this.getPieceSize(b);
                return sizeB - sizeA; // 大的优先
            });

            // 检查每个棋子是否适合这个区域
            for (const originalPiece of sortedPieces) {
                const pieceSize = this.getPieceSize(originalPiece);

                // 跳过显然太大而无法放入该区域的棋子
                if (pieceSize > regionArea) continue;

                // 单格棋子只考虑用于1x1区域，除非已进入游戏后期
                if (pieceSize === 1 && regionArea > 1 && gameProgress < 0.7) {
                    if (Math.random() > 0.05) {  // 95%的可能性跳过
                        continue;
                    }
                }

                // 拷贝棋子以进行变换
                const basePiece = this.pieceUtilities!.clonePiece(originalPiece);

                for (let rotation = 0; rotation < 4; rotation++) {
                    for (let flip = 0; flip < 2; flip++) {
                        const pieceCopy = this.pieceUtilities!.clonePiece(basePiece);

                        // 应用旋转
                        for (let r = 0; r < rotation; r++) {
                            pieceCopy.rotate();
                        }

                        // 应用翻转
                        if (flip === 1) {
                            pieceCopy.flip();
                        }

                        // 检查棋子形状是否适合该区域
                        if (pieceCopy.shape[0].length <= region.width && pieceCopy.shape.length <= region.height) {
                            // 验证放置是否有效
                            if (board.isValidPlacement(pieceCopy, region.x, region.y, aiPlayerId)) {
                                // 计算棋子与区域的匹配度 (0-1之间的值，越接近1表示越匹配)
                                const sizeMatch = pieceSize / regionArea;

                                // 添加到候选列表
                                placementCandidates.push({
                                    piece: originalPiece,
                                    region,
                                    sizeMatch,
                                    pieceSize,
                                    rotation,
                                    flip
                                });
                            }
                        }
                    }
                }
            }
        }

        // 对放置候选项进行排序，优先考虑更好的尺寸匹配度和更大的棋子
        placementCandidates.sort((a, b) => {
            // 对于小区域(1x2, 2x1等)，优先使用匹配尺寸的棋子
            if (a.region.width * a.region.height <= 2 && b.region.width * b.region.height <= 2) {
                // 如果都是小区域，优先使用尺寸匹配更好的
                return b.sizeMatch - a.sizeMatch;
            }

            // 对于大区域，优先使用更大的棋子
            return b.pieceSize - a.pieceSize;
        });

        // 使用最佳的前10个候选或所有候选（取较小值）
        const topCandidates = placementCandidates.slice(0, Math.min(10, placementCandidates.length));

        // 评估筛选出的候选放置
        for (const candidate of topCandidates) {
            const originalPiece = candidate.piece;
            const region = candidate.region;
            const rotation = candidate.rotation;
            const flip = candidate.flip;
            const pieceSize = candidate.pieceSize;

            // 重新创建棋子副本并应用变换
            const basePiece = this.pieceUtilities!.clonePiece(originalPiece);
            const pieceCopy = this.pieceUtilities!.clonePiece(basePiece);

            // 应用旋转
            for (let r = 0; r < rotation; r++) {
                pieceCopy.rotate();
            }

            // 应用翻转
            if (flip === 1) {
                pieceCopy.flip();
            }

            // 验证放置是否有效
            if (board.isValidPlacement(pieceCopy, region.x, region.y, aiPlayerId)) {
                // 评估这个着法
                let score = this.moveEvaluator.evaluateMove(
                    pieceCopy, region.x, region.y, this, humanPlayer, gameProgress
                );

                // 给予空白区域放置额外奖励，考虑扩展潜力
                const expansionBonus = Math.min(30, region.expansionPotential * 2);
                score += 20 + expansionBonus;

                // 根据棋子大小调整得分
                const sizeBonus = Math.log2(pieceSize) * 8; // 增加大棋子的奖励
                score += sizeBonus;

                // 如果左侧空间明显多于右侧，偏好左侧放置
                if (favorLeftSide && region.x < Math.floor(boardSize / 2)) {
                    score += 15; // 给左侧位置额外分数
                }

                // 为尺寸匹配良好的棋子提供额外奖励
                // 对于小区域，高度重视尺寸匹配
                if (region.width * region.height <= 2) {
                    // 小区域中的尺寸匹配非常重要，给予显著加分
                    if (candidate.sizeMatch > 0.9) {  // 如果匹配度超过90%
                        score += 50;  // 显著提高分数
                    } else if (candidate.sizeMatch > 0.7) {  // 如果匹配度超过70%
                        score += 30;
                    }
                } else {
                    // 对于较大区域，尺寸匹配仍然重要但不那么关键
                    score += candidate.sizeMatch * 20;
                }

                // 单格棋子在游戏早期和中期额外惩罚，除非是放在1x1区域
                if (pieceSize === 1 && gameProgress < 0.7) {
                    if (region.width * region.height == 1) {
                        // 如果是放在1x1区域，稍微减少惩罚
                        score -= 10;
                    } else {
                        // 否则显著降低单格棋子的得分
                        score -= 30;
                    }
                }

                // 添加到候选列表
                moveCandidates.push({
                    piece: originalPiece,
                    x: region.x,
                    y: region.y,
                    rotation,
                    flip,
                    score
                });
            }
        }

        // 如果没有找到区域放置候选，则尝试常规的棋盘扫描
        if (moveCandidates.length === 0) {
            // 按照棋子大小排序，优先考虑大棋子
            const sortedPieces = [...this.availablePieces].sort((a, b) => {
                const sizeA = this.getPieceSize(a);
                const sizeB = this.getPieceSize(b);
                return sizeB - sizeA; // 大的优先
            });

            // 如果没有紧急的防御需求，评估所有可能的着法
            for (const originalPiece of sortedPieces) {
                // 获取棋子大小
                const pieceSize = this.getPieceSize(originalPiece);

                // 如果是单格棋子，且游戏进程不到70%，大幅降低其优先级
                if (pieceSize === 1 && gameProgress < 0.7) {
                    // 在游戏早期和中期，几乎不使用单格棋子
                    if (Math.random() > 0.1) {
                        continue; // 90%的概率跳过单格棋子
                    }
                }

                // 拷贝棋子以进行变换
                const basePiece = this.pieceUtilities!.clonePiece(originalPiece);

                // 尝试所有旋转和翻转组合
                for (let rotation = 0; rotation < 4; rotation++) {
                    for (let flip = 0; flip < 2; flip++) {
                        // 创建当前旋转和翻转的副本
                        const pieceCopy = this.pieceUtilities!.clonePiece(basePiece);

                        // 应用旋转和翻转
                        for (let r = 0; r < rotation; r++) {
                            pieceCopy.rotate();
                        }

                        if (flip === 1) {
                            pieceCopy.flip();
                        }

                        // 遍历棋盘寻找可能的放置位置
                        for (let y = 0; y < boardSize; y++) {
                            for (let x = 0; x < boardSize; x++) {
                                // 验证放置是否有效
                                if (board.isValidPlacement(pieceCopy, x, y, aiPlayerId)) {
                                    // 评估这个着法
                                    let score = this.moveEvaluator.evaluateMove(
                                        pieceCopy, x, y, this, humanPlayer, gameProgress
                                    );

                                    // 根据棋子大小调整得分
                                    // 大棋子得分提升，小棋子得分降低
                                    const sizeBonus = Math.log2(pieceSize) * 8; // 增加大棋子的奖励
                                    score += sizeBonus;

                                    // 如果左侧空间明显多于右侧，偏好左侧放置
                                    if (favorLeftSide && x < Math.floor(boardSize / 2)) {
                                        score += 15; // 给左侧位置额外分数
                                    }

                                    // 单格棋子在游戏早期和中期额外惩罚
                                    if (pieceSize === 1 && gameProgress < 0.7) {
                                        score -= 25; // 显著降低单格棋子的得分
                                    }

                                    // 添加到候选列表
                                    moveCandidates.push({
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

        // 如果没有找到有效着法，尝试用更宽松的标准重新搜索
        if (moveCandidates.length === 0) {
            return this.findFallbackMove(board, aiPlayerId);
        }

        // 按得分排序，选择最高分
        moveCandidates.sort((a, b) => b.score - a.score);

        // 记录评分最高的几个候选
        console.log("Top move candidates:", moveCandidates.slice(0, 3).map(c => {
            const piece = this.getPiece(c.piece.id);
            return {
                pieceId: c.piece.id,
                pieceSize: piece ? this.getPieceSize(piece) : 0,
                x: c.x,
                y: c.y,
                score: c.score
            };
        }));

        // 从前N个候选项中随机选择一个，增加游戏的多样性
        // 但是总是偏好最高分的
        const topN = Math.min(2, moveCandidates.length); // 减少随机性，只从前2个中选择
        const randomIndex = Math.floor(Math.random() * topN);
        const selectedCandidate = moveCandidates[randomIndex];

        const piece = this.getPiece(selectedCandidate.piece.id);
        if (!piece) return null;

        // 重置棋子的变形状态 - 由于Piece没有resetOrientation方法，我们手动实现
        this.resetPieceOrientation(piece);

        // 应用选定的旋转和翻转
        for (let r = 0; r < selectedCandidate.rotation; r++) {
            piece.rotate();
        }

        if (selectedCandidate.flip === 1) {
            piece.flip();
        }

        return {
            piece,
            x: selectedCandidate.x,
            y: selectedCandidate.y
        };
    }

    // 计算指定区域内的空白单元格数量
    private countEmptyCellsInRegion(grid: number[][], startX: number, startY: number, endX: number, endY: number): number {
        let count = 0;
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (grid[y][x] === 0) {
                    count++;
                }
            }
        }
        return count;
    }
} 