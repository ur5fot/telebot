const fs   = require( 'fs' );
const path = require( 'path' );

const Telegram = require( 'telegraf/telegram' );
const Telegraf = require( 'telegraf' )
const axios    = require( 'axios' )
const _        = require( 'lodash' )


const telegram = new Telegram( process.env.BOT_TOKEN )
const bot      = new Telegraf( process.env.BOT_TOKEN )
const cron     = require( 'node-cron' );
const chats    = require( './dataDB.json' )
// let chats      = JSON.parse(chatsJSON);

bot.help( ( ctx ) => {
    ctx.reply( `/start\n/stop\n/weatherAlarms\n/forecasts\n/weathermaps` )
} );

/*bot.help((ctx) => ctx.reply('Send me a sticker222'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'))

/*
bot.use((ctx) => {
    console.log(ctx.message)
})

*/
// const jsdom     = require( "jsdom" );
// const { JSDOM } = jsdom;

/*setInterval(
    async function ff() {*/
/*const link    = 'https://www.risk.ru/';
const blog    = 'blog';
const resBlog = await axios.get( `${link}/${blog}` );

const html = resBlog.data;
const dom  = new JSDOM( html );*/
/* const posts = $(html).find('.commonPost');
 const firstPostH2 = posts.eq(0).find('h2 a').text();
*/
/* const commonPost =dom.window.document.querySelector( '.commonPost' );
 const h2     = commonPost.querySelector( 'h2 a' );
 const h2Text = h2.innerHTML;
 const h2A    = h2.getAttribute( 'href' );*/

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
// }

// , 3000 );

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
    const { data }   = await axios.get( 'http://dataservice.accuweather.com/alarms/v1/1day/325343?apikey=7gWWQ3psbW4XgV3arLpRQFYO4b4gm8Pu&language=ru-ru' );
    const { Alarms } = data[ 0 ];
    /*if ( +data['Code'] !== 200 ) {
        return
    }*/
    let message = 'Today in Odessa heavy ';

    Alarms.forEach( ( { AlarmType } ) => {
        message += ` ${AlarmType}`

    } );

    const { MobileLink } = data[ 0 ];

    message += ` \n   ${MobileLink}`;

    chats.forEach( chat => telegram.sendMessage( chat, message ) );
}

async function forecasts( ctx ) {
    let data;
    try {
        data = await axios.get( 'http://dataservice.accuweather.com/forecasts/v1/daily/5day/325343?apikey=7gWWQ3psbW4XgV3arLpRQFYO4b4gm8Pu&language=ru-ru' );
    } catch ( e ) {
        data = e
    }

    let message = data.message;
    // const { Alarms } = data[ 0 ];
    /*if ( +data['Code'] !== 200 ) {
        return
    }*/


    /*Alarms.forEach( ( { AlarmType } ) => {
        message += ` ${AlarmType}`

    } );

    const { MobileLink } = data[ 0 ];

    message += ` \n   ${MobileLink}`;*/

    if ( ctx ) {
        ctx.reply( message )
    } else {
        telegram.sendMessage( ctx.message.chat.id, message );
    }
}

let task = cron.schedule( '0 0 5 * * *', async () => {
    await weatherAlarms()
} );

// bot.command( 'weatherAlarms', weatherAlarms );
// bot.command( 'forecasts', forecasts );
// bot.command( 'weathermaps', weathermaps );

bot.start( async ( ctx ) => {
    task.start();
    const isChat = _.indexOf( chats, ctx.message.chat.id );
    if ( isChat < 0 ) {

        chats.push( ctx.message.chat.id );

        await new Promise( ( resolve, reject ) => {
            fs.writeFile( path.join( __dirname, './dataDB.json' ), JSON.stringify( chats ), ( err ) => {
                if ( err ) reject( err );
                resolve()
            } )
        } );

        ctx.reply( 'Start weather warnings' );

        return
    }
    ctx.reply( 'Already working' );
} );

bot.command( 'stop', ctx => {
    ctx.reply( 'Stop weather warnings' );
    task.stop();
} );

bot.startPolling();
