import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AppConfig } from './types';

class ConfigService {
  private config!: AppConfig;
  private validationErrors: string[] = [];
  private isValid: boolean = false;

  /**
   * Initialize config service with JSON config
   */
  async initialize(configJson: any): Promise<void> {
    try {
      // Transform plain JSON to class instance with proper options
      this.config = plainToClass(AppConfig, configJson, {
        enableImplicitConversion: true,
        exposeDefaultValues: true,
        excludeExtraneousValues: false,
      });
      
      // Validate the config with nested validation enabled
      const errors = await validate(this.config, {
        whitelist: true,
        forbidNonWhitelisted: false,
        validationError: { target: false, value: false },
        skipMissingProperties: false,
        forbidUnknownValues: false,
      });

      if (errors.length > 0) {
        this.isValid = false;
        this.validationErrors = this.formatValidationErrors(errors);
        console.error('❌ Configuration validation failed:', this.validationErrors);
        throw new Error('Configuration validation failed');
      }

      this.isValid = true;
      this.validationErrors = [];
      console.log('✅ Configuration loaded and validated successfully');
    } catch (error) {
      this.isValid = false;
      if (error instanceof Error && error.message === 'Configuration validation failed') {
        throw error;
      }
      this.validationErrors = ['Unknown validation error'];
      console.error('❌ Configuration validation failed:', error);
      throw new Error('Configuration validation failed');
    }
  }

  /**
   * Format validation errors into readable strings
   */
  private formatValidationErrors(errors: ValidationError[], parentPath: string = ''): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints) {
        for (const constraint of Object.values(error.constraints)) {
          messages.push(`${propertyPath}: ${constraint}`);
        }
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.formatValidationErrors(error.children, propertyPath));
      }
    }

    return messages;
  }

  /**
   * Check if configuration is valid
   */
  isConfigValid(): boolean {
    return this.isValid;
  }

  /**
   * Get validation errors
   */
  getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Get full configuration
   */
  getConfig(): AppConfig {
    if (!this.isValid) {
      throw new Error('Cannot access invalid configuration. Check validation errors first.');
    }
    return this.config;
  }

  /**
   * Get rules management configuration
   */
  getRulesManagement() {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config['rules-management'];
  }

  /**
   * Get algo manager configuration
   */
  getAlgoManager() {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config['algo-manager'];
  }

  /**
   * Get map viewer configuration
   */
  getMapViewer() {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config['map-viewer'];
  }

  /**
   * Get map viewer iframe URL
   */
  getMapViewerIframeUrl(): string {
    if (!this.config) {
      return 'about:blank';
    }
    return this.config['map-viewer'].iframeUrl;
  }

  /**
   * Get roberto configuration
   */
  getRoberto() {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config.roberto;
  }

  /**
   * Get WKT points limit
   */
  getWKTPointsLimit(): number {
    if (!this.config) {
      return 10000; // Default fallback
    }
    return this.config['rules-management'].general.wktPointsLimit;
  }

  /**
   * Get priority range
   */
  getPriorityRange(): { min: number; max: number } {
    if (!this.config) {
      return { min: 2, max: 10 }; // Default fallback
    }
    const general = this.config['rules-management'].general;
    return { min: general.minPriority, max: general.maxPriority };
  }

  /**
   * Get available color types
   */
  getColorTypes(): string[] {
    if (!this.config) {
      return [];
    }
    return this.config['rules-management'].general.colorTypes || [];
  }

  /**
   * Get available sensor types
   */
  getSensorTypes(): string[] {
    if (!this.config) {
      return [];
    }
    return this.config['rules-management'].general.sensorTypes || [];
  }

  /**
   * Build full URL for a route
   */
  buildUrl(section: 'rules-management' | 'algo-manager' | 'roberto', route: string): string {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    
    let baseUrl: string;
    let routePath: string;

    switch (section) {
      case 'rules-management':
        baseUrl = this.config['rules-management'].endpoint;
        routePath = (this.config['rules-management'] as any)[route]?.route || '';
        break;
      case 'algo-manager':
        baseUrl = this.config['algo-manager'].endpoint;
        routePath = (this.config['algo-manager'].approvals as any)[route]?.route || '';
        break;
      case 'roberto':
        baseUrl = this.config.roberto.endpoint;
        routePath = (this.config.roberto as any)[route]?.route || '';
        break;
      default:
        throw new Error(`Unknown section: ${section}`);
    }

    // Combine base URL and route
    const url = new URL(routePath, baseUrl);
    return url.toString();
  }

  /**
   * Get timeout for a specific route
   */
  getTimeout(section: 'rules-management' | 'algo-manager' | 'roberto', route: string): number {
    if (!this.config) {
      return 5000; // Default timeout
    }
    
    switch (section) {
      case 'rules-management':
        return (this.config['rules-management'] as any)[route]?.timeout || 5000;
      case 'algo-manager':
        return (this.config['algo-manager'].approvals as any)[route]?.timeout || 5000;
      case 'roberto':
        return (this.config.roberto as any)[route]?.timeout || 5000;
      default:
        return 5000;
    }
  }
}

// Singleton instance
export const configService = new ConfigService();