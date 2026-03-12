#!/usr/bin/env node

/**
 * Build-time environment variable validation
 *
 * This script validates required environment variables before the Next.js build.
 * If validation fails, the build stops immediately with clear error messages.
 *
 * Usage: node scripts/validate-env.js
 * Exit codes: 0 = success, 1 = validation failed
 */

const { z } = require('zod');
const fs = require('fs');
const path = require('path');

// Load .env files manually (Next.js hasn't loaded them yet)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line) => {
    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Parse KEY=VALUE format
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Only set if not already defined (allow process.env to take precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Load environment files in order (later files override earlier ones)
const webDir = path.resolve(__dirname, '..');
loadEnvFile(path.join(webDir, '.env'));
loadEnvFile(path.join(webDir, '.env.local'));

// Define validation schema for required environment variables
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string({
      required_error: 'NEXT_PUBLIC_API_BASE_URL is required',
    })
    .url('NEXT_PUBLIC_API_BASE_URL must be a valid URL'),

  NEXT_PUBLIC_MODE: z
    .enum(['development', 'production', 'test'], {
      required_error: 'NEXT_PUBLIC_MODE is required',
      invalid_type_error: 'NEXT_PUBLIC_MODE must be one of: development, production, test',
    }),

  NEXT_PUBLIC_NAME_APP: z
    .string({
      required_error: 'NEXT_PUBLIC_NAME_APP is required',
    })
    .min(1, 'NEXT_PUBLIC_NAME_APP cannot be empty'),

  PATH_TO_LOGS: z
    .string({
      required_error: 'PATH_TO_LOGS is required',
    })
    .min(1, 'PATH_TO_LOGS cannot be empty'),
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function formatErrorMessage(errors) {
  const separator = '━'.repeat(60);
  const lines = [];

  lines.push('');
  lines.push(colors.red + separator + colors.reset);
  lines.push(colors.red + colors.bold + '❌ Build Failed: Environment Variable Validation Error' + colors.reset);
  lines.push(colors.red + separator + colors.reset);
  lines.push('');
  lines.push('The following environment variables are required but missing or invalid:');
  lines.push('');

  // Format each error
  errors.forEach((error) => {
    const field = error.path.join('.');
    lines.push(colors.yellow + `  • ${field}` + colors.reset);
    lines.push(`    Error: ${error.message}`);

    // Add helpful examples
    if (field === 'NEXT_PUBLIC_API_BASE_URL') {
      lines.push(colors.cyan + '    Example: http://localhost:8000' + colors.reset);
    } else if (field === 'NEXT_PUBLIC_MODE') {
      lines.push(colors.cyan + '    Example: production' + colors.reset);
    } else if (field === 'NEXT_PUBLIC_NAME_APP') {
      lines.push(colors.cyan + '    Example: PersonalWeb03-NextJS' + colors.reset);
    } else if (field === 'PATH_TO_LOGS') {
      lines.push(colors.cyan + '    Example: /var/log/myapp' + colors.reset);
    }

    lines.push('');
  });

  lines.push(colors.red + separator + colors.reset);
  lines.push(colors.cyan + '💡 Quick Fix:' + colors.reset);
  lines.push('');
  lines.push('Create a .env.local file in the web/ directory with:');
  lines.push('');
  lines.push(colors.green + 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8000' + colors.reset);
  lines.push(colors.green + 'NEXT_PUBLIC_MODE=production' + colors.reset);
  lines.push(colors.green + 'NEXT_PUBLIC_NAME_APP=PersonalWeb03-NextJS' + colors.reset);
  lines.push(colors.green + 'PATH_TO_LOGS=/var/log/myapp' + colors.reset);
  lines.push('');
  lines.push('See .env.example for a complete template.');
  lines.push(colors.red + separator + colors.reset);
  lines.push('');

  return lines.join('\n');
}

function formatSuccessMessage() {
  return `${colors.green}${colors.bold}✓${colors.reset} ${colors.green}Environment variables validated successfully${colors.reset}`;
}

// Main validation logic
function validateEnvironment() {
  const result = envSchema.safeParse(process.env);

  if (result.success) {
    console.log(formatSuccessMessage());
    process.exit(0);
  } else {
    console.error(formatErrorMessage(result.error.issues));
    process.exit(1);
  }
}

// Run validation
validateEnvironment();
