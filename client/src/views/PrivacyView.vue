<script setup>
</script>

<template>
  <div class="page">
    <div class="container privacy-page">
      <h1 class="page-title">Politique de confidentialité</h1>
      <p class="privacy-date">Dernière mise à jour : 31 mars 2026 — Version 1.0</p>

      <div class="card privacy-section">
        <h2>1. Responsable du traitement</h2>
        <p>
          <strong>EventFlow</strong> est responsable du traitement de vos données personnelles.
        </p>
        <ul>
          <li><strong>DPO (Délégué à la Protection des Données) :</strong> dpo@eventflow.local</li>
          <li><strong>Contact :</strong> contact@eventflow.local</li>
        </ul>
      </div>

      <div class="card privacy-section">
        <h2>2. Données collectées</h2>
        <p>Nous collectons les données suivantes lors de votre utilisation de la plateforme :</p>
        <table>
          <thead>
            <tr>
              <th>Donnée</th>
              <th>Finalité</th>
              <th>Base légale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nom, Prénom</td>
              <td>Identification sur la plateforme</td>
              <td>Consentement</td>
            </tr>
            <tr>
              <td>Adresse email</td>
              <td>Authentification, communication</td>
              <td>Exécution du contrat</td>
            </tr>
            <tr>
              <td>Mot de passe (hashé)</td>
              <td>Sécurité du compte</td>
              <td>Exécution du contrat</td>
            </tr>
            <tr>
              <td>Téléphone (optionnel)</td>
              <td>Contact pour les événements</td>
              <td>Consentement</td>
            </tr>
            <tr>
              <td>Adresse IP (hashée)</td>
              <td>Sécurité, logs de consentement</td>
              <td>Intérêt légitime</td>
            </tr>
            <tr>
              <td>Inscriptions aux événements</td>
              <td>Gestion des participations</td>
              <td>Exécution du contrat</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card privacy-section">
        <h2>3. Durée de conservation</h2>
        <ul>
          <li><strong>Données de compte :</strong> conservées tant que le compte est actif, puis anonymisées après 2 ans d'inactivité.</li>
          <li><strong>Logs de consentement :</strong> conservés 5 ans conformément aux obligations légales de preuve.</li>
          <li><strong>Données d'événements :</strong> conservées 1 an après la date de l'événement.</li>
        </ul>
      </div>

      <div class="card privacy-section">
        <h2>4. Vos droits</h2>
        <p>Conformément au RGPD (Règlement Général sur la Protection des Données), vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès :</strong> consulter toutes les données que nous détenons sur vous.</li>
          <li><strong>Droit de rectification :</strong> modifier vos données personnelles à tout moment.</li>
          <li><strong>Droit à l'effacement :</strong> demander l'anonymisation de votre compte.</li>
          <li><strong>Droit à la portabilité :</strong> exporter vos données au format JSON.</li>
          <li><strong>Droit d'opposition :</strong> retirer votre consentement à tout moment.</li>
        </ul>
        <p>
          Vous pouvez exercer ces droits depuis la page
          <router-link to="/my-data" class="privacy-link">Mes données personnelles</router-link>.
        </p>
      </div>

      <div class="card privacy-section">
        <h2>5. Cookies</h2>
        <p>EventFlow utilise trois catégories de cookies :</p>
        <ul>
          <li><strong>Cookies nécessaires :</strong> indispensables au fonctionnement (authentification JWT, session). Toujours actifs.</li>
          <li><strong>Cookies analytiques :</strong> mesure d'audience anonymisée. Soumis à votre consentement.</li>
          <li><strong>Cookies marketing :</strong> personnalisation de contenu. Soumis à votre consentement.</li>
        </ul>
        <p>Vous pouvez modifier vos préférences à tout moment via le bandeau cookies.</p>
      </div>

      <div class="card privacy-section">
        <h2>6. Sécurité des données</h2>
        <ul>
          <li>Les mots de passe sont hashés avec <strong>bcrypt</strong> (12 rounds).</li>
          <li>Les adresses IP sont hashées avec <strong>SHA-256</strong> avant stockage.</li>
          <li>L'authentification repose sur des tokens <strong>JWT</strong> avec expiration.</li>
          <li>L'accès aux données est restreint par un système de <strong>rôles</strong> (RBAC).</li>
          <li>Les comptes inactifs sont automatiquement <strong>anonymisés</strong> après 2 ans.</li>
        </ul>
      </div>

      <div class="card privacy-section">
        <h2>7. Transfert de données</h2>
        <p>
          Vos données sont hébergées en France/Union Européenne.
          Aucun transfert vers un pays tiers n'est effectué.
        </p>
      </div>

      <div class="card privacy-section">
        <h2>8. Contact</h2>
        <p>
          Pour toute question relative à vos données personnelles, contactez notre DPO :
          <strong>dpo@eventflow.local</strong>
        </p>
        <p>
          Vous pouvez également adresser une réclamation à la
          <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :
          <a href="https://www.cnil.fr" target="_blank" rel="noopener" class="privacy-link">www.cnil.fr</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-page {
  max-width: 800px;
}

.privacy-date {
  color: var(--gray);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.privacy-section {
  margin-bottom: 1.5rem;
}

.privacy-section h2 {
  font-size: 1.1rem;
  color: var(--dark);
  margin-bottom: 0.75rem;
}

.privacy-section p {
  font-size: 0.9rem;
  color: var(--gray);
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.privacy-section ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.privacy-section li {
  font-size: 0.9rem;
  color: var(--gray);
  line-height: 1.6;
  margin-bottom: 0.25rem;
}

.privacy-section table {
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.privacy-link {
  color: var(--primary);
  font-weight: 600;
}
</style>
