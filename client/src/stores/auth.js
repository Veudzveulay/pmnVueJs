import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isOrganisateur = computed(() => user.value?.role === 'organisateur')
  const isParticipant = computed(() => user.value?.role === 'participant')

  async function register(userData) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post('/auth/register', userData)
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'inscription.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post('/auth/login', credentials)
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la connexion.'
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchMe() {
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch {
      logout()
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isOrganisateur,
    isParticipant,
    register,
    login,
    logout,
    fetchMe,
  }
})
