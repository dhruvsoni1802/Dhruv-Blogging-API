import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import * as apiKeyModel from '../models/apiKeyModel.js';
import { secureCompare } from '../utils/secureCompare.js';

export function isAdminKey(provided) {
  if (!config.auth.adminApiKey || !provided) return false;
  return secureCompare(provided, config.auth.adminApiKey);
}

export async function resolveWriteAuth(apiKey) {
  if (!apiKey) return null;

  const record = await apiKeyModel.findValidByPlaintextKey(apiKey);
  if (!record) return null;

  apiKeyModel.touchLastUsed(record.id).catch(() => {});

  return {
    method: 'api-key',
    keyId: record.id,
    label: record.label,
  };
}

export function resolveJwtAuth(authHeader) {
  if (!authHeader?.startsWith('Bearer ') || !config.supabase.jwtSecret) {
    return null;
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), config.supabase.jwtSecret);
    return { method: 'jwt', userId: payload.sub };
  } catch {
    return null;
  }
}
