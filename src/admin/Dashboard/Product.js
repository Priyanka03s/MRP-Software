import React, { useEffect, useState,useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../../firebaseCofig';
import { collection,  getDocs, doc, getDoc, updateDoc,query, where, setDoc,onSnapshot } from 'firebase/firestore';
import SearchIcon from '@mui/icons-material/Search';
import './product.css';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const Indicator = ({ orderDate }) => {
  const calculateIndicatorStyle = () => {
    const currentDate = new Date();
    const purchaseDate = new Date(orderDate);
    const diffTime = purchaseDate.getTime() - currentDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      // Order date has passed
      return { backgroundColor: 'red', animation: 'none' };
    } else if (diffDays <= 7) {
      // Order date is within a week
      return { backgroundColor: 'yellow', animation: 'blink 1s infinite' };
    } else {
      // Order date is in the future
      return { backgroundColor: 'green', animation: 'none' };
    }
  };

  return (
    <div
    style={{
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      ...calculateIndicatorStyle(),
    }}
    title={`Order Date: ${orderDate || 'Not Available'}`}
  ></div>
  );
};

const Product = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const { uid, projectId } = location.state || {};
  const [vendorStatuses, setVendorStatuses] = useState({});
  const [projectName, setProjectName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [inhouseTotal, setInhouseTotal] = useState(0);
  const [outhouseTotal, setOuthouseTotal] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [usedComponentNumbers, setUsedComponentNumbers] = useState(new Set());
  const [vendors, setVendors] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [componentNumbers, setComponentNumbers] = useState([]);
  const [componentNumber, setComponentNumber] = useState('');
  const [componentName, setComponentName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [allComponents, setAllComponents] = useState([]);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState('');
  const [purchaseData, setPurchaseData] = useState([]);
  const [showPurchasePage, setShowPurchasePage] = useState(false);
  const [dynamicFields, setDynamicFields] = useState({});
  const [stockData, setStockData] = useState([]); // State for stock data
  const [showStockPage, setShowStockPage] = useState(false); 
  const [outhouseComponents, setOuthouseComponents] = useState([]);
  const [isViewBillsOpen, setIsViewBillsOpen] = useState(false); // State for popup visibility
  const [faceList, setFaceList] = useState([]);
  const [showFaceList, setShowFaceList] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [processQuantities, setProcessQuantities] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({
    companyName: '',
    phoneNumber: '',
    address: '',
    gstNo: '',
    eccNo: '',
  });
 
  useEffect(() => {
    const fetchData = async () => {
      if (!uid || !projectId) return;

          // Fetch user details
      const userRef = doc(db, 'Users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setUserDetails(userDoc.data());
      }
  
      const projectRef = doc(db, "Users", uid, "Projects", projectId);
      const projectDoc = await getDoc(projectRef);
      const projectNameFromDoc = projectDoc.exists() ? projectDoc.data().name : "No project name available";
      setProjectName(projectNameFromDoc);
  
      const productsRef = collection(db, "Users", uid, "Projects", projectId, "Products");
      const productsSnapshot = await getDocs(productsRef);
  
      const productsList = productsSnapshot.docs.map((doc, index) => ({
        id: String(index + 1).padStart(3, "0"),
        ...doc.data(),
        projectName: projectNameFromDoc,
      }));
  
      const newUsedComponentNumbers = new Set(productsList.map(product => product.componentNumber));
      setUsedComponentNumbers(newUsedComponentNumbers);
      setProducts(productsList);
    };
  
    fetchData();
  }, [uid, projectId]);



  // Side bar

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }; 


// face List 



const handleFaceListClick = () => {
  const componentNumbers = products.map((product) => product.componentNumber);
  setFaceList(componentNumbers);
  setShowFaceList(true);
};
const handleComponentClick = (componentNumber) => {
  const selectedProduct = products.find((product) => product.componentNumber === componentNumber);
  if (selectedProduct) {
    const { purchaseQty, quantityTakenProcess = 0 } = selectedProduct;
    const faces = [];
    let remainingQty = purchaseQty - quantityTakenProcess;

    // Generate face details based on the remaining quantity
    for (let i = 1; remainingQty > 0; i++) {
      const faceQty = Math.min(remainingQty, quantityTakenProcess);
      faces.push({ face: `Face ${i}`, quantity: faceQty });
      remainingQty -= faceQty;
    }

    setProcessQuantities({ ...processQuantities, [componentNumber]: faces });
    setSelectedComponent({ componentNumber, faces });
  }
};
// ---------------x---------------x---------------x--------------------x---------------------------x------------------------x-------

// Bill for PO

const handleGenerateBillPO = () => {
  // Prompt for Component Number and Name
  const componentNumber = prompt("Enter the Component Number:");
  if (!componentNumber) {
    alert("Component Number is required to generate the bill.");
    return;
  }

  const componentName = prompt("Enter the Component Name:");
  if (!componentName) {
    alert("Component Name is required to generate the bill.");
    return;
  }

  // Replace these with actual values
  const companyAddress = companyAddress;
  const phNumber = phNumber;
  const gstNO = gstNO;
  const eccNO =eccNO;

  // Example data for demonstration purposes
  const purchaseData = [
    {
      componentNumber: componentNumber,
      componentName: componentName,
      hsnCode: "1234",
      materialName: "Polymer",
      customerName: "John Doe",
      gstNo: "GST123456",
      invoiceNumber: "INV98765",
      
    },
  ];

  const doc = new jsPDF();

  // Heading
  doc.setFontSize(16);
  doc.text("Purchase Order", 105, 15, null, null, "center");

  // From Address
  doc.setFontSize(12);
  doc.text("From Address:", 15, 25);
  doc.text(`${companyAddress}`, 15, 30);
  doc.text(`OFFICE: ${companyAddress}`, 15, 35);
  doc.text(`PH: ${phNumber}`, 15, 40);
  doc.text(`GSTIN #: ${gstNO}`, 15, 45);
  doc.text(`Ecc no: ${eccNO}`, 15, 50);

  // Table Layout
  const tableColumn = ["To Address", "Range", "Division", "II E", "PO No.", "Date"];
  const tableRows = [["Ms. Jeevanathan Polymer UNIT II", "II E", "CBE-II", "", "397", "19.02.25"]];

  doc.autoTable({
    startY: 60,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // Component Details Table
  const productTableColumns = [
    "Component Details",
    "HSN Code",
    "Material Name",
    "Customer Name",
    "GST No",
    "Invoice Number",
  ];

  const productTableRows = purchaseData.map((product) => [
    `Component No: ${product.componentNumber}\nComponent Name: ${product.componentName}`,
    product.hsnCode || "N/A",
    product.materialName || "N/A",
    product.customerName || "Not Available",
    product.gstNo || "Not Available",
    product.invoiceNumber || "Not Available",
  ]);

  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 10,
    head: [productTableColumns],
    body: productTableRows,
    theme: "striped",
    styles: { fontSize: 10 },
  });

  // Save the generated PDF
  doc.save(`${componentNumber}_${componentName}_Purchase_Order.pdf`);
};

// stock


const handleStock = () => {
  const updatedStockData = {
    toolsProcured: products.filter(
      (product) => product.processType === "Inhouse"
    ),
    toolsPurchased: products.filter(
      (product) => product.processType === "Outhouse"
    ),
    toolsNeeded: products.filter((product) => !product.componentName),
    balanceQuantity: products.map((product) => ({
      componentNumber: product.componentNumber,
      componentName: product.componentName,
      balance: product.quantity || 0,
    })),
  };
  setStockData(updatedStockData);
  setShowStockPage(true);
};

const renderStockPage = () => {
  const handleSaveStock = async () => {
    try {
      for (const product of products) {
        const { componentNumber, componentName } = product;

        const productRef = doc(
          db,
          "Users",
          uid,
          "Projects",
          projectId,
          "Products",
          componentNumber
        );

        const toolsProcured = stockData.toolsProcured.find(
          (tool) => tool.componentNumber === componentNumber
        )?.quantity || 0;

        const toolsPurchased = stockData.toolsPurchased.find(
          (tool) => tool.componentNumber === componentNumber
        )?.quantity || 0;

        const toolsNeeded = stockData.toolsNeeded.some(
          (tool) => tool.componentNumber === componentNumber
        );

        const inhouseBalance = await fetchInhouseBalance(componentNumber);
        const outhouseBalance = await fetchOuthouseBalance(componentNumber);

        const updatedData = {
          toolsProcured,
          toolsPurchased,
          toolsNeeded,
          balanceQuantity: {
            inhouse: inhouseBalance,
            outhouse: outhouseBalance,
          },
        };

        await setDoc(productRef, updatedData, { merge: true });
      }

      alert("Stock details saved successfully!");
    } catch (error) {
      console.error("Error saving stock details:", error);
      alert("Error saving stock details.");
    }
  };

  const fetchInhouseBalance = async (componentNumber) => {
    const balanceRef = doc(
      db,
      "Users",
      uid,
      "Projects",
      projectId,
      "InhouseBalances",
      componentNumber
    );
    const balanceDoc = await getDoc(balanceRef);
    return balanceDoc.exists() ? balanceDoc.data().balance : 0;
  };

  const fetchOuthouseBalance = async (componentNumber) => {
    const balanceRef = doc(
      db,
      "Users",
      uid,
      "Projects",
      projectId,
      "OuthouseBalances",
      componentNumber
    );
    const balanceDoc = await getDoc(balanceRef);
    return balanceDoc.exists() ? balanceDoc.data().balance : 0;
  };

  return (
    <div className="stock-page">
      <div
        className="card-container"
        style={{
          overflowY: "auto",
          overflowX: "auto",
          maxHeight: "400px",
          maxWidth: "800px",
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
          margin: "0 auto",
        }}
      >
        <h3 className="text-center text-lg font-semibold mb-4">
          Stock Details
        </h3>
        <table style={{ width: "100%", minWidth: "600px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th>Component Number</th>
              <th>Component Name</th>
              <th>Material Name</th>
              <th>Tools Procured</th>
              <th>Tools Purchased</th>
              <th>Tools Needed</th>
              <th>Inhouse Balance</th>
              <th>Outhouse Balance</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{product.componentNumber || "Unknown"}</td>
                <td>{product.componentName || "Unknown"}</td>
                <td>{product.materialName || "Unknown"}</td>
                <td>
                  <input
                    type="text"
                    value={
                      stockData.toolsProcured.find(
                        (tool) =>
                          tool.componentNumber === product.componentNumber
                      )?.quantity || ''
                    }
                    onChange={(e) =>
                      updateStockData(
                        "toolsProcured",
                        product.componentNumber,
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={
                      stockData.toolsPurchased.find(
                        (tool) =>
                          tool.componentNumber === product.componentNumber
                      )?.quantity || ''
                    }
                    onChange={(e) =>
                      updateStockData(
                        "toolsPurchased",
                        product.componentNumber,
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={stockData.toolsNeeded.some(
                      (tool) => tool.componentNumber === product.componentNumber
                    )}
                    onChange={(e) =>
                      updateStockData(
                        "toolsNeeded",
                        product.componentNumber,
                        e.target.checked
                      )
                    }
                  />
                </td>
                <td>
                  {stockData.balanceQuantity.find(
                    (bal) => bal.componentNumber === product.componentNumber
                  )?.inhouse || 0}
                </td>
                <td>
                  {stockData.balanceQuantity.find(
                    (bal) => bal.componentNumber === product.componentNumber
                  )?.outhouse || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleSaveStock}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Save Stock
        </button>
        <button
          onClick={() => setShowStockPage(false)}
          style={{
            marginTop: "20px",
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

const updateStockData = (type, componentNumber, value) => {
  const updatedStockData = { ...stockData };
  const itemIndex = updatedStockData[type].findIndex(
    (item) => item.componentNumber === componentNumber
  );
  if (itemIndex !== -1) {
    updatedStockData[type][itemIndex].quantity = value;
  } else {
    updatedStockData[type].push({ componentNumber, quantity: value });
  }
  setStockData(updatedStockData);
};


// Dc Bill

const handleViewBills = async () => {
  setIsViewBillsOpen(true);

  try {
    const productsRef = collection(
      db,
      "Users",
      uid,
      "Projects",
      projectId,
      "Products"
    );
    const q = query(productsRef, where("processType", "==", "outhouse"));
    const querySnapshot = await getDocs(q);

    const components = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      components.push({
        componentNumber: data.componentNumber,
        componentName: data.componentName,
        materialName: data.materialName,
        quantityTakenProcess: data.quantityTakenProcess,
        projectName: data.projectName,
        customerGST: data.customerGST || "",
        customerName: data.customerName || "",
        customerCompanyName: data.customerCompanyName || "",
        customerCompanyAddress: data.customerCompanyAddress || "",
        customerEccNo: data.customerEccNo || "",
        companyName: data.companyName || "",
        companyAddress: data.companyAddress || "",
        eccNo: data.eccNo || "",
        gstNO: data.gstNO || "",
        phNumber: data.phNumber || "",
        managerName: data.managerName || "",
      });
    });

    setOuthouseComponents(components);
  } catch (error) {
    console.error("Error fetching components:", error);
    alert("Failed to fetch Out-house components.");
  }
};

const handleCloseViewBills = () => {
  setIsViewBillsOpen(false);
  setOuthouseComponents([]);
};

const handlePromptForDC = () => {
  const componentName = prompt("Enter Component Name:");

  if (!componentName) {
    alert("Please enter a Component Name.");
    return;
  }

  handleGenerateDC(componentName);
};

const handleGenerateDC = (componentName) => {
  const filteredComponents = outhouseComponents.filter(
    (component) => component.componentName === componentName
  );

  if (filteredComponents.length === 0) {
    alert("No matching components found for the entered Component Name.");
    return;
  }

  const {
    gstNO,
    phNumber,
    companyName,
    companyAddress,
    customerName,
    customerCompanyName,
    customerCompanyAddress,
    customerGST,
  } = filteredComponents[0];

  // Initialize jsPDF document
  const doc = new jsPDF();


// Heading Section
doc.setFont("helvetica", "bold");
doc.setFontSize(16); // Set font size for the heading
doc.text("Delivery Note", 105, 20, null, null, "center"); // Center the text at the top

// GST Number and Phone
doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text(`GST NO: ${gstNO}`, 10, 30); // Left-align GST number
doc.text(`Phone: ${phNumber}`, 200 - doc.getTextWidth(`Phone: ${phNumber}`) - 10, 30); // Right-align Phone number

// Company Name and Address
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
const companyNameWidth = doc.getTextWidth(companyName);
const companyNameCenterX = (doc.internal.pageSize.width - companyNameWidth) / 2;
doc.text(companyName, companyNameCenterX, 40);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
const companyAddressWidth = doc.getTextWidth(companyAddress);
const companyAddressCenterX = (doc.internal.pageSize.width - companyAddressWidth) / 2;
doc.text(companyAddress, companyAddressCenterX, 45);

// Customer Details
doc.setFont("helvetica", "normal");
doc.text("To:", 10, 55);
doc.text(`M/S ${customerName}`, 10, 60);
doc.text(`${customerCompanyName}`, 10, 65);
doc.text(customerCompanyAddress, 10, 70);
doc.text(`GST No: ${customerGST}`, 10, 75);

// Calculate Total Quantity
const totalQuantity = filteredComponents.reduce(
  (sum, { quantityTakenProcess }) => sum + parseInt(quantityTakenProcess, 10),
  0
);

// Table Section
const tableStartY = 85;
doc.autoTable({
  head: [["S.No", "Component Number", "Material Name", "Quantity"]],
  body: [
    ...filteredComponents.map(
      ({ componentNumber, materialName, quantityTakenProcess }, index) => [
        index + 1,
        componentNumber,
        materialName,
        `${quantityTakenProcess} Nos`,
      ]
    ),
    ["", "", "Total", `${totalQuantity} Nos`], // Add total row
  ],
  startY: tableStartY,
  styles: {
    lineColor: [0, 0, 0],
    lineWidth: 0.5,
    valign: "middle",
    halign: "center",
    fontSize: 10,
    cellPadding: 5,
  },
  headStyles: {
    fillColor: [211, 211, 211],
    textColor: [0, 0, 0],
    fontStyle: "bold",
    halign: "center",
  },
  bodyStyles: {
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    halign: "center",
  },
  columnStyles: {
    0: { halign: "center", cellWidth: 15 }, // S.No
    1: { halign: "center", cellWidth: 50 }, // Component Number
    2: { halign: "center", cellWidth: 80 }, // Material Name
    3: { halign: "center", cellWidth: 40 }, // Quantity
  },
});

// Footer Section
const footerStartY = doc.lastAutoTable.finalY + 10;
doc.setFont("helvetica", "normal");
doc.text("To Be Return After", 10, footerStartY);
doc.text("PAINTING", 20, footerStartY + 10);
doc.text("MACHINING", 20, footerStartY + 15);
doc.text("TESTING", 20, footerStartY + 20);

// Signatures
doc.setFont("helvetica", "bold");
doc.text("Customer's Signature", 10, footerStartY + 40); // Customer's signature on the left
doc.text(`For ${companyName}`, 200 - 10, footerStartY + 40, null, null, "right"); // Company signature on the right


  // Save the PDF
  doc.save(`Delivery_Note_${componentName}.pdf`);
  alert("Delivery Note PDF has been generated and downloaded.");
};



// ------x-----x-----x------x----->




  
  const handlePurchase = () => {
    setPurchaseData(products);
    setShowPurchasePage(true);
  };
  // const handleDropdowns = (field, index) => {
  //   const dropdownValues = [
  //     ...new Set(products.map((product) => product[field])),
  //   ].filter(Boolean);
  //   alert(`Select a value for ${field}: ${dropdownValues.join(", ")}`);
  // };


  
  const renderPurchasePage = () => {
    return (
      <div className="purchase-page">
        <h3>Purchase Order</h3>
        <div
          style={{
            height: "300px",
            width: "100%",
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: "10px",
          }}
        >
          <table>
            <thead>
              <tr>
                <th>Component Details</th>
                <th>HSN Code</th>
                <th>Material Name</th>
                <th>Office Details</th>
                <th>Customer Details</th>
                
                <th>Invoice Number</th>
              </tr>
            </thead>
            <tbody>
              {purchaseData?.map((product, index) => (
                <tr key={index}>
                  <td>
                    <label>Component Number :</label>
                    <input
                      type="text"
                      value={product.componentNumber || ""}
                      readOnly
                    />
                    <label>Component Name :</label>
                    <input
                      type="text"
                      value={product.componentName || ""}
                      readOnly
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={product.hsnCode || ""}
                      readOnly
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={product.materialName || ""}
                      readOnly
                    />
                  </td>
                  <td>
                  <strong>GST No:</strong> {product.gstNo || "Not Available"}<br/>
                  <strong>Ecc No:</strong> {product.eecNo || "Not Available"}<br/>
                  <strong>Company Name:</strong>  {product.companyName || "Not Available"}<br/>
                  <strong>Company Address:</strong>  {product.companyAddress || "Not Available"}<br/>
                  <strong>Ph No :</strong> {product.phNumber || "Not Available"}<br/>


                  </td>

                  <td>
  <strong>GST No:</strong> {product.customerGST || "Not Available"}<br/>
  <strong>Name:</strong> {product.customerName || "Not Available"}<br/>
  <strong>Company Name:</strong> {product.customerCompanyName || "Not Available"}<br/>
  <strong>Company Address:</strong> {product.customerCompanyAddress || "Not Available"}<br/>
  <strong>ECC No:</strong> {product.customerEccNo || "Not Available"}<br/>
                  </td>

                 
                  <td>{product.invoiceNumber || "Not Available"}</td>
                </tr>
              ))}
            </tbody>
          
          </table>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleGenerateBillPO}>Generate Bill</button>
        <button onClick={handleSaveProduct}>Save</button>
        <button onClick={() => setShowPurchasePage(false)}>Back</button></div>
        </div>
    );
  };
  

 
  //bill
  const handleToggleBill = () => {
    setIsBillOpen(!isBillOpen);
  };

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const componentsRef = collection(db, 'Components');
        const snapshot = await getDocs(componentsRef);
        const componentsList = snapshot.docs.map((doc) => doc.data());
        setAllComponents(componentsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching components: ", error);
        setLoading(false);
      }
    };
    fetchComponents();
  }, []);

  // Fetch product details based on selected component number and name
  const fetchProductDetails = async () => {
    try {
      const productRef = collection(db, 'Users', 'userId', 'Projects', 'projectId', 'Products'); // Modify with dynamic user and project IDs
      const querySnapshot = await getDocs(productRef);
      querySnapshot.forEach((doc) => {
        const productData = doc.data();
        if (productData.componentNumber === componentNumber && productData.componentName === componentName) {
          setProductDetails(productData);
        }
      });
    } catch (error) {
      console.error("Error fetching product details: ", error);
    }
  };

  const handleGenerateBill = async () => {
    if (!componentNumber || !componentName || !quantity) {
      alert("Please fill in all the fields.");
      return;
    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
  
    try {
      const q = query(
        collection(db, "Users", uid, "Projects", projectId, "Products"),
        where("componentNumber", "==", componentNumber),
        where("componentName", "==", componentName)
      );
  
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        alert("No matching product found with the provided details.");
        return;
      }
  
      const productData = querySnapshot.docs[0].data();
  
      const {
        customerCompanyAddress,
        customerCompanyName,
        hsnCode,
        customerEccNo,
        customerName,
        gstPercentage,
        invoiceNumber,
        materialCostWithGst,
        phNumber,
        companyAddress,
        companyName,
        gstNo,
    
      } = productData;
  
      const totalAmount = quantity * parseFloat(materialCostWithGst);
  
      const doc = new jsPDF();
  
      // Title Section: "Tax Invoice"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Tax Invoice", 105, 10, { align: "center" }); // Centered title

    // Header Section: Company Info in Table Format
    const headerTableData = [
      [
        { content: "Company Name:", styles: { fontStyle: "bold" } },
        companyName,
        { content: "Phone:", styles: { fontStyle: "bold" } },
        phNumber,
      ],
      [
        { content: "Address:", styles: { fontStyle: "bold" } },
        companyAddress,
        { content: "GSTIN:", styles: { fontStyle: "bold" } },
        gstNo,
      ],
    ];

    doc.autoTable({
      startY: 20,
      body: headerTableData,
      styles: { fontSize: 10, cellPadding: 2, halign: "left" },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 60 },
      },
      theme: "plain",
    });

  
    // Invoice Number and Date Section with Borders
doc.setFontSize(10);
doc.setFont("helvetica", "normal");

// Draw border for Invoice Number and Date
doc.rect(10, 50, 90, 10); // Border for Invoice Number
doc.rect(100, 50, 90, 10); // Border for Date

// Add text inside the borders
doc.text(`Invoice Number: ${invoiceNumber}`, 12, 55); // Slight padding for text
doc.text(`Date: ${new Date().toLocaleDateString()}`, 102, 55);
  
   // Customer Details Section with Border
doc.setFont("helvetica", "bold");
doc.text("Customer Details", 10, 65);
doc.setFont("helvetica", "normal");

// Draw border for Customer Details
doc.rect(10, 70, 190, 20);

// Add text inside the border
doc.text(`Name: ${customerName}`, 12, 75); // Line 1
doc.text(`Company: ${customerCompanyName}`, 12, 80); // Line 2
doc.text(`Address: ${customerCompanyAddress}`, 12, 85); // Line 3
doc.text(`ECC No: ${customerEccNo}`, 102, 75); // ECC No on the same row
  
      // Component Details Table
      const tableColumns = [
        "Sl. No.",
        "Component Number",
        "Component Name",
        "Quantity",
        "Rate",
        "GST (%)",
        "Value",
        "HSN Code"
      ];
      const tableRows = [
        [
          "1",
          componentNumber,
          componentName,
          quantity,
          parseFloat(materialCostWithGst).toFixed(2),
          `${gstPercentage}%`,
          totalAmount.toFixed(2),
          hsnCode
        ],
      ];
  
      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 100,
        margin: { top: 10, bottom: 10 },
        styles: {
          fontSize: 10,
          cellPadding: 4,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [200, 200, 200],
          fontStyle: "bold",
          textColor: [0, 0, 0],
        },
      });
  
      // // Material Details Table
      // doc.autoTable({
      //   head: [["Material Name", "HSN Code", "Rate of GST", "Exemption Notification No."]],
      //   body: [[materialName, hsnCode, `${gstPercentage}%`, ""]],
      //   startY: 150,
      //   margin: { top: 10, bottom: 10 },
      //   styles: {
      //     fontSize: 10,
      //     cellPadding: 4,
      //     halign: "center",
      //     valign: "middle",
      //     fillColor: [255, 255, 255], // White background
      //     textColor: [0, 0, 0], // Black text
      //     lineWidth: 0.1, // Thin border
      //     lineColor: [0, 0, 0],
      //   },
      //   headStyles: {
      //     fillColor: [200, 200, 200], // Gray header background
      //     fontStyle: "bold",
      //     textColor: [0, 0, 0],
      //   },
      // });
  
      // Total Amount Section
      const finalY = doc.lastAutoTable.finalY; // Get last table position
  
      // Box Dimensions for Total Amount
      const boxX = 10;
      const boxY = finalY + 10;
      const boxWidth = 90;
      const boxHeight = 10;
  
      // Draw a Box for Total Amount
      doc.rect(boxX, boxY, boxWidth, boxHeight);
  
      // Add Text Inside the Box (Centered)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Total Amount including GST: ${totalAmount.toFixed(2)}`,
        boxX + 2, // Small padding from the left
        boxY + 6 // Position text inside the box
      );
  
   // Footer Section
const footerY = doc.lastAutoTable.finalY + 40; // Increased space above footer content

// Table Data for Footer
const footerTableData = [
  [
    {
      content: 
        "1. Interest at the prevailing rate of 24.5% will be charged on all bills not paid before the due date.\n" +
        "2. Any additional duties, taxes, or levies payable must also be borne by you.\n" +
        "3. 'C' Form/Form 17 must be sent with payment; otherwise, taxes will be collected as per rule.\n" +
        "4. Our responsibility ceases once goods are delivered to your representative or carriers.\n" +
        "5. Please collect a duplicate copy of the invoice from the transporter.\n" +
        "6. Test certificate enclosed.\n" +
        "7. Subject to Coimbatore jurisdiction only.",
      styles: { halign: "left" },
    },
    {
      content: 
        "Certified that the particulars given above are true and correct,\n" +
        "and the amount indicated represents the price actually charged and that\n" +
        "there is no flow of additional consideration directly or indirectly from the buyer.\n\n" +
        "Prepared by:\n\n\n\n\n"+


        "Checked by:            For Authorized Signatory", // Use spaces for alignment
      styles: { halign: "left" },
    },
  ],
];

// Render Footer Table
doc.autoTable({
  body: footerTableData,
  startY: footerY,
  styles: {
    fontSize: 8, // Font size for the footer
    cellPadding: 5, // Padding inside each cell
  },
  columnStyles: {
    0: { cellWidth: 120 }, // Left column width
    1: { cellWidth: 70 }, // Right column width
  },
});


    const tableData = [];
      // Generate Footer Table
      doc.autoTable({
        startY: footerY,
        margin: { left: 10, right: 10 },
        body: tableData,
        styles: { fontSize: 7, cellPadding: 3 },
        theme: "grid",
      });
  
      // Save the generated PDF
      doc.save("generated-bill.pdf");
  
    } catch (error) {
      console.error("Error generating bill:", error);
      alert("An error occurred while generating the bill.");
    }
  };

  /*****/
  const handleClick = (index, statusType) => {
    handleInhouseStatusChange(index, statusType);
  };

  const filteredComponents = componentNumbers
  .filter(
    (component) =>
      component &&
      component.number &&
      component.name &&
      (component.number.toLowerCase().includes(searchValue.toLowerCase()) ||
        component.name.toLowerCase().includes(searchValue.toLowerCase()))
  );
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vendors"), (snapshot) => {
      const vendorData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVendors(vendorData);
    });

    return () => unsubscribe();
  }, []);

  const getVendorData = (componentNumber) => {
    return vendors.find((vendor) => vendor.componentNumber === componentNumber);
  };


  useEffect(() => {
    const fetchData = async () => {
      if (!uid || !projectId) {
        setLoading(false);
        return;
      }
  
      try {
        const projectRef = doc(db, 'Users', uid, 'Projects', projectId);
        const projectDoc = await getDoc(projectRef);
        const projectNameFromDoc = projectDoc.exists() ? projectDoc.data().name : 'No project name available';
        setProjectName(projectNameFromDoc);
  
        const productsRef = collection(db, 'Users', uid, 'Projects', projectId, 'Products');
        const productsSnapshot = await getDocs(productsRef);
        const productsList = productsSnapshot.docs.map((doc, index) => {
          const data = doc.data(); 
          return {
            id: String(index + 1).padStart(3, '0'),
            ...data,
            projectName: projectNameFromDoc,
            vendorStatus: 'Fetching...',
            outhouseCompletedQuantity: data.outhouseCompletedQuantity || 0,
            outhouseBalanceQuantity: data.outhouseBalanceQuantity || 0,
          };
        });
                                                                                                                                                                                                                                                                                                                                                     
  
        // Track the used component numbers
        const newUsedComponentNumbers = new Set(productsList.map(product => product.componentNumber));
        setUsedComponentNumbers(newUsedComponentNumbers);
  
        setProducts(productsList);
  
        const statuses = {};
        for (const product of productsList) {
          if (product.componentNumber) { // Ensure componentNumber exists
            const status = await fetchVendorStatus(product.componentNumber, projectNameFromDoc);
            statuses[`${product.componentNumber}-${projectNameFromDoc}`] = status;
          } else {
            statuses[`${product.componentNumber || 'unknown'}-${projectNameFromDoc}`] = 'Component Number Missing';
          }
        }
        setVendorStatuses(statuses);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
  
      setLoading(false);
    };
  
    fetchData();
  }, [uid, projectId]);
  
  const fetchVendorStatus = async (componentNumber, projectName) => {
    try {
      if (!componentNumber || typeof componentNumber !== 'string') {
        console.warn('Invalid componentNumber:', componentNumber);
        return 'Invalid Component Number';
      }
  
      const vendorsCollection = collection(db, 'vendors');
      const q = query(
        vendorsCollection,
        where('componentNumber', '==', componentNumber.toString()), 
        where('projectName', '==', projectName.toLowerCase()) 
      );
  
      const querySnapshot = await getDocs(q);
  
      console.log(`Querying vendors for componentNumber: ${componentNumber}, projectName: ${projectName}`);
      console.log('Query result:', querySnapshot.docs.map((doc) => doc.data()));
  
      if (!querySnapshot.empty) {
        const vendorDoc = querySnapshot.docs[0];
        const vendorData = vendorDoc.data();
        console.log('Vendor status found:', vendorData.status); 
  
        return vendorData.status || 'Status Not Available';
      } else {
        console.warn('No matching vendor found');
        return 'No matching vendor found';
      }
    } catch (error) {
      console.error('Error fetching vendor status:', error);
      return 'Error retrieving status';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'not taken':
        return 'red';
      case 'process taken':
        return 'yellow';
      default:
        return 'gray';
    }
  };
  useEffect(() => {
    const fetchVendorData = async () => {
      const vendorSnapshot = await getDocs(collection(db, "vendors"));
      const vendorData = {};
      vendorSnapshot.forEach((doc) => {
        const data = doc.data();
        vendorData[data.componentNumber] = data;
      });
      setVendorStatuses(vendorData);
    };
  
    fetchVendorData();
  }, []);
  

  const handleAddProduct = async () => {
    if (!projectName) {
      alert('Project name is not available.');
      return;
    }
  
    const componentNumber = prompt('Enter Component Number:');
    if (usedComponentNumbers.has(componentNumber)) {
      alert('This component number has already been used. Please choose a different one.');
      return;
    }
  
    const newProduct = {
      purchaseNumber:'',
      purchaseQty:'',
      orderDate:'',
      componentNumber,
      componentName: '',
      hsnCode:'',
      quantity: '',
      materialName: '',
      invoiceNumber: '',
      materialCost: '',
      gstNo: userDetails.gstNo, // Use fetched GST No
      eccNo: userDetails.eccNo, // Use fetched ECC No
      companyName: userDetails.companyName, // Use fetched company name
      phoneNumber: userDetails.phoneNumber, // Use fetched phone number
      address: userDetails.address,
      materialGst: '',
      materialTotalWithGst: '',
      processType: '',
      inhouseDetails: { laborCostPerHour: '', totalWorkingHours: '', totalAmount: '' },
      outhouseDetails: { vendorcost: '', transportcost: '', purchasecost: '', gst: '', totalAmount: '' },
      inhouseStatus: {
        processing: { color: 'yellow', timestamp: '' },
        completed: { color: 'green', timestamp: '' },
        notProcessing: { color: 'red', timestamp: '' },
      },
      vendorInfo: '',
      vendorStatus: 'Status Not Available',
      projectName,
      rejectionQuantity: '',
      unprocessedCost:'' ,// Initialize rejectionQuantity
      reasonForRejection: '',
      lossInProcess:''
    
    };
  
    try {
      const newProductId = String(products.length + 1).padStart(3, '0');
      await setDoc(doc(db, 'Users', uid, 'Projects', projectId, 'Products', newProductId), newProduct);
  
      // Add the new product to the list and update the used component numbers
      setProducts((prevProducts) => [...prevProducts, { id: newProductId, ...newProduct }]);
      setUsedComponentNumbers((prevSet) => new Set(prevSet).add(componentNumber));
      
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product.');
    }
  };
  

  const handleSaveProduct = async () => {
    if (!uid || !projectId) {
      alert("User or Project ID is missing!");
      return;
    }
    const newProduct = {
      componentNumber,
      additionalField: '',
    };
    try {
      for (const product of  products) {
        const productRef = doc(
          db,
          "Users",
          uid,
          "Projects",
          projectId,
          "Products",
          product.id
        );

        const updatedProduct = {
          ...product,
          dynamicFields: dynamicFields[product.id] || {},
          unprocessedCost: parseFloat(product.unprocessedCost) || 0,
          lossInProcess: parseFloat(product.lossInProcess) || 0,
          companyName: product.companyName || "",
          companyAddress: product.companyAddress || "",
          gstNo: product.gstNo || "",
          phNumber: product.phNumber || "",
          customerName: product.customerName || "",
          customerCompanyName: product.customerCompanyName || "",
          customerCompanyAddress: product.customerCompanyAddress || "",
          customerEccNo: product.customerEccNo || "",
          scrapWeight: product.scrapWeight || 0,
          scrapCost: product.scrapCost || 0,
        };

        await setDoc(productRef, updatedProduct, { merge: true });
      }

      alert("Products saved successfully!");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product.");
    }
  };
 
  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
  
    // Clone the products array
    const newProducts = [...products];
    const updatedProducts = [...products]; 
    updatedProducts[index][name] = value;
    newProducts[index][name] = value;
  
    // Existing logic for cost calculations
    if (
      name === 'rejectionQuantity' ||
      name === 'materialCostPerKg' ||
      name === 'materialWeightPerGrams' ||
      name === 'gstPercentage' ||
      name === 'totalAmount'
    ) {
      calculateCosts(index, newProducts);
  
      const materialCostPerKg = parseFloat(newProducts[index].materialCostPerKg) || 0;
      const materialWeightPerGrams = parseFloat(newProducts[index].materialWeightPerGrams) || 0;
      const gstPercentage = parseFloat(newProducts[index].gstPercentage) || 0;
  
      // Calculate Raw Material Cost Per Gram
      const totalMaterialCostPerKg = (materialCostPerKg / 1000) * materialWeightPerGrams;
  
      // Calculate GST Amount
      const gstAmount = (totalMaterialCostPerKg * gstPercentage) / 100;
  
      // Calculate Total Material Cost with GST
      const materialCostWithGst = totalMaterialCostPerKg + gstAmount;
  
      // Assign calculated values
      newProducts[index].gstAmount = gstAmount.toFixed(3);
      newProducts[index].materialCostWithGst = materialCostWithGst.toFixed(3);
    }
   // Automatically update totalQuantity based on quantityTakenProcess
   if (name === 'quantityTakenProcess') {
    updatedProducts[index].totalQuantity = value; // Directly set totalQuantity to the value of quantityTakenProcess
  }
    if (["totalRawMaterialCost", "processType", "totalAmount"].includes(name)) {
      calculateTotalCostOfComponent(index, newProducts);
    }
  
    const materialCostWithGst = parseFloat(newProducts[index].materialCostWithGst) || 0;
    const rejectionQuantity = parseFloat(newProducts[index].rejectionQuantity) || 0;
    const totalAmount = parseFloat(newProducts[index].totalAmount) || 0;
  
    newProducts[index].unprocessedCost = (rejectionQuantity * materialCostWithGst).toFixed(3);
  
    const lossInProcess = (rejectionQuantity * materialCostWithGst + totalAmount).toFixed(3);
    newProducts[index].lossInProcess = lossInProcess;
  
    const quantity = parseFloat(newProducts[index].totalQuantity) || 0;
    const transportCost = parseFloat(newProducts[index].transportCost) || 0;
  
    const totalRawMaterialCost = quantity * materialCostWithGst + transportCost;
    newProducts[index].totalRawMaterialCost = totalRawMaterialCost.toFixed(3);
  
    // New logic for Balance Quantity calculation
    if (name === "purchaseQty" || name === "quantityTakenProcess") {
      const purchaseQty = parseFloat(newProducts[index].purchaseQty) || 0;
      const quantityTakenProcess = parseFloat(newProducts[index].quantityTakenProcess) || 0;
  
      // Calculate Balance Quantity
      newProducts[index].balanceQty = (purchaseQty - quantityTakenProcess).toFixed(3);
    }
  
    // Update the state
    setProducts(newProducts);
    console.log("Updated Product Data:", newProducts);
  };
  
  


  
  const handleWeightChange = (index, type, value) => {
    const newProducts = [...products];
  
    if (type === 'grams') {
      newProducts[index].materialWeightPerGrams = parseFloat(value) || 0;
      newProducts[index].materialWeightPerKg = (parseFloat(value) / 1000).toFixed(3);
    } else if (type === 'kg') {
      newProducts[index].materialWeightPerKg = parseFloat(value) || 0;
      newProducts[index].materialWeightPerGrams = (parseFloat(value) * 1000).toFixed(0);
    }
  
    // Recalculate dependent values
    calculateCosts(index, newProducts);
    setProducts(newProducts);
  };
  
  
  const calculateCosts = (index, newProducts) => {
    console.log("Calculating costs for product index:", index);
  
    const product = newProducts[index];
  
    // Parse input values
    const materialCostPerKg = parseFloat(product.materialCostPerKg) || 0;
    const materialWeightPerGrams = parseFloat(product.materialWeightPerGrams) || 0;
    const gstPercentage = parseFloat(product.gstPercentage) || 0;
    const rejectionQuantity = parseFloat(product.rejectionQuantity) || 0;
    const totalAmount = parseFloat(product.totalAmount) || 0;
  
    // Calculate Material Cost with GST
    const totalMaterialCostPerKg = (materialCostPerKg / 1000) * materialWeightPerGrams;
    const materialCostWithGst =
      totalMaterialCostPerKg + (totalMaterialCostPerKg * gstPercentage) / 100;
    product.materialCostWithGst = materialCostWithGst.toFixed(3);
  
    // Calculate Total Raw Material Cost
    const quantity = parseFloat(product.totalQuantity) || 0;
    const transportCost = parseFloat(product.transportCost) || 0;
    const totalRawMaterialCost = quantity * materialCostWithGst + transportCost;
    product.totalRawMaterialCost = totalRawMaterialCost.toFixed(3);
  
    // Calculate Unprocessed Cost
    const unprocessedCost = rejectionQuantity * materialCostWithGst;
    product.unprocessedCost = unprocessedCost.toFixed(3);
    const lossInProcess = (rejectionQuantity * materialCostWithGst + totalAmount).toFixed(3);
  product.lossInProcess = lossInProcess;
    console.log("Unprocessed Cost Calculated:", unprocessedCost);
  
    setProducts(newProducts); // Ensure state is updated after calculations
  };
  

  const calculateTotalCostOfComponent = (index, newProducts) => {
    const product = newProducts[index];
    const totalRawMaterialCost = parseFloat(product.totalRawMaterialCost) || 0;
    let processTotalAmount = 0;
  
    if (product.processType === "inhouse") {
      processTotalAmount = parseFloat(product.inhouseDetails?.totalAmount) || 0;
    } else if (product.processType === "outhouse") {
      processTotalAmount = parseFloat(product.outhouseDetails?.totalAmount) || 0;
    }
  
    const totalCost = totalRawMaterialCost + processTotalAmount;
    product.totalcostofCN = totalCost.toFixed(3);
  
    setProducts(newProducts);
  };
  

  const handleProcessTypeChange = (index, event) => {
    const newProducts = [...products];
    newProducts[index].processType = event.target.value;
    setProducts(newProducts);
    calculateTotalCostOfComponent(index, newProducts);
  };

  const handleProcessDetailChange = (index, processType, field, value) => {
    const newProducts = [...products];
    const details = newProducts[index][`${processType}Details`];
    details[field] = parseFloat(value) || '';
    if (processType === 'inhouse') {
      const cycleHourRate = details.cycleHourRate || 0;
      const cycleTime = details.CycleTime || 0; // Time in minutes
      const total = (cycleHourRate / 60) * cycleTime;
      details.totalAmount = total.toFixed(3);
    }else if (processType === 'outhouse') {
      const vendorCost = details.vendorcost || 0;
      const transportCost = details.transportcost || 0;
      const purchaseCost = details.purchasecost || 0;
      const gst = details.gst || 0;
    
      const baseAmount = vendorCost + transportCost + purchaseCost;
      const total = baseAmount + (baseAmount * gst) / 100;
      details.totalAmount = total.toFixed(3); // Ensure a valid number before calling .toFixed()
    }
    calculateTotalCostOfComponent(index, newProducts);
    setProducts(newProducts);
  };
  

  const handleProcessNameChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

 

  const handleProcessTypeClick = async (index, type) => {
    const newProducts = [...products];

    if (type === "addictive" || type === "foaming") {
        // No scrap scenario
        newProducts[index].scrapWeight = "No Scrap";
        newProducts[index].scrapWeightUnit = ""; // No unit for "No Scrap"
        newProducts[index].scrapCost = "No Scrap";
        newProducts[index].totalScrapCost = "No Scrap";
        setSelectedProcessType(type);
    } else if (type === "subtractive") {
        // Subtractive process with scrap calculations

        // Prompt for weight unit
        let weightUnit = prompt("Enter the unit of weight (grams/kg):");
        if (!weightUnit) {
            alert("Process canceled or no input provided for weight unit.");
            return;
        }

        weightUnit = weightUnit.toLowerCase().trim();
        if (weightUnit !== "grams" && weightUnit !== "kg") {
            alert("Invalid weight unit! Please enter 'grams' or 'kg'.");
            return;
        }

        // Prompt for processed material weight
        const processedMaterialWeightInput = prompt(
            `Enter Processed Material Weight (${weightUnit}):`
        );
        if (!processedMaterialWeightInput) {
            alert("Process canceled or no input provided for processed material weight.");
            return;
        }

        const processedMaterialWeight = parseFloat(processedMaterialWeightInput);
        if (isNaN(processedMaterialWeight) || processedMaterialWeight <= 0) {
            alert("Invalid weight! Please enter a positive numeric value.");
            return;
        }

        // Convert weight to grams if entered in kilograms
        const processedMaterialWeightInGrams =
            weightUnit === "kg" ? processedMaterialWeight * 1000 : processedMaterialWeight;

        const rawMaterialWeight = parseFloat(newProducts[index].materialWeightPerGrams) || 0;
        const scrapWeight = rawMaterialWeight - processedMaterialWeightInGrams;

        if (scrapWeight < 0) {
            alert("Processed weight cannot exceed raw material weight!");
            return;
        }

        const materialCostPerKg = parseFloat(newProducts[index].materialCostPerKg) || 0;
        const gstPercentage = parseFloat(newProducts[index].gstPercentage) || 0;
        const totalQuantity = parseFloat(newProducts[index].totalQuantity) || 1;

        // Calculate the scrap cost
        const scrapWeightInKg = scrapWeight / 1000;
        const materialCostWithGst = materialCostPerKg + (materialCostPerKg * gstPercentage) / 100;
        const scrapCost = scrapWeightInKg * materialCostWithGst;
        const totalScrapCost = scrapCost * totalQuantity;

        // Store calculated scrap weight and unit
        newProducts[index].scrapWeight =
            weightUnit === "kg" ? (scrapWeight / 1000).toFixed(3) : scrapWeight.toFixed(3);
        newProducts[index].scrapWeightUnit = weightUnit === "kg" ? "kg" : "grams";
        newProducts[index].scrapCost = scrapCost.toFixed(3);
        newProducts[index].totalScrapCost = totalScrapCost.toFixed(3);
        setSelectedProcessType("subtractive");
    }

    setProducts(newProducts);

    // Store the data in Firebase
    try {
        await db.collection("products").doc(newProducts[index].id).set(
            {
                processType: type,
                scrapWeight: newProducts[index].scrapWeight || 0,
                scrapWeightUnit: newProducts[index].scrapWeightUnit || "",
                scrapCost: newProducts[index].scrapCost || 0,
                totalScrapCost: newProducts[index].totalScrapCost || 0,
                quantity: newProducts[index].quantity || 1,
            },
            { merge: true }
        );
        console.log("Data stored successfully");
    } catch (error) {
        console.error("Error storing data:", error);
    }

    console.log("Updated Product after process type click:", newProducts);
};

  
  


  const searchComponent = (e) => {
    setSearchValue(e.target.value.toLowerCase());
  };

