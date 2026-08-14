import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureBreakdown {
  payloadLength: number;
  entropy: number;
  specialCharCount: number;
  sqliKeywordCount: number;
  xssKeywordCount: number;
}

export interface IMlVerdict {
  isAttack: boolean;
  confidence: number;
  attackType: string;
}

export interface IRequestDoc extends Document {
  timestamp: Date;
  sourceIp: string;
  country: string;
  flag: string;
  method: string;
  path: string;
  headers: Record<string, any>;
  payload: string;
  features: IFeatureBreakdown;
  mlVerdict: IMlVerdict;
  finalAction: 'Allowed' | 'Blocked' | 'Flagged';
  attackType: string;
  source?: 'rules' | 'ml' | 'llm';
  reason?: string | null;
  incidentId?: string;
  userOverride?: 'false_positive' | 'confirmed_attack' | null;
}

const RequestSchema: Schema = new Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  sourceIp: { type: String, required: true, index: true },
  country: { type: String, default: 'Unknown' },
  flag: { type: String, default: '🌐' },
  method: { type: String, required: true },
  path: { type: String, required: true },
  headers: { type: Schema.Types.Mixed, default: {} },
  payload: { type: String, default: '' },
  features: {
    payloadLength: { type: Number, default: 0 },
    entropy: { type: Number, default: 0 },
    specialCharCount: { type: Number, default: 0 },
    sqliKeywordCount: { type: Number, default: 0 },
    xssKeywordCount: { type: Number, default: 0 }
  },
  mlVerdict: {
    isAttack: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
    attackType: { type: String, default: 'Normal Traffic' }
  },
  finalAction: { type: String, enum: ['Allowed', 'Blocked', 'Flagged'], required: true },
  attackType: { type: String, default: 'Normal Traffic' },
  source: { type: String, enum: ['rules', 'ml', 'llm'], default: 'rules' },
  reason: { type: String, default: null },
  incidentId: { type: String },
  userOverride: { type: String, enum: ['false_positive', 'confirmed_attack', null], default: null }
}, {
  timestamps: true
});

// Compound index on sourceIp and timestamp for dashboard query acceleration
RequestSchema.index({ sourceIp: 1, timestamp: -1 });

export const RequestModel = mongoose.model<IRequestDoc>('WafRequest', RequestSchema);
