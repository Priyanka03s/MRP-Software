import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebaseCofig'; // Ensure the correct Firebase config path
import { collection, addDoc, onSnapshot,getDocs } from 'firebase/firestore';
import './Project.css';

const ProjectDetails = ({ uid }) => {
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null); // Track active project for sidebar
  const [components, setComponents] = useState({}); // Store components for each project

  const navigate = useNavigate();

  // Real-time listener for Firestore updates
  useEffect(() => {
    if (!uid) {
      console.error("User ID is missing. Unable to fetch projects.");
      return;
    }

    const projectCollection = collection(db, 'Users', uid, 'Projects');

    const unsubscribe = onSnapshot(
      projectCollection,
      (snapshot) => {
        const projectList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList);
        setFilteredProjects(projectList);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching projects:', error);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [uid]);

  // Create a new project
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

  // Add a component to a project
 // Add a component to the Products collection of a project
const handleAddComponent = async (projectId) => {
  if (!uid) {
    console.error("User ID is missing. Unable to add components.");
    return;
  }

  const componentNumber = prompt('Enter Component Number:');
  if (!componentNumber) return;

  try {
    // Check for duplicate component numbers within the same project
    const productCollectionRef = collection(db, 'Users', uid, 'Projects', projectId, 'Products');
    const snapshot = await getDocs(productCollectionRef);

    const isDuplicate = snapshot.docs.some(
      (doc) => doc.data().componentNumber === componentNumber
    );

    if (isDuplicate) {
      alert('This component number already exists in this project. Please use a different number.');
      return;
    }

    // Add the component number as part of a new product
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

    await addDoc(productCollectionRef, newProduct);

    alert('Component added successfully to the Products collection!');
  } catch (error) {
    console.error('Error adding component to Products:', error);
    alert('Error adding component to Products.');
  }
};

  // Fetch components for a specific project
  const handleToggleComponents = (projectId) => {
    if (activeProjectId === projectId) {
      setActiveProjectId(null); // Close the sidebar if it's already open
      return;
    }
  
    // Fetch both components and products for the project
    const componentCollection = collection(db, 'Users', uid, 'Projects', projectId, 'Components');
    const productCollection = collection(db, 'Users', uid, 'Projects', projectId, 'Products');
  
    Promise.all([
      onSnapshot(componentCollection, (snapshot) => {
        const componentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComponents((prev) => ({ ...prev, [projectId]: componentList }));
      }),
      onSnapshot(productCollection, (snapshot) => {
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComponents((prev) => ({
          ...prev,
          [projectId]: [...(prev[projectId] || []), ...productList],
        }));
      }),
    ])
      .then(() => setActiveProjectId(projectId))
      .catch((error) => console.error('Error fetching components or products:', error));
  };
  // Navigate to project details
  const handleProjectClick = (projectId) => {
    navigate('/product', { state: { uid, projectId } });
  };

  // Handle input changes and filter projects
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

  // Handle dropdown hide on blur
  const handleDropdownBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div>
      <h4 className="header">Plan & Create Your Projects Easily with Our Software!🚀</h4>
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

      <div class="project-container">
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
        <li key={component.id}>
          {component.number || component.componentNumber || 'Unnamed Component'}
        </li>
      ))}
    </ul>
    {/* <button
      className="add-component"
      onClick={() => handleAddComponent(project.id)}
    >
      + Add Component
    </button> */}
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