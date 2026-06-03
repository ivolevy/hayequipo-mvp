import Layout from '@/components/Layout';
import { useState } from 'react';
import { useNotices } from '@/context/NoticeContext';
import { Megaphone, Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const DTAvisos = () => {
  const { notices, addNotice, editNotice, deleteNotice } = useNotices();
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handlePostNotice = () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      toast.error('El título y el mensaje son obligatorios');
      return;
    }

    if (isEditing && editingId) {
      editNotice(editingId, noticeTitle, noticeMessage);
      toast.success('Aviso actualizado correctamente');
      resetForm();
    } else {
      addNotice(noticeTitle, noticeMessage, 'dt');
      toast.success('Aviso publicado correctamente');
      resetForm();
    }
  };

  const handleEditInit = (id: string, title: string, message: string) => {
    setIsEditing(true);
    setEditingId(id);
    setNoticeTitle(title);
    setNoticeMessage(message);
  };

  const handleDeleteNotice = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este aviso?')) {
      deleteNotice(id);
      toast.success('Aviso eliminado correctamente');
      if (editingId === id) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setNoticeTitle('');
    setNoticeMessage('');
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <Layout title="Muro de Avisos" showBack backTo="/dt">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-24">
        <div className="flex items-center gap-3 px-1">
          <Megaphone className="w-6 h-6 text-emerald-600" />
          <h2 className="font-display text-lg tracking-wide text-foreground uppercase">MURO DE AVISOS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Card Form */}
          <div className="md:col-span-2">
            <div className="premium-card p-6 bg-white border border-slate-100 shadow-md space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                {isEditing 
                  ? 'Modifica los campos a continuación para actualizar el comunicado publicado.'
                  : 'Publicá comunicados para todo el plantel. Aparecerán de forma destacada en el panel principal de cada jugador.'}
              </p>
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {isEditing ? 'Editar Título' : 'Título del Comunicado'}
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Cambio de cancha, Llevar DNI..."
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {isEditing ? 'Editar Mensaje' : 'Mensaje detallado'}
                  </label>
                  <textarea
                    placeholder="Escribe el mensaje completo aquí..."
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 min-h-[120px] transition-all text-slate-800"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  {isEditing && (
                    <button
                      onClick={resetForm}
                      className="flex-1 border border-slate-200 text-slate-500 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      CANCELAR
                    </button>
                  )}
                  <button
                    onClick={handlePostNotice}
                    className={`flex-1 text-white py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {isEditing ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {isEditing ? 'GUARDAR CAMBIOS' : 'PUBLICAR AVISO'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List of Published Notices */}
          <div className="md:col-span-1 space-y-4">
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-2">AVISOS PUBLICADOS</p>
            {notices.length === 0 ? (
              <div className="premium-card p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-dashed border-slate-200">
                No hay comunicados publicados aún.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                 {notices.map((notice) => {
                  const isConvocatoria = notice.type === 'convocatoria';
                  return (
                    <div 
                      key={notice.id} 
                      className={`premium-card p-4 flex flex-col justify-between hover:border-slate-200 transition-all ${
                        isConvocatoria 
                          ? 'border-indigo-200 bg-indigo-50/10 shadow-sm' 
                          : 'border-slate-100 bg-white'
                      } ${
                        editingId === notice.id ? 'ring-2 ring-emerald-500/20 border-emerald-300' : ''
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isConvocatoria && (
                              <span className="bg-indigo-600 text-white text-[7px] font-black px-1 py-0.5 rounded tracking-widest uppercase shrink-0">
                                L.O.
                              </span>
                            )}
                            <h4 className={`font-display font-semibold text-xs line-clamp-1 uppercase tracking-tight ${
                              isConvocatoria ? 'text-indigo-950 font-bold' : 'text-slate-800'
                            }`}>
                              {notice.title}
                            </h4>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">
                            {new Date(notice.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-2 whitespace-pre-wrap line-clamp-3">
                          {notice.message}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-slate-50">
                        <button
                          onClick={() => handleEditInit(notice.id, notice.title, notice.message)}
                          className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Editar aviso"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="p-1.5 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar aviso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DTAvisos;
