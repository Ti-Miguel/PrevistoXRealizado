/* ========= PxR com Setores (ODONTOLOGIA / MEDICINA) =========
   Armazenamento (v2):
   STORAGE_KEY_V2 = {
     [setor]: { [YYYY-MM]: { entries: [...] } }
   }
   Catálogo continua GLOBAL (categorias/subcategorias compartilhadas).
============================================================== */

const SECTORS = { ODONTOLOGIA: "ODONTOLOGIA", MEDICINA: "MEDICINA" };
const DEFAULT_SECTOR = SECTORS.ODONTOLOGIA;

const STORAGE_KEY_V2 = "pxr_data_v2";     // novo (com setor)
const LEGACY_KEY_V1 = "pxr_data_v1";      // antigo (sem setor)
const CATALOG_KEY   = "pxr_catalog_v1";   // global (mantido)

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
function getActiveSector(){
  return document.documentElement.getAttribute("data-sector") || DEFAULT_SECTOR;
}
function setActiveSector(sector){
  document.documentElement.setAttribute("data-sector", sector);
  el.sectorBtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sector === sector)));
  render(); // recarrega tudo do setor
}

/* ===== Datas SEM fuso ===== */
function todayYMD(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function monthKeyLocal(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function ymdToBR(ymd){ if(!ymd) return "—"; const [y,m,d]=String(ymd).split("-"); return `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`; }
function normalizeYMD(s){
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s); if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

/* ===== storage helpers ===== */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* Migração de v1 (sem setor) -> v2 (com setor).
   Estratégia: move TODOS os meses existentes para o setor ODONTOLOGIA, para não perder dados.
*/
function migrateV1toV2(){
  const v2 = load(STORAGE_KEY_V2, null);
  if (v2) return; // já migrou

  const v1 = load(LEGACY_KEY_V1, null);
  if (!v1) { save(STORAGE_KEY_V2, {}); return; }

  const dest = {};
  dest[SECTORS.ODONTOLOGIA] = {};
  for (const [mKey, md] of Object.entries(v1)) {
    if (!md || !Array.isArray(md.entries)) continue;
    // normaliza datas antigas
    md.entries.forEach(e => {
      e.vencimento = normalizeYMD(e.vencimento);
      e.criadoEm = normalizeYMD(e.criadoEm);
      if (Array.isArray(e.pagamentos)) {
        e.pagamentos.forEach(p => p.data = normalizeYMD(p.data));
      }
    });
    dest[SECTORS.ODONTOLOGIA][mKey] = md;
  }
  save(STORAGE_KEY_V2, dest);
}

/* Estrutura v2 */
function getAllDataV2(){
  const all = load(STORAGE_KEY_V2, null);
  if (!all) { save(STORAGE_KEY_V2, {}); return {}; }
  return all;
}
function setAllDataV2(obj){ save(STORAGE_KEY_V2, obj); }

const getMonthKey = () => el.mesRef.value || monthKeyLocal();
function ensureMonth(){
  const sector = getActiveSector(), mKey = getMonthKey();
  const all = getAllDataV2();
  if (!all[sector]) all[sector] = {};
  if (!all[sector][mKey]) all[sector][mKey] = { entries: [] };
  setAllDataV2(all);
  return all[sector][mKey];
}
function getMonthData(){
  const sector = getActiveSector(), mKey = getMonthKey();
  const all = getAllDataV2();
  return (all[sector] && all[sector][mKey]) ? all[sector][mKey] : ensureMonth();
}
function setMonthData(md){
  const sector = getActiveSector(), mKey = getMonthKey();
  const all = getAllDataV2();
  if (!all[sector]) all[sector] = {};
  all[sector][mKey] = md;
  setAllDataV2(all);
}

/* ===== Catálogo global ===== */
function getCatalog(){
  const cat = load(CATALOG_KEY, null);
  if (cat) return cat;
  const fresh = { categories: [], subcategories: [] };
  save(CATALOG_KEY, fresh); return fresh;
}
const setCatalog = (c) => save(CATALOG_KEY, c);
const catName = (id) => getCatalog().categories.find(x=>x.id===id)?.name || "(categoria)";
const subName = (id) => getCatalog().subcategories.find(x=>x.id===id)?.name || "(subcategoria)";
function fillCatSelect(sel, withBlank=true){
  const opts = getCatalog().categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
  sel.innerHTML = (withBlank?`<option value="">Selecione...</option>`:"") + opts;
}
function fillSubSelect(sel, catId, withBlank=true){
  const opts = getCatalog().subcategories.filter(s=>s.categoryId===catId)
     .map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
  sel.innerHTML = (withBlank?`<option value="">Selecione...</option>`:"") + opts;
}
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()));
const esc = (s="") => s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m]));

