import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { demoUsers, DemoUser, UserRole } from '@/data/users';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'dt': return 'Director Técnico';
    case 'pf': return 'Prep. Físico';
    case 'nutri': return 'Nutricionista';
    default: return 'Staff';
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const ContactoStaff = () => {
  const { user } = useAuth();
  const activeTeamId = user?.activeTeamId;

  const [staff, setStaff] = useState<DemoUser[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!activeTeamId) return;
      try {
        const { data, error } = await supabase
          .from('hayequipo_squad')
          .select('id, full_name, role, avatar_url, email')
          .eq('team_id', activeTeamId)
          .neq('role', 'jugador')
          .order('full_name', { ascending: true });

        if (error) throw error;

        const mapped: DemoUser[] = (data || []).map(p => ({
          id: p.id,
          supabaseId: p.id,
          name: p.full_name,
          email: p.email,
          role: p.role as UserRole,
          roleLabel: getRoleLabel(p.role),
          initials: getInitials(p.full_name),
          color: p.avatar_url || '#10B981',
          emoji: '',
        }));
        setStaff(mapped);
      } catch (err) {
        console.error('Error fetching staff contacts:', err);
      }
    };

    fetchStaff();
  }, [activeTeamId]);

  return (
    <Layout title="Staff Técnico">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map(member => (
            <div key={member.id} className="card-surface p-5 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-display"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{member.name}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary">{member.roleLabel}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-secondary/50 py-3 rounded-xl hover:bg-secondary transition-all text-xs font-bold">
                  <MessageCircle className="w-4 h-4 text-status-green" />
                  WHATSAPP
                </button>
                <button className="flex items-center justify-center gap-2 bg-secondary/50 py-3 rounded-xl hover:bg-secondary transition-all text-xs font-bold">
                  <Phone className="w-4 h-4 text-primary" />
                  LLAMAR
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card-surface p-6 bg-secondary/20 border-dashed border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-border">
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-bold text-sm">Sede Central</div>
            <div className="text-xs text-muted-foreground">Av. de los Incas 1234, CABA</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactoStaff;
