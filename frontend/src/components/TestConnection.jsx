// src/components/TestConnection.js
import React, { useState } from 'react';
import axios from 'axios';

const TestConnection = () => {
  const [response, setResponse] = useState(null);

  const testConnection = async () => {
    try {
      const res = await axios.post('/api/predict-disease', {
        symptoms: ["headache", "nausea"]
      });
      setResponse(res.data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={testConnection}>Test Full Connection</button>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </div>
  );
};

export default TestConnection;
