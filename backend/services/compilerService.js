import axios from 'axios';

// Switch to public free instance
const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com';

const LANGUAGE_MAP = {
  javascript: 63,
  python: 71, // Python 3
  cpp: 54,    // C++ (GCC 9.2.0)
};

/**
 * Executes code against the public Judge0 instance with retry logic and wait=true.
 * Uses Base64 encoding for robustness with special characters and headers.
 */
export const executeCode = async (code, language, input, expectedOutput = null, retries = 2) => {
  const languageId = LANGUAGE_MAP[language.toLowerCase()];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Some CE instances might require an auth token
      const apiKey = process.env.JUDGE0_API_KEY;
      if (apiKey) {
        if (JUDGE0_BASE_URL.includes('rapidapi.com')) {
          headers['X-RapidAPI-Key'] = apiKey;
          headers['X-RapidAPI-Host'] = new URL(JUDGE0_BASE_URL).hostname;
        } else {
          headers['X-Auth-Token'] = apiKey;
        }
      }

      const response = await axios.post(
        `${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=true`,
        {
          source_code: Buffer.from(code).toString('base64'),
          language_id: languageId,
          stdin: Buffer.from(input).toString('base64'),
          expected_output: expectedOutput ? Buffer.from(expectedOutput).toString('base64') : null,
          cpu_time_limit: 2.0, // 2 seconds limit
          memory_limit: 128000, // 128MB limit
        },
        {
          headers,
          timeout: 10000,
        }
      );

      const { status, stdout, stderr, compile_output, time, memory } = response.data;

      // Result formatting
      return {
        status: status.description,
        stdout: stdout ? Buffer.from(stdout, 'base64').toString() : '',
        stderr: stderr ? Buffer.from(stderr, 'base64').toString() : '',
        compile_output: compile_output ? Buffer.from(compile_output, 'base64').toString() : '',
        time,
        memory,
      };
    } catch (error) {
      const status = error.response?.status;
      
      if (status === 429 && attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      throw new Error(status === 429 ? 'Service busy, please try again.' : 'Code execution service unavailable.');
    }
  }
};
