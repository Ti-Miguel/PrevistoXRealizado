/* ========= PxR com Setores + MySQL API + Exportação ========= */
const API = "/previsto-realizado/api/pxr"; // ajuste se sua API estiver em outro caminho

const SECTORS = { ODONTOLOGIA: "ODONTOLOGIA", MEDICINA: "MEDICINA" };
const DEFAULT_SECTOR = SECTORS.ODONTOLOGIA;

/* ===== atalhos / utils ===== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const el = {
  mesRef: $("#mesRef"), btnNovoMes: $("#btnNovoMes"),
  sumPrevisto: $("#sumPrevisto"), sumPago: $("#sumPago"),
  sumDiferenca: $("#sumDiferenca"), sumPercent: $("#sumPercent"),
  tabBtns: $$(".tab-btn"), tabs: $$(".tab"),

  formPrev: $("#formPrev"), categoria: $("#categoria"),
  subcategoria: $("#subcategoria"), vencimento: $("#vencimento"),
  valorPrev: $("#valorPrev"), tbPrevMesBody: $("#tbPrevMes tbody"),
  filtroStatus: $("#filtroStatus"), tbLancBody: $("#tbLanc tbody"),

  btnAtualizarRel: $("#btnAtualizarRel"), tbRelBody: $("#tbRel tbody"),
  relTotPrev: $("#relTotPrev"), relTotPago: $("#relTotPago"),
  relTotDif: $("#relTotDif"), relTotPerc: $("#relTotPerc"),

  novaCategoria: $("#novaCategoria"), btnAddCat: $("#btnAddCat"),
  tbCatsBody: $("#tbCats tbody"), catParaSub: $("#catParaSub"),
  novaSubcat: $("#novaSubcat"), btnAddSub: $("#btnAddSub"),
  tbSubsBody: $("#tbSubs tbody"), tbHistBody: $("#tbHist tbody"),

  modalBack: $("#modalBack"), editCat: $("#editCat"),
  editSub: $("#editSub"), editVenc: $("#editVenc"),
  editPrev: $("#editPrev"), btnSalvarEdit: $("#btnSalvarEdit"),
  btnCancelarEdit: $("#btnCancelarEdit"),

  sectorBtns: $$(".sector-btn"),
};
let editingId = null;

const money = (v) => (isNaN(v) ? 0 : v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

/* ===== Setor ativo + tema ===== */
function getActiveSector(){ return document.documentElement.getAttribute("data-sector") || DEFAULT_SECTOR; }
function setActiveSector(sector){
  document.documentElement.setAttribute("data-sector", sector);
  el.sectorBtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sector === sector)));
  cacheEntries = {}; // limpa cache
  renderAsync();
}

