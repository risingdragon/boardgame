import { Piece } from './Piece';

export class PieceFactory {
    // Create all 21 Blokus pieces
    public createAllPieces(): Piece[] {
        const pieces: Piece[] = [];
        let id = 1;

        // I1 - 1 square (monomino)
        pieces.push(new Piece(id++, [
            [true]
        ], 'I1'));

        // I2 - 2 squares in a line (domino)
        pieces.push(new Piece(id++, [
            [true, true]
        ], 'I2'));

        // I3 - 3 squares in a line (straight tromino)
        pieces.push(new Piece(id++, [
            [true, true, true]
        ], 'I3'));

        // V3 - 3 squares in an L shape (L tromino)
        pieces.push(new Piece(id++, [
            [true, false],
            [true, true]
        ], 'V3'));

        // I4 - 4 squares in a line (straight tetromino)
        pieces.push(new Piece(id++, [
            [true, true, true, true]
        ], 'I4'));

        // L4 - 4 squares in an L shape (L tetromino)
        pieces.push(new Piece(id++, [
            [true, false, false],
            [true, true, true]
        ], 'L4'));

        // Z4 - 4 squares in a Z shape (Z tetromino)
        pieces.push(new Piece(id++, [
            [true, true, false],
            [false, true, true]
        ], 'Z4'));

        // O4 - 4 squares in a square (O tetromino)
        pieces.push(new Piece(id++, [
            [true, true],
            [true, true]
        ], 'O4'));

        // T4 - 4 squares in a T shape (T tetromino)
        pieces.push(new Piece(id++, [
            [true, true, true],
            [false, true, false]
        ], 'T4'));

        // I5 - 5 squares in a line (straight pentomino)
        pieces.push(new Piece(id++, [
            [true, true, true, true, true]
        ], 'I5'));

        // L5 - 5 squares in an L shape (L pentomino)
        pieces.push(new Piece(id++, [
            [true, false, false, false],
            [true, true, true, true]
        ], 'L5'));

        // Y5 - 5 squares in a Y shape (Y pentomino)
        pieces.push(new Piece(id++, [
            [false, true, false, false],
            [true, true, true, true]
        ], 'Y5'));

        // N5 - 5 squares in an N shape (N pentomino)
        pieces.push(new Piece(id++, [
            [false, false, true, true],
            [true, true, true, false]
        ], 'N5'));

        // P5 - 5 squares in a P shape (P pentomino)
        pieces.push(new Piece(id++, [
            [true, true],
            [true, true],
            [true, false]
        ], 'P5'));

        // U5 - 5 squares in a U shape (U pentomino)
        pieces.push(new Piece(id++, [
            [true, false, true],
            [true, true, true]
        ], 'U5'));

        // V5 - 5 squares in a V shape (V pentomino)
        pieces.push(new Piece(id++, [
            [true, false, false],
            [true, false, false],
            [true, true, true]
        ], 'V5'));

        // T5 - 5 squares in a T shape (T pentomino)
        pieces.push(new Piece(id++, [
            [true, true, true],
            [false, true, false],
            [false, true, false]
        ], 'T5'));

        // F5 - 5 squares in an F shape (F pentomino)
        pieces.push(new Piece(id++, [
            [false, true, true],
            [true, true, false],
            [false, true, false]
        ], 'F5'));

        // W5 - 5 squares in a W shape (W pentomino)
        pieces.push(new Piece(id++, [
            [true, false, false],
            [true, true, false],
            [false, true, true]
        ], 'W5'));

        // Z5 - 5 squares in a Z shape (Z pentomino)
        pieces.push(new Piece(id++, [
            [true, true, false],
            [false, true, false],
            [false, true, true]
        ], 'Z5'));

        // X5 - 5 squares in an X shape (X pentomino)
        pieces.push(new Piece(id++, [
            [false, true, false],
            [true, true, true],
            [false, true, false]
        ], 'X5'));

        return pieces;
    }
} 