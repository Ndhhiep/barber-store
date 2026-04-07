const dashboardService = require('../services/dashboardService');
const asyncHandler = require('express-async-handler');

const _error = (res, err) =>
  res.status(500).json({ status: 'error', message: err.message, error: process.env.NODE_ENV === 'development' ? err.message : undefined });

// GET /api/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const data = await dashboardService.getDashboardStats();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    _error(res, error);
  }
});

// GET /api/dashboard/chart-data
const getChartData = asyncHandler(async (req, res) => {
  try {
    const data = await dashboardService.getChartData();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    _error(res, error);
  }
});

// GET /api/dashboard/monthly-revenue
const getMonthlyRevenue = asyncHandler(async (req, res) => {
  try {
    const data = await dashboardService.getMonthlyRevenue();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    _error(res, error);
  }
});

module.exports = { getDashboardStats, getChartData, getMonthlyRevenue };