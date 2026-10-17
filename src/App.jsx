import React,{useState,useRef,useLayoutEffect} from 'react';
const first=[[6,2],[2,2],[2,5],[5,5],[5,1],[1,4]], initialHand=[[6,1],[0,5],[4,4],[1,3],[2,0]];
const dots={0:[],1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function Tile({t}){return <div className="tile">{t.map((n,i)=><div className="half" key={i}>{Array.from({length:9},(_,j)=>dots[n].includes(j)?<i key={j}/>:<span key={j}/>)}</div>)}</div>}
function Slot({t,id}){return <div className={'slot '+(t[0]===t[1]?'dbl':'')} data-target={id}><Tile t={t}/></div>}
function ends(c){let l=c[0],r=c[c.length-1];return {L:l[0],R:r[1],sum:(l[0]===l[1]?2*l[0]:l[0])+(r[0]===r[1]?2*r[1]:r[1])}}
function attempt(chain,t,side){let e=ends(chain),m=side==='L'?e.L:e.R,n;if(t[0]===m)n=side==='L'?[t[1],t[0]]:[t[0],t[1]];else if(t[1]===m)n=side==='L'?[t[0],t[1]]:[t[1],t[0]];else return null;let s=ends(side==='L'?[n,...chain]:[...chain,n]).sum;return {n,sum:s,pts:s%5===0?s/5:0}}
function CoinIcon(){return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#d3aa51"/><circle cx="16" cy="16" r="10.5" fill="#f2d27f" stroke="#956c2e" strokeWidth="1"/><text x="16" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6f4a1a">5</text></svg>}
function Seat({name,count,side}){const info=<div className="seat-info"><span className="n">{name}</span><small>{side==='bia'?'sua dupla · ':''}{count} peças</small></div>;const backs=<div className="back" aria-label={count+' peças'}>{Array.from({length:count},(_,i)=><span key={i}/>)}</div>;return <div className={'seat '+side}>{side==='bia'?<>{backs}{info}</>:<>{info}{backs}</>}</div>}

function TableViewport({children}) {
  const viewport = useRef(null);
  const content = useRef(null);
  const [edges, setEdges] = useState({left:false,right:false,up:false,down:false});
  useLayoutEffect(() => {
    const node = viewport.current;
    const update = () => setEdges({
      left: node.scrollLeft > 1,
      right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1,
      up: node.scrollTop > 1,
      down: node.scrollTop + node.clientHeight < node.scrollHeight - 1,
    });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    observer.observe(content.current);
    node.addEventListener('scroll', update, {passive:true});
    update();
    return () => { observer.disconnect(); node.removeEventListener('scroll', update); };
  }, [children]);
  function navigate(direction) {
    const node = viewport.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollBy({left:(direction==='left'?-1:direction==='right'?1:0)*node.clientWidth*.65,
      top:(direction==='up'?-1:direction==='down'?1:0)*node.clientHeight*.65,
      behavior:reduce?'instant':'smooth'});
  }
  const overflow = Object.values(edges).some(Boolean);
  return <>
    <div className="table-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Mesa de dominó navegável">
      <div className="table-content" ref={content}>{children}</div>
    </div>
    {overflow && [['up','↑','cima'],['down','↓','baixo'],['left','←','esquerda'],['right','→','direita']].map(([direction,icon,label]) =>
      <button key={direction} type="button" className={'table-arrow '+direction}
        aria-label={'Navegar para '+label} disabled={!edges[direction]} onClick={()=>navigate(direction)}>{icon}</button>)}
  </>;
}

export default function App(){
const [chain,setChain]=useState(first),[hand,setHand]=useState(initialHand),[sel,setSel]=useState(null),[hov,setHov]=useState(null),[score,setScore]=useState(18),[hint,setHint]=useState('Passe o mouse numa peça para ver quanto ela vale.'),[float,setFloat]=useState(null),[last,setLast]=useState(null),[moving,setMoving]=useState(false);
const source=useRef(null),current=sel||hov,e=ends(chain);
const leftPreview=current&&attempt(chain,current,'L'),rightPreview=current&&attempt(chain,current,'R');
useLayoutEffect(()=>{
  if(!source.current)return;
  const {rect,id,html}=source.current;source.current=null;
  const target=document.querySelector('[data-target="'+id+'"]');
  if(!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches){setMoving(false);return}
  const finish=()=>setMoving(false);
  const dst=target.getBoundingClientRect();
  // A peça voa numa camada acima da mesa, sem ser cortada pelo scroll do feltro.
  const layer=document.createElement('div');
  layer.className='flying-domino';
  layer.style.cssText='left:'+rect.left+'px;top:'+rect.top+'px;width:'+rect.width+'px;height:'+rect.height+'px';
  layer.innerHTML=html;
  document.body.appendChild(layer);
  target.style.visibility='hidden';
  const animation=layer.animate([
    {transform:'translate(0,0) scale(1)',offset:0},
    {transform:'translate('+((dst.left+dst.width/2)-(rect.left+rect.width/2))*.72+'px,'+((dst.top+dst.height/2)-(rect.top+rect.height/2))*.72+'px) scale(.95)',offset:.65},
    {transform:'translate('+(dst.left+dst.width/2-rect.left-rect.width/2)+'px,'+(dst.top+dst.height/2-rect.top-rect.height/2)+'px) scale(.88)',offset:1}
  ],{duration:750,easing:'cubic-bezier(.24,.77,.3,1)',fill:'forwards'});
  animation.finished.catch(()=>{}).then(()=>{target.style.visibility='';layer.remove();finish()});
  return ()=>{animation.cancel();target.style.visibility='';layer.remove()}
},[chain]);
function play(side,tile=sel){if(!tile||moving)return;let r=attempt(chain,tile,side);if(!r)return;let i=hand.indexOf(tile),button=document.querySelector('[data-hand="'+i+'"]'),id='placed-'+Date.now();if(button)source.current={rect:button.getBoundingClientRect(),id,html:button.innerHTML};setMoving(!!button);setChain(c=>side==='L'?[r.n,...c]:[...c,r.n]);setHand(h=>h.filter(t=>t!==tile));setSel(null);setHov(null);setLast({side,id});if(r.pts){setScore(s=>s+r.pts);setFloat({pts:r.pts,id})}setHint(r.pts?'Pontas somam '+r.sum+': +'+r.pts+' para sua dupla.':'Pontas somam '+r.sum+': sem pontos.')}
function reset(){source.current=null;setChain(first);setHand(initialHand);setSel(null);setHov(null);setScore(18);setFloat(null);setLast(null);setMoving(false);setHint('Passe o mouse numa peça para ver quanto ela vale.')}
function ghost(side){let r=current&&attempt(chain,current,side);return r?<button className="ghost" type="button" disabled={moving} key={side} onClick={()=>play(side,current)} aria-label={'Jogar na ponta '+(side==='L'?'esquerda':'direita')}><Slot t={r.n}/></button>:null}
return <main className="wrap"><header className="top"><div className="brand"><span className="coin-badge"><CoinIcon/></span><h1>Ponta de Cinco</h1></div><div className="rodada"><small>Rodada</small><b>3</b></div><div className="placar"><div className="lado nos"><small>Nós</small><b>{score}</b></div><div className="barras"><div className="bar nos"><span style={{width:Math.min(score,50)*2+'%'}}/></div><div className="bar eles"><span style={{width:'28%'}}/></div><em>meta 50</em></div><div className="lado eles"><small>Eles</small><b>14</b></div></div><button className="rules" onClick={reset}>Reiniciar</button></header>
<div className="arena"><Seat name="Bia" count={5} side="bia"/><Seat name="Caio" count={6} side="caio"/><div className="mesa"><div className="feltro">{float&&<div className="flutua" key={float.id} onAnimationEnd={()=>setFloat(null)} role="status">+{float.pts}</div>}<TableViewport><div className="cadeia">{ghost('L')}<div className="ponta"><span className="chip">{e.L}</span></div>{chain.map((t,i)=><Slot key={i} t={t} id={last&&((last.side==='L'&&i===0)||(last.side==='R'&&i===chain.length-1))?last.id:undefined}/>)}<div className="ponta"><span className="chip">{e.R}</span></div>{ghost('R')}</div></TableViewport></div></div><Seat name="Duda" count={5} side="duda"/></div>
<div className="hand-zone"><div className="mao" onMouseLeave={()=>setHov(null)} aria-label="Suas peças">{hand.map((t,i)=>{let ok=!!(attempt(chain,t,'L')||attempt(chain,t,'R')),a=(i-(hand.length-1)/2)*4;return <button key={t.join('-')} type="button" className={(ok?'':'no')+(sel===t?' sel':'')} data-hand={i} style={{transform:'rotate('+a+'deg) translateY('+Math.abs(a)*1.2+'px)'}} disabled={!ok||moving} onMouseEnter={()=>ok&&setHov(t)} onFocus={()=>ok&&setHov(t)} onClick={()=>{setSel(t);setHov(null);setHint('Escolha uma das pontas tracejadas para jogar.')}} aria-pressed={sel===t} aria-label={'Peça '+t[0]+' e '+t[1]}><Tile t={t}/></button>})}</div>
<section className="play-hints" aria-label="Dicas de jogada"><div className="hints-head"><strong>{current ? `Peça ${current[0]} | ${current[1]}` : "Possíveis jogadas"}</strong><span>{sel ? "Escolha onde encaixar" : "Passe o mouse em uma peça"}</span></div>{current && <div className="hints-options">{[["L","Esquerda",leftPreview],["R","Direita",rightPreview]].map(([side,label,result])=><button key={side} type="button" disabled={!result||moving||!sel} onClick={()=>play(side,sel)} className={"hint-option "+(result?.pts?"scores":"")}><span className="hint-side">{label}</span><span className="hint-calc">{result?`Soma ${result.sum} ${result.pts?`÷ 5 = ${result.pts}`:"· não divide por 5"}`:"Não encaixa"}</span><span className="hint-points">{result?(result.pts?`+${result.pts} pt${result.pts!==1?"s":""}`:"0 pts"):"—"}</span></button>)}</div>}{!current && <p className="hint-empty">Veja os encaixes e quantos pontos cada peça pode render.</p>}</section></div>
<footer className="rodape"><span aria-live="polite">{hint}</span><button type="button" onClick={()=>{setSel(null);setHov(null);setHint('Você passou a vez.')}}>Passar a vez</button></footer></main>
}