const express = require('express');
const router = express.Router();
const {
  getExpenditures,
  getExpenditureById,
  submitExpenditure,
  approveExpenditure,
  rejectExpenditure,
  verifyExpenditure,
  finalizeExpenditure,
  resubmitExpenditure,
  getExpenditureStats
} = require('../controllers/expenditureController');
const { verifyToken, authorize } = require('../middleware/auth');
const { handleFileUpload } = require('../middleware/fileUpload');

// All routes require authentication
router.use(verifyToken);

const attachFilesToBody = (req, res, next) => {
  if (req.uploadedFiles) {
    req.body.attachments = req.uploadedFiles;
  }
  next();
};

// Get expenditures (all authenticated users)
router.get('/', getExpenditures);
router.get('/stats', getExpenditureStats);
router.get('/:id', getExpenditureById);

// Submit expenditure (department users only)
router.post('/',
  authorize('department'),
  handleFileUpload,
  attachFilesToBody,
  submitExpenditure
);

// Resubmit expenditure (department users only)
router.post('/:id/resubmit',
  authorize('department'),
  handleFileUpload,
  attachFilesToBody,
  resubmitExpenditure
);

// Verify expenditure (HOD only)
router.put('/:id/verify', authorize('hod'), verifyExpenditure);

// Approve expenditure (Vice Principal, Principal)
router.put('/:id/approve',
  authorize('vice_principal', 'principal'),
  approveExpenditure
);

// Reject expenditure (Office, Vice Principal, Principal, HOD)
router.put('/:id/reject',
  authorize('office', 'vice_principal', 'principal', 'hod'),
  rejectExpenditure
);

module.exports = router;
