import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKeyDoc extends Document {
  name: string;
  key: string;
  status: 'active' | 'revoked';
  lastUsed: string;
  createdAt: Date;
}

const ApiKeySchema: Schema = new Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  lastUsed: { type: String, default: 'Never' }
}, {
  timestamps: true
});

export const ApiKeyModel = mongoose.model<IApiKeyDoc>('WafApiKey', ApiKeySchema);
