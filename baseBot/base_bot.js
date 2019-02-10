const fs         = require('fs');
const fsPromises = fs.promises;

const path = require('path');

const axios = require('axios');
const _     = require('lodash');
const cron  = require('node-cron');

const Telegram = require('telegraf/telegram');
const Telegraf = require('telegraf');
const Extra    = require('telegraf/extra');

class BaseBot {
    constructor(param) {
        const {botToken, db, helpTxt} = param;
        this.pathBD                   = db;
        this.botToken                 = botToken;
        this.helpTxt                  = helpTxt;
        this.db                       = require(db);
        this.telegram                 = new Telegram(botToken);
        this.bot                      = new Telegraf(botToken);
        this.setUsername();
        this.Extra                    = Extra;
        this.start();
        this.help(helpTxt);
        this.init();
        this.botCatch();
        this.bot.startPolling();
    }

    init() {

    }

     setUsername() {
        this.bot.telegram.getMe().then((botInfo) => {
          this.bot.options.username = botInfo.username
        })
    }

    botCatch() {
        this.bot.catch((err) => {
            console.error(err)
        })
    }

    start() {
        this.bot.start(async (ctx) => {

            const isChat = _.indexOf(this.db.chats, ctx.message.chat.id);

            if (isChat < 0) {
                this.db.chats.push(ctx.message.chat.id);
                await fsPromises.writeFile(this.pathBD, JSON.stringify(this.db));
                ctx.reply('Start!');
                return
            }
            ctx.reply('Already working');
        })
    } ;

    help(helpTxt = '/start - начало работы бота') {
        this.bot.help(ctx => {
            ctx.reply(helpTxt);
        })
    } ;

    async saveDB() {
        await fsPromises.writeFile(this.pathBD, JSON.stringify(this.db));

    }

    task(cronParam) {
        const {time, callback} = cronParam;
        cron.schedule(time, async () => {
            await callback();
            await this.saveDB()
        })
    };


}

module.exports = BaseBot;
