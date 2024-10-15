/**
 * This file is modified from the original source code `script.js` in `lhartikk/simple-chess-ai`
 * I rewrite the AI part, update the dependencies and fix some bugs
 */


import { Chess, Piece, Move } from 'chess.js';

enum GameStage {
	Opening,
	Middle,
	Ending,
}

type PosEval = {
	p: number[][];
	n: number[][];
	b: number[][];
	r: number[][];
	q: number[][];
	k: number[][];
};

type SearchOption = {
	testTFR?: boolean;
	maxSearchNum?: number;
	moveThreshold?: number;
};

export function getRandomMove(chess: Chess): Move {
	const moves = chess.moves({ verbose: true });
	return moves[Math.floor(Math.random() * moves.length)];
}

export function getStupidMove(chess: Chess): Move {
	// stupid bot move
	let moves = chess.moves({ verbose: true });
	let tmpMoves = moves.filter(move => move.san.includes('#'));
	if (tmpMoves.length === 0) tmpMoves = moves.filter(move => move.san.includes('+'));
	if (tmpMoves.length === 0) tmpMoves = moves.filter(move => move.flags.includes('c'));
	if (tmpMoves.length > 0) moves = tmpMoves;

	return moves[Math.floor(Math.random() * moves.length)];
}

let stage = GameStage.Opening;
let curSearchNum = 0;
let testTFR = false;
let maxSearchNum = 30000;
let moveThreshold = 50;

export function getBestMove(chess: Chess, depth: number = 3, searchOption?: SearchOption): Move {
	let isWhite = chess.turn() === 'w';
	curSearchNum = 0;
	testTFR = searchOption?.testTFR ?? false;
	maxSearchNum = searchOption?.maxSearchNum ?? 30000;
	moveThreshold = searchOption?.moveThreshold ?? 50;

	let moves = chess.moves({ verbose: true });
	getStage(chess);

	let bestMove = moves[0];
	let bestScore = isWhite ? -Infinity : Infinity;
	moves = moves.slice(0, moveThreshold);
	for (const move of moves) {
		chess.move(move);
		const score = minimax(chess, depth - 1, -Infinity, Infinity, !isWhite);
		chess.undo();
		if (isBetter(score, bestScore, isWhite)) {
			bestScore = score;
			bestMove = move;
		}
	}
	return bestMove;
}

function isBetter(score1: number, score2: number, isMaximizing: boolean = true) {
	if (isMaximizing) {
		return score1 > score2;
	} else {
		return score1 < score2;
	}
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
	let moves = chess.moves();

	// exceed search limit
	curSearchNum++;
	if (curSearchNum > maxSearchNum) {
		return 0;
	}

	// critical condition
	// we don't use isGameOver() or isDraw() for better performance
	// because they will calculate all moves again
	if (moves.length === 0) {
		if (chess.isCheck()) {
			// this is where the king  is captured
			// depth is used to make the bot choose the shortest path to win
			return chess.turn() === 'w' ? -20000 - depth : 20000 + depth;
		} else {
			// stalemate
			return 0;
		}
	}

	// test Threefold repetition
	if (testTFR && chess.isThreefoldRepetition()) {
		return 0;
	}

	if (depth === 0) {
		// consider insufficient material
		return evaluateBoard(chess);
	}

	moves = moves.slice(0, moveThreshold);
	if (isMaximizing) {
		let bestScore = -Infinity;
		for (const move of moves) {
			chess.move(move);
			bestScore = Math.max(bestScore, minimax(chess, depth - 1, alpha, beta, false));
			chess.undo();
			alpha = Math.max(alpha, bestScore);
			if (beta <= alpha) {
				return bestScore;
			}
		}
		return bestScore;
	} else {
		let bestScore = Infinity;
		for (const move of moves) {
			chess.move(move);
			bestScore = Math.min(bestScore, minimax(chess, depth - 1, alpha, beta, true));
			chess.undo();
			beta = Math.min(beta, bestScore);
			if (beta <= alpha) {
				return bestScore;
			}
		}
		return bestScore;
	}
}

