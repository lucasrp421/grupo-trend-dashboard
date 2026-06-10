// =============================================
// CONFIGURAÇÃO — altere só a URL abaixo
// =============================================
const API_URL = "https://script.google.com/macros/s/AKfycbyOSCYWp7Y1nIRRU2cM4Hug1GdWwVrDdUcA9EAjbOwlQnZNY-nehf_BKC82ISSMdFis_A/exec";

// =============================================
// ESTADO GLOBAL
// =============================================
let DADOS = null;
let rankTabD = 'todas';
let rankTabM = 'todas';
let mOpen = false;
let dCH, dCM, dCS, mCH, mCM, mCS;

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const toInput = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toBR = s => { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
const hoje = new Date();
const C = { color: '#4a4a60', grid: 'rgba(255,255,255,0.04)', blue: '#5b9cf6', red: '#e05c5c' };

// =============================================
// DETECÇÃO DE DISPOSITIVO
// =============================================
function initLayout() {
  const isMobile = window.innerWidth < 768;
  $('viewDesktop').style.display = isMobile ? 'none' : 'block';
  $('viewMobile').style.display  = isMobile ? 'block' : 'none';
}

window.addEventListener('resize', () => {
  const isMobile = window.innerWidth < 768;
  $('viewDesktop').style.display = isMobile ? 'none' : 'block';
  $('viewMobile').style.display  = isMobile ? 'block' : 'none';
});

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
  ['dDot','mDot'].forEach(id => {
    const e = $(id); if (e) e.className = 's-dot' + (spin ? ' spin' : '');
  });
  ['dTxt','mTxt'].forEach(id => {
    const e = $(id); if (e) e.textContent = txt;
  });
}

function hideLoading() {
  const el = $('loadingScreen');
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }
}