/* ===== regras de negócio ===== */
const totalPago = (e) => (e.pagamentos||[]).reduce((a,p)=>a+(parseFloat(p.valor)||0),0);

/* ===== PREVISÕES ===== */
function onAddPrevisao(ev){
  ev.preventDefault();
  const categoriaId = el.categoria.value;
  const subcategoriaId = el.subcategoria.value;
  const vencimento = el.vencimento.value || null;
  const valorPrev = parseFloat(String(el.valorPrev.value).replace(",", ".")) || 0;
  if(!categoriaId || !subcategoriaId || !valorPrev){ alert("Preencha categoria, subcategoria e valor."); return; }

  const md = getMonthData();
  md.entries.push({ id:uuid(), categoriaId, subcategoriaId, vencimento, valorPrev, pagamentos:[], criadoEm: todayYMD() });
  setMonthData(md);

  el.formPrev.reset();
  fillCatSelect(el.categoria); el.subcategoria.innerHTML = `<option value="">Selecione...</option>`;
  render();
}
function renderPrevMes(){
  const rows = getMonthData().entries.slice()
    .sort((a,b)=>{
      const av=a.vencimento||"9999-12-31", bv=b.vencimento||"9999-12-31";
      if(av!==bv) return av.localeCompare(bv);
      const ac = catName(a.categoriaId).localeCompare(catName(b.categoriaId));
      if(ac!==0) return ac;
      return subName(a.subcategoriaId).localeCompare(subName(b.subcategoriaId));
    })
    .map(e=>{
      const venc = ymdToBR(e.vencimento);
      return `<tr>
        <td>${venc}</td><td>${esc(catName(e.categoriaId))}</td><td>${esc(subName(e.subcategoriaId))}</td>
        <td class="right">${money(e.valorPrev)}</td>
      </tr>`;
    }).join("");
  el.tbPrevMesBody.innerHTML = rows || `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:16px">Nenhuma previsão lançada.</td></tr>`;
}

/* ===== LANÇAMENTOS DIÁRIOS ===== */
function addPagamento(id, valorStr, dataStr){
  const valor = parseFloat(String(valorStr).replace(",", ".")) || 0;
  if(valor<=0){ alert("Informe um valor maior que zero."); return; }
  const md = getMonthData();
  const it = md.entries.find(e=>e.id===id); if(!it) return;
  it.pagamentos.push({ valor, data: dataStr || todayYMD() });
  setMonthData(md); render();
}
function openEditModal(id){
  const it = getMonthData().entries.find(e=>e.id===id); if(!it) return;
  editingId = id;
  fillCatSelect(el.editCat, false); el.editCat.value = it.categoriaId;
  fillSubSelect(el.editSub, it.categoriaId, false); el.editSub.value = it.subcategoriaId;
  el.editVenc.value = it.vencimento || ""; el.editPrev.value = String(it.valorPrev);
  el.modalBack.hidden = false;
}
function closeEdit(){ editingId = null; el.modalBack.hidden = true; }
function salvarEdicao(){
  if(!editingId) return;
  const categoriaId = el.editCat.value;
  const subcategoriaId = el.editSub.value;
  const vencimento = el.editVenc.value || null;
  const valorPrev = parseFloat(String(el.editPrev.value).replace(",", ".")) || 0;
  if(!categoriaId || !subcategoriaId || !valorPrev){ alert("Preencha os campos."); return; }
  const md = getMonthData();
  Object.assign(md.entries.find(e=>e.id===editingId), { categoriaId, subcategoriaId, vencimento, valorPrev });
  setMonthData(md); closeEdit(); render();
}
function excluirLancamento(id){
  if(!confirm("Excluir este lançamento?")) return;
  const md = getMonthData(); md.entries = md.entries.filter(e=>e.id!==id);
  setMonthData(md); render();
}
function renderLanc(){
  const filtro = el.filtroStatus?.value || "todos";
  const rows = getMonthData().entries
    .map(e => {
      const pago = totalPago(e);
      const previsto = e.valorPrev || 0;
      const saldo = previsto - pago;
      const status = pago >= previsto ? "pago" : "pendente";
      return { e, pago, saldo, status, previsto };
    })
    .filter(r => filtro==="todos" ? true : r.status===filtro)
    .sort((a,b)=>(b.e.criadoEm||"").localeCompare(a.e.criadoEm||""))
    .map(({e,pago,saldo,status,previsto})=>{
      const venc = ymdToBR(e.vencimento);
      return `<tr>
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
        <td>${esc(catName(e.categoriaId))}</td>
        <td>${esc(subName(e.subcategoriaId))}</td>
        <td class="right">${money(previsto)}</td>
        <td class="right">${money(pago)}</td>
        <td class="right">${money(saldo)}</td>
        <td><span class="status ${status}">${status==="pago"?"Pago":"Pendente"}</span></td>
      </tr>`;
    }).join("");
  el.tbLancBody.innerHTML = rows || `<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:16px">Sem lançamentos.</td></tr>`;
}

