class ExplorationCard {
    constructor(name, shapes, timeValue, monsterAttack = false) {
        this.name = name;
        this.shapes = shapes;       // 可选的形状数组
        this.timeValue = timeValue;  // 添加时间值属性
        this.monsterAttack = monsterAttack;  // 是否触发怪物入侵
        this.selectedShapeIndex = 0;  // 当前选择的形状索引
    }

    getSelectedShape() {
        return this.shapes[this.selectedShapeIndex];
    }

    rotateShape() {
        // 对所有形状进行旋转
        this.shapes.forEach(shapeOption => {
            const shape = shapeOption.shape;
            const rows = shape.length;
            const cols = shape[0].length;

            let rotated = Array(cols).fill().map(() => Array(rows).fill(0));

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    rotated[j][rows - 1 - i] = shape[i][j];
                }
            }

            shapeOption.shape = rotated;
        });
    }

    flipShape() {
        // 对所有形状进行翻转
        this.shapes.forEach(shapeOption => {
            const shape = shapeOption.shape;
            const rows = shape.length;
            const cols = shape[0].length;

            let flipped = Array(rows).fill().map(() => Array(cols).fill(0));

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    flipped[i][cols - 1 - j] = shape[i][j];
                }
            }

            shapeOption.shape = flipped;
        });
    }
}

class ExplorationDeck {
    constructor() {
        this.cards = this.initializeCards();
        this.discardPile = [];  // 添加弃牌堆
    }

    initializeCards() {
        return [
            new ExplorationCard(
                '田野',
                [
                    {
                        shape: [[1, 1]],
                        terrainType: 'farm',
                        coinReward: 1
                    },
                    {
                        shape: [
                            [0, 1, 0],
                            [1, 1, 1],
                            [0, 1, 0]
                        ],
                        terrainType: 'farm',
                        coinReward: 0
                    }
                ],
                1
            ),
            new ExplorationCard(
                '沼泽地',
                [
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 1, 0],
                            [0, 1, 0]
                        ],
                        terrainType: 'forest',
                        coinReward: 0
                    },
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 1, 0],
                            [0, 1, 0]
                        ],
                        terrainType: 'water',
                        coinReward: 0
                    }
                ],
                2
            ),
            new ExplorationCard(
                '果园',
                [
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 0, 1]
                        ],
                        terrainType: 'forest'
                    },
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 0, 1]
                        ],
                        terrainType: 'farm'
                    }
                ],
                2
            ),
            new ExplorationCard(
                '大江大河',
                [
                    {
                        shape: [[1, 1, 1]],
                        terrainType: 'water',
                        coinReward: 1
                    },
                    {
                        shape: [
                            [1, 1, 0],
                            [0, 1, 1],
                            [0, 0, 1]
                        ],
                        terrainType: 'water',
                        coinReward: 0
                    }
                ],
                1
            ),
            new ExplorationCard(
                '遗忘森林',
                [
                    {
                        shape: [
                            [1, 0],
                            [0, 1]
                        ],
                        terrainType: 'forest',
                        coinReward: 1
                    },
                    {
                        shape: [
                            [1, 1, 0],
                            [0, 1, 1]
                        ],
                        terrainType: 'forest',
                        coinReward: 0
                    }
                ],
                2
            ),
            new ExplorationCard(
                '家园',
                [
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 1, 0]
                        ],
                        terrainType: 'village'
                    },
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 1, 0]
                        ],
                        terrainType: 'farm'
                    }
                ],
                2
            ),
            new ExplorationCard(
                '小村庄',
                [
                    {
                        shape: [
                            [1, 1],
                            [0, 1]
                        ],
                        terrainType: 'village',
                        coinReward: 1
                    },
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 1, 1]
                        ],
                        terrainType: 'village',
                        coinReward: 0
                    }
                ],
                1
            ),
            new ExplorationCard(
                '小渔村',
                [
                    {
                        shape: [[1, 1, 1, 1]],
                        terrainType: 'village',
                        coinReward: 0
                    },
                    {
                        shape: [[1, 1, 1, 1]],
                        terrainType: 'water',
                        coinReward: 0
                    }
                ],
                1
            ),
            new ExplorationCard(
                '腹地溪流',
                [
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 0, 1],
                            [0, 0, 1]
                        ],
                        terrainType: 'farm'
                    },
                    {
                        shape: [
                            [1, 1, 1],
                            [0, 0, 1],
                            [0, 0, 1]
                        ],
                        terrainType: 'water'
                    }
                ],
                2
            ),
            new ExplorationCard(
                '树屋村庄',
                [
                    {
                        shape: [
                            [1, 1, 1, 0],
                            [0, 0, 1, 1]
                        ],
                        terrainType: 'forest'
                    },
                    {
                        shape: [
                            [1, 1, 1, 0],
                            [0, 0, 1, 1]
                        ],
                        terrainType: 'village'
                    }
                ],
                2
            ),
            new ExplorationCard(
                '时空裂隙',
                [
                    {
                        shape: [
                            [1]
                        ],
                        terrainType: 'forest'
                    },
                    {
                        shape: [
                            [1]
                        ],
                        terrainType: 'village'
                    },
                    {
                        shape: [
                            [1]
                        ],
                        terrainType: 'farm'
                    },
                    {
                        shape: [
                            [1]
                        ],
                        terrainType: 'water'
                    },
                    {
                        shape: [
                            [1]
                        ],
                        terrainType: 'monster'
                    }
                ],
                0
            ),
            new ExplorationCard(
                '神庙遗址',
                [
                    {
                        shape: [[1]],
                        terrainType: 'ruin'
                    }
                ],
                0
            ),
            new ExplorationCard(
                '哨塔遗址',
                [
                    {
                        shape: [[1]],
                        terrainType: 'ruin'
                    }
                ],
                0
            ),
        ];
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        // 打印洗牌后的卡牌顺序
        console.log('探索卡洗牌结果：',
            this.cards.map(card => ({
                name: card.name,
                timeValue: card.timeValue,
                terrainTypes: card.shapes.map(shape => shape.terrainType)
            }))
        );
    }

    drawCard() {
        if (this.cards.length === 0) {
            // 如果牌库空了，不要自动重置，让游戏逻辑处理
            return null;
        }
        const card = this.cards.shift();

        // 打印抽取的卡牌信息
        console.log('抽取卡牌：', {
            name: card.name,
            timeValue: card.timeValue,
            terrainTypes: card.shapes.map(shape => shape.terrainType)
        });

        return card;
    }

    // 添加将卡牌加入弃牌堆的方法
    discardCard(card) {
        if (card) {
            this.discardPile.push(card);
            console.log('卡牌加入弃牌堆：', card.name);
        }
    }

    // 添加重置牌库的方法（在季节准备阶段使用）
    resetDeck() {
        // 将弃牌堆中的卡牌加入牌库
        this.cards = [...this.cards, ...this.discardPile];
        this.discardPile = [];
        this.shuffle();
        console.log('重置探索卡牌库，当前卡牌数量：', this.cards.length);
    }
}

