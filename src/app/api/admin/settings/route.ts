import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSuperAdmin, requireAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';
import { adminLogRepository } from '@/lib/repositories';

// Default settings if none exist in database
const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  site_name: { value: 'FahadCloud', description: 'Site display name' },
  site_description: { value: 'Domain Provider & Hosting Platform', description: 'Site description' },
  maintenance_mode: { value: 'false', description: 'Enable maintenance mode (true/false)' },
  maintenance_message: { value: 'We are performing scheduled maintenance. Please check back soon.', description: 'Maintenance mode message' },
  registration_enabled: { value: 'true', description: 'Enable new user registration (true/false)' },
  max_domains_per_user: { value: '10', description: 'Maximum domains per user' },
  default_storage_limit: { value: '5368709120', description: 'Default storage limit in bytes (5GB)' },
  usd_to_bdt: { value: '110', description: 'USD to BDT conversion rate' },
  support_email: { value: '', description: 'Support email address' },
  smtp_enabled: { value: 'true', description: 'Enable SMTP email sending (true/false)' },
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    // Get all settings from AgentSystemConfig (repurposed for general system config)
    const configs = await db.agentSystemConfig.findMany();
    const configMap = new Map(configs.map(c => [c.key, c.value]));

    // Merge with defaults
    const settings: Record<string, any> = {};
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      settings[key] = {
        key,
        value: configMap.has(key) ? configMap.get(key) : def.value,
        description: def.description,
        isDefault: !configMap.has(key),
      };
    }

    // Also include any custom settings not in defaults
    for (const config of configs) {
      if (!DEFAULT_SETTINGS[config.key]) {
        settings[config.key] = {
          key: config.key,
          value: config.value,
          description: config.description || '',
          isDefault: false,
        };
      }
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Admin settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const updatedSettings: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      const stringValue = String(value);

      // Validate boolean fields
      const booleanFields = ['maintenance_mode', 'registration_enabled', 'smtp_enabled'];
      if (booleanFields.includes(key) && !['true', 'false'].includes(stringValue)) {
        return NextResponse.json(
          { error: `Setting '${key}' must be 'true' or 'false'` },
          { status: 400 }
        );
      }

      // Validate numeric fields
      const numericFields = ['max_domains_per_user', 'default_storage_limit', 'usd_to_bdt'];
      if (numericFields.includes(key) && isNaN(Number(stringValue))) {
        return NextResponse.json(
          { error: `Setting '${key}' must be a number` },
          { status: 400 }
        );
      }

      // Upsert the setting
      await db.agentSystemConfig.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          description: DEFAULT_SETTINGS[key]?.description || '',
          updatedBy: auth.user!.userId,
        },
        update: {
          value: stringValue,
          updatedBy: auth.user!.userId,
        },
      });

      updatedSettings.push(key);
    }

    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'settings_updated',
      targetType: 'system',
      targetId: 'settings',
      details: JSON.stringify({ updatedKeys: updatedSettings }),
      ipAddress: ip,
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      updatedKeys: updatedSettings,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
