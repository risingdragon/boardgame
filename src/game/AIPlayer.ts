import { Player } from './Player';
import { Piece } from './Piece';
import { Board } from './Board';

export class AIPlayer extends Player {
    constructor(name: string, color: string, pieces: Piece[]) {
        super(name, color, pieces);
    }

    // Method to decide the AI's move
    public makeMove(board: Board): { piece: Piece, x: number, y: number } | null {
        // This is a simple implementation that can be enhanced later
        // Try to place each available piece in a valid position
        for (const piece of this.availablePieces) {
            // Try different orientations
            for (let rotation = 0; rotation < 4; rotation++) {
                for (let flip = 0; flip < 2; flip++) {
                    // Try each position on the board
                    for (let y = 0; y < 20; y++) {
                        for (let x = 0; x < 20; x++) {
                            // Check if the piece can be placed here
                            if (board.isValidPlacement(piece, x, y, 2)) { // Assuming AI is player 2
                                return { piece, x, y };
                            }
                        }
                    }

                    // Try flipping the piece
                    if (flip === 0) {
                        piece.flip();
                    }
                }

                // Rotate for next attempt
                piece.rotate();
            }
        }

        // No valid move found
        return null;
    }
} 