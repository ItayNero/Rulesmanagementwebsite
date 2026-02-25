export interface Rule {
  rule_name: string;
  hebrew_rule_name?: string;
  profile_name?: string;
  algorithm_name: string;
  priority: number;
  customer?: string;
  location_wkt?: string;
  location_geojson?: any;
  maximum_resolution?: number;
  minimum_resolution?: number;
  is_active: boolean;
  sensor_names?: Record<string, string[]>;
  sensor_types?: string[];
  color_types?: string[];
  creation_time?: string;
  update_time?: string;
  username?: string;
  should_send_warmup_request?: boolean;
  run_every_other_image?: boolean;
  is_real_time?: boolean;
  should_check_in_vip?: boolean;
  is_photo_old?: boolean;
}
