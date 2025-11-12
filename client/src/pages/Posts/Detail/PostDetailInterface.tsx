export interface PostDetailI {
    post_id: number;
    title: string;
    content: string;
    image: string;
    upvotes: number;
    downvotes: number;
    subgeddit_id: number;
    subgeddit_name: string;
    profile_id: number;
    profile_name: string;
}