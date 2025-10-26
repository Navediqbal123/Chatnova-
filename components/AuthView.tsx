
import React, { useState } from 'react';

interface AuthViewProps {
  onAuthSuccess: (username: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLoginView) {
      // Login logic
      try {
        const users = JSON.parse(localStorage.getItem('chatNovaUsers') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);
        if (user) {
          onAuthSuccess(user.username);
        } else {
          setError('Invalid email or password.');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      }
    } else {
      // Signup logic
       if (!username || !email || !password) {
        setError('All fields are required.');
        return;
      }
      try {
        const users = JSON.parse(localStorage.getItem('chatNovaUsers') || '[]');
        if (users.some((u: any) => u.email === email)) {
          setError('An account with this email already exists.');
          return;
        }
        const newUser = { username, email, password };
        users.push(newUser);
        localStorage.setItem('chatNovaUsers', JSON.stringify(users));
        onAuthSuccess(newUser.username);
      } catch (err) {
         setError('An error occurred during signup. Please try again.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f1a] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 glow-text">
              Welcome to ChatNova AI
            </h1>
            <p className="text-gray-400 mt-2">The future of conversation is here.</p>
        </div>
        
        <div className="bg-[#11111b]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl shadow-2xl p-8">
            <div className="flex border-b border-gray-700/50 mb-6">
                <button
                    onClick={() => setIsLoginView(true)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors duration-300 ${isLoginView ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Login
                </button>
                <button
                    onClick={() => setIsLoginView(false)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors duration-300 ${!isLoginView ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Sign Up
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {!isLoginView && (
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                        autoComplete="username"
                    />
                )}
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                    autoComplete="email"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                    autoComplete={isLoginView ? "current-password" : "new-password"}
                />
                
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                
                <button
                    type="submit"
                    className="w-full py-3 rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-border font-bold text-lg"
                >
                    {isLoginView ? 'Login' : 'Create Account'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
