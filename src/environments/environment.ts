export const environment = {
  production: false,
  randoApiUrl: (typeof window !== 'undefined' && window.location?.hostname) ?
    'http://' + window.location.hostname + ':5000' : 'http://localhost:5000',
  hermesApiUrl: 'https://api.minimax.io/v1/chat/completions',
  hermesModel: 'minimax-m2.7',
  googlePlacesApiKey: 'YOUR_GOOGLE_PLACES_API_KEY', // Remplacer par votre clé
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // OAuth client ID (même que celui utilisé pour l'auth Google Workspace)
  googleCalendarApiKey: 'YOUR_GOOGLE_CALENDAR_API_KEY', // Clé API Google Calendar (depuis Google Cloud Console)
};