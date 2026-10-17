import React, { Fragment, useState } from 'react';

function getGameValues(sel, setSel) {
    const L = 6;
    const R = 4;
    const layouts = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const cells = (n) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ on: layouts[n].indexOf(i) >= 0 }));
    const mk = (a, b, vertical, extra) => ({
      id: a + '-' + b,
      label: 'Peça ' + a + ' e ' + b,
      cls: 'tile ' + (vertical ? 'v' : 'h') + (extra || ''),
      pa: cells(a),
      pb: cells(b)
    });
    const board = [[6, 2], [2, 5], [5, 5], [5, 6], [6, 6], [6, 4], [4, 4]].map((p) => mk(p[0], p[1], p[0] === p[1], ''));

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

    
    const hand = [[6, 1], [3, 6], [4, 0], [2, 3], [1, 5]].map((p) => {
      const t = mk(p[0], p[1], true, ' big');
      const playable = optionsFor(p[0], p[1]).length > 0;
      t.cls = t.cls + (t.id === sel ? ' sel' : '') + (playable ? '' : ' dim');
      t.pressed = t.id === sel;
      t.pick = () => setSel(t.id);
      return t;
    });

    const parts = sel.split('-');
    const options = optionsFor(Number(parts[0]), Number(parts[1]));
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
      curLabel: '+' + ((L + R) / 5) + ' pts',
      board: board,
      hand: hand,
      opps: opps,
      options: options,
      hasOptions: options.length > 0,
      noOptions: options.length === 0,
      selLabel: parts[0] + '|' + parts[1],
      leftGhost: ghost('Esquerda'),
      rightGhost: ghost('Direita'),
      ctaCls: options.length > 0 ? 'cta' : 'cta off'
    };
}

export default function App() {
  const [sel, setSel] = useState('6-1');
  const { leftEnd, rightEnd, curSum, curLabel, board, hand, opps, options, hasOptions, noOptions, selLabel, leftGhost, rightGhost, ctaCls } = getGameValues(sel, setSel);
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
      <span className="muted">Rodada 3 · Meta de 50 pontos</span>
      <button type="button" className="ghostbtn">Regras</button>
      <button type="button" className="ghostbtn">Sair da mesa</button>
    </div>
  </header>

  <div style={{"flex":"1","display":"flex","flexWrap":"wrap","alignItems":"stretch","gap":"24px","padding":"24px 32px"}}>

    <section style={{"flex":"999 1 640px","minWidth":"0","display":"flex","flexDirection":"column","gap":"16px"}}>

      <div className="panel players-panel" style={{"padding":"16px 24px","display":"flex","flexWrap":"wrap","gap":"16px 32px"}}>
        {opps.map((o, oIndex) => <Fragment key={oIndex}>
          <div style={{"display":"flex","alignItems":"center","gap":"16px"}}>
            <div className={`av ${o.team} ${o.name === "Bia" ? "partner" : ""}`}>{o.init}</div>
            <div>
              <div style={{"fontWeight":"500"}}>{o.name}</div>
              <div className="muted">{o.count} peças</div>
            </div>
          </div>
        </Fragment>)}
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

        <div className="board-track" style={{"width":"100%","overflowX":"auto","padding":"16px 0"}}>
          <div style={{"display":"flex","alignItems":"center","justifyContent":"center","gap":"8px","minWidth":"max-content","margin":"0 auto"}}>
            {leftGhost.on && <>
              <div className={`ghost ${leftGhost.cls}`} aria-label="Encaixe disponível à esquerda">{leftGhost.label}</div>
            </>}
            {board.map((t, tIndex) => <Fragment key={tIndex}>
              <div className={t.cls} role="img" aria-label={t.label}>
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
              <button type="button" className={t.cls} onClick={t.pick} aria-label={t.label} aria-pressed={t.pressed}>
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
                <div className="row">
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
            <button type="button" className={ctaCls}>Jogar peça</button>
            <button type="button" className="ghostbtn">Passar a vez</button>
          </div>
        </div>
      </div>
    </section>

    <aside style={{"flex":"1 1 300px","maxWidth":"360px","display":"flex","flexDirection":"column","gap":"16px"}}>
      <div className="panel score-panel" style={{"display":"flex","flexDirection":"column","gap":"24px"}}>
        <h2 className="h2">Placar</h2>
        <div>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"baseline","marginBottom":"8px"}}>
            <span style={{"fontWeight":"500"}}>Nós <span className="muted">· Você e Bia</span></span>
            <span style={{"fontSize":"32px","fontWeight":"700","color":"#e2b54a"}}>18</span>
          </div>
          <div style={{"height":"8px","borderRadius":"8px","background":"rgba(246,236,210,.12)"}}><div style={{"width":"36%","height":"100%","borderRadius":"8px","background":"#e2b54a"}}></div></div>
        </div>
        <div>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"baseline","marginBottom":"8px"}}>
            <span style={{"fontWeight":"500"}}>Eles <span className="muted">· Caio e Duda</span></span>
            <span style={{"fontSize":"32px","fontWeight":"700","color":"#ff8a97"}}>14</span>
          </div>
          <div style={{"height":"8px","borderRadius":"8px","background":"rgba(246,236,210,.12)"}}><div style={{"width":"28%","height":"100%","borderRadius":"8px","background":"#ff8a97"}}></div></div>
        </div>
      </div>

      <div className="panel history-panel" style={{"flex":"1"}}>
        <h2 className="h2" style={{"marginBottom":"8px"}}>Últimas jogadas</h2>
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