function getStage(chess: Chess) {
	// analyze stage
	if (chess.moveNumber() < 15) {
		stage = GameStage.Opening;
	} else if (chess.moveNumber() > 50) {
		stage = GameStage.Ending;
	} else {
		let board = chess.board();
		let whiteScore = 0;
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; ++j) {
				let piece = board[i][j];
				if (piece === null) continue;
				let posValue = getPieceValue(piece);
				if (piece.color === 'w') {
					whiteScore += posValue;
				}
			}
		}
		if (whiteScore < 1500) {	// about one king + two rook + five pawn
			stage = GameStage.Ending;
		} else {
			stage = GameStage.Middle;
		}
	}
}

//     j →
// i	  +------------------------+
// ↓    8 | r  n  b  q  k  b  n  r |
//      7 | p  p  p  p  .  p  p  p |
//      6 | .  .  .  .  .  .  .  . |
//      5 | .  .  .  .  p  .  .  . |
//      4 | .  .  .  .  P  P  .  . |
//      3 | .  .  .  .  .  .  .  . |
//      2 | P  P  P  P  .  .  P  P |
//      1 | R  N  B  Q  K  B  N  R |
//        +------------------------+
//          a  b  c  d  e  f  g  h'
function evaluateBoard(chess: Chess): number {
	// critical condition
	if (chess.isInsufficientMaterial()) {
		return 0;
	}

	let board = chess.board();
	let score = 0;
	let whiteScore = 0;
	let blackScore = 0;	// negative
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; ++j) {
			let piece = board[i][j];
			if (piece === null) continue;
			let value = getPieceValue(piece) + getPosValue(piece, i, j, stage);
			if (piece.color === 'w') {
				whiteScore += value;
			} else {
				blackScore += value;
			}
		}
	}
	score = whiteScore + blackScore;

	// correction
	switch (stage) {
		case GameStage.Opening:
			break;
		case GameStage.Middle: {
			// tradeoff is good, make bot more aggressive
			// whiteScore - blackScore is about 8000
			// only consider tradeoff when one side is better
			if (chess.turn() === 'w' && score < -100) {
				// we are evaluate the tradeoff will of black
				score += (whiteScore - blackScore) * 0.001;
			} else if (chess.turn() === 'b' && score > 100) {
				// we are evaluate the tradeoff will of white
				score += (blackScore - whiteScore) * 0.001;
			}
			break;
		}
		case GameStage.Ending: {
			// how many pawns around the king
			score += getKingPawnValue(chess) * 10;
			break;
		}
	}
	return score;
}

// reference: https://www.chessprogramming.org/Simplified_Evaluation_Function
function getPieceValue(piece: Piece | null): number {
	if (piece === null) {
		return 0;
	}
	// P = 100
	// N = 320
	// B = 330
	// R = 500
	// Q = 900
	// K = 0 because king never be captured
	let value = 0;
	switch (piece.type) {
		case 'p':
			value = 100;
			break;
		case 'b':
			value = 330;
			break;
		case 'n':
			value = 320;
			break;
		case 'r':
			value = 500;
			break;
		case 'q':
			value = 900;
			break;
		case 'k':
			value = 0;
			break;
	}
	return piece.color === 'w' ? value : -value;
}

function getPosValue(piece: Piece | null, i: number, j: number, stage: GameStage = GameStage.Opening): number {
	switch (stage) {
		case GameStage.Opening:
			return piece === null ? 0 : twoSideOpeningPosEval[piece.color][piece.type][i][j];
		case GameStage.Middle:
			return piece === null ? 0 : twoSideMidgamePosEval[piece.color][piece.type][i][j];
		case GameStage.Ending:
			return piece === null ? 0 : twoSideEndgamePosEval[piece.color][piece.type][i][j];
	}
}

