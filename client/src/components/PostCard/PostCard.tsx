import type PostListI from "../../pages/Posts/List/PostListInterface"
import "./PostCard.css"
import { Link } from "react-router-dom";
export default function PostCard({post}: {post: PostListI})
{
    return (
        
            <div className="post-card">
                <Link className="post-card-header" to={`/posts/${post.post_id}`}>
                    <h1 className="post-card-title">Post: {post.title}</h1>
                </Link>
                <Link className="post-card-body" to={`/subgeddits/${post.subgeddit_id}`}>
                    <h4 className="post-card-subgeddit">Subgeddit: {post.subgeddit_name}</h4>
                </Link>
                <div className="post-card-footer">
                    <h4 className="post-card-author">Author: {post.username}</h4>
                </div>
                <div className="posts-stats">
                    <div className="post-upvotes">
                        <h5>Upvotes: {post.upvotes}</h5>
                    </div>
                    <div className="post-downvotes">
                        <h5>Downvotes: {post.downvotes}</h5>
                    </div>
                </div>
            </div>
    )
}