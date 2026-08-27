import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import { doctorApi, appointmentApi, patientApi } from '../services/api'

const TABS = [
  { key: 'doctors', label: 'Find a doctor' },
  { key: 'appointments', label: 'My appointments' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'profile', label: 'My profile' },
]

export default function PatientDashboard() {
  const [tab, setTab] = useState('doctors')

  return (
    <DashboardLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'doctors' && <FindDoctors />}
      {tab === 'appointments' && <MyAppointments />}
      {tab === 'prescriptions' && <MyPrescriptions />}
      {tab === 'profile' && <MyProfile />}
    </DashboardLayout>
  )
}

function FindDoctors() {
  const [doctors, setDoctors] = useState([])
  const [query, setQuery] = useState('')
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [form, setForm] = useState({ appointmentDate: '', appointmentTime: '', reason: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    doctorApi.getAll().then((res) => setDoctors(res.data)).catch(() => setError('Could not load doctors.'))
  }, [])

  const filtered = doctors.filter((d) =>
    `${d.fullName} ${d.specialization} ${d.departmentName}`.toLowerCase().includes(query.toLowerCase())
  )

  const startBooking = (doctor) => {
    setBookingDoctor(doctor)
    setMessage('')
    setError('')
  }

  const submitBooking = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await appointmentApi.book({ doctorId: bookingDoctor.id, ...form })
      setMessage(`Appointment requested with Dr. ${bookingDoctor.fullName}.`)
      setBookingDoctor(null)
      setForm({ appointmentDate: '', appointmentTime: '', reason: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not book appointment.')
    }
  }

  return (
    <div>
      <div className="top-bar">
        <div><h1>Find a doctor</h1><p>Search by name, specialization, or department.</p></div>
      </div>

      {message && <div className="form-success-banner">{message}</div>}
      {error && <div className="form-error-banner">{error}</div>}

      <div className="field" style={{ maxWidth: 360 }}>
        <input placeholder="Search doctors…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {bookingDoctor && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--accent)' }}>
          <h3>Book with Dr. {bookingDoctor.fullName}</h3>
          <form onSubmit={submitBooking}>
            <div className="field">
              <label>Date</label>
              <input type="date" required min={new Date().toISOString().split('T')[0]} value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Time <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(9:00 AM – 5:00 PM)</span></label>
              <input type="time" required min="09:00" max="17:00" value={form.appointmentTime}
                onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })} />
            </div>
            <div className="field">
              <label>Reason for visit</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe your symptoms" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-accent" type="submit">Confirm request</button>
              <button className="btn btn-outline" type="button" onClick={() => setBookingDoctor(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-grid">
        {filtered.map((d) => (
          <div key={d.id} className="doctor-card">
            <div className="dept-tag">{d.departmentName || 'General'}</div>
            <h3 style={{ margin: 0 }}>Dr. {d.fullName}</h3>
            <p style={{ margin: 0 }}>{d.specialization || 'General practice'} · {d.experienceYears ?? 0} yrs exp.</p>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{d.qualification}</p>
            <button className="btn btn-accent btn-sm" style={{ marginTop: 8, alignSelf: 'flex-start' }} onClick={() => startBooking(d)}>
              Book appointment
            </button>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state">No doctors match your search.</div>}
      </div>
    </div>
  )
}

function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')

  const load = () => appointmentApi.getMine().then((res) => setAppointments(res.data)).catch(() => setError('Could not load appointments.'))

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    try {
      await appointmentApi.cancel(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel appointment.')
    }
  }

  return (
    <div>
      <h1>My appointments</h1>
      <p>Track upcoming visits and cancel if plans change.</p>
      {error && <div className="form-error-banner">{error}</div>}

      <div className="card">
        {appointments.map((a) => (
          <div className="list-row" key={a.id}>
            <div>
              <strong>Dr. {a.doctorName}</strong>
              <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {a.appointmentDate} · {a.appointmentTime} · {a.departmentName}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusBadge status={a.status} />
              {(a.status === 'PENDING' || a.status === 'ACCEPTED') && (
                <button className="btn btn-danger btn-sm" onClick={() => cancel(a.id)}>Cancel</button>
              )}
            </div>
          </div>
        ))}
        {appointments.length === 0 && <div className="empty-state">No appointments yet — book one from "Find a doctor".</div>}
      </div>
    </div>
  )
}

function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    patientApi.getMyPrescriptions().then((res) => setPrescriptions(res.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1>Prescriptions</h1>
      <p>Diagnoses and medicines from your doctors.</p>

      {prescriptions.map((p) => (
        <div className="card" key={p.id}>
          <div className="top-bar">
            <h3 style={{ margin: 0 }}>Dr. {p.doctorName}</h3>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{p.issuedDate}</span>
          </div>
          <p><strong style={{ color: 'var(--ink)' }}>Diagnosis:</strong> {p.diagnosis}</p>
          <p><strong style={{ color: 'var(--ink)' }}>Medicines:</strong> {p.medicines}</p>
          {p.notes && <p><strong style={{ color: 'var(--ink)' }}>Notes:</strong> {p.notes}</p>}
        </div>
      ))}
      {prescriptions.length === 0 && <div className="empty-state">No prescriptions on file yet.</div>}
    </div>
  )
}

function MyProfile() {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ dateOfBirth: '', gender: '', address: '', bloodGroup: '', phone: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => patientApi.getMe().then((res) => {
    setProfile(res.data)
    setForm({
      dateOfBirth: res.data.dateOfBirth || '',
      gender: res.data.gender || '',
      address: res.data.address || '',
      bloodGroup: res.data.bloodGroup || '',
      phone: res.data.phone || '',
    })
  }).catch(() => setError('Could not load profile.'))

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await patientApi.updateMe(form)
      setMessage('Profile updated.')
      setEditing(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.')
    }
  }

  if (!profile) return <div className="empty-state">Loading profile…</div>

  return (
    <div>
      <div className="top-bar">
        <h1>My profile</h1>
        {!editing && <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>}
      </div>

      {message && <div className="form-success-banner">{message}</div>}
      {error && <div className="form-error-banner">{error}</div>}

      {!editing ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="list-row"><span>Name</span><strong>{profile.fullName}</strong></div>
          <div className="list-row"><span>Email</span><strong>{profile.email}</strong></div>
          <div className="list-row"><span>Phone</span><strong>{profile.phone || '—'}</strong></div>
          <div className="list-row"><span>Date of birth</span><strong>{profile.dateOfBirth || '—'}</strong></div>
          <div className="list-row"><span>Gender</span><strong>{profile.gender || '—'}</strong></div>
          <div className="list-row"><span>Blood group</span><strong>{profile.bloodGroup || '—'}</strong></div>
          <div className="list-row"><span>Address</span><strong>{profile.address || '—'}</strong></div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 480 }}>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Date of birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div className="field">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Prefer not to say</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="field">
              <label>Blood group</label>
              <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                <option value="">Unknown</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-accent" type="submit">Save changes</button>
              <button className="btn btn-outline" type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
