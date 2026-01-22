const API_URL = "http://localhost:3000";

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const headers: any = {
      ...options.headers,
    };

    // Only set Content-Type to application/json if not sending FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || "Request failed");
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      const text = await response.text();

      // If response is empty or not JSON, return null or empty object
      if (!text || !contentType?.includes("application/json")) {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Make sure the backend is running on http://localhost:3000"
        );
      }
      throw error;
    }
  },

  // Auth
  async login(email: string, password: string, role?: "tutor" | "student") {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: "tutor" | "student"
  ) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
  },

  // Tasks
  async getTasks() {
    return this.request("/tasks");
  },

  async createTask(data: any) {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Messages
  async getConversations() {
    return this.request("/messages/conversations");
  },

  async getMessages(otherUserId: number) {
    return this.request(`/messages/conversation/${otherUserId}`);
  },

  async sendMessage(receiverId: number, text: string) {
    return this.request("/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId, text }),
    });
  },

  // Files
  async getFiles() {
    return this.request("/files");
  },

  async uploadFile(formData: FormData) {
    return this.request("/files/upload", {
      method: "POST",
      body: formData,
    });
  },

  async downloadFile(id: number, fileName: string) {
    const response = await fetch(`${API_URL}/files/download/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Finance
  async getTransactions() {
    return this.request("/finance");
  },

  async getFinanceStats() {
    return this.request("/finance/stats");
  },

  // Calendar
  async getEvents() {
    return this.request("/calendar");
  },

  async createEvent(data: any) {
    return this.request("/calendar", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateEvent(id: number, data: any) {
    return this.request(`/calendar/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async confirmPayment(transactionId: number) {
    return this.request(`/finance/${transactionId}/confirm`, {
      method: "PUT",
    });
  },

  async getStorageStats() {
    return this.request("/files/storage");
  },

  async deleteFile(id: number) {
    return this.request(`/files/${id}`, {
      method: "DELETE",
    });
  },

  // Progress
  async getProgress() {
    return this.request("/progress");
  },

  async getProgressStats() {
    return this.request("/progress/stats");
  },

  // Users
  async getStudents() {
    return this.request("/users/students");
  },

  async createStudent(data: { email: string; password: string; name: string }) {
    return this.request("/users/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getCode() {
    return this.request("/users/code");
  },

  async updateName(name: string) {
    return this.request("/users/profile/name", {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },

  async deleteAccount() {
    return this.request("/users/profile", {
      method: "DELETE",
    });
  },

  // Add: delete finance history for current tutor
  async deleteFinanceHistory() {
    // Fixed: match backend route and method (PUT /finance/history)
    return this.request("/finance/history", {
      method: "PUT",
    });
  },

  // Connections
  async requestConnection(code: string) {
    return this.request("/connections/request", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  async getConnections() {
    return this.request("/connections");
  },

  async getPendingRequests() {
    return this.request("/connections/pending");
  },

  async approveConnection(id: number, existingStudentId?: number) {
    return this.request(`/connections/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ existingStudentId }),
    });
  },

  async rejectConnection(id: number) {
    return this.request(`/connections/${id}/reject`, {
      method: "POST",
    });
  },

  async createManualStudent(
    name: string,
    defaultSubject?: string,
    defaultPrice?: number,
    defaultDuration?: number
  ) {
    return this.request("/connections/manual", {
      method: "POST",
      body: JSON.stringify({
        name,
        defaultSubject,
        defaultPrice,
        defaultDuration,
      }),
    });
  },

  async linkVirtualStudent(virtualStudentId: number, studentCode: string) {
    return this.request("/connections/link-virtual", {
      method: "POST",
      body: JSON.stringify({ virtualStudentId, studentCode }),
    });
  },

  async updateStudentAlias(
    studentId: number,
    data: {
      alias?: string;
      defaultSubject?: string;
      defaultPrice?: number;
      defaultDuration?: number;
    }
  ) {
    return this.request(`/connections/${studentId}/alias`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteStudent(studentId: number) {
    return this.request(`/connections/${studentId}/delete`, {
      method: "POST",
    });
  },

  // Calendar - delete event
  async deleteEvent(id: number, recurring: boolean = false) {
    return this.request(
      `/calendar/${id}${recurring ? "?recurring=true" : ""}`,
      {
        method: "DELETE",
      }
    );
  },

  getCurrencySymbol() {
    return localStorage.getItem("currency") || "$";
  },
};
