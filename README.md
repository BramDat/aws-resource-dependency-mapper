# AWS Resource Dependency Mapper

Desktop app for discovering and visualizing AWS resource dependencies from an ARN.

## Tech stack

- Electron
- React
- TypeScript
- AWS CLI v2
- Electron Builder

## Client requirements

For Windows installer users:

- Windows 10/11 64-bit
- AWS CLI v2 installed
- AWS access keys configured using `aws configure`

Node.js and npm are **not required** for installer users.

For source/npm users:

- Node.js 20+
- npm 10+
- AWS CLI v2

## Local development

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

## Create Windows installer

```bash
npm run dist:win
```

Installer output will be created under `release/`.

## Current MVP features

- AWS CLI installation check
- AWS credential/session check using `aws sts get-caller-identity`
- Green/red AWS login indicator
- Service selector for Step Function, Lambda, and S3
- ARN input
- Dependency discovery using AWS CLI
- Tree visualization
- Export tree as JSON
- Export visible tree as PNG
- Recent scans stored locally

## Branding assets

Place final branding assets here:

```txt
assets/branding/logo-mark.png
assets/branding/wordmark.png
assets/branding/app-icon.ico
assets/branding/installer-banner.png
assets/backgrounds/landing-background.png
```

The app already supports `assets/backgrounds/landing-background.png` when present.


## Install troubleshooting

If `npm install` is slow or tries to download from a private/internal registry, reset the local install state and force the public npm registry:

```bash
npm config set registry https://registry.npmjs.org/
rm -rf node_modules package-lock.json
npm cache verify
npm install
```

On Windows PowerShell:

```powershell
npm config set registry https://registry.npmjs.org/
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm install
```

The project intentionally does not commit `node_modules`, `out`, or `release`. A fresh `package-lock.json` may be generated locally after install.
