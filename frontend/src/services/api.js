import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ---- Auth ----
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

// ---- Doctors ----
export const doctorApi = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getMyAppointments: () => api.get('/doctors/me/appointments'),
  updateAppointmentStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
}

// ---- Patients ----
export const patientApi = {
  getMe: () => api.get('/patients/me'),
  updateMe: (data) => api.put('/patients/me', data),
  getById: (id) => api.get(`/patients/${id}`),
  getMyPrescriptions: () => api.get('/patients/me/prescriptions'),
}

// ---- Appointments ----
export const appointmentApi = {
  book: (data) => api.post('/appointments', data),
  cancel: (id) => api.delete(`/appointments/${id}`),
  getMine: () => api.get('/appointments/me'),
  getByPatient: (id) => api.get(`/appointments/patient/${id}`),
  getByDoctor: (id) => api.get(`/appointments/doctor/${id}`),
}

// ---- Prescriptions ----
export const prescriptionApi = {
  create: (data) => api.post('/prescriptions', data),
  getByPatient: (id) => api.get(`/prescriptions/patient/${id}`),
}

// ---- Departments ----
export const departmentApi = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  delete: (id) => api.delete(`/departments/${id}`),
}

// ---- Admin ----
export const adminApi = {
  addDoctor: (data) => api.post('/admin/doctors', data),
  removeDoctor: (id) => api.delete(`/admin/doctors/${id}`),
  getAllPatients: () => api.get('/admin/patients'),
  removePatient: (id) => api.delete(`/admin/patients/${id}`),
  getAllAppointments: () => api.get('/admin/appointments'),
  getDashboardStats: () => api.get('/admin/dashboard'),
}

export default api
