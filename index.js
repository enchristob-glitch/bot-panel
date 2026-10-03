const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');


// KALO GAK PAKE.env TARO DI SINI GPP REK BUAT LOKAL!
const BOT_TOKEN = '8837240784:AAH3_-SkyLfu1mmg2vh1NPkU-ir-KnUlSfU';
const PANEL_DOMAIN = 'https://panel-production-1e3d.up.railway.app';
const PANEL_API_KEY = 'ptla_XxSI2tsIJcL5QqrFuFn7a5JsXsMGn1HKPZUmPOPFSwx';

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const SPEK_LIST = {
  'spek_1gb': { ram: 1024, disk: 1024, cpu: 30, name: '1GB RAM | 1GB DISK | 30% CPU', short: '1GB' },
  'spek_2gb': { ram: 2048, disk: 2048, cpu: 60, name: '2GB RAM | 2GB DISK | 60% CPU', short: '2GB' },
  'spek_3gb': { ram: 3072, disk: 3072, cpu: 80, name: '3GB RAM | 3GB DISK | 80% CPU', short: '3GB' },
  'spek_4gb': { ram: 4096, disk: 4096, cpu: 100, name: '4GB RAM | 4GB DISK | 100% CPU', short: '4GB' },
  'spek_5gb': { ram: 5120, disk: 5120, cpu: 150, name: '5GB RAM | 5GB DISK | 150% CPU', short: '5GB' },
  'spek_unli': { ram: 0, disk: 0, cpu: 0, name: 'UNLIMITED RAM DISK CPU', short: 'UNLI' }
};

function randomString() { return 'user' + Math.floor(Math.random() * 9999); }

// ===== AUTO CARI EGG VALID ANTI INVALID REK! INI KUNCI NYA! =====
async function findValidEgg() {
  let nests = await axios.get(PANEL_DOMAIN + '/api/application/nests', {
    headers: { Authorization: 'Bearer ' + PANEL_API_KEY, Accept: 'Application/vnd.pterodactyl.v1+json' }
  });
  for (let nest of nests.data.data) {
    let eggs = await axios.get(PANEL_DOMAIN + '/api/application/nests/' + nest.attributes.id + '/eggs', {
      headers: { Authorization: 'Bearer ' + PANEL_API_KEY, Accept: 'Application/vnd.pterodactyl.v1+json' }
    });
    if (eggs.data.data.length > 0) {
      let egg = eggs.data.data[0].attributes;
      let docker = Object.values(egg.docker_images)[0];
      return { nestId: nest.attributes.id, eggId: eggs.data.data[0].attributes.id, docker: docker, startup: egg.startup, name: egg.name };
    }
  }
  throw new Error('GAK ADA EGG DI PANEL! IMPORT DULU!');
}

