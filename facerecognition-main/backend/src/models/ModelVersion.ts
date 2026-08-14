import mongoose, { Schema, Document } from 'mongoose';

export interface IModelVersionDoc extends Document {
  version: string;
  sampleCount: number;
  accuracy: number;
  llmFallbackRate: number;
  createdAt: Date;
}

const ModelVersionSchema: Schema = new Schema({
  version: { type: String, required: true },
  sampleCount: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  llmFallbackRate: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const ModelVersionModel = mongoose.model<IModelVersionDoc>('WafModelVersion', ModelVersionSchema);
