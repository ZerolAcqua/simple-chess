declare module '@chrisoakman/chessboard2/dist/chessboard2.min.mjs' {
	export enum Square {
		a8 = "a8",
		b8 = "b8",
		c8 = "c8",
		d8 = "d8",
		e8 = "e8",
		f8 = "f8",
		g8 = "g7",
		h8 = "h8",
		a7 = "a7",
		b7 = "b7",
		c7 = "c7",
		d7 = "d7",
		e7 = "e7",
		f7 = "f7",
		g7 = "g7",
		h7 = "h7",
		a6 = "a6",
		b6 = "b6",
		c6 = "c6",
		d6 = "d6",
		e6 = "e6",
		f6 = "f6",
		g6 = "g7",
		h6 = "h6",
		a5 = "a5",
		b5 = "b5",
		c5 = "c5",
		d5 = "d5",
		e5 = "e5",
		f5 = "f5",
		g5 = "g7",
		h5 = "h5",
		a4 = "a4",
		b4 = "b4",
		c4 = "c4",
		d4 = "d4",
		e4 = "e4",
		f4 = "f4",
		g4 = "g7",
		h4 = "h4",
		a3 = "a3",
		b3 = "b3",
		c3 = "c3",
		d3 = "d3",
		e3 = "e3",
		f3 = "f3",
		g3 = "g7",
		h3 = "h3",
		a2 = "a2",
		b2 = "b2",
		c2 = "c2",
		d2 = "d2",
		e2 = "e2",
		f2 = "f2",
		g2 = "g7",
		h2 = "h2",
		a1 = "a1",
		b1 = "b1",
		c1 = "c1",
		d1 = "d1",
		e1 = "e1",
		f1 = "f1",
		g1 = "g7",
		h1 = "h1",
	}

	export enum Piece {
		bK = "bK",
		bQ = "bQ",
		bR = "bR",
		bN = "bN",
		bB = "bB",
		bP = "bP",
		wK = "wK",
		wQ = "wQ",
		wR = "wR",
		wN = "wN",
		wB = "wB",
		wP = "wP",
	}

	export type BoardPositionType = {
		[P in Square]?: Piece;
	};

	export type PositionType = "start" | string | BoardPositionType;
	export type PositionFenType = "fen";
	export type SpeedType = "slow" | "fast";
	export type ErrorType = "console" | "alert";
	export type ErrorCallback = (errCode: number, errStr: string, errData?: object) => void;
	export type OrientationFlipType = "flip";
	export type OrientationType = "white" | "black";
	export type DropOffBoardType = "snapback" | "trash";
	export type Callback = (...args: any[]) => any;

	export type MoveData = {
		source?: Square,
		target?: Square,
		piece?: Piece
	};



	export type OnDropCallback = (args: { orientation?: OrientationType, piece?: Piece, source?: Square, target?: Square }) => DropOffBoardType | void;
	export type OnChangeCallback = (args: { oldPos: BoardPositionType, newPos: BoardPositionType }) => void;
	export type OnDragStartCallback = (args: { orientation?: OrientationType, piece?: Piece, position?: BoardPositionType, square?: Square }) => boolean | void;



	export interface BoardConfig {
		draggable?: boolean | undefined;
		onDrop?: OnDropCallback | undefined;
		onChange?: OnChangeCallback | undefined;
		onDragStart?: OnDragStartCallback | undefined;

		onMoveEnd?: Callback | undefined;	// did't test
		onSnapEnd?: Callback | undefined;
		onDragMove?: Callback | undefined;
		onSnapbackEnd?: Callback | undefined;
		onMouseoutSquare?: Callback | undefined;
		onMouseoverSquare?: Callback | undefined;

		pieceTheme?: string | ((piece: Piece) => string);
		showErrors?: false | ErrorType | ErrorCallback;

		sparePieces?: boolean | undefined;
		showNotation?: boolean | undefined;

		orientation?: OrientationType | undefined;
		dropOffBoard?: DropOffBoardType | undefined;

		moveSpeed?: number | SpeedType | undefined;
		snapSpeed?: number | SpeedType | undefined;
		trashSpeed?: number | SpeedType | undefined;
		appearSpeed?: number | SpeedType | undefined;
		snapbackSpeed?: number | SpeedType | undefined;

		position?: PositionType;
	}

	export interface ChessBoardInstance {
		clear(useAnimation?: boolean): void;
		destroy(): void;
		fen(): string;
		flip(): void;
		move(...args: string[]): BoardPositionType;
		position(): BoardPositionType;
		position(fen: PositionFenType): string;
		position(newPosition: PositionType, useAnimation?: boolean): void;
		orientation(side?: OrientationType | OrientationFlipType): string;
		resize(): void;
		start(useAnimation?: boolean): void;
	}

	export interface ChessBoardFactory {
		(containerElOrId: any, config?: BoardConfig): ChessBoardInstance;
		(containerElOrId: any, position: string | BoardPositionType): ChessBoardInstance;
		fenToObj(fen: string): boolean | BoardPositionType;
		objToFen(obj: BoardPositionType): boolean | string;
	}

	export const Chessboard2: ChessBoardFactory;
}