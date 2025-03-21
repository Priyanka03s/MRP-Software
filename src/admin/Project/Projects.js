import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebaseCofig';
import { collection, addDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import './Project.css';
import { FiChevronRight, FiUser } from 'react-icons/fi';// Icon for options menu

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};


const ProjectDetails = ({ uid }) => {
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [components, setComponents] = useState({});
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredComponents, setFilteredComponents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) {
      console.error('User ID is missing. Unable to fetch projects.');
      return;
    }

    const projectCollection = collection(db, 'Users', uid, 'Projects');
    const unsubscribe = onSnapshot(projectCollection, (snapshot) => {
      const projectList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList);
      setFilteredProjects(projectList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const handleCreateProject = async () => {
    if (projectName.trim() === '' || !uid) {
      alert('Please enter a valid project name.');
      return;
    }

    try {
      await addDoc(collection(db, 'Users', uid, 'Projects'), {
        name: projectName,
      });
      setProjectName('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleAddComponent = async (projectId) => {
    if (isAddingComponent) return;
    setIsAddingComponent(true);

    if (!uid) {
      console.error("User ID is missing. Unable to add components.");
      setIsAddingComponent(false);
      return;
    }

    const componentNumber = prompt('Enter Component Number:');
    if (!componentNumber) {
      setIsAddingComponent(false);
      return;
    }

    try {
      const productCollectionRef = collection(db, 'Users', uid, 'Projects', projectId, 'Products');
      const snapshot = await getDocs(query(productCollectionRef, where('componentNumber', '==', componentNumber)));

      if (!snapshot.empty) {
        alert('This component number already exists in this project. Please use a different number.');
        setIsAddingComponent(false);
        return;
      }

      const newProduct = {
        componentNumber,
        purchaseNumber: '',
        purchaseQty: '',
        orderDate: '',
        componentName: '',
        hsnCode: '',
        quantity: '',
        materialName: '',
        invoiceNumber: '',
        materialCost: '',
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
        rejectionQuantity: '',
        reasonForRejection: '',
        unprocessedCost: '',
        lossInProcess: '',
      };

      await addDoc(productCollectionRef, newProduct);
      alert('Component added successfully!');
    } catch (error) {
      console.error('Error adding component to Products:', error);
      alert('Error adding component.');
    } finally {
      setIsAddingComponent(false);
    }
  };

  const handleToggleComponents = (projectId) => {
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      return;
    }

    const productCollection = collection(db, 'Users', uid, 'Projects', projectId, 'Products');
    const unsubscribe = onSnapshot(productCollection, (snapshot) => {
      const componentList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComponents((prev) => ({ ...prev, [projectId]: componentList }));
    });

    setActiveProjectId(projectId);

    return () => unsubscribe();
  };

  const handleProjectClick = (projectId) => {
    navigate('/product', { state: { uid, projectId } });
  };




  const handleInputChange = (e) => {
    const value = e.target.value;
    setProjectName(value);
    setFilteredProjects(
      projects.filter((project) =>
        project.name.toLowerCase().includes(value.toLowerCase())
      )
    );
    setShowDropdown(true);
  };
  const handleComponentMenuClick = (projectId, componentId, action) => {
    if (action === 'view') {
      const selected = components[projectId]?.find((component) => component.id === componentId);
      setSelectedComponent(selected);
      setIsModalOpen(true);
    }
  };
  const handleDropdownBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };
  const toggleOptions = (componentId) => {
    setShowOptions((prev) => (prev === componentId ? null : componentId));
  };

  // search component 

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  
    if (query === '') {
      setFilteredComponents([]);
    } else {
      const filtered = (components[activeProjectId] || []).filter((component) =>
        component.componentNumber?.toLowerCase().includes(query) ||
        component.componentName?.toLowerCase().includes(query)
      );
      setFilteredComponents(filtered);
    }
  };
  

  return (
    <div>
      <h4 className="header">Plan & Create Your Projects Easily with Our Software! 🚀</h4>
      <button className="create" onClick={handleCreateProject}>Add</button>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={projectName}
          onChange={handleInputChange}
          placeholder="Enter Project Name (Search or Create)"
          className="projectname"
          onFocus={() => setShowDropdown(true)}
          onBlur={handleDropdownBlur}
        />
        {showDropdown && (
          <div className="dropdown">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="dropdown-item"
                  onMouseDown={() => handleProjectClick(project.id)}
                >
                  {project.name}
                </div>
              ))
            ) : (
              <p className="no-projects">No projects found</p>
            )}
          </div>
        )}
      </div>

      <div className="project-container">
        {isLoading ? (
          <p>Loading projects...</p>
        ) : (
          <ol>
            {projects.map((project) => (
              <li key={project.id} className="project-item">
                <div className="project-name"    onMouseDown={() => handleProjectClick(project.id)} >
                  {project.name}
                </div>
                <button
                  className="toggle-components project-add-icon"
                  onClick={() => handleToggleComponents(project.id)}
                >
                  +
                </button>
                {activeProjectId === project.id && (
                  <div className="sidebar">
                    <h4>Components & Products Masters</h4>
                    <input
                     type="text"
                     placeholder="Search components..."
                     value={searchQuery}
                     onChange={handleSearch}
                     className="mb-4 p-2 border border-gray-300 rounded w-full"
                    />
                    {searchQuery && (
    <ul>
      {filteredComponents.map((component) => (
        <li key={component.id} className="mb-2">
          <div className="flex justify-between items-center p-2 bg-white rounded shadow">
            <span>{component.componentName} ({component.componentNumber})</span>
            <div>
              <button
                className="mr-2 p-1 text-blue-600"
                onClick={() =>
                  handleComponentMenuClick(project.id, component.id, 'view')
                }
              >
                View
              </button>
              <button
                className="p-1 text-green-600"
                onMouseDown={() => handleProjectClick(project.id)}
              >
                Master
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )}
                    <ol>
                    {components[project.id]?.map((component, index) => (
                      <div className='single' key={component.id}>
                       <span style={{color:'#fff', marginLeft:'10px'}}>{index + 1}. {component.componentNumber}</span> 
                       <button
                          className="icon-button"
                          onClick={() => toggleOptions(component.id)}
                        >
                      <FiChevronRight/>

                        </button>
                       {showOptions === component.id && (
                          <div className="options-menu">
                            <button
                              className="options-button"
                              onClick={() =>
                                handleComponentMenuClick(project.id, component.id, 'view')
                              }
                            >
                              View
                            </button>
                            <button
                              className="options-button"
                              onMouseDown={() => handleProjectClick(project.id)}
                            >
                              Master
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    </ol>
                    <button
                      className="add-component"
                      onClick={() => handleAddComponent(project.id)}
                    >
                      + Add Component
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
  {selectedComponent ? (
    <div className="modal-content">
      <h3 className="modal-header">{selectedComponent.componentNumber} Details</h3>
      <table className="modal-table">
        <thead>
          <tr>
            <th>Component Number</th>
            <th>Component Name</th>
            <th>Material Name</th>
            <th>Purchase Number</th>
            <th>Purchase Quantity</th>
            <th>Order Date</th>
            <th>Hsn Code</th>
            <th>Outhouse Balance Quantity</th>
            <th>Inhouse Balance Quantity</th>
            <th>Invoice NO</th>
            <th>Matirial Cost</th>
            <th>Material Total With Gst</th>
            <th>Rejection Quantity</th>
            <th>Reason For Rejection</th>
            <th>Unprocessed Cost</th>
            <th>Loss In Process</th>
          
           
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{selectedComponent.componentNumber}</td>
            <td>{selectedComponent.componentName}</td>
            <td>{selectedComponent.materialName}</td>
            <td>{selectedComponent.purchaseNumber}</td>
            <td>{selectedComponent.purchaseQty}</td>
            <td>{selectedComponent.orderDate}</td>
            <td>{selectedComponent.hsnCode}</td>
            <td>{selectedComponent.outhouseBalanceQuantity}</td>
            <td>{selectedComponent.inhouseBalanceQuantity}</td>
            <td>{selectedComponent.invoiceNumber}</td>
            <td>{selectedComponent.materialCost}</td>
            <td>{selectedComponent.materialCostWithGst}</td>
            <td>{selectedComponent.rejectionQuantity}</td>
            <td>{selectedComponent.reasonForRejection}</td>
            <td>{selectedComponent.unprocessedCost}</td>
            <td>{selectedComponent.lossInProcess}</td>
          </tr>
        </tbody>
      </table>
      <div className="modal-buttons">
        
        <button className="close-button" onClick={() => setIsModalOpen(false)}>
          Close
        </button>
      </div>
    </div>
  ) : (
    <p>No details available.</p>
  )}
</Modal>


    </div>
    
  );
};

const ParentComponent = () => {
  const [uid, setUid] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
      setIsLoadingUser(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {isLoadingUser ? (
        <p>Loading user data...</p>
      ) : uid ? (
        <ProjectDetails uid={uid} />
      ) : (
        <p>User not logged in.</p>
      )}
    </div>
  );
};

export default ParentComponent;
