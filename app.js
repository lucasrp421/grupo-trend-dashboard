// =============================================
// CONFIGURAÇÃO
// =============================================
const API_URL = "https://script.google.com/macros/s/AKfycbyOSCYWp7Y1nIRRU2cM4Hug1GdWwVrDdUcA9EAjbOwlQnZNY-nehf_BKC82ISSMdFis_A/exec";

// =============================================
// AUTH — verificação de sessão
// =============================================
const GT_USER           = sessionStorage.getItem('gt_user');
const GT_ROLE           = sessionStorage.getItem('gt_role');
const GT_LOJA           = sessionStorage.getItem('gt_loja');
const GT_PRIMEIRO_ACESSO = sessionStorage.getItem('gt_primeiroAcesso') === 'sim';

if (!GT_USER) { window.location.href = 'login.html'; }

async function apiPost(body) {
  const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(body) });
  return res.json();
}

// =============================================
// ESTADO GLOBAL
// =============================================
let REGISTROS_BRUTOS = null; // todos os dados carregados uma vez
let LISTAS = null;            // lojas, vendedoras, vendedorasPorLoja
let DADOS = null;             // resultado do filtro atual (para o relatório)
let rankTabD = 'todas';
let rankTabM = 'todas';
let mOpen = false;
let dCH, dCM, dCS, mCH, mCM, mCS;

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const toInput = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toBR = s => { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
const parseBR = s => { const [d,m,y] = s.split('/'); return new Date(+y, +m-1, +d); };
const hoje = new Date();
const C = { color: '#4a4a60', grid: 'rgba(255,255,255,0.04)', blue: '#5b9cf6', red: '#e05c5c' };

// =============================================
// LAYOUT
// =============================================
function initLayout() {
  const isMobile = window.innerWidth < 768;
  $('viewDesktop').style.display = isMobile ? 'none' : 'block';
  $('viewMobile').style.display  = isMobile ? 'block' : 'none';
}
window.addEventListener('resize', initLayout);

// =============================================
// NAVEGAÇÃO MOBILE
// =============================================
function navTo(pg) {
  document.querySelectorAll('.m-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.m-nav-btn').forEach(b => b.classList.remove('active'));
  $('pg-' + pg).classList.add('active');
  $('nb-' + pg).classList.add('active');
  document.querySelector('.m-scroll').scrollTop = 0;
}

// =============================================
// STATUS
// =============================================
function setStatus(txt, spin) {
  ['dDot','mDot'].forEach(id => { const e=$(id); if(e) e.className='s-dot'+(spin?' spin':''); });
  ['dTxt','mTxt'].forEach(id => { const e=$(id); if(e) e.textContent=txt; });
}
function hideLoading() {
  const el = $('loadingScreen');
  if (el) { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }
}

// =============================================
// API — chamada única, sem filtros de data
// =============================================
async function fetchTodos() {
  const res = await fetch(API_URL + '?acao=dados');
  if (!res.ok) throw new Error('Erro na API: ' + res.status);
  return await res.json();
}

// =============================================
// FILTRO LOCAL — instantâneo, sem API
// =============================================
function filtrarLocalmente(filtros) {
  if (!REGISTROS_BRUTOS) return null;

  // Força filtro de loja para usuário não-admin
  if (GT_ROLE === 'loja' && GT_LOJA) {
    filtros = { ...filtros, lojas: [GT_LOJA] };
  }

  const dI = filtros.dataInicio ? parseBR(filtros.dataInicio) : null;
  const dF = filtros.dataFim    ? parseBR(filtros.dataFim)    : null;
  if (dF) dF.setHours(23,59,59);

  const filtrados = REGISTROS_BRUTOS.filter(r => {
    // Data — compara por _date (Date object) sem hora
    if (dI || dF) {
      if (!r._date) return false;
      const rd = new Date(r._date.getFullYear(), r._date.getMonth(), r._date.getDate());
      if (dI) { const di = new Date(dI.getFullYear(), dI.getMonth(), dI.getDate()); if (rd < di) return false; }
      if (dF) { const df = new Date(dF.getFullYear(), dF.getMonth(), dF.getDate()); if (rd > df) return false; }
    }
    // Loja
    if (filtros.lojas?.length && !filtros.lojas.includes(r.loja)) return false;
    // Marca
    if (filtros.marcas?.length && !filtros.marcas.includes(r.marca)) return false;
    // Vendedora
    if (filtros.vendedora && r.vendedor?.toLowerCase() !== filtros.vendedora.toLowerCase()) return false;
    return true;
  });

  const total = filtrados.length;
  const sim   = filtrados.filter(r => r.comprou === 'SIM').length;
  const nao   = filtrados.filter(r => r.comprou === 'NÃO').length;
  const kpis  = { total, sim, nao, conv: total > 0 ? +((sim/total)*100).toFixed(1) : 0 };

  // Por loja
  const LOJAS_NOMES = LISTAS.lojas;
  const porLoja = LOJAS_NOMES.map(nome => {
    const marca = nome.includes('Santa Lolla') ? 'Santa Lolla' : 'Havaianas';
    const reg   = filtrados.filter(r => r.loja === nome);
    const lSim  = reg.filter(r => r.comprou === 'SIM').length;
    const lNao  = reg.filter(r => r.comprou === 'NÃO').length;
    return { nome, marca, total: reg.length, sim: lSim, nao: lNao,
      conv: reg.length > 0 ? +((lSim/reg.length)*100).toFixed(1) : 0,
      semDados: reg.length === 0 };
  });

  // Por marca
  const porMarca = ['Santa Lolla','Havaianas'].map(marca => {
    const reg  = filtrados.filter(r => r.marca === marca);
    const mSim = reg.filter(r => r.comprou === 'SIM').length;
    const mNao = reg.filter(r => r.comprou === 'NÃO').length;
    return { marca, total: reg.length, sim: mSim, nao: mNao,
      conv: reg.length > 0 ? +((mSim/reg.length)*100).toFixed(1) : 0 };
  });

  // Ranking vendedoras
  const vendMap = {};
  filtrados.forEach(r => {
    const v = r.vendedor; if (!v) return;
    if (!vendMap[v]) vendMap[v] = { nome:v, loja:r.loja, marca:r.marca, total:0, sim:0, nao:0 };
    vendMap[v].total++;
    if (r.comprou === 'SIM') vendMap[v].sim++;
    if (r.comprou === 'NÃO') vendMap[v].nao++;
  });
  const ranking = Object.values(vendMap)
    .map(v => ({ ...v, conv: v.total > 0 ? +((v.sim/v.total)*100).toFixed(1) : 0 }))
    .sort((a,b) => b.sim - a.sim);

  // Motivos
  const motivoMap = {};
  filtrados.filter(r => r.comprou === 'NÃO').forEach(r => {
    const m = r.motivo || 'Não informado';
    motivoMap[m] = (motivoMap[m]||0) + 1;
  });
  const motivos = Object.entries(motivoMap)
    .map(([motivo, qtd]) => ({ motivo, qtd, pct: nao > 0 ? +((qtd/nao)*100).toFixed(1) : 0 }))
    .sort((a,b) => b.qtd - a.qtd);

  // Por hora
  const porHora = Array.from({length:24}, (_,h) =>
    filtrados.filter(r => r._hora === h).length
  );

  // Série 30 dias
  const serie = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const label = `${pad(d.getDate())}/${pad(d.getMonth()+1)}`;
    const dayStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
    const qtd = filtrados.filter(r => r._dayStr === dayStr).length;
    serie.push({ data: label, qtd });
  }

  return {
    meta: {
      atualizadoEm: LISTAS.atualizadoEm || '—',
      totalRegistros: REGISTROS_BRUTOS.length,
      filtrosAplicados: filtros
    },
    kpis, porLoja, porMarca, ranking, motivos, porHora, serie,
    listas: LISTAS
  };
}

