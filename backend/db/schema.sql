-- =========================================================
-- VENDA 3D — SCHEMA POSTGRESQL (Neon)
-- =========================================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------
-- USUÁRIOS (você e seu irmão)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- TIPOS DE FILAMENTO (PLA, ABS, PETG, ...)
-- Cada tipo tem seu próprio preço por kg, que entra
-- automaticamente no cálculo de custo do produto.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS filament_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- Ex: 'PLA', 'ABS', 'PETG'
  price_per_kg NUMERIC(10,2) NOT NULL, -- R$ por kg
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- PARÂMETROS GERAIS DO NEGÓCIO (linha única, compartilhada)
-- Equivale ao "settings" do HTML original, exceto o custo
-- de filamento, que agora vem de filament_types.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- garante linha única
  energy_rate NUMERIC(10,4) NOT NULL DEFAULT 0.95,     -- R$/kWh
  power_watts NUMERIC(10,2) NOT NULL DEFAULT 300,      -- potência média da impressora
  printer_cost NUMERIC(10,2) NOT NULL DEFAULT 4500,
  printer_life_hours NUMERIC(10,2) NOT NULL DEFAULT 8000,
  maintenance_pct NUMERIC(6,4) NOT NULL DEFAULT 0.10,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 20,       -- valor da hora de trabalho manual
  failure_pct NUMERIC(6,4) NOT NULL DEFAULT 0.01,
  margin_target NUMERIC(6,4) NOT NULL DEFAULT 0.25,
  cost_mode TEXT NOT NULL DEFAULT 'com_fixo' CHECK (cost_mode IN ('com_fixo','sem_fixo')),
  include_packaging BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------
-- ITENS DE EMBALAGEM
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS packaging_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------
-- CANAIS DE VENDA (Mercado Livre, Shopee, TikTok Shop, etc.)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  commission NUMERIC(6,4) NOT NULL DEFAULT 0,  -- ex: 0.11 = 11%
  fixed_fee NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------
-- PRODUTOS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,          -- ex: PRD-0001 (gerado no backend)
  name TEXT NOT NULL,
  grams NUMERIC(10,2) NOT NULL,
  hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  minutes NUMERIC(10,2) NOT NULL DEFAULT 0,
  manual_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  filament_type_id UUID REFERENCES filament_types(id),
  cost_mode TEXT NOT NULL DEFAULT 'com_fixo' CHECK (cost_mode IN ('com_fixo','sem_fixo')),
  cost_total NUMERIC(12,4) NOT NULL,   -- custo calculado no momento do cadastro
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- VENDAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,          -- ex: S-0001
  product_id UUID REFERENCES products(id),
  channel_id UUID REFERENCES channels(id),
  unit_cost NUMERIC(12,4) NOT NULL,   -- custo do produto no momento da venda (histórico)
  price NUMERIC(10,2) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- SEEDS (dados iniciais)
-- ---------------------------------------------------------
INSERT INTO filament_types (name, price_per_kg) VALUES
  ('PLA', 119.00),
  ('ABS', 109.00),
  ('PETG', 139.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO channels (name, commission, fixed_fee) VALUES
  ('Mercado Livre Clássico (sem frete grátis)', 0.11, 6.75),
  ('Mercado Livre Clássico (com frete grátis)', 0.11, 13.85),
  ('Mercado Livre Premium (sem frete grátis)', 0.165, 6.75),
  ('Mercado Livre Premium (com frete grátis)', 0.165, 13.85),
  ('Shopee (até R$79,99)', 0.20, 4.00),
  ('TikTok Shop', 0, 0),
  ('Direto (WhatsApp/Instagram/Feira)', 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO packaging_items (name, cost) VALUES
  ('Envelope de segurança plástico (preto)', 0.35),
  ('Plástico bolha', 0.30),
  ('Etiqueta', 0.25),
  ('Fita adesiva', 0.15)
ON CONFLICT DO NOTHING;
