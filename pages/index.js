import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === '251020031111222') {
      // Store access
      localStorage.setItem('hasAccess', 'true');
      localStorage.setItem('userId', `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`);
      router.push('/room');
    } else {
      alert('Invalid code. Use: 251020031111222');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000',
      color: 'white'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '40px',
        borderRadius: '10px',
        textAlign: 'center',
        width: '90%',
        maxWidth: '400px'
      }}>
        <h1 style={{ color: '#00ff88', marginBottom: '30px' }}>Screen Share</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code: 251020031111222"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              marginBottom: '20px',
              background: '#2a2a2a',
              border: '2px solid #333',
              borderRadius: '5px',
              color: 'white',
              textAlign: 'center'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              background: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ENTER ROOM
          </button>
        </form>
        <p style={{ marginTop: '20px', color: '#888' }}>
          Code: <strong>251020031111222</strong>
        </p>
      </div>
    </div>
  );
}
