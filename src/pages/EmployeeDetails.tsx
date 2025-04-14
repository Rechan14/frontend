import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Account {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  title: string; // Assuming you have a title field in your account data
  role: string;
  country: string;
  city: string;
  department: string;
  employmentType: string;
  postalCode: string;
  email: string;
  phone: string;
  profile_image?: string | null;
}

const EmployeeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve the token (adjust based on where you store it)
        const response = await fetch(`http://localhost:4000/accounts/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Add the token to the request headers
          },
        });
        if (!response.ok) throw new Error("Failed to fetch account details");
        const data: Account = await response.json();
        setAccount(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountDetails();
  }, [id]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      {account && (
        <>
          <div className="flex flex-col items-center mb-6">
            <img
              src={account.profile_image 
                ? `http://localhost:4000${account.profile_image}` 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(account.firstName + " " + account.lastName)}`}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600 shadow-md mb-4"
            />
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {account.firstName} {account.middleName} {account.lastName}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">{account.role} - {account.department}</p>
          </div>

          <div className="space-y-3 text-base text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <p><strong>Title:</strong> {account.title} {account.firstName} {account.lastName}</p>
              <p><strong>Employment Type:</strong> {account.employmentType}</p>
            </div>
            <div className="flex justify-between">
              <p><strong>Email:</strong> {account.email}</p>
              <p><strong>Phone:</strong> {account.phone}</p>
            </div>
            <div className="flex justify-between">
              <p><strong>Country:</strong> {account.country}</p>
              <p><strong>City/State:</strong> {account.city}</p>
            </div>
            <div className="flex justify-between">
              <p><strong>Postal Code:</strong> {account.postalCode}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeDetails;