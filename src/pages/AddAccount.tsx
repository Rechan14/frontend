import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const roles = ["Admin", "User"];
const department = ["Accountant", "IT", "Associate", "Operations"];

interface AddAccountProps {
  onAddAccount: (account: any) => void;
}

const AddAccount: React.FC<AddAccountProps> = ({ onAddAccount }) => {
  const [newAccount, setNewAccount] = useState({
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "",
    department: "",
    employmentType: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    postalCode: "",
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token missing. Please log in.", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded.role) setUserRole(decoded.role);
    } catch (error) {
      console.error("Token decoding error:", error);
      toast.error("Error decoding the token.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  }, []);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch countries");
        }
        return res.json();
      })
      .then((data) => {
        const countryNames = data.map((country: any) => country.name.common);
        setCountries(countryNames.sort());
      })
      .catch((error) => {
        toast.error("Failed to load countries. Please try again later.", {
          position: "bottom-right",
          autoClose: 3000,
        });
        console.error("Error fetching countries:", error);
      });
  }, []);

  useEffect(() => {
    if (newAccount.country) {
      fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country: newAccount.country }),
      })
        .then((res) => res.json())
        .then((data) => setCities(data.data || []))
        .catch((error) => {
          toast.error("Failed to load cities. Please try again later.", {
            position: "bottom-right",
            autoClose: 3000,
          });
          console.error("Error fetching cities:", error);
        });
    }
  }, [newAccount.country]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    let errorMessage = "";

    if (!value.trim()) {
      const fieldNames: { [key: string]: string } = {
        title: "Title",
        firstName: "First Name",
        lastName: "Last Name",
        phone: "Phone Number",
        role: "Role",
        department: "Department",
        employmentType: "Employment Type",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        country: "Country",
        city: "City",
        postalCode: "Postal Code"
      };
      
      errorMessage = `${fieldNames[name]} is required`;
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 3000,
      });
    } else {
      if (name === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
        errorMessage = "Invalid email format";
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
      if (name === "password" && value.length < 6) {
        errorMessage = "Password must be at least 6 characters";
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
      if (name === "confirmPassword" && value !== newAccount.password) {
        errorMessage = "Passwords do not match";
        toast.error(errorMessage, {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
    }

    setErrors((prev) => ({ ...prev, [name]: errorMessage }));
  };

  const isFormValid = () => {
    const requiredFields = [
      "title",
      "firstName",
      "lastName",
      "phone",
      "role",
      "employmentType",
      "email",
      "password",
      "confirmPassword",
      "country",
      "city",
      "postalCode",
    ];
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!newAccount[field as keyof typeof newAccount].trim()) {
        const fieldNames: { [key: string]: string } = {
          title: "Title",
          firstName: "First Name",
          lastName: "Last Name",
          phone: "Phone Number",
          role: "Role",
          department: "Department",
          employmentType: "Employment Type",
          email: "Email",
          password: "Password",
          confirmPassword: "Confirm Password",
          country: "Country",
          city: "City",
          postalCode: "Postal Code"
        };
        
        newErrors[field] = `${fieldNames[field]} is required`;
        toast.error(`${fieldNames[field]} is required`, {
          position: "bottom-right",
          autoClose: 3000,
        });
        isValid = false;
      }
    });

    if (newAccount.password !== newAccount.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      toast.error("Passwords do not match", {
        position: "bottom-right",
        autoClose: 3000,
      });
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddAccount = async () => {
    if (!isFormValid()) return;
  
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found!", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }
  
    if (!userRole || userRole !== "Admin") {
      toast.error("Unauthorized: Only admins can create new accounts.", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }
  
    try {
      setLoading(true);
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
  
      const response = await fetch("http://localhost:4000/accounts", {
        method: "POST",
        headers,
        body: JSON.stringify(newAccount),
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        
        // Check if the error is about duplicate email
        if (response.status === 400 && errorMessage.includes("email")) {
          throw new Error("This email is already registered.");
        }
  
        // Handle other errors
        throw new Error(`Failed to add account: ${response.status} - ${errorMessage}`);
      }
  
      await response.json();
      toast.success("Account added successfully!", {
        position: "bottom-right",
        autoClose: 2000,
      });
  
      setTimeout(() => {
        window.location.href = "/workforce";
      }, 1000);
    } catch (error: any) {
      // Check for specific duplicate email error
      const message = error.message === "This email is already registered."
        ? "This email is already registered. Please use a different email."
        : error.message || "Failed to add account. Please try again.";
  
      toast.error(message, {
        position: "bottom-right",
        autoClose: 3000,
      });
  
      console.error("Error adding account:", message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <PageBreadcrumb pageTitle="Home / Accounts / Add Account" />
      <div className="p-8 rounded-xl shadow-xl w-full max-w-4xl mx-auto bg-gray-800 dark:text-gray-300">
        <h3 className="text-2xl font-semibold text-gray-100 mb-6">Add Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[{ label: "Title", name: "title", type: "select", options: ["Mr", "Mrs", "Miss", "Ms"] },
            { label: "First Name", name: "firstName", type: "text" },
            { label: "Last Name", name: "lastName", type: "text" },
            { label: "Phone", name: "phone", type: "text" },
            { label: "Role", name: "role", type: "select", options: roles },
            { label: "Employment Type", name: "employmentType", type: "select", options: ["Open-Shifts", "Regular", "Part-Time", "Apprenticeship"] },
            { label: "Department", name: "department", type: "select", options: department },
            { label: "Email", name: "email", type: "email" },
            { label: "Password", name: "password", type: "password" },
            { label: "Confirm Password", name: "confirmPassword", type: "password" },
            { label: "Country", name: "country", type: "select", options: countries },
            { label: "City", name: "city", type: "select", options: cities },
            { label: "Postal Code", name: "postalCode", type: "text" }].map(({ label, name, type, options }) => (
            <div key={name} className="flex flex-col">
              <label className="font-semibold text-gray-300">{label}</label>
              {type === "select" ? (
                <select
                  name={name}
                  value={newAccount[name as keyof typeof newAccount]}
                  onChange={handleInputChange}
                  className="border p-3 w-full bg-gray-700 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select {label}</option>
                  {options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  name={name}
                  placeholder={label}
                  className="border p-3 w-full bg-gray-700 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAccount[name as keyof typeof newAccount]}
                  onChange={handleInputChange}
                />
              )}
              {errors[name] && <p className="text-red-500 text-xs">{errors[name]}</p>}
            </div>
          ))}
        </div>
        <button
          onClick={handleAddAccount}
          disabled={loading}
          className="mt-8 py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {loading ? "Adding Account..." : "Add Account"}
        </button>
        <ToastContainer />
      </div>
    </>
  );
};

export default AddAccount;