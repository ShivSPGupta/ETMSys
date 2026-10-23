import { Link } from "react-router-dom";
import { Avatar } from "../common/index.jsx";

export default function EmployeeIdentity({ employee }) {
  return (
    <Link
      to={`/employees/${employee._id}`}
      className="assignee-cell employee-cell"
    >
      <Avatar name={employee.fullName} color={employee.color} />
      <span>
        <b>{employee.fullName}</b>
        <small>{employee.email}</small>
      </span>
    </Link>
  );
}
