import { loadConfig } from './infrastructure/config/index.js'
import { DIContainer } from './infrastructure/di/index.js'

export const VERSION = '1.0.0'

async function main(): Promise<void> {
  let container: DIContainer | null = null

  try {
    const config = loadConfig()
    container = new DIContainer(config)
    const controller = container.createCLIController()

    await controller.run(process.argv)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    process.stderr.write(`Error: ${message}\n`)
    process.exitCode = 1
  } finally {
    if (container) {
      container.close()
    }
  }
}

main()
