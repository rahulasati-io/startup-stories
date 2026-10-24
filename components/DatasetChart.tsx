'use client';
import {useEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import type {DataRow} from '@/lib/data-library';

export default function DatasetChart({rows,metric,label,unit,decimals=2,step=false}:{rows:DataRow[];metric:string;label:string;unit:string;decimals?:number;step?:boolean}){
  const container=useRef<HTMLElement>(null);const [width,setWidth]=useState(900);const [active,setActive]=useState<number|null>(null);
  useEffect(()=>{if(!container.current)return;const observer=new ResizeObserver(entries=>setWidth(Math.max(240,Math.round(entries[0].contentRect.width))));observer.observe(container.current);return ()=>observer.disconnect();},[]);
  const points=rows.filter(row=>typeof row[metric]==='number');if(!points.length)return <p>No observations available for this series.</p>;
  const height=300,left=64,right=18,top=25,bottom=55;
  const values=points.map(row=>row[metric] as number);let min=Math.min(...values),max=Math.max(...values);const padding=(max-min||1)*.12;min-=padding;max+=padding;
  const x=(i:number)=>left+i*(width-left-right)/Math.max(1,points.length-1),y=(v:number)=>top+(max-v)/(max-min)*(height-top-bottom);
  const d=values.map((v,i)=>i?(step?`H${x(i)}V${y(v)}`:`L${x(i)} ${y(v)}`):`M${x(i)} ${y(v)}`).join(' ');
  const ticks=Array.from({length:4},(_,i)=>min+(max-min)*i/3);
  const selected=active===null?null:points[active];
  const selectedPeriod=selected?(selected.period.length===4?selected.period:new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(selected.period+'T00:00:00Z'))):'';
  const showValue=(event:PointerEvent<SVGSVGElement>)=>{const rect=event.currentTarget.getBoundingClientRect();const position=(event.clientX-rect.left)*width/rect.width;setActive(Math.max(0,Math.min(points.length-1,Math.round((position-left)/(width-left-right)*(points.length-1)))));};
  return <figure ref={container} className="mt-5"><figcaption className="sr-only">{label} ({unit})</figcaption>
    <div className="relative">
      <svg role="img" tabIndex={0} aria-label={`${label}, ${points[0].period} to ${points.at(-1)!.period}. Hover or tap for values; use left and right arrow keys to explore. Full values are available in the table below.`}
        onPointerMove={showValue} onPointerDown={showValue}
        onPointerLeave={()=>setActive(null)} onFocus={()=>setActive(index=>index??points.length-1)} onBlur={()=>setActive(null)}
        onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key)){event.preventDefault();if(event.key==='Escape')setActive(null);else if(event.key==='Home')setActive(0);else if(event.key==='End')setActive(points.length-1);else setActive(index=>Math.max(0,Math.min(points.length-1,(index??points.length-1)+(event.key==='ArrowLeft'?-1:1))));}}}
        viewBox={`0 0 ${width} ${height}`} className="h-auto w-full rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"><title>{label}</title><desc>{points.length} observations. Units: {unit}.</desc>
        <text x={left} y="12" fontSize="12" fill="#71717a">{unit}</text>
        {ticks.map((v,i)=><g key={i}><line x1={left} x2={width-right} y1={y(v)} y2={y(v)} stroke="#e4e4e7"/><text x={left-12} y={y(v)+4} textAnchor="end" fill="#52525b" fontSize="12">{v.toLocaleString('en-IN',{maximumFractionDigits:1})}</text></g>)}
        <path d={d} fill="none" stroke="#a64a1b" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
        {active!==null&&selected&&<g pointerEvents="none"><line x1={x(active)} x2={x(active)} y1={top} y2={height-bottom} stroke="#71717a" strokeDasharray="4 4"/><circle cx={x(active)} cy={y(values[active])} r="5" fill="#a64a1b" stroke="white" strokeWidth="2"/></g>}
        {(width<430?[0,points.length-1]:[0,Math.floor((points.length-1)/2),points.length-1]).filter((v,i,a)=>a.indexOf(v)===i).map(i=><text key={i} x={x(i)} y={height-27} textAnchor={i===0?'start':i===points.length-1?'end':'middle'} fontSize="12" fill="#52525b">{points[i].period}</text>)}<text x={left} y={height-5} fontSize="12" fill="#71717a">Observation period</text>
      </svg>
      {active!==null&&selected&&<div role="tooltip" aria-live="polite" className="pointer-events-none absolute top-0 z-10 w-44 rounded-lg bg-zinc-950 px-3 py-2 text-sm text-white shadow-lg" style={{left:`${Math.min(Math.max(x(active),88),width-88)/width*100}%`,transform:'translateX(-50%)'}}><p className="text-xs text-zinc-300">{selectedPeriod}</p><p className="mt-1 font-semibold tabular-nums">{Number(selected[metric]).toLocaleString('en-IN',{maximumFractionDigits:decimals})} {unit}</p></div>}
    </div>
  </figure>;
}
