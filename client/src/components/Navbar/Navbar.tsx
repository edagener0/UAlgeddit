import "./Navbar.css"
import NavItem from "./NavItem/NavItem"
import NavMenu from "./NavMenu/NavMenu"
export default function Navbar({token}: {token: string | null})
{
    return (
        <div className="navbar">
            <NavMenu>
                <NavItem href="/" label="Home"/>
                {token ? (
                    <>
                        <NavItem href="/posts" label="Posts"/>
                        <NavItem href="/auth/logout" label="Logout"/>
                    </>
                    
                ): (
                    <>
                        <NavItem href="/auth/register" label="Register"/>
                        <NavItem href="/auth/login" label="Login"/>

                    </>
                )}
                
            </NavMenu>
        </div>
    )
}