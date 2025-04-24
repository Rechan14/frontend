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
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

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
    setLoadingCountries(true);
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
      })
      .finally(() => {
        setLoadingCountries(false);
      });
  }, []);

  useEffect(() => {
    if (newAccount.country) {
      setLoadingCities(true);
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
        })
        .finally(() => {
          setLoadingCities(false);
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
    } else {
      switch (name) {
        case "email":
          if (!/^\S+@\S+\.\S+$/.test(value)) {
            errorMessage = "Invalid email format";
          }
          break;
        case "password":
          if (value.length < 6) {
            errorMessage = "Password must be at least 6 characters";
          } else if (!/[A-Z]/.test(value)) {
            errorMessage = "Password must contain at least one uppercase letter";
          } else if (!/[a-z]/.test(value)) {
            errorMessage = "Password must contain at least one lowercase letter";
          } else if (!/[0-9]/.test(value)) {
            errorMessage = "Password must contain at least one number";
          } else if (!/[!@#$%^&*]/.test(value)) {
            errorMessage = "Password must contain at least one special character (!@#$%^&*)";
          }
          break;
        case "phone":
          if (!/^\+?[\d\s-]{10,}$/.test(value)) {
            errorMessage = "Invalid phone number format";
          }
          break;
        case "postalCode":
          if (!/^[A-Z0-9\s-]{3,10}$/.test(value)) {
            errorMessage = "Invalid postal code format";
          }
          break;
        case "confirmPassword":
          if (value !== newAccount.password) {
            errorMessage = "Passwords do not match";
          }
          break;
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
        isValid = false;
      }
    });

    if (newAccount.password !== newAccount.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddAccount = async () => {
    if (!isFormValid()) {
      // Show all errors at once when form is submitted
      Object.entries(errors).forEach(([field, message]) => {
        if (message) {
          toast.error(message, {
            position: "bottom-right",
            autoClose: 3000,
          });
        }
      });
      return;
    }

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
        
        if (response.status === 400 && errorMessage.includes("email")) {
          throw new Error("This email is already registered.");
        }

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
            { label: "Country", name: "country", type: "select", options: countries, loading: loadingCountries },
            { label: "City", name: "city", type: "select", options: cities, loading: loadingCities },
            { label: "Postal Code", name: "postalCode", type: "text" }].map(({ label, name, type, options, loading: isLoading }) => (
            <div key={name} className="flex flex-col">
              <label className="font-semibold text-gray-300">{label}</label>
              {type === "select" ? (
                <div className="relative">
                  <select
                    name={name}
                    value={newAccount[name as keyof typeof newAccount]}
                    onChange={handleInputChange}
                    className={`border p-3 w-full bg-gray-700 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      isLoading ? 'opacity-50' : 'opacity-100'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Select {label}</option>
                    {options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse">
                      <div className="relative">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-gray-700/50 rounded-md animate-pulse"></div>
                  )}
                </div>
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
          className={`mt-8 py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 ${
            loading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Adding Account...</span>
            </div>
          ) : (
            "Add Account"
          )}
        </button>
        <ToastContainer />
      </div>
    </>
  );
};

export default AddAccount;