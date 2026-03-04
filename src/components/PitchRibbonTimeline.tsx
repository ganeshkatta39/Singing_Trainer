import React, {
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";

const WINDOW_SECONDS = 5;

const NOTES = [
	"C5",
	"B4",
	"A4",
	"G4",
	"F4",
	"E4",
	"D4",
	"C4",
	"B3",
	"A3",
	"G3",
	"F3",
	"E3",
	"D3",
	"C3",
];

function freqToMidi(freq: number) {
	return 69 + 12 * Math.log2(freq / 440);
}

interface PitchPoint {
	time: number;
	midi: number;
}

export interface PitchRibbonHandle {
	addPitch: (freq: number) => void;
}

interface Props {
	snapToNote: boolean;
}

const PitchRibbonTimeline = forwardRef<PitchRibbonHandle, Props>(
	({ snapToNote }, ref) => {
		const canvasRef = useRef<HTMLCanvasElement | null>(null);
		const bufferRef = useRef<PitchPoint[]>([]);
		const smoothRef = useRef<number | null>(null);

		useImperativeHandle(ref, () => ({
			addPitch(freq: number) {
				const now = performance.now() / 1000;

				if (freq === -1) {
					bufferRef.current.push({ time: now, midi: -1 });
					return;
				}

				let midi = freqToMidi(freq);

				if (snapToNote) {
					midi = Math.round(midi);
				}

				if (!snapToNote) {
					if (smoothRef.current === null) {
						smoothRef.current = midi;
					} else {
						smoothRef.current = smoothRef.current * 0.7 + midi * 0.3;
					}
					midi = smoothRef.current;
				}

				bufferRef.current.push({ time: now, midi });
			},
		}));

		useEffect(() => {
			const canvas = canvasRef.current!;
			const ctx = canvas.getContext("2d")!;

			const width = canvas.width;
			const height = canvas.height;
			const rowHeight = height / NOTES.length;
			const scrollSpeed = canvas.width / (WINDOW_SECONDS * 60);

			let prevY: number | null = null;

			const draw = () => {
				const now = performance.now() / 1000;

				const scroll = scrollSpeed;

				// shift existing graph left
				ctx.drawImage(
					canvas,
					scroll,
					0,
					canvas.width - scroll,
					canvas.height,
					0,
					0,
					canvas.width - scroll,
					canvas.height,
				);

				// clear right edge
				ctx.fillStyle = "black";
				ctx.fillRect(canvas.width - scroll, 0, scroll, canvas.height);

				// newest pitch point
				const latest = bufferRef.current[bufferRef.current.length - 1];

				if (latest && latest.midi !== -1) {
					const noteTop = 84;
					const noteBottom = 48;

					const norm = (latest.midi - noteBottom) / (noteTop - noteBottom);
					const y = canvas.height - norm * canvas.height;

					const x = canvas.width - scroll;

					if (prevY !== null) {
						ctx.strokeStyle = "#00f5ff";
						ctx.lineWidth = 3;

						ctx.beginPath();
						ctx.moveTo(x - scroll, prevY);
						ctx.lineTo(x, y);
						ctx.stroke();
					}

					prevY = y;

					// white current pitch ball
					ctx.fillStyle = "white";
					ctx.beginPath();
					ctx.arc(x, y, 6, 0, Math.PI * 2);
					ctx.fill();
				}

				requestAnimationFrame(draw);
			};

			draw();
		}, [snapToNote]);

		return (
			<canvas
				ref={canvasRef}
				width={900}
				height={250}
				style={{
					width: "100%",
					border: "1px solid #444",
					borderRadius: 8,
				}}
			/>
		);
	},
);

export default PitchRibbonTimeline;
