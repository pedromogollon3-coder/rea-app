/** Motor de REA APP: ingeniería inversa de aplicaciones web con evidencia. */
export * from './types.js';
export { Session } from './session.js';
export { LiveApp, resolveSession, syncIfLive, type ViewInfo } from './live.js';
export { act, guard, isRecording, mergeEvents, startRecording, stopRecording, type Flow, type FlowStep } from './flow.js';
export { domMap } from './dom.js';
export { scriptsAnalysis } from './scripts.js';
export { networkAnalysis } from './network.js';
export { storageAnalysis } from './storage.js';
export { stackAnalysis } from './stack.js';
export { authAnalysis, realtimeAnalysis, routesAnalysis, runtimeAnalysis, stateAnalysis } from './appmap.js';
export { buildReport } from './report.js';
export { classifyFrame } from './wsproto.js';
export { BrowserMissingError } from './browser.js';
export { PolicyError, ETHICS_NOTICE, robotsAllows, assertAllowedUrl, RateLimiter } from './policy.js';
export { redactText, redactCode, redactHtml, redactUrl, redactHeaders, redactHar, classifyValue, maskDigits, privatizeUrl } from './redact.js';
export { inferSchema, mergeSchemas, schemaToText } from './schema.js';
export { runSetup } from './setup.js';
