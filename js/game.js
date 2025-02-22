class CartographersGame {
    constructor() {
        this.currentSeason = 0; // 0-春 1-夏 2-秋 3-冬
        this.seasons = ['春季', '夏季', '秋季', '冬季'];
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

        this.initGame();
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
        const cardDisplay = document.getElementById('currentCard');
        cardDisplay.innerHTML = '';

        const card = this.currentCard;
        if (!card) return;

        const cardContainer = document.createElement('div');
        cardContainer.className = 'exploration-card';

        // 添加时限值显示
        const timeValue = document.createElement('div');
        timeValue.className = 'time-value';
        timeValue.textContent = `时限: ${card.timeValue}`;
        cardContainer.appendChild(timeValue);

        // 添加卡片名称
        if (card.shapes[0].name) {
            const cardName = document.createElement('div');
            cardName.className = 'card-name';
            cardName.textContent = card.shapes[0].name;
            cardContainer.appendChild(cardName);
        }

        // 创建地形选项容器
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'terrain-options';

        // 显示所有可选地形
        card.shapes.forEach((shapeOption, index) => {
            const optionContainer = document.createElement('div');
            optionContainer.className = 'terrain-option';

            // 创建形状预览
            const previewGrid = document.createElement('div');
            previewGrid.className = 'terrain-preview-grid';

            // 始终创建3x3的网格
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'preview-cell';
                    // 只在形状范围内的格子添加地形
                    if (i < shapeOption.shape.length &&
                        j < shapeOption.shape[0].length &&
                        shapeOption.shape[i][j] === 1) {
                        cell.classList.add(shapeOption.terrainType);
                    }
                    previewGrid.appendChild(cell);
                }
            }

            // 添加地形类型标签
            const terrainLabel = document.createElement('div');
            terrainLabel.className = 'terrain-label';
            terrainLabel.textContent = shapeOption.terrainType === 'village' ? '村庄' : '农场';

            // 添加点击事件
            optionContainer.onclick = () => {
                // 移除其他选项的选中状态
                document.querySelectorAll('.terrain-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // 添加选中状态
                optionContainer.classList.add('selected');
                this.currentCard.selectedShapeIndex = index;
            };

            optionContainer.appendChild(previewGrid);
            optionContainer.appendChild(terrainLabel);
            optionsContainer.appendChild(optionContainer);
        });

        cardContainer.appendChild(optionsContainer);

        // 添加控制按钮
        const controls = document.createElement('div');
        controls.className = 'card-controls';

        const rotateBtn = document.createElement('button');
        rotateBtn.textContent = '旋转';
        rotateBtn.onclick = () => {
            // 旋转所有形状选项
            this.currentCard.shapes.forEach(shapeOption => {
                shapeOption.shape = this.rotateMatrix(shapeOption.shape);
            });
            this.updateCardDisplay();
        };

        const flipBtn = document.createElement('button');
        flipBtn.textContent = '翻转';
        flipBtn.onclick = () => {
            // 翻转所有形状选项
            this.currentCard.shapes.forEach(shapeOption => {
                shapeOption.shape = shapeOption.shape.map(row => [...row].reverse());
            });
            this.updateCardDisplay();
        };

        controls.appendChild(rotateBtn);
        controls.appendChild(flipBtn);
        cardContainer.appendChild(controls);

        cardDisplay.appendChild(cardContainer);
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
                    this.checkAndCollectAdjacentCoins(row + i, col + j);
                }
            }
        }

        this.updateGridDisplay();
        this.currentTime += this.currentCard.timeValue; // 使用卡片的时限值

        if (this.currentTime >= this.seasonTimeLimits[this.currentSeason]) {
            this.endSeason();
        } else {
            this.drawNewCard();
        }

        this.updateSeasonDisplay();
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
                        this.scores.coins += 1;
                        this.updateScoreBoard();
                        // 可以在这里添加金币收集的动画或提示
                    }
                }
            }
        });
    }

    updateSeasonDisplay() {
        const seasonSpan = document.getElementById('current-season');
        const progressDiv = document.getElementById('season-progress');

        // 更新季节文本
        seasonSpan.textContent = this.seasons[this.currentSeason];

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
        document.getElementById('coin-score').textContent = this.scores.coins;

        // 更新季节分数
        const seasonIds = ['spring', 'summer', 'autumn', 'winter'];
        seasonIds.forEach((season, index) => {
            const scoreElement = document.getElementById(`${season}-score`);
            scoreElement.textContent = this.scores.seasons[index] === -1 ? '-' : this.scores.seasons[index];
        });

        // 更新总分
        document.getElementById('total-score').textContent = this.calculateTotalScore();
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

        this.displayScoringCards(); // 更新规则卡显示状态
    }

    calculateSeasonScore() {
        const currentSeasonName = ['spring', 'summer', 'autumn', 'winter'][this.currentSeason];
        const cardTypes = this.seasonScoringCards[currentSeasonName];

        return cardTypes.reduce((total, type) => {
            const card = this.selectedScoringCards[type];
            return total + card.scoringFunction(this.board);
        }, 0);
    }

    endGame() {
        // TODO: 实现游戏结束逻辑
    }

    initScoringCards() {
        // 抽取每种类型的计分卡
        this.selectedScoringCards = this.scoringDeck.drawCardsByType();
        this.displayScoringCards();
    }

    displayScoringCards() {
        const container = document.getElementById('scoringCards');
        container.innerHTML = '';

        // 创建一个映射，记录每种类型的规则卡在哪些季节使用
        const cardSeasons = {
            'A': ['春季', '冬季'],
            'B': ['春季', '夏季'],
            'C': ['夏季', '秋季'],
            'D': ['秋季', '冬季']
        };

        // 按照ABCD顺序显示规则卡
        ['A', 'B', 'C', 'D'].forEach(type => {
            const card = this.selectedScoringCards[type];
            const cardElement = document.createElement('div');

            // 检查当前卡片是否在当前季节生效
            const currentSeasonName = this.seasons[this.currentSeason];
            const isActive = cardSeasons[type].includes(currentSeasonName);

            cardElement.className = `scoring-card ${isActive ? 'active' : ''}`;
            cardElement.innerHTML = `
                <div class="scoring-card-title">
                    ${card.name} (${type}类)
                </div>
                <div class="scoring-card-seasons">
                    使用季节: ${cardSeasons[type].join('、')}
                </div>
                <div class="scoring-card-description">${card.description}</div>
            `;
            container.appendChild(cardElement);
        });
    }
}

// 初始化游戏
window.onload = () => {
    const game = new CartographersGame();
}; 