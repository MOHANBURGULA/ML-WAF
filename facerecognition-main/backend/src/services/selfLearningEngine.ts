import { RequestModel } from '../models/Request.js';
import { RuleModel } from '../models/Rule.js';
import { TrainingSampleModel } from '../models/TrainingSample.js';
import { ModelVersionModel } from '../models/ModelVersion.js';
import { triggerMLRetraining } from './mlClient.js';
import { getSocketIO } from './socketService.js';

/**
 * Self-Learning Pattern Monitor:
 * Scans recent blocked requests. If identical payload patterns or path traversal attempts
 * have been blocked 5+ times, auto-generates a new WAF Rule with status 'pending-review'
 * and broadcasts a live Socket.IO notification to the React SOC dashboard!
 */
export async function checkAndAutoGenerateRules(lastLoggedRequest: any) {
  try {
    if (lastLoggedRequest.finalAction !== 'Blocked' && lastLoggedRequest.mlVerdict?.confidence < 0.8) {
      return;
    }

    const path = lastLoggedRequest.path;
    const attackType = lastLoggedRequest.attackType || 'Attack';

    // Count how many times requests on this path / attack vector were blocked
    const matchCount = await RequestModel.countDocuments({
      path: lastLoggedRequest.path,
      finalAction: 'Blocked',
      attackType: lastLoggedRequest.attackType
    });

    // If pattern hit threshold >= 5 in demo mode
    if (matchCount >= 5) {
      const existingRule = await RuleModel.findOne({
        $or: [
          { pattern: { $regex: path, $options: 'i' } },
          { affectedEndpoints: path }
        ]
      });

      if (!existingRule) {
        const suggestedName = `Auto-Learned Protection for ${attackType} on ${path}`;
        const patternStr = `(?i)(${path.replace(/[^a-zA-Z0-9\/]/g, '\\$&')}|${lastLoggedRequest.payload.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '\\$&')})`;

        const newRule = await RuleModel.create({
          name: suggestedName,
          type: attackType.includes('SQL') ? 'regex' : (attackType.includes('DDoS') ? 'rate-limit' : 'regex'),
          pattern: patternStr,
          source: 'auto',
          status: 'pending-review',
          hitsCount: matchCount,
          explanation: `Self-learned pattern generated after ${matchCount} blocked ${attackType} attempts on ${path}.`,
          mlConfidence: lastLoggedRequest.mlVerdict?.confidence || 0.95,
          samplePayload: lastLoggedRequest.payload || 'Malicious Payload Sample',
          affectedEndpoints: [path]
        });

        console.log(`[Self-Learning Engine] Generated new AI Pending Rule: "${newRule.name}"`);

        // Broadcast Socket.IO live notification to SOC Dashboard
        const io = getSocketIO();
        if (io) {
          io.emit('new_pending_rule', {
            id: newRule._id,
            suggestedRuleName: newRule.name,
            type: newRule.type,
            pattern: newRule.pattern,
            mlConfidence: newRule.mlConfidence,
            reason: newRule.explanation,
            affectedEndpoints: newRule.affectedEndpoints,
            samplePayload: newRule.samplePayload,
            createdAt: 'Just now'
          });
        }
      }
    }
  } catch (err) {
    console.error('[Self-Learning Engine] Error checking auto-rules:', err);
  }
}

/**
 * Stores successful LLM classifications (confidence >= 0.70) as new labeled TrainingSample records.
 */
export async function saveLLMTrainingSample(
  payload: string,
  headers: any,
  url: string,
  label: string,
  confidence: number
) {
  try {
    if (confidence < 0.70 || label === 'Unknown' || label === 'Normal Traffic') {
      return;
    }

    await TrainingSampleModel.create({
      payload: payload || url,
      headers: headers || {},
      url,
      label,
      confidence,
      source: 'llm',
      used_for_training: false,
      createdAt: new Date()
    });

    console.log(`[Self-Learning Engine] Saved new LLM training sample: "${label}" (Confidence: ${confidence})`);

    // Check if background retraining threshold reached
    setImmediate(checkAndTriggerAutoRetraining);
  } catch (err) {
    console.error('[Self-Learning Engine] Error saving training sample:', err);
  }
}

/**
 * Decoupled Background Retraining Trigger:
 * Checks unused TrainingSample count. If >= RETRAIN_SAMPLE_THRESHOLD (50),
 * executes ML model fine-tuning, updates samples to used_for_training: true,
 * and logs a new ModelVersion record.
 */
export async function checkAndTriggerAutoRetraining() {
  try {
    const unusedCount = await TrainingSampleModel.countDocuments({ used_for_training: false });
    const threshold = Number(process.env.RETRAIN_SAMPLE_THRESHOLD || 50);

    if (unusedCount < threshold) {
      return;
    }

    console.log(`[Self-Learning Engine] ${unusedCount} new training samples accumulated (Threshold: ${threshold}). Kicking off background ML retraining...`);

    const unusedSamples = await TrainingSampleModel.find({ used_for_training: false }).limit(100);
    const samplePayloads = unusedSamples.map(s => ({
      payload: s.payload,
      label: s.label,
      confidence: s.confidence
    }));

    const retrainResult = await triggerMLRetraining(samplePayloads);

    if (retrainResult.success) {
      const sampleIds = unusedSamples.map(s => s._id);
      await TrainingSampleModel.updateMany(
        { _id: { $in: sampleIds } },
        { $set: { used_for_training: true } }
      );

      const totalRequests = await RequestModel.countDocuments();
      const llmRequests = await RequestModel.countDocuments({ source: 'llm' });
      const fallbackRate = totalRequests > 0 ? Number(((llmRequests / totalRequests) * 100).toFixed(1)) : 14.5;

      await ModelVersionModel.create({
        version: retrainResult.version,
        sampleCount: unusedSamples.length,
        accuracy: retrainResult.accuracy,
        llmFallbackRate: fallbackRate,
        createdAt: new Date()
      });

      console.log(`[Self-Learning Engine] Retrained model: ${retrainResult.version} (Accuracy: ${retrainResult.accuracy}%). Marked ${unusedSamples.length} samples as used.`);
    }
  } catch (err) {
    console.error('[Self-Learning Engine] Error during background model retraining:', err);
  }
}
