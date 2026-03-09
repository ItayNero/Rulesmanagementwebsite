import { 
  IsString, 
  IsNumber, 
  IsArray, 
  IsInt, 
  Min, 
  ValidateNested, 
  Matches 
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Route Configuration
 */
export class RouteConfig {
  @IsString()
  route!: string;

  @IsNumber()
  @IsInt()
  @Min(1000)
  timeout!: number;
}

/**
 * General Rules Management Configuration
 */
export class GeneralConfig {
  @IsNumber()
  @IsInt()
  @Min(1)
  wktPointsLimit!: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  minPriority!: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  maxPriority!: number;

  @IsArray()
  @IsString({ each: true })
  colorTypes!: string[];

  @IsArray()
  @IsString({ each: true })
  sensorTypes!: string[];
}

/**
 * Rules Management Configuration
 */
export class RulesManagementConfig {
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'endpoint must be a valid URL' })
  endpoint!: string;

  @ValidateNested()
  @Type(() => GeneralConfig)
  general!: GeneralConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'get-all'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'get-by-id'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  create!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  update!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  delete!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  search!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'toggle-active'!: RouteConfig;
}

/**
 * Algo Manager Approvals Configuration
 */
export class AlgoManagerApprovalsConfig {
  @ValidateNested()
  @Type(() => RouteConfig)
  'get-all-requests'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'get-request-by-id'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'create-request'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'approve-request'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'reject-request'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'get-profile-algorithm'!: RouteConfig;
}

/**
 * Algo Manager Configuration
 */
export class AlgoManagerConfig {
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'endpoint must be a valid URL' })
  endpoint!: string;

  @ValidateNested()
  @Type(() => AlgoManagerApprovalsConfig)
  approvals!: AlgoManagerApprovalsConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'sqrule-get-all'!: RouteConfig;

  @ValidateNested()
  @Type(() => RouteConfig)
  'det-get-all'!: RouteConfig;
}

/**
 * Map Viewer Configuration
 */
export class MapViewerConfig {
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'iframeUrl must be a valid URL' })
  iframeUrl!: string;
}

/**
 * Roberto Configuration
 */
export class RobertoConfig {
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'endpoint must be a valid URL' })
  endpoint!: string;

  @ValidateNested()
  @Type(() => RouteConfig)
  'get-sensor-groups'!: RouteConfig;
}

/**
 * Application Configuration
 */
export class AppConfig {
  @ValidateNested()
  @Type(() => RulesManagementConfig)
  'rules-management'!: RulesManagementConfig;

  @ValidateNested()
  @Type(() => AlgoManagerConfig)
  'algo-manager'!: AlgoManagerConfig;

  @ValidateNested()
  @Type(() => MapViewerConfig)
  'map-viewer'!: MapViewerConfig;

  @ValidateNested()
  @Type(() => RobertoConfig)
  roberto!: RobertoConfig;
}