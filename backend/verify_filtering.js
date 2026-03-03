const API_URL = "http://localhost:3000";

async function request(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  try {
    const uniqueSuffix = Date.now();

    // 1. Register Tutor
    console.log("Registering Tutor...");
    const tutorAuth = await request("/auth/register", "POST", {
      email: `tutor_${uniqueSuffix}@test.com`,
      password: "password123",
      name: "Tutor Test",
      role: "tutor",
    });
    console.log("Tutor Auth Response:", JSON.stringify(tutorAuth, null, 2));
    const tutorToken = tutorAuth.access_token;
    const tutorCode = tutorAuth.user.code;
    console.log(`Tutor registered. Code: ${tutorCode}`);

    // 2. Register Student
    console.log("Registering Student...");
    const studentAuth = await request("/auth/register", "POST", {
      email: `student_${uniqueSuffix}@test.com`,
      password: "password123",
      name: "Student Test",
      role: "student",
    });
    const studentToken = studentAuth.access_token;
    console.log("Student registered.");

    // 3. Create Subjects
    console.log("Creating Subjects...");
    const mathSubject = await request(
      "/subjects",
      "POST",
      { name: "Math", color: "#ff0000" },
      tutorToken,
    );
    console.log(`Created Math subject (ID: ${mathSubject.id})`);

    const physicsSubject = await request(
      "/subjects",
      "POST",
      { name: "Physics", color: "#00ff00" },
      tutorToken,
    );
    console.log(`Created Physics subject (ID: ${physicsSubject.id})`);

    // 4. Connect Student to Tutor
    console.log("Connecting Student to Tutor...");
    const connectionRequest = await request(
      "/connections/request",
      "POST",
      { code: tutorCode },
      studentToken,
    );
    console.log("Connection requested.");

    // 5. Approve Connection
    console.log("Approving Connection...");
    // We need connection ID. Tutor can list pending requests.
    const pendingRequests = await request(
      "/connections/pending",
      "GET",
      null,
      tutorToken,
    );
    const connectionId = pendingRequests.find(
      (r) => r.studentId === studentAuth.user.id,
    ).id;

    await request(
      `/connections/${connectionId}/approve`,
      "POST",
      {},
      tutorToken,
    );
    console.log("Connection approved.");

    // 6. Assign Subject (Math only)
    console.log("Assigning Math subject to connection...");
    await request(
      `/connections/${connectionId}/subjects`,
      "POST",
      { subjectIds: [mathSubject.id] },
      tutorToken,
    );
    console.log("Subject assigned.");

    // 7. Verify Files Access
    console.log("Verifying Student Access...");
    const files = await request("/files", "GET", null, studentToken);

    const folderNames = files.folders.map((f) => f.name);
    console.log("Visible folders:", folderNames);

    if (folderNames.includes("Math") && !folderNames.includes("Physics")) {
      console.log("SUCCESS: Student sees Math but not Physics.");
    } else {
      console.error("FAILURE: Visibility check failed.");
      console.error("Expected: Math, NOT Physics");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
