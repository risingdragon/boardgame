export class GameStateRenderer {
    private gameInfoElement: HTMLElement | null;
    private newGameButtonElement: HTMLElement | null = null;
    private passButtonElement: HTMLElement | null = null;

    constructor(gameInfoElement: HTMLElement | null) {
        this.gameInfoElement = gameInfoElement;
    }

    /**
     * 更新游戏信息显示
     */
    public updateGameInfo(
        isHumanTurn: boolean,
        hasValidMoves: boolean,
        canPlacePieces: boolean,
        passButton: HTMLElement | null = null,
        newGameButton: HTMLElement | null = null
    ): void {
        if (!this.gameInfoElement) return;

        this.passButtonElement = passButton;
        this.newGameButtonElement = newGameButton;

        if (isHumanTurn) {
            // 修改布局，使用flex布局让标题和新游戏按钮在同一行
            this.gameInfoElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2 style="margin: 0;">当前回合: 玩家 (蓝色)</h2>
                </div>
                ${!hasValidMoves && canPlacePieces ? '<p style="color: #f44336; font-weight: bold;">没有可放置的位置！请使用Pass按钮跳过回合。</p>' : ''}
            `;

            // 获取flex容器
            const headerContainer = this.gameInfoElement.querySelector('div');
            if (headerContainer && this.newGameButtonElement) {
                // 新游戏按钮添加到标题行
                headerContainer.appendChild(this.newGameButtonElement);
            }

            // 重新添加Pass按钮
            if (this.passButtonElement) {
                this.gameInfoElement.appendChild(this.passButtonElement);
            }
        } else {
            // AI回合使用相同的布局方式
            this.gameInfoElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2 style="margin: 0;">当前回合: AI (红色)</h2>
                </div>
                <p>AI正在思考...</p>
            `;

            // 获取flex容器
            const headerContainer = this.gameInfoElement.querySelector('div');
            if (headerContainer && this.newGameButtonElement) {
                // 在AI回合也显示新游戏按钮
                headerContainer.appendChild(this.newGameButtonElement);
            }
        }
    }

    /**
     * 显示游戏结束界面
     */
    public showGameOverScreen(
        humanScore: number,
        aiScore: number,
        humanPiecesLeft: number,
        aiPiecesLeft: number,
        controlTipsElement: HTMLElement | null
    ): void {
        if (!controlTipsElement) return;

        // 创建游戏结束面板
        const gameOverPanel = document.createElement('div');
        gameOverPanel.id = 'game-over-panel';
        this.setupGameOverPanelStyles(gameOverPanel);

        // 添加标题
        const titleElement = this.createGameOverTitle();

        // 添加结果
        const resultElement = this.createGameOverResult(humanScore, aiScore);

        // 添加得分
        const scoreElement = this.createGameOverScore(humanScore, aiScore);

        // 添加剩余棋子信息
        const piecesInfoElement = this.createGameOverPiecesInfo(humanPiecesLeft, aiPiecesLeft);

        // 添加重新开始按钮
        const restartButton = this.createRestartButton();

        // 组装面板
        gameOverPanel.appendChild(titleElement);
        gameOverPanel.appendChild(resultElement);
        gameOverPanel.appendChild(scoreElement);
        gameOverPanel.appendChild(piecesInfoElement);
        gameOverPanel.appendChild(restartButton);

        // 将游戏结束面板添加到控制提示下方
        controlTipsElement.insertAdjacentElement('afterend', gameOverPanel);

        // 更新游戏信息显示
        if (this.gameInfoElement) {
            this.gameInfoElement.innerHTML = `
                <h2 style="color: #f44336;">游戏已结束</h2>
                <p>请查看下方的游戏结果</p>
            `;
        }
    }

    // 私有辅助方法

    private setupGameOverPanelStyles(panel: HTMLElement): void {
        panel.style.width = '100%';
        panel.style.marginTop = '20px';
        panel.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
        panel.style.borderRadius = '10px';
        panel.style.padding = '20px';
        panel.style.color = 'white';
        panel.style.boxSizing = 'border-box';
        panel.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
        panel.style.textAlign = 'center';
    }

    private createGameOverTitle(): HTMLElement {
        const title = document.createElement('h2');
        title.textContent = '游戏结束';
        title.style.marginTop = '0';
        title.style.marginBottom = '15px';
        title.style.color = '#fff';
        title.style.fontSize = '24px';
        return title;
    }

    private createGameOverResult(humanScore: number, aiScore: number): HTMLElement {
        const result = document.createElement('div');
        result.style.fontSize = '18px';
        result.style.marginBottom = '15px';

        let resultText = '';
        if (humanScore > aiScore) {
            resultText = `🎉 恭喜，你获胜了！`;
            result.style.color = '#4CAF50';
        } else if (aiScore > humanScore) {
            resultText = `😔 AI获胜了！`;
            result.style.color = '#F44336';
        } else {
            resultText = `🤝 平局！`;
            result.style.color = '#FFC107';
        }
        result.textContent = resultText;

        return result;
    }

    private createGameOverScore(humanScore: number, aiScore: number): HTMLElement {
        const scoreElement = document.createElement('div');
        scoreElement.innerHTML = `
            <div style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                <div style="text-align: center; padding: 5px;">
                    <div style="font-size: 14px; margin-bottom: 3px;">玩家得分</div>
                    <div style="font-size: 24px; color: #3F51B5;">${humanScore}</div>
                </div>
                <div style="text-align: center; padding: 5px;">
                    <div style="font-size: 14px; margin-bottom: 3px;">AI得分</div>
                    <div style="font-size: 24px; color: #E91E63;">${aiScore}</div>
                </div>
            </div>
        `;
        return scoreElement;
    }

    private createGameOverPiecesInfo(humanPiecesLeft: number, aiPiecesLeft: number): HTMLElement {
        const piecesInfo = document.createElement('div');
        piecesInfo.style.marginBottom = '15px';
        piecesInfo.style.fontSize = '14px';
        piecesInfo.style.lineHeight = '1.5';
        piecesInfo.innerHTML = `
            <div style="margin-bottom: 5px; color: #ddd;">玩家剩余棋子: ${humanPiecesLeft} 个</div>
            <div style="color: #ddd;">AI剩余棋子: ${aiPiecesLeft} 个</div>
        `;
        return piecesInfo;
    }

    private createRestartButton(): HTMLElement {
        const button = document.createElement('button');
        button.textContent = '重新开始游戏';
        button.style.padding = '8px 20px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.fontSize = '16px';
        button.style.cursor = 'pointer';
        button.style.marginTop = '5px';
        button.style.transition = 'background-color 0.3s';

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#45a049';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#4CAF50';
        });

        button.addEventListener('click', () => {
            window.location.reload();
        });

        return button;
    }
} 