// Filter products before the useEffect
const filteredProducts = useMemo(() => {
  // Handle case where searchValue might be null or undefined
  const lowercasedSearchValue = (searchValue || '').toLowerCase();

  return (products || []).filter((product) => {
    // Ensure product is defined and its properties are accessible
    if (!product) return false;

    const {
      componentNumber = '',
      componentName = '',
      inhouseDetails,
      outhouseDetails,
    } = product;

    // Convert componentNumber and componentName to strings to avoid null/undefined issues
    const safeComponentNumber = String(componentNumber || '').toLowerCase();
    const safeComponentName = String(componentName || '').toLowerCase();

    if (filterType === 'Inhouse') {
      return (
        inhouseDetails &&
        Object.keys(inhouseDetails).some((key) => inhouseDetails[key]) &&
        (safeComponentNumber.includes(lowercasedSearchValue) ||
          safeComponentName.includes(lowercasedSearchValue))
      );
    }

    if (filterType === 'Outhouse') {
      return (
        outhouseDetails &&
        Object.keys(outhouseDetails).some((key) => outhouseDetails[key]) &&
        (safeComponentNumber.includes(lowercasedSearchValue) ||
          safeComponentName.includes(lowercasedSearchValue))
      );
    }

    return (
      safeComponentNumber.includes(lowercasedSearchValue) ||
      safeComponentName.includes(lowercasedSearchValue)
    );
  });
}, [products, searchValue, filterType]);


