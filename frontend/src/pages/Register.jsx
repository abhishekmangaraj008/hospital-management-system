import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { departmentApi } from '../services/api'
import VitalsRule from '../components/VitalsRule'
import { redirectByRole } from './Login'

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'PATIENT',
    departmentId: '', specialization: '', qualification: '', experienceYears: '',
  })
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    departmentApi.getAll().then((res) => setDepartments(res.data)).catch(() => {})
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (form.role !== 'DOCTOR') {
        delete payload.departmentId
        delete payload.specialization
        delete payload.qualification
        delete payload.experienceYears
      } else {
        payload.experienceYears = form.experienceYears ? Number(form.experienceYears) : null
        payload.departmentId = form.departmentId ? Number(form.departmentId) : null
      }
      const data = await register(payload)
      redirectByRole(data.role, navigate)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="center-shell">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="brand">MediCare</div>
        <VitalsRule />
        <h2>Create your account</h2>
        <p>Register as a patient or a doctor.</p>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>I am a</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
            </select>
          </div>
          <div className="field">
            <label>Full name</label>
            <input name="fullName" required value={form.fullName} onChange={handleChange} placeholder="Jordan Ellis" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </div>

          {form.role === 'DOCTOR' && (
            <>
              <div className="field">
                <label>Department</label>
                <select name="departmentId" value={form.departmentId} onChange={handleChange}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Specialization</label>
                <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="Cardiology" />
              </div>
              <div className="field">
                <label>Qualification</label>
                <input name="qualification" value={form.qualification} onChange={handleChange} placeholder="MBBS, MD" />
              </div>
              <div className="field">
                <label>Years of experience</label>
                <input type="number" min="0" name="experienceYears" value={form.experienceYears} onChange={handleChange} placeholder="5" />
              </div>
            </>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: '0.88rem' }}>
          Already have an account? <Link to="/login" className="link-btn">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
