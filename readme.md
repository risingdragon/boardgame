# 角斗士 (Blokus Duo)

一个使用 TypeScript 实现的经典方块棋盘游戏，带有 AI 对手。

## 游戏规则 / Game Rules

* 玩家与1个AI进行对抗 (Player vs AI)
* Each player has 21 polyominoes (shapes made of 1-5 squares)
* Players take turns placing their pieces on the board
* Subsequent pieces must touch at least one piece of the same color, but only at the corners (not edges)
* The game ends when no player can place any more pieces
* The player with the fewest remaining squares in their unused pieces wins

界面布局：
左侧是piece-tray，中间是棋盘。右边预留广告区域。
不需要滑动就能显示整个游戏区域。
2人游戏，玩家对战AI，棋盘是14*14。

## 操作说明 / How to Play

### 棋子操作

* **选择棋子**：点击左侧托盘中的任意棋子进行选择，选中的棋子会高亮显示
* **旋转棋子**：选中棋子后，按键盘的 `R` 键可以顺时针旋转棋子90度
* **翻转棋子**：选中棋子后，按键盘的 `F` 键可以水平翻转棋子

### 放置棋子

* **移动棋子**：选中棋子后，将鼠标移动到棋盘上，棋子会跟随鼠标移动
* **放置棋子**：找到合适位置后，点击鼠标左键放置棋子
* **取消选择**：如果想取消当前选择的棋子，可以按键盘的 `ESC` 键，或者点击已选中的棋子

### 游戏流程

1. 游戏开始时，玩家（蓝色）先行
2. 第一个棋子必须放在起始点
3. 之后的棋子必须至少与同色棋子的一个角相接触，但不能与同色棋子的边相接触
4. 玩家放置完棋子后，AI（红色）会自动进行其回合
5. 当双方都无法放置更多棋子时，游戏结束
6. 未使用棋子中方块数量最少的玩家获胜

## 项目结构 / Project Structure

```
blokus-game/
├── src/
│   ├── game/                   # 游戏逻辑
│   │   ├── Game.ts             # 主游戏控制器
│   │   ├── GameManager.ts      # 管理游戏状态和规则
│   │   ├── Board.ts            # 游戏棋盘实现
│   │   ├── Piece.ts            # 游戏棋子定义
│   │   ├── Player.ts           # 基础玩家类
│   │   ├── ai/                 # AI 相关代码
│   │   │   ├── AIPlayer.ts     # AI 对手实现
│   │   │   ├── BoardAnalyzer.ts # 分析棋盘状态
│   │   │   ├── MoveEvaluator.ts # 评估可能的移动
│   │   │   └── PieceUtilities.ts # 棋子操作工具
│   │   ├── PieceFactory.ts     # 创建和管理游戏棋子
│   │   ├── GameRenderer.ts     # 处理游戏棋盘渲染
│   │   ├── GameStateRenderer.ts # 渲染游戏状态和消息
│   │   ├── PieceRenderer.ts    # 处理棋子渲染
│   │   ├── UIElementManager.ts # 管理 UI 元素
│   │   └── GameEventHandler.ts # 处理用户输入事件
│   ├── index.ts                # 入口点
│   └── index.html              # 主 HTML 文件
├── webpack.config.js           # Webpack 配置
├── tsconfig.json               # TypeScript 配置
├── package.json                # 项目依赖
└── README.md                   # 本文件
```

## 核心组件

* **游戏逻辑**
  * `Game.ts`: 初始化和管理游戏的主控制器
  * `GameManager.ts`: 处理游戏流程、回合和状态管理
  * `Board.ts`: 表示游戏棋盘和放置规则
  * `Piece.ts`: 定义棋子属性和行为

* **玩家**
  * `Player.ts`: 具有棋子管理功能的基础玩家类
  * `ai/AIPlayer.ts`: 具有决策能力的 AI 对手

* **AI 组件**
  * `BoardAnalyzer.ts`: 分析棋盘状态以找到战略机会
  * `MoveEvaluator.ts`: 为 AI 评分可能的移动
  * `PieceUtilities.ts`: 棋子操作的辅助工具

* **渲染**
  * `GameRenderer.ts`: 主要渲染协调器
  * `GameStateRenderer.ts`: 渲染游戏状态和消息
  * `PieceRenderer.ts`: 处理 UI 中棋子的绘制
  * `UIElementManager.ts`: 创建和管理 UI 组件

* **用户交互**
  * `GameEventHandler.ts`: 处理用户输入和游戏事件

## 游戏特点

* 经典 Blokus 游戏玩法，拥有 21 种独特的多连方块
* 具有战略决策能力的 AI 对手
* 带有旋转和翻转功能的互动式棋子放置
* 游戏状态跟踪和计分
* 响应式 UI 设计

## 开发 / Development

```
