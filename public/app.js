const paths={
 layout:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M15 9v12"/>',folder:'<path d="M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',cloud:'<path d="M7 18H6a4.5 4.5 0 0 1-.5-9A6.5 6.5 0 0 1 18 8a5 5 0 0 1 1 9"/><path d="m9 15 3 3 5-6"/>',edit:'<path d="m14 5 5 5M4 20l5-1L20 8a2 2 0 0 0-4-4L5 15z"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 11 6-4m-6 7 6 4"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',layers:'<path d="m3 7 9-5 9 5-9 5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',library:'<rect x="3" y="4" width="4" height="16" rx="1"/><path d="M10 4h3v16h-3zM15 6l4-1 3 14-4 1z"/>',frame:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',search:'<circle cx="10.5" cy="10.5" r="6.7"/><path d="m16 16 5 5"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',grip:'<path d="M9 5h.1M15 5h.1M9 12h.1M15 12h.1M9 19h.1M15 19h.1" stroke-width="3.2"/>',close:'<path d="m6 6 12 12m0-12L6 18"/>',plus:'<path d="M12 5v14M5 12h14"/>',squareplus:'<rect x="3" y="3" width="18" height="18" rx="4" stroke-dasharray="3 3"/><path d="M12 8v8m-4-4h8"/>',game:'<path d="M7 7h10c3 0 5 10 3 11s-4-3-6-3h-4c-2 0-4 4-6 3S4 7 7 7zM8 9v5m-2-2h4m5-1h.1m3 2h.1"/>',check:'<path d="m4 12 5 5L20 6"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',link:'<path d="m9 15 6-6M13 6l2-2a4 4 0 0 1 6 6l-4 4m-6 4-2 2a4 4 0 0 1-6-6l4-4"/>'};
const icon=(name)=>'<svg aria-hidden="true" class="ico" viewBox="0 0 24 24">'+paths[name]+'</svg>';
document.querySelectorAll('[data-i]').forEach(el=>el.outerHTML=icon(el.dataset.i));
const $=s=>document.querySelector(s), modal=$('#modal'),body=$('#dialogbody'),search=$('#search'),results=$('#results');
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
function btn(label,cls,fn,symbol){const b=el('button',cls);b.type='button';if(symbol)b.innerHTML=icon(symbol);b.append(document.createTextNode(label));b.onclick=fn;return b}
const colors=['#b3a1df','#a0aee6','#94bfe1','#8ecfcf','#95ceb1','#b8d48e','#ddd487','#e7bd81','#e9a081','#e88792'];
const labels=['Провал','Очень плохо','Плохо','Слабо','Средне','Неплохо','Хорошо','Отлично','Великолепно','Шедевр'];
const prefix='tierdeck.board.',activeKey='tierdeck.active',starter=[1245620,1091500,292030,367520,1145360,620,1174180,632470,1086940];
const featured=await fetch('assets/games/catalog.json').then(r=>r.json());const local=new Map(featured.map(g=>[g.id,g]));
const fresh=(name='Мой тир-лист игр',seed=false)=>({id:crypto.randomUUID(),name,games:seed?starter.map(id=>({id,name:local.get(id).name,rank:0})):[],updated:Date.now()});
function storeOf(id) {
  if (typeof id === 'string' && /^ps:[A-Z0-9_-]{1,64}$/.test(id)) return 'PlayStation';
  if (typeof id === 'string' && /^xbox:[A-Z0-9]{12}$/.test(id)) return 'Xbox';
  return '';
}
function consoleImage(game) {
  if (typeof game.cover !== 'string' || game.cover.length > 1500) return null;
  try {
    const url = new URL(game.cover);
    const origin = storeOf(game.id) === 'PlayStation' ? 'https://image.api.playstation.com' : 'https://store-images.s-microsoft.com';
    if (url.origin === origin && !url.username && !url.password) return url.href;
  } catch {}
  return null;
}
function boardEntry(game, rank) {
  const entry = {id:game.id, name:game.name.slice(0,250), rank};
  if (storeOf(game.id) && !local.has(game.id)) entry.cover = consoleImage(game);
  return entry;
}
function parseBoard(data){if(!data||typeof data.name!=='string'||!Array.isArray(data.games))throw Error();const ids=new Set();const board=fresh(data.name.trim().slice(0,90)||'Мой тир-лист игр');for(const g of data.games){if(!(storeOf(g.id)||(Number.isSafeInteger(g.id)&&(g.id>0||local.has(g.id))))||ids.has(g.id)||typeof g.name!=='string'||!Number.isInteger(g.rank)||g.rank<0||g.rank>10)continue;ids.add(g.id);board.games.push(boardEntry(g,g.rank))}if(typeof data.id==='string'&&/^[a-f0-9-]{36}$/.test(data.id))board.id=data.id;board.updated=Number(data.updated)||Date.now();return board}
const apiOrigin = location.hostname.endsWith('.github.io')
  ? 'https://tierdeck-games.aromaticeagle16.chatgpt.site'
  : location.origin;
