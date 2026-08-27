import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VitalsRule from '../components/VitalsRule'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form)
      redirectByRole(data.role, navigate)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="center-shell">
      <div className="auth-card">
        <div className="brand">MediCare</div>
        <VitalsRule />
        <h2>Welcome back</h2>
        <p>Sign in to manage appointments and records.</p>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: '0.88rem' }}>
          Don't have an account? <Link to="/register" className="link-btn">Register</Link>
        </p>
      </div>
    </div>
  )
}

export function redirectByRole(role, navigate) {
  if (role === 'PATIENT') navigate('/patient')
  else if (role === 'DOCTOR') navigate('/doctor')
  else if (role === 'ADMIN') navigate('/admin')
  else navigate('/login')
}
