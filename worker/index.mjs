const steamApi = 'https://api.steampowered.com/';
const context = {language:'english', country_code:'US'};
const dataRequest = {include_assets:true};

async function steam(method, params) {
  const url = new URL(method + '/v1/', steamApi);
  url.searchParams.set('input_json', JSON.stringify(params));
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5500),
    cf: {cacheEverything:true, cacheTtlByStatus:{'200-299':300,'400-599':0}}
  });
  if (!response.ok || (response.headers.has('x-eresult') && response.headers.get('x-eresult') !== '1')) throw Error('Steam unavailable');
  const payload = await response.json();
  if (!payload.response) throw Error('Invalid Steam response');
  return payload.response.store_items || [];
}

function coverUrl(item) {
  const a = item.assets;
  const filename = a?.library_capsule_2x || a?.library_capsule || a?.main_capsule_2x || a?.header_2x || a?.main_capsule || a?.header || a?.small_capsule_2x || a?.small_capsule;
  if (!filename || !/^[\w./-]+$/.test(filename)) return null;
  return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + item.id + '/' + filename;
}

async function searchSteam(term) {
  const items = await steam('IStoreQueryService/SearchSuggestions', {
    query_name:'TierdeckGameSearch', search_term:term, max_results:16,
    context, data_request:dataRequest, use_name_match_scoring:true
  });
  const games = items.filter(i=>i.item_type===0 && i.type===0 && i.name && i.id>0)
    .map(i=>({id:i.id,name:i.name,cover:coverUrl(i)}));
  return Response.json(games,{headers:{'Cache-Control':'public, max-age=300'}});
}

const pageSize = 25;
const cacheHeaders = {'Cache-Control':'public, max-age=120'};

function gameIdFromTerm(term) {
  const link = /^(?:https?:\/\/)?store\.steampowered\.com\/app\/(\d{1,10})(?:[/?#].*)?$/i.exec(term);
  if (link) return Number(link[1]);
  return /^\d{1,10}$/.test(term) ? Number(term) : null;
}

function decodeTitle(title) {
  const entities = {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' '};
  return title.replace(/&(amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/gi, (original, code) => {
    if (!code.startsWith('#')) return entities[code.toLowerCase()] || original;
    const n = code[1] === 'x' ? parseInt(code.slice(2),16) : Number(code.slice(1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : original;
  }).trim();
}

async function storePage(term, offset, region) {
  const url = new URL('https://store.steampowered.com/search/results/');
  url.search = new URLSearchParams({
    term, start:String(offset), count:String(pageSize), infinite:'1', category1:'998',
    cc:region, l:/[а-яё]/i.test(term)?'russian':'english', ndl:'1'
  });
  const response = await fetch(url, {signal:AbortSignal.timeout(6500), cf:{cacheEverything:true,cacheTtlByStatus:{'200-299':120,'400-599':0}}});
  if (!response.ok) throw Error('Store unavailable');
  const data = await response.json();
  if (!data.success || typeof data.results_html !== 'string') throw Error('Invalid store page');
  const games = [];
  const rows = data.results_html.match(/<a\b[^>]*\bdata-ds-itemkey="[^"]+"[\s\S]*?<\/a>/gi) || [];
  for (const row of rows) {
    const item = /data-ds-itemkey="App_(\d+)"/i.exec(row);
    const title = /<span class="title">([\s\S]*?)<\/span>/i.exec(row);
    if (item && title) games.push({id:Number(item[1]),name:decodeTitle(title[1])});
  }
  return {games, next:rows.length && offset+pageSize<Number(data.total_count) ? offset+pageSize : null};
}

async function directGame(appid, region) {
  const [item] = await steam('IStoreBrowseService/GetItems',{
    ids:[{appid}],context:{...context,country_code:region},data_request:dataRequest
  });
  if (!item || item.type!==0 || !item.name || item.id!==appid) return null;
  return {id:item.id,name:item.name,cover:coverUrl(item)};
}

async function searchCatalog(request, url, term) {
  const offset = Number(url.searchParams.get('start') || 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset>2147483600) return Response.json({error:'offset'},{status:400});
  const region = /^[A-Z]{2}$/.test(request.cf?.country) ? request.cf.country : context.country_code;
  const appid = gameIdFromTerm(term);
  if (appid && !/^\d+$/.test(term)) {
    const game = await directGame(appid,region);
    return Response.json({games:game?[game]:[],next:null},{headers:cacheHeaders});
  }
  const [page, direct] = await Promise.allSettled([
    storePage(term, offset, region),
    appid && offset===0 ? directGame(appid,region) : null
  ]);
  if (page.status==='rejected') {
    if (direct.status==='fulfilled' && direct.value) return Response.json({games:[direct.value],next:null},{headers:cacheHeaders});
    throw page.reason;
  }
  if (direct.status==='fulfilled' && direct.value && !page.value.games.some(g=>g.id===appid)) page.value.games.unshift(direct.value);
  return Response.json(page.value,{headers:cacheHeaders});
}

async function gameCover(appid) {
  const [item] = await steam('IStoreBrowseService/GetItems', {ids:[{appid}], context, data_request:dataRequest});
  const url = item && coverUrl(item);
  if (!url) return new Response(null, {status:404});
  return new Response(null, {status:302, headers:{Location:url,'Cache-Control':'public, max-age=86400'}});
}

async function publicApi(request, url) {
  try {
    if (url.pathname === '/api/store-search') {
      const term = (url.searchParams.get('q') || '').trim();
      if (!term || term.length > 500) return Response.json({error:'term'},{status:400});
      return await searchCatalog(request, url, term);
    }
    if (url.pathname === '/api/search') {
      const term = (url.searchParams.get('q') || '').trim();
      if (term.length < 2 || term.length > 160) return Response.json([], {status:400});
      return await searchSteam(term);
    }
    const cover = /^\/api\/cover\/(\d{1,10})$/.exec(url.pathname);
    if (cover) return await gameCover(Number(cover[1]));
  } catch {
    return Response.json({error:'steam_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
  return new Response(null, {status:404});
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null,{status:405});
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const response = await publicApi(request, url);
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!Object.hasOwn(siteAssets,path)) return new Response('Not found',{status:404});
    const [type, compressed, data] = siteAssets[path];
    const headers = {'Content-Type':type,'Cache-Control':type.startsWith('image/')?'public, max-age=86400':'no-cache'};
    if (request.method === 'HEAD') return new Response(null,{headers});
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    const body = compressed ? new Response(bytes).body.pipeThrough(new DecompressionStream('gzip')) : bytes;
    return new Response(body,{headers});
  }
};