let board,loadedShared=false,brokenShare=false;
let shareLoadError='';
if (location.hash.startsWith('#s=')) {
  const code=location.hash.slice(3);
  try {
    if (!/^[A-Za-z0-9_-]{16}$/.test(code)) throw new Error('missing');
    const response=await fetch(apiOrigin+'/api/shares/'+code,{signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(response.status===404?'missing':'offline');
    board=parseBoard(await response.json());
    loadedShared=true;
    history.replaceState(null,'',location.pathname+location.search);
  } catch(error) {
    shareLoadError=error.message==='missing'?'Тир-лист по этой ссылке не найден.':'Не удалось загрузить тир-лист. Обновите страницу, чтобы повторить.';
  }
}
window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#s=') || location.hash.startsWith('#list=')) location.reload();
});
function from64(str){return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(str.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))))}
if(location.hash.startsWith('#list=')){try{board=parseBoard(from64(location.hash.slice(6)));loadedShared=true}catch{brokenShare=true}history.replaceState(null,'',location.pathname+location.search)}
if(!board){try{board=parseBoard(JSON.parse(localStorage.getItem(prefix+localStorage.getItem(activeKey))))}catch{board=fresh(undefined,true)}}
let toastTimer;
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('on'),2800)}
function save(){board.updated=Date.now();try{localStorage.setItem(prefix+board.id,JSON.stringify(board));localStorage.setItem(activeKey,board.id);$('#status span').textContent='Сохранено'}catch{$('#status span').textContent='Не сохранено';toast('Хранилище браузера недоступно. Сохраните ссылку на список.')}render()}
function plural(n,one,few,many){return n+' '+(n%10===1&&n%100!==11?one:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?few:many)}
function gamesCount(n){return plural(n,'игра','игры','игр')}
const remoteCovers = new Map();
function urls(id, game) {
  const localGame = local.get(id);
  const file = localGame && 'assets/games/' + localGame.file;
  const store = storeOf(id);
  if (store) {
    const src = consoleImage(game);
    const url = src && (store === 'PlayStation' ? apiOrigin + '/api/ps-cover?src=' + encodeURIComponent(src) : src);
    return [file, url].filter(Boolean);
  }
  if (id < 1) return file ? [file] : [];
  const base = 'https://cdn.akamai.steamstatic.com/steam/apps/' + id + '/';
  return [...new Set([remoteCovers.get(id), localGame?.hd, apiOrigin + '/api/cover/' + id, file,
    base + 'library_600x900_2x.jpg', base + 'library_600x900.jpg', base + 'header.jpg',
    base + 'capsule_231x87.jpg'].filter(Boolean))];
}
function cover(g,cls=''){const im=el('img',cls);im.alt=g.name;im.draggable=false;im.crossOrigin='anonymous';const options=urls(g.id,g);let i=0;im.onerror=()=>{if(++i<options.length)im.src=options[i];else{const alt=el('span','fallback',g.name);im.replaceWith(alt)}};if(!options.length)return el('span','fallback',g.name);im.src=options[0];return im}
function show(title){$('#dialogtitle').textContent=title;body.replaceChildren();if(!modal.open)modal.showModal()}
$('#close').onclick=()=>modal.close();modal.onclick=e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}};
function move(id,rank,before){const idx=board.games.findIndex(g=>g.id===id);if(idx<0||id===before)return;const [g]=board.games.splice(idx,1);g.rank=rank;const dest=board.games.findIndex(g=>g.id===before);board.games.splice(dest<0?board.games.length:dest,0,g);save()}
function gameMenu(g){show('Оценка игры');const title=el('div','movetitle');title.append(cover(g,'inlineposter'));const info=el('div');info.append(el('strong','',g.name),el('p','muted','Выберите оценку от 10 до 1.'));title.append(info);const grid=el('div','scoreselect');for(let r=10;r>=1;r--){const b=btn(r,'',()=>{move(g.id,r);modal.close()});b.style.background=colors[r-1];b.setAttribute('aria-pressed',r===g.rank);grid.append(b)}const actions=el('div','modalbtns');if(g.rank)actions.append(btn('Вернуть на полку','softbtn',()=>{move(g.id,0);modal.close()},'library'));actions.append(btn('Убрать из списка','danger',()=>{board.games=board.games.filter(x=>x.id!==g.id);save();modal.close();toast('Игра убрана из списка')},'trash'));body.append(title,grid,actions)}
function card(g,small){const b=btn('',small?'rankcard':'game',()=>gameMenu(g));b.setAttribute('aria-label',g.name+' — выбрать оценку');b.title=g.name;b.draggable=true;b.dataset.id=g.id;if(small)b.append(cover(g));else{const p=el('span','poster');p.append(cover(g));b.append(p,el('span','game-name',g.name))}return b}
function render(){
 $('#clear-board').disabled = board.games.length === 0;
 document.title=board.name+' · Tierdeck';$('#boardname').textContent=board.name;const pool=board.games.filter(g=>!g.rank);$('#rankcount').textContent='Оценено '+(board.games.length-pool.length)+' / '+board.games.length;$('#poolcount').textContent=gamesCount(pool.length);$('#pool').replaceChildren(...pool.map(g=>card(g,false)));if(!pool.length)$('#pool').append(el('div','pool-empty','Найдите игру в поиске или верните обложку со шкалы.'));$('#ranks').replaceChildren();
 for(let r=10;r>0;r--){const row=el('div','rank');row.dataset.zone=r;row.setAttribute('aria-label','Оценка '+r);row.style.setProperty('--tone',colors[r-1]);const name=el('div','ranklabel',r);const area=el('div','rowbody'),games=board.games.filter(g=>g.rank===r);area.append(el('span','rankword',labels[r-1]));
 if (games.length) {
   row.classList.add('occupied');
   const covers = el('div', 'rankgames');
   covers.append(...games.map(game => card(game, true)));
   area.append(covers);
 }
 const hint=el('span','rankhint');hint.innerHTML=icon(games.length?'grip':'squareplus');if(r===10&&!games.length)hint.append(el('span','','Перетащите игру'));area.append(hint);row.append(name,area);$('#ranks').append(row)}}
