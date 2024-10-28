import { Chess } from 'chess.js';
import { getBestMove } from './chessBot';
import { WorkerMessageEvent, MessageType } from './interface';


let chess = new Chess();
let chessID: number = -1;
let searchDepth: number = 3;
self.onmessage = (event: WorkerMessageEvent) => {

	let data = event.data;

	switch (data.type) {
		// reset chessID
		case MessageType.init:
			chessID = data.id;
			searchDepth = data.searchDepth ?? 3;
			return;
		case MessageType.params:
			if (chessID !== data.id) {
				return;
			}

			// no validation
			if (data.fen !== undefined) {
				chess.load(data.fen, { skipValidation: true });
				let move = getBestMove(chess, 3);
				self.postMessage({
					type: MessageType.result,
					id: chessID,
					move: move,
				});
			} else if (data.pgn !== undefined) {
				let chess = new Chess();
				chess.loadPgn(data.pgn);
				// Threefold repetition is meaningful
				// only if chess is initialized with PGN
				let move = getBestMove(chess, 3, { testTFR: true });
				self.postMessage({
					type: MessageType.result,
					id: chessID,
					move: move,
				});
			}

			return;
		default:
			throw new Error('Invalid message type');
	}
};
