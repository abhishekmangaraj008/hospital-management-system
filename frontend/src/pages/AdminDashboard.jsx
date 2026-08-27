import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import { adminApi, departmentApi } from '../services/api'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'doctors', label: 'Doctors' },
  { key: 'patients', label: 'Patients' },
  { key: 'departments', label: 'Departments' },
  { key: 'appointments', label: 'Appointments' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard')

  return (
    <DashboardLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'dashboard' && <Stats />}
      {tab === 'doctors' && <ManageDoctors />}
      {tab === 'patients' && <ManagePatients />}
      {tab === 'departments' && <ManageDepartments />}
      {tab === 'appointments' && <AllAppointments />}
    </DashboardLayout>
  )
}

function Stats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminApi.getDashboardStats().then((res) => setStats(res.data)).catch(() => {})
  }, [])

  if (!stats) return <div className="empty-state">Loading dashboard…</div>

  const cards = [
    { label: 'Doctors', value: stats.totalDoctors },
    { label: 'Patients', value: stats.totalPatients },
    { label: 'Appointments', value: stats.totalAppointments },
    { label: 'Departments', value: stats.totalDepartments },
  ]

  return (
    <div>
      <h1>Dashboard</h1>
      <p>A quick snapshot of the hospital.</p>
      <div className="card-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ManageDoctors() {
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'DOCTOR',
    departmentId: '', specialization: '', qualification: '', experienceYears: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    departmentApi.getAll().then((res) => setDepartments(res.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await adminApi.addDoctor({
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
      })
      setMessage(`Doctor ${form.fullName} added.`)
      setForm({ fullName: '', email: '', password: '', phone: '', role: 'DOCTOR', departmentId: '', specialization: '', qualification: '', experienceYears: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add doctor.')
    }
  }

  return (
    <div>
      <h1>Manage doctors</h1>
      <p>Add new doctors to the hospital roster.</p>

      {message && <div className="form-success-banner">{message}</div>}
      {error && <div className="form-error-banner">{error}</div>}

      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Full name</label>
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div className="field"><label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Temporary password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="field"><label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label>Department</label>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="field"><label>Specialization</label>
            <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
          <div className="field"><label>Qualification</label>
            <input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
          <div className="field"><label>Years of experience</label>
            <input type="number" min="0" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} /></div>
          <button className="btn btn-accent" type="submit">Add doctor</button>
        </form>
      </div>
    </div>
  )
}

function ManagePatients() {
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')

  const load = () => adminApi.getAllPatients().then((res) => setPatients(res.data)).catch(() => setError('Could not load patients.'))

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    try {
      await adminApi.removePatient(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove patient.')
    }
  }

  return (
    <div>
      <h1>Manage patients</h1>
      <p>View and remove registered patients.</p>
      {error && <div className="form-error-banner">{error}</div>}
      <div className="card">
        {patients.map((p) => (
          <div className="list-row" key={p.id}>
            <div>
              <strong>{p.fullName}</strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{p.email} · {p.phone || 'No phone'}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Remove</button>
          </div>
        ))}
        {patients.length === 0 && <div className="empty-state">No patients registered yet.</div>}
      </div>
    </div>
  )
}

function ManageDepartments() {
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  const load = () => departmentApi.getAll().then((res) => setDepartments(res.data)).catch(() => setError('Could not load departments.'))

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await departmentApi.create(form)
      setForm({ name: '', description: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create department.')
    }
  }

  const remove = async (id) => {
    try {
      await departmentApi.delete(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove department.')
    }
  }

  return (
    <div>
      <h1>Manage departments</h1>
      <p>Organize doctors by medical department.</p>
      {error && <div className="form-error-banner">{error}</div>}

      <div className="card" style={{ maxWidth: 440, marginBottom: 16 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Department name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cardiology" />
          </div>
          <button className="btn btn-accent" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        {departments.map((d) => (
          <div className="list-row" key={d.id}>
            <strong>{d.name}</strong>
            <button className="btn btn-danger btn-sm" onClick={() => remove(d.id)}>Remove</button>
          </div>
        ))}
        {departments.length === 0 && <div className="empty-state">No departments yet.</div>}
      </div>
    </div>
  )
}

function AllAppointments() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    adminApi.getAllAppointments().then((res) => setAppointments(res.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1>All appointments</h1>
      <p>Hospital-wide appointment activity.</p>
      <div className="card">
        {appointments.map((a) => (
          <div className="list-row" key={a.id}>
            <div>
              <strong>{a.patientName}</strong> with Dr. {a.doctorName}
              <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {a.appointmentDate} · {a.appointmentTime} · {a.departmentName}
              </div>
            </div>
            <StatusBadge status={a.status} />
          </div>
        ))}
        {appointments.length === 0 && <div className="empty-state">No appointments recorded yet.</div>}
      </div>
    </div>
  )
}