useEffect(() => {
  const calculateTotals = async () => {
    if (!filteredProducts || filteredProducts.length === 0) return;

    let inhouseGrandTotal = 0;
    let outhouseGrandTotal = 0;

    for (const product of filteredProducts) {
      const outhouseCompletedQuantity = parseFloat(product.outhouseCompletedQuantity) || 0;
      const inhouseCompletedQuantity = parseFloat(product.inhouseCompletedQuantity) || 0;
      const transportCost = parseFloat(product.transportCost) || 0;
      const materialCostWithGst = parseFloat(product.materialCostWithGst) || 0; // Material cost with GST

      // Inhouse Calculation
      if (filterType === 'Inhouse' && product.inhouseDetails) {
        const { totalAmount } = product.inhouseDetails; // Fixed cost (640 in your example)

        // Inhouse Grand Total Calculation
        const fixedCost = parseFloat(totalAmount) || 0; // Fixed cost
        const materialCost = materialCostWithGst * inhouseCompletedQuantity; // Material cost calculation
        const inhouseTotal = fixedCost + materialCost + transportCost; // Grand Total for Inhouse

        // console.log(`Product ID: ${product.id}`);
        // console.log(`Inhouse Fixed Cost (Total Amount): ${fixedCost}`);
        // console.log(`Material Cost (Material Cost with GST * Completed Quantity): ${materialCost}`);
        // console.log(`Transport Cost: ${transportCost}`);
        // console.log(`Inhouse Grand Total for Product ID ${product.id}: ${inhouseTotal}`);

        inhouseGrandTotal += inhouseTotal;

        // Update Firebase for Inhouse
        try {
          const productRef = doc(db, 'Users', uid, 'Projects', projectId, 'Products', product.id);
          await updateDoc(productRef, {
            'inhouseDetails.grandTotal': inhouseTotal,
            'inhouseCompletedQuantity': inhouseCompletedQuantity,
          });
        } catch (error) {
          console.error(`Error updating Firebase for inhouse product ${product.id}:`, error);
        }
      }

      // Outhouse Calculation
      if (filterType === 'Outhouse' && product.outhouseDetails) {
        const { totalAmount } = product.outhouseDetails; // Fixed cost (420 in your example)

        // Outhouse Grand Total Calculation
        const fixedCost = parseFloat(totalAmount) || 0; // Fixed cost (420)
        const materialCost = materialCostWithGst * outhouseCompletedQuantity; // Material cost
        const outhouseTotal = fixedCost + materialCost + transportCost; // Grand Total for Outhouse

        // console.log(`Product ID: ${product.id}`);
        // console.log(`Outhouse Fixed Cost (Total Amount): ${fixedCost}`);
        // console.log(`Material Cost (Material Cost with GST * Outhouse Completed Quantity): ${materialCost}`);
        // console.log(`Transport Cost: ${transportCost}`);
        // console.log(`Outhouse Grand Total for Product ID ${product.id}: ${outhouseTotal}`);

        outhouseGrandTotal += outhouseTotal;

        // Update Firebase for Outhouse
        try {
          const productRef = doc(db, 'Users', uid, 'Projects', projectId, 'Products', product.id);
          await updateDoc(productRef, {
            'outhouseDetails.grandTotal': outhouseTotal,
            'outhouseCompletedQuantity': outhouseCompletedQuantity,
          });
        } catch (error) {
          console.error(`Error updating Firebase for outhouse product ${product.id}:`, error);
        }
      }
    }

    // Final log for grand totals
    // console.log(`Final Inhouse Grand Total: ${inhouseGrandTotal}`);
    // console.log(`Final Outhouse Grand Total: ${outhouseGrandTotal}`);

    // Set state for totals
    setInhouseTotal(inhouseGrandTotal);
    setOuthouseTotal(outhouseGrandTotal);
  };

  calculateTotals();
}, [filteredProducts, filterType, uid, projectId]);
  
  const handleInhouseStatusChange = (index, statusType) => {
    const newProducts = [...products];
    const product = newProducts[index];
  
    if (!product) {
      console.error(`Product at index ${index} does not exist.`);
      return;
    }
  

    if (!product.inhouseStatus) {
      product.inhouseStatus = {
        
        processing: { color: 'yellow', timestamp: '' },
        completed: { color: 'green', timestamp: '' },
        notProcessing: { color: 'red', timestamp: '' },
      };
    }
  
    
    const currentDateTime = new Date().toLocaleString();
    product.inhouseStatus[statusType].timestamp = currentDateTime;
  
    setProducts(newProducts);
  };

  const handleRejectionQuantityChange = (index, rejectionQuantity) => {
    const newProducts = [...products];
    const product = newProducts[index];
  
    const rejectionQty = parseFloat(rejectionQuantity) || 0;
    const completedQty = parseFloat(product.inhouseCompletedQuantity) || 0;
    const totalQty = parseFloat(product.totalQuantity) || 0;
  
    product.rejectionQuantity = rejectionQty;
  
    // Update the balance quantity based on rejection quantity
    product.inhouseBalanceQuantity = totalQty - completedQty - rejectionQty;
  
    setProducts(newProducts);
  };
  
  const handleCompletedQuantityChange = (index, processType, value) => {
    const newProducts = [...products];
    const product = newProducts[index];
  
    if (processType === 'inhouse') {
      const completedQuantity = parseFloat(value) || 0;
      const totalQuantity = parseFloat(product.totalQuantity) || 0;
      const rejectionQuantity = parseFloat(product.rejectionQuantity) || 0;
  
      product.inhouseCompletedQuantity = completedQuantity;
  
      // Update the balance quantity
      product.inhouseBalanceQuantity = totalQuantity - completedQuantity - rejectionQuantity;
  
      // Reset Outhouse quantities based on the Inhouse balance
      product.outhouseCompletedQuantity = 0; // Reset Outhouse completed
      product.outhouseBalanceQuantity = product.inhouseBalanceQuantity;
    }
  
    setProducts(newProducts);
  };

  useEffect(() => {
    const fetchComponentNumbers = async () => {
      try {
        const productsRef = collection(db, 'Users', uid, 'Projects', projectId, 'Products');
        const snapshot = await getDocs(productsRef);
  
        // Validate and ensure data structure consistency
        const numbers = snapshot.docs
          .map((doc) => doc.data())
          .filter((data) => data && data.componentNumber) // Ensure componentNumber exists
          .map((data) => ({
            number: data.componentNumber,
            name: data.componentName || "Unnamed Component", // Handle missing names
          }));
  
        setComponentNumbers(numbers);
      } catch (error) {
        console.error('Error fetching component numbers:', error);
      }
    };
  
    fetchComponentNumbers();
  }, [uid, projectId]);

  const handleSearchClick = () => {
    setDropdownVisible((prev) => !prev);  // Toggle visibility
  };
  

 
  const handleSelectComponent = (component, fieldType) => {
    if (component) {
      if (fieldType === "number" && component.number) {
        setSearchValue(component.number); // Display only the number
      } else if (fieldType === "name" && component.name) {
        setSearchValue(component.name); // Display only the name
      } else {
        console.error("Invalid component data:", component);
      }
      setDropdownVisible(false); // Hide dropdown
    } else {
      console.error("Invalid component selected:", component);
    }
  };


  return (
    <main className="table_main">
      <div className="table_header">
        <h3>Product List</h3>
        <h3>Project Name: {projectName}</h3>
        <div className="sidebar-container">
      <button onClick={toggleSidebar} className="toggle-button">
        ☰ 
      </button>

      {isSidebarOpen && (
        <div className='sidebar'>
          
          <div>
            <button>
              Profit Details
            </button>
          </div>
          <div>
            <button onClick={handleFaceListClick}>Face List</button>
          

          {showFaceList && (
            <div className="componentList">
              <h3>Component Numbers</h3>
              {faceList.map((componentNumber) => (
                <div key={componentNumber}>
                  <button onClick={() => handleComponentClick(componentNumber)}>
                    {componentNumber}
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedComponent && (
            <div className="faceDetails">
              <h3>Face Details for Component {selectedComponent.componentNumber}</h3>
              <ul>
                {selectedComponent.faces.map((face) => (
                  <li key={face.face}>
                    {face.face}: {face.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
</div>
          <div className="Amount popup-container">
            <button onClick={handlePurchase}>Purchase</button>
          </div>

          <div className="popup-container">
            <button onClick={handleStock}>View Stock</button>
          </div>

          <div className="popup-container">
            <button onClick={handleViewBills} className="btn-view-bills">
              View DCC Bills
            </button>

            {isViewBillsOpen && (
              <div className="popup-overlay">
                <div className="popup-card">
                  <div className="popup-header">
                    <h2 className="popup-title">Out-house Components</h2>
                    <button onClick={handleCloseViewBills} className="popup-close-btn">
                      Close
                    </button>
                  </div>

                  <div className="popup-content">
                    <button onClick={handleViewBills} className="btn-view-bills">
                      View DC Bills
                    </button>

                    {isViewBillsOpen && (
                      <div className="popup-overlay">
                        <div className="popup-card">
                          <div className="popup-header">
                            <h4 className="popup-title">DC Out-source Components</h4>
                            <button className="dc-bill-btn" onClick={handlePromptForDC}>
                              Generate DC
                            </button>
                            <button onClick={handleCloseViewBills} className="popup-close-btn">
                              Close
                            </button>
                          </div>
                          <div className="popup-content">
                            {outhouseComponents.length > 0 ? (
                              <table className="popup-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: "50px", textAlign: "center" }}>Project Name</th>
                                    <th style={{ width: "50px", textAlign: "center" }}>Component Number</th>
                                    <th style={{ width: "50px", textAlign: "center" }}>Component Name</th>
                                    <th style={{ width: "70px", textAlign: "center" }}>Material Name</th>
                                    <th style={{ width: "50px", textAlign: "center" }}>Quantity</th>
                                    <th>Customer Details</th>
                                    <th>Company details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {outhouseComponents.map((component, index) => (
                                    <tr key={index}>
                                      <td>{component.projectName}</td>
                                      <td>{component.componentNumber}</td>
                                      <td>{component.componentName}</td>
                                      <td>{component.materialName}</td>
                                      <td>{component.quantityTakenProcess}</td>
                                      <td>
                                        <strong>Gst No :</strong> {component.customerGST} <br />
                                        <strong>Name :</strong> {component.customerName} <br />
                                        <strong>Company Name :</strong> {component.customerCompanyName} <br />
                                        <strong>Address :</strong> {component.customerCompanyAddress} <br />
                                        <strong>Ecc No :</strong> {component.customerEccNo}
                                      </td>
                                      <td>
                                        <strong>Company Name :</strong> {component.companyName} <br />
                                        <strong>Address :</strong> {component.companyAddress} <br />
                                        <strong>Ecc No :</strong> {component.eccNO} <br />
                                        <strong>Gst No :</strong> {component.gstNO} <br />
                                        <strong>Ph No :</strong> {component.phNumber} <br />
                                        <strong>Manager Name :</strong> {component.managerName} <br />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p>No Out-house components found.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showStockPage && renderStockPage()}
          {showPurchasePage ? renderPurchasePage() : <div></div>}
        </div>
      )}
    </div>
      </div>
       
  
      <div className="view">
        <div
          className="Amount"
          style={{
            gap: "20px",
            display: "flex",
            marginLeft: "10px",
            marginTop: "-10px",
          }}
        >
          <button onClick={() => setFilterType("Inhouse")}>Inhouse</button>
          <button onClick={() => setFilterType("Outhouse")}>Outhouse</button>
          <button onClick={() => setFilterType("")}>Clear</button>
        </div>
     


      </div>
    
<div className='total'>
  <h5>{filterType === 'Inhouse' ? 'Inhouse Grand Total' : 'Outhouse Grand Total'}</h5>
  <p>({filterType}): {filterType === 'Inhouse' ? inhouseTotal : outhouseTotal}</p>

  <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '300px' }}>
  <div style={{ display: 'flex', flexDirection: 'column', width: '300px', position: 'relative' }}>
  <div style={{ position: 'relative', width: '260px' }}>
  <input
    id="searchComponentInput"
    type="text"
    value={searchValue}
    onChange={(e) => setSearchValue(e.target.value)}
    onClick={handleSearchClick}
    placeholder="Search Component"
    style={{
      padding: '10px 40px 10px 12px', // Space for the icon
      width: '100%',
      border: '2px solid #ccc',
      borderRadius: '6px',
      outline: 'none',
      transition: 'all 0.3s ease-in-out',
      fontSize: '14px',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    }}
    onFocus={(e) => (e.target.style.border = '2px solid #007BFF')}
    onBlur={(e) => (e.target.style.border = '2px solid #ccc')}
  />
  <SearchIcon
    style={{
      position: 'absolute',
     left:'300px',
      top: '60%',
      transform: 'translateY(-50%)',
      fontSize: '20px',
      color: '#777',
      cursor: 'pointer',
      transition: 'color 0.3s ease-in-out',
    }}
    onMouseEnter={(e) => (e.target.style.color = '#007BFF')}
    onMouseLeave={(e) => (e.target.style.color = '#777')}
  />
</div>



      {dropdownVisible && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            width: '100%',
            maxHeight: '200px',
            overflowY: 'scroll',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: 1000,
            color:'#000'
          }}
        >
        {filteredComponents.length > 0 ? (
  filteredComponents.map((component, index) => (
    <div
      key={index}
      style={{
        padding: "8px",
        cursor: "pointer",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "space-between",
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = "#f9f9f9")}
      onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
    >
      <span
        onClick={() => handleSelectComponent(component, "number")}
        style={{ cursor: "pointer", color: "blue" }}
      >
        <strong>Number:</strong> {component.number}
      </span>
      <span
        onClick={() => handleSelectComponent(component, "name")}
        style={{ cursor: "pointer", color: "green" }}
      >
        <strong>Name:</strong> {component.name}
      </span>
    </div>
  ))
) : (
  <div style={{ padding: "8px", color: "gray" }}>No components found</div>
)}
        </div>
      )}
    </div>
  </div>
</div>
      {filterType && (
        <div> </div>
      )}
    

     
      
      {loading ? (
        <p>Loading products...</p>
      ) : (


         
       <section className='table_body'>

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>P.ID</th>
              <th> Customer PO Details</th>
              <th>Component Details</th>
              <th>Material Name</th>
              <th>Material Cost</th>
              <th>Quantity</th>
              <th>Scrap Calculation</th>
              <th>Process Type</th>
              <th>Process Details</th>
              <th>Customer Details</th>
              <th> Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
          {filteredProducts.map((product, index) => (
              <tr key={product.id}>
                <td>{index + 1}</td>
                <td >{product.id}</td>
                <td>
  <label>Indicator:</label>
  <Indicator orderDate={product.orderDate} />

  <label>Purchase No:</label>
  <input
    type="text"
    name="purchaseNumber"
    value={product.purchaseNumber || ''}
    onChange={(event) => handleInputChange(index, event)}
  />

  <label>Purchase Order Quantity:</label>
  <input
    type="number"
    name="purchaseQty"
    value={product.purchaseQty || ''}
    onChange={(event) => handleInputChange(index, event)}
  />

  <label>Order Date:</label>
  <input
    type="date"
    name="orderDate"
    value={product.orderDate || ''}
    onChange={(event) => handleInputChange(index, event)}
  />

<label>Quantity Taken for Process:</label>
<input
  type="number"
  name="quantityTakenProcess"
  value={product.quantityTakenProcess || ''}
  onChange={(event) => handleInputChange(index, event)}
/>
  <label>Balance Quantity:</label>
  <input
    type="number"
    name="balanceQty"
    value={product.balanceQty || ''}
    readOnly
  />
</td>

                <td>
                  <label>Componet No:</label>
                  <input
                    type="text"
                    name="componentNumber"
                    value={product.componentNumber  || ''}
                    onChange={(event) => handleInputChange(index, event)}
              
                  />
                  <label>Componet Name:</label>
                    <input
                    type="text"
                    name="componentName"
                    value={product.componentName  || ''}
                    onChange={(event) => handleInputChange(index, event)}

                  />
                  <label>HSN Code:</label>
                    <input
                    type="text"
                    name="hsnCode"
                    value={product.hsnCode || ''}
                    onChange={(event) => handleInputChange(index, event)}

                  />
                  
               

                </td>
                <td>
                <label>Material Name</label>
                  <input
                    type="text"
                    name="materialName"
                    value={product.materialName  || ''}

                    onChange={(event) => handleInputChange(index, event)}
                  />
                </td>
                <td>
                  <label>Purchase Invoice number :</label>
                  <input
                  type="text"
                  name="invoiceNumber"
                  value={product.invoiceNumber  || ''}
                  onChange={(event) => handleInputChange(index, event)}
                />
               <label>RawMaterial Cost PerKg :</label>
    <input
      type="number"
      name="materialCostPerKg"
      value={product.materialCostPerKg || ''}
      onChange={(event) => handleInputChange(index, event)}
      placeholder="Material Cost per Kg"
    />
    <label>RawMaterial Weight In Grams:</label>
    <input
      type="number"
      name="materialWeightPerGrams"
      value={product.materialWeightPerGrams || ''}
      onChange={(event) => handleWeightChange(index, 'grams', event.target.value)}
      placeholder="Material Weight per Grams"
    />
    <label>RawMaterial Weight In KG:</label>
    <input
      type="number"
      name="materialWeightPerKg"
      value={product.materialWeightPerKg || ''}
      onChange={(event) => handleWeightChange(index, 'kg', event.target.value)}
      placeholder="Material Weight per Kg"
    />
    <label>GST %:</label>
    <input
      type="number"
      name="gstPercentage"
      value={product.gstPercentage || ''}
      onChange={(event) => handleInputChange(index, event)}
      placeholder="GST %"
    />
  <label>GST Amount:</label>
<input
  type="number"
  name="gstAmount"
  value={product.gstAmount || ''}
  readOnly
  placeholder="GST Amount"
/>
    <label>Total cost of raw material for one component:</label>
    <input
      type="number"
      value={product.materialCostWithGst || 0}
      readOnly
      placeholder="Total Material Cost with GST"
    />
                </td>
                <td>
                <label>Total Quantity:</label>
<input
  type="number"
  name="totalQuantity"
  value={product.totalQuantity || ''}
  readOnly // Prevent manual edits
/>
    <label>RawMaterial Cost Of one component:</label>
    <input
      type="number"
      name="materialCostPerUnit"
      value={product.materialCostWithGst || 0}
      readOnly
    />
    <label>Transport Cost:</label>
    <input
      type="number"
      name="transportCost"
      value={product.transportCost || ''}
      onChange={(event) => handleInputChange(index, event)}
    />
    <label>Total RawMaterial Cost:</label>
    <input
      type="number"
      value={product.totalRawMaterialCost || ''}
      readOnly
    />
            </td>
            
            <td>
  <div>
    <h5>Scrap Calculation</h5>
    <hr />

    <div key={product.id}>
      <h3>{product.name}</h3>
      <p>Process Type: {product.processType || "None"}</p>
      <p>
        Scrap Weight: {product.scrapWeight || "Not Calculated"}{" "}
        {product.scrapWeightUnit || ""}
      </p>
      <p>Scrap Cost: {product.scrapCost || "Not Calculated"}</p>
      <p>
        <strong>
          Total Scrap Cost: {product.totalScrapCost ? `₹${product.totalScrapCost}` : "Not Calculated"}
        </strong>
      </p>
      <select
        onChange={(e) => handleProcessTypeClick(index, e.target.value)}
        value={product.processType || ""}
      >
        <option value="">Select Process Type</option>
        <option value="addictive">Addictive</option>
        <option value="foaming">Foaming</option>
        <option value="subtractive">Subtractive</option>
      </select>
    </div>
  </div>
</td>


            <td>
  <select
    name="processType"
    value={product.processType}
    onChange={(e) => handleProcessTypeChange(index, e)}
    style={{ width: '85px', marginBottom: '20px' }}
  >
    <option value="">Select Process Type</option>
    <option value="inhouse">Inhouse</option>
    <option value="outhouse">Outhouse</option>
  </select>
  <label>InchargeName:</label>
  <input
    type="text"
    name="inchargeName"
    value={product.inchargeName || ''}
    placeholder="InchargeName"
    onChange={(e) => handleProcessNameChange(index, 'inchargeName', e.target.value)}
  />
  <label>ProcessName:</label>
  <input
    type="text"
    name="processName"
    placeholder="ProcessName"
    value={product.processName || ''}
    onChange={(e) => handleProcessNameChange(index, 'processName', e.target.value)}
  />
  <button onClick={() => handleSaveProduct(product)}>Save</button>
  <hr />


</td>



<td>
  {product.processType === "inhouse" && (
    <div style={{ width: "100px" }}>
      <p style={{ fontWeight: "bold", color: "#c70000" }}>Inhouse Details</p>

      <label>Process hour Rate: </label>
      <input
        type="number"
        name="cycleHourRate"
        value={product.inhouseDetails.cycleHourRate || ""}
        onChange={(e) =>
          handleProcessDetailChange(index, "inhouse", "cycleHourRate", e.target.value)
        }
      />

      <label>Process Time In Minutes: </label>
      <input
        type="number"
        name="CycleTime"
        value={product.inhouseDetails.CycleTime || ""}
        onChange={(e) => {
          const value = e.target.value;
          handleProcessDetailChange(index, "inhouse", "CycleTime", value);
          const convertedHours = (value / 60).toFixed(2); // Convert minutes to hours
          handleProcessDetailChange(index, "inhouse", "CycleTimeInHours", convertedHours);
        }}
      />

      <label>Process Time In Hours: </label>
      <input
        type="number"
        name="CycleTimeInHours"
        value={product.inhouseDetails.CycleTimeInHours || ""}
        onChange={(e) => {
          const value = e.target.value;
          handleProcessDetailChange(index, "inhouse", "CycleTimeInHours", value);
          const convertedMinutes = Math.round(value * 60); // Convert hours to minutes
          handleProcessDetailChange(index, "inhouse", "CycleTime", convertedMinutes);
        }}
      />

      <label>Total Process Cost: </label>
      <input
        type="number"
        name="totalAmount"
        value={product.inhouseDetails.totalAmount || ""}
        readOnly
      />
    </div>
  )}

{product.processType === "outhouse" && (
  <div>
    <p>Out-House Details</p>

    <label>Vendor Cost: </label>
    <input
      type="number"
      name="vendorcost"
      value={product.outhouseDetails.vendorcost || ""}
      onChange={(e) =>
        handleProcessDetailChange(index, "outhouse", "vendorcost", e.target.value)
      }
    />

    <label>Transport Cost: </label>
    <input
      type="number"
      name="transportcost"
      value={product.outhouseDetails.transportcost || ""}
      onChange={(e) =>
        handleProcessDetailChange(index, "outhouse", "transportcost", e.target.value)
      }
    />

    <label>Purchase Cost: </label>
    <input
      type="number"
      name="purchasecost"
      value={product.outhouseDetails.purchasecost || ""}
      onChange={(e) =>
        handleProcessDetailChange(index, "outhouse", "purchasecost", e.target.value)
      }
    />

    <label>GST (%): </label>
    <input
      type="number"
      name="gst"
      value={product.outhouseDetails.gst || ""}
      onChange={(e) => handleProcessDetailChange(index, "outhouse", "gst", e.target.value)}
    />
    <label>Total Process Cost: </label>
    <input
      type="number"
      value={product.outhouseDetails.totalAmount || ""}
      readOnly
    />
  </div>
)}

</td>

  
<td>
  <label>Customer GST No:</label>
  <input
    type="text"
    name="customerGST"
    value={product. customerGST || ''}
    onChange={(event) => handleInputChange(index, event)}
  />
  <label>Customer Name:</label>
  <input
    type="text"
    name="customerName"
    value={product.customerName || ''}
    onChange={(event) => handleInputChange(index, event)}
  />
  <label>Customer Company Name:</label>
  <input
    type="text"
    name="customerCompanyName"
    value={product.customerCompanyName || ''}
    onChange={(event) => handleInputChange(index, event)}
  />
  <label>Company Address:</label>
  <input
    type="text"
    name="customerCompanyAddress"
    value={product.customerCompanyAddress || ''}
    onChange={(event) => handleInputChange(index, event)}
  />
  <label>Customer's ECC No:</label>
  <input
    type="text"
    name="customerEccNo"
    value={product.customerEccNo || ''}
    onChange={(event) => handleInputChange(index, event)}
  />
</td>

   


<td className='Status'>
  {/* Outhouse Status Section */}
  {product.processType === 'outhouse' && (
      <>
        <h5 className="status-head">Out-House Status</h5>
        <hr className="hr" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          {/* Status Dot */}
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(
                vendorStatuses?.[`${product.componentNumber}-${projectName}`]
              ),
            }}
          ></span>
          {/* Status Text */}
          <h4 style={{ margin: 0 }}>
            {vendorStatuses?.[`${product.componentNumber}-${projectName}`] || 'Fetching...'}
          </h4>
        </div>

        {/* Mapping products to show respective data */}
        {products
          .filter((prod) => prod.componentNumber === product.componentNumber) // Show only matching componentNumber
          .map((filteredProduct) => {
            const vendorData = getVendorData(filteredProduct.componentNumber);
            return (
              <tr className="completed" key={filteredProduct.componentNumber}>
                <td>Completed Quantity: {vendorData?.completedQuantity || 'N/A'}</td>
                <td>Balance Quantity: {vendorData?.balanceQuantity || '0'}</td>
                <td>Rejection Quantity: {vendorData?.rejectionQuantity || '0'}</td>
                <td>Rejection Reason: {vendorData?.reasonForRejection || 'N/A'}</td>
                <td>Supplier Dc: {vendorData?.supDcnumber || 'N/A'}</td>
              </tr>
            );
          })}
      </>
    )}

{product.processType === 'inhouse' && (
  <>
    <h5 className="status-head">In-House Status</h5>
    <hr className="hr" />
    <div className="status-container">
      <div
        className="status-box"
        style={{ backgroundColor: product.inhouseStatus.processing.color }}
        onClick={() => handleClick(index, 'processing')}
      >
        <span className="status-text">Process Taken</span>
        <span className="status-timestamp">{product.inhouseStatus.processing.timestamp}</span>
      </div>
      <div
        className="status-box"
        style={{ backgroundColor: product.inhouseStatus.completed.color }}
        onClick={() => handleClick(index, 'completed')}
      >
        <span className="status-text">Process Completed</span>
        <span className="status-timestamp">{product.inhouseStatus.completed.timestamp}</span>
      </div>
      <div
        className="status-box"
        style={{ backgroundColor: product.inhouseStatus.notProcessing.color }}
        onClick={() => handleClick(index, 'notProcessing')}
      >
        <span className="status-text">Process Not Taken</span>
        <span className="status-timestamp">{product.inhouseStatus.notProcessing.timestamp}</span>
      </div>
    </div>

    <div style={{ marginTop: '10px' }}>
      <label>Inhouse Completed Quantity:</label>
      <input
        type="number"
        value={product.inhouseCompletedQuantity || ''}
        onChange={(e) => handleCompletedQuantityChange(index, 'inhouse', e.target.value)}
      />
    </div>

    <div>
      <label>Inhouse Balance Quantity:</label>
      <input type="text" value={product.inhouseBalanceQuantity || ''} readOnly />
    </div>

    <div key={index}>
      <label>Rejection Quantity:</label>
      <input
        type="number"
        name="rejectionQuantity"
        value={product.rejectionQuantity || ''}
        onChange={(e) => handleInputChange(index, e)}
      />
    </div>

    <div>
      <label>Reason For Rejection:</label>
      <input
        type="text"
        name="reasonForRejection"
        value={product.reasonForRejection || ''}
        onChange={(e) => handleInputChange(index, e)}
      />
    </div>

    <div>
      <label>Unprocessed Cost:</label>
      <input
        type="text"
        name="unprocessedCost"
        value={product.unprocessedCost || ''}
        readOnly
      />
    </div>

    <div>
      <p><strong>Loss In Process:</strong></p>
      <input
        type="text"
        name="lossInProcess"
        value={product.lossInProcess || ''}
        readOnly
      />
    </div>
  </>
)}

</td>




<td>
  <div className="action">
    <button onClick={() => handleSaveProduct(product)}>Save</button>
    <button onClick={handleToggleBill}>
      {isBillOpen ? 'Close Bill' : 'Generate v Bill'}
    </button>

    {/* Bill overlay */}
    {isBillOpen && (
      <div className="bill-overlay">
        <div className="bills">
          <h1>Generate Bill</h1>

          <div>
            <label>Component Number</label>
            <input
              type="text"
              value={componentNumber}
              onChange={(e) => setComponentNumber(e.target.value)}
            />
          </div>

          <div>
            <label>Component Name</label>
            <input
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
            />
          </div>

          <div>
            <label>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter Quantity"
            />
          </div>
         

          {productDetails && (
            <div>
              <label>Material Cost With GST</label>
              <input
                type="text"
                value={productDetails.materialCostWithGst}
                disabled
              />
            </div>
          )}

          <button onClick={handleGenerateBill}>Generate</button>
          <button onClick={handleToggleBill}>Close</button>
        </div>
      </div>
    )}
  </div>
</td>
              </tr>
            ))}
            
          </tbody>
          
        </table>
        </section>
      
      )}
      <button className='AddProduct' onClick={handleAddProduct}>Add Product</button>
    </main>
  );
};


export default Product;