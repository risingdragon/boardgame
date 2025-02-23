class ExplorationCard {
    constructor(shapes, timeValue, monsterAttack = false) {
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
        this.shuffle();
    }

    initializeCards() {
        return [
            new ExplorationCard([
                {
                    shape: [
                        [1, 1, 1],
                        [0, 1, 0]
                    ],
                    terrainType: 'village',
                    name: 'Homestead'
                },
                {
                    shape: [
                        [1, 1, 1],
                        [0, 1, 0]
                    ],
                    terrainType: 'farm',
                    name: 'Homestead'
                }
            ], 2),

            new ExplorationCard([
                {
                    shape: [
                        [1, 1, 1, 0],
                        [0, 0, 1, 1]
                    ],
                    terrainType: 'forest',
                    name: 'Treetop Village'
                },
                {
                    shape: [
                        [1, 1, 1, 0],
                        [0, 0, 1, 1]
                    ],
                    terrainType: 'village',
                    name: 'Treetop Village'
                }
            ], 2)
        ];
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    drawCard() {
        if (this.cards.length === 0) {
            this.cards = this.initializeCards();
            this.shuffle();
        }
        return this.cards.pop();
    }
}

class ExplorationDisplay {
    constructor(game) {
        this.game = game;
    }

    updateDisplay(card) {
        const cardDisplay = document.getElementById('currentCard');
        cardDisplay.innerHTML = '';

        if (!card) return;

        const cardContainer = document.createElement('div');
        cardContainer.className = 'exploration-card';

        // 创建标题行
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';

        const cardName = document.createElement('div');
        cardName.className = 'card-name';
        cardName.textContent = card.name;

        const timeValue = document.createElement('div');
        timeValue.className = 'time-value';
        timeValue.textContent = `时限: ${card.timeValue}`;

        cardHeader.appendChild(cardName);
        cardHeader.appendChild(timeValue);
        cardContainer.appendChild(cardHeader);

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

        buttonsContainer.appendChild(rotateButton);
        buttonsContainer.appendChild(flipButton);
        cardContainer.appendChild(buttonsContainer);

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
                'water': '湖泊'
            };
            terrainLabel.textContent = terrainNames[shapeOption.terrainType];
            optionContainer.appendChild(terrainLabel);

            // 添加点击事件来选择当前形状
            optionContainer.addEventListener('click', () => {
                card.selectedShapeIndex = index;
                this.updateDisplay(card);
            });

            // 添加拖动事件
            optionContainer.addEventListener('dragstart', (e) => {
                this.game.selectedTerrainType = shapeOption.terrainType;
                card.selectedShapeIndex = index;

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

                // 设置拖动预览
                document.body.appendChild(dragPreview);
                e.dataTransfer.setDragImage(dragPreview, 0, 0);

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

        cardContainer.appendChild(optionsContainer);
        cardDisplay.appendChild(cardContainer);
    }
} 