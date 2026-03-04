import React,{
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle
	} from "react"
	
	const WINDOW_SECONDS = 5
	
	const NOTES=[
	"C5","B4","A4","G4","F4","E4","D4","C4",
	"B3","A3","G3","F3","E3","D3","C3"
	]
	
	function freqToMidi(freq:number){
	return 69+12*Math.log2(freq/440)
	}
	
	interface PitchPoint{
	time:number
	midi:number
	}
	
	export interface PitchRibbonHandle{
	addPitch:(freq:number)=>void
	}
	
	interface Props{
	snapToNote:boolean
	}
	
	const PitchRibbonTimeline=forwardRef<PitchRibbonHandle,Props>(
	({snapToNote},ref)=>{
	
	const canvasRef=useRef<HTMLCanvasElement|null>(null)
	
	const bufferRef=useRef<PitchPoint[]>([])
	const smoothRef=useRef<number|null>(null)
	
	useImperativeHandle(ref,()=>({
	
	addPitch(freq:number){
	
	const now=performance.now()/1000
	
	if(freq===-1){
	bufferRef.current.push({time:now,midi:-1})
	return
	}
	
	let midi=freqToMidi(freq)
	
	// optional snap
	if(snapToNote){
	midi=Math.round(midi)
	}
	
	// smoothing only when not snapping
	if(!snapToNote){
	if(smoothRef.current===null){
	smoothRef.current=midi
	}else{
	smoothRef.current=smoothRef.current*0.7 + midi*0.3
	}
	midi=smoothRef.current
	}
	
	bufferRef.current.push({
	time:now,
	midi:midi
	})
	
	}
	
	}))
	
	useEffect(()=>{
	
	const canvas=canvasRef.current!
	const ctx=canvas.getContext("2d")!
	
	const width=canvas.width
	const height=canvas.height
	
	const rowHeight=height/NOTES.length
	
	const draw=()=>{
	
	const now=performance.now()/1000
	
	ctx.fillStyle="black"
	ctx.fillRect(0,0,width,height)
	
	ctx.strokeStyle="#333"
	ctx.fillStyle="#aaa"
	ctx.font="12px monospace"
	
	NOTES.forEach((note,i)=>{
	
	const y=i*rowHeight
	
	ctx.beginPath()
	ctx.moveTo(0,y)
	ctx.lineTo(width,y)
	ctx.stroke()
	
	ctx.fillText(note,5,y+rowHeight-4)
	
	})
	
	ctx.strokeStyle="#00f5ff"
	ctx.lineWidth=3
	ctx.beginPath()
	
	let started=false
	
	bufferRef.current.forEach(point=>{
	
	if(now-point.time>WINDOW_SECONDS) return
	
	// RIGHT → LEFT scrolling
	const x=(WINDOW_SECONDS-(now-point.time))/WINDOW_SECONDS*width
	
	if(point.midi===-1){
	started=false
	return
	}
	
	const noteTop=84
	const noteBottom=48
	
	const norm=(point.midi-noteBottom)/(noteTop-noteBottom)
	const y=height-norm*height
	
	if(!started){
	ctx.moveTo(x,y)
	started=true
	}else{
	ctx.lineTo(x,y)
	}
	
	})
	
	ctx.stroke()
	
	bufferRef.current=bufferRef.current.filter(
	p=>now-p.time<WINDOW_SECONDS
	)
	
	requestAnimationFrame(draw)
	
	}
	
	draw()
	
	},[snapToNote])
	
	return(
	
	<canvas
	ref={canvasRef}
	width={900}
	height={250}
	style={{
	width:"100%",
	border:"1px solid #444",
	borderRadius:8
	}}
	/>
	
	)
	
	})
	
	export default PitchRibbonTimeline