import mongoose, { Schema, Document } from 'mongoose';

export interface IAttackStatDoc extends Document {
  date: string; // YYYY-MM-DD
  totalRequests: number;
  blockedRequests: number;
  attackTypeCounts: Record<string, number>;
  countryCounts: Record<string, number>;
}

const AttackStatSchema: Schema = new Schema({
  date: { type: String, required: true, unique: true, index: true },
  totalRequests: { type: Number, default: 0 },
  blockedRequests: { type: Number, default: 0 },
  attackTypeCounts: { type: Schema.Types.Mixed, default: {} },
  countryCounts: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

export const AttackStatModel = mongoose.model<IAttackStatDoc>('WafAttackStat', AttackStatSchema);
