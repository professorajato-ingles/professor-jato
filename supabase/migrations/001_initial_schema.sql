-- ============================================
-- MIGRATION: Firestore → Supabase PostgreSQL
-- Projeto: Professor Jato
-- Data: 2026-03-26
-- ============================================

-- ============================================
-- NOTA: RLS DESABILITADO (usamos Firebase Auth)
-- ============================================

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  photo_url TEXT,
  level VARCHAR(50) DEFAULT 'untested',
  xp INTEGER DEFAULT 0,
  current_module VARCHAR(20) DEFAULT '1.1',
  role VARCHAR(20) DEFAULT 'user',
  active BOOLEAN DEFAULT true,
  plan VARCHAR(20) DEFAULT 'free',
  interactions_today INTEGER DEFAULT 0,
  last_interaction_date DATE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Áudios (lições)
CREATE TABLE IF NOT EXISTS audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  audio_data TEXT NOT NULL,
  level VARCHAR(50) NOT NULL,
  module VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Vídeos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  clip_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  context_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Chats (histórico)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  session VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOVAS TABELAS (ESTATÍSTICAS)
-- ============================================

-- Logs de Acesso
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Estatísticas Globais (uma única linha)
CREATE TABLE IF NOT EXISTS global_stats (
  id SERIAL PRIMARY KEY,
  total_interactions BIGINT DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  total_logins BIGINT DEFAULT 0,
  total_audio_plays INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inicializar stats (apenas se não existir)
INSERT INTO global_stats (total_interactions, total_users, total_logins, total_audio_plays) 
SELECT 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM global_stats);

-- ============================================
-- ÍNDICES (PERFORMANCE)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created ON chats(created_at DESC);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 'Tabelas criadas com sucesso!' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;