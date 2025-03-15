import { Player } from './Player';
import { Piece } from './Piece';
import { Board } from './Board';

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

        // 如果是第一步棋，优先尝试在起始位置放置
        if (isFirstMove) {
            // 获取棋盘上的起始位置坐标(9, 9)
            const startX = 9;
            const startY = 9;

            // 尝试在起始位置放置一个棋子
            for (const piece of this.availablePieces) {
                // 尝试不同的旋转和翻转
                for (let rotation = 0; rotation < 4; rotation++) {
                    for (let flip = 0; flip < 2; flip++) {
                        // 遍历不同的放置方式，使得棋子能覆盖起始位置
                        for (let offsetY = 0; offsetY < piece.shape.length; offsetY++) {
                            for (let offsetX = 0; offsetX < piece.shape[0].length; offsetX++) {
                                if (piece.shape[offsetY][offsetX]) {
                                    const x = startX - offsetX;
                                    const y = startY - offsetY;

                                    // 检查是否可以放置
                                    if (x >= 0 && y >= 0 &&
                                        x + piece.shape[0].length <= 14 &&
                                        y + piece.shape.length <= 14) {
                                        if (board.isValidPlacement(piece, x, y, aiPlayerId)) {
                                            return { piece, x, y };
                                        }
                                    }
                                }
                            }
                        }

                        // 翻转棋子尝试下一种放置方式
                        if (flip === 0) {
                            piece.flip();
                        }
                    }

                    // 旋转棋子尝试下一种放置方式
                    piece.rotate();
                }
            }
        } else {
            // 不是第一步棋，尝试找到有效的放置位置
            for (const piece of this.availablePieces) {
                // 尝试不同的旋转和翻转
                for (let rotation = 0; rotation < 4; rotation++) {
                    for (let flip = 0; flip < 2; flip++) {
                        // 尝试棋盘上每个位置
                        for (let y = 0; y < 14; y++) { // 更新为14
                            for (let x = 0; x < 14; x++) { // 更新为14
                                // 检查是否可以放置
                                if (board.isValidPlacement(piece, x, y, aiPlayerId)) {
                                    return { piece, x, y };
                                }
                            }
                        }

                        // 翻转棋子
                        if (flip === 0) {
                            piece.flip();
                        }
                    }

                    // 旋转棋子
                    piece.rotate();
                }
            }
        }

        // 没有找到有效的移动
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