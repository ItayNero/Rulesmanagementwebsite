import { useState, useEffect } from 'react';
import { Rule } from '../../types/rule';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Upload, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { MultiSelect } from './ui/multi-select';
import { rulesApi } from '../../services/api';
import shp from 'shpjs';
import JSZip from 'jszip';
import { configService } from '../../config/configService';

interface RuleFormProps {
  initialRule?: Rule;
  onSubmit: (rule: Rule) => void;
  onCancel: () => void;
  isEdit?: boolean;
  currentUsername?: string;
}

export function RuleForm({ initialRule, onSubmit, onCancel, isEdit, currentUsername }: RuleFormProps) {
  const [formData, setFormData] = useState<Rule>(
    initialRule || {
      rule_name: '',
      algorithm_name: '',
      priority: 4,
      is_active: true,
      username: currentUsername || '' // Auto-set username for new rules
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileAlgorithmMapping, setProfileAlgorithmMapping] = useState<Record<string, string>>({});
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  // Multi-select options from config
  const [availableColorTypes] = useState<string[]>(configService.getColorTypes());
  const [availableSensorTypes] = useState<string[]>(configService.getSensorTypes());
  
  // Sensor groups state (loaded dynamically based on model)
  const [availableSensorGroups, setAvailableSensorGroups] = useState<string[]>([]);
  const [loadingSensorGroups, setLoadingSensorGroups] = useState(false);

  useEffect(() => {
    const loadMappingData = async () => {
      try {
        const [mapping, profiles] = await Promise.all([
          rulesApi.getProfileAlgorithmMapping(),
          rulesApi.getProfiles()
        ]);
        setProfileAlgorithmMapping(mapping);
        setAvailableProfiles(profiles);
      } catch (error) {
        console.error('Failed to load profile-algorithm mapping:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMappingData();
  }, []);

  // Auto-set username for new rules when currentUsername is provided
  useEffect(() => {
    if (!isEdit && currentUsername && !formData.username) {
      setFormData(prev => ({ ...prev, username: currentUsername }));
    }
  }, [currentUsername, isEdit, formData.username]);

  const handleChange = (field: keyof Rule, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProfileChange = (profileName: string) => {
    // Auto-set algorithm based on profile selection
    const algorithmName = profileAlgorithmMapping[profileName] || '';
    setFormData(prev => ({ 
      ...prev, 
      profile_name: profileName,
      algorithm_name: algorithmName
    }));
    
    // Clear errors for both fields
    if (errors.profile_name) {
      setErrors(prev => ({ ...prev, profile_name: '' }));
    }
    if (errors.algorithm_name) {
      setErrors(prev => ({ ...prev, algorithm_name: '' }));
    }

    // Load sensor groups for the selected profile
    setLoadingSensorGroups(true);
    rulesApi.getSensorGroupsByModel(profileName)
      .then(groupsMap => {
        // Extract group names from the returned map
        const groupNames = Object.keys(groupsMap);
        setAvailableSensorGroups(groupNames);
        setLoadingSensorGroups(false);
      })
      .catch(error => {
        console.error('Failed to load sensor groups:', error);
        setLoadingSensorGroups(false);
      });
  };

  const validateWKT = (wkt: string): { isValid: boolean; error?: string } => {
    const trimmedWKT = wkt.trim().toUpperCase();
    const config = configService.getRulesManagement();
    const maxPoints = config.general.wktPointsLimit;
    
    // Check if it starts with POLYGON or MULTIPOLYGON
    if (!trimmedWKT.startsWith('POLYGON') && !trimmedWKT.startsWith('MULTIPOLYGON')) {
      return { 
        isValid: false, 
        error: 'Location WKT must be a POLYGON or MULTIPOLYGON' 
      };
    }

    // Count coordinate pairs (points)
    // Match all number pairs like "123.45 67.89" or "123 67"
    const coordinatePairs = wkt.match(/[-+]?\d+(?:\.\d+)?\s+[-+]?\d+(?:\.\d+)?/g);
    
    if (!coordinatePairs || coordinatePairs.length === 0) {
      return { 
        isValid: false, 
        error: 'No valid coordinate points found in WKT' 
      };
    }

    if (coordinatePairs.length > maxPoints) {
      return { 
        isValid: false, 
        error: `WKT contains ${coordinatePairs.length} points. Maximum allowed is ${maxPoints} points` 
      };
    }

    // For POLYGON, need at least 3 points (4 including closing point)
    if (trimmedWKT.startsWith('POLYGON') && coordinatePairs.length < 3) {
      return { 
        isValid: false, 
        error: 'POLYGON must contain at least 3 coordinate points' 
      };
    }

    // Basic format validation
    const polygonRegex = /^POLYGON\s*\(\s*\([\s\S]+\)\s*\)$/i;
    const multiPolygonRegex = /^MULTIPOLYGON\s*\(\s*\(\s*\([\s\S]+\)\s*\)\s*\)$/i;
    
    const isValidFormat = polygonRegex.test(wkt) || multiPolygonRegex.test(wkt);
    
    if (!isValidFormat) {
      return { 
        isValid: false, 
        error: 'Invalid WKT format. Expected POLYGON((x1 y1, x2 y2, ...)) or MULTIPOLYGON(((x1 y1, x2 y2, ...)))' 
      };
    }

    return { isValid: true };
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const config = configService.getRulesManagement();
    const { minPriority, maxPriority } = config.general;

    if (!formData.rule_name.trim()) {
      newErrors.rule_name = 'Rule name is required';
    }

    if (!formData.hebrew_rule_name?.trim()) {
      newErrors.hebrew_rule_name = 'Hebrew rule name is required';
    }

    if (!formData.algorithm_name.trim()) {
      newErrors.algorithm_name = 'Algorithm name is required';
    }

    if (formData.priority < minPriority || formData.priority > maxPriority) {
      newErrors.priority = `Priority must be between ${minPriority} and ${maxPriority}`;
    }

    if (!formData.profile_name?.trim()) {
      newErrors.profile_name = 'Model name is required';
    }

    if (!formData.customer?.trim()) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.location_wkt?.trim()) {
      newErrors.location_wkt = 'Location WKT is required';
    } else {
      // Validate WKT format and point count
      const wktValidation = validateWKT(formData.location_wkt);
      if (!wktValidation.isValid) {
        newErrors.location_wkt = wktValidation.error || 'Invalid WKT format';
      }
    }

    if (formData.minimum_resolution !== undefined && formData.minimum_resolution < 0) {
      newErrors.minimum_resolution = 'Minimum resolution must be 0 or higher';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const convertGeometryToWKT = (geometry: any): string => {
    const type = geometry.type;
    const coords = geometry.coordinates;

    if (type === 'Polygon') {
      const rings = coords.map((ring: number[][]) => 
        '(' + ring.map((point: number[]) => `${point[0]} ${point[1]}`).join(', ') + ')'
      ).join(', ');
      return `POLYGON(${rings})`;
    } else if (type === 'MultiPolygon') {
      const polygons = coords.map((polygon: number[][][]) => {
        const rings = polygon.map((ring: number[][]) => 
          '(' + ring.map((point: number[]) => `${point[0]} ${point[1]}`).join(', ') + ')'
        ).join(', ');
        return `(${rings})`;
      }).join(', ');
      return `MULTIPOLYGON(${polygons})`;
    }
    
    throw new Error(`Unsupported geometry type: ${type}. Only POLYGON and MULTIPOLYGON are allowed.`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous status
    setUploadStatus(null);
    if (errors.location_wkt) {
      setErrors(prev => ({ ...prev, location_wkt: '' }));
    }

    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // shpjs can handle both .zip files and .shp files directly
      // For .zip files, it will extract and parse all components internally
      const geojson: any = await shp(arrayBuffer);
      
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        setErrors(prev => ({ ...prev, location_wkt: 'No features found in shapefile' }));
        setUploadStatus({ success: false, message: 'No features found in shapefile' });
        return;
      }

      const firstFeature = geojson.features[0];
      const geometryType = firstFeature.geometry.type;

      // Validate geometry type
      if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
        const errorMsg = `Invalid geometry type: ${geometryType}. Only POLYGON and MULTIPOLYGON are supported.`;
        setErrors(prev => ({ ...prev, location_wkt: errorMsg }));
        setUploadStatus({ success: false, message: errorMsg });
        return;
      }

      // Convert to WKT
      const wkt = convertGeometryToWKT(firstFeature.geometry);

      // Validate the generated WKT (including point count)
      const wktValidation = validateWKT(wkt);
      if (!wktValidation.isValid) {
        setErrors(prev => ({ ...prev, location_wkt: wktValidation.error || 'Invalid WKT' }));
        setUploadStatus({ success: false, message: wktValidation.error || 'Invalid WKT' });
        return;
      }

      // Success - set the WKT value
      handleChange('location_wkt', wkt);
      setUploadStatus({ 
        success: true, 
        message: `Shapefile uploaded successfully! (${geometryType} with ${geojson.features.length} feature(s))` 
      });
    } catch (error: any) {
      console.error('Shapefile upload error:', error);
      let errorMsg = 'Failed to parse shapefile.';
      
      if (error.message && error.message.includes('unzip')) {
        errorMsg = 'Failed to parse shapefile. Please upload a complete ZIP file containing all shapefile components (.shp, .dbf, .shx, .prj).';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrors(prev => ({ ...prev, location_wkt: errorMsg }));
      setUploadStatus({ success: false, message: errorMsg });
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">{/* Changed from max-w-2xl to w-full */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rule_name" className={errors.rule_name ? 'text-red-500' : ''}>
            Rule Name *
          </Label>
          <Input
            id="rule_name"
            value={formData.rule_name}
            onChange={(e) => handleChange('rule_name', e.target.value)}
            disabled={isEdit}
            className={errors.rule_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
        </div>

        <div>
          <Label htmlFor="hebrew_rule_name" className={errors.hebrew_rule_name ? 'text-red-500' : ''}>
            Hebrew Rule Name *
          </Label>
          <Input
            id="hebrew_rule_name"
            value={formData.hebrew_rule_name || ''}
            onChange={(e) => handleChange('hebrew_rule_name', e.target.value)}
            className={errors.hebrew_rule_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
        </div>

        {/* Model Name (formerly Profile Name) - aligned with Algorithm */}
        <div>
          <Label htmlFor="profile_name" className={errors.profile_name ? 'text-red-500' : ''}>
            Model Name *
          </Label>
          <Select
            value={formData.profile_name || ''}
            onValueChange={handleProfileChange}
          >
            <SelectTrigger
              className={errors.profile_name ? 'border-red-500 focus:ring-red-500' : ''}
            >
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableProfiles.map((profile) => (
                <SelectItem key={profile} value={profile}>
                  {profile}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="algorithm_name" className={errors.algorithm_name ? 'text-red-500' : ''}>
            Algorithm Name * (Auto-set by Model)
          </Label>
          <Input
            id="algorithm_name"
            value={formData.algorithm_name}
            readOnly
            disabled
            className={`bg-gray-100 ${errors.algorithm_name ? 'border-red-500' : ''}`}
            placeholder="Select a model first"
          />
        </div>

        {/* Username - aligned with Customer */}
        <div>
          <Label htmlFor="username" className={errors.username ? 'text-red-500' : ''}>
            Username * {!isEdit ? '(Auto-set from login)' : '(Cannot be changed)'}
          </Label>
          <Input
            id="username"
            value={formData.username || ''}
            onChange={(e) => handleChange('username', e.target.value)}
            readOnly
            disabled
            className={`bg-gray-100 ${errors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
        </div>

        <div>
          <Label htmlFor="customer" className={errors.customer ? 'text-red-500' : ''}>
            Customer *
          </Label>
          <Input
            id="customer"
            value={formData.customer || ''}
            onChange={(e) => handleChange('customer', e.target.value)}
            className={errors.customer ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
        </div>

        {/* Min Resolution - aligned with Max Resolution */}
        <div>
          <Label htmlFor="minimum_resolution" className={errors.minimum_resolution ? 'text-red-500' : ''}>
            Min Resolution (0 or higher)
          </Label>
          <Input
            id="minimum_resolution"
            type="number"
            min={0}
            value={formData.minimum_resolution ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              handleChange('minimum_resolution', val === '' ? undefined : parseInt(val));
            }}
            className={errors.minimum_resolution ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
        </div>

        <div>
          <Label htmlFor="maximum_resolution">Max Resolution</Label>
          <Input
            id="maximum_resolution"
            type="number"
            min={0}
            value={formData.maximum_resolution ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              handleChange('maximum_resolution', val === '' ? undefined : parseInt(val));
            }}
          />
        </div>

        <div>
          <Label htmlFor="priority" className={errors.priority ? 'text-red-500' : ''}>
            Priority (2-10) *
          </Label>
          <Input
            id="priority"
            type="number"
            min={2}
            max={10}
            value={formData.priority ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              const parsed = parseInt(val);
              handleChange('priority', val === '' || isNaN(parsed) ? 4 : parsed);
            }}
            className={errors.priority ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
        </div>
      </div>

      {/* New Fields: Sensor Types, Sensor Groups, Color Types */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="sensor_types">
            Sensor Types
          </Label>
          <MultiSelect
            options={availableSensorTypes}
            value={formData.sensor_types || []}
            onChange={(selected) => handleChange('sensor_types', selected)}
            placeholder="Select sensor types"
          />
        </div>

        <div>
          <Label htmlFor="sensor_groups">
            Sensor Groups {!formData.profile_name && '(Select model first)'}
          </Label>
          <MultiSelect
            options={availableSensorGroups}
            value={formData.sensor_names || []}
            onChange={(selected) => handleChange('sensor_names', selected)}
            placeholder={loadingSensorGroups ? "Loading..." : !formData.profile_name ? "Select model first" : "Select sensor groups"}
            disabled={!formData.profile_name || loadingSensorGroups}
          />
        </div>

        <div>
          <Label htmlFor="color_types">
            Color Types
          </Label>
          <MultiSelect
            options={availableColorTypes}
            value={formData.color_types || []}
            onChange={(selected) => handleChange('color_types', selected)}
            placeholder="Select color types"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location_wkt" className={errors.location_wkt ? 'text-red-500' : ''}>
          Location WKT * (POLYGON or MULTIPOLYGON, max 1000 points)
        </Label>
        <Textarea
          id="location_wkt"
          value={formData.location_wkt || ''}
          onChange={(e) => handleChange('location_wkt', e.target.value)}
          rows={2}
          className={errors.location_wkt ? 'border-red-500 focus-visible:ring-red-500' : ''}
          placeholder="POLYGON((x1 y1, x2 y2, x3 y3, x1 y1))"
        />
        {!errors.location_wkt && (
          <p className="text-xs text-muted-foreground mt-1">
            Enter coordinates as POLYGON or MULTIPOLYGON format. Maximum 1000 coordinate points allowed.
          </p>
        )}
        
        {/* Shapefile Upload Button */}
        <div className="mt-3">
          <input
            id="shapefileUpload"
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('shapefileUpload')?.click()}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Shapefile (.zip)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Upload a ZIP file containing all shapefile components (.shp, .dbf, .shx, .prj)
          </p>
        </div>
        
        {/* Upload Status Message */}
        {uploadStatus && (
          <Alert className="mt-3" variant={uploadStatus.success ? 'default' : 'destructive'}>
            {uploadStatus.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={uploadStatus.success ? 'text-green-700' : ''}>
              {uploadStatus.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleChange('is_active', checked)}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="should_send_warmup_request"
            checked={formData.should_send_warmup_request || false}
            onCheckedChange={(checked) => handleChange('should_send_warmup_request', checked)}
          />
          <Label htmlFor="should_send_warmup_request">Send Warmup Request</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="run_every_other_image"
            checked={formData.run_every_other_image || false}
            onCheckedChange={(checked) => handleChange('run_every_other_image', checked)}
          />
          <Label htmlFor="run_every_other_image">Run Every Other Image</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_real_time"
            checked={formData.is_real_time || false}
            onCheckedChange={(checked) => handleChange('is_real_time', checked)}
          />
          <Label htmlFor="is_real_time">Real Time</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="should_check_in_vip"
            checked={formData.should_check_in_vip || false}
            onCheckedChange={(checked) => handleChange('should_check_in_vip', checked)}
          />
          <Label htmlFor="should_check_in_vip">Check in VIP</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_photo_old"
            checked={formData.is_photo_old ?? true}
            onCheckedChange={(checked) => handleChange('is_photo_old', checked)}
          />
          <Label htmlFor="is_photo_old">Photo Old</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit">{isEdit ? 'Update Rule' : 'Create Rule'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}