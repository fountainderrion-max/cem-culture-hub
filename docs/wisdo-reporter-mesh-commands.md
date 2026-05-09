# WISDO Reporter Mesh Commands

This document defines the new command layer for WISDO Reporter Mesh, Mobile Cellular Add-On Nodes, and future Cloud/Broker Execution Bridge support.

## Core concept

WISDO should not treat a pairing code as one account connection anymore.

A pairing code registers a **node** into a WISDO workspace.

A workspace can have many nodes:

- Laptop Reporter
- VPS Reporter
- Mobile Cellular Add-On
- Mobile Controller
- Copy Follower Node
- Coach Viewer Node
- Backup Reporter
- Signal Only Node
- Future Cloud Execution Node

Each node can be assigned to the same or a different trading account.

## Critical routing rule

A mobile account may receive trade signals immediately, but it cannot execute trades unless an online execution route exists for that exact account.

Never route a trade command to a reporter attached to a different account.

## Commands added

### `/mesh`
Shows the full WISDO Reporter Mesh for the user workspace.

Shows:

- Node name
- Node type
- Account
- Broker/server/login
- Status
- Last seen
- Permissions
- Primary/backup/mirror role
- Execution enabled/disabled

### `/mesh-add`
Adds a node to the workspace.

Node types:

- `PRIMARY_REPORTER`
- `LAPTOP_REPORTER`
- `VPS_REPORTER`
- `MOBILE_CELLULAR_NODE`
- `MOBILE_CONTROLLER`
- `COPY_FOLLOWER_NODE`
- `COACH_VIEWER_NODE`
- `BACKUP_REPORTER`
- `SIGNAL_ONLY_NODE`

### `/mesh-status`
Shows node and execution-route health.

### `/mesh-generate-code`
Generates a pairing code for a node.

Pairing prefixes:

- `RPT` = reporter
- `MOB` = mobile cellular add-on
- `VPS` = VPS node
- `CPY` = copy follower
- `COA` = coach viewer
- `BKP` = backup reporter
- `CLD` = cloud execution node

### `/mesh-set-primary`
Sets a reporter node as the primary execution route for an account.

Requires confirmation.

### `/mesh-remove`
Disables or removes a mesh node.

Requires confirmation.

### `/add-mobile-node`
Adds a Mobile Cellular Add-On node.

Flow:

1. User already has laptop reporter connected.
2. User runs `/add-mobile-node`.
3. WISDO asks if this node is for the same account or a different account.
4. If different account, collect broker/server/login/account name/demo-live.
5. Generate `MOB-######` code.
6. Mobile node pairs into workspace.
7. Mobile node does not overwrite the laptop reporter.

Default mobile node permissions:

- `canReceiveSignals=true`
- `canApproveSignals=true`
- `canControl=true`
- `canExecute=false` until owner enables execution route

### `/add-reporter-node`
Adds a laptop, VPS, or backup reporter node for an account.

### `/add-copy-node`
Adds a copy follower node for student/follower accounts.

### `/my-nodes`
Lists all nodes connected to the workspace.

### `/node-status`
Checks one node's status and permissions.

### `/remove-node`
Removes a node.

Requires confirmation.

### `/execution-route`
Shows or manages execution routes.

Route types:

- `LOCAL_REPORTER`
- `VPS_REPORTER`
- `CLOUD_MT4_NODE`
- `BROKER_API`
- `FIX_API`
- `MANUAL_ONLY`

### `/take-signal`
Takes a Discord signal on a selected account.

Before execution, WISDO must check:

1. Selected account exists.
2. Online execution route exists for that exact account.
3. Route has `canExecute=true`.
4. User has permission.
5. Symbol is allowed.
6. Risk profile is valid.
7. Duplicate trade protection is clear.
8. Daily loss and drawdown limits are safe.
9. Broker/reporter confirms execution.

If no route exists, show:

> This account can receive signals, but cannot execute trades yet. Connect a reporter, VPS node, or Cloud Execution Bridge.

### `/queue-signal`
Queues a signal until a valid execution route comes online.

### `/cloud-route`
Prepares a future cloud/broker execution route.

Supported placeholders:

- `CLOUD_MT4_NODE`
- `BROKER_API`
- `FIX_API`

Do not enable live broker API/FIX execution until credentials and provider support are verified.

## Required database models

### `workspaces`

- `id`
- `ownerUserId`
- `name`
- `plan`
- `createdAt`

### `trading_accounts`

- `id`
- `workspaceId`
- `broker`
- `server`
- `login`
- `accountName`
- `demoLive`
- `status`

### `reporter_nodes`

- `id`
- `workspaceId`
- `tradingAccountId`
- `nodeName`
- `nodeType`
- `pairCode`
- `nodeToken`
- `status`
- `canReport`
- `canReceiveSignals`
- `canApproveSignals`
- `canExecuteTrades`
- `canManageRisk`
- `canCopyTrades`
- `canControl`
- `isPrimary`
- `lastSeen`
- `createdAt`

### `execution_routes`

- `id`
- `workspaceId`
- `tradingAccountId`
- `routeType`
- `routeName`
- `nodeId`
- `status`
- `canExecute`
- `requiresConfirmation`
- `priority`
- `lastHeartbeat`
- `createdAt`
- `updatedAt`

### `command_routes`

- `id`
- `workspaceId`
- `sourceNodeId`
- `destinationNodeId`
- `tradingAccountId`
- `commandType`
- `payload`
- `status`
- `createdAt`
- `executedAt`

### `audit_logs`

- `id`
- `workspaceId`
- `actorUserId`
- `nodeId`
- `accountId`
- `action`
- `details`
- `createdAt`

## Safety requirements

- Pairing a mobile node must never replace an existing reporter unless owner confirms.
- More than one node can exist in a workspace.
- More than one account can exist in a workspace.
- A mobile node may be assigned to a different account than the laptop reporter.
- Dangerous actions require confirmation:
  - close all
  - replace primary
  - enable execution
  - remove node
  - risk increase
- Every node command must be audit logged.
- If two nodes claim the same account, WISDO must ask whether the new node is backup, mirror, or replacement.
- Default behavior should be backup/mirror, not replacement.

## Product language

Use this inside the app:

> WISDO builds a reporter mesh. Every device gets a node. Every node can be routed, permissioned, and assigned to an account.

## Mobile account trade truth

A mobile account can receive signals without a reporter.

A mobile account can only take trades if it has one of these execution routes:

- Local reporter logged into that account
- VPS reporter logged into that account
- Cloud MT4 node logged into that account
- Future broker API/FIX bridge verified for that account

No execution route means no trade execution.