// =============================================
// NORMALIZA REGISTROS
// data vem como "27/05/2026" (BR) ou "2026-05-27..." (ISO)
// hora vem como "09:50:00", inteiro ou decimal
// =============================================
function normalizarRegistros(registros) {
  return registros.map(r => {
    let _date = null, _hora = null, _dayStr = null;

    if (r.data && typeof r.data === 'string' && r.data.trim() !== '') {
      const s = r.data.trim();
      let d, m, y;

      if (s.includes('/')) {
        // Formato BR: "27/05/2026" — parseia manualmente para evitar ambiguidade
        [d, m, y] = s.split('/').map(Number);
      } else if (s.includes('-')) {
        // Formato ISO: "2026-05-27" ou "2026-05-27T09:50:00"
        const part = s.substring(0, 10);
        [y, m, d] = part.split('-').map(Number);
      }

      if (d && m && y && !isNaN(d) && !isNaN(m) && !isNaN(y)) {
        _date   = new Date(y, m - 1, d, 12, 0, 0); // meio-dia evita virada de fuso
        _dayStr = `${pad(d)}/${pad(m)}/${y}`;
      }
    }

    // Hora
    const h = r.hora;
    if (h !== null && h !== undefined && h !== '') {
      if (typeof h === 'number') {
        _hora = h >= 1 ? Math.floor(h) : Math.floor(h * 24);
      } else if (typeof h === 'string' && h.trim() !== '') {
        _hora = h.includes(':') ? parseInt(h.split(':')[0], 10) : parseInt(h, 10);
      }
      if (isNaN(_hora)) _hora = null;
    }

    return { ...r, _date, _hora, _dayStr };
  });
}