// =============================================
// CHAMADA À API (fetch direto, sem google.script.run)
// =============================================
async function fetchDados(filtros = {}) {
  const params = new URLSearchParams({ filtros: JSON.stringify(filtros) });
  const url = `${API_URL}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro na API: ' + res.status);
  return await res.json();
}

// =============================================
// SELECTS
// =============================================
function popularSelects(listas) {
  [['dLoja','dVend'],['mLoja','mVend']].forEach(([lid, vid]) => {
    const sl = $(lid), sv = $(vid);
    if (!sl || !sv) return;
    if (sl.options.length <= 1) listas.lojas.forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = l; sl.appendChild(o); });
    if (sv.options.length <= 1) listas.vendedoras.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sv.appendChild(o); });
  });
}

function dSincLojas() {
  const m = $('dMarca').value;
  Array.from($('dLoja').options).forEach(o => {
    if (!o.value) { o.style.display = ''; return; }
    o.style.display = (!m || (m==='Santa Lolla'&&o.value.includes('Santa Lolla')) || (m==='Havaianas'&&o.value.includes('Havaianas')&&!o.value.includes('Santa'))) ? '' : 'none';
  });
}
function mSincLojas() {
  const m = $('mMarca').value;
  Array.from($('mLoja').options).forEach(o => {
    if (!o.value) { o.style.display = ''; return; }
    o.style.display = (!m || (m==='Santa Lolla'&&o.value.includes('Santa Lolla')) || (m==='Havaianas'&&o.value.includes('Havaianas')&&!o.value.includes('Santa'))) ? '' : 'none';
  });
}

function sincVendedoras(pre) {
  if (!DADOS?.listas) return;
  const lojaVal = $(pre+'Loja').value;
  const vendSel = $(pre+'Vend');
  const atual = vendSel.value;
  while (vendSel.options.length > 1) vendSel.remove(1);
  const lista = (lojaVal && DADOS.listas.vendedorasPorLoja?.[lojaVal]) || DADOS.listas.vendedoras || [];
  lista.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; vendSel.appendChild(o); });
  vendSel.value = lista.includes(atual) ? atual : '';
}

// =============================================
// FILTROS
// =============================================
function buildF(pre) {
  const f = {};
  const dI = $(pre+'DI')?.value, dF = $(pre+'DF')?.value;
  const marca = $(pre+'Marca')?.value, loja = $(pre+'Loja')?.value, vend = $(pre+'Vend')?.value;
  if (dI) f.dataInicio = toBR(dI);
  if (dF) f.dataFim    = toBR(dF);
  if (marca) f.marcas     = [marca];
  if (loja)  f.lojas      = [loja];
  if (vend)  f.vendedora  = vend;
  return f;
}

function renderMChips(f) {
  const c = [];
  if (f.dataInicio || f.dataFim) c.push(`${f.dataInicio||'início'} → ${f.dataFim||'hoje'}`);
  if (f.marcas)    c.push(f.marcas[0]);
  if (f.lojas)     c.push(f.lojas[0]);
  if (f.vendedora) c.push(f.vendedora);
  const el = $('mChips'); if (!el) return;
  el.innerHTML = c.map(x => `<span class="m-chip-a">${x}<span class="m-chip-x" onclick="mLimpar()">×</span></span>`).join('');
  const b = $('mBadge'); if (b) { b.style.display = c.length ? 'inline' : 'none'; b.textContent = c.length; }
}

function renderDChips(f) {
  const c = [];
  if (f.dataInicio || f.dataFim) c.push(`${f.dataInicio||'início'} → ${f.dataFim||'hoje'}`);
  if (f.marcas)    c.push(f.marcas[0]);
  if (f.lojas)     c.push(f.lojas[0]);
  if (f.vendedora) c.push(f.vendedora);
  const el = $('dChips'); if (!el) return;
  el.innerHTML = c.map(x => `<span class="chip">${x}<span class="chip-x" onclick="dLimpar()">×</span></span>`).join('');
}

async function dAplicar() {
  if (!DADOS) return;
  const f = buildF('d');
  setStatus('filtrando...', true);
  try {
    const d = await fetchDados(f);
    DADOS = d; renderDash(d); renderDChips(f);
    setStatus(d.meta.atualizadoEm, false);
  } catch(e) { setStatus('erro', false); }
}

async function mAplicar() {
  if (!DADOS) return;
  const f = buildF('m');
  mOpen = false; $('mDrawer').className = 'm-drawer';
  setStatus('filtrando...', true);
  try {
    const d = await fetchDados(f);
    DADOS = d; renderDash(d); renderMChips(f);
    setStatus(d.meta.atualizadoEm, false);
  } catch(e) { setStatus('erro', false); }
}

function mToggle() { mOpen = !mOpen; $('mDrawer').className = 'm-drawer' + (mOpen ? ' open' : ''); }

function dLimpar() {
  ['dDI','dDF','dMarca','dLoja','dVend'].forEach(id => { const e = $(id); if (e) e.value = ''; });
  $('dChips').innerHTML = ''; sincVendedoras('d'); carregar();
}
function mLimpar() {
  ['mDI','mDF','mMarca','mLoja','mVend'].forEach(id => { const e = $(id); if (e) e.value = ''; });
  renderMChips({}); sincVendedoras('m'); carregar();
}

// =============================================
// CARREGAR (hoje por padrão)
// =============================================
async function carregar() {
  const f = { dataInicio: toBR(toInput(hoje)), dataFim: toBR(toInput(hoje)) };
  ['dDI','dDF','mDI','mDF'].forEach(id => { const e = $(id); if (e) e.value = toInput(hoje); });
  setStatus('carregando...', true);
  try {
    const d = await fetchDados(f);
    DADOS = d;
    popularSelects(d.listas);
    renderDash(d);
    setStatus(d.meta.atualizadoEm, false);
    hideLoading();
  } catch(e) {
    setStatus('erro ao carregar', false);
    hideLoading();
  }
}

// =============================================
// RENDER DASHBOARD
// =============================================
function renderDash(d) {
  const k = d.kpis;
  [['dkT','mkT',k.total],['dkS','mkS',k.sim],['dkN','mkN',k.nao],['dkC','mkC',k.conv+'%']].forEach(([di,mi,v]) => {
    const de = $(di), me = $(mi); if (de) de.textContent = v; if (me) me.textContent = v;
  });
  const sl = d.porMarca.find(m => m.marca === 'Santa Lolla') || { conv:0, total:0 };
  const hv = d.porMarca.find(m => m.marca === 'Havaianas')   || { conv:0, total:0 };
  ['dkSL','mkSL'].forEach(id => { const e=$(id); if(e) e.textContent = sl.conv+'%'; });
  ['dkSLs','mkSLs'].forEach(id => { const e=$(id); if(e) e.textContent = sl.total+' atend.'; });
  ['dkHV','mkHV'].forEach(id => { const e=$(id); if(e) e.textContent = hv.conv+'%'; });
  ['dkHVs','mkHVs'].forEach(id => { const e=$(id); if(e) e.textContent = hv.total+' atend.'; });
  renderLojas(d.porLoja);
  renderMotivos(d.motivos);
  renderRanking(d.ranking, rankTabD, 'd');
  renderRanking(d.ranking, rankTabM, 'm');
  renderHora(d.porHora);
  renderMarca(d.porMarca);
  renderSerie(d.serie);
}

// Retorna cor da taxa de conversão baseada nas faixas
function convColor(conv) {
  if (conv >= 90) return 'var(--blue)';
  if (conv >= 70) return 'var(--green)';
  if (conv >= 30) return 'var(--amber)';
  return 'var(--red)';
}

function renderLojas(data) {
  const sorted = [...data].sort((a, b) => {
    if (a.total === 0 && b.total === 0) return 0;
    if (a.total === 0) return 1;
    if (b.total === 0) return -1;
    return b.conv - a.conv;
  });

  ['dTLojas','mTLojas'].forEach(id => {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    const container = wrap.parentElement;
    container.style.maxHeight = '280px';
    container.style.overflowY = 'auto';
    const tb = wrap.querySelector('tbody'); if (!tb) return;
    tb.innerHTML = '';
    sorted.forEach((l, i) => {
      const pill = l.marca === 'Santa Lolla'
        ? '<span class="pill pill-sl">SL</span>'
        : '<span class="pill pill-hv">Hav</span>';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="color:var(--text3);font-size:11px">${i+1}</span>`;
      const cc = l.total === 0 ? 'var(--text3)' : convColor(l.conv);
      const op = l.total === 0 ? 'opacity:.4' : '';
      tb.innerHTML += `<tr style="${op}">
        <td title="${l.nome}"><span style="margin-right:5px">${medal}</span>${l.nome.replace('Santa Lolla ','').replace('Havaianas ','')}</td>
        <td>${l.total}</td><td>${l.sim}</td>
        <td><div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${l.conv}%;background:${cc}"></div></div><span class="pct" style="color:${cc};font-weight:600">${l.total > 0 ? l.conv+'%' : '—'}</span></div></td>
        <td>${pill}</td>
      </tr>`;
    });
  });
}

