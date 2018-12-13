var cron = require('node-cron');
const sendGridAPI =
  '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';
const templateID = '';

var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyer1jczZsNjdA4C' }).base(
  'apperUKb615OJ5vIW'
);
var _ = require('lodash');
const sgMail = require('@sendgrid/mail');

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

const start = () => {
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
  console.log(users.length, deals.length);
  users.map(user => checkForDeals(user, deals))
}

const checkForDeals = (record, deals) => {
  const oldP1 = record.get('P1');
  const oldP2 = record.get('P2');
  const oldP3 = record.get('P3');

  deals.map(deal => {
    if (record.get('P1-complete') === 0) {
      compareDeal(base('User data'), record, deal.get('Name'), 'P1');
    }
    if (record.get('P2-complete') === 0) {
      compareDeal(base('User data'), record, deal.get('Name'), 'P2');
    }
    if (record.get('P3-complete') === 0) {
      compareDeal(base('User data'), record, deal.get('Name'), 'P3');
    }
  });
};

const compareDeal = (base, record, dealTitle, customerProductNo) => {
  if (
    dealTitle
      .toLowerCase()
      .includes(record.get(customerProductNo).toLowerCase())
  ) {
    const updateObj = {};
    updateObj[customerProductNo + '-complete'] = 1;
    base.update(record.id, updateObj);
    sendMail(record.get('Email'), record.get('Name'), dealTitle);
  }
};

const sendMail = (email, name, productTitle) => {
  console.log('Mailtje', email, productTitle);
  sgMail.setApiKey(sendGridAPI);

  const msg = {
    to: 'zenno@storyofams.com',
    from: 'sender@example.org',
    templateId: 'd-ffe6708f1cf14057ad8b28bd06882140',
    dynamic_template_data: {
      subject: 'Testing Templates',
      name: name,
      product: productTitle
    }
  };
  sgMail.send(msg);
};

// cron.schedule('* * * * *', () => {
//   start();
// });

start();