// Keep rated covers proportional to the current shelf grid, including an empty shelf.
const shelfGrid = $('#pool');
function sizeRatedCovers() {
  const firstTrack = parseFloat(getComputedStyle(shelfGrid).gridTemplateColumns);
  if (firstTrack > 0) $('#ranks').style.setProperty('--rank-cover-width', Math.round(firstTrack * 0.83) + 'px');
}
new ResizeObserver(sizeRatedCovers).observe(shelfGrid);
sizeRatedCovers();
function cardId(card) {
  const id = card?.dataset.id;
  return storeOf(id) ? id : Number(id);
}
let dragId = null;
let preview = null;
const insertLine = el('span', 'insert-line');
insertLine.setAttribute('aria-hidden', 'true');

function insertionSlot(zone, x, y) {
  const cards = Array.from(zone.querySelectorAll('[data-id]'));
  if (!cards.length) {
    const area = zone.querySelector('.rowbody, .pool-empty').getBoundingClientRect();
    return {before:null, x:area.left + 6, y:area.top + 6, height:area.height - 12};
  }

  // Pick the visual row first. At a wrap, even a large horizontal gap
  // belongs to this row, not to the last card in the entire rank.
  let nearest = null;
  let bestY = Infinity;
  let bestX = Infinity;
  for (const [index, card] of cards.entries()) {
    const rect = card.getBoundingClientRect();
    const dy = Math.abs(y - (rect.top + rect.height / 2));
    const dx = Math.abs(x - (rect.left + rect.width / 2));
    if (dy < bestY || (dy === bestY && dx < bestX)) {
      nearest = {index, rect};
      bestY = dy;
      bestX = dx;
    }
  }

  const {index, rect} = nearest;
  const after = x >= rect.left + rect.width / 2;
  const next = cards[index + Number(after)];
  return {
    before:next ? cardId(next) : null,
    x:after ? rect.right + 4 : rect.left - 4,
    y:rect.top,
    height:rect.height
  };
}

