const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// VAPID keys definition (matching the public key in useRealtimeNotifications.ts)
const PUBLIC_VAPID_KEY = 'BK3l5bBpfj25jrmqizzbbf6zRl51Q5PuYeJR2buxQFOlJDlTVhzbAY3dmW_mjde_FnYvEHKXVeTVVXfUIuSTeH0';
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY || 'aAYaMwXHj5gLNzG25PzhkLk9RAEYPi4plpLTnwacppQ';

webpush.setVapidDetails(
  'mailto:soporte@hayequipo.com',
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

// Read arguments
const args = process.argv.slice(2);
const title = args[0] || 'Aviso de Hay Equipo ⚽';
const body = args[1] || 'Ingresá a la aplicación para ver las novedades.';
const url = args[2] || '/';

// Parse .env file manually
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Prefer service role key to bypass RLS

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const matchUrl = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.*)\s*$/);
    if (matchUrl) supabaseUrl = matchUrl[1].trim().replace(/['"]/g, '');
    
    const matchKey = line.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)\s*$/);
    if (matchKey) supabaseKey = matchKey[1].trim().replace(/['"]/g, '');
  }
} catch (e) {
  // Config files missing or read error
}

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL no definido.');
  process.exit(1);
}

if (!supabaseKey) {
  console.warn('ADVERTENCIA: No se encontró SUPABASE_SERVICE_ROLE_KEY. Se intentará usar VITE_SUPABASE_ANON_KEY (puede fallar si RLS está activo).');
  // Fallback to anon key
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const matchAnon = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.*)\s*$/);
      if (matchAnon) supabaseKey = matchAnon[1].trim().replace(/['"]/g, '');
    }
  } catch (e) {}
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log(`Buscando dispositivos registrados en Supabase...`);
  
  const { data: subscriptions, error } = await supabase
    .from('hayequipo_push_subscriptions')
    .select('*, hayequipo_profiles(full_name)');

  if (error) {
    console.error('Error al consultar las suscripciones:', error);
    process.exit(1);
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No se encontraron dispositivos registrados.');
    console.log('Ingresá a la app, concedé permisos de notificación y luego volvé a intentar.');
    process.exit(0);
  }

  console.log(`Enviando alerta push a ${subscriptions.length} dispositivo(s):`);
  console.log(`Título: "${title}"`);
  console.log(`Cuerpo: "${body}"`);
  console.log(`URL: "${url}"`);
  console.log('------------------------------------------------');

  const payload = JSON.stringify({ title, body, url });

  let successCount = 0;
  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh
      }
    };

    const userLabel = sub.hayequipo_profiles?.full_name || 'Usuario desconocido';
    const agentLabel = sub.user_agent ? sub.user_agent.substring(0, 40) + '...' : 'Dispositivo desconocido';

    try {
      await webpush.sendNotification(pushSubscription, payload);
      console.log(`✅ ENVIADO: ${userLabel} (${agentLabel})`);
      successCount++;
    } catch (err) {
      console.error(`❌ ERROR: ${userLabel} (${agentLabel}) -`, err.message);
      // Clean up stale subscription from DB if endpoint no longer exists/expired
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`   -> Eliminando suscripción obsoleta de la base de datos...`);
        await supabase
          .from('hayequipo_push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
      }
    }
  }

  console.log('------------------------------------------------');
  console.log(`Resumen: ${successCount} de ${subscriptions.length} notificaciones enviadas con éxito.`);
}

run();
