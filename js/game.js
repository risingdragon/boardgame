class CartographersGame {
    constructor() {
        this.currentSeason = 0; // 0-春 1-夏 2-秋 3-冬
        this.seasons = ['春季', '夏季', '秋季', '冬季'];
        this.score = 0;
        this.board = new GameBoard();
        this.terrainDeck = new TerrainDeck();
        this.currentCard = null;

        this.initGame();
    }

    initGame() {
        this.createGrid();
        this.initEventListeners();
        this.drawNewTerrainCard();
    }

    createGrid() {
        const mapContainer = document.getElementById('mapGrid');
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                // 根据board的初始状态设置单元格样式
                const cellType = this.board.getCellType(i, j);
                if (cellType) {
                    cell.classList.add(cellType);

                    // 如果是山脉且有未收集的金币，显示金币图标
                    if (cellType === 'mountain' && this.board.hasCoin(i, j)) {
                        cell.classList.add('has-coin');
                        const coinIcon = document.createElement('div');
                        coinIcon.className = 'coin-icon';
                        cell.appendChild(coinIcon);
                    }
                }

                mapContainer.appendChild(cell);
            }
        }
    }

    initEventListeners() {
        document.getElementById('mapGrid').addEventListener('click', (e) => {
            if (e.target.classList.contains('grid-cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.placeTerrain(row, col);
            }
        });
    }

    drawNewTerrainCard() {
        this.currentCard = this.terrainDeck.drawCard();
        this.updateTerrainCardDisplay();
    }

    updateTerrainCardDisplay() {
        const cardDisplay = document.getElementById('currentCard');
        cardDisplay.innerHTML = '';

        // 创建地形预览网格
        const previewGrid = document.createElement('div');
        previewGrid.className = 'terrain-preview-grid';

        const shape = this.currentCard.shape;
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell';
                if (shape[i][j] === 1) {
                    cell.classList.add(this.currentCard.terrainType);
                }
                previewGrid.appendChild(cell);
            }
        }

        // 添加控制按钮
        const controls = document.createElement('div');
        controls.className = 'card-controls';

        const rotateBtn = document.createElement('button');
        rotateBtn.textContent = '旋转';
        rotateBtn.onclick = () => {
            this.currentCard.rotate();
            this.updateTerrainCardDisplay();
        };

        const flipBtn = document.createElement('button');
        flipBtn.textContent = '翻转';
        flipBtn.onclick = () => {
            this.currentCard.flip();
            this.updateTerrainCardDisplay();
        };

        controls.appendChild(rotateBtn);
        controls.appendChild(flipBtn);

        cardDisplay.appendChild(previewGrid);
        cardDisplay.appendChild(controls);
    }

    isValidPlacement(row, col) {
        if (!this.currentCard) return false;

        const shape = this.currentCard.shape;
        // 检查是否超出边界
        if (row + shape.length > 11 || col + shape[0].length > 11) return false;

        // 检查每个需要放置的格子是否合法
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    if (!this.board.canPlace(row + i, col + j)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    placeTerrain(row, col) {
        if (!this.currentCard || !this.isValidPlacement(row, col)) return;

        const shape = this.currentCard.shape;
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    // 检查是否与有金币的山脉相邻
                    this.checkAndCollectAdjacentCoins(row + i, col + j);

                    this.board.grid[row + i][col + j] = {
                        type: this.currentCard.terrainType,
                        fixed: false
                    };
                }
            }
        }

        this.updateGridDisplay();
        this.drawNewTerrainCard();
    }

    updateGridDisplay() {
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            // 移除所有地形类型的类和金币
            cell.classList.remove('forest', 'village', 'farm', 'water', 'monster', 'mountain', 'ruins', 'has-coin');
            cell.innerHTML = '';

            // 添加当前地形类型的类
            const cellType = this.board.getCellType(row, col);
            if (cellType) {
                cell.classList.add(cellType);

                // 如果是山脉且有未收集的金币，显示金币图标
                if (cellType === 'mountain' && this.board.hasCoin(row, col)) {
                    cell.classList.add('has-coin');
                    const coinIcon = document.createElement('div');
                    coinIcon.className = 'coin-icon';
                    cell.appendChild(coinIcon);
                }
            }
        });
    }

    checkAndCollectAdjacentCoins(row, col) {
        // 检查相邻的四个方向
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        directions.forEach(([dx, dy]) => {
            const newRow = row + dx;
            const newCol = col + dy;

            // 检查边界
            if (newRow >= 0 && newRow < this.board.size &&
                newCol >= 0 && newCol < this.board.size) {

                // 如果相邻格子是山脉且有金币
                if (this.board.getCellType(newRow, newCol) === 'mountain' &&
                    this.board.hasCoin(newRow, newCol)) {

                    // 收集金币
                    if (this.board.collectCoin(newRow, newCol)) {
                        this.score += 1; // 增加分数
                        // 可以在这里添加金币收集的动画或提示
                    }
                }
            }
        });
    }

    checkSeasonEnd() {
        // 检查季节是否结束
        // 计算分数并更新季节
    }
}

// 初始化游戏
window.onload = () => {
    const game = new CartographersGame();
}; 