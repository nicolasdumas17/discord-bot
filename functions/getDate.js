const fullDate = new Date().toISOString().split('T');
const date = fullDate[0];
const hour = fullDate[1].split('.')[0];

const getDate = date + ' ' + hour;

module.exports = {getDate: getDate};