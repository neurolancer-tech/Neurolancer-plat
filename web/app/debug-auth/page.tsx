'use client';

import { useState } from 'react';

export default function DebugAuth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/debug-auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      const text = await response.text();
      setResult({ 
        status: response.status,
        statusText: response.statusText,
        response: text.startsWith('{') ? JSON.parse(text) : text
      });
    } catch (error: any) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '32px' }}>
      <div style={{ maxWidth: '448px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>Debug Authentication</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
          />
          
          <button
            onClick={testAuth}
            disabled={loading || !username || !password}
            style={{ 
              width: '100%', 
              backgroundColor: loading || !username || !password ? '#9ca3af' : '#3b82f6', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '8px', 
              border: 'none',
              fontSize: '16px',
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Testing...' : 'Test Authentication'}
          </button>
        </div>
        
        {result && (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Result:</h3>
            <pre style={{ fontSize: '14px', overflow: 'auto', color: '#374151', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}