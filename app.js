var cron = require('node-cron');

var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyer1jczZsNjdA4C' }).base(
  'appRhINOAEqDmWAgI'
);
var _ = require('lodash');

const deals = [
  {
    title: 'Ariel 3in1 PODS Original',
    description: 'lorem ipsum cola sixpack',
    image: 'lorem ipsum',
    priceLabel: '2 voor 1',
    oldPrice: '2.18',
    newPrice: '1.50'
  }
];

// Is called every day via Heroku CRON job
base('Table 1')
  .select({
    // Selecting the first 3 records in Grid view:
    view: 'Grid view'
  })
  .eachPage(
    function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      const allList = records.map(record => {
        checkForDeals(base('Table 1'), record, deals)

        const list = {
          Name: record.get('Name'),
          Phone: record.get('Phone'),
          Email: record.get('Email'),
          P1: record.get('P1'),
          P2: record.get('P2'),
          P3: record.get('P3')
        };
        return list;
      });

      fetchNextPage();
    },
    function done(err) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );

function checkList(list) {
  console.log('userList', list);
  console.log('dealList', deals);
}

const checkForDeals = (table, record, deals) => {
  const oldP1 = record.get('P1');
  const oldP2 = record.get('P2');
  const oldP3 = record.get('P3');

  deals.map(deal => {
    if (record.get('P1-complete') === 0) {
      (compareDeal(base('Table 1'), record, deal.title, 'P1'));
    }
    if (record.get('P2-complete') === 0) {
      (compareDeal(base('Table 1'), record, deal.title, 'P2'));
    }
    if (record.get('P3-complete') === 0) {
      (compareDeal(base('Table 1'), record, deal.title, 'P3'));
    }
  })
}

const compareDeal = (base, record, dealTitle, customerProductNo) => {
  if (dealTitle.toLowerCase().includes(record.get(customerProductNo).toLowerCase())) {
    const updateObj = {};
    updateObj[customerProductNo + '-complete'] = 1;
    base.update(record.id, updateObj);
    sendMail(record.get('Email'), dealTitle);
  }
}

const sendMail = (email, productTitle) => {
  console.log('Mailtje', email, productTitle);
}
