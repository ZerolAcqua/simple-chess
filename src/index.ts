/**
 * This file is modified from the original source code `script.js` in `lhartikk/simple-chess-ai`
 * I rewrite the AI part, update the dependencies and fix some bugs
 */

import '@chrisoakman/chessboard2/dist/chessboard2.css';
import 'bootstrap/scss/bootstrap.scss';
import './style.scss';

import { Chessboard2, BoardConfig, ChessBoardInstance, Callback } from '@chrisoakman/chessboard2/dist/chessboard2.min.mjs';
import { Chess, Move, Square } from 'chess.js';

import { getBestMove } from './chessBot'
import { WorkerMessageEvent, MessageType } from './interface';
import 'bootstrap';

enum GameState {
    init,
    startTurn,
    move,
    promote,
    botThinking,
    gameover
}
enum GameTurn {
    white,
    black,
}


// let worker = new Worker('./chessBotWorker.ts');
let worker = new Worker(new URL('./chessBotWorker.ts', import.meta.url));


worker.onmessage = (event: WorkerMessageEvent) => {
    let data = event.data;
    switch (data.type) {
        case MessageType.result:
            botQueueLength--;
            console.log('[worker]bot queue size:', botQueueLength);
            if (searchDepth <= 2) {
                setTimeout(() => {
                    if (data.id === chessID) {
                        console.log('[get move]', data.move);
                        botNextMove = data.move;
                        step();
                    }
                }, 500);
            } else {
                if (data.id === chessID) {
                    console.log('[get move]', data.move);
                    botNextMove = data.move;
                    step();
                }
            }

            return
        case MessageType.pending:
            console.log('pending');
            return;
        default:
            throw new Error('Invalid message type');
    }
};



// variables
let botNextMove: Move | undefined;
let playerNextMove: Move | undefined;
let promoteMove: Move | undefined;

let chessID = 0;
let lastRestartTime = 0;
let lastResetTime = 0;
let botQueueLength = 0;



// Initialize the board and the game state
let fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// let fen: string = '4k3/8/8/8/8/8/8/QQQQKQQQ w KQ - 0 1';
let chess = new Chess(fen);
let board: ChessBoardInstance;
let searchDepth: number = 3;

let gameState = GameState.init;
let gameTurn = GameTurn.white;
let gamePlay = {
    whitePlay: () => { },
    blackPlay: () => { },
};


function init() {
    getPlay();
    getSearchDepth();

    botNextMove = undefined;
    playerNextMove = undefined;
    promoteMove = undefined;

    lastResetTime = lastRestartTime = Date.now();
    chessID++;

    console.log('[init]', chessID, searchDepth);
    worker.postMessage({
        type: MessageType.init,
        id: chessID,
        searchDepth: searchDepth,
    });

    // load
    chess.load(fen);
    gameState = GameState.init;
    gameTurn = chess.turn() === 'w' ? GameTurn.white : GameTurn.black;

    display();
    step();
}

function switchTurn() {
    gameTurn = gameTurn === GameTurn.white ?
        GameTurn.black : GameTurn.white;
    gameState = GameState.init;
    display();
    step();
}

function step() {
    // gameover
    if (isGameOver()) return;

    switch (gameTurn) {
        case GameTurn.white:
            gamePlay.whitePlay();
            break;
        case GameTurn.black:
            gamePlay.blackPlay();
            break;
    }
    isGameOver();
}

function playerPlay() {
    switch (gameState) {
        case GameState.init:
        case GameState.startTurn:
        case GameState.move: {
            gameState = GameState.move;
            console.log('[playerPlay]', playerNextMove);
            // player move
            if (playerNextMove) {
                let moves = chess.moves({ square: playerNextMove.from, verbose: true });

                let moveIndex = moves.map(move => move.to).indexOf(playerNextMove.to);
                if (moveIndex === -1) {
                    console.error('[playerPlay move]', 'Invalid move:', playerNextMove);
                    return false;
                } else {
                    let moveFlag = moves[moveIndex].flags;
                    // no promotion move
                    if (!moveFlag.includes('p')) {
                        chess.move(playerNextMove);
                        // MUST clear playerNextMove before switchTurn()
                        playerNextMove = undefined;
                        switchTurn();
                    }
                    else {
                        // promotion move
                        gameState = GameState.promote;
                        // show promotion dialog
                        promoteChoose(playerNextMove.to);
                    }
                }
            }
            break;
        }
        case GameState.promote: {
            if (promoteMove?.promotion === undefined) return;
            chess.move(promoteMove);
            // MUST clear promoteMove before switchTurn()
            promoteMove = undefined;
            removePromoteChoose();
            switchTurn();
            break;
        }
        case GameState.gameover: {
            break;
        }
        case GameState.botThinking: {
            break;
        }
        default: {
            throw new Error('Invalid game state');
        }
    }
}

function botPlay() {
    switch (gameState) {
        case GameState.botThinking: {
            // updateText(statusText, $l('机器人思考中……'));
            if (botNextMove) {
                gameState = GameState.move;
                step();
            }
            return;
        }
        case GameState.init:
        case GameState.startTurn:
        case GameState.move: {
            gameState = GameState.move;
            // bot move
            if (botNextMove) {
                try {
                    chess.move(botNextMove);
                } catch (e) {
                    console.error("[botPlay move]", e);
                }

                // MUST clear botNextMove before switchTurn()
                botNextMove = undefined;
                switchTurn();

            } else {
                // bot is thinking
                worker.postMessage({
                    type: MessageType.params,
                    id: chessID,
                    pgn: chess.pgn(),
                });
                botQueueLength++;
                console.log('[worker]bot queue size:', botQueueLength);
                gameState = GameState.botThinking;
            }
            break;
        }
        default: {
            // bot doesn't need to promote
            throw new Error('Invalid game state');
        }
    }
}


