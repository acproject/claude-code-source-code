const noop = () => {}
const noopAsync = async () => {}
const returnFalse = () => false
const returnUndefined = () => undefined
const returnEmptyArray = () => []
const passthrough = <T>(value: T) => value

export class SandboxViolationStore {}

export const SandboxRuntimeConfigSchema = {
  parse: passthrough,
  safeParse: (value: unknown) => ({ success: true, data: value }),
}

export const SandboxManager = {
  checkDependencies: async () => [],
  isSupportedPlatform: returnFalse,
  wrapWithSandbox: async (command: string) => command,
  initialize: noopAsync,
  updateConfig: noop,
  reset: noopAsync,
  getFsReadConfig: returnUndefined,
  getFsWriteConfig: returnUndefined,
  getNetworkRestrictionConfig: returnUndefined,
  getIgnoreViolations: returnUndefined,
  getAllowUnixSockets: returnFalse,
  getAllowLocalBinding: returnFalse,
  getEnableWeakerNestedSandbox: returnFalse,
  getProxyPort: returnUndefined,
  getSocksProxyPort: returnUndefined,
  getLinuxHttpSocketPath: returnUndefined,
  getLinuxSocksSocketPath: returnUndefined,
  waitForNetworkInitialization: noopAsync,
  getSandboxViolationStore: () => new SandboxViolationStore(),
  annotateStderrWithSandboxFailures: (_command: string, stderr: string) => stderr,
  cleanupAfterCommand: noop,
  getLinuxGlobPatternWarnings: returnEmptyArray,
}
