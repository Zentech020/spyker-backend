var cron = require('node-cron');

var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyer1jczZsNjdA4C' }).base(
  'apperUKb615OJ5vIW'
);
var _ = require('lodash');
const mailjet = require('node-mailjet')
  .connect("75ca55cb6caac913e69197ee2ded0739", "ebcbaa652b9712fb8068f64432c5d36d");

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
