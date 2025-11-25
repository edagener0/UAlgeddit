import { Link, useParams } from "react-router-dom"
import "./Profile.css"
import { useEffect, useState } from "react"
import { PROFILE_VIEW } from "../../../utils/Constants"
import type ProfileI from "./ProfileI"

export default function Profile({token, currentUserID}: {token: string | null, currentUserID: number | null})
{
    const {user_id} = useParams()

    const [user, setUser] = useState<ProfileI | null>(null);

    const fetchUser = async () => {
            
            const response = await fetch(`${PROFILE_VIEW}/${user_id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
    
            const data = await response.json();
            setUser(data);
        }
    
    useEffect(() => {
        fetchUser();
    }, [])
        
    if (!user)
    {
        return <p>User not found!</p>
    }
    
    const isCurrentUser = currentUserID !== null && String(currentUserID) === user_id;

    return (
            <div id="container">
                <span id="username-container">
                    <h3>Username</h3>
                    <p>{user.username}</p>
                </span>
                <span id="karma-container">
                    <h3>Karma</h3>
                    <p>{user.karma}</p>
                </span>
                {user.birthday ? (
                    <span id="birthday-container">
                        <h3>Birthday</h3>
                        <p>{user.birthday}</p>
                    </span>
                ): (
                    <></>
                )}
                
                {user.biography ? (
                    <span id="biography-container">
                        <h3>Biography</h3>
                        <p>{user.biography}</p>
                    </span>
                ): (
                    <></>
                )}
                {isCurrentUser && (
                    <Link id="update-profile-container" to={`/profile/update/${user_id}`}>
                        <p>Update</p>
                    </Link>
                )}
            </div>
    )
}