const axios = require('axios');
const request = require('request');
var rp = require('request-promise');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

const Telegram = require('telegraf/telegram');
const Telegraf = require('telegraf')
const _ = require('lodash')


const telegram = new Telegram(process.env.BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN)
const Extra = require('telegraf/extra');
const cron = require('node-cron');
const chats = require('./dataDB.json');
bot.help((ctx) => {
    ctx.reply(`/start\n/stop\n/weatherAlarms\n/forecasts\n/weathermaps`)
});

const apiKeys = 'fc0dd4f8a87318e2aea183d37ace4bd4';

async function weathermaps(ctx) {
    /*
        const { data }   = await axios.get( `https://tile.openweathermap.org/map/clouds_new/5/0/0.png?appid=${apiKeys}` );

        await new Promise( ( resolve, reject ) => {
            fs.writeFile( path.join( __dirname, './ddd.png' ), data, ( err ) => {
                if ( err ) reject( err );
                resolve()
            } )
        } );
        telegram.sendPhoto(ctx.message.chat.id, data)
        // chats.forEach( chat => telegram.sendMessage( chat, message ) );
    */
}

async function weatherAlarms() {
    try {
        const {data} = await axios.get('http://dataservice.accuweather.com/alarms/v1/1day/325343?apikey=7gWWQ3psbW4XgV3arLpRQFYO4b4gm8Pu&language=ru-ru');

        if (data.length === 0) return;

        const {Alarms} = data[0];

        let message = 'Today in Odessa heavy ';

        Alarms.forEach(({AlarmType}) => {
            message += ` ${AlarmType}`

        });

        const {MobileLink} = data[0];

        message += ` \n   ${MobileLink}`;

        chats.forEach(chat => telegram.sendMessage(chat, message));

    } catch (e) {
        console.error('weatherAlarms', e)
    }
}

async function forecasts(ctx) {

    try {
        let {DailyForecasts} = {data} = await axios.get('http://dataservice.accuweather.com/forecasts/v1/daily/5day/325343?apikey=7gWWQ3psbW4XgV3arLpRQFYO4b4gm8Pu&language=ru-ru');

        let message = JSON.stringify(DailyForecasts);
        if (ctx) {
            ctx.reply(message)
        } else {
            telegram.sendMessage(ctx.message.chat.id, message);
        }
    } catch (e) {
        console.error('forecasts', e)
    }
}

let task = cron.schedule('0 0 5 * * *', async () => {
    await weatherAlarms()
});

bot.start(async (ctx) => {
    task.start();
    const isChat = _.indexOf(chats, ctx.message.chat.id);
    if (isChat < 0) {

        chats.push(ctx.message.chat.id);

        await new Promise((resolve, reject) => {
            fs.writeFile(path.join(__dirname, './dataDB.json'), JSON.stringify(chats), (err) => {
                if (err) reject(err);
                resolve()
            })
        });

        ctx.reply('Start weather warnings');

        return
    }
    ctx.reply('Already working');
});

bot.command('stop', ctx => {
    ctx.reply('Stop weather warnings');
    task.stop();
});


bot.command('weatherAlarms', weatherAlarms);
bot.command('forecasts', forecasts);


// bot.command( 'weathermaps', weathermaps );

/*bot.help((ctx) => ctx.reply('Send me a sticker222'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'))

/*
bot.use((ctx) => {
    console.log(ctx.message)
})

*/


/*setInterval(*/

// }

// , 3000 );


let PDFDocument = require('pdfkit');


bot.command('pdf', async ctx => {
    // await  ctx.reply('Loading...');
    let doc = new PDFDocument;

    doc.pipe(fs.createWriteStream('./myFile.pdf'));
    doc.font('fonts/DejaVuSans.ttf').fontSize(15).text(ctx.message.text.slice(5));
    doc.end();
    doc.on('end', async () => {
        await  ctx.replyWithDocument({source: './myFile.pdf'})
    });
});

bot.catch((err) => {
    telegram.sendMessage(483941623, JSON.stringify(err));
});

bot.startPolling();
