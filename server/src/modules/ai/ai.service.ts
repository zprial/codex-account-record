import { randomUUID } from 'node:crypto';
import { z } from 'zod';

type AiJobStatus = 'pending' | 'completed' | 'failed';

interface AiJob {
  id: string;
  userId: string;
  type: 'text_parse';
  status: AiJobStatus;
  input: { text: string };
  output: Record<string, unknown> | null;
  error: string | null;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface ParsedTransactionSuggestion {
  amount: number | null;
  type: 'EXPENSE' | 'INCOME' | null;
  occurredAt: string;
  description: string;
  tags: string[];
  confidence: number;
}

const parseTextRequestSchema = z.object({
  text: z.string().trim().min(1, '请输入待解析的文本')
});

const jobs: AiJob[] = [];

function toISODate(date: Date) {
  return date.toISOString();
}

function inferAmount(text: string) {
  const matches = text.replace(/,/g, '').match(/([-+]?\d+(?:\.\d{1,2})?)/g);
  if (!matches || matches.length === 0) {
    return null;
  }
  return Number(matches[matches.length - 1]);
}

function inferType(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('收入') || lower.includes('收款') || lower.includes('进账')) {
    return 'INCOME' as const;
  }
  if (lower.includes('消费') || lower.includes('支出') || lower.includes('付款')) {
    return 'EXPENSE' as const;
  }
  return null;
}

function inferDate(text: string) {
  const match = text.match(/(\d{4}[年-]\d{1,2}[月-]\d{1,2}日?)/);
  if (!match) return null;
  const normalized = match[1]
    .replace('年', '-')
    .replace('月', '-')
    .replace('日', '')
    .replace(/\s/g, '');
  const parts = normalized.split('-').map((part) => part.padStart(2, '0'));
  const iso = `${parts[0]}-${parts[1]}-${parts[2]}`;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return toISODate(new Date(parsed));
}

function inferTags(text: string) {
  const tags: string[] = [];
  if (text.includes('餐厅') || text.includes('午餐')) tags.push('餐饮');
  if (text.includes('超市')) tags.push('超市');
  if (text.includes('地铁') || text.includes('打车') || text.includes('交通')) tags.push('交通');
  if (text.includes('工资')) tags.push('工资');
  return tags;
}

export function parseText(userId: string, rawPayload: unknown) {
  const payload = parseTextRequestSchema.parse(rawPayload);
  const now = toISODate(new Date());
  const amount = inferAmount(payload.text);
  const explicitType = inferType(payload.text);
  const occurredAt = inferDate(payload.text) ?? now;
  const tags = inferTags(payload.text);

  const suggestion: ParsedTransactionSuggestion = {
    amount,
    type: explicitType ?? (amount !== null && amount < 0 ? 'EXPENSE' : null),
    occurredAt,
    description: payload.text,
    tags,
    confidence: amount !== null ? 0.75 : 0.4
  };

  const job: AiJob = {
    id: randomUUID(),
    userId,
    type: 'text_parse',
    status: 'completed',
    input: { text: payload.text },
    output: {
      amount: suggestion.amount,
      type: suggestion.type,
      occurredAt: suggestion.occurredAt,
      description: suggestion.description,
      tags: suggestion.tags,
      confidence: suggestion.confidence
    },
    error: null,
    confidence: suggestion.confidence,
    createdAt: now,
    updatedAt: now
  };

  jobs.push(job);

  return { jobId: job.id, suggestion };
}

export function listJobs(userId: string) {
  return jobs.filter((job) => job.userId === userId);
}
