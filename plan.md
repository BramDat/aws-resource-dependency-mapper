# AWS Resource Dependency Mapper - Project Plan

## 1. Product Overview

**Product name:** AWS Resource Dependency Mapper  
**Package/repository name:** `aws-resource-dependency-mapper`  
**Application type:** Desktop application  
**Primary target OS:** Windows 11  
**Secondary target OS:** Windows 10 64-bit  
**Primary distribution:** Windows `.exe` installer  
**Secondary distribution:** npm package/global CLI launcher  

AWS Resource Dependency Mapper is a desktop application that allows users to start with an AWS resource ARN and discover related AWS services/resources. The discovered resources are displayed in a tree structure and can be exported for sharing, documentation, and analysis.

The core product idea is:

> Paste an AWS ARN. Discover everything connected to it.

The app should be simple enough for developers, DevOps engineers, cloud engineers, architects, and support teams to quickly understand AWS relationships without manually checking many AWS Console pages or CLI commands.

---

## 2. Goals

### 2.1 Primary Goals

- Build a Windows desktop application using Electron, React, and TypeScript.
- Allow users to discover AWS resource dependencies starting from a selected AWS service and ARN.
- Use the locally installed AWS CLI for authentication and AWS data access.
- Display discovered resources in a clean tree view.
- Provide export options for JSON and image/PNG in v1.
- Provide a clean, branded, professional UI using provided logo and background assets.
- Package the app as a Windows `.exe` installer.
- Optionally publish the app as an npm package for developer users.

### 2.2 Long-Term Goals

- Support scan-all account discovery.
- Support HTML report export.
- Support multiple AWS profiles.
- Support multi-region discovery.
- Support richer graph visualization in addition to tree view.
- Support saved scan history and comparison between scans.

---

## 3. Target Users

- Developers working with AWS services.
- DevOps engineers debugging AWS workflows.
- Cloud engineers reviewing dependencies.
- Architects documenting AWS resource relationships.
- Support engineers troubleshooting customer/account environments.
- Teams that need quick local discovery without deploying AWS-side infrastructure.

---

## 4. Technology Stack

### 4.1 Desktop Shell

- **Electron**

Electron provides the desktop runtime, native window, packaging support, file system access, and the ability to communicate between the UI and Node.js logic.

### 4.2 UI Layer

- **React**
- **TypeScript**
- **CSS modules or modern scoped CSS approach**

React is used only for the UI inside Electron's renderer process. This remains a desktop app, not a web-hosted app.

### 4.3 Backend/Desktop Logic

- **Node.js inside Electron main process**
- **TypeScript**
- AWS CLI commands executed through Node process utilities

### 4.4 AWS Access

- **AWS CLI v2** installed on the user's machine
- AWS credentials configured using access keys through `aws configure`
- MVP supports only the default AWS profile

### 4.5 Packaging

- **electron-builder** for Windows `.exe` installer generation
- npm package support with a CLI launcher for developer users

### 4.6 Recommended Node Version for Development/npm Users

- Development and npm package users: Node.js `>=20`
- Windows `.exe` users do not need Node.js or npm installed because Electron bundles its own runtime.

---

## 5. Distribution Strategy

### 5.1 Primary Distribution - Windows Installer

The primary distribution is a Windows installer:

```txt
AWS-Resource-Dependency-Mapper-Setup.exe
```

Installer users should not need to install Node.js, npm, Git, or Electron.

Required on client machine:

- Windows 10/11 64-bit
- AWS CLI v2 installed
- AWS credentials configured using access keys

Not required on client machine:

- Node.js
- npm
- Git
- Electron

Electron bundles its own runtime inside the application installation directory. This does not conflict with any Node.js version installed globally on the user's machine.

### 5.2 Secondary Distribution - npm Package

Optional developer distribution:

```bash
npm install -g aws-resource-dependency-mapper
aws-resource-dependency-mapper
```

or:

```bash
npx aws-resource-dependency-mapper
```

npm package users require:

- Node.js `>=20`
- npm
- AWS CLI v2
- AWS credentials configured

---

## 6. Runtime Requirements

### 6.1 For Windows Installer Users

| Requirement | Needed |
|---|---:|
| Windows 10/11 64-bit | Yes |
| AWS CLI v2 | Yes |
| AWS credentials | Yes |
| Node.js | No |
| npm | No |
| Git | No |
| Electron | No |

