const cron = require('node-cron');
const Expenditure = require('../models/Expenditure');
const User = require('../models/User');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../utils/emailService');

// Function to get reminder threshold from settings
const getReminderThreshold = async () => {
    try {
        const setting = await Settings.findOne({ key: 'reminder_threshold_days' });
        return setting ? parseInt(setting.value) : 5; // Default to 5 days
    } catch (error) {
        console.error('Error fetching reminder threshold:', error);
        return 5; // Default fallback
    }
};

// Function to check and send reminders for pending approvals
const checkPendingApprovals = async () => {
    try {
        console.log('[Reminder Service] Checking for pending approvals...');

        const thresholdDays = await getReminderThreshold();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

        // Find expenditures that are pending and older than threshold
        const pendingExpenditures = await Expenditure.find({
            status: { $in: ['pending', 'verified'] },
            createdAt: { $lt: thresholdDate }
        })
            .populate('department', 'name')
            .populate('budgetHead', 'name')
            .populate('submittedBy', 'name email')
            .populate('approvalSteps.approver', 'name email role');

        if (pendingExpenditures.length === 0) {
            console.log('[Reminder Service] No pending approvals found older than', thresholdDays, 'days');
            return;
        }

        console.log(`[Reminder Service] Found ${pendingExpenditures.length} pending approvals older than ${thresholdDays} days`);

        // Group expenditures by next approver
        const approverMap = new Map();

        for (const expenditure of pendingExpenditures) {
            // Determine next approver based on status
            let nextApprover = null;

            if (expenditure.status === 'pending') {
                // Needs HOD approval
                const hodUser = await User.findOne({
                    role: 'hod',
                    department: expenditure.department._id
                });
                nextApprover = hodUser;
            } else if (expenditure.status === 'verified') {
                // Needs Office verification or VP/Principal approval
                const pendingStep = expenditure.approvalSteps.find(
                    step => step.status === 'pending'
                );

                if (pendingStep && pendingStep.approver) {
                    nextApprover = pendingStep.approver;
                } else {
                    // Find office or VP/Principal users
                    const nextUser = await User.findOne({
                        role: { $in: ['office', 'vice_principal', 'principal'] }
                    });
                    nextApprover = nextUser;
                }
            }

            if (nextApprover) {
                if (!approverMap.has(nextApprover._id.toString())) {
                    approverMap.set(nextApprover._id.toString(), {
                        user: nextApprover,
                        expenditures: []
                    });
                }
                approverMap.get(nextApprover._id.toString()).expenditures.push(expenditure);
            }
        }

        // Send reminder emails to each approver
        let remindersSent = 0;
        for (const [approverId, data] of approverMap) {
            const { user, expenditures } = data;

            if (!user.email) continue;

            const subject = `Reminder: You have ${expenditures.length} pending approval(s)`;
            const expenditureList = expenditures
                .map(
                    (exp, index) =>
                        `${index + 1}. Bill #${exp.billNumber} - ${exp.department.name} - ₹${exp.billAmount.toLocaleString('en-IN')} (${Math.ceil(
                            (new Date() - exp.createdAt) / (1000 * 60 * 60 * 24)
                        )} days old)`
                )
                .join('\n');

            const html = `
        <h2>Pending Approval Reminder</h2>
        <p>Dear ${user.name},</p>
        <p>You have <strong>${expenditures.length}</strong> expenditure approval(s) pending for more than ${thresholdDays} days:</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
${expenditureList}
        </pre>
        <p>Please review and approve/reject these approvals at your earliest convenience.</p>
        <p>
          <a href="${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/approvals" 
             style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Pending Approvals
          </a>
        </p>
        <br>
        <p>Best regards,<br>CBMS System</p>
      `;

            try {
                await sendEmail(user.email, subject, html);
                remindersSent++;

                // Log to audit trail
                await AuditLog.create({
                    eventType: 'approval_reminder',
                    actor: null, // System action
                    actorRole: 'system',
                    targetEntity: 'User',
                    targetId: user._id,
                    details: {
                        recipientEmail: user.email,
                        pendingCount: expenditures.length,
                        thresholdDays
                    },
                    ipAddress: 'system',
                    userAgent: 'Cron Job - Reminder Service'
                });

                console.log(`[Reminder Service] Sent reminder to ${user.email} for ${expenditures.length} pending approvals`);
            } catch (emailError) {
                console.error(`[Reminder Service] Failed to send reminder to ${user.email}:`, emailError);
            }
        }

        console.log(`[Reminder Service] Successfully sent ${remindersSent} reminder emails`);
    } catch (error) {
        console.error('[Reminder Service] Error in checkPendingApprovals:', error);
    }
};

// Initialize the cron job
const initReminderService = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('[Reminder Service] Running daily reminder check at', new Date().toISOString());
        await checkPendingApprovals();
    });

    console.log('[Reminder Service] Initialized - will run daily at 9:00 AM');

    // Optional: Run immediately on startup (for testing)
    if (process.env.NODE_ENV === 'development') {
        console.log('[Reminder Service] Running initial check (development mode)...');
        setTimeout(() => {
            checkPendingApprovals();
        }, 5000); // Run after 5 seconds
    }
};

module.exports = {
    initReminderService,
    checkPendingApprovals // Export for manual triggering
};
