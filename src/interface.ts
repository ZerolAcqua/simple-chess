import { Move } from "chess.js";

export interface WorkerMessageEvent extends MessageEvent {
	data: {
		id: number;
		move?: Move;
		fen?: string;
		pgn?: string
	};
}