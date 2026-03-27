'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserData } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Trash2, Upload, Play, Pause, Video, Users, Music, ExternalLink, Edit2, UserX, UserCheck, Eraser, Crown, BarChart3, LogIn, Clock } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface AudioLesson {
  id: string;
  title: string;
  text: string;
  audio_data: string;
  level: string;
  module: string;
  created_at: string;
}

interface VideoClip {
  id: string;
  title: string;
  clip_url: string;
  source_url: string;
  context_text: string;
  created_at: number;
}

interface GlobalStats {
  total_interactions: number;
  total_users: number;
  total_logins: number;
  total_audio_plays: number;
}

interface AccessLog {
  id?: string;
  email: string;
  created_at: string;
}

interface UserStats {
  uid: string;
  email: string;
  display_name: string;
  plan: string;
  role: string;
  active: boolean;
  interactions_today: number;
}

export default function AdminPage() {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'audios' | 'videos' | 'users' | 'stats'>('audios');
  
  const [lessons, setLessons] = useState<AudioLesson[]>([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [level, setLevel] = useState('Iniciante');
  const [module, setModule] = useState('Nivelamento');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);

  const [videos, setVideos] = useState<VideoClip[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [clipUrl, setClipUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [contextText, setContextText] = useState('');
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const [usersList, setUsersList] = useState<UserStats[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [recentAccess, setRecentAccess] = useState<AccessLog[]>([]);
  const [topUsers, setTopUsers] = useState<UserStats[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchLessons();
      fetchVideos();
      fetchUsers();
      fetchStats();
    }
  }, [userData]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('audios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: statsData } = await supabase
        .from('global_stats')
        .select('*')
        .eq('id', 1)
        .single();
      
      setStats(statsData);

      const { data: accessData } = await supabase
        .from('access_logs')
        .select('email, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setRecentAccess(accessData || []);

      const { data: usersData } = await supabase
        .from('users')
        .select('uid, email, display_name, plan, role, active, interactions_today')
        .order('interactions_today', { ascending: false })
        .limit(10);
      
      setTopUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle || !clipUrl || !sourceUrl || !contextText) return;

    setIsVideoUploading(true);
    try {
      let result;
      if (editingVideoId) {
        result = await supabase
          .from('videos')
          .update({
            title: videoTitle,
            clip_url: clipUrl,
            source_url: sourceUrl,
            context_text: contextText
          })
          .eq('id', editingVideoId);
        
        setEditingVideoId(null);
      } else {
        result = await supabase
          .from('videos')
          .insert({
            title: videoTitle,
            clip_url: clipUrl,
            source_url: sourceUrl,
            context_text: contextText
          });
      }
      
      if (result.error) {
        console.error('Video upload error:', result.error);
        alert('Erro ao salvar vídeo: ' + result.error.message);
        setIsVideoUploading(false);
        return;
      }
      
      setVideoTitle('');
      setClipUrl('');
      setSourceUrl('');
      setContextText('');
      fetchVideos();
    } catch (err: any) {
      console.error('Error uploading video:', err);
      alert('Erro ao salvar vídeo: ' + err.message);
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleEditVideo = (video: VideoClip) => {
    setVideoTitle(video.title);
    setClipUrl(video.clip_url);
    setSourceUrl(video.source_url);
    setContextText(video.context_text);
    setEditingVideoId(video.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVideo = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Vídeo',
      message: 'Tem certeza que deseja excluir este vídeo?',
      onConfirm: async () => {
        await supabase.from('videos').delete().eq('id', id);
        fetchVideos();
      }
    });
  };

  const toggleUserRole = (uid: string, currentRole: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Alterar Nível de Acesso',
      message: 'Tem certeza que deseja alterar o nível de acesso deste usuário?',
      onConfirm: async () => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        await supabase.from('users').update({ role: newRole }).eq('uid', uid);
        fetchUsers();
      }
    });
  };

  const toggleUserStatus = (uid: string, currentStatus: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: currentStatus ? 'Inativar Usuário' : 'Ativar Usuário',
      message: `Tem certeza que deseja ${currentStatus ? 'inativar' : 'ativar'} este usuário?`,
      onConfirm: async () => {
        await supabase.from('users').update({ active: !currentStatus }).eq('uid', uid);
        fetchUsers();
      }
    });
  };

  const toggleUserPlan = (uid: string, currentPlan: string) => {
    const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
    setConfirmDialog({
      isOpen: true,
      title: newPlan === 'premium' ? 'Liberar Premium' : 'Revogar Premium',
      message: newPlan === 'premium' 
        ? 'Tem certeza que deseja liberar acesso Premium para este usuário?' 
        : 'Tem certeza que deseja revogar o acesso Premium deste usuário?',
      onConfirm: async () => {
        await supabase.from('users').update({ plan: newPlan }).eq('uid', uid);
        fetchUsers();
      }
    });
  };

  const handleDeleteUser = (uid: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Usuário',
      message: 'Tem certeza que deseja excluir este usuário permanentemente?',
      onConfirm: async () => {
        await supabase.from('users').delete().eq('uid', uid);
        fetchUsers();
      }
    });
  };

  const handleClearUserChat = (uid: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Limpar Histórico de Chat',
      message: 'Tem certeza que deseja resetar o limite de interações deste usuário?',
      onConfirm: async () => {
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('users')
          .update({ 
            interactions_today: 0,
            last_interaction_date: today
          })
          .eq('uid', uid);
        
        setAlertDialog({
          isOpen: true,
          title: 'Sucesso',
          message: 'Limite de interações resetado com sucesso.'
        });
        fetchUsers();
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !text || (!audioFile && !editingAudioId)) return;

    setIsUploading(true);
    try {
      if (audioFile) {
        const reader = new FileReader();
        reader.readAsDataURL(audioFile);
        reader.onload = async () => {
          const base64Audio = reader.result as string;
          
          if (editingAudioId) {
            await supabase
              .from('audios')
              .update({
                title,
                text,
                audio_data: base64Audio,
                level,
                module
              })
              .eq('id', editingAudioId);
            
            setEditingAudioId(null);
          } else {
            await supabase
              .from('audios')
              .insert({
                title,
                text,
                audio_data: base64Audio,
                level,
                module,
                created_at: new Date().toISOString()
              });
          }
          
          setTitle('');
          setText('');
          setModule('Nivelamento');
          setAudioFile(null);
          fetchLessons();
          setIsUploading(false);
        };
      } else if (editingAudioId) {
        await supabase
          .from('audios')
          .update({
            title,
            text,
            level,
            module
          })
          .eq('id', editingAudioId);
        
        setEditingAudioId(null);
        setTitle('');
        setText('');
        setModule('Nivelamento');
        fetchLessons();
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Error updating/creating audio:", error);
      setIsUploading(false);
    }
  };

  const handleEditAudio = (lesson: AudioLesson) => {
    setTitle(lesson.title);
    setText(lesson.text);
    setLevel(lesson.level);
    setModule(lesson.module);
    setEditingAudioId(lesson.id);
    setAudioFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Lição',
      message: 'Tem certeza que deseja excluir esta lição?',
      onConfirm: async () => {
        await supabase.from('audios').delete().eq('id', id);
        fetchLessons();
      }
    });
  };

  const togglePlay = (lesson: AudioLesson) => {
    if (playingId === lesson.id) {
      audioElement?.pause();
      setPlayingId(null);
    } else {
      if (audioElement) audioElement.pause();
      const newAudio = new Audio(lesson.audio_data);
      newAudio.play();
      newAudio.onended = () => setPlayingId(null);
      setAudioElement(newAudio);
      setPlayingId(lesson.id);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Carregando...</div>;

  if (!user || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Acesso Negado</h1>
          <p className="text-slate-400">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <Modal 
        isOpen={confirmDialog !== null} 
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.title || 'Confirmar'}
      >
        <p className="text-slate-300 mb-6">{confirmDialog?.message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setConfirmDialog(null)}
            className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={async () => {
              if (confirmDialog) {
                try {
                  await confirmDialog.onConfirm();
                } catch (e) {
                  console.error(e);
                  setAlertDialog({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Ocorreu um erro ao realizar a operação.'
                  });
                }
                setConfirmDialog(null);
              }
            }}
            className="px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={alertDialog !== null} 
        onClose={() => setAlertDialog(null)}
        title={alertDialog?.title || 'Aviso'}
      >
        <p className="text-slate-300 mb-6">{alertDialog?.message}</p>
        <div className="flex justify-end">
          <button 
            onClick={() => setAlertDialog(null)}
            className="px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            OK
          </button>
        </div>
      </Modal>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-emerald-400">Painel Administrativo - Professor Jato</h1>
        
        <div className="flex gap-4 mb-8 border-b border-slate-800 pb-4 flex-wrap">
          <button 
            onClick={() => setActiveTab('audios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'audios' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Music className="w-5 h-5" />
            Áudios
          </button>
          <button 
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'videos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Video className="w-5 h-5" />
            Vídeos
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5" />
            Usuários
          </button>
          <button 
            onClick={() => { setActiveTab('stats'); fetchStats(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'stats' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Estatísticas
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-8 h-8 text-emerald-400" />
                  <span className="text-slate-400 text-sm">Total de Usuários</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats?.total_users || 0}</p>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <LogIn className="w-8 h-8 text-blue-400" />
                  <span className="text-slate-400 text-sm">Total de Acessos</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats?.total_logins || 0}</p>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-8 h-8 text-amber-400" />
                  <span className="text-slate-400 text-sm">Total de Interações</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats?.total_interactions || 0}</p>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Music className="w-8 h-8 text-purple-400" />
                  <span className="text-slate-400 text-sm">Reproduções de Áudio</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats?.total_audio_plays || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Top Usuários por Interações
                </h3>
                <div className="space-y-3">
                  {topUsers.map((u, i) => (
                    <div key={u.uid} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium">{u.display_name || 'Sem nome'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{u.interactions_today}</p>
                        <p className="text-xs text-slate-500">interações</p>
                      </div>
                    </div>
                  ))}
                  {topUsers.length === 0 && (
                    <p className="text-slate-500 text-center py-4">Nenhum dado ainda</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Últimos Acessos
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentAccess.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <p className="text-sm">{log.email}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                  {recentAccess.length === 0 && (
                    <p className="text-slate-500 text-center py-4">Nenhum acesso registrado</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audios' && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                {editingAudioId ? <Edit2 className="w-5 h-5 text-emerald-400" /> : <Upload className="w-5 h-5 text-emerald-400" />}
                {editingAudioId ? 'Editar Lição de Áudio' : 'Nova Lição de Áudio'}
              </h2>
          
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Módulo</label>
                  <input 
                    type="text" 
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nível</label>
                  <select 
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Básico">Básico</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Texto/Transcrição</label>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Arquivo de Áudio {editingAudioId && '(Opcional)'}
                  </label>
                  <input 
                    type="file" 
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                    required={!editingAudioId}
                  />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Salvando...' : (editingAudioId ? 'Atualizar Lição' : 'Salvar Lição')}
                  </button>
                  {editingAudioId && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingAudioId(null);
                        setTitle('');
                        setText('');
                        setModule('Nivelamento');
                        setAudioFile(null);
                      }}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Lições Cadastradas</h2>
              
              <div className="space-y-4">
                {lessons.map(lesson => (
                  <div key={lesson.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{lesson.title}</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                          Módulo: {lesson.module || 'N/A'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                          {lesson.level}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{lesson.text}</p>
                      <button 
                        onClick={() => togglePlay(lesson)}
                        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        {playingId === lesson.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {playingId === lesson.id ? 'Pausar' : 'Ouvir Áudio'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleEditAudio(lesson)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(lesson.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {lessons.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Nenhuma lição cadastrada ainda.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'videos' && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                {editingVideoId ? <Edit2 className="w-5 h-5 text-emerald-400" /> : <Video className="w-5 h-5 text-emerald-400" />}
                {editingVideoId ? 'Editar Vídeo' : 'Novo Vídeo (YouTube)'}
              </h2>
              
              <form onSubmit={handleVideoUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                  <input 
                    type="text" 
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Link do Trecho</label>
                  <input 
                    type="url" 
                    value={clipUrl}
                    onChange={(e) => setClipUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Link da Fonte</label>
                  <input 
                    type="url" 
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Contexto</label>
                  <textarea 
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    type="submit"
                    disabled={isVideoUploading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isVideoUploading ? 'Salvando...' : (editingVideoId ? 'Atualizar' : 'Salvar')}
                  </button>
                  {editingVideoId && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingVideoId(null);
                        setVideoTitle('');
                        setClipUrl('');
                        setSourceUrl('');
                        setContextText('');
                      }}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Vídeos Cadastrados</h2>
              
              <div className="space-y-4">
                {videos.map(video => (
                  <div key={video.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-2">{video.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{video.context_text}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <a href={video.clip_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                          <Play className="w-4 h-4" /> Trecho
                        </a>
                        <a href={video.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          <ExternalLink className="w-4 h-4" /> Fonte
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleEditVideo(video)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {videos.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Nenhum vídeo cadastrado ainda.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Gerenciamento de Usuários
            </h2>
            
            {isUsersLoading ? (
              <p className="text-center text-slate-500 py-8">Carregando usuários...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-sm">
                      <th className="pb-3 font-medium">Nome / Email</th>
                      <th className="pb-3 font-medium">Plano</th>
                      <th className="pb-3 font-medium">Interações Hoje</th>
                      <th className="pb-3 font-medium">Acesso</th>
                      <th className="pb-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.uid} className="border-b border-slate-800/50 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{u.display_name || 'Sem nome'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          {u.plan === 'premium' ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-medium flex items-center gap-1 w-fit">
                              <Crown className="w-3 h-3" /> Premium
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-slate-800 text-slate-400">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="text-sm font-medium">{u.interactions_today || 0}</span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-300'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                          {u.active === false && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => toggleUserPlan(u.uid, u.plan || 'free')}
                              className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                                u.plan === 'premium' 
                                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                                  : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                              }`}
                            >
                              <Crown className="w-3 h-3" />
                              {u.plan === 'premium' ? 'Revogar' : 'Liberar'}
                            </button>
                            <button
                              onClick={() => toggleUserRole(u.uid, u.role)}
                              disabled={u.email === 'professorajato@gmail.com'}
                              className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-30"
                            >
                              {u.role === 'admin' ? 'Remover' : 'Admin'}
                            </button>
                            <button
                              onClick={() => toggleUserStatus(u.uid, u.active !== false)}
                              disabled={u.email === 'professorajato@gmail.com'}
                              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
                                u.active === false 
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                              }`}
                            >
                              {u.active === false ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleClearUserChat(u.uid)}
                              className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              title="Reset Interações"
                            >
                              <Eraser className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.uid)}
                              disabled={u.email === 'professorajato@gmail.com'}
                              className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}