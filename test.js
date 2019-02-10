const fs = require('fs');
const path = require('path');

const jsdom = require("jsdom");
const {JSDOM} = jsdom;

const axios = require('axios');
const _ = require('lodash')
const cron = require('node-cron');

const Telegram = require('telegraf/telegram');
const Telegraf = require('telegraf')
const telegram = new Telegram(process.env.BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN)

const db = require('./companion.json')

async function getRisk(ctx) {
    try {
        const link = 'https://www.risk.ru';
        const blog = '/blog'
        const category = `/category/look-for`;
        const {data} = await axios.get(`${link}${blog}${category}`);

        const dom = new JSDOM(data);

        const commonPosts = dom.window.document.querySelectorAll('.commonPost');
        let hrefs = [];
        commonPosts.forEach(commonPost => {
            hrefs.push(link + commonPost.querySelector('h2 a').getAttribute('href'))
        });

        let diffs = _.differenceWith(hrefs, db.risk, (arr, val) => {
            return arr === val
        });

        if (!diffs.length) return;

        db.risk = hrefs;
        // diffs.length = 4;

        //,"@hikingevents"

        if (!ctx) {
            db.chats.forEach(async chat => {
                for (let message of diffs) {
                    await telegram.sendMessage(chat, message)
                }
            });
        } else {
            for (let message of diffs) {
                await  ctx.reply( message)
            }
        }
    } catch (e) {
        console.error(e)
    }

}

async function getEurotourist(ctx) {
    try {
        const link = 'http://eurotourist.club';
        const lastRout = '/search.php?st=0&sk=t&sd=d&sr=topics&search_id=fellow&all=1';
        const {data} = await axios.get(`${link}${lastRout}`);

        const dom = new JSDOM(data);

        const topictitles = dom.window.document.querySelectorAll('.topictitle');

        let hrefs = [];

        topictitles.forEach(topictitle => {
            let href = topictitle.href;
            hrefs.push(link + href.slice(1))
        });

        let diffs = _.differenceWith(hrefs, db.eurotourist, (arr, val) => {
            return arr.split('&')[1] === val.split('&')[1]
        });

        if (!diffs.length) return;

        db.eurotourist = hrefs;
        // diffs.length = 4;

        //,"@hikingevents"

        if (!ctx) {
            db.chats.forEach(async chat => {
                for (let message of diffs) {
                    await telegram.sendMessage(chat, message)
                }
            });
        } else {
            for (let message of diffs) {
                await  ctx.reply( message)
            }
        }

    } catch (e) {
        console.error(e)
    }

}

// let task = cron.schedule('0 0 9,12,18 * * *', async () => {
let task = cron.schedule('*/1 * * * *', async () => {
    await getRisk();
    await getEurotourist();
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, './companion.json'), JSON.stringify(db), (err) => {
            if (err) reject(err);
            resolve()
        })
    });
});

bot.start(async (ctx) => {
    task.start();
    const isChat = _.indexOf(db.chats, ctx.message.chat.id);
    if (isChat < 0) {

        db.chats.push(ctx.message.chat.id);

        await new Promise((resolve, reject) => {
            fs.writeFile(path.join(__dirname, './companion.json'), JSON.stringify(db), (err) => {
                if (err) reject(err);
                resolve()
            })
        });

        ctx.reply('Start!');

        return
    }
    ctx.reply('Already working');
});

bot.help(ctx => {
    ctx.reply('/start\n/stop\n/getEurotourist\n/getRisk');
});

bot.command('stop', ctx => {
    ctx.reply('Stop!');
    task.stop();
});

bot.command('getEurotourist', async ctx => {
    await getEurotourist(ctx);
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, './companion.json'), JSON.stringify(db), (err) => {
            if (err) reject(err);
            resolve()
        })
    });
    await ctx.reply('getEurotourist');

});

bot.command('getRisk', async ctx => {
    await getRisk(ctx);
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, './companion.json'), JSON.stringify(db), (err) => {
            if (err) reject(err);
            resolve()
        })
    });
    await ctx.reply('getRisk');

});

bot.startPolling();


/*const resPost = await axios.get( `${link}${h2A}` );

const htmlPost = resPost.data;

const domPost    = new JSDOM( htmlPost );
const h1Post     = domPost.window.document.querySelector( 'h1' );
const h1PostText = h2.innerHTML;

const bodyPost     = domPost.window.document.querySelector( '.postBody .topic-txt' );
const bodyPostText = bodyPost.innerHTML;
const text         = _.escape( bodyPostText );
const messageCut = _.truncate(text, {
        'length': 4000,
});*/
// const message      = `${messageCut}  ${link}${h2A}`;
// const message      = `${h2Text}/n   /n  ${link}${h2A}`;

/*  const { data }   = await axios.get( 'http://dataservice.accuweather.com/alarms/v1/1day/325343?apikey=7gWWQ3psbW4XgV3arLpRQFYO4b4gm8Pu&language=ru-ru' )
  const { Alarms } = data[0];
  if (Alarms.length === 0) {
      return
  }
  let message    = 'Today  ';
  Alarms.forEach( ( { AlarmType } ) => {
      message +=  ` ${AlarmType}`

  } );

  const {MobileLink} = data[0];

  message += ` \n   ${MobileLink}`;

  chats.forEach( chat => telegram.sendMessage( chat.message.chat.id, message ) );*/
