import { useEffect, useState } from "react";
import "./SubgedditsDetail.css"
import type PostListI from "../../Posts/List/PostListInterface";
import { SUBGEDDIT_DETAIL } from "../../../utils/Constants";
import PostCard from "../../../components/PostCard/PostCard";
import { Link, useParams } from "react-router-dom";
import Button from "../../../components/DefaultButton/DefaultButton";

export default function SubgedditsDetail({token}: {token: string | null})
{

    const {subgeddit_id} = useParams();
    const [posts, setPosts] = useState<PostListI[]>([]);

    const fetchPosts = async () => {
        
        const response = await fetch(`${SUBGEDDIT_DETAIL}/${subgeddit_id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
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
            <div id="create-container">
                <Link to={"/posts/create"}>
                    <Button label="Create Post"/>
                </Link>
            </div>
            <div id="posts-container">
                {posts.map((post, index) => {
                    return <PostCard post={post} key={index}/>
                })}
            </div>
        </div>
    )
}