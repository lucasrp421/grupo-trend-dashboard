<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <meta name="theme-color" content="#0d0d10"/>
  <title>Grupo Trend — Dashboard</title>
  <link rel="stylesheet" href="style.css"/>
  <script>if(!sessionStorage.getItem('gt_user'))window.location.href='login.html';</script>
  <link rel="manifest" href="manifest.json"/>
  <link rel="apple-touch-icon" href="icons/icon-192.png"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <meta name="apple-mobile-web-app-title" content="Grupo Trend"/>
</head>
<body>

<!-- LOADING -->
<div id="loadingScreen">
  <div class="logo-mark">
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
  </div>
  <div class="spinner"></div>
  <p>Carregando dados...</p>
</div>

<!-- DESKTOP -->
<div id="viewDesktop">
  <div class="d-page">
    <div class="d-top">
      <div class="d-logo">
        <div class="d-logo-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></div>
        <div><div class="d-logo-name">Grupo Trend</div><div class="d-logo-sub">Dashboard de atendimentos</div></div>
      </div>
      <div class="d-top-r">
        <div class="d-status"><span class="s-dot" id="dDot"></span><span id="dTxt">carregando...</span></div>
        <a href="followup.html" style="display:inline-flex;align-items:center;gap:6px;padding:0 14px;height:36px;border-radius:10px;background:#141a26;color:#5b9cf6;border:1px solid #2a3a5a;font-size:12px;cursor:pointer;margin-right:4px;text-decoration:none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 9.72 19.79 19.79 0 01.46 1.1 2 2 0 012.42.12h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          Follow-Up
        </a>
        <button onclick="openReportModal()" style="display:inline-flex;align-items:center;gap:6px;padding:0 14px;height:36px;border-radius:10px;background:#1c1c22;color:#eeeef4;border:1px solid #36363f;font-size:12px;cursor:pointer;margin-right:4px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Relatório
        </button>
        <button class="ref-btn" onclick="atualizarDados()">
          <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M20.49 15a9 9 0 01-14.85 3.36L1 14"/></svg>
          Atualizar
        </button>
      </div>
    </div>

    <div class="d-filters">
      <div class="d-fg">
        <div class="d-group"><span class="d-label">Data início</span><input type="date" id="dDI" onchange="dAplicar()"/></div>
        <div class="d-group"><span class="d-label">Data fim</span><input type="date" id="dDF" onchange="dAplicar()"/></div>
        <div class="d-group"><span class="d-label">Marca</span>
          <select id="dMarca" onchange="dSincLojas();sincVendedoras('d');dAplicar()">
            <option value="">Todas as marcas</option><option>Santa Lolla</option><option>Havaianas</option>
          </select>
        </div>
        <div class="d-group"><span class="d-label">Loja</span>
          <select id="dLoja" onchange="sincVendedoras('d');dAplicar()"><option value="">Todas as lojas</option></select>
        </div>
        <div class="d-group"><span class="d-label">Vendedora</span>
          <select id="dVend" onchange="dAplicar()"><option value="">Todas</option></select>
        </div>
        <div class="d-group" style="justify-content:flex-end">
          <button class="d-btn" onclick="dLimpar()" style="width:100%">Limpar</button>
        </div>
      </div>
      <div class="d-chips" id="dChips"></div>
    </div>

    <div class="d-kpis">
      <div class="d-kpi blue"><div class="d-kpi-label">Atendimentos</div><div class="d-kpi-val" id="dkT">—</div><div class="d-kpi-sub">total</div></div>
      <div class="d-kpi green"><div class="d-kpi-label">Compraram</div><div class="d-kpi-val" id="dkS">—</div><div class="d-kpi-sub">SIM</div></div>
      <div class="d-kpi red"><div class="d-kpi-label">Não compraram</div><div class="d-kpi-val" id="dkN">—</div><div class="d-kpi-sub">NÃO</div></div>
      <div class="d-kpi amber"><div class="d-kpi-label">Conversão</div><div class="d-kpi-val" id="dkC">—</div><div class="d-kpi-sub">taxa geral</div></div>
      <div class="d-kpi purple"><div class="d-kpi-label">Santa Lolla</div><div class="d-kpi-val" id="dkSL">—</div><div class="d-kpi-sub" id="dkSLs">—</div></div>
      <div class="d-kpi teal"><div class="d-kpi-label">Havaianas</div><div class="d-kpi-val" id="dkHV">—</div><div class="d-kpi-sub" id="dkHVs">—</div></div>
    </div>

    <div class="d-grid2">
      <div class="card"><div class="card-head"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Atendimentos por hora</div><div style="position:relative;height:160px"><canvas id="dCHora"></canvas></div></div>
      <div class="card"><div class="card-head"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>Conversão por marca</div><div style="position:relative;height:160px"><canvas id="dCMarca"></canvas></div></div>
    </div>

    <div class="card" style="margin-bottom:14px"><div class="card-head"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Evolução — 30 dias</div><div style="position:relative;height:100px"><canvas id="dCSerie"></canvas></div></div>

    <div class="d-grid3">
      <div class="card">
        <div class="card-head"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Desempenho por loja</div>
        <div class="conv-legend">
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--blue)"></span>≥90% Excelente</span>
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--green)"></span>≥70% Ótimo</span>
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--amber)"></span>≥30% Regular</span>
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--red)"></span>&lt;30% Crítico</span>
        </div>
        <table class="tbl" id="dTLojas"><thead><tr><th style="width:36%">Loja</th><th style="width:10%">Total</th><th style="width:10%">SIM</th><th style="width:30%">Conversão</th><th style="width:14%">Marca</th></tr></thead><tbody></tbody></table>
      </div>
      <div class="card"><div class="card-head"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>Motivos de não compra</div><div id="dMList"></div></div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-head"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>Ranking de vendedoras</div>
      <div class="seg-row"><button class="seg-btn active" onclick="setTab('todas',this,'d')">Todas</button><button class="seg-btn" onclick="setTab('Santa Lolla',this,'d')">Santa Lolla</button><button class="seg-btn" onclick="setTab('Havaianas',this,'d')">Havaianas</button></div>
      <div id="dRank"></div>
    </div>
  </div>
