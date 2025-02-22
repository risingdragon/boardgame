class GameBoard {
    constructor() {
        this.size = 11;
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.coins = new Set(); // 存储未收集金币的位置
        this.initializeFixedTerrains();
    }

    initializeFixedTerrains() {
        // 设置固定的山脉位置
        const mountains = [
            [1, 3], [2, 8], [5, 5], [8, 2], [9, 7]
        ];

        // 设置固定的遗迹位置
        const ruins = [
            [1, 5], [2, 1], [2, 9], [8, 1], [8, 9], [9, 5]
        ];

        // 放置山脉并初始化金币
        mountains.forEach(([row, col]) => {
            this.grid[row][col] = {
                type: 'mountain',
                fixed: true
            };
            // 将每个山脉位置添加到金币集合中
            this.coins.add(`${row},${col}`);
        });

        // 放置遗迹 (可以被村庄覆盖获得额外分数)
        ruins.forEach(([row, col]) => {
            this.grid[row][col] = {
                type: 'ruins',
                fixed: false
            };
        });
    }

    // 检查某个位置是否可以放置新的地形
    canPlace(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }

        const cell = this.grid[row][col];
        // 如果是山脉，不能放置
        if (cell && cell.type === 'mountain') {
            return false;
        }
        // 如果是遗迹，只能放置村庄
        if (cell && cell.type === 'ruins') {
            return this.currentTerrainType === 'village';
        }
        return true;
    }

    // 获取单元格的类型
    getCellType(row, col) {
        return this.grid[row][col]?.type || null;
    }

    // 检查位置是否有未收集的金币
    hasCoin(row, col) {
        return this.coins.has(`${row},${col}`);
    }

    // 收集金币
    collectCoin(row, col) {
        return this.coins.delete(`${row},${col}`);
    }
} 