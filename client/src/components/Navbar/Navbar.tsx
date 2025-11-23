import NavDropMenu from "../NavDropMenu/NavDropMenu"
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
                        <NavDropMenu label="Subgeddits">
                            <NavItem href="/subgeddits" label="Discover"/>
                            <NavItem href="/subgeddits/create" label="Create"/>
                        </NavDropMenu>
                        <NavItem href="/posts" label="Posts"/>
                        <NavItem href="/chat" label="Chat"/>
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