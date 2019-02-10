const AlertOdessaBot = require('./alert_odessa_bot/alert_odessa_bot');
const path           = require('path');

new AlertOdessaBot({
    botToken: process.env.BOT_TOKEN,
    db: path.join(__dirname, './alert_odessa_bot/db.json')
});
