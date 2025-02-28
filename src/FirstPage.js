import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import backimg from '../src/images/bg1.webp'

import './FirstPage.css';

const FirstPage = () => {
  const [showAbout, setShowAbout] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  // Toggle About section visibility
  const handleAboutClick = () => {
    setShowAbout(!showAbout);
  };

  // Navigate to /login
  const handleAccountClick = () => {
    navigate('/login');
  };

  return (
    <div className="first-page">
      <img className='background-image' src={backimg}/>
    

      <div className="welcome-section">
        <h2><span>Welcome</span> To Our <span>Material</span>  Resource <span> Planning</span> Software</h2>
        <p>Powering your production, simplifying your process</p>
        
        <p className='start' onClick={handleAccountClick}>Get Start</p>
      </div>
      <footer className="root-section">
        <p>Contact us at <a href="mailto:yaalmarketing000@gmail.com">yaalmarketing000@gmail.com</a></p>
      </footer>
    </div>
  );
};

export default FirstPage;
