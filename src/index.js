/**
 * This file is modified from the original source code `script.js` in `lhartikk/simple-chess-ai`
 * I rewrite the AI part, update the dependencies and fix some bugs
 */

import '@chrisoakman/chessboard2/dist/chessboard2.css';
import './style.css';


import { Chessboard2 } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
import { Chess } from 'chess.js';
import { getBestMove } from './bot.js';


let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
var board,
    game = new Chess(fen);

/* board visualization and games state handling */

function makeBestMove() {
    var bestMove = getBestMove(game);
    game.move(bestMove);
    board.position(game.fen());
    updatePGN();
    console.log(game.ascii())
    if (game.isGameOver()) {
        window.setTimeout(() => alert('Game over'), 250);
        return;
    }
};

function updatePGN() {
    const pgnEl = document.getElementById('gamePGN')
    pgnEl.innerHTML = game.pgn({ maxWidth: 5, newline: '<br />' })
};

var onDragStart = ({ square, piece, position, orientation }) => {
    if (game.isCheckmate() === true || game.isDraw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var onDrop = ({ source, target }) => {

    try {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        console.log(game.ascii())

        updatePGN();
        if (game.isGameOver()) {
            window.setTimeout(() => alert('Game over'), 250);
            return;
        }
        window.setTimeout(makeBestMove, 250);

    } catch (e) {
        return 'snapback';
    }
};

var onSnapEnd = () => {
    board.position(game.fen());
};

var onMouseoverSquare = (square, piece) => { };

var onMouseoutSquare = (square, piece) => { };

var cfg = {
    draggable: true,
    position: fen,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
};
board = Chessboard2('board', cfg);