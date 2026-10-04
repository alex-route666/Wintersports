/* Ski game – à coller dans la console du navigateur, sur une page de https://firstskisport.com (générée : ne pas modifier) */
(async () => {
  const MAP = {"marco-odermatt":"3040","lucas-pinheiro-braathen":"4748","loic-meillard":"2565","atle-lie-mcgrath":"4711","franjo-von-allmen":"5674","henrik-kristoffersen":"2391","timon-haugan":"3049","vincent-kriechmayr":"1912","giovanni-franzoni":"5497","dominik-paris":"91","marco-schwarz":"2561","raphael-haaser":"4221","clement-noel":"2758","alexis-monney":"5493","stefan-rogentin":"3505","stefan-brennsteiner":"2436","nils-allegre":"2395","ryan-cochran-siegle":"1918","paco-rassat":"5371","alex-vinatzer":"4040","eduard-hallberg":"6820","mattia-casse":"158","tanguy-nef":"3065","daniel-hemetsberger":"4605","stefan-babinsky":"3039","florian-schieder":"3043","adrian-smiseth-sejersted":"2386","eirik-hystad-solberg":"6716","fabio-gstrein":"3066","linus-strasser":"1932","river-radamus":"2986","michael-matt":"2481","armand-marchant":"2603","manuel-feller":"2396","filip-zubcic":"249","sam-maes":"3002","miha-hrobat":"2633","cameron-alexander":"4306","leo-anguenot":"2997","fredrik-moeller":"5758","fabian-gratz":"4358","christof-innerhofer":"13","victor-muffat-jeandet":"2024","zan-kranjec":"1942","alban-elezi-cannaferina":"5693","joshua-sturm":"5399","luca-aerni":"2392","thomas-tumler":"2409","steven-amiez":"5409","jan-zabystran":"2719","stefan-eichberger":"5604","benjamin-jacques-alliod":"5631","maxence-muzaton":"1990","anton-grammel":"3004","alexis-pinturault":"232","justin-murisier":"67","daniel-yule":"2404","tommaso-sala":"2588","james-crawford":"2720","lukas-feurstein":"5336","niels-hintermann":"2768","fabian-ax-swartz":"6700","alessio-miggiano":"5726","simon-jocher":"4305","kyle-negomir":"4714","nils-alphand":"4310","guglielmo-bosca":"2413","laurie-taylor":"4143","oscar-andreas-sandvik":"6803","albert-popov":"2597","thibaut-favrot":"2493","matthias-iten":"4712","samuel-kolega":"3029","dominik-raschner":"2639","marco-kohler":"3045","patrick-feurstein":"5295","elian-lehto":"4054","dave-ryding":"2375","matthieu-bailet":"2742","jonas-stockinger":"3030","joan-verdu":"2551","alexander-schmid":"2410","aleksander-aamodt-kilde":"2393","hans-grahl-madsen":"6712","martin-cater":"1919","lars-roesti":"4300","bryce-bennett":"2387","blaise-giezendanner":"2476","luis-vogt":"5613","johannes-strolz":"2401","felix-monsen":"2567","brodie-seger":"2711","giovanni-borsotti":"114","benjamin-ritchie":"5296","andreas-ploier":"4998","erik-arvidsson":"2717","billy-major":"2607","flavio-vitale":"7093","auguste-aulnette":"5430","ramon-zenhaeusern":"2427","sam-alphand":"4183","sam-morse":"2636","ryder-sarchett":"6284","filippo-della-vite":"5526","loevan-parand":"5340","romed-baumann":"10","adrien-theaux":"19","luca-de-aliprandini":"1799","tobias-kastlunger":"5321","vincent-wieser":"5486","antoine-azzolin":"6717","wiley-maple":"1808","riley-seger":"4304","nejc-naralocnik":"3001","tommaso-saccardi":"5587","jeffrey-read":"2208","livio-hiltbrand":"7095","stefan-rieser":"5303","hugo-desgrippes":"5508","simon-rueland":"3725","henrik-von-appen":"2505","arnaud-boisset":"4710","kristoffer-jakobsen":"2765","joaquim-salarich-baucells":"2697","adrian-pertl":"4172","rasmus-bakkevig":"7233","charles-gamel-seigneur":"5612","erik-read":"1920","sebastian-holzmann":"2425","albert-ortega-fornesa":"4313","jett-seymour":"4992","lenz-haechler":"6883","yohei-koyama":"2447","jesper-pohjolainen":"5401","istok-rodes":"2454","luke-winters":"4709","tormis-laine":"4056","theodor-braekken":"6709","matteo-canins":"4739","nicolo-molteni":"4296","andreas-zampa":"1973","william-hansson":"5403","aleix-aubert-serracanta":"6824","fadri-janutin":"5338","marc-rochat":"2812","manuel-traninger":"2988","shiro-aihara":"4980","jared-goldberg":"2445","guerlain-favre":"5499","max-perathoner":"6656","cooper-puckett":"5567","juan-del-campo-hernandez":"2602","bridger-gile":"5310","george-steffey":"4295","simon-talacci":"5494","gustav-wissting":"7109","corrado-barbera":"5644","raphael-lessard":"5312","mikaela-shiffrin":"72w","emma-aicher":"4194w","camille-rast":"3229w","sofia-goggia":"331w","lara-gut-behrami":"10w","alice-robinson":"3891w","paula-moltzan":"294w","laura-pirovano":"2916w","julia-scheib":"2970w","sara-hector":"133w","cornelia-huetter":"94w","kira-weidle-winkelmann":"1340w","kajsa-vickhoff-lie":"2963w","wendy-holdener":"78w","breezy-johnson":"497w","lindsey-vonn":"2w","lara-colturi":"5268w","corinne-suter":"177w","romane-miradoli":"196w","ester-ledecka":"2957w","katharina-truppe":"1345w","ariane-raedler":"3633w","lena-duerr":"28w","lara-della-mea":"3580w","valerie-grenier":"460w","elena-curtoni":"33w","thea-louise-stjernesund":"3019w","malorie-blanc":"4978w","anna-swenn-larsson":"76w","nina-ortlieb":"386w","zrinka-ljutic":"4175w","mirjam-puchner":"175w","katharina-liensberger":"2921w","federica-brignone":"127w","nicol-delago":"461w","ilka-stuhec":"43w","jacqueline-wiles":"378w","nina-o-brien":"1346w","neja-dvornik":"3890w","mina-fuerst-holtmann":"480w","keely-cashman":"2975w","laura-gauche":"388w","maryna-gasienica-daniel":"289w","asja-zenere":"1325w","camille-cerutti":"2964w","marion-chevrier":"4203w","cornelia-oehlund":"5016w","katharina-huber":"1324w","roberta-melesi":"428w","dzenifera-germane":"4080w","stephanie-brunner":"234w","britt-richardson":"4212w","melanie-meillard":"1322w","hanna-aronsson-elfman":"4063w","caitlin-mcfarlane":"4104w","a-j-hurt":"3886w","marte-monsen":"3793w","estelle-alphand":"197w","magdalena-egger":"3962w","eliane-christen":"4471w","katharina-gallhuber":"2829w","laurence-st-germain":"379w","vanessa-kasper":"3023w","nadia-delago":"3013w","allison-mollin":"4773w","martina-peterlini":"3892w","nadine-fest":"2969w","marie-lamure":"3993w","janine-schmitt":"4140w","ana-bucik-jogan":"180w","nina-astner":"3959w","mary-bocock":"4764w","jasmine-flury":"201w","clara-direz":"252w","stefanie-grob":"4970w","ricarda-haaser":"260w","sue-piller":"5832w","lisa-hoerhager":"4176w","franziska-gritsch":"3694w","jasmina-suter":"262w","anna-trocker":"6424w","madeleine-sylvester-davik":"5486w","natalie-falch":"4280w","elisabeth-bocock":"4761w","isabella-wright":"3934w","joana-haehlen":"169w","asa-ando":"427w","hilma-loevblom":"3985w","tricia-mangan":"1341w","haley-cutler":"5280w","ilaria-ghisalberti":"4151w","cassidy-gray":"4154w","delia-durrer":"4074w","martina-dubovska":"168w","emilia-mondinelli":"4987w","anuk-braendli":"5277w","bianca-bakke-westhoff":"4160w","doriane-escane":"3577w","fabiana-dorigo":"4130w","amelia-smart":"2983w","aline-hoepli":"4226w","katie-hensien":"3887w","priska-ming-nufer":"170w","sara-allemand":"4144w","aline-danioth":"1321w","erika-pykalainen":"3894w","dania-allenbach":"6136w","liv-moritz":"4744w","sophie-nyberg":"5593w","sara-thaler":"5054w","giulia-valleriani":"5329w","elvedina-muzaferija":"2989w","lena-wechner":"4141w","carla-mijares-ruf":"4106w","alice-pazzaglia":"4303w","christina-ager":"390w","nicole-good":"3782w","justine-lamontagne":"4286w","ali-nullmeyer":"2972w","jessica-hilzinger":"1339w","chisaki-maeda":"2985w","leona-popovic":"1193w","giorgia-collomb":"5332w","jasmin-mathis":"4969w","cande-moreno":"3777w","nika-tomsic":"3581w","jana-fritz":"5269w","garance-meyer":"5279w","victoria-olivier":"4232w","simone-wild":"397w","viktoria-buergler":"4323w","moa-landstroem":"5364w","emily-schoepf":"3996w","zita-toth":"3970w","beatrice-sola":"4229w","inni-holm-wembstad":"4139w","rosa-pohjolainen":"4060w","noa-szollos":"4124w","leonie-raich":"5024w","lisa-grill":"3899w","carmen-spielberger":"5019w","leonie-zegg":"5539w"};
  const YEARS = [2026, 2025, 2024, 2023, 2022, 2021], SIZE = 240;
  const crc = (() => { const t = new Uint32Array(256).map((_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
    return (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
  const enc = new TextEncoder(), files = [], missing = [];
  const u16 = (v) => [v & 255, v >> 8 & 255], u32 = (v) => [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24];
  const DELAY = 6000, WAIT = 60000, STOP = { stop: true }, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let last = 0;
  async function get(u) { // une requête à la fois, espacée ; si le site dit « trop de requêtes » (429), on patiente puis on réessaie
    for (let k = 1; k <= 3; k++) {
      const gap = DELAY - (Date.now() - last); if (gap > 0) await sleep(gap);
      last = Date.now();
      try {
        const r = await fetch(u);
        if (r.status === 429 || r.status === 403) { console.log('Le site demande de ralentir (' + r.status + '), pause de ' + (WAIT * k / 1000) + ' s…'); await sleep(WAIT * k); continue; }
        return r;
      } catch (e) { await sleep(2000); }
    }
    throw STOP; // le site refuse toujours : on s'arrête proprement
  }
  async function viaPage(key) {
    const w = key.endsWith('w'), id = key.replace('w', '');
    const r = await get('/alpine/athlete.php?id=' + id + (w ? '&g=w' : ''));
    if (!r || !r.ok) return null;
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    const hit = [...doc.querySelectorAll('img')].map((i) => i.getAttribute('src') || '').find((x) => /img\/alpine\/\d{4}\/\d+\.(png|jpe?g|webp)/i.test(x));
    if (!hit) return null;
    const ir = await get(new URL(hit, location.origin + '/alpine/').href);
    return ir && ir.ok ? await ir.blob() : null;
  }
  async function grab(key) { return await viaPage(key); }
  async function square(blob) {
    const bmp = await createImageBitmap(blob), s = Math.min(bmp.width, bmp.height);
    const c = document.createElement('canvas'); c.width = c.height = SIZE;
    const x = c.getContext('2d'); x.fillStyle = '#eee5cf'; x.fillRect(0, 0, SIZE, SIZE);
    x.drawImage(bmp, (bmp.width - s) / 2, 0, s, s, 0, 0, SIZE, SIZE);
    return new Uint8Array(await (await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82))).arrayBuffer());
  }
  const ids = Object.keys(MAP); let n = window.SKI_START || 0, stoppedAt = -1;
  for (let i = n; i < ids.length; i++) {
    const id = ids[i]; let b;
    try { b = await grab(MAP[id]); } catch (e) { if (e === STOP) { stoppedAt = i; break; } b = null; }
    if (b) { try { files.push({ name: id + '.jpg', data: await square(b) }); } catch (e) { missing.push(id); } } else missing.push(id);
    if ((i + 1) % 10 === 0) console.log((i + 1) + ' / ' + ids.length + ' traités, ' + files.length + ' photos');
  }
  const parts = [], central = []; let off = 0;
  files.forEach((f) => {
    const nm = enc.encode(f.name), c = crc(f.data);
    const head = new Uint8Array([0x50, 0x4B, 3, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(f.data.length), ...u32(f.data.length), ...u16(nm.length), 0, 0, ...nm]);
    central.push(new Uint8Array([0x50, 0x4B, 1, 2, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(f.data.length), ...u32(f.data.length), ...u16(nm.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off), ...nm]));
    parts.push(head, f.data); off += head.length + f.data.length;
  });
  const csize = central.reduce((s, a) => s + a.length, 0);
  parts.push(...central, new Uint8Array([0x50, 0x4B, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(csize), ...u32(off), 0, 0]));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(parts, { type: 'application/zip' })); a.download = 'photos.zip';
  document.body.appendChild(a); a.click();
  if (stoppedAt >= 0) console.log('ARRÊT : le site refuse. Pour reprendre plus tard, tape  window.SKI_START = ' + stoppedAt + '  puis recolle le script (et envoie ce zip à Claude).');
  console.log('TERMINÉ : ' + files.length + ' photos dans photos.zip. Introuvables (' + missing.length + ') : ' + missing.join(', '));
})();
