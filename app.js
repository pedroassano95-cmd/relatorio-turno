const $=id=>document.getElementById(id);
const FIELDS=["date","dds","cota","vehicles","tonnes","dayVehicles","dayTonnes","biomass","production","da01","da02","milling","belts","color","ashes","humidity","events","handover"];
let currentTurn="A", currentReport="";
const STORAGE_KEY="relatorioTurno.v1", DRAFT_KEY="relatorioTurno.draft.v1";
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateBR(s){if(!s)return "";const [y,m,d]=s.split("-");return `${d}/${m}/${y}`}
function numberBR(s){if(!s)return NaN;let x=String(s).trim().replace(/\s/g,"");if(x.includes(",")){x=x.replace(/\./g,"").replace(",",".")}else if((x.match(/\./g)||[]).length>1){x=x.replace(/\./g,"")}return Number(x)}
function fmtBR(n){return n.toLocaleString("pt-BR",{minimumFractionDigits:3,maximumFractionDigits:3})}
function getData(){const d={turn:currentTurn,clean:{}};FIELDS.forEach(id=>d[id]=$(id).value);document.querySelectorAll("[data-clean]").forEach(c=>d.clean[c.dataset.clean]=c.checked);return d}
function setData(d){if(!d)return;currentTurn=d.turn||"A";document.querySelectorAll("[data-turn]").forEach(b=>b.classList.toggle("active",b.dataset.turn===currentTurn));FIELDS.forEach(id=>{if(d[id]!==undefined&&$(id))$(id).value=d[id]});document.querySelectorAll("[data-clean]").forEach(c=>c.checked=d.clean?.[c.dataset.clean]??true);calcStock()}
function calcStock(){const a=numberBR($("da01").value),b=numberBR($("da02").value);$("stockTotal").value=Number.isFinite(a)&&Number.isFinite(b)?fmtBR(a+b):""}
function collectReport(d=getData()){
 const clean=Object.entries(d.clean||{}).map(([k,v])=>`${k}: ${v?"✅":"❌"}`).join("\n");
 const events=(d.events||"").split(/\n/).map(s=>s.trim()).filter(Boolean).join("\n\n");
 const next={A:"B",B:"C",C:"A"}[d.turn]||"B";
 const lines=[
 `*RELATÓRIO TURNO ${d.turn}*`,
 `*${dateBR(d.date)}*`,
 "",
 `*DDS: ${d.dds||"—"}*`,
 "",
 `*Cota programada:* ${d.cota||"—"} t`,
 "",
 "*Carregamento de açúcar*",
 `*Expedido - Turno ${d.turn}* ${d.vehicles||"—"} veículos - ${d.tonnes||"—"} t`,
 "",
 `*Total do dia:* ${d.dayVehicles||"—"} veículos - ${d.dayTonnes||"—"} t`,
 "*_______________________*",
 `*Carregamento Biomassa Turno ${d.turn}* ${d.biomass||"—"}`,
 "*_______________________*",
 `*Produção do turno ${d.turn}:* ${d.production||"—"}`,
 "",
 `*Estoque DA01:* ${d.da01||"—"} t`,
 `*Estoque DA02:* ${d.da02||"—"} t`,
 `*Total em estoque:* ${$("stockTotal").value||"—"} t`,
 "",
 "*🔹OPERAÇÃO🔹*",
 "",
 `*Moagem:* ${d.milling||"—"}`,
 "",
 `*Esteiras:* ${d.belts||"—"}`,
 "",
 "*Limpeza do Setor:*",
 clean,
 "",
 "*Analise VHP:*",
 `Cor: ${d.color||"—"}`,
 `Cinzas: ${d.ashes||"—"}`,
 `Umidade: ${d.humidity||"—"}`,
 "",
 "*🔺Ocorrências*",
 "",
 events||"—"
 ];
 if(d.handover!=="none")lines.push("",`Passando para o Turno *${next}*`,"Bom trabalho a todos🙏🏻");
 return lines.join("\n");
}
function generate(){calcStock();currentReport=collectReport();$("preview").textContent=currentReport;$("status").textContent="Relatório gerado. Confira os valores antes de enviar.";localStorage.setItem(DRAFT_KEY,JSON.stringify(getData()))}
function getHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}}
function saveHistory(){if(!currentReport)generate();const arr=getHistory();arr.unshift({id:Date.now(),savedAt:new Date().toISOString(),turn:currentTurn,date:$("date").value,report:currentReport,data:getData()});localStorage.setItem(STORAGE_KEY,JSON.stringify(arr.slice(0,100)));renderHistory();$("status").textContent="Relatório salvo neste iPhone."}
function renderHistory(){const root=$("history"),arr=getHistory();root.innerHTML="";if(!arr.length){root.textContent="Nenhum relatório salvo ainda.";return}arr.forEach(item=>{const row=document.createElement("div");row.className="history-item";const info=document.createElement("div");const title=document.createElement("strong");title.textContent=`Turno ${item.turn} — ${dateBR(item.date)}`;const sub=document.createElement("div");sub.className="note";sub.textContent=new Date(item.savedAt).toLocaleString("pt-BR");info.append(title,sub);const load=document.createElement("button");load.textContent="Abrir";load.onclick=()=>{setData(item.data);currentReport=item.report;$("preview").textContent=currentReport;$("status").textContent="Relatório carregado do histórico."};const copy=document.createElement("button");copy.textContent="Copiar";copy.onclick=()=>copyText(item.report);const buttons=document.createElement("div");buttons.style.display="flex";buttons.style.gap="6px";buttons.append(load,copy);row.append(info,buttons);root.append(row)})}
async function copyText(text){try{await navigator.clipboard.writeText(text);$("status").textContent="Texto copiado. Agora é só colar no grupo do WhatsApp."}catch{const ta=document.createElement("textarea");ta.value=text;document.body.append(ta);ta.select();const ok=document.execCommand("copy");ta.remove();$("status").textContent=ok?"Texto copiado. Agora é só colar no WhatsApp.":"Não foi possível copiar automaticamente. Selecione e copie o texto da prévia."}}
document.querySelectorAll("[data-turn]").forEach(b=>b.addEventListener("click",()=>{currentTurn=b.dataset.turn;document.querySelectorAll("[data-turn]").forEach(x=>x.classList.toggle("active",x===b));localStorage.setItem(DRAFT_KEY,JSON.stringify(getData()))}));
FIELDS.forEach(id=>$(id).addEventListener("input",()=>{calcStock();localStorage.setItem(DRAFT_KEY,JSON.stringify(getData()))}));
document.querySelectorAll("[data-clean]").forEach(c=>c.addEventListener("change",()=>localStorage.setItem(DRAFT_KEY,JSON.stringify(getData()))));
$("generate").onclick=generate;$("copy").onclick=()=>{if(!currentReport)generate();copyText(currentReport)};$("save").onclick=saveHistory;
$("share").onclick=async()=>{if(!currentReport)generate();if(navigator.share){try{await navigator.share({title:"Relatório de Turno",text:currentReport})}catch(e){if(e.name!=="AbortError")$("status").textContent="Compartilhamento cancelado ou indisponível."}}else copyText(currentReport)};
$("export").onclick=()=>{const blob=new Blob([JSON.stringify({version:1,history:getHistory(),draft:getData()},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="backup-relatorios-turno.json";a.click();URL.revokeObjectURL(url);$("status").textContent="Backup exportado. Guarde o arquivo em local seguro."};
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.history))throw Error();localStorage.setItem(STORAGE_KEY,JSON.stringify([...d.history,...getHistory()].slice(0,100)));if(d.draft)setData(d.draft);renderHistory();$("status").textContent="Backup importado."}catch{$("status").textContent="Arquivo de backup inválido."}e.target.value=""};
$("clearHistory").onclick=()=>{if(confirm("Apagar todos os relatórios salvos neste aparelho? Esta ação não pode ser desfeita.")){localStorage.removeItem(STORAGE_KEY);renderHistory();$("status").textContent="Histórico apagado."}};
$("date").value=localDate();
try{const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");if(draft)setData(draft)}catch{}
calcStock();renderHistory();
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
