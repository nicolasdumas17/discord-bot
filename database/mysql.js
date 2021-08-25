const mysql = require('mysql2');
const config = require('../config.json');
 
const pool = mysql.createPool({
  host: config.DBhost,
  user: config.DBlogin,
  database: config.DBname,
  password: config.DBpass,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  supportBigNumbers: true
});

exports.create = (table, fields, values) => {
  pool.query(`INSERT INTO ${table} (${fields}) VALUES (${values})`, function(err, rows) {
    if(err) {
      console.log(err);
    }
    console.log(`La table ${table} a été mise à jour avec succès ! Ajout d'une donnée.`);
  })
};

exports.read = async (table, fields, conditions, orderBy) => {
  let query = `SELECT ${fields} FROM ${table}`;

  if(conditions) {
    query = query +  ` WHERE ${conditions}`;
  }
  if(orderBy) {
    query = query + ` ORDER BY ${orderBy}`;
  }

  const promisePool = pool.promise();
  const [rows] = await promisePool.query(query);
  return rows;
};

exports.update = (table, fields, conditions) => {
  pool.query(`UPDATE ${table} SET ${fields} WHERE ${conditions}`, function(err, rows) {
    if(err) {
      console.log(err);
    }
    console.log(`La table ${table} a été mise à jour avec succès ! Mise à jour d'une donnée.`);
  })
};

exports.delete = (table, conditions) => {
  pool.query(`DELETE FROM ${table} WHERE ${conditions}`, function(err, rows) {
    if(err) {
      console.log(err);
    }
    console.log(`La table ${table} a été mise à jour avec succès ! Suppression d'une donnée.`);
  })
};
