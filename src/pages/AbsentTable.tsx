import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface AbsentUser {
  id: number;
  employeeId: number;
  firstName: string;
  lastName: string;
  department: string;
  employmentType: string;
  date: string;
  reason?: string;
}

const AbsentTable: React.FC = () => {
  const [absentUsers, setAbsentUsers] = useState<AbsentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [filter, setFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    fetchAbsentUsers();
  }, [selectedDate]);

  const fetchAbsentUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const date = selectedDate?.format('YYYY-MM-DD');
      const response = await axios.get(`http://localhost:4000/api/attendance/absent?date=${date}`);
      
      // Transform the response data to match the AbsentUser interface
      const absentUsersData = response.data.map((user: any) => ({
        id: user.id,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        employmentType: user.employmentType,
        date: date || '',
        reason: user.reason || 'Not specified'
      }));
      
      setAbsentUsers(absentUsersData);
    } catch (error) {
      console.error('Error fetching absent users:', error);
      setError('Failed to fetch absent users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
  };

  const filteredUsers = absentUsers.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(filter.toLowerCase()) ||
      user.lastName.toLowerCase().includes(filter.toLowerCase()) ||
      user.employeeId.toString().includes(filter);
    
    const matchesDepartment = 
      !departmentFilter || user.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(absentUsers.map(user => user.department))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageBreadcrumb pageTitle="Home / Hours / Absent Table" />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Daily Absence Report</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  sx={{ minWidth: 200 }}
                />
              </LocalizationProvider>

              <TextField
                label="Search"
                variant="outlined"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                sx={{ minWidth: 200 }}
              />

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              <div className="flex justify-between items-center">
                <p>{error}</p>
              </div>
            </div>
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employment Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No absent users found for this date
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      hover
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <TableCell>{user.employeeId}</TableCell>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.employmentType}</TableCell>
                      <TableCell>{user.reason || 'Not specified'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
};

export default AbsentTable;