### 6.2 For npm Users

| Requirement | Needed |
|---|---:|
| Node.js >=20 | Yes |
| npm | Yes |
| AWS CLI v2 | Yes |
| AWS credentials | Yes |

---

## 7. AWS Authentication Strategy

The app uses AWS CLI and access-key based authentication.

### 7.1 AWS CLI Check

On startup, the app checks whether AWS CLI is installed:

```bash
aws --version
```

If the command succeeds, continue.

If it fails, show a blocking message:

```txt
AWS CLI v2 is required. Please install AWS CLI v2 before using this app.
```

### 7.2 AWS Credential Check

The app checks whether credentials are configured:

```bash
aws sts get-caller-identity
```

If successful, show AWS login status as connected.

If failed, show AWS login status as not connected and provide guidance to run:

```bash
aws configure
```

For MVP, the app can provide a button to open an integrated setup prompt or show a terminal-style instruction panel. The app should not permanently store AWS access keys itself. AWS CLI should own credential storage.

### 7.3 Login Status Indicator

The UI should show an AWS status indicator with a colored icon/bulb.

Recommended states:

| State | Icon Color | Meaning |
|---|---|---|
| Checking | Yellow | App is checking AWS CLI/session |
| Connected | Green | AWS CLI credentials are valid |
| Not connected | Red | AWS credentials are missing/invalid |
| Unknown | Gray | Status has not been checked yet |

Example display:

```txt
AWS CLI: Installed
AWS Login: Connected
Account: 123456789012
Region: us-east-1
Profile: default
```

---

## 8. Application Architecture

### 8.1 High-Level Architecture

```txt
AWS Resource Dependency Mapper
│
├── Electron Main Process
│   ├── App window lifecycle
│   ├── IPC handlers
│   ├── AWS CLI command execution
│   ├── File export operations
│   ├── Local app storage
│   └── Native dialogs
│
├── Electron Preload Layer
│   ├── Safe bridge between renderer and main process
│   ├── Exposes limited API to UI
│   └── Prevents direct Node access in renderer
│
├── React Renderer Process
│   ├── Landing screen
│   ├── AWS status card
│   ├── Service selector
│   ├── ARN input
│   ├── Discovery progress
│   ├── Tree viewer
│   ├── Recent scans
│   └── Export controls
│
└── Discovery Engine
    ├── Service-specific discovery modules
    ├── Dependency graph model
    ├── Tree model builder
    ├── Error handling
    └── Future scan-all orchestration
```

### 8.2 Recommended Project Structure

```txt
aws-resource-dependency-mapper/
│
├── package.json
├── tsconfig.json
├── electron-builder.json
├── README.md
├── plan.md
├── .gitignore
│
├── assets/
│   ├── branding/
│   │   ├── logo-mark.png
│   │   ├── wordmark.png
│   │   ├── app-icon.ico
│   │   └── installer-banner.png
│   │
│   └── backgrounds/
│       └── landing-background.png
│
├── src/
│   ├── main/
│   │   ├── main.ts
│   │   ├── app-window.ts
│   │   ├── ipc-handlers.ts
│   │   ├── native-dialog.service.ts
│   │   └── app-storage.service.ts
│   │
│   ├── preload/
│   │   └── preload.ts
│   │
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── theme.css
│   │   │
│   │   ├── components/
│   │   │   ├── AwsStatusCard.tsx
│   │   │   ├── ServiceSelector.tsx
│   │   │   ├── ArnInput.tsx
│   │   │   ├── DiscoveryPanel.tsx
│   │   │   ├── DependencyTree.tsx
│   │   │   ├── ExportActions.tsx
│   │   │   ├── RecentScans.tsx
│   │   │   └── StatusIndicator.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   └── DiscoveryPage.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAwsStatus.ts
│   │   │   ├── useDiscovery.ts
│   │   │   └── useRecentScans.ts
│   │   │
│   │   └── types/
│   │       └── electron-api.d.ts
│   │
│   ├── aws/
│   │   ├── aws-cli.service.ts
│   │   ├── aws-auth.service.ts
│   │   ├── aws-command-runner.ts
│   │   ├── aws-region.service.ts
│   │   └── aws-types.ts
│   │
│   ├── discovery/
│   │   ├── discovery-engine.ts
│   │   ├── discovery.types.ts
│   │   ├── graph-builder.ts
│   │   ├── tree-builder.ts
│   │   │
│   │   ├── services/
│   │   │   ├── step-function.discovery.ts
│   │   │   ├── lambda.discovery.ts
│   │   │   ├── s3.discovery.ts
│   │   │   ├── iam.discovery.ts
│   │   │   └── cloudwatch.discovery.ts
│   │   │
│   │   └── utils/
│   │       ├── arn-parser.ts
│   │       ├── json-utils.ts
│   │       └── dependency-normalizer.ts
│   │
│   ├── export/
│   │   ├── json-export.service.ts
│   │   ├── image-export.service.ts
│   │   └── html-export.service.ts
│   │
│   └── shared/
│       ├── constants.ts
│       ├── app-config.ts
│       └── result.ts
│
├── bin/
│   └── cli.js
│
└── scripts/
    ├── build-icons.js
    └── prepare-release.js
```

