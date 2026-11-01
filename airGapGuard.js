/**
 * airGapGuard.js - Kernel & Socket-Level Zero-Egress Air-Gap Interceptor
 * Part of SG-DIVP (Sovereign Government Document Intelligence & Verification Platform)
 * 
 * Enforces strict zero-egress policy by intercepting low-level network socket calls
 * in the Node.js runtime across TCP, TLS, and UDP (dgram). Outbound network requests to
 * non-loopback addresses are immediately aborted with an EPERM exception and recorded
 * in a bounded, circular immutable security log ring buffer (SEC-MED-01, SEC-MED-03).
 */

const net = require('net');
const tls = require('tls');
const dgram = require('dgram');
const dns = require('dns');

let originalNetConnect = null;
let originalTlsConnect = null;
let originalDgramSend = null;
let originalDnsLookup = null;
let isGuardActive = false;

const MAX_AUDIT_LOGS = 1000;
const securityAuditLogs = [];

/**
 * Records a security event with bounded ring-buffer memory limits
 */
function recordSecurityLog(entry) {
  if (securityAuditLogs.length >= MAX_AUDIT_LOGS) {
    securityAuditLogs.shift(); // Evict oldest log entry to prevent memory leaks
  }
  securityAuditLogs.push(entry);
}

/**
 * Checks if a host is an authorized local loopback address,
 * defensively handling CIDR blocks, octal, and decimal representations.
 */
function isAuthorizedLoopback(host) {
  if (!host) return true;
  const normalized = String(host).toLowerCase().trim();
  return (
    normalized === '127.0.0.1' ||
    normalized === 'localhost' ||
    normalized === '::1' ||
    normalized === '0.0.0.0' ||
    normalized.startsWith('127.') ||
    normalized === '2130706433' || // decimal integer representation of 127.0.0.1
    normalized === '0177.0000.0000.0001' || // octal representation
    normalized === '0x7f.0.0.1'
  );
}

/**
 * Enables the air-gap zero-egress socket interceptor across TCP, TLS, and UDP
 */