function renderMotivos(data) {
  ['dMList','mMList'].forEach(id => {
    const el = $(id); if (!el) return;
    if (!data.length) { el.innerHTML = '<div class="empty">Nenhum registro</div>'; return; }
    const max = data[0].qtd;
    el.innerHTML = data.map(m => `<div class="motivo-item"><div class="motivo-top"><span>${m.motivo}</span><b>${m.qtd}x</b></div><div class="m-bar-bg"><div class="m-bar-fill" style="width:${Math.round(m.qtd/max*100)}%"></div></div><div class="m-pct">${m.pct}% dos não-comprou</div></div>`).join('');
  });
}

function setTab(tab, btn, pre) {
  if (pre === 'd') rankTabD = tab; else rankTabM = tab;
  btn.closest('.card,.d-page').querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (DADOS) renderRanking(DADOS.ranking, tab, pre);
}

function renderRanking(data, filtro, pre) {
  const lista = filtro === 'todas' ? data : data.filter(v => v.marca === filtro);
  const el = $(pre==='d' ? 'dRank' : 'mRank'); if (!el) return;
  if (!lista.length) { el.innerHTML = '<div class="empty">Nenhuma vendedora</div>'; return; }

  // Scroll após 10 itens
  el.style.maxHeight = '520px';
  el.style.overflowY = 'auto';
  el.style.paddingRight = '4px';

  el.innerHTML = lista.map((v,i) => {
    const cc = convColor(v.conv);
    const top = i < 10 ? '' : 'display:block';
    return `<div class="rank-item" style="${top}">
      <span class="rn ${i<3?'gold':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
      <div class="ri">
        <div class="ri-name">${v.nome}</div>
        <div class="ri-loja">${v.loja}</div>
      </div>
      <div class="rr">
        <div class="rr-sim">${v.sim} vendas</div>
        <div class="rr-conv" style="color:${cc}">${v.conv}% conv.</div>
      </div>
    </div>`;
  }).join('');
}

// =============================================
// GRÁFICOS
// =============================================
function mkChart(id, type, data, opts) {
  const el = $(id); if (!el) return null;
  return new Chart(el, { type, data, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, ...opts } });
}
const scX  = () => ({ x:{ grid:{display:false}, ticks:{color:C.color,font:{size:9}} }, y:{ grid:{color:C.grid}, ticks:{color:C.color,font:{size:9}}, border:{display:false} } });
const scXS = () => ({ x:{ stacked:true, grid:{display:false}, ticks:{color:C.color,font:{size:11}} }, y:{ stacked:true, grid:{color:C.grid}, ticks:{color:C.color,font:{size:9}}, border:{display:false} } });

