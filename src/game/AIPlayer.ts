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
        if (defensiveMoves.length > 0 && defensiveMoves[0].score > 50) {
            const bestDefense = defensiveMoves[0];
            const piece = this.getPiece(bestDefense.piece.id);
            if (!piece) return null;

            // 重置棋子的变形状态 - 由于Piece没有resetOrientation方法，我们手动实现
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

        // 如果没有紧急的防御需求，评估所有可能的着法
        for (const originalPiece of this.availablePieces) {
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
                                const score = this.moveEvaluator.evaluateMove(
                                    pieceCopy, x, y, this, humanPlayer, gameProgress
                                );

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

        // 如果没有找到有效着法，尝试用更宽松的标准重新搜索
        if (moveCandidates.length === 0) {
            return this.findFallbackMove(board, aiPlayerId);
        }

        // 按得分排序，选择最高分
        moveCandidates.sort((a, b) => b.score - a.score);

        // 从前N个候选项中随机选择一个，增加游戏的多样性
        // 但是总是偏好最高分的
        const topN = Math.min(3, moveCandidates.length);
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
            const sizeA = a.getSize();
            const sizeB = b.getSize();
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
} 