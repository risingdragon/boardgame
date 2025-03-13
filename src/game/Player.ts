import { Piece } from './Piece';

export class Player {
    public name: string;
    public color: string;
    protected pieces: Piece[];
    protected availablePieces: Piece[];
    protected placedPieces: Piece[];

    constructor(name: string, color: string, pieces: Piece[]) {
        this.name = name;
        this.color = color;
        this.pieces = pieces;
        this.availablePieces = [...pieces]; // All pieces are available at start
        this.placedPieces = [];
    }

    public getAvailablePieces(): Piece[] {
        return this.availablePieces;
    }

    public getPiece(id: number): Piece | undefined {
        return this.availablePieces.find(piece => piece.id === id);
    }

    public placePiece(pieceId: number): Piece | undefined {
        const pieceIndex = this.availablePieces.findIndex(piece => piece.id === pieceId);

        if (pieceIndex === -1) {
            return undefined;
        }

        const piece = this.availablePieces[pieceIndex];
        this.availablePieces.splice(pieceIndex, 1);
        this.placedPieces.push(piece);

        return piece;
    }

    public getScore(): number {
        // In Blokus, score is calculated by summing the number of squares in all unused pieces
        // Lower score is better
        return this.availablePieces.reduce((total, piece) => {
            return total + piece.getSize();
        }, 0);
    }

    public getPlacedPieces(): Piece[] {
        return this.placedPieces;
    }

    public canPlacePieces(): boolean {
        return this.availablePieces.length > 0;
    }

    public rotatePiece(pieceId: number): Piece | undefined {
        const piece = this.getPiece(pieceId);
        if (piece) {
            piece.rotate();
            return piece;
        }
        return undefined;
    }

    public flipPiece(pieceId: number): Piece | undefined {
        const piece = this.getPiece(pieceId);
        if (piece) {
            piece.flip();
            return piece;
        }
        return undefined;
    }
} 