// =============================================
// SELECTS
// =============================================
function popularSelects(listas) {
  [['dLoja','dVend'],['mLoja','mVend']].forEach(([lid,vid]) => {
    const sl=$(lid), sv=$(vid); if(!sl||!sv) return;
    if(sl.options.length<=1) listas.lojas.forEach(l=>{const o=document.createElement('option');o.value=l;o.textContent=l;sl.appendChild(o);});
    if(sv.options.length<=1) listas.vendedoras.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sv.appendChild(o);});
  });
}
function dSincLojas() {
  const m=$('dMarca').value;
  Array.from($('dLoja').options).forEach(o=>{
    if(!o.value){o.style.display='';return;}
    o.style.display=(!m||(m==='Santa Lolla'&&o.value.includes('Santa Lolla'))||(m==='Havaianas'&&o.value.includes('Havaianas')&&!o.value.includes('Santa')))?'':'none';
  });
}
function mSincLojas() {
  const m=$('mMarca').value;
  Array.from($('mLoja').options).forEach(o=>{
    if(!o.value){o.style.display='';return;}
    o.style.display=(!m||(m==='Santa Lolla'&&o.value.includes('Santa Lolla'))||(m==='Havaianas'&&o.value.includes('Havaianas')&&!o.value.includes('Santa')))?'':'none';
  });
}
function sincVendedoras(pre) {
  if(!LISTAS) return;
  const lojaVal=$(pre+'Loja').value, vendSel=$(pre+'Vend'), atual=vendSel.value;
  while(vendSel.options.length>1) vendSel.remove(1);
  const lista=(lojaVal&&LISTAS.vendedorasPorLoja?.[lojaVal])||LISTAS.vendedoras||[];
  lista.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;vendSel.appendChild(o);});
  vendSel.value=lista.includes(atual)?atual:'';
}

// =============================================
// FILTROS
// =============================================
function buildF(pre) {
  const f={};
  const dI=$(pre+'DI')?.value, dF=$(pre+'DF')?.value;
  const marca=$(pre+'Marca')?.value, loja=$(pre+'Loja')?.value, vend=$(pre+'Vend')?.value;
  if(dI) f.dataInicio=toBR(dI);
  if(dF) f.dataFim=toBR(dF);
  if(marca) f.marcas=[marca];
  if(loja) f.lojas=[loja];
  if(vend) f.vendedora=vend;
  return f;
}

function renderMChips(f) {
  const c=[];
  if(f.dataInicio||f.dataFim) c.push(`${f.dataInicio||'início'} → ${f.dataFim||'hoje'}`);
  if(f.marcas) c.push(f.marcas[0]); if(f.lojas) c.push(f.lojas[0]); if(f.vendedora) c.push(f.vendedora);
  const el=$('mChips'); if(!el) return;
  el.innerHTML=c.map(x=>`<span class="m-chip-a">${x}<span class="m-chip-x" onclick="mLimpar()">×</span></span>`).join('');
  const b=$('mBadge'); if(b){b.style.display=c.length?'inline':'none';b.textContent=c.length;}
}
function renderDChips(f) {
  const c=[];
  if(f.dataInicio||f.dataFim) c.push(`${f.dataInicio||'início'} → ${f.dataFim||'hoje'}`);
  if(f.marcas) c.push(f.marcas[0]); if(f.lojas) c.push(f.lojas[0]); if(f.vendedora) c.push(f.vendedora);
  const el=$('dChips'); if(!el) return;
  el.innerHTML=c.map(x=>`<span class="chip">${x}<span class="chip-x" onclick="dLimpar()">×</span></span>`).join('');
}

// Aplica filtro local — instantâneo
function dAplicar() {
  if(!REGISTROS_BRUTOS) return;
  const f=buildF('d');
  const d=filtrarLocalmente(f);
  if(!d) return;
  DADOS=d; renderDash(d); renderDChips(f);
}
function mAplicar() {
  if(!REGISTROS_BRUTOS) return;
  const f=buildF('m');
  const d=filtrarLocalmente(f);
  if(!d) return;
  mOpen=false; $('mDrawer').className='m-drawer';
  DADOS=d; renderDash(d); renderMChips(f);
}
function mToggle() { mOpen=!mOpen; $('mDrawer').className='m-drawer'+(mOpen?' open':''); }

function dLimpar() {
  ['dDI','dDF','dMarca','dLoja','dVend'].forEach(id=>{const e=$(id);if(e)e.value='';});
  $('dChips').innerHTML=''; sincVendedoras('d'); aplicarHoje();
}
function mLimpar() {
  ['mDI','mDF','mMarca','mLoja','mVend'].forEach(id=>{const e=$(id);if(e)e.value='';});
  renderMChips({}); sincVendedoras('m'); aplicarHoje();
}

function aplicarHoje() {
  const hj   = toInput(hoje); // "2026-06-11"
  const hjBR = toBR(hj);      // "11/06/2026"
  // Seta início E fim como hoje — mostra só hoje por padrão
  ['dDI','dDF','mDI','mDF'].forEach(id => { const e = $(id); if (e) e.value = hj; });
  const f = { dataInicio: hjBR, dataFim: hjBR };
  const d = filtrarLocalmente(f);
  if (d) { DADOS = d; renderDash(d); }
}

