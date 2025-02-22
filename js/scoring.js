class ScoringCard {
    constructor(name, description, scoringFunction) {
        this.name = name;
        this.description = description;
        this.scoringFunction = scoringFunction;
    }
}

class ScoringDeck {
    constructor() {
        this.cardsByType = this.initializeScoringCards();
    }

    initializeScoringCards() {
        return {
            A: [
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
                    }
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
                    }
                )
            ],
            B: [
                new ScoringCard(
                    "农田小镇",
                    "每个与农田相邻的村庄格让你获得1点声望。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    }
                ),
                new ScoringCard(
                    "睡谷",
                    "每个完整的空格行（从地图左侧到右侧）让你获得3点声望。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    }
                )
            ],
            C: [
                new ScoringCard(
                    "大聚落",
                    "最大的村庄区域（正方形或长方形）的格子数量平方得分。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    }
                ),
                new ScoringCard(
                    "运河",
                    "每个完整的水域格行（从地图左侧到右侧）让你获得4点声望。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    }
                )
            ],
            D: [
                new ScoringCard(
                    "破碎之地",
                    "每个不同地形（包括空格）相邻的格子让你获得1点声望。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    }
                ),
                new ScoringCard(
                    "边境之地",
                    "每种地形在地图边缘的格子数量的最小值×3得分。",
                    (board) => {
                        // TODO: 实现计分逻辑
                        return 0;
                    }
                )
            ]
        };
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