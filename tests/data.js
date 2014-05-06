var fs = require('fs'),
    data = { tables: {}, trees: {} };

data.tables.countryPopulations = {
  'rows': [
    { 'Country': 'in', 'Pop': 1.237 },
    { 'Country': 'cn', 'Pop': 1.351 },
    { 'Country': 'us', 'Pop': 0.3139 }
  ],
  'dimensionColumns': [
    {
      'column': 'Country',
      'dimension': 'Space',
      'codeList': 'countryCode'
    }
  ],
  'measureColumns': [
    {
      'column': 'Pop',
      'measure': 'Population',
      'scale': 1000000000
    }
  ]
};
data.tables.countryGDP = {
  'rows': [
    { 'name': 'China', 'gdp': 12261 },
    { 'name': 'India', 'gdp': 4716 },
    { 'name': 'United States of America', 'gdp': 16244 }
  ],
  'dimensionColumns': [
    {
      'column': 'name',
      'dimension': 'Space',
      'codeList': 'countryName'
    }
  ],
  'measureColumns': [
    {
      'column': 'gdp',
      'measure': 'Gross Domestic Product',
      'scale': 1000
    }
  ]
};
data.tables.countryNamesAndCodes = {
  'dimensionColumns': [
    { 'dimension': 'Space', 'codeList': 'countryName', 'column': 'Country' },
    { 'dimension': 'Space', 'codeList': 'countryCode', 'column': 'Code' }
  ],
  'rows': [
    { 'Country': 'India', 'Code': 'in' },
    { 'Country': 'China', 'Code': 'cn' },
    { 'Country': 'United States of America', 'Code': 'us' }
  ]
};
data.tables.unUsLocations = {
  'dimensionColumns': [
    { 'dimension': 'Space', 'codeList': 'countryName', 'column': 'unName' },
    { 'dimension': 'Space', 'codeList': 'usLocationName', 'column': 'usName' }
  ],
  'rows': [
    { 'unName': 'United States of America', 'usName': 'USA' }
  ]
};
data.trees.unLocations = {
 'dimension': 'Space',
 'codeList': 'countryName',
 'code': 'World',
 'children': [
  {
   'code': 'Asia',
   'children': [
    {
     'code': 'Southern Asia',
     'children': [
      {'code': 'India'},
     ]
    },
    {
     'code': 'Eastern Asia',
     'children': [
      {'code': 'China'},
     ]
    }
   ]
  },
  {
   'code': 'Americas',
   'children': [
    {
     'code': 'Northern America',
     'children': [
      {'code': 'United States of America'}
     ]
    }
   ]
  }
 ]
};
data.trees.usLocations = {
 'dimension': 'Space',
 'codeList': 'usLocationName',
 'code': 'USA',
 'children': [
  { 'code': 'California' },
  { 'code': 'Texas' },
  { 'code': 'New York' }
 ]
};
data.load = loadTable;

function loadTable(path, callback){
  loadCSV(path + '.csv', function (rows) {
    loadJSON(path + '.json', function (table) {
      table.rows = rows;
      callback(table);
    });
  });
}

function loadCSV(path, callback){
  input(path, function (data){
    callback(parseCSVTable(data));
  });
}

function loadJSON(path, callback){
  input(path, function (data){
    callback(JSON.parse(data));
  });
}

function input(name, callback){
  fs.readFile(name, 'utf8', function (err, data) {
    if(err) throw err;
    callback(data);
  });
}

function parseCSVTable(data){
  var rows = data.split('\n').filter(function (row) {
        return row.length > 0;
      }),
      header = rows.splice(0, 1)[0],
      properties = parseCSVRow(header);
  return rows.map(function (rowStr) {
    var values = parseCSVRow(rowStr);
    var row = {};
    properties.forEach(function (property, i) {
      row[property] = values[i];
    });
    return row;
  });
}

// Parse a CSV row, accounting for commas inside quotes
function parseCSVRow(row){
  var insideQuote = false,
      entries = [],
      entry = [];
  row.split('').forEach(function (character) {
    if(character === '"') {
      insideQuote = !insideQuote;
    } else {
      if(character == "," && !insideQuote) {
        entries.push(entry.join(''));
        entry = [];
      } else {
        entry.push(character);
      }
    }
  });
  entries.push(entry.join(''));
  return entries;
}

module.exports = data;
