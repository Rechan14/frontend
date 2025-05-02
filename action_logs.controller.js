// ... existing code ...
    // Save attendance and approve log
    await attendance.save({ transaction });
    actionLog.status = "approved";
    await actionLog.save({ transaction });

    // Update attendance status to approved
    attendance.status = "approved";
    await attendance.save({ transaction });

    await transaction.commit();
// ... existing code ...

// Reject shift change
router.put("/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { ActionLog, Attendance, sequelize } = await db;
  const transaction = await sequelize.transaction();

  try {
    // Find the action log to reject
    const actionLog = await ActionLog.findByPk(id, { transaction });
    if (!actionLog) return res.status(404).send("Action log not found");

    // Find the associated attendance record
    const attendance = await Attendance.findByPk(actionLog.attendanceId, { transaction });
    if (attendance) {
      attendance.status = "rejected";
      await attendance.save({ transaction });
    }

    actionLog.status = "rejected";
    await actionLog.save({ transaction });

    await transaction.commit();
    res.send("Shift change rejected.");
  } catch (error) {
    console.error("Reject Error:", error);
    await transaction.rollback();
    res.status(500).send("Error rejecting shift change.");
  }
}); 