/* ===== Datas ===== */
function todayYMD(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function monthKeyLocal(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function ymdToBR(ymd){ if(!ymd) return "—"; const [y,m,d]=String(ymd).split("-"); return `${d?.padStart(2,"0")}/${m?.padStart(2,"0")}/${y}`; }

/* ===== Nome de arquivo amigável ===== */
function makeFileName(prefix){
  const setor = getActiveSector();
  const mes = el.mesRef?.value || monthKeyLocal();
  return `${prefix}_${setor}_${mes}`;
}

/* ===== API helpers ===== */
async function apiGet(url){
  const r = await fetch(url);
  const j = await r.json().catch(()=>({ok:false, erro:"Resposta inválida"}));
  if(!j.ok) throw new Error(j.erro || "Erro de API");
  return j.data;
}
async function apiPost(url, payload){
  const r = await fetch(url, { method:"POST", body: JSON.stringify(payload) });
  const j = await r.json().catch(()=>({ok:false, erro:"Resposta inválida"}));
  if(!j.ok) throw new Error(j.erro || "Erro de API");
  return j.data;
}

/* ===== Cache de entradas ===== */
let cacheEntries = {}; // "SETOR|MES" -> { entries: [...] }
function getMonthKey(){ return el.mesRef.value || monthKeyLocal(); }
async function fetchEntries(sector, mes){
  const key = `${sector}|${mes}`;
  if(cacheEntries[key]) return cacheEntries[key];
  const data = await apiGet(`${API}/entries_list.php?setor=${encodeURIComponent(sector)}&mes=${encodeURIComponent(mes)}`);
  cacheEntries[key] = { entries: data.entries || [] };
  return cacheEntries[key];
}
async function getMonthDataAsync(){ return await fetchEntries(getActiveSector(), getMonthKey()); }

/* ===== Catálogo (servidor) ===== */
async function getCatalog(){ return await apiGet(`${API}/catalog_list.php`); }

/* ===== PREVISÕES ===== */
async function onAddPrevisao(ev){
  ev.preventDefault();
  const categoriaId = +el.categoria.value;
  const subcategoriaId = +el.subcategoria.value;
  const vencimento = el.vencimento.value || null;
  const valorPrev = parseFloat(String(el.valorPrev.value).replace(",", ".")) || 0;
  if(!categoriaId || !subcategoriaId || !valorPrev){ alert("Preencha categoria, subcategoria e valor."); return; }
  await apiPost(`${API}/entry_add.php`, {
    setor: getActiveSector(), mes: getMonthKey(),
    categoriaId, subcategoriaId, vencimento, valorPrev
  });
  cacheEntries = {};
  el.formPrev.reset();
  await renderAsync();
}

async function openEditModal(id){
  const md = await getMonthDataAsync();
  const it = md.entries.find(e=>e.id==id); if(!it) return;
  editingId = id;
  const cat = await getCatalog();
  const catOptions = cat.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  el.editCat.innerHTML = catOptions; el.editCat.value = it.categoriaId;
  const subs = cat.subcategories.filter(s=>s.categoryId==it.categoriaId);
  el.editSub.innerHTML = subs.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
  el.editSub.value = it.subcategoriaId;
  el.editVenc.value = it.vencimento || "";
  el.editPrev.value = String(it.valorPrev);
  el.modalBack.hidden = false;
}
function closeEdit(){ editingId = null; el.modalBack.hidden = true; }
async function salvarEdicao(){
  if(!editingId) return;
  const categoriaId = +el.editCat.value;
  const subcategoriaId = +el.editSub.value;
  const vencimento = el.editVenc.value || null;
  const valorPrev = parseFloat(String(el.editPrev.value).replace(",", ".")) || 0;
  if(!categoriaId || !subcategoriaId || !valorPrev){ alert("Preencha os campos."); return; }
  await apiPost(`${API}/entry_update.php`, { id: +editingId, categoriaId, subcategoriaId, vencimento, valorPrev });
  closeEdit();
  cacheEntries = {};
  await renderAsync();
}
async function excluirLancamento(id){
  if(!confirm("Excluir este lançamento?")) return;
  await apiGet(`${API}/entry_delete.php?id=${encodeURIComponent(id)}`);
  cacheEntries = {};
  await renderAsync();
}

/* ===== Pagamentos ===== */
async function addPagamento(id, valorStr, dataStr){
  const valor = parseFloat(String(valorStr).replace(",", ".")) || 0;
  if(valor<=0){ alert("Informe um valor maior que zero."); return; }
  await apiPost(`${API}/pagamento_add.php`, { lancamentoId:+id, valor, data: dataStr || todayYMD() });
  cacheEntries = {};
  await renderAsync();
}

/* ===== RELATÓRIO ===== */
async function renderRel(){
  const setor = getActiveSector(), mes = getMonthKey();
  const rows = await apiGet(`${API}/relatorio.php?setor=${encodeURIComponent(setor)}&mes=${encodeURIComponent(mes)}`);
  const cat = await getCatalog();

  const map = new Map();
  for(const item of rows){
    const { categoriaId, subcategoriaId, prev, pago } = item;
    if(!map.has(categoriaId)) map.set(categoriaId, { prev:0, pago:0, subs:new Map() });
    const c = map.get(categoriaId); c.prev+=prev; c.pago+=pago;
    if(!c.subs.has(subcategoriaId)) c.subs.set(subcategoriaId, { prev:0, pago:0 });
    const s = c.subs.get(subcategoriaId); s.prev+=prev; s.pago+=pago;
  }

  let totPrev=0, totPago=0, html="";
  const cats = [...map.entries()].sort((a,b)=>{
    const an = cat.categories.find(x=>x.id==a[0])?.name || "";
    const bn = cat.categories.find(x=>x.id==b[0])?.name || "";
    return an.localeCompare(bn);
  });
  for(const [catId, c] of cats){
    const difC = c.prev - c.pago, percC = c.prev>0 ? (c.pago/c.prev)*100 : 0;
    html += `<tr style="background:#f0fbff">
      <td colspan="2"><strong>${(cat.categories.find(x=>x.id==catId)?.name)||"(categoria)"}</strong></td>
      <td class="right"><strong>${money(c.prev)}</strong></td>
      <td class="right"><strong>${money(c.pago)}</strong></td>
      <td class="right"><strong>${money(difC)}</strong></td>
      <td class="right"><strong>${percC.toFixed(0)}%</strong></td>
    </tr>`;

    const subs = [...c.subs.entries()].sort((a,b)=>{
      const an = cat.subcategories.find(x=>x.id==a[0])?.name || "";
      const bn = cat.subcategories.find(x=>x.id==b[0])?.name || "";
      return an.localeCompare(bn);
    });
    for(const [subId, s] of subs){
      const dif = s.prev - s.pago, perc = s.prev>0 ? (s.pago/s.prev)*100 : 0;
      html += `<tr>
        <td></td><td>${(cat.subcategories.find(x=>x.id==subId)?.name)||"(subcategoria)"}</td>
        <td class="right">${money(s.prev)}</td>
        <td class="right">${money(s.pago)}</td>
        <td class="right">${money(dif)}</td>
        <td class="right">${perc.toFixed(0)}%</td>
      </tr>`;
    }
    totPrev+=c.prev; totPago+=c.pago;
  }
  el.tbRelBody.innerHTML = html || `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:16px">Sem dados para este mês.</td></tr>`;
  el.relTotPrev.textContent = money(totPrev);
  el.relTotPago.textContent = money(totPago);
  el.relTotDif.textContent  = money(totPrev - totPago);
  el.relTotPerc.textContent = `${(totPrev>0?(totPago/totPrev*100):0).toFixed(0)}%`;
}

/* ===== HISTÓRICO ===== */
async function renderHist(){
  const setor = getActiveSector(), mes = getMonthKey();
  const items = await apiGet(`${API}/historico_list.php?setor=${encodeURIComponent(setor)}&mes=${encodeURIComponent(mes)}`);
  const cat = await getCatalog();
  el.tbHistBody.innerHTML = (items || []).map(i=>{
    const d = ymdToBR(i.data);
    const v = ymdToBR(i.vencimento);
    const cn = cat.categories.find(x=>x.id==i.categoriaId)?.name || "(categoria)";
    const sn = cat.subcategories.find(x=>x.id==i.subcategoriaId)?.name || "(subcategoria)";
    return `<tr>
      <td>${d}</td><td>${cn}</td><td>${sn}</td>
      <td class="right">${money(i.valor)}</td><td>${v}</td><td class="right">${money(i.valorPrevisto)}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:16px">Sem pagamentos lançados.</td></tr>`;
}

/* ===== Categorias ===== */
async function renderCats(){
  const {categories, subcategories} = await getCatalog();
  el.tbCatsBody.innerHTML = categories.map(c=>{
    const count = subcategories.filter(s=>s.categoryId===c.id).length;
    return `<tr>
      <td>${c.name}</td><td>${count}</td>
      <td class="right">
        <button class="btn btn-outline-dark" onclick="renameCategory('${c.id}')">Renomear</button>
        <button class="btn btn-accent" onclick="deleteCategory('${c.id}')">Excluir</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Sem categorias</td></tr>`;

  const opts = categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  el.catParaSub.innerHTML = `<option value="">Selecione...</option>` + opts;

  const rows = subcategories.slice().sort((a,b)=>{
    const ca = (categories.find(x=>x.id===a.categoryId)?.name || "").localeCompare((categories.find(x=>x.id===b.categoryId)?.name || ""));
    return ca!==0?ca:(a.name||"").localeCompare(b.name||"");
  }).map(s=>`<tr>
    <td>${(categories.find(x=>x.id===s.categoryId)?.name)||"(categoria)"}</td><td>${s.name}</td>
    <td class="right">
      <button class="btn btn-outline-dark" onclick="renameSub('${s.id}')">Renomear</button>
      <button class="btn btn-accent" onclick="deleteSub('${s.id}')">Excluir</button>
    </td>
  </tr>`).join("");
  el.tbSubsBody.innerHTML = rows || `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Sem subcategorias</td></tr>`;
}

async function addCategory(){
  const name = (el.novaCategoria.value||"").trim();
  if(!name){ alert("Informe o nome da categoria."); return; }
  await apiPost(`${API}/category_add.php`, { name });
  el.novaCategoria.value=""; await renderCats(); await renderAsync();
}
async function renameCategory(id){
  const novo = prompt("Novo nome da categoria:"); if(novo===null) return;
  const name = novo.trim(); if(!name){ alert("Nome inválido."); return; }
  await apiPost(`${API}/category_rename.php`, { id:+id, name });
  await renderCats(); await renderAsync();
}
async function deleteCategory(id){
  if(!confirm("Excluir categoria?")) return;
  const d = await fetch(`${API}/category_delete.php?id=${encodeURIComponent(id)}`);
  const j = await d.json(); if(!j.ok){ alert(j.erro||"Não foi possível excluir"); return; }
  await renderCats(); await renderAsync();
}
async function addSub(){
  const categoryId = el.catParaSub.value; const name = (el.novaSubcat.value||"").trim();
  if(!categoryId){ alert("Selecione a categoria."); return; }
  if(!name){ alert("Informe o nome da subcategoria."); return; }
  await apiPost(`${API}/sub_add.php`, { categoryId:+categoryId, name });
  el.novaSubcat.value=""; await renderCats(); if(el.categoria.value===categoryId) await renderAsync();
}
async function renameSub(id){
  const novo = prompt("Novo nome da subcategoria:"); if(novo===null) return;
  const name = novo.trim(); if(!name){ alert("Nome inválido."); return; }
  await apiPost(`${API}/sub_rename.php`, { id:+id, name });
  await renderCats(); await renderAsync();
}
async function deleteSub(id){
  if(!confirm("Excluir subcategoria?")) return;
  const d = await fetch(`${API}/sub_delete.php?id=${encodeURIComponent(id)}`);
  const j = await d.json(); if(!j.ok){ alert(j.erro||"Não foi possível excluir"); return; }
  await renderCats(); await renderAsync();
}

/* ===== Exportações ===== */
// Gera CSV (abre no Excel)
function exportTable(tableId, filename){
  const table = document.getElementById(tableId);
  if(!table){ alert("Tabela não encontrada"); return; }
  const rows = [...table.rows];
  let csv = rows.map(row => {
    const cols = [...row.cells].map(c => `"${(c.innerText||"").replace(/"/g,'""')}"`);
    return cols.join(";");
  }).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// PDF simples via janela de impressão
function exportPDF(tableId, filename){
  const table = document.getElementById(tableId);
  if(!table){ alert("Tabela não encontrada"); return; }
  const win = window.open("", "_blank");
  win.document.write(`<html><head><title>${filename}</title>
    <style>
      body{font-family:Arial; padding:20px;}
      h2{margin:0 0 12px 0;}
      table{border-collapse:collapse; width:100%;}
      th,td{border:1px solid #ccc; padding:6px; font-size:12px; text-align:center;}
      th{background:#f0f0f0;}
    </style>
    </head><body>`);
  win.document.write(`<h2>${filename.replaceAll("_"," ").toUpperCase()}</h2>`);
  win.document.write(table.outerHTML);
  win.document.write("</body></html>");
  win.document.close();
  win.focus();
  win.print();
}

/* ===== navegação/tabs & mês ===== */
function setupTabs(){
  el.tabBtns.forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      el.tabBtns.forEach(b=>b.classList.remove("active"));
      el.tabs.forEach(t=>t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");

      if(btn.dataset.tab==="tabRel") await renderRel();
      if(btn.dataset.tab==="tabCats") await renderCats();
      if(btn.dataset.tab==="tabMes")  await renderAsync();
      if(btn.dataset.tab==="tabDiario")await renderAsync();
      if(btn.dataset.tab==="tabHist") await renderHist();
    });
  });
}
const setDefaultMonth = () => { el.mesRef.value = monthKeyLocal(); };

async function clearMonth(){
  if(!confirm("Limpar TODOS os lançamentos do mês selecionado (apenas do setor ativo)?")) return;
  await apiPost(`${API}/month_clear.php`, { setor: getActiveSector(), mes: getMonthKey() });
  cacheEntries = {};
  await renderAsync();
}

/* ===== render global ===== */
async function renderAsync(){
  const cat = await getCatalog();

  // preserve seleção atual
  const selectedCat = el.categoria?.value || "";
  const selectedSub = el.subcategoria?.value || "";

  // categorias
  const catOpts = cat.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  el.categoria.innerHTML = `<option value="">Selecione...</option>` + catOpts;

  if (selectedCat && cat.categories.some(c => String(c.id) === String(selectedCat))) {
    el.categoria.value = selectedCat;
  }

  // subcategorias de acordo com a categoria atual
  const currentCatId = el.categoria.value || "";
  const subOpts = currentCatId
    ? cat.subcategories.filter(s => String(s.categoryId) === String(currentCatId))
        .map(s => `<option value="${s.id}">${s.name}</option>`).join("")
    : "";
  el.subcategoria.innerHTML = `<option value="">Selecione...</option>` + subOpts;

  if (selectedSub && subOpts && cat.subcategories.some(s =>
      String(s.id) === String(selectedSub) && String(s.categoryId) === String(currentCatId))) {
    el.subcategoria.value = selectedSub;
  }

  const md = await getMonthDataAsync();

  // Previsões do mês
  const rowsPrev = md.entries.slice().sort((a,b)=>{
    const av=a.vencimento||"9999-12-31", bv=b.vencimento||"9999-12-31";
    if(av!==bv) return av.localeCompare(bv);
    const an = (cat.categories.find(x=>x.id==a.categoriaId)?.name||"").localeCompare(cat.categories.find(x=>x.id==b.categoriaId)?.name||"");
    if(an!==0) return an;
    const asn = cat.subcategories.find(x=>x.id==a.subcategoriaId)?.name || "";
    const bsn = cat.subcategories.find(x=>x.id==b.subcategoriaId)?.name || "";
    return asn.localeCompare(bsn);
  }).map(e=>{
    const venc = ymdToBR(e.vencimento);
    const cn = cat.categories.find(x=>x.id==e.categoriaId)?.name || "(categoria)";
    const sn = cat.subcategories.find(x=>x.id==e.subcategoriaId)?.name || "(subcategoria)";
    return `<tr>
      <td>${venc}</td><td>${cn}</td><td>${sn}</td>
      <td class="right">${money(e.valorPrev)}</td>
    </tr>`;
  }).join("");
  el.tbPrevMesBody.innerHTML = rowsPrev || `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:16px">Nenhuma previsão lançada.</td></tr>`;

  // Lançamentos diários + resumo
  const rowsLanc = md.entries.map(e=>{
    const pago = (e.pagamentos||[]).reduce((a,p)=>a+(+p.valor||0),0);
    const previsto = +e.valorPrev||0;
    const saldo = previsto - pago;
    const status = pago >= previsto ? "pago" : "pendente";
    const venc = ymdToBR(e.vencimento);
    const cn = cat.categories.find(x=>x.id==e.categoriaId)?.name || "(categoria)";
    const sn = cat.subcategories.find(x=>x.id==e.subcategoriaId)?.name || "(subcategoria)";
    return { e,pago,previsto,saldo,status,row:
      `<tr>
        <td>
          <div class="row gap" style="flex-wrap:wrap">
            <input type="number" step="0.01" min="0" placeholder="R$" id="pay-${e.id}" style="width:80px"/>
            <input type="date" id="paydate-${e.id}" style="width:120px"/>
            <button class="btn btn-outline-dark" onclick="addPagamento('${e.id}', document.getElementById('pay-${e.id}').value, document.getElementById('paydate-${e.id}').value)">Pagar</button>
            <button class="btn btn-outline-dark" onclick="openEditModal('${e.id}')">Editar</button>
            <button class="btn btn-accent" onclick="excluirLancamento('${e.id}')">Excluir</button>
          </div>
        </td>
        <td>${venc}</td>
        <td>${cn}</td>
        <td>${sn}</td>
        <td class="right">${money(previsto)}</td>
        <td class="right">${money(pago)}</td>
        <td class="right">${money(saldo)}</td>
        <td><span class="status ${status}">${status==="pago"?"Pago":"Pendente"}</span></td>
      </tr>`
    };
  });

  const filtro = el.filtroStatus?.value || "todos";
  const filtered = rowsLanc.filter(r => filtro==="todos" ? true : r.status===filtro);
  el.tbLancBody.innerHTML = filtered.map(r=>r.row).join("") || `<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:16px">Sem lançamentos.</td></tr>`;

  const totPrev = rowsLanc.reduce((a,r)=>a+r.previsto,0);
  const totPago = rowsLanc.reduce((a,r)=>a+r.pago,0);
  const dif = totPrev - totPago;
  const perc = totPrev>0 ? (totPago/totPrev*100) : 0;
  el.sumPrevisto.textContent = money(totPrev);
  el.sumPago.textContent = money(totPago);
  el.sumDiferenca.textContent = money(dif);
  el.sumPercent.textContent = `${perc.toFixed(0)}%`;
}

/* ===== eventos ===== */
function setupEvents(){
  el.sectorBtns.forEach(btn=> btn.addEventListener("click", ()=> setActiveSector(btn.dataset.sector)) );

  el.formPrev?.addEventListener("submit", onAddPrevisao);

  // Corrigido: atualizar apenas as subcategorias ao trocar a categoria
  el.categoria?.addEventListener("change", async () => {
    const cat = await getCatalog();
    const categoryId = el.categoria.value;
    const opts = cat.subcategories
      .filter(s => String(s.categoryId) === String(categoryId))
      .map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    el.subcategoria.innerHTML = `<option value="">Selecione...</option>` + opts;
  });

  el.filtroStatus?.addEventListener("change", renderAsync);
  el.btnAtualizarRel?.addEventListener("click", renderRel);
  el.btnNovoMes?.addEventListener("click", clearMonth);
  el.mesRef?.addEventListener("change", renderAsync);
  el.btnAddCat?.addEventListener("click", addCategory);
  el.btnAddSub?.addEventListener("click", addSub);
  el.btnSalvarEdit?.addEventListener("click", salvarEdicao);
  el.btnCancelarEdit?.addEventListener("click", closeEdit);
  el.editCat?.addEventListener("change", async ()=>{
    const cat = await getCatalog();
    const subs = cat.subcategories.filter(s=>s.categoryId==el.editCat.value);
    el.editSub.innerHTML = subs.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
  });
}

(function init(){
  setupTabs(); setupEvents();
  if(!el.mesRef.value) setDefaultMonth();
  setActiveSector(document.documentElement.getAttribute("data-sector") || DEFAULT_SECTOR);
})();

/* expose */
window.addPagamento = addPagamento;
window.openEditModal = openEditModal;
window.excluirLancamento = excluirLancamento;
window.exportTable = exportTable;
window.exportPDF = exportPDF;
window.makeFileName = makeFileName;
