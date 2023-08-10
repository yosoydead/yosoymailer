const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const { XMLParser } = require('fast-xml-parser');

const TRADING212_BASE_URL = 'https://live.trading212.com/api/v0/';
const TRADING212_URLS = [
  'equity/account/info',
  'equity/account/cash',
  'equity/portfolio',
];
const BNR_EXCHANGE = 'https://www.bnr.ro/nbrfxrates.xml';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const mailOptions = {
  from: `Yosoymailer <${process.env.EMAIL_USER}>`, // sender address
  to: process.env.EMAIL_RECEIVER, // list of receivers
  subject: 'Update periodic cu investitiile! Ca să nu mai verifici zilnic aplicația. ;)',
  headers: {
    'x-priority': '1',
    'x-msmail-priority': 'High',
    importance: 'high',
  },
};

const monede = {
  EUR: '&euro;',
};

function generateObjectParams() {
  return TRADING212_URLS.map((str) => [
    `${TRADING212_BASE_URL}${str}`,
    {
      method: 'GET',
      headers: {
        Authorization: process.env.TRADING212_API_KEY,
      },
    },
  ]);
}

async function fetchTrading212Data() {
  try {
    const promises = await Promise.all(generateObjectParams().map((arr) => fetch(arr[0], arr[1])));
    const parsedData = await Promise.all(promises.map((p) => p.json()));
    const exchangeRate = await fetch(BNR_EXCHANGE);
    const xmlExchangeData = new XMLParser().parse(await exchangeRate.text());
    // aparent, BNR aranjeaza cursul valutar in ordinea alfabetica a prescurtarii monedelor
    // fast-xml-parser creeaza un array din lista de curs valutar. Euro ar fi pozitia 11 din lista
    const cursEuro = xmlExchangeData.DataSet.Body.Cube.Rate[10];
    const moneda = monede[parsedData[0].currencyCode];
    mailOptions.html = `
      <h1>Salut!</h1>
      <p>Ăsta este email-ul regulat în legătură cu starea 'portofoliului' de investiții (sau de bani aruncați pe geam).</p>
      <p>Pentru suma totală, în lei, transferată spre Trading212, vezi pe <b>Revolut</b>.</p>

      <table border='1' style="width: 100%;">
        <tr>
          <th>Nefolosiți</th>
          <th>Investiți</th>
          <th>Profit (ppl)</th>
          <th style="background-color: #5DADE2;">Total</th>
        </tr>

        <tr>
          <td>${parsedData[1].free} ${moneda}</td>
          <td>${parsedData[1].invested} ${moneda}</td>
          <td>${parsedData[1].ppl} ${moneda}</td>
          <td style="background-color: #5DADE2;">${parsedData[1].total} ${moneda}</td>
        </tr>
      </table>

      <p>Curs Euro - RON în ziua curentă: <u style="background-color: #5DADE2;"><b>${cursEuro}</b></u>.</p>
      <ul>
        <li>Procent profit generat: <u style="background-color: #28B463;"><b>${((parsedData[1].ppl / parsedData[1].invested) * 100).toFixed(4)}</b></u>%</li>
        <li>Profit convertit: <u style="background-color: #5DADE2;"><b>${(parsedData[1].ppl * cursEuro).toFixed(2)}</b></u> RON</li>
        <li>Total cont convertit: <u style="background-color: #5DADE2;"><b>${(parsedData[1].total * cursEuro).toFixed(2)}</b></u> RON</li>
      </ul>

      <hr>
      <h5>Distribuire</h5>

      <table border="1" style="width: 100%">
        <tr>
          <th>Ticker</th>
          <th>Qty.</th>
          <th>Preț Avg.</th>
          <th>Preț curent</th>
          <th style="background-color: #5DADE2;">Profit</th>
        </tr>

        ${parsedData[2].map((el) => `
            <tr>
              <td>${el.ticker}</td>
              <td>${el.quantity}</td>
              <td>${(el.averagePrice).toFixed(2)} ${moneda}</td>
              <td>${(el.currentPrice).toFixed(2)} ${moneda}</td>
              <td style="background-color: #5DADE2;">${el.ppl} ${moneda}</td>
            </tr>
          `)}
      </table>

      <br>
      <hr>

      <p>Sumele prezentate sunt cele de la data de: <b>${new Date().toDateString()}</b>. Ține minte că ele variază zilnic!</p>
    `;
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        throw err;
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });
  } catch (err) {
    mailOptions.html = `<h1>Eroare la fetch data</h1>
    <p>Mai jos e o parte din obiectul de err din catch.</p>
    <div>${err}</div>`;

    transporter.sendMail(mailOptions, (e, info) => {
      if (e) {
        console.log(e);
      } else {
        console.log(`Email error sent: ${info.response}`);
      }
    });
  }
}

module.exports = fetchTrading212Data;
