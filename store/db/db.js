// db.js
const knex = require('knex')({
  client: 'mysql2', // oder 'pg'
  connection: { host:'localhost', user:'root', password:'', database:'shop' }
});

async function loadItemByCode(code) {
  return knex('items').where({ code }).first();
}

module.exports = { knex, loadItemByCode };

