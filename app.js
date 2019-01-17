var cron = require('node-cron');

var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
  process.env.AIRTABLE_BASE
);
var _ = require('lodash');
const mailjet = require('node-mailjet')
  .connect(process.env.MAILJET_KEY_1, process.env.MAILJET_KEY_2);

var http = require("http");

setInterval(function() {
   http.get("http://spyker.herokuapp.com");
   console.log('pinging...');
}, 1800);

const start = () => {  
  console.log('starting');
  let allDeals = [];
  let allUsers = [];

  const deals = base('Deals').select({
    view: "Grid view"
  }).eachPage(function page(records, fetchNextPage) {
    allDeals = [...allDeals, ...records]
    fetchNextPage();
  }, function done(err) {
    if (err) {
      console.error(err); return;
    }
    const users = base('User data').select({
      view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
      allUsers = [...allUsers, ...records]
      fetchNextPage();
    }, function done(err) {
      if (err) {
        console.error(err); return;
      }
      checkForAllDeals(allUsers, allDeals);
    })
  });
}

const checkForAllDeals = (users, deals) => {
  users.map(user => checkForDeals(user, deals))
}

const checkForDeals = (record, deals) => {
  const oldP1 = record.get('P1');
  const oldP2 = record.get('P2');
  const oldP3 = record.get('P3');

  deals.map(deal => {
    if (record.get('P1-complete') === 0) {
      compareDeal(base('User data'), record, deal.get('Name'), 'P1', deal);
    }
    if (record.get('P2-complete') === 0) {
      compareDeal(base('User data'), record, deal.get('Name'), 'P2', deal);
    }
    if (record.get('P3-complete') === 0) {
      compareDeal(base('User data'), record, deal.get('Name'), 'P3', deal);
    }
  });
};

const compareDeal = (base, record, dealTitle, customerProductNo, dealObj) => {
  if (
    dealTitle
      .toLowerCase()
      .includes(record.get(customerProductNo).toLowerCase())
  ) {
    const updateObj = {};
    console.log('YO er is een deal voor ' + record.get('First Name') + ' voor ' + dealTitle);
    updateObj[customerProductNo + '-complete'] = 1;
    base.update(record.id, updateObj);
    sendMail(record.get('Email'), record.get('First name'), dealTitle, dealObj);
  }
};

const sendMail = (email, name, productTitle, deal) => {
  const request = mailjet
    .post("send", { 'version': 'v3.1' })
    .request({
      "Messages": [
        {
          "From": {
            "Email": "zenno.bruinsma@gmail.com",
            "Name": "Spyker team"
          },
          "To": [
            {
              "Email": email,
              "Name": name
            }
          ],
          "TemplateID": 626166,
          "TemplateLanguage": true,
          "Subject": "Spyker - " + productTitle + " aanbieding!",
          "Variables": {
            "product": productTitle,
            "name": name,
            "store": deal.get('supermarket'),
            "description": deal.get('description'),
            "deal": deal.get('Name'),
            "price_to": deal.get('priceTo'),
            "price_from": deal.get('priceFrom'),
            "valid_to": deal.get('validUntil')
          }
        }
      ]
    })

  request
    .then((result) => {
      console.log(result.body)
    })
    .catch((err) => {
      console.log(err)
    })
};

cron.schedule('* * * * *', () => {
  start();
});
