// src/emailService.js
// ─────────────────────────────────────────────────────────
//  EmailJS — Envoie les candidatures Jobs & Stages
//
//  Setup :
//  1. npm install @emailjs/browser
//  2. Crée un compte sur emailjs.com
//  3. Service ID  → ton service Gmail lié
//  4. Template ID → crée un template avec les variables
//     {{from_name}}, {{from_email}}, {{phone}},
//     {{company}}, {{position}}, {{message}}, {{type}}
//  5. Public Key  → Account > API Keys
// ─────────────────────────────────────────────────────────
import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'REMPLACE_SERVICE_ID';   // ex: service_abc123
const TEMPLATE_ID = 'REMPLACE_TEMPLATE_ID';  // ex: template_xyz789
const PUBLIC_KEY  = 'REMPLACE_PUBLIC_KEY';   // ex: user_XXXXXXXXXX

/**
 * Envoie une candidature par email.
 * @param {Object} params
 * @param {string} params.from_name    - Nom du candidat
 * @param {string} params.from_email   - Email du candidat
 * @param {string} params.phone        - Téléphone
 * @param {string} params.company      - Entreprise cible
 * @param {string} params.position     - Poste / Stage
 * @param {string} params.message      - Message / note
 * @param {string} params.type         - 'Job' | 'Stage'
 * @param {string} params.cv_name      - Nom du fichier CV (optionnel)
 * @returns {Promise}
 */
export const sendApplication = (params) => {
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email:  'samosimo1617@gmail.com',
      from_name:  params.from_name  || '',
      from_email: params.from_email || '',
      phone:      params.phone      || '',
      company:    params.company    || '',
      position:   params.position   || '',
      message:    params.message    || '',
      type:       params.type       || 'Candidature',
      cv_name:    params.cv_name    || 'Non fourni',
    },
    PUBLIC_KEY
  );
};