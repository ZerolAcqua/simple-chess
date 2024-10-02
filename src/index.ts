/**
 * This file is modified from the original source code `script.js` in `lhartikk/simple-chess-ai`
 * I rewrite the AI part, update the dependencies and fix some bugs
 */

import '@chrisoakman/chessboard2/dist/chessboard2.css';
import './style.css';

import { Chessboard2, BoardConfig, ChessBoardInstance, Callback } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
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
const onDragStart = ({ square, piece }: { square?: string, piece?: string }): void => {
    if (game.isCheckmate() || game.isDraw() || piece.startsWith('b')) {
        return;
    }
};

// Handle the drop event
const onDrop: Callback = ({ source, target }) => {
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


const onChange: Callback = (oldPos, newPos) => {
    console.log('onChange', oldPos, newPos)
}

// Handle mouse over square (no action needed)
const onMouseenterSquare = (square: string, piece: string | null): void => { };

// Handle mouse out square (no action needed)
const onMouseleaveSquare = (square: string, piece: string | null): void => { };



// Configuration for the Chessboard
const cfg: BoardConfig = {
    draggable: true,
    position: fen,
    // orientation: 'black',

    onDragStart: onDragStart,
    onDrop: onDrop,
    onChange: onChange,

    // onDrop: (...obs: any[]) => { console.log('onDrop', obs) },
    // onMouseenterSquare: (...obs: any[]) => { console.log('onouseenterSquare', obs) },
    // onMouseleaveSquare: (...obs: any[]) => { console.log('onMouseleaveSquare', obs) },
    // onMousedownSquare: (...obs: any[]) => { console.log('onMousedownSquare', obs) },
    // onMouseupSquare: (...obs: any[]) => { console.log('onMouseupSquare', obs) }
};

// Initialize the board with the configuration
board = Chessboard2('board', cfg);