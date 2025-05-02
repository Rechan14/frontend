const getPendingLeaves = async () => {
  try {
    return await Leave.findAll({ 
      where: { 
        status: 'pending' 
      } 
    });
  } catch (error) {
    console.error('Error fetching pending leaves:', error);
    throw new Error('Error fetching pending leaves');
  }
};

module.exports = {
  createLeave,
  getAllLeaves,
  getLeaveByEmployeeId,
  updateLeave,
  deleteLeave,
  getPendingLeaves,
}; 