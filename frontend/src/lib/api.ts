const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorDetail = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

// API Service Functions
export const api = {
  // Health
  getHealth: () => fetchApi<{ status: string; service: string }>("/health"),

  // Dashboard
  getDashboardMetrics: (projectId?: string) =>
    fetchApi<any>(`/dashboard/metrics${projectId ? `?project_id=${projectId}` : ""}`),

  // Projects
  getProjects: () => fetchApi<any[]>("/projects"),
  getProject: (id: string) => fetchApi<any>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string; environment?: string }) =>
    fetchApi<any>("/projects", { method: "POST", body: JSON.stringify(data) }),
  deleteProject: (id: string) => fetchApi<any>(`/projects/${id}`, { method: "DELETE" }),

  // Chatbots
  getChatbots: (projectId?: string) =>
    fetchApi<any[]>(`/chatbots${projectId ? `?project_id=${projectId}` : ""}`),
  getChatbot: (id: string) => fetchApi<any>(`/chatbots/${id}`),
  createChatbot: (data: any) =>
    fetchApi<any>("/chatbots", { method: "POST", body: JSON.stringify(data) }),
  testChatbotConnection: (id: string) =>
    fetchApi<any>(`/chatbots/${id}/test-connection`, { method: "POST" }),
  deleteChatbot: (id: string) =>
    fetchApi<any>(`/chatbots/${id}`, { method: "DELETE" }),
  createChatbotVersion: (id: string, data: any) =>
    fetchApi<any>(`/chatbots/${id}/versions`, { method: "POST", body: JSON.stringify(data) }),

  // Prompts
  getPrompts: (projectId?: string, chatbotId?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (chatbotId) params.append("chatbot_id", chatbotId);
    return fetchApi<any[]>(`/prompts?${params.toString()}`);
  },
  createPromptVersion: (data: any) =>
    fetchApi<any>("/prompts", { method: "POST", body: JSON.stringify(data) }),
  comparePrompts: (v1: string, v2: string) =>
    fetchApi<any>(`/prompts/compare/${v1}/${v2}`),

  // Requirements & Contracts
  compileRequirement: (data: { requirement: string; project_id?: string; provider?: string }) =>
    fetchApi<any>("/requirements/compile", { method: "POST", body: JSON.stringify(data) }),
  getContracts: (projectId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (status) params.append("status", status);
    return fetchApi<any[]>(`/contracts?${params.toString()}`);
  },
  getContract: (id: string) => fetchApi<any>(`/contracts/${id}`),
  createContract: (data: any) =>
    fetchApi<any>("/contracts", { method: "POST", body: JSON.stringify(data) }),
  submitContract: (id: string) =>
    fetchApi<any>(`/contracts/${id}/submit`, { method: "POST" }),
  approveContract: (id: string) =>
    fetchApi<any>(`/contracts/${id}/approve`, { method: "PATCH" }),
  rejectContract: (id: string, reason: string) =>
    fetchApi<any>(`/contracts/${id}/reject?reason=${encodeURIComponent(reason)}`, { method: "POST" }),

  // Scenarios & Suites
  getScenarios: (projectId?: string, contractId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (contractId) params.append("contract_id", contractId);
    if (status) params.append("status", status);
    return fetchApi<any[]>(`/test-scenarios?${params.toString()}`);
  },
  createScenario: (data: any) =>
    fetchApi<any>("/test-scenarios", { method: "POST", body: JSON.stringify(data) }),
  generateScenarios: (contractId: string, data: any) =>
    fetchApi<any>(`/test-scenarios/generate/${contractId}`, { method: "POST", body: JSON.stringify(data) }),
  setScenarioApproval: (id: string, approved: boolean) =>
    fetchApi<any>(`/test-scenarios/${id}/approval`, { method: "PATCH", body: JSON.stringify({ approved }) }),
  getTestSuites: (projectId?: string) =>
    fetchApi<any[]>(`/test-suites${projectId ? `?project_id=${projectId}` : ""}`),
  getTestSuite: (id: string) => fetchApi<any>(`/test-suites/${id}`),
  createTestSuite: (data: any) =>
    fetchApi<any>("/test-suites", { method: "POST", body: JSON.stringify(data) }),
  executeTestSuite: (suiteId: string, data: { chatbot_id: string; chatbot_version_id?: string; evaluator_mode?: string }) =>
    fetchApi<any>(`/test-suites/${suiteId}/execute`, { method: "POST", body: JSON.stringify(data) }),

  // Execution
  executeScenario: (scenarioId: string, data: { assistant_response?: string; chatbot_id?: string; evaluator_mode?: string }) =>
    fetchApi<any>(`/test-scenarios/${scenarioId}/execute`, { method: "POST", body: JSON.stringify(data) }),
  getExecutions: (projectId?: string, chatbotId?: string, scenarioId?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (chatbotId) params.append("chatbot_id", chatbotId);
    if (scenarioId) params.append("scenario_id", scenarioId);
    return fetchApi<any[]>(`/executions?${params.toString()}`);
  },
  getExecution: (id: string) => fetchApi<any>(`/executions/${id}`),

  // Coverage
  getCoverage: (projectId?: string) =>
    fetchApi<any>(`/coverage${projectId ? `?project_id=${projectId}` : ""}`),

  // Regression
  getBaselines: (projectId?: string) =>
    fetchApi<any[]>(`/regression/baselines${projectId ? `?project_id=${projectId}` : ""}`),
  createBaseline: (data: { name: string; project_id?: string; chatbot_id?: string }) =>
    fetchApi<any>("/regression/baselines", { method: "POST", body: JSON.stringify(data) }),
  compareBaseline: (baselineId: string, candidateChatbotId?: string) => {
    const q = candidateChatbotId ? `?candidate_chatbot_id=${candidateChatbotId}` : "";
    return fetchApi<any>(`/regression/baselines/${baselineId}/compare${q}`);
  },

  // Mutations
  getMutations: (projectId?: string, scenarioId?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (scenarioId) params.append("scenario_id", scenarioId);
    return fetchApi<any[]>(`/mutations?${params.toString()}`);
  },
  generateMutations: (scenarioId: string) =>
    fetchApi<any>(`/mutations/scenario/${scenarioId}`, { method: "POST" }),
  runScenarioMutation: (scenarioId: string, chatbotId: string) =>
    fetchApi<any>(`/mutations/scenario/${scenarioId}/run?chatbot_id=${chatbotId}`, { method: "POST" }),
  updateMutationDetection: (mutationId: string, detected: boolean) =>
    fetchApi<any>(`/mutations/${mutationId}/detection`, { method: "PATCH", body: JSON.stringify({ detected }) }),
  getMutationScore: (projectId?: string) =>
    fetchApi<any>(`/mutations/score${projectId ? `?project_id=${projectId}` : ""}`),

  // Releases
  getReleases: (projectId?: string) =>
    fetchApi<any[]>(`/releases${projectId ? `?project_id=${projectId}` : ""}`),
  assessRelease: (data: any) =>
    fetchApi<any>("/releases/assess", { method: "POST", body: JSON.stringify(data) }),
  getRelease: (id: string) => fetchApi<any>(`/releases/${id}`),

  // Integrations
  getIntegrationStatus: () => fetchApi<any>("/integrations/status"),
  exportPromptfoo: (chatbotId: string, scenarioIds?: string[]) => {
    const url = `${API_BASE}/integrations/promptfoo/export/${chatbotId}`;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_ids: scenarioIds || null }),
    });
  },
};