// =============================================
// CARREGAR — chamada única à API
// =============================================
async function carregar() {
  setStatus('carregando...', true);
  try {
    const resposta = await fetchTodos();

    if (resposta.erro) throw new Error(resposta.erro);

    REGISTROS_BRUTOS = normalizarRegistros(resposta.registros || []);
    LISTAS = resposta.listas || { lojas:[], vendedoras:[], vendedorasPorLoja:{} };
    popularSelects(LISTAS);

    // Reseta filtros
    ['dDI','dDF','mDI','mDF'].forEach(id => { const e=$(id); if(e) e.value=''; });
    ['dMarca','mMarca','dLoja','mLoja','dVend','mVend'].forEach(id => { const e=$(id); if(e) e.value=''; });
    const chips = $('dChips'); if(chips) chips.innerHTML='';
    renderMChips({});

    // Se for loja, trava filtro
    if (GT_ROLE === 'loja') {
      ['dLoja','mLoja'].forEach(id => {
        const e = $(id); if (!e) return;
        e.value = GT_LOJA;
        e.disabled = true;
      });
      ['dMarca','mMarca'].forEach(id => {
        const e = $(id); if (!e) return;
        e.disabled = true;
      });
    }

    aplicarHoje();
    setStatus(resposta.atualizadoEm || new Date().toLocaleString('pt-BR'), false);
  } catch(e) {
    console.error('Erro ao carregar:', e);
    setStatus('erro ao carregar — ' + e.message, false);
  } finally {
    hideLoading();
  }
}

// Atualizar dados da API (botão atualizar)
async function atualizarDados() {
  setStatus('atualizando...', true);
  try {
    const resposta = await fetchTodos();
    REGISTROS_BRUTOS = normalizarRegistros(resposta.registros || []);
    LISTAS = resposta.listas;
    // Reaplicar filtros atuais
    const isMobile = window.innerWidth < 768;
    const pre = isMobile ? 'm' : 'd';
    const f = buildF(pre);
    const d = filtrarLocalmente(f);
    if(d){DADOS=d;renderDash(d);}
    setStatus(resposta.atualizadoEm || new Date().toLocaleString('pt-BR'), false);
  } catch(e) {
    setStatus('erro ao atualizar', false);
  }
}

// =============================================
// RENDER DASHBOARD
// =============================================
function renderDash(d) {
  const k=d.kpis;
  [['dkT','mkT',k.total],['dkS','mkS',k.sim],['dkN','mkN',k.nao],['dkC','mkC',k.conv+'%']].forEach(([di,mi,v])=>{
    const de=$(di),me=$(mi); if(de)de.textContent=v; if(me)me.textContent=v;
  });
  const sl=d.porMarca.find(m=>m.marca==='Santa Lolla')||{conv:0,total:0};
  const hv=d.porMarca.find(m=>m.marca==='Havaianas')||{conv:0,total:0};
  ['dkSL','mkSL'].forEach(id=>{const e=$(id);if(e)e.textContent=sl.conv+'%';});
  ['dkSLs','mkSLs'].forEach(id=>{const e=$(id);if(e)e.textContent=sl.total+' atend.';});
  ['dkHV','mkHV'].forEach(id=>{const e=$(id);if(e)e.textContent=hv.conv+'%';});
  ['dkHVs','mkHVs'].forEach(id=>{const e=$(id);if(e)e.textContent=hv.total+' atend.';});
  renderLojas(d.porLoja); renderMotivos(d.motivos);
  renderRanking(d.ranking,rankTabD,'d'); renderRanking(d.ranking,rankTabM,'m');
  renderHora(d.porHora); renderMarca(d.porMarca); renderSerie(d.serie);
}

function convColor(conv) {
  if(conv>=90) return 'var(--blue)';
  if(conv>=70) return 'var(--green)';
  if(conv>=30) return 'var(--amber)';
  return 'var(--red)';
}

function renderLojas(data) {
  const sorted=[...data].sort((a,b)=>{
    if(a.total===0&&b.total===0) return 0;
    if(a.total===0) return 1; if(b.total===0) return -1;
    return b.conv-a.conv;
  });
  ['dTLojas','mTLojas'].forEach(id=>{
    const wrap=$(id); if(!wrap) return;
    const container=wrap.parentElement;
    container.style.maxHeight='280px'; container.style.overflowY='auto';
    const tb=wrap.querySelector('tbody'); if(!tb) return;
    tb.innerHTML='';
    sorted.forEach((l,i)=>{
      const pill=l.marca==='Santa Lolla'?'<span class="pill pill-sl">SL</span>':'<span class="pill pill-hv">Hav</span>';
      const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`<span style="color:var(--text3);font-size:11px">${i+1}</span>`;
      const cc=l.total===0?'var(--text3)':convColor(l.conv);
      const op=l.total===0?'opacity:.4':'';
      tb.innerHTML+=`<tr style="${op}"><td title="${l.nome}"><span style="margin-right:5px">${medal}</span>${l.nome.replace('Santa Lolla ','').replace('Havaianas ','')}</td><td>${l.total}</td><td>${l.sim}</td><td><div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${l.conv}%;background:${cc}"></div></div><span class="pct" style="color:${cc};font-weight:600">${l.total>0?l.conv+'%':'—'}</span></div></td><td>${pill}</td></tr>`;
    });
  });
}

function renderMotivos(data) {
  ['dMList','mMList'].forEach(id=>{
    const el=$(id); if(!el) return;
    if(!data.length){el.innerHTML='<div class="empty">Nenhum registro</div>';return;}
    const max=data[0].qtd;
    el.innerHTML=data.map(m=>`<div class="motivo-item"><div class="motivo-top"><span>${m.motivo}</span><b>${m.qtd}x</b></div><div class="m-bar-bg"><div class="m-bar-fill" style="width:${Math.round(m.qtd/max*100)}%"></div></div><div class="m-pct">${m.pct}% dos não-comprou</div></div>`).join('');
  });
}

