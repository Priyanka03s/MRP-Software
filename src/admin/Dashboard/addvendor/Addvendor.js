import React, { useState, useEffect } from "react";
import { db } from "../../../firebaseCofig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import "./addvendor.css";

function AddVendor() {
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);

  // Fetch vendors from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vendors"), (snapshot) => {
      const vendorsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVendors(vendorsList);
      setFilteredVendors(vendorsList);
    });

    return () => unsubscribe();
  }, []);

  // Add a new vendor to Firestore
  const addVendor = async (vendorData) => {
    try {
      const newVendor = {
        ...vendorData,
        status: "Not Taken",
        startTime: "Not Taken",
        endTime: "Not Taken",
        totalTime: "Not Taken",
        completedQuantity: 0,
        balanceQuantity: vendorData.totalQuantity,
      };

      const docRef = await addDoc(collection(db, "vendors"), newVendor);
      setVendors((prevVendors) => [
        ...prevVendors,
        { ...newVendor, id: docRef.id },
      ]);
    } catch (error) {
      console.error("Error adding vendor: ", error);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredVendors(
      vendors.filter(
        (vendor) =>
          vendor.projectName.toLowerCase().includes(query) ||
          vendor.componentNumber.toLowerCase().includes(query)
      )
    );
  };

  return (
    <div className="table_head">
      <h1 style={{ color: "#fff" }}>Vendor Management</h1>
      <div className="container">
        <VendorForm addVendor={addVendor} />
        <VendorList
          vendors={filteredVendors}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
        />
      </div>
    </div>
  );
}

function VendorForm({ addVendor }) {
  const [vendorData, setVendorData] = useState({
    projectName: "",
    companyName: "",
    componentNumber: "",
    materialName: "",
    materialCost: "",
    totalQuantity: "",
    username: "",
    password: "",
    phone: "",
    address: "",
    supDcnumber: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVendorData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addVendor(vendorData);
    setVendorData({
      projectName: "",
      companyName: "",
      componentNumber: "",
      materialName: "",
      materialCost: "",
      totalQuantity: "",
      username: "",
      password: "",
      phone: "",
      address: "",
      supDcnumber: "",
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3 style={{ color: "#fff", backgroundColor: "black", padding: "5px" }}>
        Add Vendor
      </h3>
      <input
        type="text"
        name="projectName"
        value={vendorData.projectName}
        onChange={handleInputChange}
        placeholder="Project Name"
        required
      />
      <input
        type="text"
        name="companyName"
        value={vendorData.companyName}
        onChange={handleInputChange}
        placeholder="Company Name"
        required
      />
      <input
        type="text"
        name="componentNumber"
        value={vendorData.componentNumber}
        onChange={handleInputChange}
        placeholder="Component Number"
        required
      />
      <input
        type="text"
        name="materialName"
        value={vendorData.materialName}
        onChange={handleInputChange}
        placeholder="Material Name"
        required
      />
      <input
        type="number"
        name="materialCost"
        value={vendorData.materialCost}
        onChange={handleInputChange}
        placeholder="Material Cost"
        required
      />
      <input
        type="number"
        name="totalQuantity"
        value={vendorData.totalQuantity}
        onChange={handleInputChange}
        placeholder="Total Quantity"
        required
      />
      <input
        type="text"
        name="username"
        value={vendorData.username}
        onChange={handleInputChange}
        placeholder="Username"
        required
      />
      <input
        type="text"
        name="password"
        value={vendorData.password}
        onChange={handleInputChange}
        placeholder="Password"
        required
      />
      <input
        type="text"
        name="phone"
        value={vendorData.phone}
        onChange={handleInputChange}
        placeholder="Phone"
        required
      />
      <input
        type="text"
        name="address"
        value={vendorData.address}
        onChange={handleInputChange}
        placeholder="Address"
        required
      />
      <input
        type="text"
        name="supDcnumber"
        value={vendorData.supDcnumber}
        onChange={handleInputChange}
        placeholder="Supplier Dc"
        required
      />
      <button type="submit">Add Vendor</button>
    </form>
  );
}

function VendorList({ vendors, searchQuery, handleSearchChange }) {
  const handleStatusChange = async (vendorId, status) => {
    const currentTime = new Date().toISOString();
    const vendorRef = doc(db, "vendors", vendorId);

    const vendorDoc = await getDoc(vendorRef);
    const vendorData = vendorDoc.data();

    const updates = {
      status,
      startTime: vendorData.startTime,
      endTime: vendorData.endTime,
      totalTime: vendorData.totalTime,
    };

    if (status === "Process Taken" && vendorData.startTime === "Not Taken") {
      updates.startTime = currentTime;
    } else if (status === "Completed") {
      updates.endTime = currentTime;

      if (vendorData.startTime !== "Not Taken") {
        const startTime = new Date(vendorData.startTime).getTime();
        const endTime = new Date(currentTime).getTime();
        const duration = Math.floor((endTime - startTime) / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        updates.totalTime = `${hours} hours and ${minutes} minutes`;
      }
    }

    if (status === "Completed") {
      const completedQuantity = vendorData.completedQuantity + 1;
      updates.completedQuantity = completedQuantity;
      updates.balanceQuantity = vendorData.totalQuantity - completedQuantity;
    }

    await updateDoc(vendorRef, updates);
  };

  return (
    <div className="table_mains">
      <div className="table_head-1">
        <h2>Vendor List</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by Component Number or Project Name..."
          className="search-bar"
        />
      </div>
      <section className="table_body-1">
        <table className="tab-1">
          <thead className="tab-2">
            <tr className="tab-3">
              <th>S No.</th>
              <th>Project Name</th>
              <th>Company Name</th>
              <th>Component Number</th>
              <th>Vendor Details</th>
              <th>Material Name</th>
              <th>Total Quantity</th>
              <th>Completed Quantity</th>
              <th>Balance Quantity</th>
              <th>Rejection Quantity</th>
              <th>Reason for Rejection</th>
              <th>Status</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Total Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor, index) => (
              <tr key={vendor.id}>
                <td>{index + 1}</td>
                <td>{vendor.projectName}</td>
                <td>{vendor.companyName}</td>
                <td>{vendor.componentNumber}</td>
                <td>
                  <span>Username:</span> {vendor.username}
                  <br />
                  <span>Password:</span> {vendor.password}
                  <br />
                  <span>Address:</span> {vendor.address}
                  <br />
                  <span>Phone:</span> {vendor.phone}
                  <br />
                  <span>Supplier Dc:</span> {vendor.supDcnumber}
                </td>
                <td>{vendor.materialName}</td>
                <td>{vendor.totalQuantity}</td>
                <td>{vendor.completedQuantity}</td>
                <td>{vendor.balanceQuantity}</td>
                <td>{vendor.rejectionQuantity || "N/A"}</td>
                <td>{vendor.reasonForRejection || "N/A"}</td>
                <td>{vendor.status}</td>
                <td>{vendor.startTime}</td>
                <td>{vendor.endTime}</td>
                <td>{vendor.totalTime}</td>
                <td>
                  <button onClick={() => handleStatusChange(vendor.id, "Process Taken")}>
                    Process Taken
                  </button>
                  <button onClick={() => handleStatusChange(vendor.id, "Completed")}>
                    Complete
                  </button>
                  <button onClick={() => handleStatusChange(vendor.id, "Not Taken")}>
                    Not Taken
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AddVendor;
