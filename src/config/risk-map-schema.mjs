import { z } from 'zod';

export const RiskActionSchema = z.enum(['comment_only', 'escalate', 'require_human_review']);

export const RiskRuleSchema = z.object({
  pattern: z.string().min(1),
  action: RiskActionSchema,
  reason: z.string().optional(),
});

export const RiskMapSchema = z.object({
  version: z.string().default('1'),
  rules: z.array(RiskRuleSchema).min(1),
  defaults: z
    .object({
      action: RiskActionSchema.default('comment_only'),
    })
    .default({ action: 'comment_only' }),
});