function getKingPawnValue(chess: Chess): number {
	let board = chess.board();
	// find king
	let whiteKingPos = { i: -1, j: -1 };
	let blackKingPos = { i: -1, j: -1 };
	for (let i = 0; i < 8; ++i) {
		for (let j = 0; j < 8; ++j) {
			if (board[i][j]?.type === 'k') {
				if (board[i][j]?.color === 'w') {
					whiteKingPos.i = i;
					whiteKingPos.j = j;
				} else {
					blackKingPos.i = i;
					blackKingPos.j = j;
				}
			}
		}
	}
	// count pawns near each king
	let whitePawnCount = 0;
	let blackPawnCount = 0;
	for (let i = whiteKingPos.i - 1; i <= whiteKingPos.i + 1; ++i) {
		if (i < 0 || i >= 8) continue;
		for (let j = whiteKingPos.j - 1; j <= whiteKingPos.j + 1; ++j) {
			if (j < 0 || j >= 8) continue;
			if (board[i][j]?.type === 'p') {
				whitePawnCount++;
			}
		}
	}
	for (let i = blackKingPos.i - 1; i <= blackKingPos.i + 1; ++i) {
		if (i < 0 || i >= 8) continue;
		for (let j = blackKingPos.j - 1; j <= blackKingPos.j + 1; ++j) {
			if (j < 0 || j >= 8) continue;
			if (board[i][j]?.type === 'p') {
				blackPawnCount++;
			}
		}
	}

	return whitePawnCount - blackPawnCount;
}

function getBlackPosEval(whitePosEval: PosEval): PosEval {
	// reverse the whitePosEval and opposite the sign
	return {
		p: whitePosEval.p.slice().reverse().map(row => row.map(v => -v)),
		n: whitePosEval.n.slice().reverse().map(row => row.map(v => -v)),
		b: whitePosEval.b.slice().reverse().map(row => row.map(v => -v)),
		r: whitePosEval.r.slice().reverse().map(row => row.map(v => -v)),
		q: whitePosEval.q.slice().reverse().map(row => row.map(v => -v)),
		k: whitePosEval.k.slice().reverse().map(row => row.map(v => -v))
	};
}

