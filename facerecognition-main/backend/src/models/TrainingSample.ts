import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingSampleDoc extends Document {
  payload: string;
  headers: Record<string, any>;
  url: string;
  label: string;
  confidence: number;
  source: 'llm';
  used_for_training: boolean;
  createdAt: Date;
}

const TrainingSampleSchema: Schema = new Schema({
  payload: { type: String, default: '' },
  headers: { type: Schema.Types.Mixed, default: {} },
  url: { type: String, required: true },
  label: { type: String, required: true },
  confidence: { type: Number, required: true },
  source: { type: String, default: 'llm' },
  used_for_training: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const TrainingSampleModel = mongoose.model<ITrainingSampleDoc>('WafTrainingSample', TrainingSampleSchema);
