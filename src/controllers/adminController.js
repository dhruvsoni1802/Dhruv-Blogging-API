// Mint and revoke short-lived write keys — requires ADMIN_API_KEY.
import config from '../config/index.js';
import * as apiKeyModel from '../models/apiKeyModel.js';
import { badRequest, notFound } from '../errors/ApiError.js';

const MAX_EXPIRY_HOURS = 168;

function parseExpiryHours(value) {
  if (value === undefined || value === null) {
    return config.auth.defaultKeyExpiryHours;
  }

  const hours = parseInt(value, 10);
  if (Number.isNaN(hours) || hours < 1 || hours > MAX_EXPIRY_HOURS) {
    throw badRequest(`expiresInHours must be between 1 and ${MAX_EXPIRY_HOURS}`);
  }
  return hours;
}

export async function createKey(req, res, next) {
  try {
    const { label, expiresInHours } = req.body;

    if (!label?.trim()) {
      throw badRequest('label is required');
    }

    const hours = parseExpiryHours(expiresInHours);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const record = await apiKeyModel.create({
      label: label.trim(),
      expiresAt,
    });

    res.status(201).json({
      key: record.key,
      id: record.id,
      label: record.label,
      keyPrefix: record.key_prefix,
      expiresAt: record.expires_at,
      expiresInHours: hours,
      message: 'Store this key now — it will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
}

export async function listKeys(_req, res, next) {
  try {
    const keys = await apiKeyModel.findAll();
    const now = new Date();

    res.status(200).json({
      keys: keys.map((key) => ({
        id: key.id,
        label: key.label,
        keyPrefix: key.key_prefix,
        expiresAt: key.expires_at,
        createdAt: key.created_at,
        revokedAt: key.revoked_at,
        lastUsedAt: key.last_used_at,
        status: key.revoked_at
          ? 'revoked'
          : new Date(key.expires_at) <= now
            ? 'expired'
            : 'active',
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeKey(req, res, next) {
  try {
    const revoked = await apiKeyModel.revoke(req.params.id);

    if (!revoked) {
      throw notFound('API key not found or already revoked');
    }

    res.status(200).json({
      id: revoked.id,
      label: revoked.label,
      revokedAt: revoked.revoked_at,
      message: 'API key revoked',
    });
  } catch (err) {
    next(err);
  }
}

export async function cleanupExpiredKeys(_req, res, next) {
  try {
    const deletedCount = await apiKeyModel.deleteExpired();

    res.status(200).json({
      deletedCount,
      message:
        deletedCount === 0
          ? 'No expired API keys to remove'
          : `Removed ${deletedCount} expired API key(s)`,
    });
  } catch (err) {
    next(err);
  }
}