function setTab(tab,btn,pre) {
  if(pre==='d') rankTabD=tab; else rankTabM=tab;
  btn.closest('.card,.d-page').querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if(DADOS) renderRanking(DADOS.ranking,tab,pre);
}

function renderRanking(data,filtro,pre) {
  const lista=filtro==='todas'?data:data.filter(v=>v.marca===filtro);
  const el=$(pre==='d'?'dRank':'mRank'); if(!el) return;
  if(!lista.length){el.innerHTML='<div class="empty">Nenhuma vendedora</div>';return;}
  el.style.maxHeight='520px'; el.style.overflowY='auto'; el.style.paddingRight='4px';
  el.innerHTML=lista.map((v,i)=>{
    const cc=convColor(v.conv);
    return `<div class="rank-item"><span class="rn ${i<3?'gold':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><div class="ri"><div class="ri-name">${v.nome}</div><div class="ri-loja">${v.loja}</div></div><div class="rr"><div class="rr-sim">${v.sim} vendas</div><div class="rr-conv" style="color:${cc}">${v.conv}% conv.</div></div></div>`;
  }).join('');
}

// =============================================
// GRÁFICOS
// =============================================
function mkChart(id,type,data,opts) {
  const el=$(id); if(!el) return null;
  return new Chart(el,{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},...opts}});
}
const scX  = ()=>({x:{grid:{display:false},ticks:{color:C.color,font:{size:9}}},y:{grid:{color:C.grid},ticks:{color:C.color,font:{size:9}},border:{display:false}}});
const scXS = ()=>({x:{stacked:true,grid:{display:false},ticks:{color:C.color,font:{size:11}}},y:{stacked:true,grid:{color:C.grid},ticks:{color:C.color,font:{size:9}},border:{display:false}}});

function renderHora(data) {
  const slice=data.slice(7,22),labels=slice.map((_,i)=>(i+7)+'h');
  const ds=[{data:slice,backgroundColor:C.blue+'88',hoverBackgroundColor:C.blue,borderRadius:3,borderSkipped:false}];
  if(dCH)dCH.destroy(); if($('dCHora'))dCH=mkChart('dCHora','bar',{labels,datasets:ds},{scales:scX()});
  if(mCH)mCH.destroy(); if($('mCHora'))mCH=mkChart('mCHora','bar',{labels,datasets:ds},{scales:scX()});
}
function renderMarca(data) {
  const labels=data.map(m=>m.marca);
  const ds=[
    {label:'SIM',data:data.map(m=>m.sim),backgroundColor:C.blue+'88',hoverBackgroundColor:C.blue,borderRadius:[4,4],borderSkipped:false},
    {label:'NÃO',data:data.map(m=>m.nao),backgroundColor:C.red+'44',hoverBackgroundColor:C.red,borderRadius:[4,4],borderSkipped:false}
  ];
  if(dCM)dCM.destroy(); if($('dCMarca'))dCM=mkChart('dCMarca','bar',{labels,datasets:ds},{scales:scXS()});
  if(mCM)mCM.destroy(); if($('mCMarca'))mCM=mkChart('mCMarca','bar',{labels,datasets:ds},{scales:scXS()});
}
function renderSerie(data) {
  const labels=data.map(d=>d.data);
  const ds=[{data:data.map(d=>d.qtd),borderColor:C.blue,backgroundColor:'rgba(91,156,246,0.07)',fill:true,tension:0.4,pointRadius:1.5,pointBackgroundColor:C.blue,borderWidth:1.5}];
  const sc={x:{grid:{display:false},ticks:{color:C.color,font:{size:8},maxTicksLimit:8}},y:{grid:{color:C.grid},ticks:{color:C.color,font:{size:8}},border:{display:false}}};
  if(dCS)dCS.destroy(); if($('dCSerie'))dCS=mkChart('dCSerie','line',{labels,datasets:ds},{scales:sc});
  if(mCS)mCS.destroy(); if($('mCSerie'))mCS=mkChart('mCSerie','line',{labels,datasets:ds},{scales:sc});
}

// =============================================
// RELATÓRIO PDF
// =============================================
function openReportModal() {
  if(!DADOS){alert('Aguarde os dados carregarem primeiro.');return;}
  const modal=$('reportModal'); modal.style.display='flex';
  const isMobile=window.innerWidth<768, pre=isMobile?'m':'d';
  const dI=$(pre+'DI')?.value, dF=$(pre+'DF')?.value;
  const marca=$(pre+'Marca')?.value, loja=$(pre+'Loja')?.value, vend=$(pre+'Vend')?.value;
  if(dI)$('rpDI').value=dI; if(dF)$('rpDF').value=dF;
  if(marca)$('rpMarca').value=marca;
  const rpLoja=$('rpLoja'),rpVend=$('rpVend');
  if(rpLoja.options.length<=1&&LISTAS){
    LISTAS.lojas.forEach(l=>{const o=document.createElement('option');o.value=l;o.textContent=l;rpLoja.appendChild(o);});
    LISTAS.vendedoras.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;rpVend.appendChild(o);});
  }
  if(loja)$('rpLoja').value=loja; if(vend)$('rpVend').value=vend;
}
function closeReportModal() {
  const modal=$('reportModal'); if(modal) modal.style.display='none';
  const btn=$('btnGerarPDF'); if(btn){btn.textContent='Gerar PDF';btn.disabled=false;}
}
window.addEventListener('click',function(e){const m=$('reportModal');if(m&&e.target===m)closeReportModal();});