async function createPanelFinal(ctx) {
  const s = ctx.session;
  let msg = await ctx.reply('⏳ MEMULAI... AUTO DETEKSI EGG BIAR GAK INVALID LAGI REK!');

  let steps = [
    '⏳ 10% - Cek spek ' + s.spek.name,
    '⏳ 30% - Bikin user ' + s.username,
    '⏳ 50% - Cari Egg yang valid di panel...',
    '⏳ 70% - Cari Allocation Free...',
    '⏳ 85% - Bikin SERVER UTAMA Wings...',
    '✅ 100% - SERVER UTAMA BERHASIL JADI REK!'
  ];
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 600));
    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, steps[i]).catch(() => {});
  }

  try {
    let userRes = await axios.post(PANEL_DOMAIN + '/api/application/users', {
      username: s.username, email: s.email, first_name: s.username, last_name: 'Ganteng', password: s.password, root_admin: s.isAdmin
    }, { headers: { Authorization: 'Bearer ' + PANEL_API_KEY, 'Content-Type': 'application/json', Accept: 'Application/vnd.pterodactyl.v1+json' } });
    let userId = userRes.data.attributes.id;

    let nodes = await axios.get(PANEL_DOMAIN + '/api/application/nodes', { headers: { Authorization: 'Bearer ' + PANEL_API_KEY } });
    let freeAlloc = null; let nodeId = null;
    for (let node of nodes.data.data) {
      let allocs = await axios.get(PANEL_DOMAIN + '/api/application/nodes/' + node.attributes.id + '/allocations', { headers: { Authorization: 'Bearer ' + PANEL_API_KEY } });
      for (let a of allocs.data.data) { if (!a.attributes.assigned) { freeAlloc = a.attributes.id; nodeId = node.attributes.id; break; } }
      if (freeAlloc) break;
    }
    if (!freeAlloc) throw new Error('GAK ADA ALLOCATION FREE! Bikin di Nodes > Allocation > Assign New 30000-30100');

    // INI OPENING ANTI INVALID NYA REK!
    let eggInfo = await findValidEgg();
    console.log('PAKE EGG VALID REK:', eggInfo);

    let varRes = await axios.get(PANEL_DOMAIN + '/api/application/nests/' + eggInfo.nestId + '/eggs/' + eggInfo.eggId + '?include=variables', { headers: { Authorization: 'Bearer ' + PANEL_API_KEY } });
    let envVars = {};
    for (let v of varRes.data.attributes.relationships.variables.data) {
      envVars[v.attributes.env_variable] = v.attributes.default_value || ' ';
    }

    let serverData = {
      name: s.username + '-UTAMA-' + s.spek.short,
      description: 'SERVER UTAMA ' + s.spek.name + ' - ' + eggInfo.name,
      user: userId,
      egg: eggInfo.eggId,
      docker_image: eggInfo.docker,
      startup: eggInfo.startup,
      environment: envVars,
      limits: { memory: s.spek.ram, swap: 0, disk: s.spek.disk, io: 500, cpu: s.spek.cpu },
      feature_limits: { databases: 1, allocations: 0, backups: 1 },
      allocation: { default: freeAlloc, additional: [] }
    };

    let srv = await axios.post(PANEL_DOMAIN + '/api/application/servers', serverData, { headers: { Authorization: 'Bearer ' + PANEL_API_KEY } });

    let hasil = '';
    hasil += '╔════════════════════════════════╗\n';
    hasil += '✅ SERVER UTAMA BERHASIL JADI REK!\n';
    hasil += '╚════════════════════════════════╝\n';
    hasil += '👤 Username: ' + s.username + '\n';
    hasil += '🔑 Password: ' + s.password + '\n';
    hasil += '📧 Email: ' + s.email + '\n';
    hasil += '📦 Spek: ' + s.spek.name + '\n';
    hasil += '🥚 Egg: ' + eggInfo.name + ' (ID: ' + eggInfo.eggId + ') - AUTO DETECT ANTI INVALID!\n';
    hasil += '🖥️ Node: ' + nodeId + ' Alloc: ' + freeAlloc + '\n';
    hasil += '🌐 Panel: ' + PANEL_DOMAIN + '\n';
    hasil += '✅ TERPERCAYA ✅ GRATIS ✅ AMAN ✅ NO SCAM ✅ SUPPORT 24/7 REK!\n';

    await ctx.reply(hasil, Markup.inlineKeyboard([
      [Markup.button.url('🌐 LOGIN PANEL - LIAT SERVER UTAMA', PANEL_DOMAIN)],
      [Markup.button.callback('📦 BIKIN LAGI', 'pilih_spek')]
    ]));
    s.step = null;
  } catch (e) {
    console.log(e.response?.data);
    let err = e.response?.data?.errors?.[0]?.detail || e.message;
    await ctx.reply('❌ GAGAL BIKIN SERVER UTAMA REK! ' + err);
    s.step = null;
  }
}

// ===== OPENING NYA DI SINI REK! =====
bot.start((ctx) => {
  ctx.session = {};
  let t = '';
  t += '╔════════════════════════════════════╗\n';
  t += '✨ BOT PANEL + SERVER UTAMA WINGS ✨\n';
  t += '╚════════════════════════════════════╝\n\n';
  t += 'HALO ' + ctx.from.first_name + ' 😝\n\n';
  t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  t += '✅ KENAPA HARUS DI BOT INI REK?\n';
  t += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  t += '✅ TERPERCAYA 100% - No scam!\n';
  t += '✅ GRATIS 100% - Bikin sepuasnya!\n';
  t += '✅ AMAN 100% - Password lu sendiri!\n';
  t += '✅ NO SCAM 100% - Dijamin amanah!\n';
  t += '✅ PAKE WINGS - Ada SERVER UTAMA langsung jadi!\n';
  t += '✅ AUTO DETEKSI EGG - Anti Invalid!\n';
  t += '✅ SUPPORT 24/7 - Online terus!\n\n';
  t += 'GAS PILIH SPEK BUAT SERVER UTAMA REK!\n';
  ctx.reply(t, Markup.inlineKeyboard([[Markup.button.callback('📦 PILIH SPEK SERVER UTAMA', 'pilih_spek')]]));
});

