import { configService } from './configService';
import configJson from './config.json';

let configInitialized = false;

/**
 * Load and validate configuration
 * This should be called once at app startup
 */
export async function loadConfig(): Promise<void> {
  if (configInitialized) {
    return;
  }

  try {
    await configService.initialize(configJson);

    if (!configService.isConfigValid()) {
      const errors = configService.getValidationErrors();
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Invalid configuration. Check console for details.');
    }

    console.log('✅ Configuration loaded and validated successfully');
    configInitialized = true;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
}

/**
 * Check if config is loaded
 */
export function isConfigLoaded(): boolean {
  return configInitialized;
}
