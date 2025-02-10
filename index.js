const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
require('dotenv').config();
const { addChannel, getChannels, addFile, searchFiles } = require('./database');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Welcome message handler
bot.start((ctx) => ctx.reply('🤖 Welcome to File Filter Bot!\nSend a file name to search across channels.'));

// Add channel command
bot.command('addchannel', async (ctx) => {
    if (ctx.chat.type === 'channel') {
        try {
            const admins = await ctx.getChatAdministrators();
            if (admins.some(a => a.user.id === ctx.botInfo.id)) {
                addChannel(ctx.chat.id.toString());
                ctx.reply('✅ Channel added successfully!');
            } else {
                ctx.reply('❌ Please make me admin first!');
            }
        } catch (e) {
            ctx.reply('❌ Error adding channel!');
        }
    } else {
        ctx.reply('⚠️ Use this command in a channel!');
    }
});

// File handler for channels
bot.on(message(['document', 'video', 'audio']), async (ctx) => {
    const channelId = ctx.chat.id.toString();
    const validChannels = getChannels().map(c => c.channel_id);
    
    if (validChannels.includes(channelId)) {
        const file = ctx.message.document || ctx.message.video || ctx.message.audio;
        addFile(channelId, file.file_id, file.file_name || file.file_id);
    }
});

// Search handler
bot.on(message('text'), async (ctx) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        const searchMessage = await ctx.reply('🔍 Searching files...');
        const results = searchFiles(ctx.message.text);
        
        if (results.length === 0) {
            ctx.telegram.editMessageText(ctx.chat.id, searchMessage.message_id, null, '❌ No files found!');
            return;
        }
        
        const keyboard = results.map(file => [
            { 
                text: file.file_name, 
                callback_data: `send:${file.channel_id}:${file.file_id}`
            }
        ]);
        
        ctx.telegram.editMessageText(
            ctx.chat.id,
            searchMessage.message_id,
            null,
            '📁 Found these files:',
            { reply_markup: { inline_keyboard: keyboard } }
        );
    }
});

// File forward handler
bot.action(/send:(-?\d+):(.+)/, async (ctx) => {
    const [_, channelId, fileId] = ctx.match;
    try {
        await ctx.forwardMessage(channelId, fileId);
        ctx.answerCbQuery('✅ File sent!');
    } catch (e) {
        ctx.answerCbQuery('❌ Failed to send file!');
    }
    ctx.deleteMessage();
});

// New group member handler
bot.on('new_chat_members', (ctx) => {
    if (ctx.message.new_chat_members.some(u => u.id === ctx.botInfo.id)) {
        ctx.reply('👋 Thanks for adding me! Send a file name to start searching!');
    }
});

bot.launch();
console.log('🤖 Bot started!');