class ExplorationDisplay {
    constructor(game) {
        this.game = game;
        this.buttonsVisible = false; // 添加按钮显示状态标记
    }

    updateDisplay(card) {
        const cardDisplay = document.getElementById('currentCard');
        cardDisplay.innerHTML = '';
        cardDisplay.className = 'exploration-card';  // 直接设置类名

        if (!card) return;

        // 创建标题行
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';

        const cardName = document.createElement('div');
        cardName.className = 'card-name';
        cardName.textContent = card.name;

        const timeValue = document.createElement('div');
        timeValue.className = 'time-value';
        timeValue.textContent = `季节推进: ${card.timeValue}`;

        cardHeader.appendChild(cardName);
        cardHeader.appendChild(timeValue);
        cardDisplay.appendChild(cardHeader);  // 直接添加到 cardDisplay

        // 添加操作按钮容器
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'shape-buttons';

        const rotateButton = document.createElement('button');
        rotateButton.className = 'shape-button';
        rotateButton.innerHTML = '↻';
        rotateButton.onclick = () => {
            card.rotateShape();
            this.updateDisplay(card);
        };

        const flipButton = document.createElement('button');
        flipButton.className = 'shape-button';
        flipButton.innerHTML = '↔';
        flipButton.onclick = () => {
            card.flipShape();
            this.updateDisplay(card);
        };

        // 添加确认和取消按钮到按钮容器
        const confirmButton = document.createElement('button');
        confirmButton.className = 'shape-button confirm';
        confirmButton.innerHTML = '✓';
        confirmButton.style.display = this.buttonsVisible ? 'inline-block' : 'none';
        confirmButton.onclick = () => this.game.confirmPlacement();

        const cancelButton = document.createElement('button');
        cancelButton.className = 'shape-button cancel';
        cancelButton.innerHTML = '✕';
        cancelButton.style.display = this.buttonsVisible ? 'inline-block' : 'none';
        cancelButton.onclick = () => this.game.cancelPlacement();

        buttonsContainer.appendChild(rotateButton);
        buttonsContainer.appendChild(flipButton);
        buttonsContainer.appendChild(confirmButton);
        buttonsContainer.appendChild(cancelButton);
        cardDisplay.appendChild(buttonsContainer);

        // 存储按钮引用
        this.confirmButton = confirmButton;
        this.cancelButton = cancelButton;

        // 添加形状选项
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'terrain-options';

        card.shapes.forEach((shapeOption, index) => {
            const optionContainer = document.createElement('div');
            optionContainer.className = 'terrain-option';
            if (index === card.selectedShapeIndex) {
                optionContainer.classList.add('selected');
            }
            optionContainer.draggable = true;

            // 创建形状预览
            const previewGrid = document.createElement('div');
            previewGrid.className = 'terrain-preview-grid';

            // 计算实际的形状边界
            let minRow = shapeOption.shape.length, maxRow = 0;
            let minCol = shapeOption.shape[0].length, maxCol = 0;

            for (let i = 0; i < shapeOption.shape.length; i++) {
                for (let j = 0; j < shapeOption.shape[i].length; j++) {
                    if (shapeOption.shape[i][j] === 1) {
                        minRow = Math.min(minRow, i);
                        maxRow = Math.max(maxRow, i);
                        minCol = Math.min(minCol, j);
                        maxCol = Math.max(maxCol, j);
                    }
                }
            }

            // 填充预览网格
            for (let i = minRow; i <= maxRow; i++) {
                for (let j = minCol; j <= maxCol; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'preview-cell';
                    if (shapeOption.shape[i][j] === 1) {
                        cell.classList.add(shapeOption.terrainType);
                    } else {
                        cell.style.visibility = 'hidden';
                    }
                    previewGrid.appendChild(cell);
                }
            }

            previewGrid.style.gridTemplateColumns = `repeat(${maxCol - minCol + 1}, 1fr)`;
            optionContainer.appendChild(previewGrid);

            // 添加地形类型标签
            const terrainLabel = document.createElement('div');
            terrainLabel.className = 'terrain-type-label';
            // 根据不同地形类型显示对应的中文名称
            const terrainNames = {
                'village': '村庄',
                'farm': '农场',
                'forest': '森林',
                'water': '湖泊',
                'monster': '怪物',
                'ruin': '遗迹'  // 添加遗迹的翻译
            };
            terrainLabel.textContent = terrainNames[shapeOption.terrainType];
            optionContainer.appendChild(terrainLabel);

            // 如果有钱币奖励，添加钱币图标
            if (shapeOption.coinReward) {
                const coinIcon = document.createElement('div');
                coinIcon.className = 'coin-icon';
                coinIcon.innerHTML = '🪙';  // 使用 emoji 作为临时图标
                optionContainer.appendChild(coinIcon);
            }

            // 添加点击事件来选择当前形状
            optionContainer.addEventListener('click', () => {
                card.selectedShapeIndex = index;
                this.updateDisplay(card);
            });

            // 添加拖动事件
            optionContainer.addEventListener('dragstart', (e) => {
                this.game.selectedTerrainType = shapeOption.terrainType;
                card.selectedShapeIndex = index;

                // 获取鼠标在预览网格中的相对位置（以格子为单位）
                const rect = previewGrid.getBoundingClientRect();
                const cellSize = rect.width / (maxCol - minCol + 1);
                const gridX = Math.floor((e.clientX - rect.left) / cellSize);
                const gridY = Math.floor((e.clientY - rect.top) / cellSize);

                // 记录拖动开始时鼠标在形状内的偏移格子数
                card.dragOffset = {
                    x: gridX,
                    y: gridY
                };

                // 创建拖动时的预览元素
                const dragPreview = document.createElement('div');
                dragPreview.className = 'terrain-preview-grid drag-preview';
                dragPreview.style.gridTemplateColumns = previewGrid.style.gridTemplateColumns;

                // 只复制地形颜色块
                for (let i = minRow; i <= maxRow; i++) {
                    for (let j = minCol; j <= maxCol; j++) {
                        const cell = document.createElement('div');
                        cell.className = 'preview-cell';
                        if (shapeOption.shape[i][j] === 1) {
                            cell.classList.add(shapeOption.terrainType);
                        } else {
                            cell.style.visibility = 'hidden';
                        }
                        dragPreview.appendChild(cell);
                    }
                }

                // 设置拖动预览，偏移量为鼠标点击位置对应的格子中心
                document.body.appendChild(dragPreview);
                e.dataTransfer.setDragImage(
                    dragPreview,
                    (gridX + 0.5) * cellSize,  // 使用格子中心作为偏移点
                    (gridY + 0.5) * cellSize
                );

                // 在拖动结束后移除预览元素
                setTimeout(() => {
                    document.body.removeChild(dragPreview);
                }, 0);
            });

            optionContainer.addEventListener('dragend', () => {
                optionContainer.classList.remove('dragging');
            });

            optionsContainer.appendChild(optionContainer);
        });

        cardDisplay.appendChild(optionsContainer);  // 直接添加到 cardDisplay

        // 在卡片标题下方添加遗迹提示
        if (this.game.lastCardWasRuin) {
            const ruinReminder = document.createElement('div');
            ruinReminder.className = 'ruin-reminder';
            ruinReminder.textContent = '必须尽可能覆盖遗迹';
            ruinReminder.style.color = '#ff4444';
            ruinReminder.style.fontSize = '0.9em';
            ruinReminder.style.marginBottom = '8px';
            ruinReminder.style.textAlign = 'center';
            ruinReminder.style.width = '100%';
            cardDisplay.insertBefore(ruinReminder, optionsContainer);
        }
    }

    showActionButtons() {
        this.buttonsVisible = true;
        if (this.confirmButton) this.confirmButton.style.display = 'inline-block';
        if (this.cancelButton) this.cancelButton.style.display = 'inline-block';
    }

    hideActionButtons() {
        this.buttonsVisible = false;
        if (this.confirmButton) this.confirmButton.style.display = 'none';
        if (this.cancelButton) this.cancelButton.style.display = 'none';
    }
}