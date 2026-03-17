'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserData } from '@/components/AuthProvider';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { Trash2, Upload, Play, Pause, Video, Users, Music, ExternalLink, Edit2, UserX, UserCheck, Eraser, Crown } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface AudioLesson {
  id: string;
  title: string;
  text: string;
  audioData: string;
  level: 'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado';
  module: string;
  createdAt: string;
}

interface VideoClip {
  id: string;
  title: string;
  clipUrl: string;
  sourceUrl: string;
  contextText: string;
  createdAt: number;
}

export default function AdminPage() {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'audios' | 'videos' | 'users'>('audios');
  
  // Audio State
  const [lessons, setLessons] = useState<AudioLesson[]>([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [level, setLevel] = useState<'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado'>('Iniciante');
  const [module, setModule] = useState('Nivelamento');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);

  // Video State
  const [videos, setVideos] = useState<VideoClip[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [clipUrl, setClipUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [contextText, setContextText] = useState('');
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  // Users State
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Modal State
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchLessons();
      fetchVideos();
      fetchUsers();
    }
  }, [userData]);

  const fetchLessons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'audios'));
      const loadedLessons: AudioLesson[] = [];
      querySnapshot.forEach((doc) => {
        loadedLessons.push({ id: doc.id, ...doc.data() } as AudioLesson);
      });
      setLessons(loadedLessons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'audios');
    }
  };

  const fetchVideos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'videos'));
      const loadedVideos: VideoClip[] = [];
      querySnapshot.forEach((doc) => {
        loadedVideos.push({ id: doc.id, ...doc.data() } as VideoClip);
      });
      setVideos(loadedVideos.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'videos');
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const loadedUsers: UserData[] = [];
      querySnapshot.forEach((doc) => {
        loadedUsers.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      setUsersList(loadedUsers);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle || !clipUrl || !sourceUrl || !contextText) return;

    setIsVideoUploading(true);
    try {
      if (editingVideoId) {
        await updateDoc(doc(db, 'videos', editingVideoId), {
          title: videoTitle,
          clipUrl,
          sourceUrl,
          contextText
        });
        setEditingVideoId(null);
      } else {
        await addDoc(collection(db, 'videos'), {
          title: videoTitle,
          clipUrl,
          sourceUrl,
          contextText,
          createdAt: Date.now()
        });
      }
      
      setVideoTitle('');
      setClipUrl('');
      setSourceUrl('');
      setContextText('');
      fetchVideos();
    } catch (err) {
      handleFirestoreError(err, editingVideoId ? OperationType.UPDATE : OperationType.CREATE, 'videos');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleEditVideo = (video: VideoClip) => {
    setVideoTitle(video.title);
    setClipUrl(video.clipUrl);
    setSourceUrl(video.sourceUrl);
    setContextText(video.contextText);
    setEditingVideoId(video.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVideo = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Vídeo',
      message: 'Tem certeza que deseja excluir este vídeo?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'videos', id));
          fetchVideos();
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `videos/${id}`);
        }
      }
    });
  };

  const toggleUserRole = (userId: string, currentRole: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Alterar Nível de Acesso',
      message: 'Tem certeza que deseja alterar o nível de acesso deste usuário?',
      onConfirm: async () => {
        try {
          const newRole = currentRole === 'admin' ? 'user' : 'admin';
          await updateDoc(doc(db, 'users', userId), { role: newRole });
          fetchUsers();
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        }
      }
    });
  };

  const toggleUserStatus = (userId: string, currentStatus?: boolean) => {
    const isActive = currentStatus !== false; // Default to true if undefined
    setConfirmDialog({
      isOpen: true,
      title: isActive ? 'Inativar Usuário' : 'Ativar Usuário',
      message: `Tem certeza que deseja ${isActive ? 'inativar' : 'ativar'} este usuário?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', userId), { active: !isActive });
          fetchUsers();
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        }
      }
    });
  };

  const toggleUserPlan = (userId: string, currentPlan?: string) => {
    const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
    setConfirmDialog({
      isOpen: true,
      title: newPlan === 'premium' ? 'Liberar Premium' : 'Revogar Premium',
      message: newPlan === 'premium' 
        ? 'Tem certeza que deseja liberar acesso Premium para este usuário?' 
        : 'Tem certeza que deseja revogar o acesso Premium deste usuário?',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', userId), { plan: newPlan });
          fetchUsers();
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        }
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Usuário',
      message: 'Tem certeza que deseja excluir este usuário permanentemente?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));
          fetchUsers();
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
        }
      }
    });
  };

  const handleClearUserChat = (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Limpar Histórico de Chat',
      message: 'Tem certeza que deseja limpar todo o histórico de chat deste usuário? Esta ação não pode ser desfeita e também resetará o limite de interações diárias.',
      onConfirm: async () => {
        try {
          const chatRef = collection(db, 'users', userId, 'chats');
          const querySnapshot = await getDocs(chatRef);
          
          const deletePromises = querySnapshot.docs.map(docSnap => 
            deleteDoc(doc(db, 'users', userId, 'chats', docSnap.id))
          );
          
          await Promise.all(deletePromises);

          // Reset interactions count so the user can use the chat again
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            interactionsToday: 0
          });

          setAlertDialog({
            isOpen: true,
            title: 'Sucesso',
            message: 'Histórico de chat limpo e limite de interações resetado com sucesso.'
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}/chats`);
        }
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
        // Convert audio file to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioFile);
        reader.onload = async () => {
          try {
            const base64Audio = reader.result as string;
            
            if (editingAudioId) {
              await updateDoc(doc(db, 'audios', editingAudioId), {
                title,
                text,
                audioData: base64Audio,
                level,
                module
              });
              setEditingAudioId(null);
            } else {
              await addDoc(collection(db, 'audios'), {
                title,
                text,
                audioData: base64Audio,
                level,
                module,
                createdAt: new Date().toISOString()
              });
            }
            
            setTitle('');
            setText('');
            setModule('Nivelamento');
            setAudioFile(null);
            fetchLessons();
          } catch (err) {
            handleFirestoreError(err, editingAudioId ? OperationType.UPDATE : OperationType.CREATE, 'audios');
          } finally {
            setIsUploading(false);
          }
        };
      } else if (editingAudioId) {
        // Update without changing audio file
        await updateDoc(doc(db, 'audios', editingAudioId), {
          title,
          text,
          level,
          module
        });
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
    setAudioFile(null); // Clear file input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Lição',
      message: 'Tem certeza que deseja excluir esta lição?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'audios', id));
          fetchLessons();
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `audios/${id}`);
        }
      }
    });
  };

  const togglePlay = (lesson: AudioLesson) => {
    if (playingId === lesson.id) {
      audioElement?.pause();
      setPlayingId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const newAudio = new Audio(lesson.audioData);
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
                    message: 'Ocorreu um erro ao realizar a operação. Verifique o console para mais detalhes.'
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

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-emerald-400">Painel Administrativo - Professor Jato</h1>
        
        <div className="flex gap-4 mb-8 border-b border-slate-800 pb-4">
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
            Vídeos (YouTube)
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5" />
            Usuários
          </button>
        </div>

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
                placeholder="Ex: Nivelamento, 1.1, 1.2"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nível</label>
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Arquivo de Áudio (MP3/WAV) {editingAudioId && '(Opcional se não for alterar)'}</label>
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
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300 capitalize">
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
                {editingVideoId ? 'Editar Trecho de Vídeo' : 'Novo Trecho de Vídeo (YouTube)'}
              </h2>
              
              <form onSubmit={handleVideoUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Título do Vídeo</label>
                  <input 
                    type="text" 
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Ex: Diferença entre To e For"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Link do Trecho (Embed ou URL normal)</label>
                  <input 
                    type="url" 
                    value={clipUrl}
                    onChange={(e) => setClipUrl(e.target.value)}
                    placeholder="Ex: https://www.youtube.com/embed/..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Link da Fonte (Vídeo Completo)</label>
                  <input 
                    type="url" 
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Ex: https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Texto do Vídeo (Para consulta da IA)</label>
                  <textarea 
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    placeholder="Descreva o que é ensinado neste trecho para que a IA saiba quando recomendá-lo..."
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
                    {isVideoUploading ? 'Salvando...' : (editingVideoId ? 'Atualizar Vídeo' : 'Salvar Vídeo')}
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
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{video.contextText}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <a href={video.clipUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                          <Play className="w-4 h-4" /> Trecho
                        </a>
                        <a href={video.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          <ExternalLink className="w-4 h-4" /> Fonte Completa
                        </a>
                        <span className="text-slate-500 text-xs">ID: {video.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleEditVideo(video)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Excluir"
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
                      <th className="pb-3 font-medium">Nível</th>
                      <th className="pb-3 font-medium">XP</th>
                      <th className="pb-3 font-medium">Plano</th>
                      <th className="pb-3 font-medium">Acesso</th>
                      <th className="pb-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.uid} className="border-b border-slate-800/50 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{u.displayName || 'Sem nome'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-300">{u.level}</td>
                        <td className="py-4 text-sm text-slate-300">{u.xp}</td>
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
                          <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-300'}`}>
                            {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </span>
                          {u.active === false && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleUserPlan(u.uid, u.plan)}
                              className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                                u.plan === 'premium' 
                                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                                  : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                              }`}
                              title={u.plan === 'premium' ? 'Revogar Premium' : 'Liberar Premium'}
                            >
                              <Crown className="w-3 h-3" />
                              {u.plan === 'premium' ? 'Premium' : 'Liberar'}
                            </button>
                            <button
                              onClick={() => toggleUserRole(u.uid, u.role)}
                              disabled={u.email === 'professorajato@gmail.com'}
                              className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                            </button>
                            <button
                              onClick={() => toggleUserStatus(u.uid, u.active)}
                              disabled={u.email === 'professorajato@gmail.com'}
                              className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                u.active === false 
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                              }`}
                              title={u.active === false ? 'Ativar Usuário' : 'Inativar Usuário'}
                            >
                              {u.active === false ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleClearUserChat(u.uid)}
                              className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              title="Limpar Histórico de Chat"
                            >
                              <Eraser className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.uid)}
                              disabled={u.email === 'professorajato@gmail.com'}
                              className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Excluir Usuário"
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
