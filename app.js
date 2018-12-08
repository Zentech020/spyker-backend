var cron = require('node-cron');

var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyer1jczZsNjdA4C' }).base(
  'appRhINOAEqDmWAgI'
);
var _ = require('lodash');

const deals = [
  {
    title: 'Coca cola six pack',
    description: 'lorem ipsum cola sixpack',
    image: 'lorem ipsum',
    priceLabel: '2 voor 1',
    oldPrice: '2.18',
    newPrice: '1.50'
  }
];
function start() {
  base('Table 1')
    .select({
      // Selecting the first 3 records in Grid view:
      view: 'Grid view'
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        const allList = records.map(record => {
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

        checkList(allList);

        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
}

function checkList(list) {
  console.log('userList', list);
  console.log('dealList', deals);
}

cron.schedule('* * * * *', () => {
  start();
});
