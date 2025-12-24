import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === '251020031111222') {
      router.push('/room');
    } else {
      setError('Invalid access code');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '20px' }}>Screen Share App</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter access code"
            style={{
              padding: '10px',
              fontSize: '16px',
              width: '100%',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Enter Room
          </button>
          {error && (
            <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
          )}
        </form>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          Use code: 251020031111222
        </p>
      </div>
    </div>
  );
}