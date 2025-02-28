import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { auth, db } from "../../firebaseCofig";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorUsername, setVendorUsername] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const navigate = useNavigate();

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Admin Login Successfully :)");
      navigate("/profile");  // Adjust the route to your admin dashboard
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle Vendor Login
  const handleVendorLogin = async (e) => {
    e.preventDefault();
    try {
      const vendorsRef = collection(db, "vendors");
      const q = query(vendorsRef, where("username", "==", vendorUsername), where("password", "==", vendorPassword));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const vendorData = querySnapshot.docs[0].data(); // Get the first matched vendor's data
        const vendorId = querySnapshot.docs[0].id; // Get the vendor's ID
  
        // You can also store other information if necessary
        alert("Vendor Login Successfully :)");
        navigate("/vendor", { state: { vendorId, ...vendorData } }); // Pass the vendor ID and data to the dashboard
      } else {
        alert("Invalid Vendor Username or Password");
      }
    } catch (error) {
      alert("Error logging in vendor: " + error.message);
    }
  };

  return (
    <div className="Full">
      {/* Admin Login */}
      <form onSubmit={handleAdminLogin}>
        <div className="login">
          <h2>Admin & incharge Login </h2>
          <div className="input-container">
            <input
              type="email"
              placeholder="Enter Your Email"
              required
              className="input-fields"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-container">
            <input
              type="password"
              placeholder="Enter Your Password"
              required
              className="input-fields"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        <button type="submit">Login</button>
          <p>New User? <Link to="/signup">Sign Up</Link></p>
        </div>
      </form>

      {/* Vendor Login */}
      <form onSubmit={handleVendorLogin}>
        <div className="login login-1">
          <h2>Vendor Login</h2>
          <div className="input-container">
            <input
              type="text"
              placeholder="Username"
              required
              className="input-fields"
              onChange={(e) => setVendorUsername(e.target.value)}
            />
          </div>
          <div className="input-container">
            <input
              type="password"
              placeholder="Password"
              required
              className="input-fields"
              onChange={(e) => setVendorPassword(e.target.value)}
            />
          </div>
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
