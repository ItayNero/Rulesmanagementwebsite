import { configService } from '../../config/configService';
import type { Rule } from '../types';

/**
 * Rules API Service
 * Handles all API calls related to rules management
 */
export const rulesApi = {
  /**
   * Get all rules from Elasticsearch
   */
  async getAllRules(): Promise<Rule[]> {
    const config = configService.getRulesManagement();
    const url = `${config.endpoint}${config['get-all-rules'].route}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config['get-all-rules'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rules || [];
  },

  /**
   * Create a new rule in Elasticsearch
   */
  async createRule(rule: Rule): Promise<void> {
    const config = configService.getRulesManagement();
    const url = `${config.endpoint}${config['create-rule'].route}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
      signal: AbortSignal.timeout(config['create-rule'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to create rule: ${response.statusText}`);
    }
  },

  /**
   * Update an existing rule in Elasticsearch
   */
  async updateRule(rule: Rule): Promise<void> {
    const config = configService.getRulesManagement();
    const url = `${config.endpoint}${config['update-rule'].route}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
      signal: AbortSignal.timeout(config['update-rule'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to update rule: ${response.statusText}`);
    }
  },

  /**
   * Delete a rule from Elasticsearch
   */
  async deleteRule(ruleName: string): Promise<void> {
    const config = configService.getRulesManagement();
    const url = `${config.endpoint}${config['delete-rule'].route}/${ruleName}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config['delete-rule'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete rule: ${response.statusText}`);
    }
  },

  /**
   * Toggle rule active status
   */
  async toggleRuleActive(ruleName: string): Promise<void> {
    const config = configService.getRulesManagement();
    const url = `${config.endpoint}${config['toggle-active'].route}/${ruleName}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config['toggle-active'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle rule status: ${response.statusText}`);
    }
  },

  /**
   * Search rules by query
   */
  async searchRules(query: string): Promise<Rule[]> {
    const config = configService.getRulesManagement();
    const url = `${config.endpoint}${config['search-rules'].route}?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config['search-rules'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to search rules: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rules || [];
  },
};

/**
 * Algorithm Manager API Service
 */
export const algoApi = {
  /**
   * Get all profiles with their algorithm mappings
   */
  async getAllProfiles(): Promise<Record<string, string>> {
    const config = configService.getAlgoManager();
    const url = `${config.endpoint}${config['sqrule-get-all'].route}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config['sqrule-get-all'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Get deterministic profiles with their algorithm mappings
   */
  async getDetProfiles(): Promise<Record<string, string>> {
    const config = configService.getAlgoManager();
    const url = `${config.endpoint}${config['det-get-all'].route}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config['det-get-all'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch det profiles: ${response.statusText}`);
    }

    return await response.json();
  },
};

/**
 * Roberto API Service
 */
export const robertoApi = {
  /**
   * Get sensor groups by model
   */
  async getSensorGroupsByModel(model: string): Promise<string[]> {
    const config = configService.getRoberto();
    const url = `${config.endpoint}${config['get-sensor-groups'].route}?model=${encodeURIComponent(model)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config['get-sensor-groups'].timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sensor groups: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sensorGroups || [];
  },
};
