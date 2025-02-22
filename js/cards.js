class TerrainCard {
    constructor(shape, terrainType, timeValue) {
        this.shape = shape;        // 形状矩阵
        this.terrainType = terrainType;  // 地形类型
        this.timeValue = timeValue;  // 添加时间值属性
        this.rotation = 0;         // 当前旋转角度 (0, 90, 180, 270)
        this.isFlipped = false;    // 是否翻转
    }

    rotate() {
        this.rotation = (this.rotation + 90) % 360;
        this.shape = this.rotateMatrix(this.shape);
    }

    flip() {
        this.isFlipped = !this.isFlipped;
        this.shape = this.shape.map(row => [...row].reverse());
    }

    rotateMatrix(matrix) {
        const N = matrix.length;
        const result = Array(N).fill().map(() => Array(N).fill(0));

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[j][N - 1 - i] = matrix[i][j];
            }
        }
        return result;
    }
}

class TerrainDeck {
    constructor() {
        this.cards = this.initializeCards();
        this.shuffle();
    }

    initializeCards() {
        // 定义所有可能的地形类型
        const TERRAIN_TYPES = {
            FOREST: 'forest',       // 森林
            VILLAGE: 'village',     // 村庄
            FARM: 'farm',          // 农田
            WATER: 'water',        // 水域
            MONSTER: 'monster'      // 怪物
        };

        const cardConfigs = [
            { shape: [[1]], timeValue: 1 },
            { shape: [[1, 1], [1, 1]], timeValue: 2 },
            { shape: [[1, 0], [1, 1]], timeValue: 2 },
            { shape: [[1, 1, 1], [0, 1, 0]], timeValue: 3 },
            { shape: [[1], [1], [1]], timeValue: 2 },
            { shape: [[1, 1, 0], [0, 1, 1]], timeValue: 3 }
        ];

        const cards = [];

        // 为每种地形类型创建对应的形状卡牌
        for (let type of Object.values(TERRAIN_TYPES)) {
            for (let config of cardConfigs) {
                cards.push(new TerrainCard(config.shape, type, config.timeValue));
            }
        }

        return cards;
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    drawCard() {
        if (this.cards.length === 0) {
            this.cards = this.initializeCards();
            this.shuffle();
        }
        return this.cards.pop();
    }
} 