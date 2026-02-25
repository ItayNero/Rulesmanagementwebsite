import { useState, useEffect } from 'react';
import { Rule } from '../../types/rule';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { rulesApi } from '../../services/api';

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
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.rule_name.trim()) {
      newErrors.rule_name = 'Rule name is required';
    }

    if (!formData.hebrew_rule_name?.trim()) {
      newErrors.hebrew_rule_name = 'Hebrew rule name is required';
    }

    if (!formData.algorithm_name.trim()) {
      newErrors.algorithm_name = 'Algorithm name is required';
    }

    if (formData.priority < 2 || formData.priority > 10) {
      newErrors.priority = 'Priority must be between 2 and 10';
    }

    if (!formData.profile_name?.trim()) {
      newErrors.profile_name = 'Profile name is required';
    }

    if (!formData.customer?.trim()) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.location_wkt?.trim()) {
      newErrors.location_wkt = 'Location WKT is required';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
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

        <div>
          <Label htmlFor="algorithm_name" className={errors.algorithm_name ? 'text-red-500' : ''}>
            Algorithm Name * (Auto-set by Profile)
          </Label>
          <Input
            id="algorithm_name"
            value={formData.algorithm_name}
            readOnly
            disabled
            className={`bg-gray-100 ${errors.algorithm_name ? 'border-red-500' : ''}`}
            placeholder="Select a profile first"
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

        <div>
          <Label htmlFor="profile_name" className={errors.profile_name ? 'text-red-500' : ''}>
            Profile Name *
          </Label>
          <Select
            value={formData.profile_name || ''}
            onValueChange={handleProfileChange}
          >
            <SelectTrigger
              className={errors.profile_name ? 'border-red-500 focus:ring-red-500' : ''}
            >
              <SelectValue placeholder="Select a profile" />
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
      </div>

      <div>
        <Label htmlFor="location_wkt" className={errors.location_wkt ? 'text-red-500' : ''}>
          Location WKT *
        </Label>
        <Textarea
          id="location_wkt"
          value={formData.location_wkt || ''}
          onChange={(e) => handleChange('location_wkt', e.target.value)}
          rows={2}
          className={errors.location_wkt ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
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