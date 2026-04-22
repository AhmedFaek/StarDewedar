import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components'
import { API_BASE_URL, HTTP_STATUS } from '../utils/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed. Please check your credentials.')
      }

      const tokens = await response.json()

      // Store tokens in localStorage
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      // Redirect to dashboard
      navigate('/')
    } catch (err) {
      setError(err.message || 'An error occurred during login. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
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
          {/* Error Message */}
          {error && (
            <div className="bg-error-container border border-error p-3 rounded">
              <p className="text-on-error-container text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">
              Access Email
            </label>
            <input 
              type="email" 
              required
              disabled={loading}
              className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-primary uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={loading}
              className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-mono focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            variant="tertiary" 
            disabled={loading}
            className="w-full py-4 text-sm font-black tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </Button>

        </form>
      </div>
    </div>
  )
}