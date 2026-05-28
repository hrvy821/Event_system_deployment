import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, role }) {
  const [showModal, setShowModal] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);

  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  
  if (!token) {
    return <Navigate to="/login" />;
  }

  
  if (role && user.role !== role) {
    if (!showModal) {
      setShowModal(true);
      setRedirectTo('/');
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
          <div className="flex justify-end">
            <button 
              onClick={() => setRedirectTo('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} />;
  }

  
  return children;
}