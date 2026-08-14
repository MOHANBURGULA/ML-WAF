import mongoose, { Schema, Document } from 'mongoose';

export interface IRuleDoc extends Document {
  name: string;
  type: 'regex' | 'rate-limit' | 'ip-block' | 'entropy';
  pattern: string;
  source: 'auto' | 'manual';
  status: 'active' | 'pending-review' | 'disabled';
  enabled: boolean;
  hitsCount: number;
  explanation?: string;
  mlConfidence?: number;
  samplePayload?: string;
  affectedEndpoints?: string[];
  createdAt: Date;
}

const RuleSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['regex', 'rate-limit', 'ip-block', 'entropy'], required: true },
  pattern: { type: String, required: true },
  source: { type: String, enum: ['auto', 'manual'], default: 'manual' },
  status: { type: String, enum: ['active', 'pending-review', 'disabled'], default: 'active', index: true },
  enabled: { type: Boolean, default: true },
  hitsCount: { type: Number, default: 0 },
  explanation: { type: String },
  mlConfidence: { type: Number },
  samplePayload: { type: String },
  affectedEndpoints: [{ type: String }]
}, {
  timestamps: true
});

export const RuleModel = mongoose.model<IRuleDoc>('WafRule', RuleSchema);
