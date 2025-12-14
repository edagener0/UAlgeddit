import { Link, useParams } from "react-router-dom"
import "./Profile.css"
import { useEffect, useState } from "react"
import { FRIEND_ACCEPT, FRIEND_DECLINE, FRIEND_REQUEST, FRIEND_REQUEST_LIST, FRIEND_UNFRIEND, PROFILE_VIEW } from "../../../utils/Constants"
import type ProfileI from "./ProfileI"
import Button from "../../../components/DefaultButton/DefaultButton"
import type FriendRequest from "./FriendRequestI"

export default function Profile({token, currentUserID}: {token: string | null, currentUserID: number | null})
{
    const {user_id} = useParams()

    const [user, setUser] = useState<ProfileI | null>(null);

    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

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

    const sendFriendRequest = async () => {

        await fetch(`${FRIEND_REQUEST}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ to_user_id: user_id })
        });

        setUser(prev => prev ? { ...prev, isFriendRequestPending: true } : prev);
    };

    const fetchFriendRequests = async () => {

        const response = await fetch(`${FRIEND_REQUEST_LIST}`, {
            method: "GET",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        setFriendRequests(data);
    };
    
    const acceptFriendRequest = async (fromUserId: number) => {
        const response = await fetch(`${FRIEND_ACCEPT}`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ from_user_id: fromUserId })
        });

        if (response.status === 200) {
            
            setFriendRequests(prev => prev.filter(fr => fr.from_user_id !== fromUserId));

            if (String(fromUserId) === user_id) {
            setUser(prev =>
                prev
                ? {
                    ...prev,
                    areFriends: true,
                    isFriendRequestPending: false,
                    totalFriends: (prev.totalFriends ?? 0) + 1
                    }
                : prev
            );
            } else {
            
            
            setUser(prev =>
                prev
                ? {
                    ...prev,
                    totalFriends: (prev.totalFriends ?? 0) + 1
                    }
                : prev
            );
            }
        }
    };


    const declineFriendRequest = async (fromUserId: number) => {
        const response = await fetch(`${FRIEND_DECLINE}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ from_user_id: fromUserId })
        });

        if (response.status === 200) {
            setFriendRequests(prev => prev.filter(fr => fr.from_user_id !== fromUserId));

            if (String(fromUserId) === user_id) {
                setUser(prev => prev ? { ...prev, isFriendRequestPending: false } : prev);
            }
        }
    };


    const unfriend = async () => {
        const response = await fetch(`${FRIEND_UNFRIEND}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_id })
        });

         if (response.status === 200) {
            setUser(prev =>
            prev
                ? {
                    ...prev,
                    areFriends: false,
                    totalFriends: Math.max((prev.totalFriends ?? 0) - 1, 0)
                }
                : prev
            );
        }
    };


    useEffect(() => {
        fetchUser();
    }, [user_id])
    
    const isCurrentUser = currentUserID !== null && String(currentUserID) === user_id;

    useEffect(() => {
    if (isCurrentUser) {
        fetchFriendRequests();
    }
    }, [isCurrentUser]);

    if (!user)
    {
        return <p>User not found!</p>
    }

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

                <span id="friends">
                    <h3>Friends</h3>
                    <p>{user.totalFriends}</p>
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

                {!isCurrentUser && (
                    <div id="friendship-container">
                    {user.areFriends && (
                        <Button label="Unfriend" onclick={unfriend} />
                    )}

                    {!user.areFriends && !user.isFriendRequestPending && (
                        <Button label="Add Friend" onclick={sendFriendRequest} />
                    )}

                    {!user.areFriends && user.isFriendRequestPending && (
                        <p>Pending friendship</p>
                    )}
                    </div>
                )}

                {isCurrentUser && friendRequests.length > 0 && (
                        <div id="friend-requests-container">
                        <h3>Friend requests</h3>
                        {friendRequests.map(fr => (
                            <div key={fr.from_user_id} className="friend-request-item">
                            <Link to={`/profile/${fr.from_user_id}`} className="friend-request-header">
                                <h5>{fr.from_username}</h5>
                            </Link>
                            <span className="friend-request-actions">
                                <Button
                                label="Accept"
                                onclick={() => acceptFriendRequest(fr.from_user_id)}
                                />
                                <Button
                                label="Decline"
                                onclick={() => declineFriendRequest(fr.from_user_id)}
                                />
                            </span>
                            </div>
                        ))}
                        </div>
                    )}


            </div>
    )
}