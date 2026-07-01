export type UserRole = 'dt' | 'jugador' | 'pf' | 'nutri' | 'admin';

export interface DemoUser {
  id: string;
  supabaseId: string;
  name: string;
  email?: string;
  role: UserRole;
  roleLabel: string;
  initials: string;
  color: string;
  emoji: string;
  playerId?: string; // links to a player in the roster
}

export const demoUsers: DemoUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    supabaseId: '11111111-1111-1111-1111-111111111111',
    name: 'Caruso Lombardi (DT)',
    role: 'dt',
    roleLabel: 'Director Técnico',
    initials: 'CL',
    color: '#013220',
    emoji: '📋',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    supabaseId: '22222222-2222-2222-2222-222222222222',
    name: 'Michael Olise',
    role: 'jugador',
    roleLabel: 'Jugador',
    initials: 'MO',
    color: '#FF9500',
    emoji: '⭐',
    playerId: '22222222-2222-2222-2222-222222222222', // linking to exactly the DB id
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    supabaseId: '33333333-3333-3333-3333-333333333333',
    name: 'Mario',
    role: 'nutri',
    roleLabel: 'Nutricionista',
    initials: 'M',
    color: '#D1127B',
    emoji: '🍎',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    supabaseId: '44444444-4444-4444-4444-444444444444',
    name: 'Lucas Janson',
    role: 'pf',
    roleLabel: 'Prep. Físico',
    initials: 'LJ',
    color: '#4B2FCF',
    emoji: '🏃',
  },
  {
    id: 'enzomussi-demo-id-9999-8888',
    supabaseId: 'enzomussi-demo-id-9999-8888',
    name: 'Enzo Mussi',
    email: 'enzomussi@gmail.com',
    role: 'jugador',
    roleLabel: 'Jugador',
    initials: 'EM',
    color: '#10B981',
    emoji: '⚽',
    playerId: 'enzomussi-demo-id-9999-8888',
  },
];
