import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseCofig';
import { doc, getDoc } from 'firebase/firestore';
import './Profile.css';
import { FiUser } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';
import ReactLoading from 'react-loading';

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = async (user) => {
    if (user) {
      const docRef = doc(db, 'Users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserDetails({ uid: user.uid, ...docSnap.data() });
      } else {
        navigate('/profile');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert('User logged out successfully!');
      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleAddVendor = () => {
    if (userDetails?.uid) {
      navigate('/addvendor', { state: { uid: userDetails.uid } });
    }
  };

  return (
    <div className="profile-container">
      <nav className="navbar">
        <h2 className='head-01'>Material  Resource  Planning Software</h2>
        <div className="gap">
          <div className="dashboard-dropdown">
            <div className="dashboard-link" onClick={toggleDropdown}>
              <h4>Dashboard</h4>
              <FiChevronDown size={20} />
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
                <Link
                  to="/project"
                  state={{ uid: userDetails?.uid }}
                  onClick={() => setShowDropdown(false)}
                >
                  Products
                </Link>
                <Link to="/addvendor" onClick={handleAddVendor}>
                  Add Vendor
                </Link>
              </div>
            )}
          </div>
         

          <div className="profile-icon" onClick={toggleDetails}>
            <FiUser size={24} />
          </div>
        </div>
      </nav>
      <div  className='div-01' style={{backgroundColor:"#292c2A",padding:"10px",borderRadius:'10px',color:"transparent"}}>
    <h4 style={{color:"#fff"}} className='h4'>Click the Dashboard to Continue Working</h4>
    <p style={{color:"#fff"}} className='p'>Access your tools and manage all essential functions from the dashboard. Keep track of progress, review data, and ensure everything is up-to-date for seamless workflow.</p>
</div>

      {loading ? (
        <div className="loader">
          <ReactLoading type={'spin'} color={'#000'} height={50} width={50} />
        </div>
      ) : showDetails && userDetails ? (
        <div className="profile-details-dropdown">
          <h3>Welcome, {userDetails.fullname}</h3>
          <p>Email: {userDetails.email}</p>
          <p>Password: {userDetails.password}</p>
          <p>Phone Number: {userDetails.phoneNumber}</p>
          <p>Company Name: {userDetails.companyName}</p>
          <p>Address: {userDetails.address}</p>
          <p>GST No: {userDetails.gstNo}</p>
          <p>Ecc No: {userDetails.eccNo}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        !userDetails && (
          <div className="loader">
            <ReactLoading type={'spin'} color={'#000'} height={50} width={50} />
          </div>
        )
      )}
    </div>
  );
};

export default Profile;