const whiteOpeningPosEval = {
	// pawn
	'p': [
		[0, 0, 0, 0, 0, 0, 0, 0],
		[50, 50, 50, 50, 50, 50, 50, 50],
		[10, 10, 20, 30, 30, 20, 10, 10],
		[5, 5, 10, 25, 25, 10, 5, 5],
		[0, 0, 0, 20, 20, 0, 0, 0],
		[5, -5, -10, 0, 0, -10, -5, 5],
		[5, 10, 10, -20, -20, 10, 10, 5],
		[0, 0, 0, 0, 0, 0, 0, 0],
	],
	// knight
	'n': [
		[-50, -40, -30, -30, -30, -30, -40, -50],
		[-40, -20, 0, 0, 0, 0, -20, -40],
		[-30, 0, 10, 15, 15, 10, 0, -30],
		[-30, 5, 15, 20, 20, 15, 5, -30],
		[-30, 0, 15, 20, 20, 15, 0, -30],
		[-30, 5, 10, 15, 15, 10, 5, -30],
		[-40, -20, 0, 5, 5, 0, -20, -40],
		[-50, -40, -30, -30, -30, -30, -40, -50],
	],
	// bishop
	'b': [
		[-20, -10, -10, -10, -10, -10, -10, -20],
		[-10, 0, 0, 0, 0, 0, 0, -10],
		[-10, 0, 5, 10, 10, 5, 0, -10],
		[-10, 5, 5, 10, 10, 5, 5, -10],
		[-10, 0, 10, 10, 10, 10, 0, -10],
		[-10, 10, 10, 10, 10, 10, 10, -10],
		[-10, 5, 0, 0, 0, 0, 5, -10],
		[-20, -10, -10, -10, -10, -10, -10, -20],
	],
	// rook
	'r': [
		[0, 0, 0, 0, 0, 0, 0, 0],
		[5, 10, 10, 10, 10, 10, 10, 5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[0, 0, 0, 5, 5, 0, 0, 0],
	],
	// queen
	'q': [
		[-20, -10, -10, -5, -5, -10, -10, -20],
		[-10, 0, 0, 0, 0, 0, 0, -10],
		[-10, 0, 5, 5, 5, 5, 0, -10],
		[-5, 0, 5, 5, 5, 5, 0, -5],
		[0, 0, 5, 5, 5, 5, 0, -5],
		[-10, 5, 5, 5, 5, 5, 0, -10],
		[-10, 0, 5, 0, 0, 0, 0, -10],
		[-20, -10, -10, -5, -5, -10, -10, -20],
	],
	// king
	'k': [
		[-30, -40, -40, -50, -50, -40, -40, -30],
		[-30, -40, -40, -50, -50, -40, -40, -30],
		[-30, -40, -40, -50, -50, -40, -40, -30],
		[-30, -40, -40, -50, -50, -40, -40, -30],
		[-20, -30, -30, -40, -40, -30, -30, -20],
		[-10, -20, -20, -20, -20, -20, -20, -10],
		[20, 20, 0, 0, 0, 0, 20, 20],
		[20, 30, 10, 0, 0, 10, 30, 20],
	]
};

const whiteMidgamePosEval = whiteOpeningPosEval;

const whiteEndgamePosEval = {
	// pawn
	'p': [
		[0, 0, 0, 0, 0, 0, 0, 0],
		[50, 50, 50, 50, 50, 50, 50, 50],
		[30, 30, 30, 30, 30, 30, 30, 30],
		[25, 25, 25, 25, 25, 25, 25, 25],
		[10, 10, 10, 10, 10, 10, 10, 10],
		[5, 5, 5, 5, 5, 5, 5, 5],
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0],
	],
	// knight
	'n': [
		[-50, -40, -30, -30, -30, -30, -40, -50],
		[-40, -20, 5, 5, 5, 5, -20, -40],
		[-30, 5, 10, 15, 15, 10, 5, -30],
		[-30, 5, 15, 20, 20, 15, 5, -30],
		[-30, 5, 15, 20, 20, 15, 5, -30],
		[-30, 5, 10, 15, 15, 10, 5, -30],
		[-40, -20, 5, 5, 5, 5, -20, -40],
		[-50, -40, -30, -30, -30, -30, -40, -50],
	],
	// bishop
	'b': [
		[-20, -10, -10, -10, -10, -10, -10, -20],
		[-10, 0, 5, 5, 5, 5, 0, -10],
		[-10, 5, 10, 10, 10, 10, 5, -10],
		[-10, 5, 10, 10, 10, 10, 5, -10],
		[-10, 5, 10, 10, 10, 10, 5, -10],
		[-10, 5, 10, 10, 10, 10, 5, -10],
		[-10, 0, 5, 5, 5, 5, 0, -10],
		[-20, -10, -10, -10, -10, -10, -10, -20],
	],
	// rook
	'r': [
		[-5, -5, -5, -5, -5, -5, -5, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, 0, 0, 0, 0, 0, 0, -5],
		[-5, -5, -5, -5, -5, -5, -5, -5],
	],
	// queen
	'q': [
		[-20, -10, -10, -5, -5, -10, -10, -20],
		[-10, 0, 5, 5, 5, 5, 0, -10],
		[-10, 5, 5, 5, 5, 5, 5, -10],
		[-5, 5, 5, 5, 5, 5, 5, -5],
		[-5, 5, 5, 5, 5, 5, 5, -5],
		[-10, 5, 5, 5, 5, 5, 5, -10],
		[-10, 0, 5, 5, 5, 5, 0, -10],
		[-20, -10, -10, -5, -5, -10, -10, -20],
	],
	// king
	'k': [
		[0, 0, 0, 0, 0, 0, 0, 0],
		[8, 8, 10, 11, 11, 10, 8, 8],
		[6, 6, 7, 9, 9, 7, 6, 6],
		[4, 4, 5, 7, 7, 5, 4, 4],
		[2, 2, 3, 5, 5, 3, 2, 2],
		[0, 2, 2, 3, 3, 2, 2, 0],
		[-5, -2, -2, 0, 0, -2, -2, -5],
		[-5, -5, -5, -5, -5, -5, -5, -5],
	],
};
const twoSideOpeningPosEval =
{
	'w': whiteOpeningPosEval,
	'b': getBlackPosEval(whiteOpeningPosEval)
};

const twoSideMidgamePosEval =
{
	'w': whiteMidgamePosEval,
	'b': getBlackPosEval(whiteMidgamePosEval)
};

const twoSideEndgamePosEval =
{
	'w': whiteEndgamePosEval,
	'b': getBlackPosEval(whiteEndgamePosEval)
};
