import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import { doctorApi, prescriptionApi } from '../services/api'

const TABS = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'prescriptions', label: 'Write prescription' },
]

export default function DoctorDashboard() {
  const [tab, setTab] = useState('appointments')

  return (
    <DashboardLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'appointments' && <MyAppointments />}
      {tab === 'prescriptions' && <WritePrescription />}
    </DashboardLayout>
  )
}

function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')

  const load = () => doctorApi.getMyAppointments().then((res) => setAppointments(res.data)).catch(() => setError('Could not load appointments.'))

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    try {
      await doctorApi.updateAppointmentStatus(id, status)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update appointment.')
    }
  }

  return (
    <div>
      <h1>Appointments</h1>
      <p>Review requests and manage your schedule.</p>
      {error && <div className="form-error-banner">{error}</div>}

      <div className="card">
        {appointments.map((a) => (
          <div className="list-row" key={a.id}>
            <div>
              <strong>{a.patientName}</strong>
              <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {a.appointmentDate} · {a.appointmentTime}
              </div>
              {a.reason && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{a.reason}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge status={a.status} />
              {a.status === 'PENDING' && (
                <>
                  <button className="btn btn-accent btn-sm" onClick={() => updateStatus(a.id, 'ACCEPTED')}>Accept</button>
                  <button className="btn btn-danger btn-sm" onClick={() => updateStatus(a.id, 'REJECTED')}>Reject</button>
                </>
              )}
              {a.status === 'ACCEPTED' && (
                <button className="btn btn-outline btn-sm" onClick={() => updateStatus(a.id, 'COMPLETED')}>Mark completed</button>
              )}
            </div>
          </div>
        ))}
        {appointments.length === 0 && <div className="empty-state">No appointments yet.</div>}
      </div>
    </div>
  )
}

function WritePrescription() {
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState({ appointmentId: '', diagnosis: '', medicines: '', notes: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // The backend only allows prescriptions on COMPLETED appointments,
    // so only offer those here to avoid a confusing round-trip error.
    doctorApi.getMyAppointments().then((res) =>
      setAppointments(res.data.filter((a) => a.status === 'COMPLETED'))
    ).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await prescriptionApi.create({ ...form, appointmentId: Number(form.appointmentId) })
      setMessage('Prescription created successfully.')
      setForm({ appointmentId: '', diagnosis: '', medicines: '', notes: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create prescription.')
    }
  }

  return (
    <div>
      <h1>Write prescription</h1>
      <p>Add a diagnosis and medicines for a completed consultation.</p>

      {message && <div className="form-success-banner">{message}</div>}
      {error && <div className="form-error-banner">{error}</div>}

      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Appointment</label>
            <select required value={form.appointmentId} onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}>
              <option value="">Select appointment</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.patientName} — {a.appointmentDate}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Diagnosis</label>
            <textarea required value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
          </div>
          <div className="field">
            <label>Medicines</label>
            <textarea required value={form.medicines} onChange={(e) => setForm({ ...form, medicines: e.target.value })} placeholder="Name, dosage, frequency" />
          </div>
          <div className="field">
            <label>Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="btn btn-accent" type="submit">Save prescription</button>
        </form>
      </div>
    </div>
  )
}
