import "./NavMenu.css"

export default function NavMenu({children}: {children: React.ReactNode})
{
    return (
        <li className="navmenu">
            {children}
        </li>
    )
}