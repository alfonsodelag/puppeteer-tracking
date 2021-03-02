const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');


// URL we will track
const url = 'https://www.amazon.es/Sony-WH-1000XM3B-Auriculares-inal%C3%A1mbricos-Compatibile/dp/B07GDR2LYK/';

async function configureBrowser() {
  // Creating a browser instance
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      '--disable-setuid-sandbox'
    ],
  });
  // Creating instance of new page
  const page = await browser.newPage();
  // console.log(page);
  await page.goto(url);
  console.log("page loaded");
  return page;
}

async function checkPrice(page) {
  // We need to reload the page
  console.log("reloading");
  await page.reload();
  // Evaluate is a function that provide us content from the website. In our case we want to tget the whole html body from the website
  let html = await page.evaluate(() => document.body.innerHTML);
  // console.log(html);
  console.log("RELOADED!");

  // Getting the id. The "$" is a reference to the Cheerio library ( const $ = cheerio.load(dom); )
  $('#priceblock_ourprice', html).each(function () {
    console.log("FOUND!")
    // ! What is the "this" in this context?
    let dollarPrice = $(this).text();
    console.log(dollarPrice);
    let currentPrice = Number(dollarPrice.replace(/[^0-9,-]+/g, "").replace(/,/g, "."));

    console.log("current price", currentPrice);
    if (currentPrice < 100000) {
      console.log("BUY!!!! " + currentPrice);
      sendNotification(currentPrice);
    }
  });
}

async function startTracking() {
  const page = await configureBrowser();

  let job = new CronJob('* */30 * * * *', function () { //runs every 30 minutes in this config
    checkPrice(page);
  }, null, true, null, null, true);
  job.start();
}

async function sendNotification(price) {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'alfonsodelag1@gmail.com',
        pass: process.env.PASSWORD
      }
    });

    let textToSend = 'Price dropped to ' + price;
    let htmlText = `<a href=\"${url}\">Link</a>`;

    let info = await transporter.sendMail({
      from: 'alfonsodelag1@gmail.com',
      to: 'alfonsodelag1@gmail.com',
      subject: 'Price dropped to ' + price,
      text: textToSend,
      html: htmlText
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.log(error)
  }
}

startTracking();

