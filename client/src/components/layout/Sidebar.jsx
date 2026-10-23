import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return <aside className="sidebar reference-navbar"><nav className="reference-links"><NavLink to="/">Dashboard</NavLink><NavLink to="/employees">Employees</NavLink><NavLink to="/tasks">Tasks</NavLink></nav><strong className="reference-brand">MERN stack developer practical task</strong></aside>
}
