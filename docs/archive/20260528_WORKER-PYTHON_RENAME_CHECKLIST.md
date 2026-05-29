---
created_at: 2026-05-28
updated_at: 2026-05-28
created_by: hermes (gpt-5.5)
modified_by: codex (gpt-5)
---

# Worker Python Rename Checklist

## Repository rename checks

- [x] Folder name changed from `cron-services-python/` to `worker-python/` in the tracked repo.
- [x] Root repo references now point agents and readers to `worker-python/`.
- [x] Daily-flow doc was renamed to `docs/20260528_WORKER-PYTHON_DAILY_FLOW.md`.
- [x] New systemd reference files were added under `docs/references/`.
- [ ] Runtime `.env` has been copied from the old folder to `worker-python/.env`.
- [x] LEFT-OFF copy source script has been restored under `worker-python/scripts/sync_left_off.py` before enabling the renamed LEFT-OFF copy timer.
- [ ] Old systemd units have been disabled and removed.
- [ ] New systemd units have been installed, daemon-reloaded, enabled, started, and verified.
- [ ] Old untracked `cron-services-python/` runtime leftovers have been removed after `.env`, scripts, or any other needed runtime files are migrated.

## New systemd reference files

These files are templates committed under `docs/references/`:

- `docs/references/personalweb03-worker-python.service`
- `docs/references/personalweb03-worker-python.timer`
- `docs/references/personalweb03-worker-python-left-off-copy.service`
- `docs/references/personalweb03-worker-python-left-off-copy.timer`

Name mapping:

- `personalweb03-services.service` -> `personalweb03-worker-python.service`
- `personalweb03-services.timer` -> `personalweb03-worker-python.timer`
- `personalweb03-left-off-copy.service` -> `personalweb03-worker-python-left-off-copy.service`
- `personalweb03-left-off-copy.timer` -> `personalweb03-worker-python-left-off-copy.timer`

## Preflight checks

Run these before replacing units. They do not print secret values.

```bash
cd /home/limited_user/applications/PersonalWeb03

git status --short --branch

stat -c '%U:%G %a %s %n' \
  /home/limited_user/applications/PersonalWeb03/cron-services-python/.env \
  /home/limited_user/applications/PersonalWeb03/worker-python/.env \
  /home/limited_user/environments/personal_web03/bin/python \
  2>&1 || true

stat -c '%U:%G %a %s %n' \
  /home/limited_user/applications/PersonalWeb03/worker-python/scripts/sync_left_off.py \
  2>&1 || true

systemd-analyze verify \
  docs/references/personalweb03-worker-python.service \
  docs/references/personalweb03-worker-python.timer \
  docs/references/personalweb03-worker-python-left-off-copy.service \
  docs/references/personalweb03-worker-python-left-off-copy.timer
```

Important current finding: `worker-python/scripts/sync_left_off.py` has been recreated. Continue to verify runtime `.env` and service ownership/mode with metadata-only commands before enabling the renamed LEFT-OFF copy unit.

## Runtime file migration

Copy the old runtime `.env` into the renamed folder without printing secrets:

```bash
cd /home/limited_user/applications/PersonalWeb03

sudo install -o nick -g limited_user -m 0640 \
  /home/limited_user/applications/PersonalWeb03/cron-services-python/.env \
  /home/limited_user/applications/PersonalWeb03/worker-python/.env

stat -c '%U:%G %a %s %n' \
  /home/limited_user/applications/PersonalWeb03/worker-python/.env
```

`sync_left_off.py` now exists in `worker-python/scripts/`. Before enabling the LEFT-OFF copy timer, compile-check it with the project venv:

```bash
cd /home/limited_user/applications/PersonalWeb03

/home/limited_user/environments/personal_web03/bin/python \
  -m py_compile \
  /home/limited_user/applications/PersonalWeb03/worker-python/scripts/sync_left_off.py
```

If the script does not compile, do not enable `personalweb03-worker-python-left-off-copy.timer` yet. Enable only `personalweb03-worker-python.timer`, then fix the copy helper separately.

## Replace systemd units

This sequence disables the old timers, installs the renamed units, removes the old unit files, reloads systemd, and starts the new timers.

