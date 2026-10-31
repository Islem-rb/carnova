# Git delivery in this environment

## Current follow-up checkout

The original workspace is on `redesign/v2`, but its `.git` is read-only and still describes baseline `b91de95`. The original redesign was committed through temporary metadata and pushed as `c1cfe48`. That old `/tmp/carnova-v2.git` directory is no longer available in this session.

The verified root `redesign-v2.bundle` was used to create a **normal writable checkout** at `/tmp/carnova-review`, on the same `redesign/v2` branch. Follow-up commits use that checkout. Only reviewed changed files are mirrored into the shared workspace; original media, uploads and main are untouched.

```bash
git -C /tmp/carnova-review status
git -C /tmp/carnova-review log --oneline -5
```

The updated `redesign-v2.bundle` is an ignored local delivery artifact containing the redesign and follow-up commits after `b91de95`. The temporary checkout can disappear between sessions, while the bundle remains with this project.

## Recover into a clean checkout

When network access is available, clone the pushed redesign branch into a **new, empty destination**, then import and fast-forward to the bundled follow-up commits:

```bash
git clone --branch redesign/v2 https://github.com/Islem-rb/carnova /path/to/new-carnova
git -C /path/to/new-carnova fetch /path/to/original-carnova/redesign-v2.bundle redesign/v2
git -C /path/to/new-carnova merge --ff-only FETCH_HEAD
```

Offline recovery, using the existing baseline checkout as the object source:

```bash
git clone --bare --no-hardlinks /path/to/original-carnova /tmp/carnova-seed.git
git --git-dir=/tmp/carnova-seed.git fetch /path/to/original-carnova/redesign-v2.bundle refs/heads/redesign/v2:refs/heads/redesign/v2
git clone --branch redesign/v2 /tmp/carnova-seed.git /path/to/new-carnova
git -C /path/to/new-carnova remote set-url origin https://github.com/Islem-rb/carnova
```

Use fresh destination paths for these commands. Do not reset or replace the original read-only checkout: its files are preserved, and its Git index intentionally remains unchanged.

## Publication

The original redesign push succeeded using the existing SSH identity with a session-scoped configuration override; no credential values were read or printed. The current follow-up session has restricted network access, so the new review commits are local until a network-enabled session can run:

```bash
git -C /tmp/carnova-review push origin redesign/v2
```

Use the authenticated transport already configured on your machine. No force push, main-branch update, history rewrite, account creation or system SSH/Git configuration change is required.
