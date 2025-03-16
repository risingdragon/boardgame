export class UIElementManager {
    /**
     * 创建控制提示区域
     */
    public createControlTips(boardElement: HTMLElement | null): HTMLElement | null {
        if (!boardElement) return null;

        // 创建控制提示元素
        const controlTipsElement = document.createElement('div');
        controlTipsElement.id = 'control-tips';
        controlTipsElement.style.width = '100%';
        controlTipsElement.style.padding = '10px';
        controlTipsElement.style.marginTop = '10px';
        controlTipsElement.style.backgroundColor = '#f5f5f5';
        controlTipsElement.style.borderRadius = '5px';
        controlTipsElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        controlTipsElement.style.textAlign = 'center';
        controlTipsElement.style.fontSize = '14px';

        // 检测是否为移动设备
        const isTouchDevice = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0;

        // 根据设备类型设置不同的提示内容
        if (isTouchDevice) {
            controlTipsElement.innerHTML = `
                <p><strong>操作提示:</strong> 点击选择棋子，点击下方按钮旋转或翻转，点击空白处放置</p>
            `;
        } else {
            controlTipsElement.innerHTML = `
                <p><strong>操作提示:</strong> 点击选择棋子，R键旋转，F键翻转，ESC取消选择</p>
            `;
        }

        // 添加到棋盘元素后面
        boardElement.insertAdjacentElement('afterend', controlTipsElement);
        return controlTipsElement;
    }

    /**
     * 创建跳过回合按钮
     */
    public createPassButton(onPassTurn: () => void): HTMLElement {
        const passButton = document.createElement('button');
        passButton.id = 'pass-button';
        passButton.textContent = '跳过回合 (Pass)';
        passButton.style.display = 'none'; // 初始隐藏
        passButton.style.padding = '10px 20px';
        passButton.style.margin = '10px 0';
        passButton.style.backgroundColor = '#f44336';
        passButton.style.color = 'white';
        passButton.style.border = 'none';
        passButton.style.borderRadius = '4px';
        passButton.style.fontSize = '16px';
        passButton.style.cursor = 'pointer';
        passButton.style.fontWeight = 'bold';

        // 鼠标悬停效果
        passButton.style.transition = 'background-color 0.3s';
        passButton.addEventListener('mouseover', () => {
            passButton.style.backgroundColor = '#d32f2f';
        });
        passButton.addEventListener('mouseout', () => {
            passButton.style.backgroundColor = '#f44336';
        });

        // 点击事件
        passButton.addEventListener('click', onPassTurn);

        return passButton;
    }

    /**
     * 创建移动设备的触摸控制按钮
     */
    public createMobileTouchControls(
        onRotate: () => void,
        onFlip: () => void,
        isTouchDevice?: boolean
    ): HTMLElement | null {
        // 检测是否在触摸设备上（如果未提供参数）
        if (isTouchDevice === undefined) {
            isTouchDevice = 'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                (navigator as any).msMaxTouchPoints > 0;
        }

        // 在调试时强制显示触摸控制
        const forceShowControls = true;

        if (!forceShowControls && !isTouchDevice) return null;

        // 检查是否已经存在触摸控制
        const existingControls = document.getElementById('touch-controls');
        if (existingControls) return existingControls as HTMLElement;

        // 创建控制按钮容器
        const touchControlsContainer = document.createElement('div');
        touchControlsContainer.id = 'touch-controls';
        touchControlsContainer.style.display = 'flex';
        touchControlsContainer.style.justifyContent = 'center';
        touchControlsContainer.style.gap = '10px';
        touchControlsContainer.style.marginTop = '10px';
        touchControlsContainer.style.marginBottom = '10px';
        touchControlsContainer.style.width = '100%';

        // 移动设备上显示更突出的按钮
        if (isTouchDevice) {
            touchControlsContainer.style.padding = '5px';
            touchControlsContainer.style.backgroundColor = 'rgba(0,0,0,0.05)';
            touchControlsContainer.style.borderRadius = '8px';
        }

        // 创建旋转按钮
        const rotateButton = this.createControlButton('旋转', 'R', '#2196F3', '#1976D2', onRotate, isTouchDevice);

        // 创建翻转按钮
        const flipButton = this.createControlButton('翻转', 'F', '#FF9800', '#F57C00', onFlip, isTouchDevice);

        // 添加按钮到容器
        touchControlsContainer.appendChild(rotateButton);
        touchControlsContainer.appendChild(flipButton);

        return touchControlsContainer;
    }

    /**
     * 创建新游戏按钮
     */
    public createNewGameButton(): HTMLElement {
        const newGameButton = document.createElement('button');
        newGameButton.id = 'new-game-button';
        newGameButton.textContent = '新游戏';
        newGameButton.style.padding = '5px 12px';
        newGameButton.style.margin = '0';
        newGameButton.style.backgroundColor = '#4CAF50';
        newGameButton.style.color = 'white';
        newGameButton.style.border = 'none';
        newGameButton.style.borderRadius = '4px';
        newGameButton.style.fontSize = '14px';
        newGameButton.style.cursor = 'pointer';
        newGameButton.style.fontWeight = 'bold';
        newGameButton.style.display = 'inline-block';

        // 鼠标悬停效果
        newGameButton.style.transition = 'background-color 0.3s';
        newGameButton.addEventListener('mouseover', () => {
            newGameButton.style.backgroundColor = '#45a049';
        });
        newGameButton.addEventListener('mouseout', () => {
            newGameButton.style.backgroundColor = '#4CAF50';
        });

        // 点击事件
        newGameButton.addEventListener('click', () => {
            localStorage.removeItem('blokus_game_save');
            window.location.reload();
        });

        return newGameButton;
    }

    /**
     * 创建控制按钮（辅助方法）
     */
    private createControlButton(
        text: string,
        key: string,
        bgColor: string,
        hoverColor: string,
        onClick: () => void,
        isTouchDevice: boolean
    ): HTMLElement {
        const button = document.createElement('button');
        button.textContent = isTouchDevice ? text : `${text} (${key})`;
        button.style.flex = '1';
        button.style.maxWidth = '40%';
        button.style.backgroundColor = bgColor;
        button.style.padding = isTouchDevice ? '8px 0' : '6px 0';
        button.style.fontSize = isTouchDevice ? '16px' : '14px';
        button.style.fontWeight = 'bold';
        button.style.borderRadius = '6px';
        button.style.border = `2px solid ${hoverColor}`;
        button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        button.style.color = 'white';
        button.style.cursor = 'pointer';

        button.addEventListener('click', onClick);
        return button;
    }
} 