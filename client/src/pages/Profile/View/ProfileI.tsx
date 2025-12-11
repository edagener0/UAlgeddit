export default interface ProfileI {
    id: number
    username: string
    biography: string
    birthday: string
    karma: number
    areFriends: boolean;
    isFriendRequestPending: boolean;
    totalFriends: number;
}