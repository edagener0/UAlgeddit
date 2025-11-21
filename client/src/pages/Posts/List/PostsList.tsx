import { useEffect, useState } from "react";
import PostCard from "../../../components/PostCard/PostCard"
import { POST_LIST } from "../../../utils/Constants"
import "./PostsList.css"
import type PostListI from "./PostListInterface";

export default function ListPosts({token}: {token: string | null})
{
    const [posts, setPosts] = useState<PostListI[]>([]);

    const fetchPosts = async () => {
        
        const response = await fetch(`${POST_LIST}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            }
        )

        const data = await response.json();
        setPosts(data);
    }

    useEffect(() => {
        fetchPosts();
    }, [])

    return (
        <div>
            <div id="posts-container">
                {posts.map((post, index) => {
                    return <PostCard post={post} key={index}/>
                })}
            </div>
        </div>
        
    )
}