function gerarPDF() {
  const btn=$('btnGerarPDF'); btn.textContent='Preparando...'; btn.disabled=true;
  try {
    const dI=$('rpDI').value,dF=$('rpDF').value;
    const marca=$('rpMarca').value,loja=$('rpLoja').value,vend=$('rpVend').value;
    const filtros={};
    if(dI)filtros.dataInicio=toBR(dI); if(dF)filtros.dataFim=toBR(dF);
    if(marca)filtros.marcas=[marca]; if(loja)filtros.lojas=[loja]; if(vend)filtros.vendedora=vend;

    // Filtra localmente — instantâneo
    const dadosRelatorio = filtrarLocalmente(filtros);
    const geradoEm=new Date().toLocaleString('pt-BR');
    sessionStorage.setItem('reportData',JSON.stringify({dados:dadosRelatorio,filtros,geradoEm}));
    window.open('report.html','_blank');
    closeReportModal();
  } catch(e) {
    console.error(e); alert('Erro ao gerar relatório.');
    btn.textContent='Gerar PDF'; btn.disabled=false;
  }
}

// =============================================
// INIT
// =============================================
window.addEventListener('load', () => {
  initTheme();
  initLayout();
  carregar();
  injetarUI();
  renderSaudacao();
  if (GT_PRIMEIRO_ACESSO && GT_ROLE === 'loja') {
    setTimeout(() => abrirTrocarSenha(true), 800);
  }
});

function injetarUI() {
  const nome = GT_ROLE === 'admin' ? 'Administrador' : GT_LOJA;
  const adminBtn = GT_ROLE === 'admin'
    ? `<button onclick="abrirPainelAdmin()" style="display:inline-flex;align-items:center;gap:5px;padding:0 12px;height:32px;border-radius:8px;background:#1c1c22;color:#5b9cf6;border:1px solid #2a2a35;font-size:11px;cursor:pointer;margin-right:4px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        Usuários
       </button>`
    : `<button onclick="abrirTrocarSenha(false)" style="display:inline-flex;align-items:center;gap:5px;padding:0 12px;height:32px;border-radius:8px;background:#1c1c22;color:#aaa;border:1px solid #2a2a35;font-size:11px;cursor:pointer;margin-right:4px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        Senha
       </button>`;
  const html = `<div style="display:flex;align-items:center">
    <span style="font-size:11px;color:#7070a0;margin-right:8px">${nome}</span>
    ${adminBtn}
    <button onclick="logout()" style="display:inline-flex;align-items:center;gap:5px;padding:0 12px;height:32px;border-radius:8px;background:#1c1c22;color:#aaa;border:1px solid #2a2a35;font-size:11px;cursor:pointer">Sair</button>
  </div>`;
  const el = document.querySelector('.d-top-r');
  if (el) { const d=document.createElement('div'); d.innerHTML=html; el.insertBefore(d,el.firstChild); }
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// =============================================
// MENU LATERAL
// =============================================
function openSideMenu() {
  const menu    = document.getElementById('sideMenu');
  const overlay = document.getElementById('sideOverlay');
  const drawer  = document.getElementById('sideDrawer');
  if (!menu) return;
  menu.style.pointerEvents = 'all';
  overlay.style.background = 'rgba(0,0,0,.6)';
  overlay.style.pointerEvents = 'all';
  drawer.style.transform = 'translateX(0)';
}

function closeSideMenu() {
  const menu    = document.getElementById('sideMenu');
  const overlay = document.getElementById('sideOverlay');
  const drawer  = document.getElementById('sideDrawer');
  if (!menu) return;
  overlay.style.background = 'rgba(0,0,0,0)';
  drawer.style.transform = 'translateX(-100%)';
  setTimeout(() => { menu.style.pointerEvents = 'none'; overlay.style.pointerEvents = 'none'; }, 300);
}

// Fecha menu ao swipe left
(function() {
  let startX = 0;
  document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx < -60) closeSideMenu();
  }, { passive: true });
})();

