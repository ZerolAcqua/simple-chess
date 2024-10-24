import { Move } from "chess.js";

export interface WorkerMessageEvent extends MessageEvent {
	data: {
		// init and sync
		id: number;
		// init
		searchDepth?: number;
		// params
		fen?: string;
		pgn?: string
		// result
		move?: Move;
	};
}