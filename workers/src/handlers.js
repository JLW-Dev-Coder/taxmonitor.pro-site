/* ------------------------------------------
 * Handlers
 * ------------------------------------------ */

import { executeWritePipeline } from "./storage.js";

const HANDLERS = {
  createFreeMembership,
  createInquiry,
  getAuthSession,
  getInquiry,
  getPricing,
  getTaxpayerAccount,
  patchTaxpayerAccount
};

export async function dispatchHandler({
  contract,
  env,
  route,
  validated
}) {
  const handlerName = route?.handler;
  const handler = HANDLERS[handlerName];

  if (!handler) {
    throw new Error(`No handler registered for route handler: ${handlerName}`);
  }

  return handler({
    contract,
    env,
    route,
    validated
  });
}

/* ------------------------------------------
 * Route Handlers
 * ------------------------------------------ */

async function createFreeMembership({
  contract,
  env,
  validated
}) {
  const writeResult = await executeWritePipeline({
    contract,
    env,
    requestContext: validated
  });

  return {
    data: {
      eventId: validated.body?.eventId || null,
      membershipId: validated.body?.eventId || null,
      ok: true,
      record: writeResult.canonicalRecord?.record || null,
      status: "active",
      tier: "free"
    },
    status: 201
  };
}

async function createInquiry({
  contract,
  env,
  validated
}) {
  const writeResult = await executeWritePipeline({
    contract,
    env,
    requestContext: validated
  });

  return {
    data: {
      eventId: validated.body?.eventId || null,
      inquiryId: validated.body?.eventId || null,
      ok: true,
      record: writeResult.canonicalRecord?.record || null,
      status: "submitted"
    },
    status: 201
  };
}

async function getAuthSession() {
  return {
    data: {
      ok: true,
      session: null
    },
    status: 200
  };
}

async function getInquiry({
  env,
  validated
}) {
  const inquiryId = validated.params?.inquiry_id;
  const key = `inquiries/${inquiryId}.json`;
  const object = await env.R2_BUCKET.get(key);

  if (!object) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      eventId: inquiryId,
      inquiry: await object.json(),
      inquiryId,
      ok: true
    },
    status: 200
  };
}

async function getPricing({
  env
}) {
  const plans = [
    {
      billingPeriod: "monthly",
      price: toNumber(env.TMP_PLAN_ESSENTIAL_MONTHLY_PRICE),
      taxToolTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS),
      tier: "essential",
      transcriptTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "yearly",
      price: toNumber(env.TMP_PLAN_ESSENTIAL_YEARLY_PRICE),
      taxToolTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS),
      tier: "essential",
      transcriptTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "monthly",
      price: 0,
      taxToolTokens: toNumber(env.TMP_PLAN_FREE_TAX_TOOL_TOKENS),
      tier: "free",
      transcriptTokens: toNumber(env.TMP_PLAN_FREE_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "monthly",
      price: toNumber(env.TMP_PLAN_PLUS_MONTHLY_PRICE),
      taxToolTokens: toNumber(env.TMP_PLAN_PLUS_TAX_TOOL_TOKENS),
      tier: "plus",
      transcriptTokens: toNumber(env.TMP_PLAN_PLUS_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "yearly",
      price: toNumber(env.TMP_PLAN_PLUS_YEARLY_PRICE),
      taxToolTokens: toNumber(env.TMP_PLAN_PLUS_TAX_TOOL_TOKENS),
      tier: "plus",
      transcriptTokens: toNumber(env.TMP_PLAN_PLUS_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "monthly",
      price: toNumber(env.TMP_PLAN_PREMIER_MONTHLY_PRICE),
      taxToolTokens: toNumber(env.TMP_PLAN_PREMIER_TAX_TOOL_TOKENS),
      tier: "premier",
      transcriptTokens: toNumber(env.TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "yearly",
      price: toNumber(env.TMP_PLAN_PREMIER_YEARLY_PRICE),
      taxToolTokens: toNumber(env.TMP_PLAN_PREMIER_TAX_TOOL_TOKENS),
      tier: "premier",
      transcriptTokens: toNumber(env.TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS)
    }
  ];

  return {
    data: {
      ok: true,
      plans
    },
    status: 200
  };
}

async function getTaxpayerAccount({
  env,
  validated
}) {
  const accountId = validated.params?.account_id;
  const key = `taxpayer_accounts/${accountId}.json`;
  const object = await env.R2_BUCKET.get(key);

  if (!object) {
    return {
      data: {
        accountId,
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      account: await object.json(),
      accountId,
      eventId: accountId,
      ok: true
    },
    status: 200
  };
}

async function patchTaxpayerAccount({
  contract,
  env,
  validated
}) {
  const writeResult = await executeWritePipeline({
    contract,
    env,
    requestContext: validated
  });

  return {
    data: {
      accountId: validated.params?.account_id || null,
      eventId: validated.body?.eventId || null,
      ok: true,
      record: writeResult.canonicalRecord?.record || null,
      updated: true
    },
    status: 200
  };
}

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
