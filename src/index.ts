/**
 * This file is modified from the original source code `script.js` in `lhartikk/simple-chess-ai`
 * I rewrite the AI part, update the dependencies and fix some bugs
 */

import '@chrisoakman/chessboard2/dist/chessboard2.css';
import './style.css';

import { Chessboard2, BoardConfig, ChessBoardInstance, OnDropCallback, Piece } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
import { Chess } from 'chess.js';
import { getBestMove } from './bot';

// Initialize the board and the game state
let fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let game = new Chess(fen);
let board: ChessBoardInstance;


/* board visualization and game state handling */

// Make the best move for the AI
function makeBestMove(): void {
    const bestMove = getBestMove(game);
    game.move(bestMove);
    board.position(game.fen());
    updatePGN();
    console.log(game.ascii());

    if (game.isGameOver()) {
        window.setTimeout(() => alert('Game over'), 250);
        return;
    }
};

// Update the PGN (Portable Game Notation)
function updatePGN(): void {
    const pgnEl = document.getElementById('gamePGN');
    if (pgnEl) {
        pgnEl.innerHTML = game.pgn({ maxWidth: 5, newline: '<br />' });
    }
};

// Handle the drag start event
const onDragStart = ({ square, piece }: { square?: string, piece?: string }): boolean | void => {
    if (game.isCheckmate() || game.isDraw() || piece.startsWith('b')) {
        return false;
    }
};

// Handle the drop event
const onDrop: OnDropCallback = ({ source, target }) => {
    try {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q' // always promote to a queen
        });

        if (!move) return 'snapback'; // illegal move

        console.log(game.ascii());

        updatePGN();

        if (game.isGameOver()) {
            window.setTimeout(() => alert('Game over'), 250);
            return;
        }

        window.setTimeout(makeBestMove, 250);
    } catch (e) {
        return 'snapback'; // on error, revert the piece back
    }
};

// Handle the snap end event
const onSnapEnd = (): void => {
    board.position(game.fen());
};

// Handle mouse over square (no action needed)
const onMouseenterSquare = (square: string, piece: string | null): void => { };

// Handle mouse out square (no action needed)
const onMouseleaveSquare = (square: string, piece: string | null): void => { };



// Configuration for the Chessboard
const cfg: BoardConfig = {
    draggable: true,
    position: fen,
    sparePieces: true,
    dropOffBoard: 'trash',

    onDragStart: onDragStart,
    onDrop: onDrop,

    onMouseenterSquare: (...obs: any[]) => { console.log('onMouseoutSquare', obs) },
    onMouseleaveSquare: (...obs: any[]) => { console.log('onMouseoverSquare', obs) },

    // invalid
    // showErrors: (...obs: any[]) => { console.log('showErrors', obs) },
    // pieceTheme: (piece: Piece) => { console.log('pieceTheme', piece); return 'https://chessboardjs.com/img/chesspieces/alpha/wP.png'; },
    // onDragMove: (...obs: any[]) => { console.log('onDragMove', obs) },
    // onMoveEnd: (...obs: any[]) => { console.log('onMoveEnd', obs) },
    // onSnapbackEnd: (...obs: any[]) => { console.log('onSnapbackEnd', obs) },
    // onSnapEnd: (...obs: any[]) => { console.log('onSnapEnd', obs) },
};

// Initialize the board with the configuration
board = Chessboard2('board', cfg);