---

## 9. Electron Security Requirements

The app should follow Electron security best practices:

- Disable Node integration in renderer.
- Enable context isolation.
- Use a preload script to expose a small controlled API.
- Avoid exposing raw `child_process` or file system APIs to renderer.
- Validate all inputs crossing IPC boundaries.
- Never store AWS access keys in the app.
- Use AWS CLI credential storage only.

Recommended BrowserWindow settings:

```ts
webPreferences: {
  preload: preloadPath,
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: false
}
```

---

## 10. Functional Requirements

### 10.1 Startup Checks

On app startup:

1. Check if AWS CLI is installed.
2. Check if AWS credentials are valid.
3. Display AWS CLI and AWS login status.
4. Show account and region if available.
5. If AWS CLI is missing, block discovery and show installation guidance.
6. If AWS credentials are missing, disable discovery and show `aws configure` guidance.

### 10.2 Discovery Input

The user should be able to:

1. Select a starting service from a dropdown.
2. Enter the ARN of the selected service/resource.
3. Start discovery.

Initial service dropdown values:

- Step Function
- Lambda
- S3

Future values:

- API Gateway
- EventBridge
- SQS
- SNS
- DynamoDB
- CloudWatch Logs
- IAM Role
- Glue
- ECS
- ECR

### 10.3 ARN Input Behavior

- ARN textbox is disabled until the user selects a service.
- ARN textbox should validate basic ARN format.
- Discovery button should remain disabled until service and ARN are valid.
- Show inline validation messages.

Example ARN validation rule:

```txt
arn:partition:service:region:account-id:resource
```

### 10.4 Discovery Execution

When the user clicks Discover:

1. Validate AWS CLI and credential status.
2. Validate selected service and ARN.
3. Run discovery for selected service.
4. Collect direct dependencies.
5. Collect important second-level dependencies where feasible.
6. Normalize results into a dependency tree model.
7. Display tree in UI.
8. Save scan to recent scans.

### 10.5 Tree View

The result should be displayed in an expandable/collapsible tree.

Tree node should include:

- Resource name
- Resource type
- ARN when available
- Region when available
- Account ID when available
- Relationship label when available
- Warning/error metadata when partial discovery failed

Example:

```txt
Step Function: export-data-workflow
├── IAM Role: step-function-execution-role
├── Lambda: get-metadata
│   ├── IAM Role: get-metadata-lambda-role
│   ├── CloudWatch Logs: /aws/lambda/get-metadata
│   └── Environment Variables
├── Lambda: process-metadata-row
│   ├── IAM Role: process-lambda-role
│   ├── S3 Bucket: export-csv-bucket
│   └── CloudWatch Logs: /aws/lambda/process-metadata-row
└── Lambda: finalize-transaction
    ├── IAM Role: finalize-lambda-role
    └── CloudWatch Logs: /aws/lambda/finalize-transaction
```

---

## 11. Service Discovery Requirements

### 11.1 Step Function Discovery

For a Step Function ARN, run:

```bash
aws stepfunctions describe-state-machine --state-machine-arn <arn>
```

Discover:

- State machine name
- State machine ARN
- Execution role ARN
- Definition JSON
- Lambda functions referenced in Task states
- AWS SDK/service integrations referenced in Task states
- Map state processors
- S3 references where statically present
- SNS/SQS/EventBridge integrations where present
- CloudWatch logging configuration where available

Then recursively discover related Lambda functions where feasible.

### 11.2 Lambda Discovery

For a Lambda ARN/name, run:

```bash
aws lambda get-function --function-name <lambda-arn-or-name>
```

Discover:

- Function name
- Function ARN
- Runtime
- Handler
- Role ARN
- Environment variables metadata
- Layers
- VPC config
- Dead letter config
- Timeout/memory size
- CloudWatch log group
- Event source mappings
- Resource-based policy where available

Additional Lambda commands:

```bash
aws lambda list-event-source-mappings --function-name <lambda>
aws lambda get-policy --function-name <lambda>
```

Reverse discovery for Step Functions:

- List state machines in the region.
- Describe each state machine.
- Parse definition.
- Check whether the Lambda ARN/name is referenced.

This can identify Step Functions that call the Lambda, but it requires scanning state machine definitions and may be slower.

### 11.3 S3 Discovery

For an S3 bucket ARN/name, discover:

- Bucket name
- Region
- Bucket policy
- Notification configuration
- EventBridge notification configuration
- Lambda/SNS/SQS event targets
- Encryption configuration
- Versioning status
- Lifecycle rules metadata

Possible commands:

```bash
aws s3api get-bucket-location --bucket <bucket>
aws s3api get-bucket-policy --bucket <bucket>
aws s3api get-bucket-notification-configuration --bucket <bucket>
aws s3api get-bucket-encryption --bucket <bucket>
aws s3api get-bucket-versioning --bucket <bucket>
```

### 11.4 IAM Discovery

For IAM roles discovered from Step Functions/Lambda:

- Role name
- Role ARN
- Trust policy
- Attached managed policies
- Inline policies
- High-level service permissions inferred from policy actions

Possible commands:

```bash
aws iam get-role --role-name <role-name>
aws iam list-attached-role-policies --role-name <role-name>
aws iam list-role-policies --role-name <role-name>
aws iam get-role-policy --role-name <role-name> --policy-name <policy-name>
```

### 11.5 CloudWatch Logs Discovery

For Lambda functions:

```txt
/aws/lambda/<function-name>
```

Discover log group existence and basic metadata where feasible.

---

## 12. Export Requirements

### 12.1 JSON Export - v1

The user should be able to export the discovered dependency tree as JSON.

Export should include:

- Scan metadata
- AWS account ID
- Region
- Starting service
- Starting ARN
- Timestamp
- Tree nodes
- Relationships
- Warnings/errors

Example structure:

```json
{
  "appName": "AWS Resource Dependency Mapper",
  "scan": {
    "startedAt": "2026-06-14T00:00:00.000Z",
    "sourceService": "lambda",
    "sourceArn": "arn:aws:lambda:...",
    "accountId": "123456789012",
    "region": "us-east-1"
  },
  "tree": {
    "id": "root",
    "type": "lambda",
    "name": "process-orders",
    "arn": "arn:aws:lambda:...",
    "children": []
  },
  "warnings": []
}
```

### 12.2 Image/PNG Export - v1

The user should be able to export the visible tree as an image.

Recommended approach:

- Use renderer-side DOM capture library, or Electron capture APIs.
- Export current tree view as PNG.
- Include title and timestamp where possible.

### 12.3 HTML Export - Future/v1.1

HTML export should generate a standalone interactive report.

Target output:

```txt
dependency-report.html
```

Report should include:

- App name/logo
- Generated timestamp
- AWS account ID
- Region
- Starting ARN
- Expand/collapse tree
- Search/filter inside tree
- Resource metadata panels
- No internet dependency

This is planned for a later version, not required for initial MVP unless explicitly prioritized.

---

## 13. UI/UX Design Specification

### 13.1 Branding Assets

Use provided image assets as follows.

#### Logo Presentation Image

The first image, `logo-title-etc.png`, contains three useful pieces:

1. **Top-left large symbol**
   - Main logo mark / brand symbol
   - Use for branding, headers, splash screens, README, installer banner, and About screen

2. **Top-right text**
   - Wordmark: `AWS Dependency Mapper`
   - Use when full brand identity is needed

