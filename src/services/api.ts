import { Rule } from '../types/rule';

const API_BASE_URL = '/Rules';

// Mock profile-to-algorithm mapping data
const mockProfileAlgorithmMapping: Record<string, string> = {
  'Profile_A': 'Algorithm_A',
  'Profile_B': 'Algorithm_B',
  'Profile_C': 'Algorithm_C',
  'VIP_Profile': 'Advanced_Algorithm',
  'Standard_Profile': 'Standard_Algorithm',
};

// Mock data for demo
const mockRules: Rule[] = [
  {
    rule_name: 'demo_rule_1',
    hebrew_rule_name: 'כלל דוגמה 1',
    algorithm_name: 'algorithm_1',
    priority: 5,
    customer: 'customer_a',
    is_active: true,
    creation_time: new Date().toISOString(),
    username: 'admin'
  },
  {
    rule_name: 'demo_rule_2',
    algorithm_name: 'algorithm_2',
    priority: 7,
    is_active: false,
    creation_time: new Date().toISOString(),
    username: 'user1'
  }
];

let rulesData = [...mockRules];

export const rulesApi = {
  async getAllRules(): Promise<Rule[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...rulesData];
  },

  async getRule(ruleName: string): Promise<Rule | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return rulesData.find(r => r.rule_name === ruleName) || null;
  },

  async createRule(rule: Rule): Promise<Rule> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newRule = { 
      ...rule, 
      creation_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    };
    rulesData.push(newRule);
    return newRule;
  },

  async updateRule(rule: Rule): Promise<Rule> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = rulesData.findIndex(r => r.rule_name === rule.rule_name);
    if (index !== -1) {
      rulesData[index] = { 
        ...rule, 
        update_time: new Date().toISOString() 
      };
      return rulesData[index];
    }
    throw new Error('Rule not found');
  },

  async deleteRule(ruleName: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    rulesData = rulesData.filter(r => r.rule_name !== ruleName);
  },

  async deleteAllRules(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    rulesData = [];
  },

  async toggleRuleActive(ruleName: string): Promise<Rule> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const rule = rulesData.find(r => r.rule_name === ruleName);
    if (rule) {
      rule.is_active = !rule.is_active;
      rule.update_time = new Date().toISOString();
      return rule;
    }
    throw new Error('Rule not found');
  },

  async getProfileAlgorithmMapping(): Promise<Record<string, string>> {
    // Simulate API call to det/getAll
    await new Promise(resolve => setTimeout(resolve, 200));
    return { ...mockProfileAlgorithmMapping };
  },

  async getProfiles(): Promise<string[]> {
    // Simulate API call to sqrule/getAll
    await new Promise(resolve => setTimeout(resolve, 200));
    return Object.keys(mockProfileAlgorithmMapping);
  }
};