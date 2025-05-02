import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';

interface LeaveRequest {
  id: number;
  employeeId: number;
  type: string;
  dateFiled: string;
  period: string;
  requested: string;
  status: string;
  reason: string;
  remarks: string;
}

const ToDoLeaveApproval: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:4000/api/leaves/pending');
      setLeaveRequests(response.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError('Failed to fetch leave requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: LeaveRequest) => {
    try {
      setLoading(true);
      await axios.put(`http://localhost:4000/api/leaves/${request.id}/approve`, {
        remarks,
      });
      fetchLeaveRequests();
      setOpenDialog(false);
      setRemarks('');
    } catch (error) {
      console.error('Error approving leave request:', error);
      setError('Failed to approve leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (request: LeaveRequest) => {
    try {
      setLoading(true);
      await axios.put(`http://localhost:4000/api/leaves/${request.id}/reject`, {
        remarks,
      });
      fetchLeaveRequests();
      setOpenDialog(false);
      setRemarks('');
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      setError('Failed to reject leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setRemarks('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        Leave Approval Requests
      </Typography>

      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          {error}
        </Box>
      )}

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          boxShadow: 3,
          '& .MuiTableCell-root': {
            py: 2,
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Leave Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date Filed</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Period</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Requested Days</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reason</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : leaveRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No pending leave requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              leaveRequests.map((request) => (
                <TableRow 
                  key={request.id}
                  hover
                  sx={{ 
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <TableCell>{request.employeeId}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>{request.dateFiled}</TableCell>
                  <TableCell>{request.period}</TableCell>
                  <TableCell>{request.requested}</TableCell>
                  <TableCell>
                    <Chip 
                      label={request.status}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={request.reason}>
                      <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {request.reason}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Approve">
                        <IconButton
                          color="success"
                          onClick={() => handleOpenDialog(request)}
                          size="small"
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          color="error"
                          onClick={() => handleOpenDialog(request)}
                          size="small"
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {selectedRequest && `Leave Request - ${selectedRequest.type}`}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Employee ID: {selectedRequest?.employeeId}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Period: {selectedRequest?.period}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Requested Days: {selectedRequest?.requested}
            </Typography>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            fullWidth
            multiline
            rows={4}
            value={remarks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => selectedRequest && handleApprove(selectedRequest)}
            variant="contained"
            color="success"
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            disabled={loading}
          >
            Approve
          </Button>
          <Button
            onClick={() => selectedRequest && handleReject(selectedRequest)}
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={20} /> : <Cancel />}
            disabled={loading}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ToDoLeaveApproval;