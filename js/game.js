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
            monsters: 0,  // 添加怪物分数
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
        this.explorationDeck = new ExplorationDeck();
        this.ambushDeck = AmbushCard.initializeCards(); // 初始化伏兵牌库
        this.shuffleArray(this.ambushDeck);  // 洗牌
        this.currentCard = null;
        this.isDragging = false;
        this.selectedTerrainType = null;
        this.explorationDisplay = new ExplorationDisplay(this);
        this.seasonNames = ['春季', '夏季', '秋季', '冬季'];
        this.tempPlacement = null; // 存储临时放置的地形
        this.isPlacing = false;   // 添加标记表示是否正在放置地形

        this.lastCardWasRuin = false;  // 添加标记
        this.initGame();
        this.initDragAndDrop();
        this.updateScoreBoard();
    }

    initGame() {
        this.createGrid();
        this.initEventListeners();
        this.initScoringCards();
        this.prepareNewSeason();  // 替换原来的 drawNewCard()
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

        // 检查是否是伏兵卡
        if (this.currentCard instanceof AmbushCard && !(this.currentCard instanceof VoidCard)) {
            this.updateCardDisplay();  // 先显示伏兵卡
            setTimeout(() => {
                this.handleAmbushCard();
            }, 1000);
            return;
        }

        // 如果抽到遗迹牌，继续抽牌
        if (this.currentCard && this.currentCard.getSelectedShape().terrainType === 'ruin') {
            console.log('抽到遗迹牌，继续抽取下一张');
            this.lastCardWasRuin = true;
            this.updateCardDisplay();  // 先显示遗迹牌
            // 将遗迹牌加入弃牌堆
            this.explorationDeck.discardCard(this.currentCard);
            setTimeout(() => {
                this.drawNewCard();  // 延迟后再抽下一张
            }, 1000);
            return;
        }

        // 检查是否需要覆盖遗迹但已无可用遗迹
        if (this.lastCardWasRuin && !this.hasUncoveredRuins()) {
            console.log('需要覆盖遗迹但已无可用遗迹，切换为时空裂隙探索卡');
            this.currentCard = this.explorationDeck.createVoidCard();
            this.lastCardWasRuin = false;  // 重置遗迹标记
            this.updateCardDisplay();
            return;
        }

        // 检查当前卡牌是否完全无法放置
        if (this.currentCard && this.board.isTerrainUnplaceable(this.currentCard.getSelectedShape().shape)) {
            console.log('当前卡牌无法放置，切换为时空裂隙探索卡');
            this.currentCard = this.explorationDeck.createVoidCard();
        }

        this.updateCardDisplay();
    }

    // Add new method to handle ambush cards
    handleAmbushCard() {
        const placed = this.currentCard.autoPlace(this.board, this);

        if (placed) {
            // 更新游戏状态
            this.currentTime += this.currentCard.timeValue;
            this.updateSeasonDisplay();
            this.checkMonsterScore();
            this.updateScoringCardScores();
        }

        // 延迟后抽下一张卡
        setTimeout(() => {
            this.currentCard = null;
            this.drawNewCard();
        }, placed ? 1000 : 0);
    }

    // 添加新方法：检查是否还有未覆盖的遗迹
    hasUncoveredRuins() {
        for (let i = 0; i < this.board.size; i++) {
            for (let j = 0; j < this.board.size; j++) {
                if (this.board.getCellType(i, j) === 'ruin') {
                    return true;  // 找到未覆盖的遗迹
                }
            }
        }
        return false;  // 没有找到未覆盖的遗迹
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
        const currentShape = this.currentCard.getSelectedShape();
        const shape = currentShape.shape;

        // 禁止放置遗迹牌
        if (currentShape.terrainType === 'ruin') return false;

        // 检查是否超出边界
        if (row + shape.length > 11 || col + shape[0].length > 11) return false;

        let coversRuin = false;  // 添加遗迹覆盖检查标记

        // 检查每个需要放置的格子是否合法
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    if (!this.board.canPlace(row + i, col + j)) {
                        return false;
                    }
                    // 检查是否覆盖了遗迹
                    if (this.board.getCellType(row + i, col + j) === 'ruin') {
                        coversRuin = true;
                    }
                }
            }
        }

        // 如果上一张是遗迹牌，必须覆盖至少一个遗迹
        if (this.lastCardWasRuin && !coversRuin) {
            return false;
        }

        return true;
    }

    placeTerrain(row, col) {
        // 如果正在放置地形，不允许新的放置
        if (this.isPlacing || !this.currentCard || !this.isValidPlacement(row, col)) return;

        const currentShape = this.currentCard.getSelectedShape();
        const shape = currentShape.shape;
        const terrainType = currentShape.terrainType;

        // 标记正在放置地形
        this.isPlacing = true;

        // 存储当前状态，以便取消时恢复
        this.tempPlacement = {
            row,
            col,
            shape,
            terrainType,
            previousState: JSON.parse(JSON.stringify(this.board.grid))
        };

        // 临时放置地形
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    this.board.placeTerrain(row + i, col + j, terrainType);
                }
            }
        }

        // 更新显示
        this.board.updateDisplay();

        // 显示确认和取消按钮
        this.explorationDisplay.showActionButtons();

        // 添加按钮事件监听器
        this.explorationDisplay.confirmButton.onclick = () => this.confirmPlacement();
        this.explorationDisplay.cancelButton.onclick = () => this.cancelPlacement();
    }

    checkMonsterScore() {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let monsterPenalty = 0;
        const countedEmptyCells = new Set();

        for (let i = 0; i < this.board.size; i++) {
            for (let j = 0; j < this.board.size; j++) {
                if (this.board.getCellType(i, j) === 'monster') {
                    // 检查四个相邻格子
                    for (const [dx, dy] of directions) {
                        const newRow = i + dx;
                        const newCol = j + dy;

                        if (newRow >= 0 && newRow < this.board.size &&
                            newCol >= 0 && newCol < this.board.size &&
                            (!this.board.grid[newRow][newCol] ||
                                this.board.getCellType(newRow, newCol) === 'ruin')) {  // 修改这里，增加对遗迹的判断
                            const cellKey = `${newRow},${newCol}`;
                            if (!countedEmptyCells.has(cellKey)) {
                                monsterPenalty++;
                                countedEmptyCells.add(cellKey);
                            }
                        }
                    }
                }
            }
        }

        const oldScore = this.scores.monsters;
        this.scores.monsters = -monsterPenalty;
        console.log(`怪物分数更新：${oldScore} -> ${this.scores.monsters} (总扣分：${monsterPenalty})`);
        this.updateScoreBoard();

        return monsterPenalty > 0;
    }

    // 修改 confirmPlacement 方法
    confirmPlacement() {
        // 如果已经在处理确认操作，直接返回
        if (this.isConfirming) return;
        if (!this.tempPlacement) return;

        // 标记正在处理确认操作
        this.isConfirming = true;

        // 隐藏按钮，防止重复点击
        this.explorationDisplay.hideActionButtons();

        let animationDelay = 0;

        // 检查是否有金币奖励
        const currentShape = this.currentCard.getSelectedShape();
        if (currentShape.coinReward) {
            this.animateCoinCollection(this.tempPlacement.row, this.tempPlacement.col, true);
            animationDelay = 1000;
        }

        // 检查高山格的金币收集
        const hasPendingCoins = this.checkAndCollectAdjacentCoins();
        if (hasPendingCoins) {
            animationDelay = 1200;
        }

        setTimeout(() => {
            this.currentTime += this.currentCard.timeValue;
            this.lastCardWasRuin = false;

            // 更新进度条显示
            this.updateSeasonDisplay();

            // 检查怪物分数
            this.checkMonsterScore();

            // 更新规则卡分数
            this.updateScoringCardScores();

            // 只有非伏兵卡才加入弃牌堆
            if (!(this.currentCard instanceof AmbushCard)) {
                this.explorationDeck.discardCard(this.currentCard);
            }
            this.currentCard = null;
            this.tempPlacement = null;
            this.isPlacing = false;
            this.isConfirming = false; // 重置确认状态

            // 检查是否需要结束季节或继续游戏
            if (this.currentTime >= this.seasonTimeLimits[this.currentSeason]) {
                this.endSeason();
            } else {
                this.drawNewCard();
            }
        }, animationDelay);
    }

    cancelPlacement() {
        if (!this.tempPlacement) return;

        // 恢复之前的状态
        this.board.grid = JSON.parse(JSON.stringify(this.tempPlacement.previousState));
        this.board.updateDisplay();

        // 隐藏按钮并重置状态
        this.explorationDisplay.hideActionButtons();
        this.tempPlacement = null;
        this.isPlacing = false;
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
            this.board.updateDisplay();
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

        // 更新怪物分数，使用怪物图标
        let monsterScoreElement = document.getElementById('monster-score');
        if (!monsterScoreElement) {
            monsterScoreElement = document.createElement('span');
            monsterScoreElement.id = 'monster-score';
            const coinDisplay = document.querySelector('.coin-display');
            coinDisplay.appendChild(monsterScoreElement);
        }
        monsterScoreElement.innerHTML = `  ${this.scores.monsters || 0}<span class="monster-icon">👾</span>`;

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
        // 计算本季节的分数
        const currentSeasonName = this.seasons[this.currentSeason];
        const scoringCardTypes = this.seasonScoringCards[currentSeasonName];
        let seasonTotal = 0;

        // 计算规则卡分数
        let ruleCardScores = [];
        scoringCardTypes.forEach(cardType => {
            // 确保 scoringDeck 存在且有 cards 属性
            if (this.scoringDeck && this.scoringDeck.cards) {
                const card = this.scoringDeck.cards.find(c => c.type === cardType);
                if (card) {
                    const score = card.calculateScore(this.board);
                    ruleCardScores.push({
                        name: card.name,
                        score: score
                    });
                    seasonTotal += score;
                }
            }
        });

        // 计算金币和怪物分数
        const coinScore = this.scores.coins || 0;
        const monsterScore = this.scores.monsters || 0;
        seasonTotal += coinScore + monsterScore;

        // 更新季节分数显示
        const seasonBox = document.getElementById(`${currentSeasonName}-score`);
        if (seasonBox) {
            // 创建详细得分内容
            const scoreDetails = document.createElement('div');
            scoreDetails.className = 'score-details';

            // 确保有规则卡分数再显示
            let ruleScoresHtml = '';
            if (ruleCardScores.length >= 2) {
                ruleScoresHtml = `
                    <div class="rule-scores">
                        <span>${ruleCardScores[0].name}: ${ruleCardScores[0].score}</span>
                        <span>${ruleCardScores[1].name}: ${ruleCardScores[1].score}</span>
                    </div>`;
            }

            scoreDetails.innerHTML = `
                ${ruleScoresHtml}
                <div class="other-scores">
                    <span>金币: ${coinScore}</span>
                    <span>怪物: ${monsterScore}</span>
                </div>
                <div class="total-score">
                    总分: ${seasonTotal}
                </div>
            `;
            seasonBox.innerHTML = '';
            seasonBox.appendChild(scoreDetails);
        }

        // 保存本季度总分
        if (!this.scores.seasons) {
            this.scores.seasons = [];
        }
        this.scores.seasons[this.currentSeason] = seasonTotal;

        // 重置金币和怪物分数（为下一季度准备）
        this.scores.coins = 0;
        this.scores.monsters = 0;

        // 进入下一季节
        this.currentSeason++;
        this.currentTime = 0;

        if (this.currentSeason < 4) {
            this.prepareNewSeason();
        } else {
            this.endGame();
        }
    }

    // 新增：季节准备阶段
    prepareNewSeason() {
        // 将弃牌堆与剩余的探索卡合并
        if (this.explorationDeck.discardPile && this.explorationDeck.discardPile.length > 0) {
            this.explorationDeck.cards = [
                ...this.explorationDeck.cards,
                ...this.explorationDeck.discardPile
            ];
            this.explorationDeck.discardPile = []; // 清空弃牌堆
        }

        // 从伏兵牌库抽一张卡
        if (this.ambushDeck.length > 0) {
            const ambushCard = this.ambushDeck.pop();
            // 将伏兵卡加入探索卡库
            this.explorationDeck.cards.push(ambushCard);
            // 洗牌
            this.shuffleArray(this.explorationDeck.cards);
        }

        // 更新显示
        this.displayScoringCards();
        this.updateSeasonDisplay();
        // 抽新卡开始新的季节
        this.drawNewCard();
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

    // 新增：怪物扣分动画函数
    animateMonsterToPrestige() {
        const monsterScore = document.getElementById('monster-score');
        const prestigeScore = document.getElementById('season-scores');

        if (!monsterScore || !prestigeScore || this.scores.monsters === 0) return;

        const startRect = monsterScore.getBoundingClientRect();
        const endRect = prestigeScore.getBoundingClientRect();

        // 为每个怪物分创建一个扣分动画
        for (let i = 0; i < Math.abs(this.scores.monsters); i++) {
            setTimeout(() => {
                const flyingPrestige = document.createElement('div');
                flyingPrestige.className = 'flying-prestige monster-prestige';
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
                    // 每个怪物扣1点声望
                    this.scores.seasons[this.currentSeason] -= 1;
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
            }, i * 200); // 每个怪物分的动画间隔0.2秒
        }
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

    endGame() {
        // 计算最终得分
        const finalScore = this.calculateTotalScore();
        alert(`游戏结束！\n最终得分：${finalScore}`);
    }

    initScoringCards() {
        // 从每组中随机选择一张卡
        this.scoringCards = this.scoringDeck.getRandomCards();

        // 随机分配ABCD类型
        const cardTypes = ['A', 'B', 'C', 'D'];
        this.shuffleArray(cardTypes);

        // 将选中的卡片与类型对应
        this.scoringCards = this.scoringCards.map((card, index) => {
            card.type = cardTypes[index];
            return card;
        });

        // 按ABCD顺序排序
        this.scoringCards.sort((a, b) => a.type.localeCompare(b.type));

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

        scoringCardsContainer.innerHTML = '';
        const title = document.createElement('h3');
        title.textContent = '计分规则';
        scoringCardsContainer.appendChild(title);

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

            // 立即添加分数显示元素
            const scoreElement = document.createElement('div');
            scoreElement.className = 'current-score';
            const currentScore = card.scoringFunction(this.board);
            scoreElement.innerHTML = `${currentScore}<span class="star-icon">★</span>`;
            cardElement.appendChild(scoreElement);

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

    initDragAndDrop() {
        const mapGrid = document.getElementById('mapGrid');

        mapGrid.addEventListener('dragenter', (e) => {
            e.preventDefault();
            mapGrid.classList.add('drag-over');
        });

        mapGrid.addEventListener('dragover', (e) => {
            e.preventDefault();
            mapGrid.classList.add('drag-over');
        });

        mapGrid.addEventListener('dragleave', (e) => {
            e.preventDefault();
            mapGrid.classList.remove('drag-over');
        });

        mapGrid.addEventListener('drop', (e) => {
            e.preventDefault();
            mapGrid.classList.remove('drag-over');

            if (!this.selectedTerrainType) {
                return;
            }

            const rect = mapGrid.getBoundingClientRect();
            const cellSize = 40; // 格子大小

            // 计算鼠标位置相对于格子的偏移
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            // 计算最近的格子中心点
            const col = Math.round(offsetX / cellSize - 0.5);
            const row = Math.round(offsetY / cellSize - 0.5);

            this.tryPlaceTerrain(row, col);
        });
    }

    tryPlaceTerrain(row, col) {
        try {
            if (!this.currentCard) {
                return;
            }

            const selectedShape = this.currentCard.getSelectedShape();
            if (!selectedShape) {
                return;
            }

            const shape = selectedShape.shape;
            const terrainType = selectedShape.terrainType;

            // 检查是否可以放置
            let canPlace = true;
            for (let i = 0; i < shape.length && canPlace; i++) {
                for (let j = 0; j < shape[i].length && canPlace; j++) {
                    if (shape[i][j] === 1) {
                        if (!this.board.canPlace(row + i, col + j)) {
                            canPlace = false;
                        }
                    }
                }
            }

            // 如果可以放置，执行放置
            if (canPlace) {
                this.placeTerrain(row, col);
            }
        } catch (error) {
            console.error('Error in tryPlaceTerrain:', error);
        }
    }

    updateScoringCardScores() {
        const scoringCardsContainer = document.querySelector('.scoring-cards');
        if (!scoringCardsContainer) return;

        // 获取显示在界面上的规则卡元素
        const displayedCards = scoringCardsContainer.querySelectorAll('.scoring-card');

        // 为每个显示的规则卡找到对应的计分卡
        displayedCards.forEach(cardElement => {
            // 获取显示的卡片名称
            const titleElement = cardElement.querySelector('.scoring-card-title');
            if (!titleElement) return;
            const displayedName = titleElement.textContent;

            // 在已选择的规则卡中找到对应的卡片
            const matchingCard = this.scoringCards.find(card => card.name === displayedName);
            if (!matchingCard) return;

            // 计算并显示分数
            const currentScore = matchingCard.scoringFunction(this.board);

            let scoreElement = cardElement.querySelector('.current-score');
            if (!scoreElement) {
                scoreElement = document.createElement('div');
                scoreElement.className = 'current-score';
                cardElement.appendChild(scoreElement);
            }

            scoreElement.innerHTML = `${currentScore}<span class="star-icon">★</span>`;
        });
    }

    // 更新得分显示
    updateSeasonScore(season, score) {
        const scoreElement = document.getElementById(`${season}-score`);
        if (scoreElement) {
            scoreElement.textContent = score >= 0 ? score : '-';
        }
    }
}

// 初始化游戏
window.onload = () => {
    const game = new CartographersGame();
};