// =============================================
// SAUDAÇÃO
// =============================================
function getSaudacao() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function renderSaudacao() {
  const nome = GT_ROLE === 'admin' ? 'Equipe Grupo Trend' : `Equipe ${GT_LOJA}`;
  const saudacao = getSaudacao();
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

  // Menu lateral
  const el = document.getElementById('sideSaudacao');
  if (el) el.innerHTML = `<span style="font-size:15px;font-weight:600;color:#eeeef4">${saudacao},</span><br>${nome} 👋`;
  const userEl = document.getElementById('sideUserName');
  if (userEl) userEl.textContent = GT_ROLE === 'admin' ? 'Administrador' : GT_LOJA;

  // Card topo resumo mobile
  const txt = document.getElementById('mSaudacaoTxt');
  const sub = document.getElementById('mSaudacaoSub');
  if (txt) txt.textContent = `${saudacao}, ${nome} 👋`;
  if (sub) sub.textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  // Sincroniza status dot no card
  const mDot2 = document.getElementById('mDot2');
  const mTxt2 = document.getElementById('mTxt2');
  if (mDot2 && mTxt2) {
    // Espelha o status do header
    const observer = new MutationObserver(() => {
      const dot = document.getElementById('mDot');
      const txt = document.getElementById('mTxt');
      if (dot) mDot2.className = dot.className;
      if (txt) mTxt2.textContent = txt.textContent;
    });
    const dotEl = document.getElementById('mDot');
    const txtEl = document.getElementById('mTxt');
    if (dotEl) observer.observe(dotEl, { attributes: true });
    if (txtEl) observer.observe(txtEl, { childList: true, characterData: true, subtree: true });
  }
}

// =============================================
// TEMA CLARO / ESCURO
// =============================================
const THEME_KEY = 'gt_theme';

function applyTheme(theme) {
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');

  if (theme === 'light') {
    document.body.classList.add('light');
    if (icon)  icon.innerHTML  = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    if (label) label.textContent = 'Modo escuro';
  } else {
    document.body.classList.remove('light');
    if (icon)  icon.innerHTML  = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    if (label) label.textContent = 'Modo claro';
  }
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}

