import { useState } from 'react'
import { useNavigate } from 'react-router-dom' // Import useNavigate
import { Button } from '../components'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate() // Initialize navigation

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // For now: bypass actual API check
    console.log("Authenticating:", email)

    // 1. Set a dummy token so ProtectedRoute thinks we are logged in
    localStorage.setItem('adminToken', 'mock_token_123')

    // 2. Redirect to the dashboard
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-6">
      <div className="w-full max-w-md bg-white border border-surface-variant shadow-2xl overflow-hidden">
        
        {/* Header Block */}
        <div className="bg-primary p-8 text-white">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-70 block mb-2">
            System Authorization
          </span>
          <h1 className="text-4xl font-black font-headline tracking-tighter">
            ADMIN LOGIN<span className="text-tertiary">.</span>
          </h1>
        </div>

        {/* Form Block */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">
              Access Email
            </label>
            <input 
              type="email" 
              required
              className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-primary uppercase text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@system.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">
              Password
            </label>
            <input 
              type="password" 
              required
              className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-mono focus:outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            variant="tertiary" 
            className="w-full py-4 text-sm font-black tracking-[0.2em]"
          >
            LOGIN
          </Button>

        </form>
      </div>
    </div>
  )
}