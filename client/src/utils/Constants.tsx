const DOMAIN = "127.0.0.1:3000"
const URL = `http://${DOMAIN}`

const AUTH_URL = `${URL}/auth`

export const LOGIN_URL = `${AUTH_URL}/login`

export const REGISTER_URL = `${AUTH_URL}/register`

export const LOGOUT_URL = `${AUTH_URL}/logout`


const POST_URL = `${URL}/post`

export const POST_LIST = `${POST_URL}/list`

export const POST_DETAIL = `${POST_URL}/detail`

export const POST_CREATE = `${POST_URL}/create`

export const POST_DELETE = `${POST_URL}/delete`

export const POST_UPVOTE = `${POST_URL}/upvote`

export const POST_DOWNVOTE = `${POST_URL}/downvote`

export const POST_UNVOTE = `${POST_URL}/unvote`

const COMMENT_URL = `${URL}/comment`

export const COMMENT_LIST = `${COMMENT_URL}/list`
export const COMMENT_CREATE = `${COMMENT_URL}/create`
export const COMMENT_DELETE = `${COMMENT_URL}/delete`

const SUBGEDDIT_URL = `${URL}/subgeddit`

export const SUBGEDDIT_CREATE = `${SUBGEDDIT_URL}/create`
export const SUBGEDDIT_LIST = `${SUBGEDDIT_URL}/list`

export const SUBGEDDIT_DETAIL = `${SUBGEDDIT_URL}/detail`


export const GLOBAL_CHAT_WS_URL = `ws://${DOMAIN}/chat/global`