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
            // 使用相同的动画效果收集金币
            this.animateCoinCollection(row, col, true);
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
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let i = 0; i < this.board.size; i++) {
            for (let j = 0; j < this.board.size; j++) {
                if (this.board.getCellType(i, j) === 'mountain' && this.board.hasCoin(i, j)) {
                    let allAdjacent = true;

                    for (const [dx, dy] of directions) {
                        const newRow = i + dx;
                        const newCol = j + dy;

                        if (newRow < 0 || newRow >= this.board.size ||
                            newCol < 0 || newCol >= this.board.size ||
                            !this.board.grid[newRow][newCol] ||
                            this.board.grid[newRow][newCol].type === 'mountain') {
                            allAdjacent = false;
                            break;
                        }
                    }

                    if (allAdjacent) {
                        this.animateCoinCollection(i, j);
                    }
                }
            }
        }
    }

    animateCoinCollection(row, col, isShapeReward = false) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        const coinScore = document.getElementById('coin-score');

        if (!cell || !coinScore) return;

        // 如果是高山的金币，立即移除原始金币图标
        if (!isShapeReward) {
            this.board.collectCoin(row, col);
            this.updateGridDisplay();
        }

        // 获取起点和终点位置
        const cellRect = cell.getBoundingClientRect();
        const scoreRect = coinScore.getBoundingClientRect();

        // 创建飞行的金币元素
        const flyingCoin = document.createElement('div');
        flyingCoin.className = 'flying-coin';
        document.body.appendChild(flyingCoin);

        // 设置金币初始位置和样式
        flyingCoin.style.left = `${cellRect.left + cellRect.width / 2}px`;
        flyingCoin.style.top = `${cellRect.top + cellRect.height / 2}px`;

        // 强制重排以确保初始位置生效
        flyingCoin.offsetHeight;

        // 延迟一帧设置目标位置，确保初始状态被渲染
        requestAnimationFrame(() => {
            // 添加动画类
            flyingCoin.classList.add('flying');
            // 设置目标位置
            flyingCoin.style.left = `${scoreRect.left}px`;
            flyingCoin.style.top = `${scoreRect.top}px`;
        });

        // 添加高亮效果
        setTimeout(() => {
            coinScore.classList.add('highlight');
        }, 800);

        // 动画结束后的清理
        setTimeout(() => {
            if (document.body.contains(flyingCoin)) {
                document.body.removeChild(flyingCoin);
            }
            setTimeout(() => {
                coinScore.classList.remove('highlight');
            }, 200);

            // 更新游戏状态
            this.scores.coins++;
            this.updateScoreBoard();
        }, 1000);
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
        // 更新金币分数，使用钱币图标
        document.getElementById('coin-score').innerHTML = `${this.scores.coins}<span class="coin-icon">🪙</span>`;

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
        seasonScoreElement.innerHTML = `  ${totalSeasonScore}<span class="star-icon">★</span>`;
    }

    calculateTotalScore() {
        const seasonScore = this.scores.seasons
            .filter(score => score !== -1)
            .reduce((sum, score) => sum + score, 0);
        return this.scores.coins + seasonScore;
    }

    endSeason() {
        // 先检查是否有未收集的金币
        const hasPendingCoins = this.checkAndCollectRemainingCoins();

        if (hasPendingCoins) {
            // 如果有金币正在收集，等待所有金币收集完成后再结算
            setTimeout(() => this.proceedWithSeasonEnd(), 1200); // 稍微多等一会，确保动画完成
        } else {
            // 如果没有待收集的金币，直接进行结算
            this.proceedWithSeasonEnd();
        }
    }

    checkAndCollectRemainingCoins() {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let hasCollectedCoins = false;

        for (let i = 0; i < this.board.size; i++) {
            for (let j = 0; j < this.board.size; j++) {
                if (this.board.getCellType(i, j) === 'mountain' && this.board.hasCoin(i, j)) {
                    let allAdjacent = true;

                    for (const [dx, dy] of directions) {
                        const newRow = i + dx;
                        const newCol = j + dy;

                        if (newRow < 0 || newRow >= this.board.size ||
                            newCol < 0 || newCol >= this.board.size ||
                            !this.board.grid[newRow][newCol] ||
                            this.board.grid[newRow][newCol].type === 'mountain') {
                            allAdjacent = false;
                            break;
                        }
                    }

                    if (allAdjacent) {
                        this.animateCoinCollection(i, j);
                        hasCollectedCoins = true;
                    }
                }
            }
        }

        return hasCollectedCoins;
    }

    proceedWithSeasonEnd() {
        const seasonScore = this.calculateSeasonScore();
        const activeCardTypes = {
            0: ['A', 'B'],
            1: ['B', 'C'],
            2: ['C', 'D'],
            3: ['A', 'D']
        }[this.currentSeason];

        // 初始化当前季节的声望
        this.scores.seasons[this.currentSeason] = 0;
        this.updateScoreBoard();

        // 先播放规则卡的声望收集动画
        const scoringCards = document.querySelectorAll('.scoring-card');
        let animationDelay = 0;

        scoringCards.forEach((cardElement, index) => {
            const card = this.scoringCards[index];
            const cardType = this.getCardType(card);

            if (activeCardTypes.includes(cardType)) {
                const score = card.scoringFunction(this.board);
                if (score > 0) {
                    setTimeout(() => {
                        this.animatePrestigeCollection(cardElement, score);
                    }, animationDelay);
                    animationDelay += 1000;
                }
            }
        });

        // 在规则卡声望收集完成后，播放金币转声望的动画
        setTimeout(() => {
            this.animateCoinToPrestige();
        }, animationDelay + 1000);

        // 在所有动画完成后进入下一个季节
        setTimeout(() => {
            this.currentSeason = (this.currentSeason + 1) % 4;
            this.currentTime = 0;

            if (this.currentSeason === 0) {
                this.endGame();
            }

            this.displayScoringCards();
            this.updateSeasonDisplay();
        }, animationDelay + 3000); // 延长等待时间，确保金币转声望动画完成
    }

    animatePrestigeCollection(cardElement, score) {
        const prestigeScore = document.getElementById('season-scores');
        if (!cardElement || !prestigeScore) return;

        const scoreElement = cardElement.querySelector('.current-score');
        const startRect = scoreElement.getBoundingClientRect();
        const endRect = prestigeScore.getBoundingClientRect();

        const flyingPrestige = document.createElement('div');
        flyingPrestige.className = 'flying-prestige';
        flyingPrestige.innerHTML = '★';
        document.body.appendChild(flyingPrestige);

        flyingPrestige.style.left = `${startRect.left + startRect.width / 2}px`;
        flyingPrestige.style.top = `${startRect.top + startRect.height / 2}px`;

        flyingPrestige.offsetHeight;

        requestAnimationFrame(() => {
            flyingPrestige.classList.add('flying');
            flyingPrestige.style.left = `${endRect.left}px`;
            flyingPrestige.style.top = `${endRect.top}px`;
        });

        // 在动画快结束时更新分数
        setTimeout(() => {
            prestigeScore.classList.add('highlight');
            // 更新当前季节的声望分数
            this.scores.seasons[this.currentSeason] += score;
            this.updateScoreBoard();
        }, 800);

        setTimeout(() => {
            if (document.body.contains(flyingPrestige)) {
                document.body.removeChild(flyingPrestige);
            }
            setTimeout(() => {
                prestigeScore.classList.remove('highlight');
            }, 200);
        }, 1000);
    }

    animateCoinToPrestige() {
        const coinScore = document.getElementById('coin-score');
        const prestigeScore = document.getElementById('season-scores');

        if (!coinScore || !prestigeScore || this.scores.coins === 0) return;

        const startRect = coinScore.getBoundingClientRect();
        const endRect = prestigeScore.getBoundingClientRect();

        // 为每个金币创建一个声望动画
        for (let i = 0; i < this.scores.coins; i++) {
            setTimeout(() => {
                const flyingPrestige = document.createElement('div');
                flyingPrestige.className = 'flying-prestige coin-prestige';
                flyingPrestige.innerHTML = '★';
                document.body.appendChild(flyingPrestige);

                flyingPrestige.style.left = `${startRect.left + startRect.width / 2}px`;
                flyingPrestige.style.top = `${startRect.top + startRect.height / 2}px`;

                flyingPrestige.offsetHeight;

                requestAnimationFrame(() => {
                    flyingPrestige.classList.add('flying');
                    flyingPrestige.style.left = `${endRect.left}px`;
                    flyingPrestige.style.top = `${endRect.top}px`;
                });

                // 在动画快结束时更新分数
                setTimeout(() => {
                    prestigeScore.classList.add('highlight');
                    // 每个金币增加1点声望
                    this.scores.seasons[this.currentSeason] += 1;
                    this.updateScoreBoard();
                }, 800);

                setTimeout(() => {
                    if (document.body.contains(flyingPrestige)) {
                        document.body.removeChild(flyingPrestige);
                    }
                    setTimeout(() => {
                        prestigeScore.classList.remove('highlight');
                    }, 200);
                }, 1000);
            }, i * 200); // 每个金币的动画间隔0.2秒
        }
    }

    calculateSeasonScore() {
        const activeCardTypes = {
            0: ['A', 'B'],  // spring
            1: ['B', 'C'],  // summer
            2: ['C', 'D'],  // autumn
            3: ['A', 'D']   // winter
        }[this.currentSeason];

        // 计算规则卡得分
        const rulesScore = activeCardTypes.reduce((total, type) => {
            const card = this.scoringCards.find(card => this.getCardType(card) === type);
            if (card) {
                const score = card.scoringFunction(this.board);
                return total + score;
            }
            return total;
        }, 0);

        // 加上金币带来的声望
        return rulesScore + this.scores.coins;
    }

    endGame() {
        // TODO: 实现游戏结束逻辑
    }

    initScoringCards() {
        // 使用 ScoringDeck 中定义的卡组
        const cardGroups = this.scoringDeck.getCardGroups();

        // 从每组中随机选择一张卡
        const selectedCards = cardGroups.map(group => {
            const randomIndex = Math.floor(Math.random() * group.length);
            return group[randomIndex];
        });

        // 随机分配ABCD类型
        const cardTypes = ['A', 'B', 'C', 'D'];
        this.shuffleArray(cardTypes);

        // 将选中的卡片与类型对应
        this.scoringCards = selectedCards.map((card, index) => {
            card.type = cardTypes[index];
            return card;
        });

        this.displayScoringCards();
    }

    // Fisher-Yates 洗牌算法
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 获取卡片类型的方法也需要修改
    getCardType(card) {
        return card.type;  // 直接返回卡片的类型属性
    }

    displayScoringCards() {
        const scoringCardsContainer = document.querySelector('.scoring-cards');
        if (!scoringCardsContainer) return;

        // 保存当前的分数显示
        const currentScores = new Map();
        scoringCardsContainer.querySelectorAll('.scoring-card').forEach(card => {
            const scoreElement = card.querySelector('.current-score');
            if (scoreElement) {
                const titleElement = card.querySelector('.scoring-card-title');
                if (titleElement) {
                    currentScores.set(titleElement.textContent, scoreElement.innerHTML);
                }
            }
        });

        // 清空容器
        scoringCardsContainer.innerHTML = '';
        const title = document.createElement('h3');
        title.textContent = '计分规则';
        scoringCardsContainer.appendChild(title);

        // 显示计分卡
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

            // 恢复之前的分数显示
            if (currentScores.has(card.name)) {
                const scoreElement = document.createElement('div');
                scoreElement.className = 'current-score';
                scoreElement.innerHTML = currentScores.get(card.name);
                cardElement.appendChild(scoreElement);
            }

            scoringCardsContainer.appendChild(cardElement);
        });

        // 更新分数显示
        this.updateScoringCardScores();
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

        const activeCardTypes = {
            0: ['A', 'B'],
            1: ['B', 'C'],
            2: ['C', 'D'],
            3: ['A', 'D']
        }[this.currentSeason];

        const scoringCards = scoringCardsContainer.querySelectorAll('.scoring-card');
        scoringCards.forEach((cardElement, index) => {
            const card = this.scoringCards[index];
            const cardType = this.getCardType(card);

            // 只更新当前季节活跃的规则卡分数
            if (activeCardTypes.includes(cardType)) {
                const currentScore = card.scoringFunction(this.board);

                let scoreElement = cardElement.querySelector('.current-score');
                if (!scoreElement) {
                    scoreElement = document.createElement('div');
                    scoreElement.className = 'current-score';
                    cardElement.appendChild(scoreElement);
                }

                scoreElement.innerHTML = `当前可得：${currentScore}<span class="star-icon">★</span>`;
            }
        });
    }
}

// 初始化游戏
window.onload = () => {
    const game = new CartographersGame();
}; 