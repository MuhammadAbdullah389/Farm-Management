const mongoose = require('mongoose');

const monthlyReportSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    unique: true, 
  },

  openingBalance: {
    type: Number,
    required: true, 
  },

  netBalance: {
    type: Number,
    required: true, 
  },

  closingBalance: {
    type: Number,
    required: true, 
  },

  startDate: {
    type: String,
    required: true, 
  },

  endDate: {
    type: String,
    required: true, 
  },

  createdAt: {
    type: Date,
    default: Date.now, // Timestamp of when the document was created or updated
  }

});

const MonthlyReport = mongoose.model('MonthlyReport', monthlyReportSchema);

module.exports = MonthlyReport;