// =============================================
// ATUALIZAÇÃO DO APP (Service Worker)
// =============================================
function buscarAtualizacoes() {
  const btn = document.getElementById('btnBuscarUpdate');
  if (btn) {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M20.49 15a9 9 0 01-14.85 3.36L1 14"/></svg>
    <span style="font-size:14px">Verificando...</span>`;
  }

  if (!('serviceWorker' in navigator)) {
    showUpdateToast('Atualização não suportada neste navegador.', false);
    resetUpdateBtn();
    return;
  }

  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) { showUpdateToast('Service Worker não encontrado.', false); resetUpdateBtn(); return; }

    reg.update().then(() => {
      if (reg.waiting) {
        // Há uma versão nova esperando — aplica imediatamente
        reg.waiting.postMessage('SKIP_WAITING');
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          showUpdateToast('✓ Atualização aplicada! Recarregando...', true);
          setTimeout(() => location.reload(true), 1200);
        });
      } else {
        showUpdateToast('✓ Você já está na versão mais recente!', true);
        resetUpdateBtn();
      }
    });
  });
}

function showUpdateToast(msg, success) {
  const old = document.getElementById('updateToast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'updateToast';
  toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${success?'#1a2a1a':'#2a1a1a'};border:1px solid ${success?'#3b6d11':'#6d1111'};border-radius:10px;padding:12px 20px;color:${success?'#c0dd97':'#dd9797'};font-size:13px;z-index:9999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.4)`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function resetUpdateBtn() {
  const btn = document.getElementById('btnBuscarUpdate');
  if (btn) btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
    <span style="font-size:14px">Buscar atualizações</span>`;
}

// Detecta nova versão disponível automaticamente ao abrir
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // Nova versão disponível — mostra notificação
          showUpdateToast('🔄 Nova versão disponível! Toque em "Buscar atualizações".', true);
        }
      });
    });
  });
}

// =============================================
// MODAL — TROCAR SENHA
// =============================================
function abrirTrocarSenha(obrigatorio) {
  const overlay = document.createElement('div');
  overlay.id = 'modalSenha';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:#14141a;border:1px solid #2a2a35;border-radius:16px;padding:32px;width:100%;max-width:360px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:16px;font-weight:600;color:#eeeef4;margin-bottom:6px">${obrigatorio ? '🔐 Defina sua senha' : '🔑 Trocar senha'}</div>
        <div style="font-size:12px;color:#7070a0">${obrigatorio ? 'Primeiro acesso — crie uma senha pessoal' : 'Digite sua senha atual e a nova senha'}</div>
      </div>
      ${!obrigatorio ? `<div style="margin-bottom:14px">
        <div style="font-size:11px;color:#7070a0;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Senha atual</div>
        <input id="senhaAtual" type="password" placeholder="Senha atual" style="width:100%;height:40px;background:#1c1c26;border:1px solid #2a2a35;border-radius:8px;color:#eeeef4;font-size:13px;padding:0 12px;outline:none"/>
      </div>` : ''}
      <div style="margin-bottom:14px">
        <div style="font-size:11px;color:#7070a0;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Nova senha</div>
        <input id="novaSenha1" type="password" placeholder="Nova senha (mín. 4 caracteres)" style="width:100%;height:40px;background:#1c1c26;border:1px solid #2a2a35;border-radius:8px;color:#eeeef4;font-size:13px;padding:0 12px;outline:none"/>
      </div>
      <div style="margin-bottom:20px">
        <div style="font-size:11px;color:#7070a0;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Confirmar nova senha</div>
        <input id="novaSenha2" type="password" placeholder="Repita a nova senha" style="width:100%;height:40px;background:#1c1c26;border:1px solid #2a2a35;border-radius:8px;color:#eeeef4;font-size:13px;padding:0 12px;outline:none"/>
      </div>
      <div id="erroSenha" style="background:#2a1a1a;border:1px solid #e05c5c44;border-radius:8px;padding:8px 12px;color:#e05c5c;font-size:12px;margin-bottom:14px;display:none"></div>
      <button onclick="confirmarTrocarSenha(${obrigatorio})" style="width:100%;height:42px;background:#5b9cf6;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:${obrigatorio?'0':'10px'}">Salvar senha</button>
      ${!obrigatorio ? `<button onclick="document.getElementById('modalSenha').remove()" style="width:100%;height:38px;background:transparent;color:#7070a0;border:1px solid #2a2a35;border-radius:10px;font-size:13px;cursor:pointer">Cancelar</button>` : ''}
    </div>`;
  document.body.appendChild(overlay);
}

async function confirmarTrocarSenha(obrigatorio) {
  const senhaAtual = obrigatorio ? '12345' : (document.getElementById('senhaAtual')?.value || '');
  const nova1 = document.getElementById('novaSenha1').value.trim();
  const nova2 = document.getElementById('novaSenha2').value.trim();
  const erroEl = document.getElementById('erroSenha');

  const erro = msg => { erroEl.textContent=msg; erroEl.style.display='block'; };
  erroEl.style.display = 'none';

  if (!nova1) return erro('Digite a nova senha.');
  if (nova1.length < 4) return erro('A senha deve ter pelo menos 4 caracteres.');
  if (nova1 === '12345') return erro('Escolha uma senha diferente da padrão.');
  if (nova1 !== nova2) return erro('As senhas não coincidem.');

  try {
    const res = await apiPost({ acao:'trocarSenha', usuario:GT_USER, senhaAtual, novaSenha:nova1 });
    if (res.ok) {
      sessionStorage.setItem('gt_primeiroAcesso','nao');
      document.getElementById('modalSenha').remove();
      // Feedback de sucesso
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a2a1a;border:1px solid #3b6d11;border-radius:10px;padding:12px 20px;color:#c0dd97;font-size:13px;z-index:9999;white-space:nowrap';
      toast.textContent = '✓ Senha alterada com sucesso!';
      document.body.appendChild(toast);
      setTimeout(()=>toast.remove(), 3000);
    } else {
      erro(res.erro || 'Erro ao salvar.');
    }
  } catch(e) { erro('Erro de conexão.'); }
}

// =============================================
// PAINEL ADMIN — GERENCIAR USUÁRIOS
// =============================================
async function abrirPainelAdmin() {
  const overlay = document.createElement('div');
  overlay.id = 'modalAdmin';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';
  overlay.innerHTML = `
    <div style="background:#14141a;border:1px solid #2a2a35;border-radius:16px;padding:32px;width:100%;max-width:560px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <div style="font-size:16px;font-weight:600;color:#eeeef4">👥 Gerenciar usuários</div>
        <button onclick="document.getElementById('modalAdmin').remove()" style="background:transparent;border:none;color:#7070a0;font-size:20px;cursor:pointer;padding:0 4px">×</button>
      </div>
      <div id="adminLista" style="color:#7070a0;font-size:13px;text-align:center;padding:20px">Carregando...</div>
    </div>`;
  document.body.appendChild(overlay);

  try {
    const res = await apiPost({ acao:'listarUsuarios', role:'admin' });
    if (!res.ok) { document.getElementById('adminLista').textContent = res.erro; return; }

    const html = res.usuarios.map(u => `
      <div style="background:#1c1c26;border:1px solid #2a2a35;border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <div style="font-size:13px;font-weight:500;color:#eeeef4">${u.usuario === 'admin' ? '⚙️ Administrador' : u.usuario}</div>
          <div style="font-size:11px;color:#7070a0;margin-top:2px">
            Senha: <code style="background:#0d0d10;padding:1px 6px;border-radius:4px;color:#5b9cf6">${u.senha}</code>
            ${u.primeiroAcesso==='SIM' ? '<span style="color:#e05c5c;margin-left:6px;font-size:10px">● Não alterou a senha</span>' : '<span style="color:#639922;margin-left:6px;font-size:10px">● Senha personalizada</span>'}
          </div>
        </div>
        ${u.role !== 'admin' ? `<button onclick="resetarSenhaAdmin('${u.usuario}')" style="padding:0 14px;height:32px;background:#1c1c22;color:#e05c5c;border:1px solid #e05c5c44;border-radius:8px;font-size:11px;cursor:pointer;white-space:nowrap">Resetar senha</button>` : ''}
      </div>`).join('');

    document.getElementById('adminLista').innerHTML = html;
  } catch(e) {
    document.getElementById('adminLista').textContent = 'Erro ao carregar usuários.';
  }
}

async function resetarSenhaAdmin(usuario) {
  if (!confirm(`Resetar senha de "${usuario}" para 12345?`)) return;
  try {
    const res = await apiPost({ acao:'resetarSenha', role:'admin', usuario, novaSenha:'12345' });
    if (res.ok) {
      document.getElementById('modalAdmin').remove();
      abrirPainelAdmin();
    } else {
      alert(res.erro || 'Erro ao resetar.');
    }
  } catch(e) { alert('Erro de conexão.'); }
}
