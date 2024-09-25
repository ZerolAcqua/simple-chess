/**
 * This file is modified from the original source code `script.js` in `lhartikk/simple-chess-ai`
 * I rewrite the AI part, update the dependencies and fix some bugs
 */

import { Chess, Piece } from 'chess.js';


function minimaxRoot(depth: number, game: Chess, isMaximisingPlayer: boolean): string | undefined {
	const newGameMoves = game.moves();
	let bestMove = -9999;
	let bestMoveFound: string | undefined;

	for (let i = 0; i < newGameMoves.length; i++) {
		const newGameMove = newGameMoves[i];
		game.move(newGameMove);
		const value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
		game.undo();
		if (value >= bestMove) {
			bestMove = value;
			bestMoveFound = newGameMove;
		}
	}
	return bestMoveFound;
}

function minimax(depth: number, game: Chess, alpha: number, beta: number, isMaximisingPlayer: boolean): number {
	if (depth === 0) {
		return -evaluateBoard(game.board());
	}

	const newGameMoves = game.moves();

	if (isMaximisingPlayer) {
		let bestMove = -9999;
		for (let i = 0; i < newGameMoves.length; i++) {
			game.move(newGameMoves[i]);
			bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
			game.undo();
			alpha = Math.max(alpha, bestMove);
			if (beta <= alpha) {
				return bestMove;
			}
		}
		return bestMove;
	} else {
		let bestMove = 9999;
		for (let i = 0; i < newGameMoves.length; i++) {
			game.move(newGameMoves[i]);
			bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
			game.undo();
			beta = Math.min(beta, bestMove);
			if (beta <= alpha) {
				return bestMove;
			}
		}
		return bestMove;
	}
}

function evaluateBoard(board: Piece[][]): number {
	let totalEvaluation = 0;
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			totalEvaluation += getPieceValue(board[i][j], i, j);
		}
	}
	return totalEvaluation;
}

function reverseArray(array: number[][]): number[][] {
	return array.slice().reverse();
}

const pawnEvalWhite: number[][] = [
	[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
	[5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
	[1.0, 1.0, 2.0, 3.0, 3.0, 2.0, 1.0, 1.0],
	[0.5, 0.5, 1.0, 2.5, 2.5, 1.0, 0.5, 0.5],
	[0.0, 0.0, 0.0, 2.0, 2.0, 0.0, 0.0, 0.0],
	[0.5, -0.5, -1.0, 0.0, 0.0, -1.0, -0.5, 0.5],
	[0.5, 1.0, 1.0, -2.0, -2.0, 1.0, 1.0, 0.5],
	[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
];

const pawnEvalBlack: number[][] = reverseArray(pawnEvalWhite);

const knightEval: number[][] = [
	[-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
	[-4.0, -2.0, 0.0, 0.0, 0.0, 0.0, -2.0, -4.0],
	[-3.0, 0.0, 1.0, 1.5, 1.5, 1.0, 0.0, -3.0],
	[-3.0, 0.5, 1.5, 2.0, 2.0, 1.5, 0.5, -3.0],
	[-3.0, 0.0, 1.5, 2.0, 2.0, 1.5, 0.0, -3.0],
	[-3.0, 0.5, 1.0, 1.5, 1.5, 1.0, 0.5, -3.0],
	[-4.0, -2.0, 0.0, 0.5, 0.5, 0.0, -2.0, -4.0],
	[-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];

const bishopEvalWhite: number[][] = [
	[-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
	[-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
	[-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
	[-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
	[-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
	[-1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
	[-1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, -1.0],
	[-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const bishopEvalBlack: number[][] = reverseArray(bishopEvalWhite);

const rookEvalWhite: number[][] = [
	[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
	[0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5],
	[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
	[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
	[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
	[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
	[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
	[0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0]
];

const rookEvalBlack: number[][] = reverseArray(rookEvalWhite);

const evalQueen: number[][] = [
	[-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
	[-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
	[-1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
	[-0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
	[0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
	[-1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
	[-1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0],
	[-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

const kingEvalWhite: number[][] = [
	[-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	[-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	[-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	[-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	[-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
	[-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
	[2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0],
	[2.0, 3.0, 1.0, 0.0, 0.0, 1.0, 3.0, 2.0]
];

const kingEvalBlack: number[][] = reverseArray(kingEvalWhite);

function getPieceValue(piece: Piece | null, x: number, y: number): number {
	if (piece === null) { return 0; } const getAbsoluteValue = (piece: Piece, isWhite: boolean, x: number, y: number): number => { switch (piece.type) { case 'p': return 10 + (isWhite ? pawnEvalWhite[y][x] : pawnEvalBlack[y][x]); case 'r': return 50 + (isWhite ? rookEvalWhite[y][x] : rookEvalBlack[y][x]); case 'n': return 30 + knightEval[y][x]; case 'b': return 30 + (isWhite ? bishopEvalWhite[y][x] : bishopEvalBlack[y][x]); case 'q': return 90 + evalQueen[y][x]; case 'k': return 900 + (isWhite ? kingEvalWhite[y][x] : kingEvalBlack[y][x]); default: throw new Error("Unknown piece type: " + piece.type); } };

	const absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
	return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

export function getBestMove(game: Chess): string | undefined {
	const depth = 3;
	const bestMove = minimaxRoot(depth, game, true);
	return bestMove;
}