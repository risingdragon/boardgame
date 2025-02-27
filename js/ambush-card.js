class AmbushCard {
    static CORNERS = {
        TOP_LEFT: 'topLeft',
        TOP_RIGHT: 'topRight',
        BOTTOM_LEFT: 'bottomLeft',
        BOTTOM_RIGHT: 'bottomRight'
    };

    static DIRECTIONS = {
        CLOCKWISE: 'clockwise',
        COUNTER_CLOCKWISE: 'counterClockwise'
    };

    static CARDS = {
        GNOLL_RAID: {
            name: '豺狼人进犯',
            corner: AmbushCard.CORNERS.TOP_LEFT,
            direction: AmbushCard.DIRECTIONS.COUNTER_CLOCKWISE,
            shape: [
                [1, 1],
                [1, 0],
                [1, 1]
            ]
        },
        BUGBEAR_ASSAULT: {
            name: '熊头人攻击',
            corner: AmbushCard.CORNERS.TOP_RIGHT,
            direction: AmbushCard.DIRECTIONS.CLOCKWISE,
            shape: [
                [1, 0, 1],
                [1, 0, 1]
            ]
        },
        KOBOLD_TRAP: {
            name: '狗头人进攻',
            corner: AmbushCard.CORNERS.BOTTOM_LEFT,
            direction: AmbushCard.DIRECTIONS.CLOCKWISE,
            shape: [
                [1, 0],
                [1, 1],
                [1, 0]
            ]
        },
        GOBLIN_ATTACK: {
            name: '哥布林袭击',
            corner: AmbushCard.CORNERS.BOTTOM_RIGHT,
            direction: AmbushCard.DIRECTIONS.COUNTER_CLOCKWISE,
            shape: [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ]
        }
    };

    constructor(name, corner, direction, shape) {
        this.name = name;
        this.corner = corner;
        this.direction = direction;
        this.shape = shape;
        this.terrainType = 'monster';
        this.timeValue = 0;
        this.coinReward = false;
    }

    static initializeCards() {
        return [
            new AmbushCard(
                AmbushCard.CARDS.GNOLL_RAID.name,
                AmbushCard.CARDS.GNOLL_RAID.corner,
                AmbushCard.CARDS.GNOLL_RAID.direction,
                AmbushCard.CARDS.GNOLL_RAID.shape
            ),
            new AmbushCard(
                AmbushCard.CARDS.BUGBEAR_ASSAULT.name,
                AmbushCard.CARDS.BUGBEAR_ASSAULT.corner,
                AmbushCard.CARDS.BUGBEAR_ASSAULT.direction,
                AmbushCard.CARDS.BUGBEAR_ASSAULT.shape
            ),
            new AmbushCard(
                AmbushCard.CARDS.KOBOLD_TRAP.name,
                AmbushCard.CARDS.KOBOLD_TRAP.corner,
                AmbushCard.CARDS.KOBOLD_TRAP.direction,
                AmbushCard.CARDS.KOBOLD_TRAP.shape
            ),
            new AmbushCard(
                AmbushCard.CARDS.GOBLIN_ATTACK.name,
                AmbushCard.CARDS.GOBLIN_ATTACK.corner,
                AmbushCard.CARDS.GOBLIN_ATTACK.direction,
                AmbushCard.CARDS.GOBLIN_ATTACK.shape
            )
        ];
    }

    static createGnollRaid() {
        return new AmbushCard(
            AmbushCard.GNOLL_RAID.corner,
            AmbushCard.GNOLL_RAID.direction,
            AmbushCard.GNOLL_RAID.shape
        );
    }

    constructor(corner, direction, shape) {
        this.corner = corner || AmbushCard.CORNERS.TOP_LEFT;
        this.direction = direction || AmbushCard.DIRECTIONS.CLOCKWISE;
        this.shape = shape || [[1]];
        this.terrainType = 'monster';
        this.timeValue = 0;
        this.coinReward = false;
        this.cardType = '';  // 添加卡牌类型标识
    }

    // 获取放置位置
    getStartPosition() {
        const lastRow = 10;  // 11x11 棋盘的最后一行索引
        const lastCol = 10;  // 11x11 棋盘的最后一列索引

        switch (this.corner) {
            case AmbushCard.CORNERS.TOP_LEFT:
                return [0, 0];
            case AmbushCard.CORNERS.TOP_RIGHT:
                return [0, lastCol - this.shape[0].length + 1];
            case AmbushCard.CORNERS.BOTTOM_LEFT:
                return [lastRow - this.shape.length + 1, 0];
            case AmbushCard.CORNERS.BOTTOM_RIGHT:
                return [lastRow - this.shape.length + 1, lastCol - this.shape[0].length + 1];
            default:
                return [0, 0];
        }
    }

    // 获取下一个位置（根据移动方向）
    getNextPosition(currentRow, currentCol) {
        const lastRow = 10;
        const lastCol = 10;
        const shapeHeight = this.shape.length;
        const shapeWidth = this.shape[0].length;

        if (this.direction === AmbushCard.DIRECTIONS.CLOCKWISE) {
            // 顺时针移动逻辑
            if (currentRow === 0 && currentCol < lastCol - shapeWidth + 1) {
                return [currentRow, currentCol + 1]; // 向右
            }
            if (currentCol === lastCol - shapeWidth + 1 && currentRow < lastRow - shapeHeight + 1) {
                return [currentRow + 1, currentCol]; // 向下
            }
            if (currentRow === lastRow - shapeHeight + 1 && currentCol > 0) {
                return [currentRow, currentCol - 1]; // 向左
            }
            if (currentCol === 0 && currentRow > 0) {
                return [currentRow - 1, currentCol]; // 向上
            }
        } else {
            // 逆时针移动逻辑
            if (currentRow === 0 && currentCol > 0) {
                return [currentRow, currentCol - 1]; // 向左
            }
            if (currentCol === 0 && currentRow < lastRow - shapeHeight + 1) {
                return [currentRow + 1, currentCol]; // 向下
            }
            if (currentRow === lastRow - shapeHeight + 1 && currentCol < lastCol - shapeWidth + 1) {
                return [currentRow, currentCol + 1]; // 向右
            }
            if (currentCol === lastCol - shapeWidth + 1 && currentRow > 0) {
                return [currentRow - 1, currentCol]; // 向上
            }
        }

        return null; // 无法继续移动
    }

    getSelectedShape() {
        return {
            shape: this.shape,
            terrainType: this.terrainType,
            coinReward: this.coinReward
        };
    }

    getName() {
        if (this.cardType === 'gnoll') {
            return '豺狼人进犯';
        }
        const cornerNames = {
            [AmbushCard.CORNERS.TOP_LEFT]: '左上',
            [AmbushCard.CORNERS.TOP_RIGHT]: '右上',
            [AmbushCard.CORNERS.BOTTOM_LEFT]: '左下',
            [AmbushCard.CORNERS.BOTTOM_RIGHT]: '右下'
        };

        const directionNames = {
            [AmbushCard.DIRECTIONS.CLOCKWISE]: '顺时针',
            [AmbushCard.DIRECTIONS.COUNTER_CLOCKWISE]: '逆时针'
        };

        return `伏兵（${cornerNames[this.corner]}角 ${directionNames[this.direction]}）`;
    }

    getDescription() {
        return '从指定角落开始，按指定方向移动怪物地形';
    }

    getTimeValue() {
        return this.timeValue;
    }
}

// VoidCard 类保持不变
class VoidCard extends AmbushCard {
    constructor() {
        super('时空裂隙', AmbushCard.CORNERS.TOP_LEFT, AmbushCard.DIRECTIONS.CLOCKWISE, [[1]]);
        this.timeValue = 2;
    }

    getDescription() {
        return '在任意空格放置一个怪物地形';
    }
}

// 修改创建方法
AmbushCard.createGnollRaid = () => {
    const card = new AmbushCard(
        AmbushCard.GNOLL_RAID.corner,
        AmbushCard.GNOLL_RAID.direction,
        AmbushCard.GNOLL_RAID.shape
    );
    card.cardType = 'gnoll';
    return card;
};