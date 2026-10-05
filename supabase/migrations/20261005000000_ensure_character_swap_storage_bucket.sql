INSERT INTO storage.buckets (id, name, public)
VALUES ('character-swap', 'character-swap', false)
ON CONFLICT (id) DO NOTHING;