/* ===== RELATÓRIO ===== */
function renderRel(){
  const map = new Map(); // catId -> {prev,pago,subs: Map(subId->{prev,pago})}
  for(const it of getMonthData().entries){
    const prev = +it.valorPrev||0, pago = totalPago(it);
    if(!map.has(it.categoriaId)) map.set(it.categoriaId, { prev:0, pago:0, subs:new Map() });
    const c = map.get(it.categoriaId); c.prev+=prev; c.pago+=pago;
    if(!c.subs.has(it.subcategoriaId)) c.subs.set(it.subcategoriaId, { prev:0, pago:0 });
    const s = c.subs.get(it.subcategoriaId); s.prev+=prev; s.pago+=pago;
  }

  let totPrev=0, totPago=0, html="";
  const cats = [...map.entries()].sort((a,b)=>catName(a[0]).localeCompare(catName(b[0])));
  for(const [catId, c] of cats){
    const difC = c.prev - c.pago, percC = c.prev>0 ? (c.pago/c.prev)*100 : 0;
    html += `<tr style="background:#f0fbff">
      <td colspan="2"><strong>${esc(catName(catId))}</strong></td>
      <td class="right"><strong>${money(c.prev)}</strong></td>
      <td class="right"><strong>${money(c.pago)}</strong></td>
      <td class="right"><strong>${money(difC)}</strong></td>
      <td class="right"><strong>${percC.toFixed(0)}%</strong></td>
    </tr>`;

    const subs = [...c.subs.entries()].sort((a,b)=>subName(a[0]).localeCompare(subName(b[0])));
    for(const [subId, s] of subs){
      const dif = s.prev - s.pago, perc = s.prev>0 ? (s.pago/s.prev)*100 : 0;
      html += `<tr>
        <td></td><td>${esc(subName(subId))}</td>
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
function renderHist(){
  const items = [];
  for(const e of getMonthData().entries){
    for(const p of (e.pagamentos||[])){
      items.push({
        data: p.data || todayYMD(),
        valor: +p.valor||0,
        categoria: catName(e.categoriaId),
        subcategoria: subName(e.subcategoriaId),
        venc: e.vencimento || null,
        previsto: +e.valorPrev||0
      });
    }
  }
  items.sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  el.tbHistBody.innerHTML = items.map(i=>{
    const d = ymdToBR(i.data);
    const v = ymdToBR(i.venc);
    return `<tr>
  <td>${d}</td><td>${esc(i.categoria)}</td><td>${esc(i.subcategoria)}</td>
  <td class="right">${money(i.valor)}</td><td>${v}</td><td class="right">${money(i.previsto)}</td>
</tr>`;
  }).join("") || `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:16px">Sem pagamentos lançados.</td></tr>`;
}

/* ===== Categorias (CRUD) ===== */
function renderCats(){
  const {categories, subcategories} = getCatalog();

  // tabela de categorias
  el.tbCatsBody.innerHTML = categories.map(c=>{
    const count = subcategories.filter(s=>s.categoryId===c.id).length;
    return `<tr>
      <td>${esc(c.name)}</td><td>${count}</td>
      <td class="right">
        <button class="btn btn-outline-dark" onclick="renameCategory('${c.id}')">Renomear</button>
        <button class="btn btn-accent" onclick="deleteCategory('${c.id}')">Excluir</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Sem categorias</td></tr>`;

  // selects
  fillCatSelect(el.catParaSub);

  // subcategorias
  const rows = subcategories.slice().sort((a,b)=>{
    const ca = catName(a.categoryId).localeCompare(catName(b.categoryId));
    return ca!==0?ca:a.name.localeCompare(b.name);
  }).map(s=>`<tr>
    <td>${esc(catName(s.categoryId))}</td><td>${esc(s.name)}</td>
    <td class="right">
      <button class="btn btn-outline-dark" onclick="renameSub('${s.id}')">Renomear</button>
      <button class="btn btn-accent" onclick="deleteSub('${s.id}')">Excluir</button>
    </td>
  </tr>`).join("");
  el.tbSubsBody.innerHTML = rows || `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Sem subcategorias</td></tr>`;
}
function addCategory(){
  const name = (el.novaCategoria.value||"").trim();
  if(!name){ alert("Informe o nome da categoria."); return; }
  const cat = getCatalog();
  if(cat.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())){ alert("Categoria já existe."); return; }
  cat.categories.push({ id:uuid(), name }); setCatalog(cat);
  el.novaCategoria.value=""; renderCats(); fillCatSelect(el.categoria); el.subcategoria.innerHTML = `<option value="">Selecione...</option>`;
}
function renameCategory(id){
  const cat = getCatalog(); const c = cat.categories.find(x=>x.id===id); if(!c) return;
  const novo = prompt("Novo nome da categoria:", c.name); if(novo===null) return;
  const name = novo.trim(); if(!name){ alert("Nome inválido."); return; }
  if(cat.categories.some(x=>x.id!==id && x.name.toLowerCase()===name.toLowerCase())){ alert("Já existe outra categoria com esse nome."); return; }
  c.name = name; setCatalog(cat); renderCats(); render();
}
function deleteCategory(id){
  const cat = getCatalog();
  if(cat.subcategories.some(s=>s.categoryId===id)){ alert("Remova/realocar subcategorias antes."); return; }
  if(isCategoryUsed(id)){ alert("Categoria em uso em lançamentos."); return; }
  if(!confirm("Excluir categoria?")) return;
  cat.categories = cat.categories.filter(c=>c.id!==id); setCatalog(cat); renderCats(); render();
}
function addSub(){
  const categoryId = el.catParaSub.value; const name = (el.novaSubcat.value||"").trim();
  if(!categoryId){ alert("Selecione a categoria."); return; }
  if(!name){ alert("Informe o nome da subcategoria."); return; }
  const cat = getCatalog();
  if(cat.subcategories.some(s=>s.categoryId===categoryId && s.name.toLowerCase()===name.toLowerCase())){ alert("Subcategoria já existe nessa categoria."); return; }
  cat.subcategories.push({ id:uuid(), categoryId, name }); setCatalog(cat);
  el.novaSubcat.value=""; renderCats(); if(el.categoria.value===categoryId) fillSubSelect(el.subcategoria, categoryId);
}
function renameSub(id){
  const cat = getCatalog(); const s = cat.subcategories.find(x=>x.id===id); if(!s) return;
  const novo = prompt("Novo nome da subcategoria:", s.name); if(novo===null) return;
  const name = novo.trim(); if(!name){ alert("Nome inválido."); return; }
  if(cat.subcategories.some(x=>x.id!==id && x.categoryId===s.categoryId && x.name.toLowerCase()===name.toLowerCase())){ alert("Já existe outra subcategoria com esse nome."); return; }
  s.name = name; setCatalog(cat); renderCats(); render();
}
function isCategoryUsed(categoryId){
  const all = getAllDataV2();
  return Object.values(all).some(sectorObj =>
    Object.values(sectorObj || {}).some(md => (md.entries||[]).some(e=>e.categoriaId===categoryId))
  );
}
function isSubUsed(subId){
  const all = getAllDataV2();
  return Object.values(all).some(sectorObj =>
    Object.values(sectorObj || {}).some(md => (md.entries||[]).some(e=>e.subcategoriaId===subId))
  );
}

/* ===== navegação/tabs & mês ===== */
function setupTabs(){
  el.tabBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      el.tabBtns.forEach(b=>b.classList.remove("active"));
      el.tabs.forEach(t=>t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");

      if(btn.dataset.tab==="tabRel") renderRel();
      if(btn.dataset.tab==="tabCats") renderCats();
      if(btn.dataset.tab==="tabMes") renderPrevMes();
      if(btn.dataset.tab==="tabDiario") renderLanc();
      if(btn.dataset.tab==="tabHist") renderHist();
    });
  });
}
const setDefaultMonth = () => { el.mesRef.value = monthKeyLocal(); };
function clearMonth(){
  if(!confirm("Limpar TODOS os lançamentos do mês selecionado (apenas do setor ativo)?")) return;
  const sector = getActiveSector(); const mKey = getMonthKey();
  const all = getAllDataV2();
  if (!all[sector]) all[sector] = {};
  all[sector][mKey] = { entries: [] };
  setAllDataV2(all); render();
}

