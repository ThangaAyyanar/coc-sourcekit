import {
  TransportKind,
  ExtensionContext,
  LanguageClient,
  ServerOptions,
  workspace,
  services,
  LanguageClientOptions
} from 'coc.nvim'

interface SourceKitConfig {
  enable: boolean
  commandPath: string
  iOSsdkPath: string
  targetArch: string
  indexPathDB: string
  indexStorePath: string
}

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration().get('sourcekit', {}) as SourceKitConfig
  if (config.enable === false) {
    return
  }

  let commandPath = config.commandPath
  if (!commandPath) {
    try {
      commandPath = (await workspace.runCommand('xcrun --toolchain swift --find sourcekit-lsp')).trim()
    } catch {
      workspace.showMessage("Cannot find sourcekit-lsp. Install a Swift toolchain or set `sourcekit.commandPath` in your coc-config.")
      return
    }
  }

  let args: string[] = [];
  let iOSsdkPath = config.iOSsdkPath
  if (!iOSsdkPath) {
      try {
          iOSsdkPath = (await workspace.runCommand('xcrun --sdk iphonesimulator --show-sdk-path')).trim()
          args = args.concat(['-Xswiftc', '-sdk', '-Xswiftc', iOSsdkPath])
      } catch {
          workspace.showMessage("Cannot find SDK path. set `sourcekit.iOSsdkPath` in your coc-config.")
      }
  }else{
      args = args.concat(['-Xswiftc', '-sdk', '-Xswiftc', iOSsdkPath])
  }

  let targetArch = config.targetArch
  if (targetArch) {
      args = args.concat(['-Xswiftc', '-target', '-Xswiftc', targetArch])
  }

  let indexPathDB = config.indexPathDB
  if (indexPathDB) {
      args = args.concat(['-index-db-path',indexPathDB])
  }

  let indexStorePath= config.indexStorePath
  if (indexStorePath) {
      args = args.concat(['-index-store-path',indexStorePath])
  }

  const serverOptions: ServerOptions = {
    command: commandPath,
    args: args,
    transport: TransportKind.stdio
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: ['swift']
  }

  const client = new LanguageClient('sourcekit', 'sourcekit', serverOptions, clientOptions)

  context.subscriptions.push(
    services.registLanguageClient(client),
  )
}
