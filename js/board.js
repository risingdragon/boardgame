class GameBoard {
    static RUINS_POSITIONS = [
        [1, 5], [2, 1], [2, 9], [8, 1], [8, 9], [9, 5]
    ];

    static MOUNTAIN_POSITIONS = [
        [1, 3], [2, 8], [5, 5], [8, 2], [9, 7]
    ];

    constructor() {
        this.size = 11;
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.coins = new Set(); // 存储未收集金币的位置
        this.initializeFixedTerrains();
    }

    initializeFixedTerrains() {
        // 放置山脉并初始化金币
        GameBoard.MOUNTAIN_POSITIONS.forEach(([row, col]) => {
            this.grid[row][col] = {
                type: 'mountain',
                fixed: true
            };
            this.coins.add(`${row},${col}`);
        });

        // 放置遗迹（修改类型名称为 'ruin'）
        GameBoard.RUINS_POSITIONS.forEach(([row, col]) => {
            this.grid[row][col] = {
                type: 'ruin',
                fixed: false
            };
        });
    }

    canPlace(row, col) {
        // 检查边界
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }

        // 如果是空格子，可以放置
        if (!this.grid[row][col]) {
            return true;
        }

        // 如果是遗迹（检查两种可能的类型名称），可以放置
        if (this.grid[row][col].type === 'ruin') {
            return true;
        }

        // 其他已有地形的格子不能放置
        return false;
    }

    // 获取单元格的类型
    getCellType(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
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

    // 检查当前是否是遗迹
    isCurrentlyRuin(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }
        return this.grid[row][col]?.type === 'ruin';
    }

    // 检查是否曾经是遗迹（包括当前是遗迹的情况）
    wasRuin(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }
        const cell = this.grid[row][col];
        return cell?.ruins === true || cell?.type === 'ruin';
    }

    placeTerrain(row, col, type) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }

        // 如果是固定地形，不能放置
        if (this.grid[row][col]?.fixed) {
            return false;
        }

        // 保存是否是遗迹的信息
        const wasRuin = this.isCurrentlyRuin(row, col);  // 使用 isCurrentlyRuin 方法检查

        // 设置新地形，同时保留遗迹标记
        this.grid[row][col] = {
            type: type,
            fixed: false,
            ruins: wasRuin  // 添加遗迹标记
        };

        return true;
    }

    updateDisplay() {
        const mapGrid = document.getElementById('mapGrid');
        if (!mapGrid) return;

        const cells = mapGrid.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            // 移除所有地形类型的类和金币
            cell.classList.remove('forest', 'village', 'farm', 'water', 'monster', 'mountain', 'ruin');
            cell.innerHTML = '';

            // 获取当前格子的地形信息
            const terrain = this.grid[row][col];
            if (terrain) {
                cell.classList.add(terrain.type);

                // 如果是山脉且有未收集的金币，显示金币图标
                if (terrain.type === 'mountain' && this.hasCoin(row, col)) {
                    cell.classList.add('has-coin');
                    const coinIcon = document.createElement('div');
                    coinIcon.className = 'coin-icon';
                    cell.appendChild(coinIcon);
                }

                // 如果格子有遗迹标记，添加遗迹属性
                if (terrain.ruins) {
                    cell.setAttribute('data-ruins', 'true');
                } else {
                    cell.removeAttribute('data-ruins');
                }
            }
        });
    }
}