3. **Bottom-center rounded square icon**
   - Desktop app icon style
   - Use for Windows `.exe` icon, taskbar icon, Start Menu icon, shortcut icon, and installer icon

#### Background Image

The second image, `background.png`, is the landing screen background.

Use it behind the Electron welcome screen.

Place app name, CTA button, recent scans, and Start Discovery UI mostly on the darker empty left/center area.

### 13.2 Asset Folder Structure

```txt
assets/
├── branding/
│   ├── logo-title-etc.png
│   ├── logo-mark.png
│   ├── wordmark.png
│   ├── app-icon.png
│   ├── app-icon.ico
│   └── installer-banner.png
│
└── backgrounds/
    └── background.png
```

### 13.3 Visual Style

Recommended theme:

```txt
Dark, modern, cloud-console inspired UI
```

Style direction:

- Dark background
- Frosted-glass panels
- White/light-gray text
- Teal/cyan primary action color
- Green/red/yellow status indicators
- Semi-transparent dark input controls
- Smooth rounded corners
- Windows 11-style subtle depth

### 13.4 Landing Page Layout

Suggested layout:

```txt
--------------------------------------------------
|                                                |
|  [Logo] AWS Resource Dependency Mapper          |
|                                                |
|  Discover AWS resource dependencies             |
|  from any ARN.                                  |
|                                                |
|  [ Start Discovery ]                            |
|                                                |
|  AWS CLI: Installed       ●                     |
|  AWS Login: Connected     ●                     |
|                                                |
|  Recent Scans                                  |
|  • Lambda: process-orders                       |
|  • Step Function: export-workflow               |
|                                                |
--------------------------------------------------
```

### 13.5 Discovery Page Layout

```txt
--------------------------------------------------
| Header: AWS Resource Dependency Mapper          |
| AWS Status: ● Connected | Account | Region      |
|------------------------------------------------|
| Service: [ Step Function v ]                    |
| ARN:     [ arn:aws:states:...              ]    |
|          [ Discover ] [ Export JSON ] [ PNG ]   |
|------------------------------------------------|
| Discovery Progress / Messages                   |
|------------------------------------------------|
| Dependency Tree                                 |
|                                                |
| Step Function: export-workflow                  |
| ├── Lambda: get-metadata                        |
| └── Lambda: finalize                            |
--------------------------------------------------
```

### 13.6 Control Styling

- Primary buttons should use teal/cyan accent.
- Inputs should use dark translucent backgrounds.
- Dropdowns should match input styling.
- Disabled controls should be visibly muted.
- Tree nodes should use icons per AWS service type where possible.
- Status indicators should be colored circular bulbs/icons.

---

## 14. Recent Scans

### 14.1 Purpose

Recent scans make the app feel polished and useful for day-to-day use.

### 14.2 Storage

Store recent scans locally using Electron app data path.

Example Windows location:

```txt
%APPDATA%/AWS Resource Dependency Mapper/recent-scans.json
```

### 14.3 Data Stored

Store last 10 scans:

- Service type
- Resource name
- ARN
- Account ID
- Region
- Timestamp
- Optional path to exported result if saved

### 14.4 UI

Show recent scans on landing screen:

```txt
Recent Scans
• Lambda: process-orders
• Step Function: export-data-workflow
• S3: export-csv-bucket
```

Clicking a recent scan can preload service and ARN.

---

## 15. Scan All Feature

### 15.1 Status

Scan All is a future feature, not part of MVP unless specifically prioritized later.

### 15.2 Why Not MVP

Scanning an entire AWS account can be slow and expensive in terms of API calls.

Example large account:

```txt
200 Lambdas
40 Step Functions
500 S3 buckets
2000 IAM policies
Multiple regions
```

This can take minutes and requires pagination, throttling handling, caching, progress reporting, and potentially multi-region selection.

### 15.3 Future UX

Add discovery mode:

```txt
Discovery Mode:
(•) Discover from ARN
( ) Scan Entire Account
```

### 15.4 Future Architecture

```txt
Scan Account
↓
List resources by service
↓
Build dependency graph
↓
Cache locally
↓
Render searchable tree/graph
↓
Export report
```

### 15.5 Future Requirements

