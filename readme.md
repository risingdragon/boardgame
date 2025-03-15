# 角斗士 (Blokus) - TypeScript Web Game

这是一个网页游戏，采用TypeScript开发。
游戏的名称叫《角斗士》（Blokus）

## 游戏规则 / Game Rules

* It's played on a 20×20 grid board
* 玩家与1个AI进行对抗 (Player vs AI)
* Each player has 21 polyominoes (shapes made of 1-5 squares)
* Players take turns placing their pieces on the board
* The first piece must be placed in a corner
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
2. 第一个棋子必须放在棋盘的四个角落之一
3. 之后的棋子必须至少与同色棋子的一个角相接触，但不能与同色棋子的边相接触
4. 玩家放置完棋子后，AI（红色）会自动进行其回合
5. 当双方都无法放置更多棋子时，游戏结束
6. 未使用棋子中方块数量最少的玩家获胜

## 项目结构 / Project Structure

```
blokus-game/
├── src/
│   ├── game/           # Game logic
│   │   ├── Game.ts     # Main game controller
│   │   ├── Board.ts    # Game board
│   │   ├── Piece.ts    # Game pieces
│   │   ├── Player.ts   # Player class
│   │   ├── AIPlayer.ts # AI opponent
│   │   └── PieceFactory.ts # Creates game pieces
│   ├── index.ts        # Entry point
│   └── index.html      # Main HTML file
├── webpack.config.js   # Webpack configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies
└── README.md           # This file
```

## 开发 / Development

```
npm install    # Install dependencies
npm start      # Start development server
npm run build  # Build for production
```

## 技术栈 / Technology Stack

* TypeScript
* HTML5 Canvas
* Webpack

Create the basic project structure with TypeScript configuration
Set up a web-based interface
Implement the game logic
Add game UI elements
