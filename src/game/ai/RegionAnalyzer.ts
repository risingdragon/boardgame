import { Board } from '../Board';

/**
 * 区域分析器 - 负责分析棋盘空白区域和扩展机会
 */
export class RegionAnalyzer {
    private board: Board;
    private boardSize: number;

    constructor(board: Board) {
        this.board = board;
        const grid = board.getGrid();
        this.boardSize = grid.length;
    }

    /**
     * 寻找棋盘上的空白区域
     */
    public findEmptyRegions(): { x: number, y: number, width: number, height: number, expansionPotential: number }[] {
        const grid = this.board.getGrid();
        const regions: { x: number, y: number, width: number, height: number, expansionPotential: number }[] = [];
        const visited = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(false));

        // 寻找所有空白区域，包括1x2的小区域
        for (let y = 0; y < this.boardSize - 1; y++) {
            for (let x = 0; x < this.boardSize - 1; x++) {
                // 跳过已经访问过的单元格
                if (visited[y][x]) continue;

                // 检查是否是空白单元格
                if (grid[y][x] === 0) {
                    // 尝试找到最大的矩形空白区域
                    let maxWidth = 1;
                    let maxHeight = 1;

                    // 向右扩展
                    while (x + maxWidth < this.boardSize && grid[y][x + maxWidth] === 0) {
                        maxWidth++;
                    }

                    // 向下扩展
                    while (y + maxHeight < this.boardSize) {
                        let canExpand = true;
                        for (let i = 0; i < maxWidth; i++) {
                            if (x + i >= this.boardSize || grid[y + maxHeight][x + i] !== 0) {
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
                        const expansionPotential = this.calculateExpansionPotential(x, y, maxWidth, maxHeight);

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

    /**
     * 计算区域的扩展潜力 - 评估周围有多少可以扩展的空间
     */
    public calculateExpansionPotential(x: number, y: number, width: number, height: number): number {
        const grid = this.board.getGrid();
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
                    while (nx < this.boardSize && grid[y + j][nx] === 0) {
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
                    while (ny < this.boardSize && grid[ny][x + i] === 0) {
                        expandCount++;
                        ny++;
                    }
                    potential += expandCount;
                }
            }
        }

        // 分析该区域是否靠近棋盘边缘
        const isNearLeftEdge = x <= 2;
        const isNearRightEdge = x + width >= this.boardSize - 2;
        const isNearTopEdge = y <= 2;
        const isNearBottomEdge = y + height >= this.boardSize - 2;

        // 为远离边缘的区域增加额外分数，鼓励AI向棋盘中心和空白区域发展
        if (!isNearLeftEdge && !isNearRightEdge && !isNearTopEdge && !isNearBottomEdge) {
            potential += 10;
        }

        // 检测该区域是否位于棋盘左侧
        if (x < this.boardSize / 2) {
            // 给左侧区域额外的扩展分数
            potential += width * height / 4;
        }

        return potential;
    }

    /**
     * 计算指定区域内的空白单元格数量
     */
    public countEmptyCellsInRegion(startX: number, startY: number, endX: number, endY: number): number {
        const grid = this.board.getGrid();
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