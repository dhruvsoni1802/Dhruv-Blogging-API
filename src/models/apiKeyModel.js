import supabase from '../services/supabase.js';
import { generateApiKey, hashApiKey } from '../utils/apiKey.js';

const LIST_COLUMNS = 'id, label, key_prefix, expires_at, created_at, revoked_at, last_used_at';

export async function create({ label, expiresAt }) {
  const { key, keyPrefix, keyHash } = generateApiKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      label,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      expires_at: expiresAt.toISOString(),
    })
    .select(LIST_COLUMNS)
    .single();

  if (error) throw error;

  return { ...data, key };
}

export async function findAll() {
  const { data, error } = await supabase
    .from('api_keys')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function findValidByPlaintextKey(plaintextKey) {
  const keyHash = hashApiKey(plaintextKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, label, expires_at, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.revoked_at) return null;
  if (new Date(data.expires_at) <= new Date()) return null;

  return data;
}

export async function revoke(id) {
  const { data, error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('revoked_at', null)
    .select(LIST_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function touchLastUsed(id) {
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', id);
}

export async function deleteExpired() {
  const { data, error } = await supabase
    .from('api_keys')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}
