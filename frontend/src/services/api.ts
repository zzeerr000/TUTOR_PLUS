const API_URL = "http://localhost:3000";

export const api = {
  getBaseUrl: () => API_URL,
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

    // Debug logging
    console.log(`API Request: ${API_URL}${endpoint}`);
    console.log('Token exists:', !!token);
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'none');

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Request failed" }));
        console.log('API Error:', error);
        
        // Don't auto-reload on 401 for login attempts - let the user see the error
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          console.log('Unauthorized - clearing authentication');
          this.clearAuth();
          // Force page reload to show login screen
          window.location.reload();
        }
        
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
          "Cannot connect to server. Make sure the backend is running on http://localhost:3000",
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
    role: "tutor" | "student",
  ) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
  },

  // Subjects
  async getSubjects() {
    return this.request("/subjects");
  },

  async createSubject(data: { name: string; color?: string }) {
    return this.request("/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateSubject(id: number, data: { name?: string; color?: string }) {
    return this.request(`/subjects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteSubject(id: number) {
    return this.request(`/subjects/${id}`, {
      method: "DELETE",
    });
  },

  async updateStudentSubjects(connectionId: number, subjectIds: number[]) {
    return this.request(`/connections/${connectionId}/subjects`, {
      method: "POST",
      body: JSON.stringify({ subjectIds }),
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
  async getFiles(folderId?: number | null, subjectId?: number | null) {
    let endpoint = folderId ? `/files/folder/${folderId}` : "/files";
    if (subjectId) {
      endpoint += `${endpoint.includes("?") ? "&" : "?"}subjectId=${subjectId}`;
    }
    return this.request(endpoint);
  },

  async createFolder(
    name: string,
    parentId?: number | null,
    subjectId?: number | null,
  ) {
    return this.request("/files/folders", {
      method: "POST",
      body: JSON.stringify({ name, parentId, subjectId }),
    });
  },

  async deleteFolder(id: number) {
    return this.request(`/files/folders/${id}`, {
      method: "DELETE",
    });
  },

  async moveFile(fileId: number, folderId: number | null) {
    return this.request(`/files/${fileId}/move`, {
      method: "POST",
      body: JSON.stringify({ folderId }),
    });
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

  async updateEvent(id: number, data: any, recurring: boolean = false) {
    return this.request(
      `/calendar/${id}${recurring ? "?recurring=true" : ""}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  async confirmPayment(transactionId: number) {
    return this.request(`/finance/${transactionId}/confirm`, {
      method: "PUT",
    });
  },

  async cancelPayment(transactionId: number) {
    return this.request(`/finance/${transactionId}/cancel`, {
      method: "PUT",
    });
  },

  // Homework
  async getHomework() {
    return this.request("/homework");
  },

  async getHomeworkById(id: number) {
    return this.request(`/homework/${id}`);
  },

  async createHomework(data: any) {
    return this.request("/homework", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateHomework(id: number, data: any) {
    return this.request(`/homework/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteHomework(id: number) {
    return this.request(`/homework/${id}`, {
      method: "DELETE",
    });
  },

  async uploadHomeworkFile(homeworkId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("homeworkId", homeworkId.toString());
    return this.request("/files/upload", {
      method: "POST",
      body: formData,
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

  async getSubjectHistory(tutorId: number) {
    return this.request(`/progress/history/${tutorId}`);
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

  async deleteConnection(id: number, deleteData: boolean = true) {
    return this.request(`/connections/${id}?deleteData=${deleteData}`, {
      method: "DELETE",
    });
  },

  async createManualStudent(
    name: string,
    defaultSubject?: string,
    defaultPrice?: number,
    defaultDuration?: number,
    subjectIds?: number[],
  ) {
    return this.request("/connections/manual", {
      method: "POST",
      body: JSON.stringify({
        name,
        defaultSubject,
        defaultPrice,
        defaultDuration,
        subjectIds,
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
      subjectIds?: number[];
    },
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

  async getStudentStats(studentId: number) {
    return this.request(`/connections/${studentId}/stats`);
  },

  // Calendar - delete event
  async deleteEvent(id: number, recurring: boolean = false) {
    return this.request(
      `/calendar/${id}${recurring ? "?recurring=true" : ""}`,
      {
        method: "DELETE",
      },
    );
  },

  // Admin / Cleanup
  async clearAllData() {
    return this.request("/admin/clear-data", {
      method: "POST",
    });
  },

  // Avatar methods
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.request('/users/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  async deleteAvatar() {
    return this.request('/users/profile/avatar', {
      method: 'DELETE',
    });
  },

  getCurrencySymbol() {
    return localStorage.getItem("currency") || "$";
  },

  // Debug and utility functions
  clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currency");
    console.log("Authentication cleared");
  },

  clearAllLocalStorage() {
    localStorage.clear();
    console.log("All localStorage data cleared");
  },

  getAuthStatus() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return {
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
      userInfo: user ? JSON.parse(user) : null
    };
  },
};
