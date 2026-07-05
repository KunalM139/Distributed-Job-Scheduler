const { GoogleGenAI } = require('@google/genai');

const DEFAULT_SUMMARY = {
  summary: "The job permanently failed after exhausting all retry attempts.",
  suggested_fix: [
    "Inspect execution logs.",
    "Verify payload and external dependencies.",
    "Retry after resolving the root cause."
  ],
  severity: "Medium"
};

/**
 * Generates an AI-powered failure summary using Google Gemini.
 * @param {object} job - The job object from the database.
 * @param {string} errorMessage - The final error message that caused the permanent failure.
 * @param {number} attemptCount - The total number of attempts made.
 * @returns {Promise<object>} The JSON summary object (either from Gemini or the default fallback).
 */
async function generateFailureSummary(job, errorMessage, attemptCount) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.warn('[aiSummaryService] Gemini API key not provided or invalid. Using default summary.');
      return DEFAULT_SUMMARY;
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a senior DevOps and Site Reliability Engineer.

A distributed background job permanently failed after exhausting all retry attempts.

Analyze the failure.

Job Details

Job Type:
${job.type}

Payload:
${JSON.stringify(job.payload)}

Attempts:
${attemptCount}

Final Error:
${errorMessage}

Return ONLY valid JSON.

Format

{
  "summary":"...",
  "suggested_fix":[
      "...",
      "..."
  ],
  "severity":"Low | Medium | High | Critical"
}

Do not include markdown.

Do not include explanations.

Return JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.summary && parsed.suggested_fix && parsed.severity) {
        return parsed;
      } else {
        console.warn('[aiSummaryService] Gemini returned invalid JSON schema. Using default summary.');
        return DEFAULT_SUMMARY;
      }
    } catch (parseError) {
      console.error('[aiSummaryService] Failed to parse Gemini response as JSON. Using default summary.', parseError);
      return DEFAULT_SUMMARY;
    }
  } catch (err) {
    console.error('[aiSummaryService] Gemini API call failed. Using default summary.', err.message);
    return DEFAULT_SUMMARY;
  }
}

module.exports = {
  generateFailureSummary,
  DEFAULT_SUMMARY
};
