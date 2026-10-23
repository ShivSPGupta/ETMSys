import "dotenv/config";
import mongoose from "mongoose";
import Employee from "./models/Employee.js";
import Task from "./models/Task.js";
import { connectDatabase } from "./config/database.js";

const today = new Date().toISOString().slice(0, 10);
const pastDate = "2026-09-15";
const futureDate = "2026-11-30";

const initialEmployees = [
  {
    employeeId: "EMP-001",
    fullName: "Olivia Rhye",
    email: "olivia.rhye@example.com",
    phone: "+1 (555) 012-3456",
    department: "Design",
    role: "Product Designer",
    joiningDate: "2023-03-14",
    status: "Active",
    skills: ["Figma", "Prototyping", "UI Design"],
  },
  {
    employeeId: "EMP-002",
    fullName: "Phoenix Baker",
    email: "phoenix.baker@example.com",
    phone: "+1 (555) 011-4398",
    department: "Development",
    role: "Engineering Lead",
    joiningDate: "2022-08-01",
    status: "Active",
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    employeeId: "EMP-003",
    fullName: "Lana Steiner",
    email: "lana.steiner@example.com",
    phone: "+1 (555) 010-2093",
    department: "Development",
    role: "Frontend Engineer",
    joiningDate: "2024-01-08",
    status: "On Leave",
    leaveStart: "2026-10-20",
    leaveEnd: "2026-10-28",
    skills: ["React", "CSS", "Accessibility"],
  },
  {
    employeeId: "EMP-004",
    fullName: "Demi Wilkinson",
    email: "demi.wilkinson@example.com",
    phone: "+1 (555) 010-4472",
    department: "QA",
    role: "QA Engineer",
    joiningDate: "2023-06-19",
    status: "Active",
    skills: ["Automation", "Playwright", "Testing"],
  },
  {
    employeeId: "EMP-005",
    fullName: "Candice Wu",
    email: "candice.wu@example.com",
    phone: "+1 (555) 010-3821",
    department: "Sales",
    role: "Account Manager",
    joiningDate: "2021-11-02",
    status: "Inactive",
    skills: ["Brand", "Content", "Strategy"],
  },
  {
    employeeId: "EMP-006",
    fullName: "Natali Craig",
    email: "natali.craig@example.com",
    phone: "+1 (555) 010-9142",
    department: "HR",
    role: "People Partner",
    joiningDate: "2024-02-12",
    status: "Active",
    skills: ["Recruiting", "Culture"],
  },
  {
    employeeId: "EMP-007",
    fullName: "Drew Cano",
    email: "drew.cano@example.com",
    phone: "+1 (555) 010-8134",
    department: "Sales",
    role: "Account Executive",
    joiningDate: "2023-09-25",
    status: "Active",
    skills: ["Sales", "CRM", "Negotiation"],
  },
  {
    employeeId: "EMP-008",
    fullName: "Orlando Diggs",
    email: "orlando.diggs@example.com",
    phone: "+1 (555) 010-9102",
    department: "Development",
    role: "Backend Engineer",
    joiningDate: "2022-03-02",
    status: "Active",
    skills: ["Node.js", "MongoDB", "APIs"],
  },
];

export async function seed() {
  await connectDatabase();
  console.log("Connected to database for seeding.");

  await Task.deleteMany({});
  await Employee.deleteMany({});
  console.log("Cleared existing records.");

  const createdEmployees = await Employee.insertMany(initialEmployees);
  console.log(`Created ${createdEmployees.length} employees.`);

  const empByCode = Object.fromEntries(
    createdEmployees.map((e) => [e.employeeId, e]),
  );

  const snapshot = (employee) => ({
    fullName: employee.fullName,
    employeeId: employee.employeeId,
    email: employee.email,
    department: employee.department,
    role: employee.role,
  });

  const initialTasks = [
    {
      title: "Redesign the dashboard analytics",
      description: "Refresh the analytics dashboard for the Q4 release.",
      employee: empByCode["EMP-001"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-001"]),
      department: "Design",
      priority: "High",
      status: "In Progress",
      startDate: pastDate,
      dueDate: pastDate, // Overdue task!
      createdDate: pastDate,
    },
    {
      title: "Update brand guidelines",
      description: "Document the refreshed brand and component tokens.",
      employee: empByCode["EMP-001"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-001"]),
      department: "Design",
      priority: "Low",
      status: "Completed",
      startDate: pastDate,
      dueDate: today,
      createdDate: pastDate,
      completedDate: today,
    },
    {
      title: "Implement user authentication flow",
      description: "Complete the new sign in and registration experience.",
      employee: empByCode["EMP-002"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-002"]),
      department: "Development",
      priority: "Critical",
      status: "In Progress",
      startDate: pastDate,
      dueDate: futureDate,
      createdDate: pastDate,
    },
    {
      title: "Prepare sprint planning agenda",
      description: "Collect priorities and estimates for sprint planning.",
      employee: empByCode["EMP-002"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-002"]),
      department: "Development",
      priority: "High",
      status: "Todo",
      startDate: today,
      dueDate: futureDate,
      createdDate: today,
    },
    {
      title: "QA testing for mobile release",
      description: "Run regression suite on the latest mobile build.",
      employee: empByCode["EMP-004"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-004"]),
      department: "QA",
      priority: "Medium",
      status: "Todo",
      startDate: pastDate,
      dueDate: pastDate, // Overdue task!
      createdDate: pastDate,
    },
    {
      title: "Review Q4 hiring plan",
      description: "Align hiring plan with department leads.",
      employee: empByCode["EMP-006"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-006"]),
      department: "HR",
      priority: "Medium",
      status: "Todo",
      startDate: today,
      dueDate: futureDate,
      createdDate: today,
    },
    {
      title: "Customer onboarding improvements",
      description: "Map and update the customer onboarding touchpoints.",
      employee: empByCode["EMP-007"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-007"]),
      department: "Sales",
      priority: "High",
      status: "In Progress",
      startDate: pastDate,
      dueDate: futureDate,
      createdDate: pastDate,
    },
    {
      title: "Optimize MongoDB aggregation queries",
      description: "Improve index usage for analytics queries.",
      employee: empByCode["EMP-008"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-008"]),
      department: "Development",
      priority: "High",
      status: "Todo",
      startDate: today,
      dueDate: futureDate,
      createdDate: today,
    },
    {
      title: "Legacy reporting migration",
      description: "Migrated legacy reporting to new warehouse.",
      employee: empByCode["EMP-008"]._id,
      employeeSnapshot: snapshot(empByCode["EMP-008"]),
      department: "Development",
      priority: "Low",
      status: "Cancelled",
      startDate: pastDate,
      dueDate: pastDate,
      createdDate: pastDate,
    },
  ];

  const createdTasks = await Task.insertMany(initialTasks);
  console.log(`Created ${createdTasks.length} tasks.`);
  await mongoose.disconnect();
  console.log("Seeding complete.");
}

if (process.argv[1]?.endsWith("seed.js")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

