import { Board } from './Board';
import { Player } from './Player';

/**
 * 棋盘分析器 - 负责分析棋盘状态、区域控制和潜在机会
 */
export class BoardAnalyzer {
    private board: Board;
    private boardSize: number;

    constructor(board: Board) {
        this.board = board;
        // 从Board类获取宽度和高度
        const grid = board.getGrid();
        // 假设棋盘是正方形的，使用宽度作为棋盘大小
        this.boardSize = grid.length;
    }

    /**
     * 查找对手的所有可能连接点
     */
    public findOpponentConnectionPoints(opponentPlayer: Player): { x: number, y: number }[] {
        const grid = this.board.getGrid();
        const connectionPoints: { x: number, y: number }[] = [];

        // 临时映射以记录对手的所有单元格位置
        const opponentCells: Record<string, boolean> = {};

        // 识别所有对手占据的单元格 - 根据opponentPlayer找到棋盘上所有玩家的棋子
        const opponentPieces = opponentPlayer.getPlacedPieces();

        // 遍历棋盘，查找属于对手的单元格
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                // 使用2表示AI玩家，1表示人类玩家，这里需要根据实际情况调整
                // 可以通过检查grid[y][x]是否等于特定值（玩家的识别符）来判断
                if ((opponentPlayer.name === "Human" && grid[y][x] === 1) ||
                    (opponentPlayer.name === "AI" && grid[y][x] === 2)) {
                    opponentCells[`${x},${y}`] = true;
                }
            }
        }

        // 对于每个对手的单元格，检查对角线方向的可能连接点
        for (const cellKey of Object.keys(opponentCells)) {
            const [x, y] = cellKey.split(',').map(Number);

            // 对角线方向
            const diagonalDirections = [
                { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
                { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
            ];

            for (const dir of diagonalDirections) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;

                // 检查这个对角线位置是否在棋盘内且未被占据
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize &&
                    grid[ny][nx] === 0 && !connectionPoints.some(p => p.x === nx && p.y === ny)) {

                    // 确保该点不与对手任何其他单元格相邻
                    let isValid = true;
                    const adjacentDirections = [
                        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
                    ];

                    for (const adjDir of adjacentDirections) {
                        const adjX = nx + adjDir.dx;
                        const adjY = ny + adjDir.dy;

                        if (adjX >= 0 && adjX < this.boardSize && adjY >= 0 && adjY < this.boardSize &&
                            opponentCells[`${adjX},${adjY}`] && !(adjX === x && adjY === y)) {
                            isValid = false;
                            break;
                        }
                    }

                    if (isValid) {
                        connectionPoints.push({ x: nx, y: ny });
                    }
                }
            }
        }

        return connectionPoints;
    }

    /**
     * 生成棋盘热图，标识关键位置
     */
    public generateBoardHeatMap(player: Player, opponentPlayer: Player): number[][] {
        const grid = this.board.getGrid();
        const heatMap: number[][] = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(0));

        // 临时映射以跟踪已经处理过的格子
        const processedCells: Record<string, boolean> = {};

        // 计算对手连接点的热力值
        const opponentConnectionPoints = this.findOpponentConnectionPoints(opponentPlayer);
        for (const point of opponentConnectionPoints) {
            heatMap[point.y][point.x] += 5; // 给对手连接点一个较高的分数
        }

        // 查找大的空白区域
        const emptyRegions = this.findLargeEmptyRegions();

        // 为大的空白区域增加热力值 - 鼓励AI向大的空白区域扩展
        for (const region of emptyRegions) {
            // 区域越大，热力值越高
            const regionBonus = Math.min(5, Math.log2(region.width * region.height) / 2);

            // 左侧区域获得额外奖励
            const leftSideBonus = region.x < this.boardSize / 2 ? 1 : 0;

            // 为区域中的每个单元格增加热力值
            for (let y = region.y; y < region.y + region.height; y++) {
                for (let x = region.x; x < region.x + region.width; x++) {
                    if (y < this.boardSize && x < this.boardSize && grid[y][x] === 0) {
                        heatMap[y][x] += regionBonus + leftSideBonus;
                    }
                }
            }
        }

        // 检查棋盘左右两侧的空间分布
        const leftSideEmptyCount = this.countEmptyCells(0, 0, Math.floor(this.boardSize / 2), this.boardSize);
        const rightSideEmptyCount = this.countEmptyCells(Math.floor(this.boardSize / 2), 0, this.boardSize, this.boardSize);

        // 如果左侧空间明显多于右侧，增加左侧区域的热力值
        if (leftSideEmptyCount > rightSideEmptyCount * 1.5) {
            for (let y = 0; y < this.boardSize; y++) {
                for (let x = 0; x < Math.floor(this.boardSize / 2); x++) {
                    if (grid[y][x] === 0) {
                        heatMap[y][x] += 2;
                    }
                }
            }
        }

        // 计算控制中心的热力值
        const centerX = Math.floor(this.boardSize / 2);
        const centerY = Math.floor(this.boardSize / 2);

        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (grid[y][x] === 0) { // 只考虑空格子
                    // 与中心的距离
                    const distanceToCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
                    const centerInfluence = Math.max(0, 10 - distanceToCenter) / 2;

                    heatMap[y][x] += centerInfluence;

                    // 检查可扩展性
                    let expansionPotential = 0;
                    const directions = [
                        { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
                        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                        { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
                    ];

                    for (const dir of directions) {
                        const nx = x + dir.dx;
                        const ny = y + dir.dy;

                        if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && grid[ny][nx] === 0) {
                            expansionPotential++;
                        }
                    }

                    heatMap[y][x] += expansionPotential / 4;

                    // 标记为已处理
                    processedCells[`${x},${y}`] = true;
                }
            }
        }

        return heatMap;
    }

    /**
     * 查找棋盘上较大的空白区域
     */
    public findLargeEmptyRegions(): { x: number, y: number, width: number, height: number }[] {
        const grid = this.board.getGrid();
        const regions: { x: number, y: number, width: number, height: number }[] = [];
        const visited = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(false));

        // 寻找2x2及以上的空白区域
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

                    // 只记录3x3及以上的区域
                    if (maxWidth >= 3 && maxHeight >= 3) {
                        regions.push({
                            x,
                            y,
                            width: maxWidth,
                            height: maxHeight
                        });
                    }
                }
            }
        }

        // 按区域大小排序
        regions.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        return regions;
    }

    /**
     * 计算指定区域内的空白单元格数量
     */
    public countEmptyCells(startX: number, startY: number, endX: number, endY: number): number {
        const grid = this.board.getGrid();
        let count = 0;
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x < this.boardSize && y < this.boardSize && grid[y][x] === 0) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * 评估区域的竞争程度
     */
    public evaluateAreaCompetition(x: number, y: number, player: Player, opponentPlayer: Player): number {
        const competitionScore = this.calculateCompetitionScore(x, y, player, opponentPlayer);
        return competitionScore;
    }

    /**
     * 计算位置的竞争分数
     */
    private calculateCompetitionScore(x: number, y: number, player: Player, opponentPlayer: Player): number {
        // 初始化两个距离数组，分别表示到自己和对手最近棋子的距离
        const grid = this.board.getGrid();
        const distToSelf = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(Infinity));
        const distToOpponent = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(Infinity));

        // 使用BFS来计算到最近棋子的距离
        // 获取玩家ID：根据玩家名称判断
        const playerId = player.name === "Human" ? 1 : 2;
        const opponentId = opponentPlayer.name === "Human" ? 1 : 2;

        this.calculateDistanceMap(distToSelf, playerId);
        this.calculateDistanceMap(distToOpponent, opponentId);

        // 获取当前位置到双方的距离
        const selfDist = distToSelf[y][x];
        const opponentDist = distToOpponent[y][x];

        if (selfDist === Infinity && opponentDist === Infinity) {
            // 如果位置离双方都很远，则不是竞争区域
            return 0;
        } else if (selfDist === Infinity) {
            // 只有对手可以到达的区域，竞争性低
            return 3;
        } else if (opponentDist === Infinity) {
            // 只有自己可以到达的区域，竞争性低
            return 3;
        } else {
            // 双方都可以到达，计算竞争分数
            // 距离越相近，竞争越激烈
            const diff = Math.abs(selfDist - opponentDist);

            if (diff <= 1) {
                return 10; // 高度竞争
            } else if (diff <= 3) {
                return 8; // 中度竞争
            } else if (diff <= 5) {
                return 5; // 低度竞争
            } else {
                return 3; // 较少竞争
            }
        }
    }

    /**
     * 使用BFS计算到特定玩家棋子的距离图
     */
    private calculateDistanceMap(distMap: number[][], playerId: number): void {
        const grid = this.board.getGrid();
        const queue: [number, number, number][] = []; // [x, y, distance]
        const visited: Record<string, boolean> = {};

        // 将所有该玩家的棋子加入队列，初始距离为0
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (grid[y][x] === playerId) {
                    queue.push([x, y, 0]);
                    distMap[y][x] = 0;
                    visited[`${x},${y}`] = true;
                }
            }
        }

        // BFS计算距离
        while (queue.length > 0) {
            const [x, y, dist] = queue.shift()!;

            // 四个方向
            const directions = [
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
            ];

            for (const dir of directions) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;

                // 检查是否在边界内且未被访问过
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize &&
                    !visited[`${nx},${ny}`] && grid[ny][nx] === 0) {

                    distMap[ny][nx] = dist + 1;
                    visited[`${nx},${ny}`] = true;
                    queue.push([nx, ny, dist + 1]);
                }
            }
        }
    }
} 