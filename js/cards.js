class ExplorationCard {
    constructor(shapes, timeValue, monsterAttack = false) {
        this.shapes = shapes;       // 可选的形状数组
        this.timeValue = timeValue;  // 添加时间值属性
        this.monsterAttack = monsterAttack;  // 是否触发怪物入侵
        this.selectedShapeIndex = 0;  // 当前选择的形状索引
    }

    getSelectedShape() {
        return this.shapes[this.selectedShapeIndex];
    }

    nextShape() {
        this.selectedShapeIndex = (this.selectedShapeIndex + 1) % this.shapes.length;
    }
}

class ExplorationDeck {
    constructor() {
        this.cards = this.initializeCards();
        this.shuffle();
    }

    initializeCards() {
        return [
            new ExplorationCard([
                {
                    shape: [
                        [1, 1, 1],
                        [0, 1, 0]
                    ],
                    terrainType: 'village',
                    name: 'Homestead'
                },
                {
                    shape: [
                        [1, 1, 1],
                        [0, 1, 0]
                    ],
                    terrainType: 'farm',
                    name: 'Homestead'
                }
            ], 2)
        ];
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