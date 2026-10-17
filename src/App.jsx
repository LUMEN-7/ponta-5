import React, { Fragment, useLayoutEffect, useRef, useState } from 'react';

function getGameValues(sel, setSel, played, chosenSide) {
    const L = played.reduce((v,p) => p.side === 'Esquerda' ? p.outer : v, 6);
    const R = played.reduce((v,p) => p.side === 'Direita' ? p.outer : v, 4);
    const layouts = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const cells = (n) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ on: layouts[n].indexOf(i) >= 0 }));
    const mk = (a, b, vertical, extra) => ({
      id: a + '-' + b,
      label: 'Peça ' + a + ' e ' + b,
      cls: 'tile ' + (vertical ? 'v' : 'h') + (extra || ''),
      pa: cells(a),
      pb: cells(b)
    });
    const board = [...played.filter(p => p.side === 'Esquerda').reverse().map(p => mk(p.a,p.b,p.a === p.b,' placed')), ...[[6, 2], [2, 5], [5, 5], [5, 6], [6, 6], [6, 4], [4, 4]].map((p) => mk(p[0], p[1], p[0] === p[1], '')), ...played.filter(p => p.side === 'Direita').map(p => mk(p.a,p.b,p.a === p.b,' placed'))];

    const calc = (ends, sum) => (sum % 5 === 0 ? ends + ' = ' + sum + ' · ' + sum + ' ÷ 5 = ' + (sum / 5) : ends + ' = ' + sum + ' · não divide por 5');
    const optionsFor = (a, b) => {
      const out = [];
      if (a === L || b === L) {
        const n = a === L ? b : a;
        const sum = n + R;
        const pts = sum % 5 === 0 ? sum / 5 : 0;
        out.push({ side: 'Esquerda', calc: calc(n + ' + ' + R, sum), pts: pts, label: pts > 0 ? '+' + pts + (pts > 1 ? ' pts' : ' pt') : 'sem ponto', cls: pts > 0 ? 'badge good' : 'badge none', ghost: pts > 0 ? '+' + pts : '0' });
      }
      if (a === R || b === R) {
        const n = a === R ? b : a;
        const sum = L + n;
        const pts = sum % 5 === 0 ? sum / 5 : 0;
        out.push({ side: 'Direita', calc: calc(L + ' + ' + n, sum), pts: pts, label: pts > 0 ? '+' + pts + (pts > 1 ? ' pts' : ' pt') : 'sem ponto', cls: pts > 0 ? 'badge good' : 'badge none', ghost: pts > 0 ? '+' + pts : '0' });
      }
      return out;
    };

    
    const hand = [[6, 1], [3, 6], [4, 0], [2, 3], [1, 5]].filter(p => !played.some(v => v.id === p.join('-'))).map((p) => {
      const t = mk(p[0], p[1], true, ' big');
      const playable = optionsFor(p[0], p[1]).length > 0;
      t.cls = t.cls + (t.id === sel ? ' sel' : '') + (playable ? '' : ' dim');
      t.pressed = t.id === sel;
      t.pick = () => setSel(t.id);
      return t;
    });

    const parts = sel ? sel.split('-') : [];
    const options = parts.length === 2 ? optionsFor(Number(parts[0]), Number(parts[1])) : [];
    const ghost = (side) => {
      const o = options.filter((x) => x.side === side)[0];
      return o ? { on: true, label: o.ghost, cls: o.pts > 0 ? 'good' : '' } : { on: false, label: '', cls: '' };
    };

    const opps = [
      { name: 'Bia', init: 'B', team: 'us', count: 5 },
      { name: 'Caio', init: 'C', team: 'them', count: 6 },
      { name: 'Duda', init: 'D', team: 'them', count: 5 }
    ];

    return {
      leftEnd: L,
      rightEnd: R,
      curSum: L + R,
      curLabel: (L + R) % 5 === 0 ? '+' + ((L + R) / 5) + ' pts' : 'sem pontos',
      board: board,
      hand: hand,
      opps: opps,
      options: options,
      hasOptions: options.length > 0,
      noOptions: options.length === 0,
      selLabel: parts.length === 2 ? parts[0] + '|' + parts[1] : '—',
      leftGhost: ghost('Esquerda'),
      rightGhost: ghost('Direita'),
      ctaCls: options.length > 0 ? 'cta' : 'cta off'
    };
}

