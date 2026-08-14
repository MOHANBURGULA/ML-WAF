import mongoose, { Schema, Document } from 'mongoose';

export interface ISettingsDoc extends Document {
  protectionMode: 'Monitoring' | 'Active Blocking';
  confidenceThreshold: number;
  modelVersion: string;
  lastRetrained: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

const SettingsSchema: Schema = new Schema({
  protectionMode: { type: String, enum: ['Monitoring', 'Active Blocking'], default: 'Active Blocking' },
  confidenceThreshold: { type: Number, default: 0.65 },
  modelVersion: { type: String, default: 'Sentinel-Transformer-v3.4.2-Live' },
  lastRetrained: { type: String, default: 'Today at 04:00 UTC' },
  accuracy: { type: Number, default: 99.42 },
  precision: { type: Number, default: 99.15 },
  recall: { type: Number, default: 98.88 },
  f1Score: { type: Number, default: 99.01 }
}, {
  timestamps: true
});

export const SettingsModel = mongoose.model<ISettingsDoc>('WafSettings', SettingsSchema);
