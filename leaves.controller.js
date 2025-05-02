const express = require('express');
const router = express.Router();
const db = require('../_helpers/db'); // Adjust path if necessary
const leaveService = require('./leave.service'); // Add this line

// Get Pending Leaves
router.get('/pending', async (req, res) => {
  try {
    const pendingLeaves = await leaveService.getPendingLeaves();
    res.status(200).json(pendingLeaves);
  } catch (error) {
    console.error('Error fetching pending leaves:', error);
    res.status(500).json({ message: 'Failed to fetch pending leaves', error });
  }
});

// Approve Leave
router.put('/:id/approve', async (req, res) => {
  try {
    const { remarks } = req.body;
    const updatedLeave = await leaveService.updateLeave(req.params.id, {
      status: 'approved',
      remarks: remarks
    });
    res.status(200).json({ message: 'Leave approved successfully', leave: updatedLeave });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ message: 'Failed to approve leave', error });
  }
});

// Reject Leave
router.put('/:id/reject', async (req, res) => {
  try {
    const { remarks } = req.body;
    const updatedLeave = await leaveService.updateLeave(req.params.id, {
      status: 'rejected',
      remarks: remarks
    });
    res.status(200).json({ message: 'Leave rejected successfully', leave: updatedLeave });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({ message: 'Failed to reject leave', error });
  }
});

// ... rest of your existing code ... 