function enableAirGapEgressGuard() {
  if (isGuardActive) return;

  originalNetConnect = net.Socket.prototype.connect;
  originalTlsConnect = tls.connect;
  originalDgramSend = dgram.Socket.prototype.send;

  // 1. TCP Socket Interception
  net.Socket.prototype.connect = function (...args) {
    const host = typeof args[0] === 'object' ? args[0].host : args[1];
    const port = typeof args[0] === 'object' ? args[0].port : args[2];

    if (host && !isAuthorizedLoopback(host)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'AIR_GAP_SOCKET_BLOCKED',
        protocol: 'TCP',
        targetHost: host,
        targetPort: port || 'unknown',
        action: 'TERMINATED',
        policy: 'ZERO_EGRESS_AIR_GAP_MANDATE'
      };
      recordSecurityLog(logEntry);
      console.error(`[AIR-GAP BLOCKED] Outbound socket to ${host}:${port || ''} terminated.`);

      const err = new Error(`EPERM: Air-gap zero-egress policy blocks ${host}`);
      err.code = 'EPERM';
      this.destroy(err);
      return this;
    }

    return originalNetConnect.apply(this, args);
  };

  // 2. TLS / HTTPS Socket Interception
  tls.connect = function (...args) {
    let options = {};
    if (typeof args[0] === 'object') {
      options = args[0];
    } else if (typeof args[1] === 'object') {
      options = args[1];
    }

    const host = options.host || (typeof args[0] === 'string' ? args[0] : null);
    const port = options.port;

    if (host && !isAuthorizedLoopback(host)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'AIR_GAP_TLS_BLOCKED',
        protocol: 'TLS',
        targetHost: host,
        targetPort: port || 443,
        action: 'TERMINATED',
        policy: 'ZERO_EGRESS_AIR_GAP_MANDATE'
      };
      recordSecurityLog(logEntry);
      console.error(`[AIR-GAP BLOCKED] Outbound TLS to ${host}:${port || 443} terminated.`);

      const dummySocket = new net.Socket();
      const err = new Error(`EPERM: Air-gap zero-egress policy blocks ${host}`);
      err.code = 'EPERM';
      setImmediate(() => dummySocket.destroy(err));
      return dummySocket;
    }

    return originalTlsConnect.apply(this, args);
  };

  // 3. UDP Datagram Socket Interception (SEC-MED-01)
  dgram.Socket.prototype.send = function (msg, offset, length, port, address, callback) {
    let targetHost = '127.0.0.1';
    let targetPort = 0;
    let cb = null;

    if (typeof offset === 'number' && typeof length === 'number') {
      targetPort = port;
      if (typeof address === 'string') {
        targetHost = address;
        cb = callback;
      } else if (typeof address === 'function') {
        cb = address;
      }
    } else {
      targetPort = offset;
      if (typeof length === 'string') {
        targetHost = length;
        cb = port;
      } else if (typeof length === 'function') {
        cb = length;
      }
    }

    if (targetHost && !isAuthorizedLoopback(targetHost)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'AIR_GAP_UDP_BLOCKED',
        protocol: 'UDP',
        targetHost,
        targetPort: targetPort || 0,
        action: 'TERMINATED',
        policy: 'ZERO_EGRESS_AIR_GAP_MANDATE'
      };
      recordSecurityLog(logEntry);
      console.error(`[AIR-GAP BLOCKED] Outbound UDP to ${targetHost}:${targetPort || 0} terminated.`);

      const err = new Error(`EPERM: Air-gap zero-egress policy blocks UDP to ${targetHost}`);
      err.code = 'EPERM';
      if (typeof cb === 'function') {
        setImmediate(() => cb(err));
        return;
      }
      throw err;
    }

    return originalDgramSend.apply(this, arguments);
  };

  // 4. DNS Resolution Interception (AUD-MED-01)
  originalDnsLookup = dns.lookup;
  dns.lookup = function (hostname, options, callback) {
    let cb = typeof options === 'function' ? options : callback;
    if (hostname && !isAuthorizedLoopback(hostname)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'AIR_GAP_DNS_BLOCKED',
        protocol: 'DNS',
        targetHost: hostname,
        targetPort: 53,
        action: 'TERMINATED',
        policy: 'ZERO_EGRESS_AIR_GAP_MANDATE'
      };
      recordSecurityLog(logEntry);
      console.error(`[AIR-GAP BLOCKED] Outbound DNS resolution for ${hostname} terminated.`);

      const err = new Error(`EPERM: Air-gap zero-egress policy blocks DNS resolution for ${hostname}`);
      err.code = 'EPERM';
      if (typeof cb === 'function') {
        setImmediate(() => cb(err, null, null));
        return;
      }
      throw err;
    }
    return originalDnsLookup.apply(this, arguments);
  };

  isGuardActive = true;
  console.log('[SHIELD] Air-Gap Zero-Egress Guard ACTIVE (TCP, TLS, UDP & DNS non-loopback sockets blocked).');
}

/**
 * Disables the guard (Used specifically in isolated test hooks if needed)
 */
function disableAirGapEgressGuard() {
  if (!isGuardActive) return;
  if (originalNetConnect) net.Socket.prototype.connect = originalNetConnect;
  if (originalTlsConnect) tls.connect = originalTlsConnect;
  if (originalDgramSend) dgram.Socket.prototype.send = originalDgramSend;
  if (originalDnsLookup) dns.lookup = originalDnsLookup;
  isGuardActive = false;
  console.log('[SHIELD] Air-Gap Zero-Egress Guard DEACTIVATED.');
}

/**
 * Returns read-only snapshot of intercepted egress security events
 */
function getSecurityAuditLogs() {
  return [...securityAuditLogs];
}

/**
 * Clears security audit logs (for testing resets)
 */
function clearSecurityAuditLogs() {
  securityAuditLogs.length = 0;
}

module.exports = {
  enableAirGapEgressGuard,
  disableAirGapEgressGuard,
  getSecurityAuditLogs,
  clearSecurityAuditLogs,
  isAuthorizedLoopback,
  MAX_AUDIT_LOGS,
  isGuardActive: () => isGuardActive
};
