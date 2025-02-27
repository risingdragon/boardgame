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
        this.cardGroups = this.initializeScoringCards();
    }

    initializeScoringCards() {
        return [
            // 第1组
            [
                new ScoringCard(
                    "前哨森林",
                    "每个相邻地图边缘的森林格获得1点声望。",
                    (board) => {
                        let score = 0;
                        const counted = new Set(); // 用于记录已计算过的森林格

                        // 检查每个边缘位置
                        for (let i = 0; i < board.size; i++) {
                            // 左边缘
                            if (board.getCellType(i, 0) === 'forest') {
                                counted.add(`${i},0`);
                                score++;
                            }
                            // 右边缘
                            if (board.getCellType(i, board.size - 1) === 'forest') {
                                counted.add(`${i},${board.size - 1}`);
                                score++;
                            }
                            // 上边缘（检查是否已计算过左右边缘）
                            if (board.getCellType(0, i) === 'forest' && !counted.has(`0,${i}`)) {
                                counted.add(`0,${i}`);
                                score++;
                            }
                            // 下边缘（检查是否已计算过左右边缘）
                            if (board.getCellType(board.size - 1, i) === 'forest' &&
                                !counted.has(`${board.size - 1},${i}`)) {
                                counted.add(`${board.size - 1},${i}`);
                                score++;
                            }
                        }
                        return score;
                    },
                    1
                ),
                new ScoringCard(
                    "树塔",
                    "每个四边没有空格的森林格获得1点声望。",
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
                    1
                ),
                new ScoringCard(
                    "葱郁林海",
                    "每一行或每一列如果有森林格就获得1点声望。同一个森林格可以累计。",
                    (board) => {
                        let score = 0;

                        // 检查每一行
                        for (let i = 0; i < board.size; i++) {
                            // 检查这一行是否有森林
                            for (let j = 0; j < board.size; j++) {
                                if (board.getCellType(i, j) === 'forest') {
                                    score += 1;  // 这一行有森林，得1分
                                    break;  // 找到一个就够了，检查下一行
                                }
                            }
                        }

                        // 检查每一列
                        for (let j = 0; j < board.size; j++) {
                            // 检查这一列是否有森林
                            for (let i = 0; i < board.size; i++) {
                                if (board.getCellType(i, j) === 'forest') {
                                    score += 1;  // 这一列有森林，得1分
                                    break;  // 找到一个就够了，检查下一列
                                }
                            }
                        }

                        return score;
                    },
                    1  // 改为第1组
                ),
                new ScoringCard(
                    "巨石山林",
                    "每个通过森林群落与另一个高山格相连的高山格，获得3点声望。",
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
                    1
                )
            ],
            // 第2组
            [
                new ScoringCard(
                    "运河湖",
                    "每个与农场格相邻的湖泊格获得1点声望。每个与湖泊格相邻的农场格获得1点声望。",
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
                                    // 检查是否与对方相邻
                                    for (const [dx, dy] of directions) {
                                        const newRow = i + dx;
                                        const newCol = j + dy;
                                        if (newRow >= 0 && newRow < board.size &&
                                            newCol >= 0 && newCol < board.size) {
                                            const adjacentType = board.getCellType(newRow, newCol);
                                            if ((cellType === 'water' && adjacentType === 'farm') ||
                                                (cellType === 'farm' && adjacentType === 'water')) {
                                                score += 1;
                                                break; // 每个格子只计算一次
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        return score;
                    },
                    2
                ),
                new ScoringCard(
                    "丰饶之地",
                    "每个与遗迹格相邻的湖泊格获得1点声望。每个在遗迹格上的农场格获得三点声望。",
                    (board) => {
                        let score = 0;

                        // 使用 GameBoard 的静态遗迹位置
                        for (const [i, j] of GameBoard.RUINS_POSITIONS) {
                            // 检查农场是否在遗迹上
                            if (board.getCellType(i, j) === 'farm') {
                                score += 3;
                            }

                            // 检查遗迹周围是否有湖水
                            const adjacentCells = [
                                [i - 1, j], // 上
                                [i + 1, j], // 下
                                [i, j - 1], // 左
                                [i, j + 1]  // 右
                            ];

                            for (const [x, y] of adjacentCells) {
                                if (x >= 0 && x < board.size && y >= 0 && y < board.size) {
                                    if (board.getCellType(x, y) === 'water') {
                                        score += 1;
                                    }
                                }
                            }
                        }

                        return score;
                    },
                    2
                ),
                new ScoringCard(
                    "魔法山谷",
                    "每个与高山格相邻的湖泊格获得2点声望。每个与高山格相邻的农场格获得1点声望。",
                    (board) => {
                        let score = 0;
                        const directions = [
                            [-1, 0], // 上
                            [1, 0],  // 下
                            [0, -1], // 左
                            [0, 1]   // 右
                        ];

                        // 检查每个山脉周围的格子
                        for (const [mountainRow, mountainCol] of GameBoard.MOUNTAIN_POSITIONS) {
                            // 检查四个相邻位置
                            for (const [dx, dy] of directions) {
                                const newRow = mountainRow + dx;
                                const newCol = mountainCol + dy;

                                if (newRow >= 0 && newRow < board.size &&
                                    newCol >= 0 && newCol < board.size) {
                                    const cellType = board.getCellType(newRow, newCol);
                                    // 湖泊得2分
                                    if (cellType === 'water') {
                                        score += 2;
                                    }
                                    // 农场得1分
                                    else if (cellType === 'farm') {
                                        score += 1;
                                    }
                                }
                            }
                        }
                        return score;
                    },
                    2
                ),
                new ScoringCard(
                    "广阔湖岸",
                    "每个不与湖泊格或地图边缘相邻的农场群落获得3点声望。每个不与农场格或地图边缘相邻的湖泊群落获得3点声望。",
                    (board) => {
                        let score = 0;
                        const visited = new Set();
                        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

                        // 检查每个格子
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                const cellType = board.getCellType(i, j);
                                if ((cellType === 'farm' || cellType === 'water') && !visited.has(`${i},${j}`)) {
                                    // 找到一个新的群组
                                    const group = [];
                                    const stack = [{ row: i, col: j }];
                                    let touchesEdge = false;
                                    let touchesOpposite = false;

                                    // 使用深度优先搜索找到整个群组
                                    while (stack.length > 0) {
                                        const current = stack.pop();
                                        const key = `${current.row},${current.col}`;

                                        if (visited.has(key)) continue;
                                        visited.add(key);
                                        group.push(current);

                                        // 检查是否接触地图边缘
                                        if (current.row === 0 || current.row === board.size - 1 ||
                                            current.col === 0 || current.col === board.size - 1) {
                                            touchesEdge = true;
                                        }

                                        // 检查相邻格子
                                        for (const [dx, dy] of directions) {
                                            const newRow = current.row + dx;
                                            const newCol = current.col + dy;

                                            if (newRow >= 0 && newRow < board.size &&
                                                newCol >= 0 && newCol < board.size) {
                                                const adjacentType = board.getCellType(newRow, newCol);

                                                // 检查是否接触相反类型
                                                if ((cellType === 'farm' && adjacentType === 'water') ||
                                                    (cellType === 'water' && adjacentType === 'farm')) {
                                                    touchesOpposite = true;
                                                }

                                                // 如果是同类型，加入搜索栈
                                                if (adjacentType === cellType) {
                                                    stack.push({ row: newRow, col: newCol });
                                                }
                                            }
                                        }
                                    }

                                    // 如果群组既不接触边缘也不接触相反类型，得3分
                                    if (!touchesEdge && !touchesOpposite) {
                                        score += 3;
                                    }
                                }
                            }
                        }
                        return score;
                    },
                    2
                )
            ],
            // 第3组
            [
                new ScoringCard(
                    "荒野聚落",
                    "每个含有6个及以上村庄格的群落获得8点声望。",
                    (board) => {
                        let score = 0;
                        const visited = new Set();
                        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

                        // 检查每个格子
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                if (board.getCellType(i, j) === 'village' && !visited.has(`${i},${j}`)) {
                                    // 找到一个新的村庄群落
                                    let groupSize = 0;
                                    const stack = [{ row: i, col: j }];

                                    // 使用深度优先搜索找到整个群落
                                    while (stack.length > 0) {
                                        const current = stack.pop();
                                        const key = `${current.row},${current.col}`;

                                        if (visited.has(key)) continue;
                                        visited.add(key);
                                        groupSize++;

                                        // 检查相邻格子
                                        for (const [dx, dy] of directions) {
                                            const newRow = current.row + dx;
                                            const newCol = current.col + dy;

                                            if (newRow >= 0 && newRow < board.size &&
                                                newCol >= 0 && newCol < board.size &&
                                                board.getCellType(newRow, newCol) === 'village') {
                                                stack.push({ row: newRow, col: newCol });
                                            }
                                        }
                                    }

                                    // 如果群落大小大于等于6，得8分
                                    if (groupSize >= 6) {
                                        score += 8;
                                    }
                                }
                            }
                        }
                        return score;
                    },
                    3
                )],
            // 第4组
            [
                new ScoringCard(
                    "边境",
                    "每个完整填绘的一行或一列获得6点声望。",
                    (board) => {
                        let score = 0;

                        // 检查每一行
                        for (let i = 0; i < board.size; i++) {
                            let isRowComplete = true;
                            // 检查这一行是否完全填满
                            for (let j = 0; j < board.size; j++) {
                                if (!board.getCellType(i, j)) {
                                    isRowComplete = false;
                                    break;
                                }
                            }
                            if (isRowComplete) {
                                score += 6;
                            }
                        }

                        // 检查每一列
                        for (let j = 0; j < board.size; j++) {
                            let isColumnComplete = true;
                            // 检查这一列是否完全填满
                            for (let i = 0; i < board.size; i++) {
                                if (!board.getCellType(i, j)) {
                                    isColumnComplete = false;
                                    break;
                                }
                            }
                            if (isColumnComplete) {
                                score += 6;
                            }
                        }

                        return score;
                    },
                    4
                ),
                new ScoringCard(
                    "崎岖之路",
                    "每条从地图左侧连接到地图底部完整填绘的斜线，获得3点声望。",
                    (board) => {
                        let score = 0;

                        // 从左侧边缘的每个格子开始检查
                        for (let startRow = 0; startRow < board.size; startRow++) {
                            let isPathComplete = true;
                            let row = startRow;
                            let col = 0;

                            // 沿着斜线检查每个格子
                            while (row < board.size && col < board.size) {
                                if (!board.getCellType(row, col)) {
                                    isPathComplete = false;
                                    break;
                                }
                                row++;
                                col++;
                            }

                            // 检查是否到达底部
                            if (isPathComplete && row === board.size) {
                                score += 3;
                            }
                        }

                        return score;
                    },
                    4
                ),
                new ScoringCard(
                    "失落的庄园",
                    "最大已填绘的四方形中，一侧的每个格子获得3点声望。",
                    (board) => {
                        let maxSize = 0;

                        // 检查每个可能的起始点
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                // 从当前点开始尝试不同大小的正方形
                                let size = 1;
                                while (i + size <= board.size && j + size <= board.size) {
                                    let isSquareComplete = true;

                                    // 检查这个正方形区域是否完全填满
                                    for (let r = i; r < i + size; r++) {
                                        for (let c = j; c < j + size; c++) {
                                            if (!board.getCellType(r, c)) {
                                                isSquareComplete = false;
                                                break;
                                            }
                                        }
                                        if (!isSquareComplete) break;
                                    }

                                    // 更新最大尺寸
                                    if (isSquareComplete) {
                                        maxSize = Math.max(maxSize, size);
                                    }
                                    size++;
                                }
                            }
                        }

                        // 返回最大正方形一边的得分（每格3分）
                        return maxSize * 3;
                    },
                    4
                ),
                new ScoringCard(
                    "围困之地",
                    "每个相邻没有空格的空格获得1点声望。",
                    (board) => {
                        let score = 0;
                        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

                        // 检查每个格子
                        for (let i = 0; i < board.size; i++) {
                            for (let j = 0; j < board.size; j++) {
                                // 检查是否是空格或未填绘的遗迹
                                if (!board.getCellType(i, j) && !board.wasRuin(i, j) ||
                                    board.isCurrentlyRuin(i, j)) {
                                    let isSurrounded = true;

                                    // 检查四个相邻位置
                                    for (const [dx, dy] of directions) {
                                        const newRow = i + dx;
                                        const newCol = j + dy;

                                        // 如果在边界外，继续检查其他方向
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
                    4
                )
            ]
        ];
    }

    // 从每组中随机选择一张卡
    getRandomCards() {
        const selectedCards = [];
        for (let i = 0; i < 4; i++) {
            const group = this.cardGroups[i];
            const randomIndex = Math.floor(Math.random() * group.length);
            selectedCards.push(group[randomIndex]);
        }
        return selectedCards;
    }
}
