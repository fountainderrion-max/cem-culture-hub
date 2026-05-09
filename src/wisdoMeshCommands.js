// WISDO Reporter Mesh / Cloud Execution command definitions
// Standalone module: import this into your Discord command registration layer.
// These definitions are dependency-light on purpose so Codex can wire them into discord.js, REST registration, or your custom command builder.

export const WISDO_NODE_TYPES = Object.freeze({
  PRIMARY_REPORTER: 'PRIMARY_REPORTER',
  LAPTOP_REPORTER: 'LAPTOP_REPORTER',
  VPS_REPORTER: 'VPS_REPORTER',
  MOBILE_CELLULAR_NODE: 'MOBILE_CELLULAR_NODE',
  MOBILE_CONTROLLER: 'MOBILE_CONTROLLER',
  COPY_FOLLOWER_NODE: 'COPY_FOLLOWER_NODE',
  COACH_VIEWER_NODE: 'COACH_VIEWER_NODE',
  BACKUP_REPORTER: 'BACKUP_REPORTER',
  SIGNAL_ONLY_NODE: 'SIGNAL_ONLY_NODE',
});

export const WISDO_ROUTE_TYPES = Object.freeze({
  LOCAL_REPORTER: 'LOCAL_REPORTER',
  VPS_REPORTER: 'VPS_REPORTER',
  CLOUD_MT4_NODE: 'CLOUD_MT4_NODE',
  BROKER_API: 'BROKER_API',
  FIX_API: 'FIX_API',
  MANUAL_ONLY: 'MANUAL_ONLY',
});

export const WISDO_PAIR_PREFIXES = Object.freeze({
  REPORTER: 'RPT',
  MOBILE: 'MOB',
  VPS: 'VPS',
  COPY: 'CPY',
  COACH: 'COA',
  BACKUP: 'BKP',
  CLOUD: 'CLD',
});

export const WISDO_ACCOUNT_STATUSES = Object.freeze({
  SIGNAL_READY: 'SIGNAL_READY',
  EXECUTION_READY: 'EXECUTION_READY',
  EXECUTION_MISSING: 'EXECUTION_MISSING',
  EXECUTION_STALE: 'EXECUTION_STALE',
  EXECUTION_DISABLED: 'EXECUTION_DISABLED',
});

export const WISDO_MESH_COMMANDS = [
  {
    name: 'mesh',
    description: 'Show the WISDO Reporter Mesh for your workspace.',
    options: [],
    handlerIntent: 'SHOW_MESH_OVERVIEW',
  },
  {
    name: 'mesh-add',
    description: 'Add a laptop, VPS, mobile, copy, coach, backup, or cloud node.',
    options: [
      { name: 'node_type', type: 'string', required: true, choices: Object.values(WISDO_NODE_TYPES) },
      { name: 'node_name', type: 'string', required: true },
      { name: 'account_scope', type: 'string', required: true, choices: ['EXISTING_ACCOUNT', 'NEW_ACCOUNT', 'NO_ACCOUNT_YET'] },
    ],
    handlerIntent: 'ADD_MESH_NODE',
  },
  {
    name: 'mesh-status',
    description: 'Show node health, account routing, execution readiness, and last heartbeat.',
    options: [
      { name: 'node_name', type: 'string', required: false },
      { name: 'account_login', type: 'string', required: false },
    ],
    handlerIntent: 'SHOW_MESH_STATUS',
  },
  {
    name: 'mesh-generate-code',
    description: 'Generate a pairing code for a selected mesh node.',
    options: [
      { name: 'node_type', type: 'string', required: true, choices: Object.values(WISDO_NODE_TYPES) },
      { name: 'node_name', type: 'string', required: true },
      { name: 'account_login', type: 'string', required: false },
    ],
    handlerIntent: 'GENERATE_NODE_PAIR_CODE',
  },
  {
    name: 'mesh-set-primary',
    description: 'Set a reporter node as the primary route for an account. Requires confirmation.',
    options: [
      { name: 'node_name', type: 'string', required: true },
      { name: 'account_login', type: 'string', required: true },
    ],
    dangerous: true,
    confirmationRequired: true,
    handlerIntent: 'SET_PRIMARY_NODE',
  },
  {
    name: 'mesh-remove',
    description: 'Remove or disable a mesh node. Requires confirmation.',
    options: [
      { name: 'node_name', type: 'string', required: true },
      { name: 'mode', type: 'string', required: true, choices: ['DISABLE', 'REMOVE'] },
    ],
    dangerous: true,
    confirmationRequired: true,
    handlerIntent: 'REMOVE_MESH_NODE',
  },
  {
    name: 'add-mobile-node',
    description: 'Add a Mobile Cellular Add-On node that can use the same or a different account.',
    options: [
      { name: 'account_mode', type: 'string', required: true, choices: ['SAME_ACCOUNT', 'DIFFERENT_ACCOUNT'] },
      { name: 'account_login', type: 'string', required: false },
      { name: 'server', type: 'string', required: false },
      { name: 'account_name', type: 'string', required: false },
    ],
    handlerIntent: 'ADD_MOBILE_CELLULAR_NODE',
  },
  {
    name: 'add-reporter-node',
    description: 'Add a laptop or VPS reporter node for a selected trading account.',
    options: [
      { name: 'node_type', type: 'string', required: true, choices: ['LAPTOP_REPORTER', 'VPS_REPORTER', 'BACKUP_REPORTER'] },
      { name: 'account_login', type: 'string', required: true },
      { name: 'node_name', type: 'string', required: true },
    ],
    handlerIntent: 'ADD_REPORTER_NODE',
  },
  {
    name: 'add-copy-node',
    description: 'Add a copy follower node for student/follower accounts.',
    options: [
      { name: 'account_login', type: 'string', required: true },
      { name: 'leader_account', type: 'string', required: false },
      { name: 'node_name', type: 'string', required: true },
    ],
    handlerIntent: 'ADD_COPY_FOLLOWER_NODE',
  },
  {
    name: 'my-nodes',
    description: 'List every node connected to your WISDO workspace.',
    options: [],
    handlerIntent: 'LIST_MY_NODES',
  },
  {
    name: 'node-status',
    description: 'Check a specific node status and permissions.',
    options: [{ name: 'node_name', type: 'string', required: true }],
    handlerIntent: 'SHOW_NODE_STATUS',
  },
  {
    name: 'remove-node',
    description: 'Remove a node from your workspace. Requires confirmation.',
    options: [{ name: 'node_name', type: 'string', required: true }],
    dangerous: true,
    confirmationRequired: true,
    handlerIntent: 'REMOVE_NODE',
  },
  {
    name: 'execution-route',
    description: 'Show or manage execution routes for an account.',
    options: [
      { name: 'action', type: 'string', required: true, choices: ['SHOW', 'ADD_LOCAL', 'ADD_VPS', 'ADD_CLOUD', 'DISABLE', 'SET_BACKUP'] },
      { name: 'account_login', type: 'string', required: true },
      { name: 'route_type', type: 'string', required: false, choices: Object.values(WISDO_ROUTE_TYPES) },
    ],
    handlerIntent: 'MANAGE_EXECUTION_ROUTE',
  },
  {
    name: 'take-signal',
    description: 'Take a Discord trade signal on a selected account after execution-route checks.',
    options: [
      { name: 'signal_id', type: 'string', required: true },
      { name: 'account_login', type: 'string', required: true },
      { name: 'risk_mode', type: 'string', required: false, choices: ['SAFE', 'FLOW', 'AGGRESSIVE', 'CUSTOM'] },
    ],
    confirmationRequired: true,
    handlerIntent: 'TAKE_SIGNAL_WITH_ROUTE_CHECK',
  },
  {
    name: 'queue-signal',
    description: 'Queue a signal until the selected account has an online execution route.',
    options: [
      { name: 'signal_id', type: 'string', required: true },
      { name: 'account_login', type: 'string', required: true },
      { name: 'expires_minutes', type: 'integer', required: false },
    ],
    handlerIntent: 'QUEUE_SIGNAL_UNTIL_ROUTE_ONLINE',
  },
  {
    name: 'cloud-route',
    description: 'Prepare a future Cloud MT4/Broker/FIX execution route for an account.',
    options: [
      { name: 'account_login', type: 'string', required: true },
      { name: 'route_type', type: 'string', required: true, choices: ['CLOUD_MT4_NODE', 'BROKER_API', 'FIX_API'] },
      { name: 'route_name', type: 'string', required: true },
    ],
    confirmationRequired: true,
    handlerIntent: 'ADD_CLOUD_OR_BROKER_ROUTE',
  },
];

