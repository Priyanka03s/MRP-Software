import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { auth, db } from "../../firebaseCofig";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where ,doc, getDoc} from 'firebase/firestore';

const Login = () => {
  const [isAdminLogin, setIsAdminLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorUsername, setVendorUsername] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Admin Login Successfully :)");
      navigate("/profile");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleVendorLogin = async (e) => {
    e.preventDefault();
    try {
      const vendorsRef = collection(db, "vendors");
      const q = query(vendorsRef, where("username", "==", vendorUsername), where("password", "==", vendorPassword));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const vendorData = querySnapshot.docs[0].data();
        const vendorId = querySnapshot.docs[0].id;
        alert("Vendor Login Successfully :)");
        navigate("/vendor", { state: { vendorId, ...vendorData } });
      } else {
        alert("Invalid Vendor Username or Password");
      }
    } catch (error) {
      alert("Error logging in vendor: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="toggle-buttons">
        <button
          className={isAdminLogin ? "active" : ""}
          onClick={() => setIsAdminLogin(true)}
        >
          Admin Login
        </button>
        <button
          className={!isAdminLogin ? "active" : ""}
          onClick={() => setIsAdminLogin(false)}
        >
          Vendor Login
        </button>
      </div>
      {isAdminLogin ? (
        <form onSubmit={handleAdminLogin}>
          <div className="login-form">
            <h3>Admin Login</h3>
            <input
              type="email"
              placeholder="Enter Your Email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter Your Password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
            <p>
              New User? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVendorLogin}>
          <div className="login-form">
            <h3>Vendor Login</h3>
            <input
              type="text"
              placeholder="Enter Username"
              required
              onChange={(e) => setVendorUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter Password"
              required
              onChange={(e) => setVendorPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Login;
