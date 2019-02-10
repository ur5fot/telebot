const AlertOdessaBot = require('./alert_odessa_bot');
const path = require('path');

const alertOdessaBot = new AlertOdessaBot({
    botToken: process.env.BOT_TOKEN,
    db: path.join(__dirname, './db.json')
});

