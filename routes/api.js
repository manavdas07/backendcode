const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Utility function to get date range for a month
const getDateRange = (month) => {
  const year = new Date().getFullYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return { startDate, endDate };
};

// List all transactions with search and pagination
router.get('/transactions', async (req, res) => {
  const { month, page = 1, per_page = 10, search = '' } = req.query;
  const { startDate, endDate } = getDateRange(month);

  const query = {
    dateOfSale: { $gte: startDate, $lt: endDate },
    $or: [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { price: new RegExp(search, 'i') },
    ],
  };

  const transactions = await Transaction.find(query)
    .skip((page - 1) * per_page)
    .limit(parseInt(per_page));
  res.json(transactions);
});

// Get statistics
router.get('/statistics', async (req, res) => {
  const { month } = req.query;
  const { startDate, endDate } = getDateRange(month);

  const totalSales = await Transaction.aggregate([
    { $match: { dateOfSale: { $gte: startDate, $lt: endDate }, sold: true } },
    { $group: { _id: null, total: { $sum: '$price' } } },
  ]);

  const totalSoldItems = await Transaction.countDocuments({
    dateOfSale: { $gte: startDate, $lt: endDate },
    sold: true,
  });

  const totalNotSoldItems = await Transaction.countDocuments({
    dateOfSale: { $gte: startDate, $lt: endDate },
    sold: false,
  });

  res.json({
    totalSales: totalSales[0]?.total || 0,
    totalSoldItems,
    totalNotSoldItems,
  });
});

// Get bar chart data
router.get('/barchart', async (req, res) => {
  const { month } = req.query;
  const { startDate, endDate } = getDateRange(month);

  const priceRanges = [
    { label: '0-100', min: 0, max: 100 },
    { label: '101-200', min: 101, max: 200 },
    { label: '201-300', min: 201, max: 300 },
    { label: '301-400', min: 301, max: 400 },
    { label: '401-500', min: 401, max: 500 },
    { label: '501-600', min: 501, max: 600 },
    { label: '601-700', min: 601, max: 700 },
    { label: '701-800', min: 701, max: 800 },
    { label: '801-900', min: 801, max: 900 },
    { label: '901-above', min: 901, max: Infinity },
  ];

  const result = await Promise.all(
    priceRanges.map(async (range) => {
      const count = await Transaction.countDocuments({
        dateOfSale: { $gte: startDate, $lt: endDate },
        price: { $gte: range.min, $lt: range.max },
      });
      return { range: range.label, count };
    })
  );

  res.json(result);
});

// Get pie chart data
router.get('/piechart', async (req, res) => {
  const { month } = req.query;
  const { startDate, endDate } = getDateRange(month);

  const categories = await Transaction.aggregate([
    { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  res.json(categories.map(({ _id, count }) => ({ category: _id, count })));
});

// Get combined data
router.get('/combined', async (req, res) => {
  const { month } = req.query;
  const { startDate, endDate } = getDateRange(month);

  const statistics = await Transaction.aggregate([
    { $match: { dateOfSale: { $gte: startDate, $lt: endDate }, sold: true } },
    { $group: { _id: null, total: { $sum: '$price' } } },
  ]);

  const totalSoldItems = await Transaction.countDocuments({
    dateOfSale: { $gte: startDate, $lt: endDate },
    sold: true,
  });

  const totalNotSoldItems = await Transaction.countDocuments({
    dateOfSale: { $gte: startDate, $lt: endDate },
    sold: false,
  });

  const priceRanges = [
    { label: '0-100', min: 0, max: 100 },
    { label: '101-200', min: 101, max: 200 },
    { label: '201-300', min: 201, max: 300 },
    { label: '301-400', min: 301, max: 400 },
    { label: '401-500', min: 401, max: 500 },
    { label: '501-600', min: 501, max: 600 },
    { label: '601-700', min: 601, max: 700 },
    { label: '701-800', min: 701, max: 800 },
    { label: '801-900', min: 801, max: 900 },
    { label: '901-above', min: 901, max: Infinity },
  ];

  const barChart = await Promise.all(
    priceRanges.map(async (range) => {
      const count = await Transaction.countDocuments({
        dateOfSale: { $gte: startDate, $lt: endDate },
        price: { $gte: range.min, $lt: range.max },
      });
      return { range: range.label, count };
    })
  );

  const categories = await Transaction.aggregate([
    { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  res.json({
    statistics: {
      totalSales: statistics[0]?.total || 0,
      totalSoldItems,
      totalNotSoldItems,
    },
    barChart,
    pieChart: categories.map(({ _id, count }) => ({ category: _id, count })),
  });
});

module.exports = router;