function isGameOver() {
    if (gameState === GameState.gameover) return true;
    if (!chess.isGameOver()) return false;

    gameState = GameState.gameover;
    // gameover process
    if (chess.isCheckmate()) {
        // show checkmate info
    } else {
        // show draw info
    }
    // show gameover effect
    window.setTimeout(() => alert('Game over'), 250);

    return true;
}




/* board visualization and game state handling */

/** 
 * @deprecated
 * @brief Make the best move for the AI
 */
function makeBestMove(): void {
    const bestMove = getBestMove(chess);
    chess.move(bestMove);
    board.position(chess.fen());
    updatePGN();
    console.log('[makeBestMove]', chess.ascii());

    if (chess.isGameOver()) {
        window.setTimeout(() => alert('Game over'), 250);
        return;
    }
};

/* board event */

// Handle the drag start event
// TODO:
const onDragStart = ({ square, piece }: { square?: string, piece?: string }): boolean | void => {
    // do not pick up pieces if the game is over
    if (gameState === GameState.gameover) {
        return false;
    }
    // only pick up pieces for the player side to move 
    if (!isPlayerTurn() || !isYourPiece(square as Square) || gameState === GameState.promote) {
        return false;
    }
    // TODO: show available moves
};

// Handle the drop event
const onDrop: Callback = ({ source, target, piece }) => {
    playerNextMove = {
        from: source,
        to: target,
        // promotion: 'q' // always promote to a queen
    } as Move;
    // if (!isPlayerTurn() || gameState !== GameState.move) {
    //     return 'snapback';
    // }
    step();
    // @ts-ignore 
    if (gameState !== GameState.promote) {
        return 'snapback';
    }

};


const onChange: Callback = (oldPos, newPos) => {
    // console.log('onChange', oldPos, newPos)
}

// Handle mouse over square (no action needed)
const onMouseenterSquare = (square: string, piece: string | null): void => { };

// Handle mouse out square (no action needed)
const onMouseleaveSquare = (square: string, piece: string | null): void => { };



/* utils */

function display() {
    board.position(chess.fen());
    updatePGN();
}

// TODO: Update the PGN (Portable Game Notation)
function updatePGN(): void {
    const pgnEl = document.getElementById('gamePGN');
    if (pgnEl) {
        pgnEl.innerHTML = chess.pgn({ maxWidth: 5, newline: '<br />' });
    }
};

function getPlay() {
    // 获取 radio 数据，name 分别为 whitePlay 和 blackPlay
    let whitePlay = (document.querySelector('input[name="whitePlay"]:checked') as HTMLInputElement).value;
    let blackPlay = (document.querySelector('input[name="blackPlay"]:checked') as HTMLInputElement).value;
    gamePlay.whitePlay = whitePlay === 'bot' ? botPlay : playerPlay;
    gamePlay.blackPlay = blackPlay === 'bot' ? botPlay : playerPlay;
}

function getSearchDepth() {
    searchDepth = parseInt((document.getElementById('search-depth') as HTMLSelectElement).value, 10);
}

function isPlayerTurn() {
    return gameTurn === GameTurn.white && gamePlay.whitePlay === playerPlay ||
        gameTurn === GameTurn.black && gamePlay.blackPlay === playerPlay;
}

function isYourPiece(square: Square): boolean {
    const piece = chess.get(square);
    if (!piece) return false;
    return piece.color === chess.turn();
}

function promoteChoose(target: string) {
    console.log('[promoteChoose]', target);

    let promotion = document.getElementById('promotion') as HTMLElement;
    promotion.classList.remove('d-none');
}

function removePromoteChoose() {
    console.log('[removePromoteChoose]');

    let promotion = document.getElementById('promotion') as HTMLElement;
    promotion.classList.add('d-none');
}

// Configuration for the Chessboard
const cfg: BoardConfig = {
    draggable: true,
    position: fen,
    // orientation: 'black',

    onDragStart: onDragStart,
    onDrop: onDrop,
    onChange: onChange,

    // onDrop: (...obs: any[]) => { console.log('onDrop', obs); return 'snapback'; },
    // onMouseenterSquare: (...obs: any[]) => { console.log('onouseenterSquare', obs) },
    // onMouseleaveSquare: (...obs: any[]) => { console.log('onMouseleaveSquare', obs) },
    // onMousedownSquare: (...obs: any[]) => { console.log('onMousedownSquare', obs) },
    // onMouseupSquare: (...obs: any[]) => { console.log('onMouseupSquare', obs) }
};

// Initialize the board
board = Chessboard2('board', cfg);
init();


// bind event
document.getElementById('restart').addEventListener('click', () => {
    if (Date.now() - lastResetTime < 1000) return;
    if (botQueueLength > 4) return;
    init();
});
document.getElementById('promotionQueen').addEventListener('click', () => { promoteMove = { ...playerNextMove, promotion: 'q' }; step(); });
document.getElementById('promotionRook').addEventListener('click', () => { promoteMove = { ...playerNextMove, promotion: 'r' }; step(); });
document.getElementById('promotionBishop').addEventListener('click', () => { promoteMove = { ...playerNextMove, promotion: 'b' }; step(); });
document.getElementById('promotionKnight').addEventListener('click', () => { promoteMove = { ...playerNextMove, promotion: 'n' }; step(); });