- Service selection for scan all
- Region selection
- Progress indicator
- Cancel scan
- API throttling/retry handling
- Local cache
- Search/filter results
- Export full report

---

## 16. Error Handling Strategy

### 16.1 User-Friendly Errors

Errors should be shown clearly without exposing raw stack traces by default.

Examples:

| Scenario | Message |
|---|---|
| AWS CLI missing | AWS CLI v2 is required. Please install it before using this app. |
| Credentials missing | AWS credentials were not found. Run `aws configure` and try again. |
| Invalid ARN | The ARN format appears invalid. Please check and try again. |
| Access denied | AWS returned AccessDenied. Your credentials may not have permission to read this resource. |
| Resource not found | The selected resource was not found in the configured account/region. |
| Partial discovery | Some related resources could not be discovered due to missing permissions. |

### 16.2 Partial Results

The app should still show partial results if some discovery calls fail.

Tree nodes can include warning badges:

```txt
Lambda: process-orders
└── IAM Role: Access denied while reading policies
```

### 16.3 Logs

Maintain internal logs for troubleshooting.

Do not log secrets or full environment variable values.

---

## 17. Security Considerations

- Do not store AWS access keys in app-specific files.
- Rely on AWS CLI credential storage.
- Do not display secret environment variable values in full.
- Mask sensitive environment variable values by default.
- Do not expose shell command execution to renderer.
- Validate service type and ARN before sending to main process.
- Avoid arbitrary command construction.
- Use argument arrays instead of raw shell strings where possible.
- Provide clear warnings when permissions are missing.

---

## 18. Non-Functional Requirements

### 18.1 Performance

- Startup should be fast.
- AWS status checks should run asynchronously.
- Discovery should show progress.
- UI should remain responsive during discovery.
- Long-running discovery should be cancellable in future versions.

### 18.2 Reliability

- Handle missing AWS CLI.
- Handle invalid AWS credentials.
- Handle AWS API throttling.
- Handle invalid/mismatched ARN and service selections.
- Handle JSON parse failures from CLI output.
- Continue with partial results where possible.

### 18.3 Maintainability

- Use TypeScript across main, preload, renderer, and discovery layers.
- Keep service-specific discovery modules independent.
- Keep renderer free of AWS CLI execution logic.
- Use typed IPC contracts.
- Use clear folder boundaries.

### 18.4 Usability

- User should know whether AWS CLI and AWS credentials are ready.
- User should know what account/region they are scanning.
- User should receive clear progress messages.
- User should be able to export results easily.
- User should not need to understand internal AWS CLI commands to use the app.

---

## 19. Data Models

### 19.1 Service Type

```ts
export type AwsServiceType =
  | 'step-function'
  | 'lambda'
  | 's3'
  | 'iam-role'
  | 'cloudwatch-log-group';
```

### 19.2 Discovery Request

```ts
export interface DiscoveryRequest {
  serviceType: AwsServiceType;
  arn: string;
  region?: string;
  profile?: string;
}
```

### 19.3 Dependency Node

```ts
export interface DependencyNode {
  id: string;
  type: AwsServiceType | string;
  name: string;
  arn?: string;
  region?: string;
  accountId?: string;
  relationship?: string;
  metadata?: Record<string, unknown>;
  warnings?: string[];
  errors?: string[];
  children: DependencyNode[];
}
```

### 19.4 Discovery Result

```ts
export interface DiscoveryResult {
  scanId: string;
  startedAt: string;
  completedAt: string;
  sourceService: AwsServiceType;
  sourceArn: string;
  accountId?: string;
  region?: string;
  root: DependencyNode;
  warnings: string[];
  errors: string[];
}
```

### 19.5 AWS Status

```ts
export interface AwsStatus {
  cliInstalled: boolean;
  credentialsValid: boolean;
  accountId?: string;
  arn?: string;
  userId?: string;
  region?: string;
  profile: 'default';
  status: 'checking' | 'connected' | 'not-connected' | 'unknown';
  message?: string;
}
```

---

## 20. IPC API Contract

Renderer should call safe APIs exposed from preload.

Example:

```ts
window.awsDependencyMapper.checkAwsStatus();
window.awsDependencyMapper.discover(request);
window.awsDependencyMapper.exportJson(result);
window.awsDependencyMapper.exportImage(imageData);
window.awsDependencyMapper.getRecentScans();
window.awsDependencyMapper.saveRecentScan(scan);
```

