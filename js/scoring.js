class ScoringCard {
    constructor(name, description, scoringFunction, groupNumber) {
        this.name = name;
        this.description = description;
        this.scoringFunction = scoringFunction;
        this.groupNumber = groupNumber;
    }
}

class ScoringDeck {
    constructor() {
        this.cardsByType = this.initializeScoringCards();
    }

    initializeScoringCards() {
        return [
            // 第1组
            [
                new ScoringCard(
                    "前哨森林",
                    "每个相邻地图边缘的森林格让你获得1点声望。",
                    (board) => {
                        let score = 0;
                        for (let i = 0; i < board.size; i++) {
                            if (board.getCellType(i, 0) === 'forest') score++;
                            if (board.getCellType(i, board.size - 1) === 'forest') score++;
                            if (board.getCellType(0, i) === 'forest') score++;
                            if (board.getCellType(board.size - 1, i) === 'forest') score++;
                        }
                        return score;
                    },
                    1  // 组号
                ),
                new ScoringCard(
                    "丰饶之地",
                    "每个与一个遗迹格相邻的湖水格让你获得1点声望。每个在遗迹格上的农场格让你获得三点声望。",
                    (board) => {
                        let score = 0;

                        // 检查每个格子
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                // 检查农场是否在遗迹上
                                if (board.getCellType(i, j) === 'farm' && board.isRuin(i, j)) {
                                    score += 3;
                                }

                                // 检查湖水是否与遗迹相邻
                                if (board.getCellType(i, j) === 'water') {
                                    // 检查四个相邻格子
                                    const adjacentCells = [
                                        [i - 1, j], // 上
                                        [i + 1, j], // 下
                                        [i, j - 1], // 左
                                        [i, j + 1]  // 右
                                    ];

                                    for (const [x, y] of adjacentCells) {
                                        if (x >= 0 && x < board.size && y >= 0 && y < board.size) {
                                            if (board.isRuin(x, y)) {
                                                score += 1;
                                                break; // 每个湖水格只计算一次
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        return score;
                    },
                    1  // 组号
                ),
                new ScoringCard(
                    "魔法山谷",
                    "每个与一个高山格相邻的湖泊格让你获得2点声望。每个与一个高山格相邻的农场格让你获得1点声望。",
                    (board) => {
                        let score = 0;
                        const directions = [
                            [-1, 0], // 上
                            [1, 0],  // 下
                            [0, -1], // 左
                            [0, 1]   // 右
                        ];

                        // 检查每个格子
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                const cellType = board.getCellType(i, j);

                                // 如果是湖泊或农场
                                if (cellType === 'water' || cellType === 'farm') {
                                    // 检查是否与高山相邻
                                    for (const [dx, dy] of directions) {
                                        const newRow = i + dx;
                                        const newCol = j + dy;

                                        if (newRow >= 0 && newRow < board.size &&
                                            newCol >= 0 && newCol < board.size) {
                                            if (board.getCellType(newRow, newCol) === 'mountain') {
                                                // 湖泊得2分，农场得1分
                                                score += cellType === 'water' ? 2 : 1;
                                                break; // 每个格子只计算一次
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        return score;
                    },
                    1  // 组号
                ),
                new ScoringCard(
                    "树塔",
                    "每个四边被包围的森林格（被已填绘的格子或地图边缘所包围）让你获得1点声望。",
                    (board) => {
                        let score = 0;
                        const directions = [
                            [-1, 0], // 上
                            [1, 0],  // 下
                            [0, -1], // 左
                            [0, 1]   // 右
                        ];

                        // 检查每个格子
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                // 如果是森林格
                                if (board.getCellType(i, j) === 'forest') {
                                    let isSurrounded = true;

                                    // 检查四个相邻位置
                                    for (const [dx, dy] of directions) {
                                        const newRow = i + dx;
                                        const newCol = j + dy;

                                        // 如果在边界外，视为被包围
                                        if (newRow < 0 || newRow >= board.size ||
                                            newCol < 0 || newCol >= board.size) {
                                            continue;
                                        }

                                        // 如果相邻格子是空的，则不被包围
                                        if (!board.getCellType(newRow, newCol)) {
                                            isSurrounded = false;
                                            break;
                                        }
                                    }

                                    // 如果四边都被包围，得1分
                                    if (isSurrounded) {
                                        score += 1;
                                    }
                                }
                            }
                        }

                        return score;
                    },
                    1  // 组号
                )
            ],
            // 第2组
            [
                new ScoringCard(
                    "巨石山林",
                    "每个通过森林群集与另一个高山格相连的高山格，让你获得3点声望。",
                    (board) => {
                        let score = 0;
                        const visited = new Set();

                        // 找到所有高山格
                        const mountains = [];
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                if (board.getCellType(i, j) === 'mountain') {
                                    mountains.push({ row: i, col: j });
                                }
                            }
                        }

                        // 检查每个高山格是否通过森林与其他高山相连
                        for (const mountain of mountains) {
                            const key = `${mountain.row},${mountain.col}`;
                            if (visited.has(key)) continue;

                            const connectedMountains = new Set();
                            const stack = [{ row: mountain.row, col: mountain.col }];
                            const forestVisited = new Set();

                            while (stack.length > 0) {
                                const current = stack.pop();
                                const currentKey = `${current.row},${current.col}`;

                                if (forestVisited.has(currentKey)) continue;
                                forestVisited.add(currentKey);

                                if (board.getCellType(current.row, current.col) === 'mountain') {
                                    connectedMountains.add(currentKey);
                                    visited.add(currentKey);
                                }

                                if (board.getCellType(current.row, current.col) === 'forest' ||
                                    board.getCellType(current.row, current.col) === 'mountain') {
                                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                                    for (const [dx, dy] of directions) {
                                        const newRow = current.row + dx;
                                        const newCol = current.col + dy;

                                        if (newRow >= 0 && newRow < board.size &&
                                            newCol >= 0 && newCol < board.size) {
                                            const nextCell = board.getCellType(newRow, newCol);
                                            if (nextCell === 'forest' || nextCell === 'mountain') {
                                                stack.push({ row: newRow, col: newCol });
                                            }
                                        }
                                    }
                                }
                            }

                            if (connectedMountains.size > 1) {
                                score += 3 * connectedMountains.size;
                            }
                        }

                        return score;
                    },
                    2  // 组号
                )
            ],
            // 第3组
            [
                new ScoringCard(
                    "大聚落",
                    "最大的村庄区域（正方形或长方形）的格子数量平方得分。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    },
                    3  // 组号
                ),
                new ScoringCard(
                    "运河",
                    "每个完整的水域格行（从地图左侧到右侧）让你获得4点声望。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    },
                    3  // 组号
                )
            ],
            // 第4组
            [
                new ScoringCard(
                    "破碎之地",
                    "每个不同地形（包括空格）相邻的格子让你获得1点声望。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    },
                    4  // 组号
                ),
                new ScoringCard(
                    "边境之地",
                    "每种地形在地图边缘的格子数量的最小值×3得分。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    },
                    4  // 组号
                )
            ]
        ];
    }

    drawCardsByType() {
        // 从每种类型中随机抽取一张卡
        const selectedCards = {};
        for (const type of ['A', 'B', 'C', 'D']) {
            const cards = this.cardsByType[type];
            const randomIndex = Math.floor(Math.random() * cards.length);
            selectedCards[type] = cards[randomIndex];
        }
        return selectedCards;
    }
} 