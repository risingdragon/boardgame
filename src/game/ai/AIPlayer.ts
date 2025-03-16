import { Player } from '../Player';
import { Piece } from '../Piece';
import { Board } from '../Board';
import { BoardAnalyzer } from './BoardAnalyzer';
import { MoveEvaluator, MoveEvaluation } from './MoveEvaluator';
import { PieceUtilities } from './PieceUtilities';
import { RegionAnalyzer } from './RegionAnalyzer';

export class AIPlayer extends Player {
    private boardAnalyzer: BoardAnalyzer | null = null;
    private moveEvaluator: MoveEvaluator | null = null;
    private pieceUtilities: PieceUtilities | null = null;
    private regionAnalyzer: RegionAnalyzer | null = null;

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

        if (!this.regionAnalyzer) {
            this.regionAnalyzer = new RegionAnalyzer(board);
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

        // 获取所有大小为5的棋子（优先考虑最大的棋子）
        const bigPieces = this.availablePieces.filter(piece => {
            const size = this.pieceUtilities!.getPieceSize(piece);
            return size === 5; // 只选择5方块的大棋子
        });

        // 如果没有大小为5的棋子，则回退到按大小排序的策略
        const piecesToUse = bigPieces.length > 0 ? bigPieces : [...this.availablePieces].sort((a, b) => {
            // 计算每个棋子的方块数量
            const countA = this.pieceUtilities!.getPieceSize(a);
            const countB = this.pieceUtilities!.getPieceSize(b);
            return countB - countA; // 大的优先
        });

        // 如果有多个大小为5的棋子，随机选择其中的几个增加开局变化
        let candidatePieces = piecesToUse;
        if (bigPieces.length > 1) {
            // 随机打乱5方块棋子的顺序
            const shuffledBigPieces = [...bigPieces].sort(() => Math.random() - 0.5);
            // 取前3个或全部（如果不足3个）
            candidatePieces = shuffledBigPieces.slice(0, Math.min(3, shuffledBigPieces.length));
        }

        // 为每个候选棋子生成所有可能的放置位置
        for (const originalPiece of candidatePieces) {
            // 创建基础副本
            const basePiece = this.pieceUtilities!.clonePiece(originalPiece);

            // 尝试不同的旋转和翻转
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // 创建当前旋转和翻转的副本
                    const pieceCopy = this.pieceUtilities!.getPieceWithTransformation(basePiece, rotation, flip);

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

        // 如果没有找到有效放置，尝试使用所有棋子
        if (firstMoveCandidates.length === 0 && candidatePieces.length < this.availablePieces.length) {
            // 尝试用所有棋子重新寻找第一步
            console.log("使用所有棋子尝试找到第一步放置");
            return this.findFirstMoveWithAllPieces(board, aiPlayerId);
        }

        // 如果没有找到有效放置，返回null
        if (firstMoveCandidates.length === 0) {
            return null;
        }

        // 按得分排序
        firstMoveCandidates.sort((a, b) => b.score - a.score);

        // 从前几个高分候选中随机选择一个，增加变化性
        const topCandidatesCount = Math.min(3, firstMoveCandidates.length);
        const selectedIndex = Math.floor(Math.random() * topCandidatesCount);
        const bestCandidate = firstMoveCandidates[selectedIndex];

        // 将原始棋子旋转和翻转到最佳状态
        const piece = this.getPiece(bestCandidate.piece.id);
        if (!piece) return null;

        // 重置棋子的变形状态
        this.pieceUtilities!.resetPieceOrientation(piece);

        // 应用最佳的旋转和翻转
        for (let r = 0; r < bestCandidate.rotation; r++) {
            piece.rotate();
        }

        if (bestCandidate.flip === 1) {
            piece.flip();
        }

        console.log(`AI 选择了棋子ID: ${piece.id}，大小为: ${this.pieceUtilities!.getPieceSize(piece)}，放置位置: (${bestCandidate.x}, ${bestCandidate.y})，旋转: ${bestCandidate.rotation}，翻转: ${bestCandidate.flip}`);

        return {
            piece,
            x: bestCandidate.x,
            y: bestCandidate.y
        };
    }

    // 使用所有棋子寻找第一步（备用方法）
    private findFirstMoveWithAllPieces(board: Board, aiPlayerId: number): { piece: Piece, x: number, y: number } | null {
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

        // 按照棋子大小排序
        const sortedPieces = [...this.availablePieces].sort((a, b) => {
            // 计算每个棋子的方块数量
            const countA = this.pieceUtilities!.getPieceSize(a);
            const countB = this.pieceUtilities!.getPieceSize(b);
            return countB - countA; // 大的优先
        });

        // 尝试放置排序后的棋子
        for (const originalPiece of sortedPieces) {
            // 创建基础副本
            const basePiece = this.pieceUtilities!.clonePiece(originalPiece);

            // 尝试不同的旋转和翻转
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // 创建当前旋转和翻转的副本
                    const pieceCopy = this.pieceUtilities!.getPieceWithTransformation(basePiece, rotation, flip);

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

        // 重置棋子的变形状态
        this.pieceUtilities!.resetPieceOrientation(piece);

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

    // 不是第一步棋，找到最佳放置位置
    private findBestMove(board: Board, aiPlayerId: number): { piece: Piece, x: number, y: number } | null {
        if (!this.moveEvaluator || !this.boardAnalyzer || !this.regionAnalyzer) {
            throw new Error("Analysis tools not initialized");
        }

        const boardSize = 14;
        const grid = board.getGrid();

        // 计算游戏进程 (0-1范围), 用于调整策略
        const gameProgress = this.moveEvaluator.calculateGameProgress();

        // 创建评分列表存储所有可能的放置方案
        const moveCandidates: MoveEvaluation[] = [];

        // 创建用于防御评估的人类玩家对象
        const humanPlayer = new Player("Human", "blue", []);

        // 首先检查是否有特别有价值的防御性着法
        // 例如，阻止对手的连接点或关键扩展路径
        const defensiveMoves = this.moveEvaluator.findDefensiveMoves(this, humanPlayer, gameProgress);

        // 如果找到高价值的防御性着法，直接使用
        // 但要确保不会过早使用小棋子，特别是单格棋子
        if (defensiveMoves.length > 0 && defensiveMoves[0].score > 50) {
            const bestDefense = defensiveMoves[0];
            const piece = this.getPiece(bestDefense.piece.id);
            if (!piece) return null;

            // 获取棋子大小
            const pieceSize = this.pieceUtilities!.getPieceSize(piece);

            // 如果是单格棋子，且游戏进程不到50%，降低其优先级
            // 除非防御得分非常高（超过80）
            if (pieceSize === 1 && gameProgress < 0.5 && bestDefense.score < 80) {
                console.log("避免过早使用单格棋子进行防御");
                // 不使用这个防御着法，继续评估其他着法
            } else {
                // 重置棋子的变形状态
                this.pieceUtilities!.resetPieceOrientation(piece);

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
        const emptyRegions = this.regionAnalyzer.findEmptyRegions();

        // 分析棋盘左右两侧的空间分布
        const leftSideEmptyCount = this.regionAnalyzer.countEmptyCellsInRegion(0, 0, Math.floor(boardSize / 2), boardSize);
        const rightSideEmptyCount = this.regionAnalyzer.countEmptyCellsInRegion(Math.floor(boardSize / 2), 0, boardSize, boardSize);

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
                const sizeA = this.pieceUtilities!.getPieceSize(a);
                const sizeB = this.pieceUtilities!.getPieceSize(b);
                return sizeB - sizeA; // 大的优先
            });

            // 检查每个棋子是否适合这个区域
            for (const originalPiece of sortedPieces) {
                const pieceSize = this.pieceUtilities!.getPieceSize(originalPiece);

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
                        const pieceCopy = this.pieceUtilities!.getPieceWithTransformation(basePiece, rotation, flip);

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
            const pieceCopy = this.pieceUtilities!.getPieceWithTransformation(originalPiece, rotation, flip);

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
                const sizeA = this.pieceUtilities!.getPieceSize(a);
                const sizeB = this.pieceUtilities!.getPieceSize(b);
                return sizeB - sizeA; // 大的优先
            });

            // 如果没有紧急的防御需求，评估所有可能的着法
            for (const originalPiece of sortedPieces) {
                // 获取棋子大小
                const pieceSize = this.pieceUtilities!.getPieceSize(originalPiece);

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
                        const pieceCopy = this.pieceUtilities!.getPieceWithTransformation(basePiece, rotation, flip);

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
            return this.moveEvaluator.findFallbackMove(this);
        }

        // 按得分排序，选择最高分
        moveCandidates.sort((a, b) => b.score - a.score);

        // 记录评分最高的几个候选
        console.log("Top move candidates:", moveCandidates.slice(0, 3).map(c => {
            const piece = this.getPiece(c.piece.id);
            return {
                pieceId: c.piece.id,
                pieceSize: piece ? this.pieceUtilities!.getPieceSize(piece) : 0,
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

        // 重置棋子的变形状态
        this.pieceUtilities!.resetPieceOrientation(piece);

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
} 