function hideInsertion() {
  preview?.zone.classList.remove('dragover');
  insertLine.remove();
  preview = null;
}
function clearDrag() {
  hideInsertion();
  document.querySelector('.dragging')?.classList.remove('dragging');
  dragId = null;
}

document.addEventListener('dragstart', e => {
  const card = e.target.closest('[data-id]');
  if (!card) return;
  dragId = cardId(card);
  e.dataTransfer.setData('text/plain', card.dataset.id);
  e.dataTransfer.effectAllowed = 'move';
  card.classList.add('dragging');
});

document.addEventListener('dragover', e => {
  if (dragId === null) return;
  const zone = e.target.closest('[data-zone]');
  if (!zone) { hideInsertion(); return; }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const slot = insertionSlot(zone, e.clientX, e.clientY);
  if (zone !== preview?.zone) {
    hideInsertion();
    zone.classList.add('dragover');
    zone.append(insertLine);
  }
  const bounds = zone.getBoundingClientRect();
  insertLine.style.left = (slot.x - bounds.left - zone.clientLeft) + 'px';
  insertLine.style.top = (slot.y - bounds.top - zone.clientTop) + 'px';
  insertLine.style.height = slot.height + 'px';
  preview = {zone, before:slot.before};
});

document.addEventListener('dragleave', e => {
  if (preview?.zone === e.target.closest('[data-zone]') && !preview.zone.contains(e.relatedTarget)) hideInsertion();
});
document.addEventListener('dragend', clearDrag);
document.addEventListener('drop', e => {
  const zone = e.target.closest('[data-zone]');
  if (dragId === null || !zone) return;
  e.preventDefault();
  const slot = preview?.zone === zone ? preview : insertionSlot(zone, e.clientX, e.clientY);
  const id = dragId;
  clearDrag();
  move(id, Number(zone.dataset.zone), slot.before);
});
const normalize = s => s.normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f’'™®]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases = {
  1245620:['элден ринг'],1091500:['киберпанк 2077'],292030:['ведьмак 3','ведьмак 3 дикая охота','witcher 3'],
  367520:['холлоу найт'],1145360:['хадес','адес'],620:['портал 2'],1174180:['рдр 2','rdr2','ред дед редемпшн 2'],
  632470:['диско элизиум'],1086940:['балдурс гейт 3','bg3'],
  2638890:['анимуша','онимуша','онимуся','анимуша путь меча','онимуша путь меча'],
  4115450:['фантом блейд зиро','фантом блэйд зиро','фантом блейд зеро','phantom blade 0'],
  'ps:UP9000-PPSA03671_00-MARVELSWOLVERINE':['marvel wolverine','wolverine','росомаха','марвел росомаха'],
  '-6':['гта 6','гта6','гта vi','gta6','gta 6','gta vi','grand theft auto 6','grand theft auto vi']
};
for (const id of Object.keys(aliases)) aliases[id] = aliases[id].map(normalize);
let index = featured.map(g=>({...g,key:normalize(g.name),featured:true}));
const liveCache = new Map();
let indexTask, full=false, searchError=false, selection=0, hits=[], picked=false;
let current=null, timer, openSearch=false;
function prepare(){
  if(indexTask)return indexTask;
  searchError=false;
  indexTask=fetch('assets/steam.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(rows=>{
    index=index.concat(rows.filter(([id])=>!local.has(id)).map(([id,name])=>({id,name,key:normalize(name)})));
    full=true;
  }).catch(()=>{searchError=true;indexTask=null}).finally(()=>{if(openSearch)suggest()});
  return indexTask;
}
function hideResults(){
  openSearch=false;clearTimeout(timer);current?.controller.abort();current=null;
  results.hidden=true;search.setAttribute('aria-expanded','false');search.removeAttribute('aria-activedescendant');
}
function addGame(g){
  if(!g)return;
  const exists=board.games.some(x=>x.id===g.id);
  if(!exists){board.games.push(boardEntry(g,0));save()}
  search.value='';hideResults();toast(exists?'Эта игра уже в тир-листе':g.name+' — добавлено на полку');search.focus();
}
function localWeight(g,q) {
  if(g.key===q || aliases[g.id]?.includes(q))return 0;
  if(g.key.startsWith(q+' ')||aliases[g.id]?.some(a=>a.startsWith(q)))return 2;
  // A complete Roman numeral is significant: "VI" must not match "Vice".
  if(/(?:^| )(?:ii|iii|iv|vi|vii|viii|ix)$/.test(q) && !g.key.split(' ').includes(q.split(' ').at(-1)))return Infinity;
  if(g.key.startsWith(q))return 3;
  return g.key.includes(q)?4:Infinity;
}
function suggest(){
  if(!openSearch||!current)return;
  const {q,games,state}=current;
  const previous=picked?hits[selection]?.id:null;
  const ranked=[];
  for(const g of index){const score=localWeight(g,q);if(Number.isFinite(score))ranked.push({g,score})}
  const positions = new Map();
  for (const g of [...games, ...current.consoleGames]) {
    const store = storeOf(g.id) || 'Steam';
    const position = positions.get(store) || 0;
    positions.set(store, position + 1);
    const match = localWeight(g,q);
    const score = Number.isFinite(match) ? match : 8;
    ranked.push({g, score:score + position / 1000});
  }
  ranked.sort((a,b)=>a.score-b.score||Number(!!b.g.featured)-Number(!!a.g.featured)||a.g.name.length-b.g.name.length||String(a.g.id).localeCompare(String(b.g.id)));
  const seen=new Set();hits=[];let hiddenMatches=false;
  for(const {g} of ranked){if(seen.has(g.id))continue;if(hits.length===current.limit){hiddenMatches=true;break}seen.add(g.id);hits.push(g)}
  selection=Math.max(0,hits.findIndex(g=>g.id===previous));results.replaceChildren();
  for(const [i,g] of hits.entries()){
    const b=btn('','result',()=>addGame(g),'game');b.id='result-'+i;b.setAttribute('role','option');b.tabIndex=-1;
    b.append(el('span','',g.name));
    const storeLabel = storeOf(g.id) || (g.id > 0 ? 'Steam' : '');
    if (storeLabel) b.append(el('small','store-label',storeLabel));
    b.insertAdjacentHTML('beforeend',icon(board.games.some(x=>x.id===g.id)?'check':'plus'));
    b.onmousedown=e=>e.preventDefault();results.append(b);
  }
  if(state!=='loading' && (full || searchError) && (current.next!==null || hiddenMatches)){
    const job=current;
    const more=btn(job.loadingMore?'Загружаем…':'Показать ещё','result more-results',async()=>{
      if(current!==job || job.loadingMore)return;
      const top=results.scrollTop;
      if(job.next!==null){
        job.loadingMore=true;
        more.disabled=true;more.textContent='Загружаем…';
        await loadPage(job,job.next);
        job.loadingMore=false;
      }
      if(current!==job)return;
      job.limit+=25;
      suggest();results.scrollTop=top;
    });
    more.disabled=job.loadingMore;more.onmousedown=e=>e.preventDefault();
    results.append(more);
  }
  if (current.unavailable.length) results.append(el('div','searchmsg','Временно недоступен поиск: '+current.unavailable.join(', ')+'.'));
  if(!hits.length||state==='error'){
    const msg=state==='error'?'Steam пока не отвечает. Показаны доступные результаты.':
      state==='loading'||current.pendingStores?'Ищем в магазинах…':!full&&!searchError?'Загружаем каталог…':
      searchError?'Не удалось загрузить сохранённый каталог. Повторите поиск.':'Совпадений не найдено. Попробуйте другое название.';
    results.append(el('div','searchmsg',msg));
  }
  results.hidden=false;search.setAttribute('aria-expanded','true');highlight();
}
function highlight(){
  [...results.querySelectorAll('.result')].forEach((n,i)=>{n.classList.toggle('sel',i===selection);n.setAttribute('aria-selected',i===selection)});
  if(hits.length)search.setAttribute('aria-activedescendant','result-'+selection);else search.removeAttribute('aria-activedescendant');
}
async function loadPage(job, offset) {
  try {
    const params=new URLSearchParams({q:job.term,start:String(offset)});
    const response=await fetch(apiOrigin + '/api/store-search?'+params,{signal:job.controller.signal});
    if(!response.ok)throw Error();
    const page=await response.json();
    if(current!==job)return;
    const rows=page.games.map(g=>({...g,key:normalize(g.name)}));
    for(const g of rows){if(g.cover)remoteCovers.set(g.id,g.cover)}
    job.games.push(...rows);job.next=page.next;job.state='ready';
    if(offset===0){
      liveCache.set(job.cacheKey,{at:Date.now(),games:[...rows],next:page.next});
      if(liveCache.size>100)liveCache.delete(liveCache.keys().next().value);
    }
  }catch{if(current===job&&!job.controller.signal.aborted)job.state='error'}
}
const consoleCache = new Map();
async function loadConsole(job, store) {
  const key = store + ':' + job.cacheKey;
  try {
    let cached = consoleCache.get(key);
    if (!cached || Date.now() - cached.at >= 300000) {
      const params = new URLSearchParams({store, q:job.term});
      const response = await fetch(apiOrigin + '/api/console-search?' + params, {signal:job.controller.signal});
      if (!response.ok) throw Error();
      const games = await response.json();
      cached = {at:Date.now(), games:games.map(g => ({...g,key:normalize(g.name)}))};
      consoleCache.set(key, cached);
      if (consoleCache.size > 200) consoleCache.delete(consoleCache.keys().next().value);
    }
    job.consoleGames.push(...cached.games);
  } catch {
    if (!job.controller.signal.aborted) job.unavailable.push(store === 'ps' ? 'PlayStation' : 'Xbox');
  } finally {
    job.pendingStores--;
    if (current === job) suggest();
  }
}
function loadLive(job) {
  if (!job.task) {
    const steam = job.state === 'loading' ? loadPage(job,0).finally(() => { if (current === job) suggest(); }) : null;
    const stores = job.pendingStores ? [loadConsole(job,'ps'),loadConsole(job,'xbox')] : [];
    job.task = Promise.all([steam,...stores]);
  }
  return job.task;
}
function startSearch(){
  clearTimeout(timer);current?.controller.abort();picked=false;
  const term=search.value.trim(),q=normalize(term)||term;
  if(!q){hideResults();return}
  const cacheKey=term.normalize('NFC').toLowerCase();
  const cached=liveCache.get(cacheKey);const fresh=cached&&Date.now()-cached.at<300000;
  openSearch=true;
  const lookUpConsoles = term.length >= 2 && term.length <= 160 && !/^\d+$|^(?:https?:\/\/)?store\.steampowered\.com\//i.test(term);
  const job=current={q,term,cacheKey,consoleGames:[],unavailable:[],pendingStores:lookUpConsoles?2:0,controller:new AbortController(),games:fresh?[...cached.games]:[],next:fresh?cached.next:null,limit:25,loadingMore:false,state:fresh?'ready':'loading'};
  prepare();suggest();
  if(job.state==='loading'||job.pendingStores)timer=setTimeout(()=>loadLive(job),260);
}
search.onfocus=()=>{prepare();startSearch()};search.oninput=startSearch;
$('#searchform').onsubmit=async e=>{
  e.preventDefault();
  const job=current;if(!job||!openSearch)return;
  if(!picked&&(!hits[selection]||localWeight(hits[selection],job.q)!==0)){
    clearTimeout(timer);await Promise.all([prepare(),loadLive(job)]);
  }
  if(current===job&&openSearch)addGame(hits[selection]);
};
search.onkeydown=e=>{
  if(e.key==='Escape')hideResults();
  if(['ArrowDown','ArrowUp'].includes(e.key)){
    e.preventDefault();if(!openSearch)startSearch();if(!hits.length)return;
    picked=true;selection=(selection+(e.key==='ArrowDown'?1:-1)+hits.length)%hits.length;
    highlight();results.children[selection]?.scrollIntoView({block:'nearest'});
  }
};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#searchform'))hideResults()});document.addEventListener('focusin',e=>{if(!e.target.closest('#searchform'))hideResults()});document.addEventListener('keydown',e=>{if(e.key==='/'&&!modal.open&&!e.ctrlKey&&!e.metaKey&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();search.focus()}});
function nameForm(create){show(create?'Новый тир-лист':'Название тир-листа');const f=el('form','dialogform'),label=el('label','','Название'),inp=el('input','field');label.htmlFor=inp.id='listname';inp.placeholder='Например, пройденные игры';inp.value=create?'':board.name;inp.maxLength=90;inp.required=true;const buttons=el('div','modalbtns'),submit=btn(create?'Создать':'Сохранить','primary');submit.type='submit';buttons.append(submit);f.append(label,inp,buttons);f.onsubmit=e=>{e.preventDefault();if(!inp.value.trim()){inp.focus();return}if(create)board=fresh(inp.value.trim());else board.name=inp.value.trim();save();modal.close()};body.append(f);inp.focus();inp.select()}
$('#rename').onclick=()=>nameForm(false);$('#editor').onclick=()=>{modal.close();window.scrollTo({top:0,behavior:'smooth'})};
function boards(){const all=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(prefix))try{all.push(parseBoard(JSON.parse(localStorage.getItem(k))))}catch{}}}catch{}return all.sort((a,b)=>b.updated-a.updated)}
function listDialog(){show('Мои тир-листы');body.append(el('p','muted','Списки автоматически сохраняются в этом браузере.'));for(const item of boards()){const row=el('div','listitem');const open=btn('','listopen',()=>{board=item;save();modal.close()});open.append(el('strong','',item.name),el('small','',gamesCount(item.games.length)+(board.id===item.id?' · открыт':'')));const del=btn('','iconbtn',()=>{show('Удалить тир-лист?');body.append(el('p','muted',item.name));const actions=el('div','modalbtns');actions.append(btn('Отмена','softbtn',listDialog),btn('Удалить','danger',()=>{localStorage.removeItem(prefix+item.id);if(board.id===item.id){board=boards()[0]||fresh();save()}listDialog()}));body.append(actions)},'trash');del.setAttribute('aria-label','Удалить '+item.name);row.append(open,del);body.append(row)}const actions=el('div','modalbtns');actions.append(btn('Новый тир-лист','primary',()=>nameForm(true),'plus'));body.append(actions)}
$('#lists').onclick=listDialog;
$('#clear-board').onclick = () => {
  show('Очистить тир-лист?');
  const message = el('p', 'muted', 'Все игры исчезнут со шкалы оценок и с полки в списке «' + board.name + '».');
  const actions = el('div', 'modalbtns');
  const cancel = btn('Отмена', 'softbtn', () => modal.close());
  const clear = btn('Очистить', 'danger', () => {
    board.games = [];
    search.value = '';
    hideResults();
    modal.close();
    save();
    search.focus();
  }, 'trash');
  actions.append(clear, cancel);
  body.append(message, actions);
  cancel.focus();
};
async function shareBoard() {
  show('Поделиться тир-листом');
  const status = el('p','muted','Создаём короткую ссылку…');
  body.append(status);
  try {
    const response = await fetch(apiOrigin+'/api/shares',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:board.name,games:board.games}), signal:AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error();
    const {code} = await response.json();
    if (!/^[A-Za-z0-9_-]{16}$/.test(code)) throw new Error();
    if (!status.isConnected || !modal.open) return;
    const link = location.origin+location.pathname+'#s='+code;
    status.textContent = 'По ссылке откроется копия текущего списка с вашими оценками.';
    const field = el('input','field');
    field.readOnly = true;
    field.value = link;
    field.setAttribute('aria-label','Ссылка на тир-лист');
    field.onclick = () => field.select();
    const actions = el('div','modalbtns');
    actions.append(btn('Скопировать ссылку','primary',async () => {
      try { await navigator.clipboard.writeText(link); }
      catch {
        field.focus();
        field.select();
        if (!document.execCommand('copy')) { toast('Скопируйте выделенную ссылку'); return; }
      }
      modal.close();
      toast('Ссылка скопирована');
    },'link'));
    body.append(field,actions);
  } catch {
    if (!status.isConnected || !modal.open) return;
    status.textContent = 'Не удалось создать ссылку. Попробуйте ещё раз.';
    body.append(btn('Повторить','softbtn',shareBoard));
  }
}
$('#share').onclick=shareBoard;

save();
if (document.activeElement === search && search.value.trim()) startSearch();
if(shareLoadError){show('Не удалось открыть ссылку');body.append(el('p','muted',shareLoadError));}
if(loadedShared)toast('Копия тир-листа сохранена в этом браузере');if(brokenShare)toast('Не удалось прочитать ссылку на тир-лист');
$('#png').onclick=async()=>{const b=$('#png'),original=b.innerHTML;b.disabled=true;b.textContent='Создаём PNG…';const snap=structuredClone(board);try{const {downloadBoard}=await import('./export.js?v=multistore1');const missing=await downloadBoard(snap,colors,labels,urls);toast(missing?'PNG готов. Для недоступных обложек указаны названия.':'PNG готов к скачиванию')}catch{toast('Не удалось создать PNG. Попробуйте ещё раз.')}finally{b.disabled=false;b.innerHTML=original}};
