import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebaseCofig'; // Ensure the correct Firebase config path
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import './Project.css';

const ProjectDetails = ({ uid }) => {
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false); // Track visibility of project list
  const [showCreateButton, setShowCreateButton] = useState(true); // Track visibility of Create button
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
    setShowProjectList(true); // Show project list when input is focused
    setShowCreateButton(false); // Hide create button when typing
  };

  // Handle dropdown hide on blur
  const handleDropdownBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div>
      <h4
        style={{
          color: '#fff',
          backgroundColor: '#007bff',
          padding: '10px',
          marginBottom: '50px',
        }}
      >
        Plan & Create Your Projects Easily with Our Software!🚀
      </h4>
      <button className="create" onClick={handleCreateProject}>
        Add
      </button>
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
          <div
            className="dropdown"
            style={{
              position: 'absolute',
              top: '40px',
              left: '0',
              right: '0',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxHeight: '150px',
              overflowY: 'auto',
              zIndex: '10',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f1f1',
                  }}
                  onMouseDown={() => handleProjectClick(project.id)}
                >
                  {project.name}
                </div>
              ))
            ) : (
              <p style={{ padding: '10px', color: '#666' }}>No projects found</p>
            )}
          </div>
        )}
      </div>
      {/* Show Project List only if showProjectList is true */}
      {showProjectList && (
        <div className="projectnames-list">
          <h3
            style={{
              color: '#fff',
              backgroundColor: '#007bff',
              width: '180px',
              paddingLeft: '10px',
            }}
          >
            Project List
          </h3>
          <div className="project_body">
            {isLoading ? (
              <p></p>
            ) : (
              <ol style={{ color: '#000' }}>
                {filteredProjects.map((project) => (
                  <li key={project.id}>
                    <div
                      className="list-1"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      {project.name}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
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
