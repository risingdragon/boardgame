class CartographersGame {
    constructor() {
        this.currentSeason = 0; // 0: spring, 1: summer, 2: autumn, 3: winter
        this.seasons = ['spring', 'summer', 'autumn', 'winter'];
        this.score = 0;
        this.board = new GameBoard();
        this.seasonTimeLimits = {
            0: 8,  // 春季 8个时间单位
            1: 8,  // 夏季 8个时间单位
            2: 7,  // 秋季 7个时间单位
            3: 6   // 冬季 6个时间单位
        };
        this.currentTime = 0;
        this.scores = {
            coins: 0,
            seasons: [-1, -1, -1, -1], // -1 表示未计分
            total: 0
        };
        this.scoringDeck = new ScoringDeck();
        this.seasonScoringCards = {
            spring: ['A', 'B'],     // 春季使用A、B类规则卡
            summer: ['B', 'C'],     // 夏季使用B、C类规则卡
            autumn: ['C', 'D'],     // 秋季使用C、D类规则卡
            winter: ['A', 'D']      // 冬季使用A、D类规则卡
        };
        this.selectedScoringCards = null;
        this.initScoringCards();
        this.explorationDeck = new ExplorationDeck();
        this.currentCard = null;
        this.isDragging = false;
        this.selectedTerrainType = null;
        this.explorationDisplay = new ExplorationDisplay(this);
        this.seasonNames = ['春季', '夏季', '秋季', '冬季'];

        this.initGame();
        this.initDragAndDrop();
        this.drawNewCard();
        this.initScoringCards();
        this.updateScoreBoard();
    }

    initGame() {
        this.createGrid();
        this.initEventListeners();
        this.initScoringCards();
        this.drawNewCard(); // 抽取第一张探索牌
        this.updateSeasonDisplay();
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
        const mapGrid = document.getElementById('mapGrid');
        mapGrid.addEventListener('click', (e) => {
            const cell = e.target;
            if (cell.classList.contains('grid-cell')) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.placeTerrain(row, col);
            }
        });
    }

    drawNewCard() {
        this.currentCard = this.explorationDeck.drawCard();
        this.updateCardDisplay();
    }

    updateCardDisplay() {
        this.explorationDisplay.updateDisplay(this.currentCard);
    }

    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const result = Array(cols).fill().map(() => Array(rows).fill(0));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[j][rows - 1 - i] = matrix[i][j];
            }
        }
        return result;
    }

    isValidPlacement(row, col) {
        if (!this.currentCard) return false;

        const shape = this.currentCard.getSelectedShape().shape;
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

        const currentShape = this.currentCard.getSelectedShape();
        const shape = currentShape.shape;
        const terrainType = currentShape.terrainType;

        // 放置地形
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    this.board.grid[row + i][col + j] = {
                        type: terrainType,
                        fixed: false
                    };
                }
            }
        }

        // 检查是否有金币奖励
        if (currentShape.coinReward) {
            this.scores.coins += 1;
            this.updateScoreBoard();

            // 创建金币收集动画
            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                const coinIcon = document.createElement('div');
                coinIcon.className = 'coin-icon coin-collected';
                cell.appendChild(coinIcon);

                setTimeout(() => {
                    if (coinIcon.parentNode === cell) {
                        cell.removeChild(coinIcon);
                    }
                }, 500);
            }
        }

        // 检查高山格的金币收集
        this.checkAndCollectAdjacentCoins();

        this.updateGridDisplay();
        this.currentTime += this.currentCard.timeValue;

        if (this.currentTime >= this.seasonTimeLimits[this.currentSeason]) {
            this.endSeason();
        } else {
            this.drawNewCard();
        }

        this.updateSeasonDisplay();
        this.updateScoringCardScores();
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

    checkAndCollectAdjacentCoins() {
        // 检查相邻的四个方向
        const directions = [
            [-1, 0], // 上
            [1, 0],  // 下
            [0, -1], // 左
            [0, 1]   // 右
        ];

        // 检查每个山脉格子
        for (let i = 0; i < this.board.size; i++) {
            for (let j = 0; j < this.board.size; j++) {
                // 如果是山脉且还有金币
                if (this.board.getCellType(i, j) === 'mountain' && this.board.hasCoin(i, j)) {
                    // 检查四个相邻格子是否都有地形
                    let allAdjacent = true;

                    for (const [dx, dy] of directions) {
                        const newRow = i + dx;
                        const newCol = j + dy;

                        // 如果相邻格子超出边界或没有地形，则不满足条件
                        if (newRow < 0 || newRow >= this.board.size ||
                            newCol < 0 || newCol >= this.board.size ||
                            !this.board.grid[newRow][newCol] ||  // 检查格子是否为空
                            this.board.grid[newRow][newCol].type === 'mountain') {  // 山脉不算作有效地形
                            allAdjacent = false;
                            break;
                        }
                    }

                    // 只有当四个相邻格子都有地形时才收集金币
                    if (allAdjacent) {
                        // 创建金币收集动画
                        const cell = document.querySelector(`.grid-cell[data-row="${i}"][data-col="${j}"]`);
                        if (cell) {
                            const coinIcon = document.createElement('div');
                            coinIcon.className = 'coin-icon coin-collected';
                            cell.appendChild(coinIcon);

                            setTimeout(() => {
                                if (coinIcon.parentNode === cell) {
                                    cell.removeChild(coinIcon);
                                }
                            }, 500);
                        }

                        // 更新金币数量和显示
                        this.scores.coins += 1;
                        this.updateScoreBoard();

                        // 移除这个山脉格的金币标记
                        this.board.collectCoin(i, j);
                    }
                }
            }
        }
    }

    updateSeasonDisplay() {
        const seasonSpan = document.getElementById('current-season');
        const progressDiv = document.getElementById('season-progress');

        // 更新季节文本为中文
        seasonSpan.textContent = this.seasonNames[this.currentSeason];

        // 更新进度条
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = progressDiv.querySelector('.progress-text');

        const currentTimeLimit = this.seasonTimeLimits[this.currentSeason];
        const progress = (this.currentTime / currentTimeLimit) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${this.currentTime}/${currentTimeLimit}`;
    }

    updateScoreBoard() {
        // 更新金币分数
        document.getElementById('coin-score').textContent = `¥${this.scores.coins}`;

        // 计算已结算季节的总分
        const totalSeasonScore = this.scores.seasons
            .filter(score => score !== -1)
            .reduce((sum, score) => sum + score, 0);

        // 更新声望显示
        let seasonScoreElement = document.getElementById('season-scores');
        if (!seasonScoreElement) {
            seasonScoreElement = document.createElement('span');
            seasonScoreElement.id = 'season-scores';
            const coinDisplay = document.querySelector('.coin-display');
            coinDisplay.appendChild(seasonScoreElement);
        }
        // 使用声望，去掉括号
        seasonScoreElement.textContent = `  ${totalSeasonScore}声望`;
    }

    calculateTotalScore() {
        const seasonScore = this.scores.seasons
            .filter(score => score !== -1)
            .reduce((sum, score) => sum + score, 0);
        return this.scores.coins + seasonScore;
    }

    endSeason() {
        // 计算当前季节分数
        const seasonScore = this.calculateSeasonScore();
        this.scores.seasons[this.currentSeason] = seasonScore;
        this.updateScoreBoard();

        // 进入下一个季节
        this.currentSeason = (this.currentSeason + 1) % 4;
        this.currentTime = 0;

        if (this.currentSeason === 0) {
            this.endGame();
        }

        this.displayScoringCards();
        this.updateSeasonDisplay();
    }

    calculateSeasonScore() {
        const activeCardTypes = {
            0: ['A', 'B'],  // spring
            1: ['B', 'C'],  // summer
            2: ['C', 'D'],  // autumn
            3: ['A', 'D']   // winter
        }[this.currentSeason];

        return activeCardTypes.reduce((total, type) => {
            const card = this.scoringCards.find(card => this.getCardType(card) === type);
            if (card) {
                const score = card.scoringFunction(this.board);
                return total + score;
            }
            return total;
        }, 0);
    }

    endGame() {
        // TODO: 实现游戏结束逻辑
    }

    initScoringCards() {
        this.scoringCards = [
            this.scoringDeck.cardsByType.A[0],
            this.scoringDeck.cardsByType.B[0],
            this.scoringDeck.cardsByType.C[0],
            this.scoringDeck.cardsByType.D[0]
        ];
        this.displayScoringCards();
    }

    displayScoringCards() {
        const scoringCardsContainer = document.querySelector('.scoring-cards');
        if (!scoringCardsContainer) return;

        scoringCardsContainer.innerHTML = '';

        // 添加标题
        const title = document.createElement('h3');
        title.textContent = '计分规则';
        scoringCardsContainer.appendChild(title);

        // 显示当前激活的计分卡
        this.scoringCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'scoring-card';

            // 检查是否在当前季节生效
            const isActive = this.isCardActiveInCurrentSeason(card);
            if (isActive) {
                cardElement.classList.add('active-card');
            }

            cardElement.innerHTML = `
                <div class="scoring-card-title">${card.name}</div>
                <div class="scoring-card-description">${card.description}</div>
            `;
            scoringCardsContainer.appendChild(cardElement);
        });
    }

    isCardActiveInCurrentSeason(card) {
        // 根据卡片类型和当前季节判断是否生效
        const seasonRules = {
            0: ['A', 'B'],  // spring
            1: ['B', 'C'],  // summer
            2: ['C', 'D'],  // autumn
            3: ['A', 'D']   // winter
        };

        // 从卡片名称中获取类型
        const cardType = this.getCardType(card);
        return seasonRules[this.currentSeason].includes(cardType);
    }

    getCardType(card) {
        for (const [type, cards] of Object.entries(this.scoringDeck.cardsByType)) {
            if (cards.some(c => c.name === card.name)) {
                return type;
            }
        }
        return null;
    }

    initDragAndDrop() {
        const mapGrid = document.getElementById('mapGrid');

        // 必须阻止默认行为才能接受拖放
        mapGrid.addEventListener('dragenter', (e) => {
            e.preventDefault();
            mapGrid.classList.add('drag-over');
        });

        mapGrid.addEventListener('dragover', (e) => {
            e.preventDefault(); // 这行很重要，移除禁止标记
            mapGrid.classList.add('drag-over');
        });

        mapGrid.addEventListener('dragleave', (e) => {
            e.preventDefault();
            mapGrid.classList.remove('drag-over');
        });

        mapGrid.addEventListener('drop', (e) => {
            e.preventDefault();
            mapGrid.classList.remove('drag-over');
            console.log('Drop event triggered'); // 调试日志

            if (!this.selectedTerrainType) {
                console.log('No terrain type selected');
                return;
            }

            const rect = mapGrid.getBoundingClientRect();
            const cellSize = 40;
            const row = Math.floor((e.clientY - rect.top) / cellSize);
            const col = Math.floor((e.clientX - rect.left) / cellSize);

            console.log('Drop position:', { row, col });
            console.log('Selected terrain:', this.selectedTerrainType);

            this.tryPlaceTerrain(row, col);
        });
    }

    tryPlaceTerrain(row, col) {
        try {
            if (!this.currentCard) {
                console.log('No current card');
                return;
            }

            const selectedShape = this.currentCard.getSelectedShape();
            if (!selectedShape) {
                console.log('No shape selected');
                return;
            }

            const shape = selectedShape.shape;
            const terrainType = selectedShape.terrainType;

            console.log('Trying to place:', {
                shape,
                terrainType,
                at: { row, col }
            });

            // 检查是否可以放置
            let canPlace = true;
            for (let i = 0; i < shape.length && canPlace; i++) {
                for (let j = 0; j < shape[i].length && canPlace; j++) {
                    if (shape[i][j] === 1) {
                        if (!this.board.canPlace(row + i, col + j)) {
                            console.log('Cannot place at:', row + i, col + j);
                            canPlace = false;
                        }
                    }
                }
            }

            // 如果可以放置，执行放置
            if (canPlace) {
                console.log('Placing terrain');
                this.placeTerrain(row, col);
            } else {
                console.log('Cannot place terrain at this location');
            }
        } catch (error) {
            console.error('Error in tryPlaceTerrain:', error);
        }
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.isDragging) return;

        const cell = e.target;
        if (!cell.classList.contains('grid-cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.canPlaceShape(row, col)) {
            this.placeShape(row, col);

            // 检查并处理钱币奖励
            if (this.currentCard &&
                this.currentCard.shapes[this.currentCard.selectedShapeIndex].coinReward) {
                this.collectCoin(cell);
            }

            this.drawNewCard();
        }
    }

    collectCoin(cell) {
        // 创建金币收集动画
        const coinIcon = document.createElement('div');
        coinIcon.className = 'coin-icon coin-collected';
        cell.appendChild(coinIcon);

        // 更新分数
        this.scores.coins++;
        this.updateScoreDisplay();

        // 动画结束后移除金币图标
        setTimeout(() => {
            if (coinIcon.parentNode === cell) {
                cell.removeChild(coinIcon);
            }
        }, 500);
    }

    updateScoreDisplay() {
        const coinScoreElement = document.getElementById('coin-score');
        if (coinScoreElement) {
            coinScoreElement.textContent = this.scores.coins;
        }
    }

    updateScoringCardScores() {
        const scoringCardsContainer = document.querySelector('.scoring-cards');
        if (!scoringCardsContainer) return;

        // 获取当前季节的活跃规则卡
        const activeCardTypes = {
            0: ['A', 'B'],  // spring
            1: ['B', 'C'],  // summer
            2: ['C', 'D'],  // autumn
            3: ['A', 'D']   // winter
        }[this.currentSeason];

        // 更新每个规则卡的显示
        const scoringCards = scoringCardsContainer.querySelectorAll('.scoring-card');
        scoringCards.forEach((cardElement, index) => {
            const card = this.scoringCards[index];
            const cardType = this.getCardType(card);

            if (activeCardTypes.includes(cardType)) {
                const currentScore = card.scoringFunction(this.board);

                // 移除旧的分数显示（如果存在）
                const oldScore = cardElement.querySelector('.current-score');
                if (oldScore) {
                    oldScore.remove();
                }

                // 添加新的分数显示，使用"声望"替代"分"
                const scoreElement = document.createElement('div');
                scoreElement.className = 'current-score';
                scoreElement.textContent = `当前可得：${currentScore}声望`;
                cardElement.appendChild(scoreElement);
            }
        });
    }
}

// 初始化游戏
window.onload = () => {
    const game = new CartographersGame();
}; 