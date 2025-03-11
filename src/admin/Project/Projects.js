import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebaseCofig';
import { collection, addDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import './Project.css';

const ProjectDetails = ({ uid }) => {
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [components, setComponents] = useState({});
  const [isAddingComponent, setIsAddingComponent] = useState(false); // To prevent duplicate submissions

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
    if (isAddingComponent) return; // Prevent multiple clicks
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

  const handleDropdownBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
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
                <div className="project-name" onClick={() => handleProjectClick(project.id)}>
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
                    <h4>Components & Products</h4>
                    <ul>
                      {components[project.id]?.map((component) => (
                        <li key={component.id} className="component-item">
                          <span>{component.componentNumber || 'Unnamed Component'} </span>
                          <span
                            style={{
                              backgroundColor: component.inhouseStatus.processing.color,
                              borderRadius: '50%',
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              marginLeft: '8px',
                            }}
                          ></span>
                          <span style={{ marginLeft: '10px' }}>
                            {component.processType === 'In-house'
                              ? `Balance: ${component.inhouseDetails.inhouseBalanceQuantity || 0}`
                              : `Balance: ${component.outhouseDetails.outhouseBalanceQuantity || 0}`}
                          </span>
                        </li>
                      ))}
                    </ul>
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