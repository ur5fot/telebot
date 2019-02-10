const BaseBot = require('../baseBot/base_bot');
const path    = require('path');
const iconv   = require('iconv-lite');

const fetch = require('node-fetch');

const jsdom   = require("jsdom");
const {JSDOM} = jsdom;

const axios = require('axios');
const _     = require('lodash');

class AlertOdessaBot extends BaseBot {
    init() {
        const _this     = this;
        const cronParam = {
            time: '*/59 * * * *',
            // time: '*/1 * * * *',
            async callback() {
                await _this.getOMR();
            }
        };
        this.taskID     = this.task(cronParam);
        this.bot.command('getomr', this.getOMR.bind(_this))
    }

    async getOMR(ctx) {
        try {
            console.log('getOMR');
            const link = 'http://omr.gov.ua';
            const news = '/ru/news';
            const dom  = await this.fetchAjax(`${link}${news}`);

            const postsAll    = dom.window.document.querySelectorAll('.pageText p');
            const postsAllArr = Array.from(postsAll);
            const posts       = postsAllArr.slice(1, -1);
            let alertPosts    = [];
            let isNewPost     = false;

            let lastPost = {timePost: '', milliseconds: 0};

            for (const post of posts) {
                const textPost = post.innerHTML;
                const linkPost = post.querySelector('a').href;
                const title    = post.querySelector('strong');
                const titleStr = title.textContent;

                const timePost            = textPost.slice(0, 16);
                const timePostArrDateTime = timePost.split(' ');
                const timePostDate        = timePostArrDateTime[0];
                const timePostDateArr     = timePostDate.split('.');
                const day                 = +timePostDateArr[0];
                const month               = +timePostDateArr[1];
                const year                = +timePostDateArr[2];
                const timePostTime        = timePostArrDateTime[1];
                const timePostTimeArr     = timePostTime.split(':');
                const hour                = +timePostTimeArr[0];
                const minute              = +timePostTimeArr[1];
                const date                = new Date(year, month + 1, day, hour, minute);
                const dateMilliseconds    = date.getTime();

                if (this.db.getOMR.milliseconds >= dateMilliseconds) {
                    break
                }

                if (!isNewPost) {
                    isNewPost             = true;
                    lastPost.milliseconds = dateMilliseconds;
                    lastPost.timePost     = timePost
                }

                if (
                    titleStr.indexOf(/Отключение воды/i) < 0
                    && titleStr.indexOf(/Вниманию автомобилистов/i) < 0
                    // && titleStr.indexOf(/Отключение воды/i) < 0
                    && titleStr.indexOf(/Возобновлена работа/i) < 0
                    && titleStr.indexOf(/бювет/i) < 0
                    && titleStr.indexOf(/Вниманию одесситов/i) < 0
                    && titleStr.indexOf(/движение транспорта/i) < 0
                    && titleStr.indexOf(/Штормовое предупреждение/i) < 0
                    && titleStr.indexOf(/В ближайшие часы по Одессе/i) < 0
                    && titleStr.indexOf(/В Одессе возобновили движение/i) < 0
                    && titleStr.indexOf(/Изменение движения/i) < 0
                    && titleStr.indexOf(/формация о заболеваемости/i) < 0
                    && titleStr.indexOf(/Светофор на перекрестке/i) < 0

                //&& titleStr.indexOf('Прогноз погоды по Одессе') < 0
                //&& titleStr.indexOf('Ремонт дорог в Одессе:') < 0
                ) {
                    continue
                }

                alertPosts.push({dateMilliseconds, timePost, linkPost})
            }

            if (isNewPost) {
                this.db.getOMR = lastPost;
            }


            for (let alertPost of alertPosts) {
                const linkPost = `${link}${alertPost.linkPost}`;
                const dom      = await this.fetchAjax(linkPost);

                const page         = dom.window.document.querySelector('.page');
                const title        = page.querySelector('h2');
                const shortText    = page.querySelector('.shortText');
                const pageText     = page.querySelector('.pageText');        //${pageText.innerHTML}
                const titleStr     = title.textContent;
                const shortTextStr = shortText.textContent;
                const pageTextStr  = pageText.textContent;

                const message = _.truncate(`*${titleStr}*\n_${shortTextStr}_${pageTextStr}`, {
                    'length': 4000,
                    'omission': ` [ ... ] \n Продолжение тут ${linkPost}`,
                    'separator': ' '
                });

                if (ctx) {
                    await  ctx.reply(message);
                    await this.saveDB();
                } else {

                    this.db.chats.forEach(async chat => {
                        await this.telegram.sendMessage(chat, message, this.Extra.markdown())
                    });
                }
            }


            /*let hrefs = [];
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
                    await  ctx.reply(message)
                }
            }*/
        } catch (e) {
            console.error(e)
        }

    }

    async fetchAjax(url) {
        const data       = await fetch(url);
        const dataBuffer = await data.buffer();
        const dom        = new JSDOM(iconv.decode(dataBuffer, "win1251"));
        return dom
    }

}

module.exports = AlertOdessaBot;