</div>

<!-- MOBILE -->
<div id="viewMobile">
  <!-- MENU LATERAL (drawer esquerdo) -->
  <div id="sideMenu" style="position:fixed;inset:0;z-index:500;pointer-events:none">
    <div id="sideOverlay" onclick="closeSideMenu()" style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .3s;pointer-events:none"></div>
    <div id="sideDrawer" style="position:absolute;left:0;top:0;bottom:0;width:280px;background:#14141a;border-right:1px solid #2a2a35;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;padding:0">
      <!-- Cabeçalho do menu -->
      <div style="padding:24px 20px 16px;border-bottom:1px solid #2a2a35">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:36px;height:36px;border-radius:10px;background:#1a2a4a;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5b9cf6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div>
            <div style="font-size:14px;font-weight:600;color:#eeeef4">Grupo Trend</div>
            <div id="sideUserName" style="font-size:11px;color:#7070a0"></div>
          </div>
        </div>
        <!-- Saudação -->
        <div id="sideSaudacao" style="font-size:13px;color:#aaaacc;line-height:1.4"></div>
      </div>

      <!-- Itens do menu -->
      <div style="flex:1;padding:12px 0;overflow-y:auto">
        <div style="padding:4px 12px;font-size:10px;color:#5a5a7a;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Principal</div>

        <a href="index.html" style="display:flex;align-items:center;gap:12px;padding:12px 20px;color:#eeeef4;text-decoration:none;transition:background .15s" onmouseover="this.style.background='#1c1c26'" onmouseout="this.style.background='transparent'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          <span style="font-size:14px">Dashboard</span>
        </a>

        <a href="followup.html" style="display:flex;align-items:center;gap:12px;padding:12px 20px;color:#5b9cf6;text-decoration:none;transition:background .15s" onmouseover="this.style.background='#1c1c26'" onmouseout="this.style.background='transparent'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 9.72 19.79 19.79 0 01.46 1.1 2 2 0 012.42.12h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          <span style="font-size:14px">Follow-Up</span>
        </a>

        <div style="height:1px;background:#2a2a35;margin:8px 20px"></div>
        <div style="padding:4px 12px;font-size:10px;color:#5a5a7a;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Ações</div>

        <button onclick="closeSideMenu();openReportModal()" style="display:flex;align-items:center;gap:12px;padding:12px 20px;color:#eeeef4;background:transparent;border:none;cursor:pointer;width:100%;transition:background .15s;text-align:left" onmouseover="this.style.background='#1c1c26'" onmouseout="this.style.background='transparent'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span style="font-size:14px">Gerar relatório</span>
        </button>

        <button onclick="closeSideMenu();atualizarDados()" style="display:flex;align-items:center;gap:12px;padding:12px 20px;color:#eeeef4;background:transparent;border:none;cursor:pointer;width:100%;transition:background .15s;text-align:left" onmouseover="this.style.background='#1c1c26'" onmouseout="this.style.background='transparent'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M20.49 15a9 9 0 01-14.85 3.36L1 14"/></svg>
          <span style="font-size:14px">Atualizar dados</span>
        </button>

        <div style="height:1px;background:#2a2a35;margin:8px 20px"></div>
        <div style="padding:4px 12px;font-size:10px;color:#5a5a7a;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Aparência</div>

        <button onclick="toggleTheme()" id="themeBtn" style="display:flex;align-items:center;gap:12px;padding:12px 20px;color:#eeeef4;background:transparent;border:none;cursor:pointer;width:100%;transition:background .15s;text-align:left" onmouseover="this.style.background='#1c1c26'" onmouseout="this.style.background='transparent'">
          <svg id="themeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <span id="themeLabel" style="font-size:14px">Modo claro</span>
        </button>
      </div>

      <!-- Rodapé do menu -->
      <div style="padding:16px 20px;border-top:1px solid #2a2a35">
        <button onclick="logout()" style="display:flex;align-items:center;gap:12px;padding:10px 0;color:#e05c5c;background:transparent;border:none;cursor:pointer;width:100%">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span style="font-size:14px">Sair</span>
        </button>
      </div>
    </div>
  </div>

  <div class="m-app">
    <div class="m-header">
      <button onclick="openSideMenu()" style="width:40px;height:40px;border-radius:12px;background:#1c1c22;border:1px solid #2a2a35;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8888a0" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="m-logo" style="flex:1;justify-content:center">
        <div class="m-logo-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></div>
        <div><div class="m-logo-name">Grupo Trend</div><div class="m-logo-sub">Dashboard</div></div>
      </div>
      <div class="m-header-r">
        <div class="m-status"><span class="s-dot" id="mDot"></span><span id="mTxt">carregando</span></div>
        <button class="m-upd-btn" onclick="atualizarDados()">
          <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M20.49 15a9 9 0 01-14.85 3.36L1 14"/></svg>
        </button>
      </div>
    </div>

    <div class="m-fbar">
      <div class="m-fbar-chips" id="mChips"></div>
      <button class="m-filter-btn" onclick="mToggle()">
        <svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
        Filtros<span class="m-fbadge" id="mBadge">0</span>
      </button>
    </div>

    <div class="m-drawer" id="mDrawer">
      <div class="m-dg">
        <div><span class="m-dl">Data início</span><input type="date" id="mDI"/></div>
        <div><span class="m-dl">Data fim</span><input type="date" id="mDF"/></div>
        <div><span class="m-dl">Marca</span><select id="mMarca" onchange="mSincLojas();sincVendedoras('m')"><option value="">Todas</option><option>Santa Lolla</option><option>Havaianas</option></select></div>
        <div><span class="m-dl">Loja</span><select id="mLoja" onchange="sincVendedoras('m')"><option value="">Todas</option></select></div>
        <div class="m-dg-full"><span class="m-dl">Vendedora</span><select id="mVend"><option value="">Todas</option></select></div>
      </div>
      <div class="m-dactions">
        <button class="m-dapply" onclick="mAplicar()">Aplicar filtros</button>
        <button class="m-dclear" onclick="mLimpar()">Limpar</button>
      </div>
    </div>

    <div class="m-scroll">
      <!-- RESUMO -->
      <div class="m-page active" id="pg-resumo">
        <!-- Saudação topo -->
        <div style="padding:16px 16px 0">
          <div style="background:linear-gradient(135deg,#1a2a4a,#141a26);border:1px solid #2a3a5a;border-radius:14px;padding:16px;margin-bottom:4px">
            <div id="mSaudacaoTxt" style="font-size:16px;font-weight:700;color:#eeeef4;margin-bottom:2px"></div>
            <div id="mSaudacaoSub" style="font-size:12px;color:#7070a0"></div>
            <div style="margin-top:10px;display:flex;gap:8px">
              <div class="m-status" style="background:#0d0d1088;border-radius:8px;padding:4px 10px"><span class="s-dot" id="mDot2"></span><span id="mTxt2" style="font-size:11px;color:#7070a0">carregando</span></div>
            </div>
          </div>
        </div>
        <div class="m-kpi-grid">
          <div class="m-kpi blue"><div class="m-kpi-label">Atendimentos</div><div class="m-kpi-val" id="mkT">—</div><div class="m-kpi-sub">total</div></div>
          <div class="m-kpi amber"><div class="m-kpi-label">Conversão</div><div class="m-kpi-val" id="mkC">—</div><div class="m-kpi-sub">taxa geral</div></div>
          <div class="m-kpi green"><div class="m-kpi-label">Compraram</div><div class="m-kpi-val" id="mkS">—</div><div class="m-kpi-sub">SIM</div></div>
          <div class="m-kpi red"><div class="m-kpi-label">Não compraram</div><div class="m-kpi-val" id="mkN">—</div><div class="m-kpi-sub">NÃO</div></div>
          <div class="m-kpi purple m-kpi-wide">
            <div class="m-kpi-label">Santa Lolla</div>
            <div class="m-kpi-wide-inner"><div class="m-kpi-val" id="mkSL">—</div><div class="m-kpi-wide-sub" id="mkSLs">—</div></div>
          </div>
          <div class="m-kpi teal m-kpi-wide">
            <div class="m-kpi-label">Havaianas</div>
            <div class="m-kpi-wide-inner"><div class="m-kpi-val" id="mkHV">—</div><div class="m-kpi-wide-sub" id="mkHVs">—</div></div>
          </div>
        </div>
        <div class="card sec-gap"><div class="card-head"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Evolução — 30 dias</div><div style="position:relative;height:120px"><canvas id="mCSerie"></canvas></div></div>
        <div class="card"><div class="card-head"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Atendimentos por hora</div><div style="position:relative;height:160px"><canvas id="mCHora"></canvas></div></div>
      </div>

      <!-- LOJAS -->
      <div class="m-page" id="pg-lojas">
        <div class="card sec-gap"><div class="card-head"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>Conversão por marca</div><div style="position:relative;height:180px"><canvas id="mCMarca"></canvas></div></div>
        <div class="card"><div class="card-head"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Desempenho por loja</div>
          <div class="conv-legend" style="font-size:9px">
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--blue)"></span>≥90% Excelente</span>
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--green)"></span>≥70% Ótimo</span>
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--amber)"></span>≥30% Regular</span>
          <span class="conv-legend-item"><span class="conv-legend-dot" style="background:var(--red)"></span>&lt;30% Crítico</span>
        </div>
        <table class="tbl" id="mTLojas"><thead><tr><th style="width:35%">Loja</th><th style="width:12%">Tot.</th><th style="width:12%">SIM</th><th style="width:27%">Conv.</th><th style="width:14%"></th></tr></thead><tbody></tbody></table>
        </div>
      </div>

      <!-- VENDEDORAS -->
      <div class="m-page" id="pg-vend">
        <div class="card sec-gap">
          <div class="card-head"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>Ranking de vendedoras</div>
          <div class="seg-row">
            <button class="seg-btn active" onclick="setTab('todas',this,'m')">Todas</button>
            <button class="seg-btn" onclick="setTab('Santa Lolla',this,'m')">Sta. Lolla</button>
            <button class="seg-btn" onclick="setTab('Havaianas',this,'m')">Havaianas</button>
          </div>
          <div id="mRank"></div>
        </div>
        <div class="card" style="margin-top:12px">
          <div class="card-head"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>Motivos de não compra</div>
          <div id="mMList"></div>
        </div>
      </div>
    </div>

    <nav class="m-nav">
      <button class="m-nav-btn active" id="nb-resumo" onclick="navTo('resumo')">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
        Resumo
      </button>
      <button class="m-nav-btn" id="nb-lojas" onclick="navTo('lojas')">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Lojas
      </button>
      <button class="m-nav-btn" id="nb-vend" onclick="navTo('vend')">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        Vendedoras
      </button>
    </nav>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script src="app.js"></script>

