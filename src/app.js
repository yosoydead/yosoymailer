const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const schedule = require('node-schedule');

require('dotenv').config();

const middlewares = require('./middlewares');

const app = express();
const mailer = require('./mailer');

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  // console.log('home route');
  // mailer();
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

// eslint-disable-next-line max-len
// În fiecare vineri la prânz. Așa mă asigur și că aplicația merge și nu dă rateuri ca să aflu abia după 1 lună.
// Rămâne să mă gândesc dacă ăsta o să fie intervalul final. Momentan, așa rămâne.
// schedule.scheduleJob('0 14 * * FRI', mailer);

schedule.scheduleJob('*/1 * * * *', mailer);

module.exports = app;
