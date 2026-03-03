<script setup>
import { ref, onMounted } from 'vue'
import { useEventStore } from '../stores/events'
import api from '../services/api'
import Modal from '../components/Modal.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const eventStore = useEventStore()

const users = ref([])
const loadingUsers = ref(false)
const showEditModal = ref(false)
const editingUser = ref(null)

onMounted(async () => {
  await Promise.all([fetchUsers(), eventStore.fetchEvents()])
})

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const { data } = await api.get('/users')
    users.value = data
  } catch (err) {
    console.error('Erreur chargement utilisateurs:', err)
  } finally {
    loadingUsers.value = false
  }
}

function openEditModal(user) {
  editingUser.value = { ...user }
  showEditModal.value = true
}

async function saveUser() {
  try {
    await api.put(`/users/${editingUser.value._id}`, {
      name: editingUser.value.name,
      email: editingUser.value.email,
      role: editingUser.value.role,
    })
    showEditModal.value = false
    await fetchUsers()
  } catch (err) {
    console.error('Erreur modification utilisateur:', err)
  }
}

async function deleteUser(id) {
  if (!confirm('Supprimer cet utilisateur ?')) return
  try {
    await api.delete(`/users/${id}`)
    await fetchUsers()
  } catch (err) {
    console.error('Erreur suppression utilisateur:', err)
  }
}

async function deleteEvent(id) {
  if (!confirm('Supprimer cet événement ?')) return
  try {
    await eventStore.deleteEvent(id)
  } catch {
    // Erreur gérée dans le store
  }
}
</script>

<template>
  <div class="container page">
    <h1 class="page-title">Administration</h1>

    <!-- Gestion des utilisateurs -->
    <section style="margin-bottom: 3rem;">
      <h2 style="margin-bottom: 1rem;">Utilisateurs</h2>

      <LoadingSpinner v-if="loadingUsers" />

      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="navbar-role">{{ user.role }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="openEditModal(user)">
                  Modifier
                </button>
                <button class="btn btn-sm btn-danger" @click="deleteUser(user._id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Gestion des événements -->
    <section>
      <h2 style="margin-bottom: 1rem;">Événements</h2>

      <LoadingSpinner v-if="eventStore.loading" />

      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Places</th>
              <th>Organisateur</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in eventStore.events" :key="event._id">
              <td>{{ event.title }}</td>
              <td>{{ new Date(event.date).toLocaleDateString('fr-FR') }}</td>
              <td>{{ event.location }}</td>
              <td>{{ event.participants.length }} / {{ event.maxParticipants }}</td>
              <td>{{ event.organizer?.name }}</td>
              <td>
                <router-link :to="`/events/${event._id}/edit`" class="btn btn-sm btn-secondary">
                  Modifier
                </router-link>
                <button class="btn btn-sm btn-danger" @click="deleteEvent(event._id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal modification utilisateur -->
    <Modal v-if="showEditModal" title="Modifier l'utilisateur" @close="showEditModal = false">
      <form @submit.prevent="saveUser">
        <div class="form-group">
          <label for="edit-name">Nom</label>
          <input id="edit-name" v-model="editingUser.name" type="text" required />
        </div>

        <div class="form-group">
          <label for="edit-email">Email</label>
          <input id="edit-email" v-model="editingUser.email" type="email" required />
        </div>

        <div class="form-group">
          <label for="edit-role">Rôle</label>
          <select id="edit-role" v-model="editingUser.role">
            <option value="participant">Participant</option>
            <option value="organisateur">Organisateur</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button type="submit" class="btn btn-primary">Enregistrer</button>
          <button type="button" class="btn btn-outline" @click="showEditModal = false">Annuler</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