export default function App() {
  const [sel, setSel] = useState('6-1');
  const flightOrigin = useRef(null);
  const flightSequence = useRef(0);
  const [flying, setFlying] = useState(false);
  const [played, setPlayed] = useState([]);
  const [chosenSide, setChosenSide] = useState('Esquerda');
  const [feedback, setFeedback] = useState(null);
  const { leftEnd, rightEnd, curSum, curLabel, board, hand, opps, options, hasOptions, noOptions, selLabel, leftGhost, rightGhost, ctaCls } = getGameValues(sel, setSel, played, chosenSide);
  const selectedOption = options.find(o => o.side === chosenSide) || options[0];
  useLayoutEffect(() => {
    const origin = flightOrigin.current;
    if (!origin || !played.length) return;
    flightOrigin.current = null;
    const target = document.querySelector(`[data-placed-id="${origin.id}"]`);
    if (!target) { setFlying(false); return; }
    const end = target.getBoundingClientRect();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setFlying(false); return; }
    target.getAnimations().forEach(animation => animation.cancel());
    const dx = origin.rect.left + origin.rect.width / 2 - (end.left + end.width / 2);
    const dy = origin.rect.top + origin.rect.height / 2 - (end.top + end.height / 2);
    const sx = origin.rect.width / end.width;
    const sy = origin.rect.height / end.height;
    const animation = target.animate([
      {transform:`translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, filter:'drop-shadow(0 16px 15px rgba(0,0,0,.3))', offset:0},
      {transform:'translate(0, -7px) scale(1.045)',offset:.83},
      {transform:'translate(0, 0) scale(1)',filter:'drop-shadow(0 0 0 transparent)',offset:1}
    ], {duration:750,easing:'cubic-bezier(.22,.8,.25,1)',fill:'both'});
    animation.finished.catch(() => {}).then(() => {animation.cancel();setFlying(false);});
  }, [played]);
  const playPiece = () => {
    if (!selectedOption || feedback || flying) return;
    const source = document.querySelector(`[data-hand-id="${sel}"]`);
    if (source) flightOrigin.current = {id:sel,rect:source.getBoundingClientRect()};
    setFlying(true);
    const [a,b] = sel.split('-').map(Number);
    const outer = selectedOption.side === 'Esquerda' ? (a === leftEnd ? b : a) : (a === rightEnd ? b : a);
    setPlayed(prev => [...prev, {id:sel,a,b,outer,side:selectedOption.side,pts:selectedOption.pts}]);
    setFeedback({pts:selectedOption.pts,side:selectedOption.side,id:sel});
    const remaining = [[6,1],[3,6],[4,0],[2,3],[1,5]].map(p => p.join('-')).filter(id => id !== sel && !played.some(v => v.id === id));
    setSel(remaining[0] || '');
    setChosenSide('Esquerda');
  };
  const resetDemo = () => {flightOrigin.current = null;setFlying(false);setPlayed([]);setSel('6-1');setChosenSide('Esquerda');setFeedback(null);};
  const myScore = 18 + played.reduce((sum,p) => sum + p.pts,0);
  return (<div style={{"minHeight":"900px","display":"flex","flexDirection":"column","background":"#14090c","color":"#f6ecd2","fontFamily":"'DM Sans',system-ui,sans-serif","fontSize":"16px","lineHeight":"1.4"}}>

  <header style={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"16px","flexWrap":"wrap","padding":"16px 32px","borderBottom":"1px solid rgba(246,236,210,.1)"}}>
    <div style={{"display":"flex","alignItems":"center","gap":"16px"}}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="18" fill="#a3162a"></circle>
        <circle cx="20" cy="20" r="16" fill="none" stroke="#f6ecd2" strokeWidth="3.5" strokeDasharray="6.28 6.28"></circle>
        <circle cx="20" cy="20" r="11" fill="#1d1015" stroke="#e2b54a" strokeWidth="1.5"></circle>
        <circle cx="16" cy="16" r="1.7" fill="#f6ecd2"></circle><circle cx="24" cy="16" r="1.7" fill="#f6ecd2"></circle><circle cx="20" cy="20" r="1.7" fill="#f6ecd2"></circle><circle cx="16" cy="24" r="1.7" fill="#f6ecd2"></circle><circle cx="24" cy="24" r="1.7" fill="#f6ecd2"></circle>
      </svg>
      <span style={{"fontSize":"20px","fontWeight":"700","color":"#e2b54a"}}>Ponta de Cinco</span>
    </div>
    <div style={{"display":"flex","alignItems":"center","gap":"16px","flexWrap":"wrap"}}>
      <div className="round-status"><span className="round-kicker">PARTIDA EM ANDAMENTO</span><strong>Rodada <span>03</span></strong><span className="round-goal">Meta · 50 pontos</span></div>
      <button type="button" className="ghostbtn">Regras</button>
      <button type="button" className="ghostbtn" onClick={resetDemo}>Reiniciar demo</button>
    </div>
  </header>

  <div style={{"flex":"1","display":"flex","flexWrap":"wrap","alignItems":"stretch","gap":"24px","padding":"24px 32px"}}>

    <section style={{"flex":"999 1 640px","minWidth":"0","display":"flex","flexDirection":"column","gap":"16px"}}>

      <div className="players-grid" aria-label="Jogadores da partida">
        {opps.map((o) => <div className={`player-card ${o.team}`} key={o.name}>
          <div className={`av ${o.team} ${o.name === "Bia" ? "partner" : ""}`}>{o.init}</div>
          <div className="player-details"><strong>{o.name}</strong><span>{o.count} peças</span></div>
          <span className="player-team">{o.team === "us" ? "Sua dupla" : "Adversário"}</span>
        </div>)}
      </div>

      <div className="game-table" style={{"flex":"1","minHeight":"360px","background":"radial-gradient(ellipse at center,#15774b 0%,#0b4a2e 78%)","border":"10px solid #3a1d12","borderRadius":"24px","padding":"24px","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center","gap":"32px","boxShadow":"inset 0 0 0 2px #d4a548,inset 0 0 70px rgba(0,0,0,.35),0 16px 32px rgba(0,0,0,.5)"}}>
        <div className="table-score" style={{"display":"flex","alignItems":"center","flexWrap":"wrap","justifyContent":"center","gap":"8px","padding":"8px 16px","borderRadius":"8px","background":"rgba(20,9,12,.8)"}}>
          <span style={{"color":"#e9dcb4"}}>Pontas</span>
          <span style={{"width":"32px","height":"32px","borderRadius":"50%","background":"#f6efdc","color":"#1b1b19","fontWeight":"700","display":"flex","alignItems":"center","justifyContent":"center"}}>{leftEnd}</span>
          <span>+</span>
          <span style={{"width":"32px","height":"32px","borderRadius":"50%","background":"#f6efdc","color":"#1b1b19","fontWeight":"700","display":"flex","alignItems":"center","justifyContent":"center"}}>{rightEnd}</span>
          <span style={{"fontWeight":"700"}}>= {curSum}</span>
          <span style={{"color":"#e9dcb4"}}>÷ 5</span>
          <span className="badge good">{curLabel}</span>
        </div>

        {feedback && <div key={feedback.id} className="score-float" onAnimationEnd={() => setFeedback(null)} role="status">{feedback.pts > 0 ? `+${feedback.pts} ${feedback.pts === 1 ? "ponto" : "pontos"}` : "Jogada realizada"}</div>}
        <div className="board-track" style={{"width":"100%","overflowX":"auto","padding":"16px 0"}}>
          <div style={{"display":"flex","alignItems":"center","justifyContent":"center","gap":"8px","minWidth":"max-content","margin":"0 auto"}}>
            {leftGhost.on && <>
              <div className={`ghost ${leftGhost.cls}`} aria-label="Encaixe disponível à esquerda">{leftGhost.label}</div>
            </>}
            {board.map((t, tIndex) => <Fragment key={tIndex}>
              <div className={t.cls.replace(" placed", "")} data-placed-id={played.some(p => p.id === t.id) ? t.id : undefined} role="img" aria-label={t.label}>
                <div className="half">{t.pa.map((c, cIndex) => <Fragment key={cIndex}><div className="cell">{c.on && <><i className="pip"></i></>}</div></Fragment>)}</div>
                <div className="divider"></div>
                <div className="half">{t.pb.map((c, cIndex) => <Fragment key={cIndex}><div className="cell">{c.on && <><i className="pip"></i></>}</div></Fragment>)}</div>
              </div>
            </Fragment>)}
            {rightGhost.on && <>
              <div className={`ghost ${rightGhost.cls}`} aria-label="Encaixe disponível à direita">{rightGhost.label}</div>
            </>}
          </div>
        </div>
      </div>

      <div className="panel hand-panel" style={{"display":"flex","flexWrap":"wrap","gap":"24px 32px","alignItems":"flex-end"}}>
        <div style={{"flex":"1 1 420px","minWidth":"0"}}>
          <div style={{"display":"flex","alignItems":"center","gap":"16px"}}>
            <h2 className="h2">Sua mão</h2>
            <span className="turn-indicator"><span className="turn-dot" aria-hidden="true"></span>Sua vez</span>
          </div>
          <div style={{"display":"flex","flexWrap":"wrap","gap":"16px","alignItems":"flex-end","paddingTop":"32px"}}>
            {hand.map((t, tIndex) => <Fragment key={tIndex}>
              <button type="button" data-hand-id={t.id} className={t.cls} onClick={t.pick} aria-label={t.label} aria-pressed={t.pressed}>
                <div className="half">{t.pa.map((c, cIndex) => <Fragment key={cIndex}><div className="cell">{c.on && <><i className="pip"></i></>}</div></Fragment>)}</div>
                <div className="divider"></div>
                <div className="half">{t.pb.map((c, cIndex) => <Fragment key={cIndex}><div className="cell">{c.on && <><i className="pip"></i></>}</div></Fragment>)}</div>
              </button>
            </Fragment>)}
          </div>
        </div>

        <div style={{"flex":"1 1 280px","maxWidth":"360px","display":"flex","flexDirection":"column","gap":"16px"}}>
          <div className="muted">Jogada com a peça <b style={{"color":"#f6ecd2"}}>{selLabel}</b></div>
          {hasOptions && <>
            <div>
              {options.map((o, oIndex) => <Fragment key={oIndex}>
                <div className={`row play-option ${selectedOption?.side === o.side ? "active" : ""}`} onClick={() => setChosenSide(o.side)} role="button" tabIndex={0} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") {e.preventDefault();setChosenSide(o.side)} }} aria-pressed={selectedOption?.side === o.side}>
                  <div>
                    <div style={{"fontWeight":"500"}}>{o.side}</div>
                    <div className="muted">{o.calc}</div>
                  </div>
                  <span className={o.cls}>{o.label}</span>
                </div>
              </Fragment>)}
            </div>
          </>}
          {noOptions && <>
            <div className="row"><span className="muted">Essa peça não encaixa nas pontas {leftEnd} e {rightEnd}.</span></div>
          </>}
          <div style={{"display":"flex","flexWrap":"wrap","gap":"16px"}}>
            <button type="button" className={ctaCls} disabled={!selectedOption || !!feedback || flying} onClick={playPiece}>Jogar peça</button>
            <button type="button" className="ghostbtn">Passar a vez</button>
          </div>
        </div>
      </div>
    </section>

    <aside style={{"flex":"1 1 300px","maxWidth":"360px","display":"flex","flexDirection":"column","gap":"16px"}}>
      <div className="panel score-panel">
        <div className="score-heading"><div><span className="score-eyebrow">DISPUTA ATUAL</span><h2 className="h2">Placar</h2></div><span className="score-target">Meta <b>50</b></span></div>
        <div className="score-matchup">
          <div className="score-team us"><span className="score-team-label">NÓS</span><strong className="score-number">{myScore}</strong><span className="score-members">Você + Bia</span></div>
          <span className="score-versus">VS</span>
          <div className="score-team them"><span className="score-team-label">ELES</span><strong className="score-number">14</strong><span className="score-members">Caio + Duda</span></div>
        </div>
        <div className="score-race"><div className="score-race-track"><span className="score-race-us" style={{width:`${Math.min(100,myScore / 50 * 100)}%`}}></span><span className="score-race-them" style={{width:"28%"}}></span></div><div className="score-race-footer"><span>Progresso até a vitória</span><b>{Math.max(0,50 - myScore)} pontos restantes</b></div></div>
      </div>

      <div className="panel history-panel" style={{"flex":"1"}}>
        <h2 className="h2" style={{"marginBottom":"8px"}}>Últimas jogadas</h2>
        {played.slice().reverse().map((p,i) => <div className="row" key={p.id + i}><div><div style={{"fontWeight":"500"}}>Você jogou {p.a}|{p.b}</div><div className="muted">{p.side} · Demonstração</div></div><span className={p.pts ? "badge good" : "badge none"}>{p.pts ? `+${p.pts} Nós` : "sem ponto"}</span></div>)}
        <div className="row">
          <div>
            <div style={{"fontWeight":"500"}}>Duda jogou 4|4</div>
            <div className="muted">6 + 4 = 10 · 10 ÷ 5 = 2</div>
          </div>
          <span className="badge good">+2 Eles</span>
        </div>
        <div className="row">
          <div>
            <div style={{"fontWeight":"500"}}>Bia jogou 6|4</div>
            <div className="muted">6 + 4 = 10 · 10 ÷ 5 = 2</div>
          </div>
          <span className="badge good">+2 Nós</span>
        </div>
        <div className="row">
          <div>
            <div style={{"fontWeight":"500"}}>Caio jogou 2|5</div>
            <div className="muted">6 + 5 = 11 · não divide por 5</div>
          </div>
          <span className="badge none">sem ponto</span>
        </div>
      </div>
    </aside>
  </div>
</div>);
}
