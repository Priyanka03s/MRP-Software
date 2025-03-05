import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Signup.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebaseCofig';
import { setDoc, doc } from 'firebase/firestore';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [eccNo, setEccNo] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        await setDoc(doc(db, 'Users', user.uid), {
          email: user.email,
          fullname,
          password,
          phoneNumber,
          companyName,
          address,
          gstNo,
          eccNo,
        });
      }
      alert('User Registered Successfully :)');
    } catch (error) {
      console.error('Error registering user: ', error);
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleRegister} className="signup-form">
      <div className="signup-container">
        <h2 className="signup-title">Register Your Details</h2>
        <div className="signup-inputs">
          <div className="left-column">
            <div className="input-group">
              <label>Enter Your Fullname</label>
              <input
                type="text"
                placeholder="Enter Your Fullname"
                onChange={(e) => setFullname(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Enter Your Email</label>
              <input
                type="email"
                placeholder="Enter Your Email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Enter Your Password</label>
              <input
                type="password"
                placeholder="Enter Your Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Enter Your Phone Number</label>
              <input
                type="number"
                placeholder="Enter Your Phone Number"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="right-column">
            <div className="input-group">
              <label>Enter Your Company Name</label>
              <input
                type="text"
                placeholder="Enter Your Company Name"
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Enter Your Company Address</label>
              <input
                type="text"
                placeholder="Enter Your Company Address"
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Enter Your GST No</label>
              <input
                type="text"
                placeholder="Enter Your GST No"
                onChange={(e) => setGstNo(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Enter Your ECC No</label>
              <input
                type="text"
                placeholder="Enter Your ECC No"
                onChange={(e) => setEccNo(e.target.value)}
              />
            </div>
          </div>
        </div>
        <button className="signup-button">Signup</button>
        <p className="login-prompt">
          Already registered?{' '}
          <Link to="/login" className="login-link">
            Login
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Signup;
