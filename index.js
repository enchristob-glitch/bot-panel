const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const BOT_TOKEN = '8986890804:AAH_TQPREtQni3wgeixr3X3-xVkgAopm9FA';
const PANEL_URL = 'https://panel-production-1e3d.up.railway.app';
const API_KEY = '';
const OWNER_USERNAME = '';
const OWNER_ID = ''; // ID Telegram lu

const bot = new Telegraf(BOT_TOKEN);
const userState = {};

bot.start(async (ctx) => {
  const name = ctx.from.first_name;
  const longText = `
╭─〔 🚀 𝗣𝗧𝗘𝗥𝗢𝗗𝗔𝗖𝗧𝗬𝗟 𝗣𝗔𝗡𝗘𝗟 𝗙𝗥𝗘𝗘 〕─╮

Halo ${name} 👋
Selamat datang di Bot Panel Auto Create!

┏━━━━━━━━━━━━━━━━━━━┓
┃ 🤖 Apa itu Panel? ┃
┗━━━━━━━━━━━━━━━━━━━┛
Panel adalah wadah untuk menjalankan bot WhatsApp, Minecraft Server, dan script NodeJS 24 jam nonstop di VPS!

┏━━━━━━━━━━━━━━━━━━━┓
┃ ✨ Fitur Panel Kami ┃
┗━━━━━━━━━━━━━━━━━━━┛
➥ ✅ RAM Unlimited
➥ ✅ CPU High Performance
➥ ✅ Anti Delay & Fast Install
➥ ✅ Garansi Full & Support 24 Jam
➥ ✅ Bisa Buat Bot WA / MC / Dll

┏━━━━━━━━━━━━━━━━━━━┓
┃ 👑 Info Owner Bot ┃
┗━━━━━━━━━━━━━━━━━━━┛
➥ Owner: ${OWNER_USERNAME}
➥ Status: Online & Trusted
➥ Jualan Panel Sejak 2023

Pencet tombol di bawah untuk mendapatkan panel gratis mu sekarang!
╰───────────────────╯
`;

  await ctx.reply(longText, Markup.inlineKeyboard([
    [Markup.button.callback('🎁 GET PANEL FREE', 'get_panel')],
    [Markup.button.url('👑 OWNER', `https://t.me/${OWNER_USERNAME.replace('@','')}`), Markup.button.callback('📋 INFO BOT', 'info_bot')],
  ]));
});

bot.action('info_bot', async (ctx) => {
  await ctx.answerCbQuery();
  const info = `
🤖 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗦𝗜 𝗕𝗢𝗧

• Bot Name: Pterodactyl Auto Panel
• Version: v2.0 Railway Edition
• Panel URL: ${PANEL_URL}
• Node: Railway High Performance
• Developer: ${OWNER_USERNAME}

Bot ini dibuat untuk auto create akun panel tanpa harus ribet login ke pterodactyl!

Support: Telegram ${OWNER_USERNAME}
`;
  await ctx.reply(info);
});

bot.action('get_panel', async (ctx) => {
  await ctx.answerCbQuery();
  userState[ctx.from.id] = { step: 'username' };
  await ctx.reply('📝 𝗟𝗔𝗡𝗚𝗞𝗔𝗛 𝟭/𝟯\n\nSilahkan kirim *Username* untuk panel kamu:\nContoh: `aditganteng`\n\n_username minimal 5 huruf, tanpa spasi_', { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
  const id = ctx.from.id;
  const state = userState[id];
  if (!state) return;
  const text = ctx.message.text.trim();

  if (state.step === 'username') {
    if (text.length < 4) return ctx.reply('❌ Username terlalu pendek! Minimal 4 huruf, coba lagi:');
    state.username = text;
    state.step = 'password';
    return ctx.reply(`✅ Username diset: \`${text}\`\n\n📝 𝗟𝗔𝗡𝗚𝗞𝗔𝗛 𝟮/𝟯\n\nSekarang kirim *Password* untuk panel kamu:\nContoh: \`Adit12345\`\n\n_password minimal 8 karakter_`, { parse_mode: 'Markdown' });
  }

  if (state.step === 'password') {
    if (text.length < 8) return ctx.reply('❌ Password minimal 8 karakter! Coba lagi:');
    state.password = text;
    state.step = 'email';
    return ctx.reply(`✅ Password aman!\n\n📝 𝗟𝗔𝗡𝗚𝗞𝗔𝗛 𝟯/𝟯\n\nTerakhir, kirim *Email* kamu yang valid:\nContoh: \`adit@gmail.com\``, { parse_mode: 'Markdown' });
  }

  if (state.step === 'email') {
    if (!text.includes('@') ||!text.includes('.')) return ctx.reply('❌ Email tidak valid! Contoh: adit@gmail.com');
    state.email = text;

    // MULAI ANIMASI
    let msg = await ctx.reply('⏳ Menyiapkan Panel Anda...\n[░░░░░░░░░░] 0%');

    try {
      const animate = async (percent, bar) => {
        await new Promise(r => setTimeout(r, 600));
        try { await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, `⏳ Menyiapkan Panel Anda...\n[${bar}] ${percent}%\n\n> Membuat akun untuk ${state.username}...`); } catch(e){}
      };

      await animate(20, '██░░░░░░░░');
      await animate(50, '█████░░░░░');
      await animate(80, '████████░░');

      // CREATE USER DI PANEL
      const response = await axios.post(`${PANEL_URL}/api/application/users`, {
        username: state.username,
        email: state.email,
        first_name: state.username,
        last_name: 'User',
        password: state.password,
      }, {
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      await animate(100, '██████████');
      await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, '✅ Panel Berhasil Dibuat!');

      const successText = `
╭─〔 ✅ 𝗣𝗔𝗡𝗘𝗟 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 〕─╮

Hore! Panel kamu sudah jadi! 🎉

┏━━━━━━━━━━━━━━━━━━━┓
┃ 🔐 DETAIL AKUN MU ┃
┗━━━━━━━━━━━━━━━━━━━┛
➥ 🌐 Login URL: ${PANEL_URL}
➥ 👤 Username: \`${state.username}\`
➥ 🔑 Password: \`${state.password}\`
➥ 📧 Email: ${state.email}
➥ 🆔 User ID: ${response.data.attributes.id}

Simpan data ini baik-baik ya!

Cara pakai: Login ke URL di atas, nanti bisa upload bot / server kamu!

Terimakasih sudah menggunakan bot kami ❤️
Owner: ${OWNER_USERNAME}
╰───────────────────╯
`;
      await ctx.reply(successText, { parse_mode: 'Markdown',...Markup.inlineKeyboard([
        [Markup.button.url('🌐 BUKA PANEL', PANEL_URL)],
        [Markup.button.url('👑 CHAT OWNER', `https://t.me/${OWNER_USERNAME.replace('@','')}`)]
      ])});

    } catch (err) {
      console.log(err.response?.data || err.message);
      let errorMsg = err.response?.data?.errors? JSON.stringify(err.response.data.errors) : err.message;
      if (errorMsg.includes('email') || errorMsg.includes('username')) errorMsg = 'Username / Email sudah pernah dipakai! Coba pakai yang lain.';
      await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, `❌ GAGAL MEMBUAT PANEL\n\nAlasan: ${errorMsg}\n\nCoba /start lagi!`);
    }
    delete userState[id];
  }
});

bot.launch();
console.log('Bot Jalan Rek!');
