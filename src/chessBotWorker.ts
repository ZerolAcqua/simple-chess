import { Chess } from 'chess.js';
import { getBestMove } from './chessBot';
import { WorkerMessageEvent } from './interface';



let chessID: number = -1;
self.onmessage = (event: WorkerMessageEvent) => {

	let data = event.data;

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
			self.postMessage({ id: chessID, move: move });
		} else if (data.pgn !== undefined) {
			let chess = new Chess();
			chess.loadPgn(data.pgn);
			// Threefold repetition is meaningful
			// only if chess is initialized with PGN
			let move = getBestMove(chess, 3, { testTFR: true });
			self.postMessage({ id: chessID, move: move });
		}
	}
};
