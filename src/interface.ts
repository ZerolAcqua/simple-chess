import { Move } from "chess.js";

export enum MessageType {
	init,
	params,
	pending,
	result
}


export interface WorkerMessageEvent extends MessageEvent {
	data: {
		type: MessageType;
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