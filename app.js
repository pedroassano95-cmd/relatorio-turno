
"use strict";
const $=id=>document.getElementById(id);
const FULL=["date","dds","cota","vehicles","tonnes","dayVehicles","dayTonnes","biomass","production","da01","da02","milling","belts","color","ashes","humidity","events","handover"];
const SIMPLE=["sVehicles","sTonnes","sQueue","sDayVehicles","sDayTonnes","sBiomass","sDa01","sDa02","sTrips"];
const OLD_DRAFT="relatorioTurno.draft.v1", OLD_HISTORY="relatorioTurno.v1";
const draftKey=t=>`relatoriosOperacao.${t}.draft.v2`;
const historyKey=t=>`relatoriosOperacao.${t}.history.v2`;
let active=null,turn={full:"A",simple:"A"},reportText="",previewStale=true;
function read(k,def){try{const s=localStorage.getItem(k);return s===null?def:JSON.parse(s)}catch{return def}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{$("status").textContent="Não foi possível salvar. Verifique o espaço e as permissões do navegador.";return false}}
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateBR(s){if(!s)return "";const [y,m,d]=s.split("-");return `${d}/${m}/${y}`}
function num(s){
 const x=String(s??"").trim().replace(/\s/g,"");
 if(!x)return NaN;
 // pt-BR: ponto = separador de milhar, vírgula = decimal
 if(!/^[+-]?\d[\d.,]*$/.test(x))return NaN;
 const v=x.includes(",")?x.replace(/\./g,"").replace(",","."):x.replace(/\./g,"");
 return Number(v);
}
function stockNumber(s,type){
 const x=String(s??"").trim().replace(/\s/g,"");
 // No relatório de 2 horas, "954.601" é 954,601 t, conforme exemplo fornecido.
 // Uma única pontuação seguida por 3 algarismos, sem vírgula, é decimal nesse modelo.
 if(type==="simple" && /^\d+\.\d{3}$/.test(x))return Number(x);
 return num(x);
}
function fmt(n,digits){return n.toLocaleString("pt-BR",{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:true})}
function calc(){
 const full=num($("da01").value)+num($("da02").value);
 const simple=stockNumber($("sDa01").value,"simple")+stockNumber($("sDa02").value,"simple");
 $("stockTotal").value=Number.isFinite(full)?fmt(full,0):"";
 $("sStockTotal").value=Number.isFinite(simple)?fmt(simple,3):"";
}
function data(type){
 const d={turn:turn[type]};
 (type==="full"?FULL:SIMPLE).forEach(id=>d[id]=$(id).value);
 if(type==="full"){d.clean={};document.querySelectorAll("[data-clean]").forEach(c=>d.clean[c.dataset.clean]=c.checked)}
 return d;
}
function fill(type,d){
 if(!d)return;
 turn[type]=["A","B","C"].includes(d.turn)?d.turn:"A";
 (type==="full"?FULL:SIMPLE).forEach(id=>{if(d[id]!==undefined&&$(id))$(id).value=d[id]});
 if(type==="full"){
  document.querySelectorAll("[data-clean]").forEach(c=>c.checked=d.clean?.[c.dataset.clean]??true);
 }
 updateTurnButtons(type);calc();
}
function updateTurnButtons(type){
 document.querySelectorAll(type==="full"?"[data-turn]":"[data-simple-turn]").forEach(b=>{
  b.classList.toggle("active",(b.dataset.turn||b.dataset.simpleTurn)===turn[type]);
 });
}
function persist(type){write(draftKey(type),data(type));previewStale=true}
function refreshDate(){
 // Only the complete report has a date. Always use the current local date upon reopening.
 const today=localDate();
 if($("date").value!==today){$("date").value=today;persist("full")}
}
function open(type){
 active=type;
 $("home").hidden=true;$("workspace").hidden=false;
 $("fullForm").hidden=type!=="full";$("simpleForm").hidden=type!=="simple";
 $("reportLabel").textContent=type==="full"?"Relatório de Turno":"Relatório de 2 Horas";
 $("preview").textContent="Toque em “Gerar relatório” para ver o texto.";
 $("status").textContent="";reportText="";previewStale=true;
 if(type==="full")refreshDate();
 calc();renderHistory();window.scrollTo(0,0);
}
function value(v){return String(v??"").trim()||"—"}
function buildFull(d){
 const clean=Object.entries(d.clean||{}).map(([k,v])=>`${k}: ${v?"✅":"❌"}`).join("\n");
 const events=(d.events||"").split(/\n/).map(x=>x.trim()).filter(Boolean).join("\n\n");
 const next={A:"B",B:"C",C:"A"}[d.turn];
 const lines=[
 `*RELATÓRIO TURNO ${d.turn}*`,`*${dateBR(d.date)}*`,"",
 `*DDS: ${value(d.dds)}*`,"",`*Cota programada:* ${value(d.cota)} t`,"",
 "*Carregamento de açúcar*",`*Expedido - Turno ${d.turn}* ${value(d.vehicles)} veículos - ${value(d.tonnes)} t`,"",
 `*Total do dia:* ${value(d.dayVehicles)} veículos - ${value(d.dayTonnes)} t`,
 "*_______________________*",`*Carregamento Biomassa Turno ${d.turn}* ${value(d.biomass)}`,
 "*_______________________*",`*Produção do turno ${d.turn}:* ${value(d.production)}`,"",
 `*Estoque DA01:* ${value(d.da01)} t`,`*Estoque DA02:* ${value(d.da02)} t`,
 `*Total em estoque:* ${value($("stockTotal").value)} t`,"",
 "*🔹OPERAÇÃO🔹*","",`*Moagem:* ${value(d.milling)}`,"",`*Esteiras:* ${value(d.belts)}`,"",
 "*Limpeza do Setor:*",clean,"","*Analise VHP:*",
 `Cor: ${value(d.color)}`,`Cinzas: ${value(d.ashes)}`,`Umidade: ${value(d.humidity)}`,"",
 "*🔺Ocorrências*","",events||"—"];
 if(d.handover!=="none")lines.push("",`Passando para o Turno *${next}*`,"Bom trabalho a todos🙏🏻");
 return lines.join("\n");
}
function buildSimple(d){
 return [
 `*Carregamento de Açúcar turno ${d.turn}:* ${value(d.sVehicles)} veículos - ${value(d.sTonnes)} t`,"",
 `${value(d.sQueue)} veículo(s) na fila monitorada`,"",
 `*Total do dia:* ${value(d.sDayVehicles)} veículo(s) - ${value(d.sDayTonnes)} t`,
 "*_______________________*",
 `*Carregamento Biomassa ${d.turn}:* ${value(d.sBiomass)}`,
 "*_______________________*",
 `*Estoque DA01:* ${value(d.sDa01)} t`,
 `*Estoque DA02:* ${value(d.sDa02)} t`,
 `*Total:* ${value($("sStockTotal").value)} t`,
 "*_______________________*",
 "🔄 *Transferência vira interno DA01 para DA02*",
 `*Viagem:* ${value(d.sTrips)} viagens`
 ].join("\n");
}
function generate(){
 if(!active)return;
 calc();reportText=active==="full"?buildFull(data("full")):buildSimple(data("simple"));
 $("preview").textContent=reportText;
 previewStale=false;persist(active);previewStale=false;
 $("status").textContent="Relatório gerado. Confira os valores antes de enviar.";
}
function ensureReport(){if(!reportText||previewStale)generate()}
function history(type){return read(historyKey(type),[])}
function save(){
 ensureReport();
 const arr=history(active);
 arr.unshift({id:Date.now(),savedAt:new Date().toISOString(),turn:turn[active],date:active==="full"?$("date").value:localDate(),report:reportText,data:data(active),type:active});
 write(historyKey(active),arr.slice(0,100));renderHistory();
 $("status").textContent="Relatório salvo no histórico deste aparelho.";
}
function renderHistory(){
 const root=$("history");root.replaceChildren();
 const arr=history(active);
 if(!arr.length){root.textContent="Nenhum relatório salvo neste modelo.";return}
 arr.forEach(item=>{
  const row=document.createElement("div");row.className="history-item";
  const info=document.createElement("div"),title=document.createElement("strong");
  title.textContent=`${item.type==="simple"?"2 horas":"Turno"} ${item.turn||"A"} — ${dateBR(item.date)}`;
  const sub=document.createElement("div");sub.className="note";
  sub.textContent=new Date(item.savedAt).toLocaleString("pt-BR");
  info.append(title,sub);
  const buttons=document.createElement("div");buttons.style.cssText="display:flex;gap:6px";
  const load=document.createElement("button");load.textContent="Abrir";
  load.onclick=()=>{fill(active,item.data);persist(active);reportText=item.report;$("preview").textContent=item.report;previewStale=false;$("status").textContent="Histórico carregado. Confira a data e os valores antes de enviar.";window.scrollTo(0,0)};
  const copy=document.createElement("button");copy.textContent="Copiar";copy.onclick=()=>copyText(item.report);
  buttons.append(load,copy);row.append(info,buttons);root.append(row);
 });
}
async function copyText(s){
 try{await navigator.clipboard.writeText(s);$("status").textContent="Texto copiado. Cole no WhatsApp."}
 catch{
  const t=document.createElement("textarea");t.value=s;document.body.append(t);t.select();
  const ok=document.execCommand("copy");t.remove();
  $("status").textContent=ok?"Texto copiado. Cole no WhatsApp.":"Não foi possível copiar. Selecione o texto da prévia.";
 }
}
function migrate(){
 // Import prior version's full-report draft/history once; do not remove the old keys.
 if(localStorage.getItem(draftKey("full"))===null){
  const old=read(OLD_DRAFT,null);if(old)write(draftKey("full"),old);
 }
 if(localStorage.getItem(historyKey("full"))===null){
  const old=read(OLD_HISTORY,[]);if(Array.isArray(old)&&old.length)write(historyKey("full"),old.map(x=>({...x,type:"full"})));
 }
}
migrate();
fill("full",read(draftKey("full"),null));
fill("simple",read(draftKey("simple"),null));
refreshDate();
document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>open(b.dataset.open));
$("back").onclick=()=>{$("workspace").hidden=true;$("home").hidden=false;active=null;window.scrollTo(0,0)};
document.querySelectorAll("[data-turn]").forEach(b=>b.onclick=()=>{turn.full=b.dataset.turn;updateTurnButtons("full");persist("full")});
document.querySelectorAll("[data-simple-turn]").forEach(b=>b.onclick=()=>{turn.simple=b.dataset.simpleTurn;updateTurnButtons("simple");persist("simple")});
FULL.forEach(id=>$(id).addEventListener("input",()=>{calc();persist("full")}));
SIMPLE.forEach(id=>$(id).addEventListener("input",()=>{calc();persist("simple")}));
document.querySelectorAll("[data-clean]").forEach(c=>c.addEventListener("change",()=>persist("full")));
$("generate").onclick=generate;
$("copy").onclick=()=>{ensureReport();copyText(reportText)};
$("save").onclick=save;
$("share").onclick=async()=>{
 ensureReport();
 if(navigator.share){try{await navigator.share({title:"Relatório de Operação",text:reportText})}catch(e){if(e.name!=="AbortError")$("status").textContent="Não foi possível compartilhar."}}
 else copyText(reportText);
};
$("export").onclick=()=>{
 const payload={version:2,exportedAt:new Date().toISOString(),
 drafts:{full:data("full"),simple:data("simple")},
 histories:{full:history("full"),simple:history("simple")}};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="backup-relatorios-operacao.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $("status").textContent="Backup dos dois modelos exportado.";
};
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{
  const p=JSON.parse(await f.text());
  if(p.version===2&&p.histories){
   for(const type of ["full","simple"]){
    if(Array.isArray(p.histories[type]))write(historyKey(type),[...p.histories[type],...history(type)].slice(0,100));
    if(p.drafts?.[type]){write(draftKey(type),p.drafts[type]);fill(type,p.drafts[type])}
   }
  }else if(Array.isArray(p.history)){
   write(historyKey("full"),[...p.history,...history("full")].slice(0,100));
   if(p.draft){write(draftKey("full"),p.draft);fill("full",p.draft)}
  }else throw Error("formato");
  refreshDate();renderHistory();previewStale=true;
  $("status").textContent="Backup importado. Confira os dados.";
 }catch{$("status").textContent="Arquivo de backup inválido."}
 e.target.value="";
};
$("clearHistory").onclick=()=>{
 if(confirm("Apagar o histórico deste modelo neste aparelho? Os últimos dados preenchidos serão mantidos.")){
  localStorage.removeItem(historyKey(active));renderHistory();$("status").textContent="Histórico deste modelo apagado.";
 }
};
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshDate()});
window.addEventListener("pageshow",refreshDate);
if("serviceWorker" in navigator&&location.protocol!=="file:"){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
