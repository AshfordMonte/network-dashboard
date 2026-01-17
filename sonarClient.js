/**
 * sonarClient.js
 *
 * This module is responsible for making GraphQL requests to Sonar.
 * It keeps all Sonar-specific request logic in one place so the rest
 * of the server code stays clean and simple.
 */

/**
 * Sends a GraphQL request to Sonar and returns the parsed data.
 *
 * @param {Object} params
 * @param {string} params.endpoint - Sonar GraphQL endpoint URL
 * @param {string} params.token - Sonar API token
 * @param {string} params.query - GraphQL query string
 * @param {Object} params.variables - Optional GraphQL variables
 *
 * @returns {Object} The `data` field from the GraphQL response
 *
 * @throws Will throw if the HTTP request fails or Sonar returns GraphQL errors
 */
async function sonarGraphqlRequest({ endpoint, token, query, variables = {} }) {
  // Send POST request to Sonar GraphQL API
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      // Required for GraphQL JSON payloads
      "Content-Type": "application/json",

      // Sonar uses Bearer token authentication
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  // If Sonar responds with a non-200 status, treat it as an error
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sonar GraphQL HTTP ${res.status}: ${text}`);
  }

  // Parse the JSON response
  const json = await res.json();

  // GraphQL can return 200 OK but still include errors
  if (json.errors?.length) {
    throw new Error(`Sonar GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  // Return only the `data` field
  return json.data;
}

// Export the function so server.js can use it
module.exports = { sonarGraphqlRequest };