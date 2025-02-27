class AmbushCard extends ExplorationCard {
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

    // 将静态方法移到其他静态属性之后
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

    constructor(name, corner, direction, shape) {
        // 创建符合 ExplorationCard 结构的 shapes 数组
        const shapes = [{
            shape: shape,
            terrainType: 'monster',
            coinReward: false
        }];

        // 调用父类构造函数
        super(name, shapes, 0, true);  // timeValue 为 0，monsterAttack 为 true

        this.corner = corner;
        this.direction = direction;
    }

    // 删除自定义的 getSelectedShape 方法，使用父类的方法
    // 因为父类的实现已经能正确处理 shapes 数组

    // 修改 getStartPosition 和 getNextPosition 方法中的 shape 引用
    getStartPosition() {
        const lastRow = 10;
        const lastCol = 10;
        const selectedShape = super.getSelectedShape();
        const shape = selectedShape.shape;
        const shapeHeight = shape.length;
        const shapeWidth = shape[0].length;

        // 根据不同角落找到对应的基准格子
        let baseRow = 0;
        let baseCol = 0;
        let startPosition;

        switch (this.corner) {
            case AmbushCard.CORNERS.TOP_LEFT:
                // 找到左上角第一个有效格子
                for (let i = 0; i < shapeHeight; i++) {
                    for (let j = 0; j < shapeWidth; j++) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            startPosition = [0 - baseRow, 0 - baseCol];
                            break;
                        }
                    }
                    if (startPosition) break;
                }
                break;

            case AmbushCard.CORNERS.TOP_RIGHT:
                // 找到右上角第一个有效格子
                for (let i = 0; i < shapeHeight; i++) {
                    for (let j = shapeWidth - 1; j >= 0; j--) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            startPosition = [0 - baseRow, lastCol - baseCol];
                            break;
                        }
                    }
                    if (startPosition) break;
                }
                break;

            case AmbushCard.CORNERS.BOTTOM_LEFT:
                // 找到左下角第一个有效格子
                for (let i = shapeHeight - 1; i >= 0; i--) {
                    for (let j = 0; j < shapeWidth; j++) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            startPosition = [lastRow - baseRow, 0 - baseCol];
                            break;
                        }
                    }
                    if (startPosition) break;
                }
                break;

            case AmbushCard.CORNERS.BOTTOM_RIGHT:
                // 找到右下角第一个有效格子
                for (let i = shapeHeight - 1; i >= 0; i--) {
                    for (let j = shapeWidth - 1; j >= 0; j--) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            startPosition = [lastRow - baseRow, lastCol - baseCol];
                            break;
                        }
                    }
                    if (startPosition) break;
                }
                break;
        }

        startPosition = startPosition || [0, 0];

        console.log('伏兵卡起始位置:', {
            corner: this.corner,
            shape: shape,
            baseRow: baseRow,
            baseCol: baseCol,
            startPosition: startPosition
        });

        return startPosition;
    }

    getNextPosition(currentRow, currentCol) {
        const lastRow = 10;
        const lastCol = 10;
        const selectedShape = super.getSelectedShape();
        const shape = selectedShape.shape;
        const shapeHeight = shape.length;
        const shapeWidth = shape[0].length;

        // 找到对应角落的基准格子
        let baseRow = 0;
        let baseCol = 0;

        switch (this.corner) {
            case AmbushCard.CORNERS.TOP_LEFT:
                for (let i = 0; i < shapeHeight; i++) {
                    for (let j = 0; j < shapeWidth; j++) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            break;
                        }
                    }
                    if (baseCol > 0) break;
                }
                break;

            case AmbushCard.CORNERS.TOP_RIGHT:
                for (let i = 0; i < shapeHeight; i++) {
                    for (let j = shapeWidth - 1; j >= 0; j--) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            break;
                        }
                    }
                    if (baseCol < shapeWidth - 1) break;
                }
                break;

            case AmbushCard.CORNERS.BOTTOM_LEFT:
                for (let i = shapeHeight - 1; i >= 0; i--) {
                    for (let j = 0; j < shapeWidth; j++) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            break;
                        }
                    }
                    if (baseCol > 0) break;
                }
                break;

            case AmbushCard.CORNERS.BOTTOM_RIGHT:
                for (let i = shapeHeight - 1; i >= 0; i--) {
                    for (let j = shapeWidth - 1; j >= 0; j--) {
                        if (shape[i][j] === 1) {
                            baseRow = i;
                            baseCol = j;
                            break;
                        }
                    }
                    if (baseCol < shapeWidth - 1) break;
                }
                break;
        }

        if (this.direction === AmbushCard.DIRECTIONS.CLOCKWISE) {
            // 顺时针移动逻辑
            if (currentRow === 0 - baseRow && currentCol < lastCol - baseCol) {
                return [currentRow, currentCol + 1]; // 向右
            }
            if (currentCol === lastCol - baseCol && currentRow < lastRow - baseRow) {
                return [currentRow + 1, currentCol]; // 向下
            }
            if (currentRow === lastRow - baseRow && currentCol > 0 - baseCol) {
                return [currentRow, currentCol - 1]; // 向左
            }
            if (currentCol === 0 - baseCol && currentRow > 0 - baseRow) {
                return [currentRow - 1, currentCol]; // 向上
            }
        } else {
            // 逆时针移动逻辑
            if (currentRow === 0 - baseRow && currentCol > 0 - baseCol) {
                return [currentRow, currentCol - 1]; // 向左
            }
            if (currentCol === 0 - baseCol && currentRow < lastRow - baseRow) {
                return [currentRow + 1, currentCol]; // 向下
            }
            if (currentRow === lastRow - baseRow && currentCol < lastCol - baseCol) {
                return [currentRow, currentCol + 1]; // 向右
            }
            if (currentCol === lastCol - baseCol && currentRow > 0 - baseRow) {
                return [currentRow - 1, currentCol]; // 向上
            }
        }

        return null; // 无法继续移动
    }

    // Remove this method to use parent's implementation
    // getSelectedShape() {
    //     return {
    //         shape: this.shape,
    //         terrainType: this.terrainType,
    //         coinReward: this.coinReward
    //     };
    // }

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

    isValidPlacement(board, row, col) {
        const shape = this.getSelectedShape().shape;
        const rows = shape.length;
        const cols = shape[0].length;

        // 检查是否超出边界
        if (row < 0 || row + rows > 11 || col < 0 || col + cols > 11) {
            return false;
        }

        // 检查每个需要放置的格子
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (shape[i][j] === 1) {
                    const currentRow = row + i;
                    const currentCol = col + j;

                    if (!board.canPlace(currentRow, currentCol)) {
                        return false;
                    }
                }
            }
        }

        // 检查是否至少有一个相邻的已填充格子
        let hasAdjacentTerrain = false;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let i = 0; i < rows && !hasAdjacentTerrain; i++) {
            for (let j = 0; j < cols && !hasAdjacentTerrain; j++) {
                if (shape[i][j] === 1) {
                    for (const [dx, dy] of directions) {
                        const newRow = row + i + dx;
                        const newCol = col + j + dy;

                        if (newRow >= 0 && newRow < 11 &&
                            newCol >= 0 && newCol < 11 &&
                            board.getCellType(newRow, newCol)) {
                            hasAdjacentTerrain = true;
                            break;
                        }
                    }
                }
            }
        }

        return hasAdjacentTerrain;
    }

    findValidPlacement(board) {
        const startPos = this.getStartPosition();
        let currentPos = startPos;
        let attempts = 0;
        const maxAttempts = 44; // 11 * 4，最多尝试一圈

        console.log('开始寻找有效位置:', {
            startPosition: startPos,
            corner: this.corner,
            direction: this.direction
        });

        while (currentPos && attempts < maxAttempts) {
            attempts++;
            console.log('尝试位置:', {
                position: currentPos,
                attempt: attempts
            });

            if (this.isValidPlacement(board, currentPos[0], currentPos[1])) {
                console.log('找到有效位置');
                return currentPos;
            }

            currentPos = this.getNextPosition(currentPos[0], currentPos[1]);
        }

        console.log('未找到有效位置，尝试次数:', attempts);
        return null;
    }

    // 新增：处理伏兵卡的自动放置
    autoPlace(board, game) {
        const validPosition = this.findValidPlacement(board);

        if (!validPosition) {
            console.log('伏兵卡无法放置，跳过');
            return false;
        }

        // 执行放置
        const [row, col] = validPosition;
        const shape = this.getSelectedShape().shape;
        const terrainType = this.getSelectedShape().terrainType;

        // 放置地形
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    board.placeTerrain(row + i, col + j, terrainType);
                }
            }
        }

        // 更新显示
        board.updateDisplay();

        return true;
    }
}

// VoidCard 类不需要修改，因为它已经继承自 AmbushCard
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