import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === '251020031111222') {
      // Store access flag in localStorage
      localStorage.setItem('hasAccess', 'true');
      router.push('/room');
    } else {
      setError('Invalid access code');
    }
  };

  // If already has access, redirect to room
  if (typeof window !== 'undefined') {
    const hasAccess = localStorage.getItem('hasAccess');
    if (hasAccess === 'true') {
      router.push('/room');
      return null;
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        color: 'white',
        width: '90%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          marginBottom: '30px', 
          textAlign: 'center',
          color: '#4CAF50'
        }}>
          Screen Share App
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            placeholder="Enter access code"
            style={{
              padding: '15px',
              fontSize: '16px',
              width: '100%',
              marginBottom: '15px',
              border: '2px solid #444',
              borderRadius: '8px',
              backgroundColor: '#333',
              color: 'white',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '15px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Enter Room
          </button>
          {error && (
            <p style={{ 
              color: '#ff4444', 
              marginTop: '15px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {error}
            </p>
          )}
        </form>
        <p style={{ 
          marginTop: '25px', 
          fontSize: '14px', 
          color: '#888',
          textAlign: 'center'
        }}>
          Use code: <strong>251020031111222</strong>
        </p>
      </div>
    </div>
  );
}
