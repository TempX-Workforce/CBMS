const Allocation = require('../models/Allocation');
const Department = require('../models/Department');
const BudgetHead = require('../models/BudgetHead');
const Expenditure = require('../models/Expenditure');
const { recordAuditLog } = require('../utils/auditService');

// @desc    Get all allocations
// @route   GET /api/allocations
// @access  Private/Office
const getAllocations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      financialYear,
      department,
      budgetHead,
      search
    } = req.query;

    const query = {};

    if (financialYear) query.financialYear = financialYear;
    if (department) query.department = department;
    if (budgetHead) query.budgetHead = budgetHead;
    if (search) {
      query.$or = [
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }

    const allocations = await Allocation.find(query)
      .populate('department', 'name code')
      .populate('budgetHead', 'name category')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Allocation.countDocuments(query);

    res.json({
      success: true,
      data: {
        allocations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching allocations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get allocation by ID
// @route   GET /api/allocations/:id
// @access  Private/Office
const getAllocationById = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate('department', 'name code')
      .populate('budgetHead', 'name category')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    // Get related expenditures
    const expenditures = await Expenditure.find({
      department: allocation.department._id,
      budgetHead: allocation.budgetHead._id,
      financialYear: allocation.financialYear
    })
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        allocation,
        expenditures
      }
    });
  } catch (error) {
    console.error('Get allocation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching allocation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new allocation
// @route   POST /api/allocations
// @access  Private/Office
const createAllocation = async (req, res) => {
  const session = await Allocation.startSession();
  session.startTransaction();

  try {
    const {
      financialYear,
      department,
      budgetHead,
      allocatedAmount,
      remarks
    } = req.body;

    // Validate required fields
    if (!financialYear || !department || !budgetHead || !allocatedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Financial year, department, budget head, and allocated amount are required'
      });
    }

    // Check if allocation already exists for this combination
    const existingAllocation = await Allocation.findOne({
      financialYear,
      department,
      budgetHead
    }).session(session);

    if (existingAllocation) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Allocation already exists for this department and budget head in the specified financial year'
      });
    }

    // Validate department exists
    const deptExists = await Department.findById(department).session(session);
    if (!deptExists) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Validate budget head exists
    const budgetHeadExists = await BudgetHead.findById(budgetHead).session(session);
    if (!budgetHeadExists) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Budget head not found'
      });
    }

    const allocation = await Allocation.create([{
      financialYear,
      department,
      budgetHead,
      allocatedAmount: parseFloat(allocatedAmount),
      remarks,
      createdBy: req.user._id
    }], { session });

    await session.commitTransaction();

    const populatedAllocation = await Allocation.findById(allocation[0]._id)
      .populate('department', 'name code')
      .populate('budgetHead', 'name category')
      .populate('createdBy', 'name email');

    // Log the creation
    await recordAuditLog({
      eventType: 'allocation_created',
      req,
      targetEntity: 'Allocation',
      targetId: populatedAllocation._id,
      details: {
        financialYear: populatedAllocation.financialYear,
        department: populatedAllocation.department.name,
        budgetHead: populatedAllocation.budgetHead.name,
        amount: populatedAllocation.allocatedAmount
      },
      newValues: populatedAllocation
    });

    res.status(201).json({
      success: true,
      message: 'Allocation created successfully',
      data: { allocation: populatedAllocation }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating allocation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// @desc    Update allocation
// @route   PUT /api/allocations/:id
// @access  Private/Office
const updateAllocation = async (req, res) => {
  const session = await Allocation.startSession();
  session.startTransaction();

  try {
    const { allocatedAmount, remarks } = req.body;
    const allocationId = req.params.id;

    const allocation = await Allocation.findById(allocationId).session(session);
    if (!allocation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    // Check if new allocated amount is less than already spent amount
    if (allocatedAmount && parseFloat(allocatedAmount) < allocation.spentAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Allocated amount cannot be less than already spent amount'
      });
    }

    const updateData = {};
    if (allocatedAmount !== undefined) updateData.allocatedAmount = parseFloat(allocatedAmount);
    if (remarks !== undefined) updateData.remarks = remarks;
    const previousValues = allocation.toObject();

    const updatedAllocation = await Allocation.findByIdAndUpdate(
      allocationId,
      updateData,
      { new: true, runValidators: true, session }
    )
      .populate('department', 'name code')
      .populate('budgetHead', 'name category')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    // Log the update
    await recordAuditLog({
      eventType: 'allocation_updated',
      req,
      targetEntity: 'Allocation',
      targetId: allocationId,
      details: { updatedFields: Object.keys(updateData) },
      previousValues,
      newValues: updatedAllocation
    });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Allocation updated successfully',
      data: { allocation: updatedAllocation }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating allocation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// @desc    Delete allocation
// @route   DELETE /api/allocations/:id
// @access  Private/Office
const deleteAllocation = async (req, res) => {
  try {
    const allocationId = req.params.id;

    // Check if allocation has expenditures
    const expendituresCount = await Expenditure.countDocuments({
      department: { $exists: true },
      budgetHead: { $exists: true },
      financialYear: { $exists: true }
    });

    if (expendituresCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete allocation with existing expenditures'
      });
    }

    const allocation = await Allocation.findByIdAndDelete(allocationId);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    res.json({
      success: true,
      message: 'Allocation deleted successfully'
    });
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting allocation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get allocation statistics
// @route   GET /api/allocations/stats
// @access  Private/Office
const getAllocationStats = async (req, res) => {
  try {
    const { financialYear } = req.query;

    const query = {};
    if (financialYear) query.financialYear = financialYear;

    const stats = await Allocation.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$allocatedAmount' },
          totalSpent: { $sum: '$spentAmount' },
          totalAllocations: { $sum: 1 }
        }
      }
    ]);

    const departmentStats = await Allocation.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: '$department' },
      {
        $group: {
          _id: '$department._id',
          departmentName: { $first: '$department.name' },
          totalAllocated: { $sum: '$allocatedAmount' },
          totalSpent: { $sum: '$spentAmount' }
        }
      },
      {
        $project: {
          departmentName: 1,
          totalAllocated: 1,
          totalSpent: 1,
          remaining: { $subtract: ['$totalAllocated', '$totalSpent'] },
          utilizationPercentage: {
            $multiply: [
              { $divide: ['$totalSpent', '$totalAllocated'] },
              100
            ]
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalAllocated: 0,
      totalSpent: 0,
      totalAllocations: 0
    };

    result.remaining = result.totalAllocated - result.totalSpent;
    result.utilizationPercentage = result.totalAllocated > 0
      ? (result.totalSpent / result.totalAllocated) * 100
      : 0;

    res.json({
      success: true,
      data: {
        summary: result,
        departmentBreakdown: departmentStats
      }
    });
  } catch (error) {
    console.error('Get allocation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching allocation statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk create allocations
// @route   POST /api/allocations/bulk
// @access  Private/Office
const bulkCreateAllocations = async (req, res) => {
  const session = await Allocation.startSession();
  session.startTransaction();

  try {
    const { allocations } = req.body;

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Allocations array is required'
      });
    }

    const createdAllocations = [];
    const errors = [];

    for (let i = 0; i < allocations.length; i++) {
      const allocationData = allocations[i];

      try {
        // Validate required fields
        if (!allocationData.financialYear || !allocationData.department ||
          !allocationData.budgetHead || !allocationData.allocatedAmount) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Check if allocation already exists
        const existingAllocation = await Allocation.findOne({
          financialYear: allocationData.financialYear,
          department: allocationData.department,
          budgetHead: allocationData.budgetHead
        }).session(session);

        if (existingAllocation) {
          errors.push(`Row ${i + 1}: Allocation already exists for this combination`);
          continue;
        }

        const allocation = await Allocation.create([{
          financialYear: allocationData.financialYear,
          department: allocationData.department,
          budgetHead: allocationData.budgetHead,
          allocatedAmount: parseFloat(allocationData.allocatedAmount),
          remarks: allocationData.remarks || '',
          createdBy: req.user._id
        }], { session });

        createdAllocations.push(allocation[0]);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (createdAllocations.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'No allocations were created',
        errors
      });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: `${createdAllocations.length} allocations created successfully`,
      data: {
        created: createdAllocations.length,
        total: allocations.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk create allocations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating bulk allocations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get year-over-year comparison
// @route   GET /api/allocations/year-comparison
// @access  Private/Office
const getYearComparison = async (req, res) => {
  try {
    const { currentYear, previousYear } = req.query;

    if (!currentYear || !previousYear) {
      return res.status(400).json({
        success: false,
        message: 'Current year and previous year are required'
      });
    }

    // Helper to get dates from financial year string (e.g., "2024-2025")
    const getDatesFromFY = (fy) => {
      // Handle "2024-25" vs "2024-2025" formats
      let startYear, endYear;
      if (fy.includes('-20')) {
        [startYear, endYear] = fy.split('-').map(Number);
      } else {
        const parts = fy.split('-');
        startYear = parseInt(parts[0]);
        endYear = 2000 + parseInt(parts[1]);
      }

      const startDate = new Date(startYear, 3, 1); // April 1st
      const endDate = new Date(endYear, 2, 31, 23, 59, 59); // March 31st
      return { startDate, endDate };
    };

    // Get previous year data
    const prevDates = getDatesFromFY(previousYear);
    const prevAllocations = await Allocation.find({ financialYear: previousYear })
      .populate('department', 'name code')
      .populate('budgetHead', 'name category');

    const prevExpenditures = await Expenditure.find({
      billDate: { $gte: prevDates.startDate, $lte: prevDates.endDate }
    });

    // Get current year data
    const currentDates = getDatesFromFY(currentYear);
    const currentAllocations = await Allocation.find({ financialYear: currentYear })
      .populate('department', 'name code')
      .populate('budgetHead', 'name category');

    const currentExpenditures = await Expenditure.find({
      billDate: { $gte: currentDates.startDate, $lte: currentDates.endDate }
    });

    // Helper to calculate totals
    const calcTotals = (allocs, exps) => {
      const allocated = allocs.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const spent = exps.reduce((sum, e) => sum + e.billAmount, 0);
      const utilization = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
      return { allocated, spent, utilization };
    };

    const prevTotals = calcTotals(prevAllocations, prevExpenditures);
    const currentTotals = calcTotals(currentAllocations, currentExpenditures);

    // Calculate changes
    const calcChange = (curr, prev) => {
      const change = curr - prev;
      const percent = prev > 0 ? ((change / prev) * 100).toFixed(2) : 0;
      return { change, changePercentage: percent, current: curr, previous: prev };
    };

    const overallComparison = {
      currentYear,
      previousYear,
      allocationChange: calcChange(currentTotals.allocated, prevTotals.allocated),
      spendingChange: calcChange(currentTotals.spent, prevTotals.spent),
      utilizationChange: {
        change: (currentTotals.utilization - prevTotals.utilization).toFixed(2),
        current: currentTotals.utilization,
        previous: prevTotals.utilization
      }
    };

    // Department Comparison
    // Get unique departments
    const deptMap = new Set();
    [...prevAllocations, ...currentAllocations].forEach(a => {
      if (a.department) deptMap.add(a.department._id.toString());
    });

    // We need department names, so let's build a map from ID to Name
    const deptNameMap = {};
    [...prevAllocations, ...currentAllocations].forEach(a => {
      if (a.department) deptNameMap[a.department._id.toString()] = a.department.name;
    });

    const departmentComparison = Array.from(deptMap).map(deptId => {
      const pAlloc = prevAllocations.filter(a => a.department && a.department._id.toString() === deptId);
      const cAlloc = currentAllocations.filter(a => a.department && a.department._id.toString() === deptId);

      const pExp = prevExpenditures.filter(e => e.department && e.department.toString() === deptId);
      const cExp = currentExpenditures.filter(e => e.department && e.department.toString() === deptId);

      const pT = calcTotals(pAlloc, pExp);
      const cT = calcTotals(cAlloc, cExp);

      return {
        departmentName: deptNameMap[deptId] || 'Unknown',
        allocationChange: calcChange(cT.allocated, pT.allocated),
        spendingChange: calcChange(cT.spent, pT.spent),
        utilizationChange: {
          change: (cT.utilization - pT.utilization).toFixed(2),
          current: cT.utilization,
          previous: pT.utilization
        }
      };
    });

    // Budget Head Comparison
    const headMap = new Set();
    [...prevAllocations, ...currentAllocations].forEach(a => {
      if (a.budgetHead) headMap.add(a.budgetHead._id.toString());
    });
    const headNameMap = {};
    [...prevAllocations, ...currentAllocations].forEach(a => {
      if (a.budgetHead) headNameMap[a.budgetHead._id.toString()] = a.budgetHead.name;
    });

    const budgetHeadComparison = Array.from(headMap).map(headId => {
      const pAlloc = prevAllocations.filter(a => a.budgetHead && a.budgetHead._id.toString() === headId);
      const cAlloc = currentAllocations.filter(a => a.budgetHead && a.budgetHead._id.toString() === headId);

      const pExp = prevExpenditures.filter(e => e.budgetHead && e.budgetHead.toString() === headId);
      const cExp = currentExpenditures.filter(e => e.budgetHead && e.budgetHead.toString() === headId);

      const pT = calcTotals(pAlloc, pExp);
      const cT = calcTotals(cAlloc, cExp);

      return {
        budgetHeadName: headNameMap[headId] || 'Unknown',
        allocationChange: calcChange(cT.allocated, pT.allocated),
        spendingChange: calcChange(cT.spent, pT.spent),
        utilizationChange: {
          change: (cT.utilization - pT.utilization).toFixed(2),
          current: cT.utilization,
          previous: pT.utilization
        }
      };
    });

    res.json({
      success: true,
      data: {
        overallComparison,
        departmentComparison,
        budgetHeadComparison
      }
    });

  } catch (error) {
    console.error('Get year comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching year comparison',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getAllocationStats,
  bulkCreateAllocations,
  getYearComparison
};
