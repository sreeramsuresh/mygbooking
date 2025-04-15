// src/App.jsx
import React, { useState } from "react";
import FormComponent from "./Components/TableComponent/FormComponent";
import TableComponent from "./Components/TableComponent/TableComponent";
import LoginComponent from "../src/Components/LoginComponent";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";
const AppContent = () => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { user, logout, isManager } = useAuth();

  const handleEdit = (record) => {
    setSelectedRecord(record);
  };

  const handleFormSubmit = () => {
    setSelectedRecord(null);
  };

  if (!user) {
    return <LoginComponent />;
  }

  return (
    <div className="App">
      <header>
        <h1>CRUD Application</h1>
        <div className="user-info">
          <span>
            Logged in as: {user.username} ({user.role})
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {isManager() && (
        <FormComponent
          selectedRecord={selectedRecord}
          onFormSubmit={handleFormSubmit}
        />
      )}

      <TableComponent handleEdit={handleEdit} showActions={isManager()} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