function renderHora(data) {
  const slice = data.slice(7,22), labels = slice.map((_,i) => (i+7)+'h');
  const ds = [{ data:slice, backgroundColor:C.blue+'88', hoverBackgroundColor:C.blue, borderRadius:3, borderSkipped:false }];
  if (dCH) dCH.destroy(); if ($('dCHora')) dCH = mkChart('dCHora','bar',{labels,datasets:ds},{scales:scX()});
  if (mCH) mCH.destroy(); if ($('mCHora')) mCH = mkChart('mCHora','bar',{labels,datasets:ds},{scales:scX()});
}
function renderMarca(data) {
  const labels = data.map(m => m.marca);
  const ds = [
    { label:'SIM', data:data.map(m=>m.sim), backgroundColor:C.blue+'88', hoverBackgroundColor:C.blue, borderRadius:[4,4], borderSkipped:false },
    { label:'NÃO', data:data.map(m=>m.nao), backgroundColor:C.red+'44',  hoverBackgroundColor:C.red,  borderRadius:[4,4], borderSkipped:false }
  ];
  if (dCM) dCM.destroy(); if ($('dCMarca')) dCM = mkChart('dCMarca','bar',{labels,datasets:ds},{scales:scXS()});
  if (mCM) mCM.destroy(); if ($('mCMarca')) mCM = mkChart('mCMarca','bar',{labels,datasets:ds},{scales:scXS()});
}
function renderSerie(data) {
  const labels = data.map(d => d.data);
  const ds = [{ data:data.map(d=>d.qtd), borderColor:C.blue, backgroundColor:'rgba(91,156,246,0.07)', fill:true, tension:0.4, pointRadius:1.5, pointBackgroundColor:C.blue, borderWidth:1.5 }];
  const sc = { x:{ grid:{display:false}, ticks:{color:C.color,font:{size:8},maxTicksLimit:8} }, y:{ grid:{color:C.grid}, ticks:{color:C.color,font:{size:8}}, border:{display:false} } };
  if (dCS) dCS.destroy(); if ($('dCSerie')) dCS = mkChart('dCSerie','line',{labels,datasets:ds},{scales:sc});
  if (mCS) mCS.destroy(); if ($('mCSerie')) mCS = mkChart('mCSerie','line',{labels,datasets:ds},{scales:sc});
}

// =============================================
// INIT
// =============================================
window.addEventListener('load', () => {
  initLayout();
  carregar();
});

// =============================================
// RELATÓRIO PDF — usa dados já carregados na dash
// =============================================

function openReportModal() {
  if (!DADOS) { alert('Aguarde os dados carregarem primeiro.'); return; }

  const modal = $('reportModal');
  modal.style.display = 'flex';

  // Pré-preenche com os filtros ativos
  const isMobile = window.innerWidth < 768;
  const pre = isMobile ? 'm' : 'd';
  const dI = $(pre+'DI')?.value, dF = $(pre+'DF')?.value;
  const marca = $(pre+'Marca')?.value, loja = $(pre+'Loja')?.value, vend = $(pre+'Vend')?.value;

  if (dI) $('rpDI').value = dI;
  if (dF) $('rpDF').value = dF;
  if (marca) $('rpMarca').value = marca;

  // Popular lojas e vendedoras — só uma vez
  const rpLoja = $('rpLoja'), rpVend = $('rpVend');
  if (rpLoja.options.length <= 1 && DADOS?.listas) {
    DADOS.listas.lojas.forEach(l => {
      const o = document.createElement('option'); o.value = l; o.textContent = l; rpLoja.appendChild(o);
    });
    DADOS.listas.vendedoras.forEach(v => {
      const o = document.createElement('option'); o.value = v; o.textContent = v; rpVend.appendChild(o);
    });
  }
  if (loja) $('rpLoja').value = loja;
  if (vend) $('rpVend').value = vend;
}

function closeReportModal() {
  const modal = $('reportModal');
  if (modal) modal.style.display = 'none';

  // Garante que o botão volta ao normal sempre
  const btn = document.getElementById('btnGerarPDF');
  if (btn) {
    btn.textContent = 'Gerar PDF';
    btn.disabled = false;
  }
}

// Fecha modal ao clicar fora
window.addEventListener('click', function(e) {
  const modal = $('reportModal');
  if (modal && e.target === modal) closeReportModal();
});

function gerarPDF() {
  const btn = document.getElementById('btnGerarPDF');
  btn.textContent = 'Preparando...';
  btn.disabled = true;

  try {
    const dI = $('rpDI').value, dF = $('rpDF').value;
    const marca = $('rpMarca').value, loja = $('rpLoja').value, vend = $('rpVend').value;

    const filtros = {};
    if (dI) filtros.dataInicio = toBR(dI);
    if (dF) filtros.dataFim    = toBR(dF);
    if (marca) filtros.marcas    = [marca];
    if (loja)  filtros.lojas     = [loja];
    if (vend)  filtros.vendedora = vend;

    const geradoEm = new Date().toLocaleString('pt-BR');

    // Usa os dados já na memória — sem nova chamada à API
    sessionStorage.setItem('reportData', JSON.stringify({
      dados: DADOS,
      filtros,
      geradoEm
    }));

    // Abre relatório na nova aba
    window.open('report.html', '_blank');
    closeReportModal();

  } catch(e) {
    console.error('Erro ao gerar PDF:', e);
    alert('Erro ao gerar relatório. Tente novamente.');
    btn.textContent = 'Gerar PDF';
    btn.disabled = false;
  }
}
