import { useState } from 'react';
import API from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const register = async () => {
    try {
      const res = await API.post('/auth/register', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/chat');
    } catch (err) { alert(err?.response?.data?.message || 'Error'); }
  };

  const login = async () => {
    try {
      const res = await API.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/chat');
    } catch (err) { alert(err?.response?.data?.message || 'Error'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Login / Register</h2>
        <input className="w-full p-2 border rounded mb-2" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full p-2 border rounded mb-4" placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={login} className="flex-1 p-2 bg-blue-600 text-white rounded">Login</button>
          <button onClick={register} className="flex-1 p-2 bg-green-600 text-white rounded">Register</button>
        </div>
      </div>
    </div>
  );
}