/* ===== render global ===== */
function render(){
  // selects do formulário de previsão
  fillCatSelect(el.categoria); if(el.categoria.value) fillSubSelect(el.subcategoria, el.categoria.value);
  else el.subcategoria.innerHTML = `<option value="">Selecione...</option>`;

  renderPrevMes();
  renderLanc();

  // resumo
  const entries = getMonthData().entries;
  const totPrev = entries.reduce((a,it)=>a+(+it.valorPrev||0),0);
  const totPago = entries.reduce((a,it)=>a+totalPago(it),0);
  const dif = totPrev - totPago;
  const perc = totPrev>0 ? (totPago/totPrev)*100 : 0;
  el.sumPrevisto.textContent = money(totPrev);
  el.sumPago.textContent = money(totPago);
  el.sumDiferenca.textContent = money(dif);
  el.sumPercent.textContent = `${perc.toFixed(0)}%`;

  // re-render se a aba já estiver aberta
  if($("#tabRel")?.classList.contains("active")) renderRel();
  if($("#tabHist")?.classList.contains("active")) renderHist();
}

/* ===== eventos ===== */
function setupEvents(){
  // setor
  el.sectorBtns.forEach(btn=>{
    btn.addEventListener("click", ()=> setActiveSector(btn.dataset.sector));
  });

  // seus já existentes
  el.formPrev?.addEventListener("submit", onAddPrevisao);
  el.categoria?.addEventListener("change", ()=>fillSubSelect(el.subcategoria, el.categoria.value));
  el.filtroStatus?.addEventListener("change", renderLanc);
  el.btnAtualizarRel?.addEventListener("click", renderRel);
  el.btnNovoMes?.addEventListener("click", clearMonth);
  el.mesRef?.addEventListener("change", render);
  el.btnAddCat?.addEventListener("click", addCategory);
  el.btnAddSub?.addEventListener("click", addSub);
  el.btnSalvarEdit?.addEventListener("click", salvarEdicao);
  el.btnCancelarEdit?.addEventListener("click", closeEdit);
  el.editCat?.addEventListener("change", ()=>fillSubSelect(el.editSub, el.editCat.value, false));
}

/* ===== init ===== */
(function init(){
  migrateV1toV2();         // move dados antigos para ODONTOLOGIA
  setupTabs(); setupEvents();
  if(!el.mesRef.value) setDefaultMonth();
  getCatalog();            // garante estrutura no localStorage
  // setor inicial
  setActiveSector(document.documentElement.getAttribute("data-sector") || DEFAULT_SECTOR);
})();
 
/* ===== expõe p/ botões inline ===== */
window.addPagamento = addPagamento;
window.openEditModal = openEditModal;
window.excluirLancamento = excluirLancamento;