export function generatePairCode(prefix) {
  const cleanPrefix = String(prefix || WISDO_PAIR_PREFIXES.REPORTER).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `${cleanPrefix}-${digits}`;
}

export function getPairPrefixForNodeType(nodeType) {
  switch (nodeType) {
    case WISDO_NODE_TYPES.MOBILE_CELLULAR_NODE:
    case WISDO_NODE_TYPES.MOBILE_CONTROLLER:
      return WISDO_PAIR_PREFIXES.MOBILE;
    case WISDO_NODE_TYPES.VPS_REPORTER:
      return WISDO_PAIR_PREFIXES.VPS;
    case WISDO_NODE_TYPES.COPY_FOLLOWER_NODE:
      return WISDO_PAIR_PREFIXES.COPY;
    case WISDO_NODE_TYPES.COACH_VIEWER_NODE:
      return WISDO_PAIR_PREFIXES.COACH;
    case WISDO_NODE_TYPES.BACKUP_REPORTER:
      return WISDO_PAIR_PREFIXES.BACKUP;
    default:
      return WISDO_PAIR_PREFIXES.REPORTER;
  }
}

export function canExecuteSignal({ selectedAccount, executionRoute, actorPermission }) {
  const failures = [];

  if (!selectedAccount) failures.push('NO_SELECTED_ACCOUNT');
  if (!executionRoute) failures.push('NO_EXECUTION_ROUTE');
  if (executionRoute && executionRoute.tradingAccountId !== selectedAccount?.id) failures.push('ROUTE_ACCOUNT_MISMATCH');
  if (executionRoute && executionRoute.status !== 'ONLINE') failures.push('EXECUTION_ROUTE_NOT_ONLINE');
  if (executionRoute && executionRoute.canExecute !== true) failures.push('EXECUTION_DISABLED');
  if (!['OWNER', 'EXECUTOR', 'CONTROLLER'].includes(actorPermission)) failures.push('INSUFFICIENT_PERMISSION');

  return {
    allowed: failures.length === 0,
    failures,
  };
}

export function buildExecutionMissingMessage(accountLabel) {
  return [
    `This account can receive signals, but cannot execute trades yet.`,
    `Account: ${accountLabel || 'Selected Account'}`,
    `Connect a reporter, VPS node, or Cloud Execution Bridge before taking the trade.`,
  ].join('\n');
}

export default WISDO_MESH_COMMANDS;
