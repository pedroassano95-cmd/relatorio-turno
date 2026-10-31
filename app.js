
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
// Todos os pontos digitados são separadores de milhares; vírgula é decimal.
function stockNumber(s,type){return num(s)}
// Formata durante a digitação, preservando a parte decimal e a posição do cursor.
function groupNumber(raw){
 const clean=String(raw).replace(/[^0-9,]/g,"");
 const comma=clean.indexOf(",");
 const integer=(comma===-1?clean:clean.slice(0,comma));
 const decimals=comma===-1?"":clean.slice(comma+1).replace(/,/g,"");
 const grouped=integer.replace(/\B(?=(\d{3})+(?!\d))/g,".");
 return grouped+(comma===-1?"":","+decimals);
}
function formatNumberInput(el){
 const before=el.value, caret=el.selectionStart??before.length;
 const beforeFormatted=groupNumber(before.slice(0,caret));
 const formatted=groupNumber(before);
 if(formatted===before)return;
 el.value=formatted;
 try{el.setSelectionRange(beforeFormatted.length,beforeFormatted.length)}catch{}
}
const NUMERIC_IDS=["cota","vehicles","tonnes","dayVehicles","dayTonnes","production","da01","da02","color","ashes","humidity","sVehicles","sTonnes","sQueue","sDayVehicles","sDayTonnes","sDa01","sDa02","sTrips"];
function normalizeSavedInputs(){
 NUMERIC_IDS.forEach(id=>{const el=$(id);if(el&&el.value)el.value=groupNumber(el.value)});
}
function fmt(n,digits){return n.toLocaleString("pt-BR",{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:true})}
function calc(){
 const full=num($("da01").value)+num($("da02").value);
 const simple=stockNumber($("sDa01").value,"simple")+stockNumber($("sDa02").value,"simple");
 $("stockTotal").value=Number.isFinite(full)?fmt(full,0):"";
 $("sStockTotal").value=Number.isFinite(simple)?fmt(simple,0):"";
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
const SHARED_PAIRS=[['vehicles','sVehicles'],['tonnes','sTonnes'],['dayVehicles','sDayVehicles'],['dayTonnes','sDayTonnes'],['biomass','sBiomass'],['da01','sDa01'],['da02','sDa02']];
let syncing=false;
function syncShared(type,changedId){
 if(syncing)return;
 const pair=SHARED_PAIRS.find(p=>p.includes(changedId));if(!pair)return;
 const source=type==='full'?pair[0]:pair[1],target=type==='full'?pair[1]:pair[0];
 let v=$(source).value;
 if(source==='sBiomass'&&target==='biomass'){
  const opts=Array.from($(target).options).map(o=>o.value);
  const match=opts.find(o=>o.toLowerCase()===v.trim().toLowerCase())||opts.find(o=>v.toLowerCase().includes(o.toLowerCase()));
  if(!match)return;v=match;
 }
 $(target).value=v;
 syncing=true;write(draftKey(type==='full'?'simple':'full'),data(type==='full'?'simple':'full'));syncing=false;
 calc();
}
function reconcileShared(){
 // Preserve preexisting values: fill empty shared fields only. New edits sync in both directions.
 for(const [f,s] of SHARED_PAIRS){
  if(!$(f).value&&$(s).value){if(f==='biomass'){const v=$(s).value.toLowerCase();const match=Array.from($(f).options).find(o=>v.includes(o.value.toLowerCase()));if(match)$(f).value=match.value}else $(f).value=$(s).value}
  else if(!$(s).value&&$(f).value)$(s).value=$(f).value;
 }
 calc();
}
function persist(type,changedId){if(changedId)syncShared(type,changedId);write(draftKey(type),data(type));previewStale=true}
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
  load.onclick=()=>{fill(active,item.data);normalizeSavedInputs();persist(active);reportText=item.report;$("preview").textContent=item.report;previewStale=false;$("status").textContent="Histórico carregado. Confira a data e os valores antes de enviar.";window.scrollTo(0,0)};
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
normalizeSavedInputs();
reconcileShared();
refreshDate();
document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>open(b.dataset.open));
$("back").onclick=()=>{$("workspace").hidden=true;$("home").hidden=false;active=null;window.scrollTo(0,0)};
document.querySelectorAll("[data-turn]").forEach(b=>b.onclick=()=>{turn.full=b.dataset.turn;updateTurnButtons("full");persist("full")});
document.querySelectorAll("[data-simple-turn]").forEach(b=>b.onclick=()=>{turn.simple=b.dataset.simpleTurn;updateTurnButtons("simple");persist("simple")});
FULL.forEach(id=>$(id).addEventListener("input",()=>{if(NUMERIC_IDS.includes(id))formatNumberInput($(id));calc();persist("full",id)}));
SIMPLE.forEach(id=>$(id).addEventListener("input",()=>{if(NUMERIC_IDS.includes(id))formatNumberInput($(id));calc();persist("simple",id)}));
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
    if(p.drafts?.[type]){write(draftKey(type),p.drafts[type]);fill(type,p.drafts[type]);normalizeSavedInputs()}
   }
  }else if(Array.isArray(p.history)){
   write(historyKey("full"),[...p.history,...history("full")].slice(0,100));
   if(p.draft){write(draftKey("full"),p.draft);fill("full",p.draft);normalizeSavedInputs()}
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

// SpeechRecognition is optional and depends on browser support and network availability.
const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognizer=null,voiceCandidates=[];
const voiceStatus=$('voiceStatus'),voiceReview=$('voiceReview'),voiceTranscript=$('voiceTranscript');
function setVoiceStatus(t){voiceStatus.textContent=t}
function endVoice(){ $('voiceStart').hidden=false;$('voiceStop').hidden=true;recognizer=null }
$('voiceStart').onclick=()=>{
 if(!SpeechAPI){setVoiceStatus('O reconhecimento de voz não está disponível neste navegador. Continue digitando ou use o microfone do teclado do iPhone.');return}
 try{
  recognizer=new SpeechAPI();recognizer.lang='pt-BR';recognizer.interimResults=false;recognizer.continuous=false;
  recognizer.onresult=e=>{const t=Array.from(e.results).map(r=>r[0].transcript).join(' ');voiceTranscript.value=t;voiceReview.hidden=false;analyzeVoice();setVoiceStatus('Confira o texto e os valores antes de confirmar.')};
  recognizer.onerror=e=>{setVoiceStatus('Não foi possível reconhecer a fala ('+e.error+'). Você pode continuar digitando normalmente.');endVoice()};
  recognizer.onend=endVoice;recognizer.start();$('voiceStart').hidden=true;$('voiceStop').hidden=false;setVoiceStatus('Ouvindo... Fale um campo e seu valor de cada vez.')
 }catch{endVoice();setVoiceStatus('Microfone indisponível. Use o preenchimento manual.')}
};
$('voiceStop').onclick=()=>{if(recognizer)recognizer.stop();endVoice()};
function voiceNumber(raw){
 let t=raw.toLowerCase().trim().replace(/\b(v[eé]iculos?|toneladas?|viagens?|t)\b/g,'').trim();
 // Only accept digits, spelled-out simple numbers, and explicit comma decimals.
 const words={zero:0,um:1,uma:1,dois:2,duas:2,tres:3,'três':3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,quatorze:14,quinze:15,dezesseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100,cento:100,duzentos:200,trezentos:300,quatrocentos:400,quinhentos:500,seiscentos:600,setecentos:700,oitocentos:800,novecentos:900};
 t=t.replace(/\b(v[ií]rgula)\b/g,',').replace(/\s+e\s+/g,' ');
 if(/^[\d.,\s]+$/.test(t))return groupNumber(t.replace(/\s/g,''));
 function parseWords(part){let total=0,partSum=0;for(const w of part.split(/\s+/).filter(Boolean)){if(w==='mil'){total+=(partSum||1)*1000;partSum=0}else if(w==='milh[aã]o'||w==='milhões'){total+=(partSum||1)*1000000;partSum=0}else if(words[w]!==undefined)partSum+=words[w];else return null}return total+partSum}
 const parts=t.split(',');if(parts.length>2)return null;
 const integer=parseWords(parts[0]);if(integer===null)return null;
 if(parts.length===1)return groupNumber(String(integer));
 const decimal=parts[1].trim();let digits;
 if(/^\d+$/.test(decimal))digits=decimal;
 else{const d=parseWords(decimal);if(d===null)return null;digits=String(d)}
 return groupNumber(String(integer)+','+digits);
}
const VOICE_FIELDS=[
 {re:/\bestoque\s*d\s*a\s*0?1\b/i,ids:['da01','sDa01'],name:'Estoque DA01'},
 {re:/\bestoque\s*d\s*a\s*0?2\b/i,ids:['da02','sDa02'],name:'Estoque DA02'},
 {re:/\b(?:total\s+de\s+)?ve[ií]culos?\s+(?:do|no)\s+dia\b|\btotal\s+do\s+dia\s+ve[ií]culos?\b/i,ids:['dayVehicles','sDayVehicles'],name:'Veículos do dia'},
 {re:/\b(?:total\s+de\s+)?toneladas?\s+(?:do|no)\s+dia\b|\btotal\s+do\s+dia\s+toneladas?\b/i,ids:['dayTonnes','sDayTonnes'],name:'Toneladas do dia'},
 {re:/\b(?:carregamento\s+de\s+a[cç][uú]car|ve[ií]culos?\s+(?:do|no)\s+turno)\b/i,ids:['vehicles','sVehicles'],name:'Veículos no turno'},
 {re:/\b(?:expedido\s+(?:no|do)\s+turno|toneladas?\s+(?:no|do)\s+turno)\b/i,ids:['tonnes','sTonnes'],name:'Toneladas no turno'},
 {re:/\b(?:carregamento\s+de\s+)?biomassa\b/i,ids:['biomass','sBiomass'],name:'Biomassa',text:true},
 {re:/\b(?:ve[ií]culos?\s+na\s+)?fila\s+monitorada\b/i,ids:['sQueue'],name:'Fila monitorada'},
 {re:/\b(?:n[uú]mero\s+de\s+)?viagens?\b/i,ids:['sTrips'],name:'Viagens'},
 {re:/\bprodu[cç][aã]o\s+(?:do\s+)?turno\b/i,ids:['production'],name:'Produção do turno'},
 {re:/\bcota\s+programada\b/i,ids:['cota'],name:'Cota programada'}
];
function analyzeVoice(){
 const raw=voiceTranscript.value;voiceCandidates=[];
 const found=[];
 for(const f of VOICE_FIELDS){const m=f.re.exec(raw);if(m)found.push({...f,start:m.index,end:m.index+m[0].length})}
 found.sort((a,b)=>a.start-b.start);
 const root=$('voiceSuggestions');root.replaceChildren();
 for(let i=0;i<found.length;i++){
  const f=found[i];let chunk=raw.slice(f.end,found[i+1]?.start??raw.length).replace(/^[\s:;,.-]+|[\s:;,.-]+$/g,'');
  let v=null;
  if(f.text){const t=chunk.toLowerCase();v=t.includes('suspens')?'Suspenso':t.includes('andamento')?'Em andamento':t.includes('conclu')?'Concluído':t.includes('não realizado')?'Não realizado':null}
  else v=voiceNumber(chunk);
  if(v===null)continue;
  const id=f.ids.find(id=>active==='full'?!id.startsWith('s'):(id.startsWith('s')));
  if(!id)continue;
  voiceCandidates.push({id,value:v,name:f.name});
  const line=document.createElement('div');line.className='note';line.textContent=f.name+': '+v;root.append(line)
 }
 if(!voiceCandidates.length)root.textContent='Não foi possível identificar campos com segurança. Corrija o texto ou preencha digitando.';
 $('voiceApply').hidden=!voiceCandidates.length;
}
$('voiceAnalyze').onclick=analyzeVoice;
$('voiceApply').onclick=()=>{
 if(!voiceCandidates.length)return;
 if(!confirm('Aplicar os '+voiceCandidates.length+' valores identificados? Confira os números e a escala dos estoques.'))return;
 for(const c of voiceCandidates){$(c.id).value=c.value;if(NUMERIC_IDS.includes(c.id))formatNumberInput($(c.id));persist(active,c.id)}
 calc();voiceReview.hidden=true;setVoiceStatus('Campos preenchidos. Confira os valores antes de gerar o relatório.');$('status').textContent='Preenchimento por voz aplicado e campos em comum atualizados.';
};

document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshDate()});
window.addEventListener("pageshow",refreshDate);
if("serviceWorker" in navigator&&location.protocol!=="file:"){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
