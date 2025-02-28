import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./vendor.css";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebaseCofig";

const VendorDashboard = () => {
  const location = useLocation();
  const { username, password } = location.state; // Get username and password from location state
  const [vendorComponents, setVendorComponents] = useState([]);
 
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const vendorRef = collection(db, "vendors");
        const q = query(
          vendorRef,
          where("username", "==", username),
          where("password", "==", password)
        );
        const querySnapshot = await getDocs(q);
        const vendorList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVendorComponents(vendorList);
      } catch (error) {
        console.error("Error fetching vendor data:", error);
      }
    };

    fetchVendorData();
  }, [username, password]);

  const handleCompletedQuantityChange = async (e, componentId) => {
    const completedQty = parseInt(e.target.value, 10) || 0;

    setVendorComponents((prev) =>
      prev.map((component) =>
        component.id === componentId
          ? {
              ...component,
              completedQuantity: completedQty,
              balanceQuantity: Math.max(component.totalQuantity - completedQty, 0),
            }
          : component
      )
    );

    // Update Firestore
    try {
      const vendorRef = doc(db, "vendors", componentId);
      await updateDoc(vendorRef, {
        completedQuantity: completedQty,
        balanceQuantity: Math.max(
          vendorComponents.find((v) => v.id === componentId)?.totalQuantity - completedQty,
          0
        ),
      });
    } catch (error) {
      console.error("Error updating vendor data:", error);
    }
  };

  const handleInputChange = async (e, componentId, field) => {
    const value = field === "rejectionQuantity" ? parseInt(e.target.value, 10) || 0 : e.target.value;

    setVendorComponents((prev) =>
      prev.map((component) =>
        component.id === componentId
          ? {
              ...component,
              [field]: value,
              ...(field === "completedQuantity"
                ? {
                    balanceQuantity: Math.max(
                      component.totalQuantity - value - (component.rejectionQuantity || 0),
                      0
                    ),
                  }
                : {}),
            }
          : component
      )
    );

    // Update Firestore
    try {
      const vendorRef = doc(db, "vendors", componentId);
      const updates = { [field]: value };
      if (field === "completedQuantity") {
        updates.balanceQuantity = Math.max(
          vendorComponents.find((v) => v.id === componentId)?.totalQuantity - value,
          0
        );
      }
      await updateDoc(vendorRef, updates);
    } catch (error) {
      console.error("Error updating vendor data:", error);
    }
  };


  const handleSave = async (component) => {
    try {
      const vendorDoc = doc(db, "vendors", component.id);
      await updateDoc(vendorDoc, {
        completedQuantity: component.completedQuantity || 0,
        balanceQuantity: component.balanceQuantity || 0,
        rejectionQuantity: component.rejectionQuantity || 0,
        reasonForRejection: component.reasonForRejection || "",
        status: component.status,
        startTime: component.startTime,
        endTime: component.endTime,
        totalTime: component.totalTime,
      });
      alert("Data saved successfully!");
      await updateProductStatus(
        component.projectName,
        component.componentNumber,
        component.status
      );
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleStatusChange = (color, componentId) => {
    const currentTime = new Date().toLocaleString();
  
    setVendorComponents((prev) =>
      prev.map((component) => {
        if (component.id === componentId) {
          let updatedComponent = { ...component };
  
          if (color === "yellow") {
            updatedComponent.startTime = currentTime;
            updatedComponent.endTime = "N/A";
            updatedComponent.totalTime = "N/A";
            updatedComponent.status = "Process Taken";
          } else if (color === "green") {
            if (
              parseInt(component.completedQuantity, 10) ===
              parseInt(component.totalQuantity, 10)
            ) {
              updatedComponent.endTime = currentTime;
              updatedComponent.status = "Completed";
  
              if (component.startTime && component.startTime !== "Not Taken") {
                const startTime = new Date(component.startTime).getTime();
                const endTime = new Date(currentTime).getTime();
                const totalSeconds = Math.ceil((endTime - startTime) / 1000);
  
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                updatedComponent.totalTime = `${hours} hours and ${minutes} minutes`;
              }
            } else {
              alert(
                `Completed quantity must match the total quantity before marking as Completed. 
                Completed Quantity: ${component.completedQuantity || 0}, 
                Total Quantity: ${component.totalQuantity || 0}`
              );
              return component;
            }
          } else if (color === "red") {
            updatedComponent.startTime = "Not Taken";
            updatedComponent.endTime = "Not Taken";
            updatedComponent.totalTime = "Not Taken";
            updatedComponent.status = "Not Taken";
            updatedComponent.completedQuantity = 0;
            updatedComponent.balanceQuantity = component.totalQuantity;
          }
  
          return updatedComponent;
        }
        return component;
      })
    );
  };
  
  
  

  const updateProductStatus = async (projectName, componentNumber, status) => {
    try {
      const productRef = collection(db, "products");
      const q = query(
        productRef,
        where("Name", "==", projectName),
        where("componentNumber", "==", componentNumber)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (docSnapshot) => {
        const productDoc = doc(db, "products", docSnapshot.id);
        await updateDoc(productDoc, { status });
      });

      console.log("Status updated for matching product.");
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  return (
    <div className="vendor-dashboard">
      <h1 className="table_header">Vendor Dashboard</h1>
      {vendorComponents.length > 0 ? (
        <div className="Tab-07">
          <table id="vendorDetailsTable">
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>Project Name</th>
                <th>Company Name</th>
                <th>Component Number</th>
                <th>Supplier DC</th>
                <th>Material Name</th>
                <th>Material Cost</th>
                <th>Total Quantity</th>
                <th>Completed Quantity</th>
                <th>Balance Quantity</th>
                <th>Rejection Quantity</th>
                <th>Reason for Rejection</th>
                <th>Username</th>
                <th>Password</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Total Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vendorComponents.map((component, index) => (
                <tr key={component.id}>
                  <td>{index + 1}</td>
                  <td>{component.projectName}</td>
                  <td>{component.companyName}</td>
                  <td>{component.componentNumber}</td>
                  <td>{component.supDcnumber}</td>
                  <td>{component.materialName}</td>
                  <td>{component.materialCost}</td>
                  <td>{component.totalQuantity}</td>
                  <td>
                    <input
                      type="number"
                      value={component.completedQuantity || 0}
                      onChange={(e) => handleCompletedQuantityChange(e, component.id)}
                    />
                  </td>
                  <td>{component.balanceQuantity || 0}</td>
                  <td>
                    <input
                      type="number"
                      value={component.rejectionQuantity || 0}
                      onChange={(e) => handleInputChange(e, component.id, "rejectionQuantity")}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={component.reasonForRejection || ""}
                      onChange={(e) => handleInputChange(e, component.id, "reasonForRejection")}
                    />
                  </td>
                  <td>{component.username}</td>
                  <td>{component.password}</td>
                  <td>{component.phone}</td>
                  <td>{component.address}</td>
                  <td>
                    <div
                      className="dot"
                      onClick={() => handleStatusChange("yellow", component.id)}
                      style={{
                        backgroundColor:
                          component.status === "Process Taken" ? "yellow" : "gray",
                      }}
                    ></div>
                    <div
                      className="dot"
                      onClick={() => handleStatusChange("green", component.id)}
                      style={{
                        backgroundColor: component.status === "Completed" ? "green" : "gray",
                      }}
                    ></div>
                    <div
                      className="dot"
                      onClick={() => handleStatusChange("red", component.id)}
                      style={{
                        backgroundColor: component.status === "Not Taken" ? "red" : "gray",
                      }}
                    ></div>
                  </td>
                  <td>{component.startTime || "N/A"}</td>
                  <td>{component.endTime || "N/A"}</td>
                  <td>{component.totalTime || "N/A"}</td>
                  <td>
                    <button onClick={() => handleSave(component)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No vendor data available for the provided credentials.</p>
      )}
    </div>
  );
};

export default VendorDashboard;
