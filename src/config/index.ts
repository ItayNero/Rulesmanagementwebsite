/**
 * Configuration Module Entry Point
 * 
 * Export the configuration service and types for use throughout the application
 */

export { configService } from './configService';
export type { 
  AppConfig, 
  RulesManagementConfig, 
  AlgoManagerConfig, 
  MapViewerConfig,
  RobertoConfig,
  RouteConfig 
} from './types';
