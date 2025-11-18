import "./NavDropMenu.css"

export default function NavDropMenu({children, label}: {children: React.ReactNode, label: string})
{
    return (
        <div className="dropdown">
            <button className="dropbtn">{label}</button>
            <div className="dropdown-content">
                {children}
            </div>
        </div>
    )
}