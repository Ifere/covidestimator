/* eslint-disable linebreak-style */
/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-fallthrough */
/* eslint-disable radix */
/* eslint-disable linebreak-style */
// import parse  from "@babel/core";
const fs = require('fs');
const path = require('path');
const express = require('express');
const xml = require('express-xml-bodyparser');
const exml = require('xml2js');
const logger = require('morgan');


// create a write stream (in append mode)
const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// setup the logger

const app = express();
app.use(logger(':method :url :status :response-time ms', { stream: logStream }));
app.use(express.static('src'));
app.use(express.json());
app.use(xml({ explicitArray: false, normalizeTags: false }));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 8080;


const covid19ImpactEstimator = (data) => {
  const daysConverter = (period, number) => {
    let days;
    switch (period) {
      case 'weeks':
        days = data.timeToElapse * 7;

      case 'months':
        days = data.timeToElapse * 30;

      case 'years':
        if (number >= 4) {
          let count = 0;
          count = parseInt(number / 4);
          days = count + (365 * data.timeToElapse);
        } else {
          days = data.timeToElapse * 365;
        }

      default:
        days = data.timeToElapse;
    }
    return days;
  };

  const days = daysConverter(data.periodType, data.timeToElapse);

  const impact = {
    currentlyInfected: parseInt(data.reportedCases * 10),
    infectionsByRequestedTime: parseInt((data.reportedCases * 10) * (2) ** parseInt(days / 3)),
    severeCasesByRequestedTime: parseInt(0.15 * ((data.reportedCases * 10) * (2) ** parseInt(days / 3))),
    hospitalBedsByRequestedTime: parseInt(parseInt(data.totalHospitalBeds * 0.35) - (0.15 * ((data.reportedCases * 10) * (2) ** parseInt(days / 3)))),
    casesForICUByRequestedTime: parseInt(0.05 * ((data.reportedCases * 10) * (2) ** parseInt(days / 3))),
    casesForVentilatorsByRequestedTime: parseInt(0.02 * ((data.reportedCases * 10) * (2) ** parseInt(days / 3))),
    dollarsInFlight: parseInt((((data.reportedCases * 10) * (2) ** parseInt(days / 3)) * data.region.avgDailyIncomePopulation * data.region.avgDailyIncomeInUSD) * days)
  };

  const severeImpact = {
    currentlyInfected: parseInt(data.reportedCases * 50),
    infectionsByRequestedTime: parseInt((data.reportedCases * 50) * (2) ** parseInt(days / 3)),
    severeCasesByRequestedTime: parseInt(0.15 * ((data.reportedCases * 50) * (2) ** parseInt(days / 3))),
    hospitalBedsByRequestedTime: parseInt(parseInt(data.totalHospitalBeds * 0.35) - (0.15 * (data.reportedCases * 50))),
    casesForICUByRequestedTime: parseInt(0.05 * ((data.reportedCases * 50) * (2) ** parseInt(days / 3))),
    casesForVentilatorsByRequestedTime: parseInt(0.02 * ((data.reportedCases * 50) * (2) ** parseInt(days / 3))),
    dollarsInFlight: parseInt((((data.reportedCases * 50) * (2) ** parseInt(days / 3)) * data.region.avgDailyIncomePopulation * data.region.avgDailyIncomeInUSD) * days)
  };

  return {
    data,
    impact,
    severeImpact
  };
};

const restController = (req, res) => {
  res.type('application/json');
  res.json(covid19ImpactEstimator(req.body.data));
};

const xmlController = (req, res) => {
  const builder = new exml.Builder({ trim: true });
  res.type('application/xml');
  res.send(builder.buildObject(covid19ImpactEstimator(req.body.data)));
};

const logController = (req, res) => {
  res.type('text/*');
  res.sendFile(path.join(__dirname, 'access.log'));
};

app.post('/api/v1/on-covid-19', restController);
app.get('/api/v1/on-covid-19/json', restController);
app.get('/api/v1/on-covid-19/xml', xmlController);
app.get('/api/v1/on-covid-19/logs', logController);

app.listen(port, () => {
  console.log('server is running');
});


// module covid19ImpactEstimator;