```bash
cd /home/limited_user/applications/PersonalWeb03

# Stop timer-driven activations first.
sudo systemctl disable --now personalweb03-services.timer || true
sudo systemctl disable --now personalweb03-left-off-copy.timer || true

# Stop any active one-shot jobs if they are currently running.
sudo systemctl stop personalweb03-services.service || true
sudo systemctl stop personalweb03-left-off-copy.service || true

# Install renamed unit files from the repo references.
sudo install -o root -g root -m 0644 \
  docs/references/personalweb03-worker-python.service \
  /etc/systemd/system/personalweb03-worker-python.service

sudo install -o root -g root -m 0644 \
  docs/references/personalweb03-worker-python.timer \
  /etc/systemd/system/personalweb03-worker-python.timer

sudo install -o root -g root -m 0644 \
  docs/references/personalweb03-worker-python-left-off-copy.service \
  /etc/systemd/system/personalweb03-worker-python-left-off-copy.service

sudo install -o root -g root -m 0644 \
  docs/references/personalweb03-worker-python-left-off-copy.timer \
  /etc/systemd/system/personalweb03-worker-python-left-off-copy.timer

# Remove old unit names after the replacements are in place.
sudo rm -f \
  /etc/systemd/system/personalweb03-services.service \
  /etc/systemd/system/personalweb03-services.timer \
  /etc/systemd/system/personalweb03-left-off-copy.service \
  /etc/systemd/system/personalweb03-left-off-copy.timer

sudo systemctl daemon-reload
sudo systemctl reset-failed \
  personalweb03-services.service \
  personalweb03-services.timer \
  personalweb03-left-off-copy.service \
  personalweb03-left-off-copy.timer \
  personalweb03-worker-python.service \
  personalweb03-worker-python.timer \
  personalweb03-worker-python-left-off-copy.service \
  personalweb03-worker-python-left-off-copy.timer \
  || true

# Enable the main daily worker timer.
sudo systemctl enable --now personalweb03-worker-python.timer

# Enable this only after worker-python/scripts/sync_left_off.py compiles.
sudo systemctl enable --now personalweb03-worker-python-left-off-copy.timer
```

If `sync_left_off.py` does not compile, skip the last command and leave the renamed LEFT-OFF copy timer disabled until the script is fixed.

## Verify timers and services

```bash
systemctl list-timers 'personalweb03-worker-python*' --all --no-pager

systemctl status personalweb03-worker-python.timer --no-pager -l
systemctl status personalweb03-worker-python-left-off-copy.timer --no-pager -l

sudo systemctl start personalweb03-worker-python.service
sudo systemctl status personalweb03-worker-python.service --no-pager -l
sudo journalctl -u personalweb03-worker-python.service -n 80 --no-pager
```

Only run the LEFT-OFF copy service manually after `sync_left_off.py` compiles:

```bash
sudo systemctl start personalweb03-worker-python-left-off-copy.service
sudo systemctl status personalweb03-worker-python-left-off-copy.service --no-pager -l
sudo journalctl -u personalweb03-worker-python-left-off-copy.service -n 80 --no-pager
```

## Old runtime folder cleanup

After `.env` and any required script files are migrated, remove the old untracked runtime folder:

```bash
cd /home/limited_user/applications/PersonalWeb03

# Confirm only disposable/runtime leftovers remain.
find cron-services-python -maxdepth 2 -printf '%M %u:%g %p\n' 2>/dev/null | sort

# Remove only after confirming nothing needed remains there.
sudo rm -rf /home/limited_user/applications/PersonalWeb03/cron-services-python
```

## Venv investigation and recommendation

Investigated venv: `/home/limited_user/environments/personal_web03`.

Findings on 2026-05-28:

- The external venv exists and uses Python 3.12.3.
- It is outside the renamed project directory, so the folder rename does not inherently invalidate it.
- `pyvenv.cfg` points to `/usr/bin/python3.12` and `/home/limited_user/environments/personal_web03`, not to `cron-services-python/`.
- A search of the external venv found no references to `cron-services-python` or `worker-python`.
- Required imports from `worker-python/requirements.txt` are present: `msal`, `docx`, `requests`, `openai`, `dotenv`, and `loguru`.
- `python -m pip check` reports no broken requirements.
- `python -m compileall src` passes from `worker-python/` with the external venv.
- `python -m unittest discover -s tests` passes from `worker-python/` with the external venv.

Recommendation: do not delete and recreate `/home/limited_user/environments/personal_web03` just because of the `worker-python/` rename. Recreate it only if package requirements change, the venv becomes corrupted, or you intentionally want a clean Python environment.

The old untracked project-local venv at `cron-services-python/venv` is different. It is tied to the stale folder and can be removed with the old folder after required runtime files are migrated.

Optional rebuild procedure if you decide to recreate the external venv anyway:

```bash
sudo systemctl disable --now personalweb03-worker-python.timer || true
sudo systemctl disable --now personalweb03-worker-python-left-off-copy.timer || true

sudo mv /home/limited_user/environments/personal_web03 \
  /home/limited_user/environments/personal_web03.bak.$(date +%Y%m%d_%H%M%S)

sudo -u limited_user python3.12 -m venv /home/limited_user/environments/personal_web03
sudo -u limited_user /home/limited_user/environments/personal_web03/bin/python -m pip install --upgrade pip
sudo -u limited_user /home/limited_user/environments/personal_web03/bin/python -m pip install \
  -r /home/limited_user/applications/PersonalWeb03/worker-python/requirements.txt

cd /home/limited_user/applications/PersonalWeb03/worker-python
/home/limited_user/environments/personal_web03/bin/python -m pip check
/home/limited_user/environments/personal_web03/bin/python -m compileall src
/home/limited_user/environments/personal_web03/bin/python -m unittest discover -s tests

sudo systemctl enable --now personalweb03-worker-python.timer
# Enable this too only after sync_left_off.py compiles.
sudo systemctl enable --now personalweb03-worker-python-left-off-copy.timer
```
