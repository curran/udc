var data = { tables: {}, trees: {} };

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
module.exports = data;
