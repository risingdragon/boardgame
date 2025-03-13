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
