import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Signup.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth,db } from '../../firebaseCofig';
import { setDoc, doc } from 'firebase/firestore';


const Signup = () => {
const[email,setemail] = useState("");
const[password,setpassword] = useState("");
const[fullname,setfullname] = useState("");
const[companyName,setcompanyName] = useState("");
const[phoneNumber,setphoneNumber] = useState("");
const[address,setaddress] = useState("");

const handleRegister = async (e) => {
  e.preventDefault();
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        fullname: fullname,
        password: password,
        phoneNumber: phoneNumber,
        companyName: companyName,
        address: address,
      });
    }
    console.log("User Registered Successfully :)");
   alert("User Register Successfully :)")
  } catch (error) {
    console.error("Error registering user: ", error);
    alert(error.message)
  }
};



  return (
    <form onSubmit={handleRegister}>
    <div className='signup'>
      <h2>Register Your Details</h2>


      <label>Enter Your Fullname</label>
      <input
        name='fullname'
        type='text'
        placeholder='Enter Your Fullname'
        onChange={(e) =>setfullname(e.target.value)}
      />

      <label>Enter Your Email</label>
      <input
        name='email'
        type='email'
        placeholder='Enter Your Email'
        onChange={(e) =>setemail(e.target.value)}
      />

      <label>Enter Your Password</label>
      <input
        name='password'
        type='password'
        placeholder='Enter Your Password'
        onChange={(e) =>setpassword(e.target.value)}
      />

      <label>Enter Your Phone Number</label>
      <input
        name='phoneNumber'
        type='number'
        placeholder='Enter Your Phone Number'
        onChange={(e) =>setphoneNumber(e.target.value)}
      />

      <label>Enter Your Company Name</label>
      <input
        name='companyName'
        type='text'
        placeholder='Enter Your Company Name'
        onChange={(e) =>setcompanyName(e.target.value)}
      />

      <label>Enter Your Company Address</label>
      <input
        name='address'
        type='text'
        placeholder='Enter Your Company Address'
        onChange={(e) =>setaddress(e.target.value)}
      />

      <button>Signup</button>
     
    </div>
    <p style={{color:"#000",backgroundColor:"#fff",marginTop:'10px',padding:'10px'}}>Already registerd <Link to="/login"style={{color:"#007bff",textDecoration:"none"}}>Login</Link></p>
    </form>
  );
};

export default Signup;
