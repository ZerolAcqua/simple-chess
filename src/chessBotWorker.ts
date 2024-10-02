import { Chess } from 'chess.js';
import { parentPort } from 'worker_threads';
import { getBestMove } from './chessBot';

let chessID: number = -1;
parentPort?.on('message', (data: { id: number, fen?: string, pgn?: string }) => {
	// reset chessID
	if (data.pgn === undefined && data.fen === undefined) {
		chessID = data.id;
		return;
	}
	if (chessID === data.id) {
		// no validation
		if (data.fen !== undefined) {
			let chess = new Chess(data.fen);
			let move = getBestMove(chess, 3);
			parentPort?.postMessage({ id: chessID, move: move });
		} else if (data.pgn !== undefined) {
			let chess = new Chess();
			chess.loadPgn(data.pgn);
			// Threefold repetition is meaningful
			// only if chess is initialized with PGN
			let move = getBestMove(chess, 3, { testTFR: true });
			parentPort?.postMessage({ id: chessID, move: move });
		}
	}
});