<!-- MODAL GERAR RELATÓRIO -->
<div id="reportModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;align-items:center;justify-content:center;padding:16px">
  <div style="background:#141418;border:1px solid #28282f;border-radius:16px;padding:24px;width:100%;max-width:440px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="font-size:15px;font-weight:600;color:#eeeef4">📄 Gerar Relatório PDF</div>
      <button onclick="closeReportModal()" style="background:none;border:none;color:#8888a0;font-size:20px;cursor:pointer">×</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div>
        <div style="font-size:10px;color:#4a4a60;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">Data início</div>
        <input type="date" id="rpDI" style="height:44px;border:1px solid #36363f;border-radius:10px;padding:0 12px;font-size:14px;background:#1c1c22;color:#eeeef4;width:100%;outline:none"/>
      </div>
      <div>
        <div style="font-size:10px;color:#4a4a60;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">Data fim</div>
        <input type="date" id="rpDF" style="height:44px;border:1px solid #36363f;border-radius:10px;padding:0 12px;font-size:14px;background:#1c1c22;color:#eeeef4;width:100%;outline:none"/>
      </div>
      <div>
        <div style="font-size:10px;color:#4a4a60;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">Marca</div>
        <select id="rpMarca" style="height:44px;border:1px solid #36363f;border-radius:10px;padding:0 12px;font-size:14px;background:#1c1c22;color:#eeeef4;width:100%;outline:none;-webkit-appearance:none">
          <option value="">Todas as marcas</option><option>Santa Lolla</option><option>Havaianas</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;color:#4a4a60;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">Loja</div>
        <select id="rpLoja" style="height:44px;border:1px solid #36363f;border-radius:10px;padding:0 12px;font-size:14px;background:#1c1c22;color:#eeeef4;width:100%;outline:none;-webkit-appearance:none">
          <option value="">Todas as lojas</option>
        </select>
      </div>
      <div style="grid-column:1/-1">
        <div style="font-size:10px;color:#4a4a60;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">Vendedora</div>
        <select id="rpVend" style="height:44px;border:1px solid #36363f;border-radius:10px;padding:0 12px;font-size:14px;background:#1c1c22;color:#eeeef4;width:100%;outline:none;-webkit-appearance:none">
          <option value="">Todas</option>
        </select>
      </div>
    </div>
    <div style="font-size:11px;color:#4a4a60;margin-bottom:16px">O relatório será aberto em nova aba. Use Ctrl+P ou o botão de impressão para salvar como PDF.</div>
    <div style="display:flex;gap:10px">
      <button id="btnGerarPDF" onclick="gerarPDF()" style="flex:1;height:48px;border-radius:12px;background:#5b9cf6;color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Gerar PDF
      </button>
      <button onclick="closeReportModal()" style="height:48px;padding:0 20px;border-radius:12px;background:#1c1c22;color:#8888a0;border:1px solid #36363f;font-size:14px;cursor:pointer">Cancelar</button>
    </div>
  </div>
</div>

<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}
</script>
</body>
</html>
