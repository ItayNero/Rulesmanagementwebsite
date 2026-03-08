# Configuration System

This directory contains the centralized configuration system for the Rules Management application.

## Overview

The configuration system provides a type-safe, validated way to manage application settings across all modules including rules-management, algo-manager, map-viewer, and roberto.

## Files

- **config.json** - The main configuration file containing all application settings
- **types.ts** - TypeScript type definitions for the configuration
- **configService.ts** - Configuration service with validation logic
- **index.ts** - Export file for easy imports

## Configuration Structure

### 1. rules-management
Handles all rule-related operations and validations.

```json
{
  "create-rule": { "route": "/api/rules/create", "timeout": 10000 },
  "update-rule": { "route": "/api/rules/update", "timeout": 10000 },
  "delete-rule": { "route": "/api/rules/delete", "timeout": 5000 },
  "get-rule-info": { "route": "/api/rules/info", "timeout": 8000 },
  "general": {
    "wktPointsLimit": 1000,
    "minPriority": 2,
    "maxPriority": 10,
    "colorTypes": ["RGB", "Grayscale", ...],
    "sensorTypes": ["Optical", "Radar", ...]
  }
}
```

### 2. algo-manager
Manages approvals and authentication.

```json
{
  "approvals": {
    "create": { "route": "/api/approvals/create", "timeout": 10000 },
    "approve": { "route": "/api/approvals/approve", "timeout": 8000 },
    "reject": { "route": "/api/approvals/reject", "timeout": 8000 },
    "getAll": { "route": "/api/approvals/getAll", "timeout": 15000 }
  },
  "authentication": {
    "validate": { "route": "/api/auth/validate", "timeout": 5000 },
    "createUser": { "route": "/api/auth/createUser", "timeout": 8000 }
  }
}
```

### 3. map-viewer
Configuration for the map viewer iframe.

```json
{
  "iframeUrl": "https://maps.example.com/viewer"
}
```

### 4. roberto
Configuration for model and sensor group information.

```json
{
  "models-info": {
    "route": "/api/roberto/models-info",
    "timeout": 12000
  }
}
```

## Usage

### Importing the Configuration Service

```typescript
import { configService } from '@/config';
```

### Getting Configuration Values

```typescript
// Get full configuration
const config = configService.getConfig();

// Get specific sections
const rulesConfig = configService.getRulesManagement();
const algoConfig = configService.getAlgoManager();
const mapViewerConfig = configService.getMapViewer();
const robertoConfig = configService.getRoberto();

// Get specific values
const wktLimit = configService.getWKTPointsLimit(); // 1000
const { min, max } = configService.getPriorityRange(); // { min: 2, max: 10 }
const colorTypes = configService.getColorTypes(); // ["RGB", "Grayscale", ...]
const sensorTypes = configService.getSensorTypes(); // ["Optical", "Radar", ...]
const mapUrl = configService.getMapViewerUrl(); // "https://maps.example.com/viewer"
```

### Using in Components

```typescript
import { configService } from '@/config';

function MyComponent() {
  const config = configService.getRulesManagement();
  const maxPoints = config.general.wktPointsLimit;
  
  // Use in validation
  if (points > maxPoints) {
    throw new Error(`Exceeded maximum points: ${maxPoints}`);
  }
}
```

## Validation

The configuration service automatically validates all settings on initialization:

- ✅ Route paths must start with '/'
- ✅ Timeouts must be positive numbers ≤ 60000ms
- ✅ WKT points limit must be positive
- ✅ Priority ranges must be valid (min ≥ 1, max ≤ 100, min ≤ max)
- ✅ Color types and sensor types must be non-empty arrays
- ✅ Map viewer URL must be a valid URL

If validation fails, the service will throw an error with details about what's wrong.

## Modifying Configuration

To change settings:

1. Edit `/src/config/config.json`
2. The changes will be validated automatically on next app load
3. TypeScript will ensure type safety
4. Invalid configurations will be rejected with clear error messages

## Example: Changing WKT Points Limit

```json
{
  "rules-management": {
    "general": {
      "wktPointsLimit": 2000,  // Changed from 1000 to 2000
      ...
    }
  }
}
```

## Example: Adding New Sensor Types

```json
{
  "rules-management": {
    "general": {
      "sensorTypes": [
        "Optical",
        "Radar",
        "SAR",
        "LiDAR",
        "Thermal",
        "Hyperspectral",
        "NewSensorType"  // Add new sensor type here
      ]
    }
  }
}
```

## Example: Changing API Routes

```json
{
  "rules-management": {
    "create-rule": {
      "route": "/api/v2/rules/create",  // Changed API version
      "timeout": 15000  // Increased timeout
    }
  }
}
```

## Error Handling

If configuration validation fails, you'll see errors in the console:

```
Configuration validation errors: [
  "rules-management.general.wktPointsLimit must be a positive number",
  "map-viewer.iframeUrl must be a valid URL"
]
```

Fix the issues in `config.json` and restart the application.