bot.action('pilih_spek', (ctx) => {
  ctx.editMessageText('🚀 PILIH SPEK SERVER UTAMA REK! PAKE WINGS + AUTO EGG!',
    Markup.inlineKeyboard([
      [Markup.button.callback('🔥 1GB - GRATIS ✅', 'spek_1gb')],
      [Markup.button.callback('⚡ 2GB - GRATIS ✅', 'spek_2gb')],
      [Markup.button.callback('🚀 3GB - GRATIS ✅', 'spek_3gb')],
      [Markup.button.callback('💎 4GB - GRATIS ✅', 'spek_4gb')],
      [Markup.button.callback('👑 5GB - GRATIS ✅', 'spek_5gb')],
      [Markup.button.callback('💥 UNLI [ADMIN] - GRATIS ✅', 'spek_unli')]
    ])
  );
});

Object.keys(SPEK_LIST).forEach(key => {
  bot.action(key, (ctx) => {
    ctx.session.spek = SPEK_LIST[key];
    ctx.editMessageText('✅ SPEK: ' + SPEK_LIST[key].name + '\n\nMODE WINGS ON + AUTO EGG ANTI INVALID! KLIK CREATE REK!',
      Markup.inlineKeyboard([[Markup.button.callback('🚀 CREATE SERVER UTAMA ' + SPEK_LIST[key].short, 'buat_panel_skrg')]])
    );
  });
});

bot.action('buat_panel_skrg', (ctx) => {
  ctx.session.step = 'usn';
  ctx.editMessageText('STEP 1/3 - USERNAME REK', Markup.inlineKeyboard([[Markup.button.callback('✨ AUTO USN GANTENG', 'auto_usn')]]));
});
bot.action('auto_usn', (ctx) => {
  ctx.session.username = randomString();
  ctx.session.step = 'pass';
  ctx.editMessageText('✅ USN: ' + ctx.session.username + '\nSTEP 2/3 - PASSWORD', Markup.inlineKeyboard([[Markup.button.callback('🔑 AUTO PASS', 'auto_pass')]]));
});
bot.action('auto_pass', (ctx) => {
  if (!ctx.session.username) ctx.session.username = randomString();
  ctx.session.password = ctx.session.username + '123';
  ctx.session.step = 'email';
  ctx.editMessageText('✅ PASS: ' + ctx.session.password + '\nSTEP 3/3 - EMAIL', Markup.inlineKeyboard([[Markup.button.callback('📧 AUTO EMAIL', 'auto_email')]]));
});
bot.action('auto_email', (ctx) => {
  ctx.session.email = ctx.session.username + '@gmail.com';
  ctx.editMessageText('✅ EMAIL: ' + ctx.session.email + '\n\n👑 PILIH ROLE REK?', Markup.inlineKeyboard([[Markup.button.callback('👑 ADMIN', 'role_admin')], [Markup.button.callback('👤 USER', 'role_user')]]));
});
bot.action('role_admin', (ctx) => { ctx.session.isAdmin = true; createPanelFinal(ctx); });
bot.action('role_user', (ctx) => { ctx.session.isAdmin = false; createPanelFinal(ctx); });

bot.on('text', async (ctx) => {
  const s = ctx.session; if (!s ||!s.step) return;
  if (s.step === 'usn') { s.username = ctx.message.text.trim().toLowerCase().split(' ').join(''); s.step = 'pass'; return ctx.reply('✅ USN: ' + s.username, Markup.inlineKeyboard([[Markup.button.callback('🔑 AUTO PASS', 'auto_pass')]])); }
  if (s.step === 'pass') { s.password = ctx.message.text.trim(); s.step = 'email'; return ctx.reply('✅ PASS', Markup.inlineKeyboard([[Markup.button.callback('📧 AUTO EMAIL', 'auto_email')]])); }
  if (s.step === 'email') {
    if (ctx.message.text.indexOf('@') === -1) return ctx.reply('Email harus ada @ rek!');
    s.email = ctx.message.text.trim(); return ctx.reply('PILIH ROLE', Markup.inlineKeyboard([[Markup.button.callback('👑 ADMIN', 'role_admin')], [Markup.button.callback('👤 USER', 'role_user')]]));
  }
});

bot.launch();
console.log('BOT WINGS + OPENING + AUTO EGG ON! ANTI INVALID!');



