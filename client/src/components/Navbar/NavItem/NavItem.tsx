import "./NavItem.css"
import { Link } from "react-router-dom";
export default function NavItem({href, label}: {href: string, label: string})
{
    return (
        <Link className="navitem" to={href}>{label}</Link>
    )
}