Preload should expose only specific functions, not raw IPC or Node APIs.

---

## 21. Packaging Configuration

### 21.1 App Metadata

```json
{
  "name": "aws-resource-dependency-mapper",
  "productName": "AWS Resource Dependency Mapper",
  "description": "Discover and visualize AWS resource dependencies from any ARN."
}
```

### 21.2 Windows Installer

Electron Builder target:

```json
{
  "win": {
    "target": "nsis",
    "icon": "assets/branding/app-icon.ico"
  }
}
```

### 21.3 npm CLI

Package bin:

```json
{
  "bin": {
    "aws-resource-dependency-mapper": "./bin/cli.js"
  }
}
```

---

## 22. Roadmap

### 22.1 v1.0 - MVP/Product Foundation

Features:

- Electron + React + TypeScript desktop app
- Windows 10/11 support
- AWS CLI installed check
- AWS credentials/login status check
- Green/red/yellow AWS status indicator
- Default AWS profile support
- Service dropdown
- ARN textbox with validation
- Discover from ARN
- Step Function discovery
- Lambda discovery
- S3 discovery
- IAM role metadata discovery
- CloudWatch log group discovery
- Dependency tree display
- Recent scans
- JSON export
- PNG/image export
- Branded landing screen using provided background
- Logo/icon usage for app, taskbar, installer, and README
- Windows `.exe` installer
- Optional npm global package support

### 22.2 v1.1 - Reporting and Usability Enhancements

Features:

- HTML export
- Search inside dependency tree
- Expand all/collapse all
- Better recent scan management
- Multi-region option for ARN discovery
- Improved warning badges
- Export metadata summary
- Better installer branding
- Optional dark/light theme toggle

### 22.3 v2.0 - Advanced Discovery

Features:

- Scan Entire Account mode
- Multi-profile support
- Multi-region scan support
- Cached local graph database
- Graph visualization mode
- Dependency search
- Account-wide architecture report
- Cross-account discovery support
- Compare two scans
- CI/CD/headless export mode

---

## 23. Development Guidelines

- Use TypeScript for all application code.
- Keep Electron main process logic separate from renderer UI.
- Keep AWS CLI execution inside `src/aws` and `src/main`, not in React components.
- Use service-specific discovery modules.
- Normalize all AWS data into common dependency node model.
- Use typed results instead of raw objects where practical.
- Return partial results when possible.
- Avoid blocking the UI during discovery.
- Prefer small, testable functions.
- Keep code structure ready for future service expansion.

---

## 24. Acceptance Criteria

### 24.1 Startup

- App launches on Windows 10/11.
- App shows whether AWS CLI is installed.
- App shows whether AWS credentials are valid.
- App displays account ID if credentials are valid.

### 24.2 Discovery

- User can select Step Function, Lambda, or S3.
- User can enter an ARN.
- App validates ARN input.
- App discovers related resources using AWS CLI.
- App displays results as a tree.
- App handles missing permissions gracefully.

### 24.3 Export

- User can export tree as JSON.
- User can export visible result as PNG/image.

### 24.4 Branding

- App uses provided logo/branding assets.
- App uses provided background image on landing screen.
- Installer/taskbar/start menu icon uses app icon.

### 24.5 Packaging

- App can be packaged as Windows `.exe` installer.
- App can optionally be launched through npm package/global CLI.

---

## 25. Assumptions

- User uses AWS access keys configured with AWS CLI.
- MVP supports only default AWS profile.
- MVP focuses on Windows 10/11.
- MVP does not bundle AWS CLI.
- AWS CLI v2 is a prerequisite.
- App does not store AWS access keys.
- Initial discovery services are Step Function, Lambda, and S3.
- Scan All and HTML export are future features unless explicitly prioritized.

---

## 26. Final Product Positioning

AWS Resource Dependency Mapper is a local desktop utility for AWS dependency discovery.

Primary value:

```txt
Start from any AWS ARN and quickly understand connected AWS resources.
```

Suggested tagline:

```txt
Paste an ARN. Explore your AWS dependencies.
```

Alternative tagline:

```txt
Discover and visualize AWS resource dependencies from any ARN.
```
