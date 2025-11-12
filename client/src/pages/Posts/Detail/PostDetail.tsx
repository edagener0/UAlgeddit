import { useEffect, useState } from "react"
import "./PostDetail.css"
import { type PostDetailI } from "./PostDetailInterface"
import { POST_DETAIL } from "../../../utils/Constants";
import { useParams } from "react-router-dom";

export default function PostDetail({token}: {token: string | null})
{
    const {id} = useParams();
    const [post, setPost] = useState<PostDetailI | null>(null);

    const getPost = async () => {
        const response = await fetch(`${POST_DETAIL}/${id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        )

        const data = await response.json()
        setPost(data);
    }

    useEffect(() => {
        getPost();
    })

    return (
        <div>
            <div id="title">
                <h1>{post?.title}</h1>
            </div>
            <div id="content">
                <p>{post?.content}</p>
            </div>
            <div id="media">
                <p>{post?.image}</p>
            </div>
            <div id="stats">
                <div id="upvotes-container">
                    
                </div>
                <div id="downvotes-container">

                </div>
            </div>
            <div id="comments">

            </div>
        </div>
    )
}