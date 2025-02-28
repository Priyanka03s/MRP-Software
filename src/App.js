import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../src/admin/Login/Login';
import Signup from '../src/admin/Signup/Signup';
import Profile from './admin/Dashboard/Profile';
import Product from './admin/Dashboard/Product';
// import Assembly from './admin/Dashboard/Assembly';
// import Quality from './admin/Dashboard/Quality';
import Addvendor from './admin/Dashboard/addvendor/Addvendor';
import VendorDashboard from './vendor/Vendor';
import FirstPage from './FirstPage';
import Projects from './admin/Project/Projects';





const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/product" element={<Product />} />
        {/* <Route path="/assembly" element={<Assembly />} /> */}
        {/* <Route path="/quality" element={<Quality />} /> */}
        <Route path="/addvendor" element={<Addvendor />} />
        <Route path="/vendor" element={<VendorDashboard />} />
       <Route path='/project' element={<Projects/>}/>
    
     
    
      </Routes>
    </Router>
  );
}

export default App;
