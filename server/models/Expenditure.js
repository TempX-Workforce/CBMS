const mongoose = require('mongoose');

const approvalStepSchema = new mongoose.Schema({
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  decision: {
    type: String,
    enum: ['approve', 'reject', 'verify'],
    required: true
  },
  remarks: {
    type: String,
    required: function () {
      return this.decision === 'reject';
    },
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const expenditureSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  budgetHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BudgetHead',
    required: [true, 'Budget head is required']
  },
  billNumber: {
    type: String,
    required: [true, 'Bill number is required'],
    trim: true
  },
  billDate: {
    type: Date,
    required: [true, 'Bill date is required']
  },
  billAmount: {
    type: Number,
    required: [true, 'Bill amount is required'],
    min: [0, 'Bill amount cannot be negative']
  },
  partyName: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true
  },
  expenseDetails: {
    type: String,
    required: [true, 'Expense details are required'],
    trim: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  referenceBudgetRegisterNo: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'approved', 'finalized', 'rejected'],
    default: 'pending'
  },
  currentStep: {
    type: Number,
    default: 0
  },
  approvalSteps: [approvalStepSchema],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  financialYear: {
    type: String,
    required: true
  },
  isResubmission: {
    type: Boolean,
    default: false
  },
  originalExpenditureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expenditure'
  }
}, {
  timestamps: true
});

// Index for better query performance
expenditureSchema.index({ department: 1 });
expenditureSchema.index({ budgetHead: 1 });
expenditureSchema.index({ status: 1 });
expenditureSchema.index({ submittedBy: 1 });
expenditureSchema.index({ financialYear: 1 });
expenditureSchema.index({ billDate: 1 });

// Compound index for department submissions
expenditureSchema.index({ department: 1, status: 1 });
expenditureSchema.index({ department: 1, financialYear: 1 });

// Pre-save middleware to set financial year based on bill date
expenditureSchema.pre('save', function (next) {
  if (this.billDate && !this.financialYear) {
    const year = this.billDate.getFullYear();
    const month = this.billDate.getMonth() + 1; // 0-indexed

    // Financial year runs from April to March
    if (month >= 4) {
      this.financialYear = `${year}-${year + 1}`;
    } else {
      this.financialYear = `${year - 1}-${year}`;
    }
  }
  next();
});

module.exports = mongoose.model('Expenditure', expenditureSchema);
