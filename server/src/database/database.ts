import * as sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import { NotFound } from '../exceptions/NotFound';


class DatabaseHelper {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
    const init = async () => {
      await this.initTables();
      await this.initTriggers();
    }

    init()

    
  }
  
  public async insertUser(params: any[]): Promise<any>
  {
    const query = "insert into user (username, password) values (?, ?)";
    return await this.executeQuery(query, params);
  }

  public async insertSubgeddit(params: any[]): Promise<any>
  {
    const query = "insert into subgeddit (name, user_id) values (?, ?)";
    return await this.executeQuery(query, params);
  }

  public async getSubgeddit(params: any[]): Promise<any>
  {
    const query = "select * from subgeddit where id = ?"
    const response = await this.executeQuery(query, params);
    if (response.length == 0)
    {
      throw new NotFound("Subgeddit Not Found");
    }
    return response[0]
  }

  public async updateSubgeddit(params: any): Promise<any>
  {
    const updates: string[] = []
    const values: string[] = []

    if (params.name !== undefined)
    {
      updates.push("name = ?");
      values.push(params.name);
    }

    values.push(params.id);
    values.push(params.userID)

    const query = `update subgeddit
    set ${updates.join(", ")} where id=? and user_id = ?
    `
    const changes = await this.executeQueryGetChanges(query, values);
    
    if (changes == 0)
    {
      throw new NotFound("Subgeddit Not Found");
    }
    return changes;
  }

  public async deleteSubgeddit(params: any[]): Promise<any>
  {
    const query = `delete from subgeddit where id=? and user_id = ?`

    const changes = await this.executeQueryGetChanges(query, params);
    if (changes == 0)
    {
      throw new NotFound("Subgeddit Not Found.")
    }
    return changes;
  }

  public async listSubgeddit(params: any[]): Promise<any>
  {
    const query = `select subgeddit.id as subgeddit_id, subgeddit.name, user.username as owner, user.id as owner_user_id
    from subgeddit, user 
    where subgeddit.user_id = user.id `
    const response = await this.executeQuery(query, params)
    return response
  }

  public async insertPost(params: any[]): Promise<any>
  {
    const query = `insert into post (title, content, subgeddit_id, user_id) values (?, ?, ?, ?)`
    return await this.executeQuery(query, params);
  }

  public async getPost(params: any[]): Promise<any>
  {
    const query = `select *, (select count(*) from vote 
    where vote.vote_num = -1 and post_id = post.id) as downvotes, 
    (select count(*) from vote where vote.vote_num = 1 and post_id = post.id) as upvotes,
    (select exists(select * from vote where post_id = post.id and vote_num = 1 and user_id = ?)) as has_upvoted,
    (select exists(select * from vote where post_id = post.id and vote_num = -1 and user_id = ?)) as has_downvoted
    from post where id = ?`
    const response = await this.executeQuery(query, params)
    if (response.length === 0)
    {
      throw new NotFound("Post not found.")
    }
    return response[0]
  }

  public async listPostForSubgeddit(params: any[]): Promise<any>
  {
    const query = `select post.id as post_id, user.username, user.id as user_id, subgeddit_id as subgeddit_id, subgeddit.name as subgeddit_name, post.title,
    (select count(*) from vote where vote.vote_num = -1 and post_id = post.id) as downvotes, (select count(*) from vote where vote.vote_num = 1 and post_id = post.id) as upvotes
    from post, user, subgeddit where post.user_id = user.id and post.subgeddit_id = subgeddit.id and post.subgeddit_id = ?`;
    const response = await this.executeQuery(query, params)

    return response;
  }

  public async listPost(params: any[]): Promise<any>
  {
    const query = `select post.id as post_id, user.username, user.id as user_id, subgeddit_id as subgeddit_id, subgeddit.name as subgeddit_name, post.title,
    (select count(*) from vote where vote.vote_num = -1 and post_id = post.id) as downvotes, (select count(*) from vote where vote.vote_num = 1 and post_id = post.id) as upvotes
    from post, user, subgeddit where post.user_id = user.id and post.subgeddit_id = subgeddit.id`
    const response = await this.executeQuery(query, params);
    return response;
  }

  public async deletePost(params: any[]): Promise<any>
  {
    const query = `delete from post where id = ? and user_id = ?`

    const changes = await this.executeQueryGetChanges(query, params)
    if (changes == 0)
    {
      throw new NotFound("Post to delete not found.")
    }
    return changes
  }

  public async upvotePost(params: any[]): Promise<any>
  {
    const query = `insert into vote (post_id, user_id, vote_num) values (?, ?, 1)`
    return await this.executeQuery(query, params);
  }

  public async downvotePost(params: any[]): Promise<any>
  {
    const query = `insert into vote (post_id, user_id, vote_num) values (?, ?, -1)`
    return await this.executeQuery(query, params);
  }
  
  public async updatePostVote(params: any[]): Promise<any>
  {
    const query = `update vote set vote_num = ? where post_id = ? and user_id = ?`
    const changes = await this.executeQueryGetChanges(query, params);
    return changes
  }

  public async deletePostVote(params: any[]): Promise<any>
  {
    const query = `delete from vote where post_id = ? and user_id = ?`
    const changes = await this.executeQueryGetChanges(query, params)
    if (changes === 0)
    {
      throw new NotFound("User has no votes on this post.")
    }
    return changes
  }

  public async createComment(params: any[]): Promise<any>
  {
    const query = `insert into comment (content, post_id, user_id)
    values (?, ?, ?);`

    return await this.executeQuery(query, params);
  }

  public async deleteComment(params: any[]): Promise<any>
  {
    const query = `delete from comment where id = ? and user_id = ?;`
    const changes = await this.executeQueryGetChanges(query, params)
    if (changes === 0)
    {
      throw new NotFound("Comment to delete wasn't found.")
    }
    return changes
  }

  public async listComment(params: any[]): Promise<any>
  {
    const query = `select comment.id, comment.content, comment.post_id, comment.user_id, user.username from comment, user where comment.user_id = user.id and post_id = ?`;
    const response = await this.executeQuery(query, params);
    return response;
  }

  public async createFriendshipRequest(params: any[]): Promise<any>
  {
    const query = `insert into friend_request (from_user_id, to_user_id)
    values (?, ?);`
    return await this.executeQuery(query, params);
  }

  public async listReceivedFriendshipRequest(params: any[]): Promise<any>
  {
    const query = `select * from friend_request where to_user_id = ?`
    return await this.executeQuery(query, params);
  }

  public async getTotalUserFriendsByUserID(params: any[]): Promise<any>
  {
    const query = `
    select count(*) as total_friends
    from friend
    where user_id = ?
    `;
    return (await this.executeQuery(query, params))[0]["total_friends"];
  }
  public async acceptFriendshipRequest(params: any[]): Promise<any>
  {
    const query1 = `select * from friend_request where from_user_id = ? and to_user_id = ?`
    const friendRequests = await this.executeQuery(query1, params)
    if (friendRequests.length === 0)
    {
      throw new NotFound("Friend Request not found.");
    }
    if (friendRequests[0] === undefined)
    {
      throw new NotFound("Friend Request not found.")
    }
    const friendRequest = friendRequests[0];
    const query2 = `insert into friend (user_id, friend_id) values (?, ?);`;
    return await this.executeQuery(query2, [friendRequest.from_user_id, friendRequest.to_user_id]);
  }

  public async declineFriendshipRequest(params: any[]): Promise<any>
  {
    const query = `delete from friend_request where from_user_id = ? and to_user_id = ?`;
    const changes = await this.executeQueryGetChanges(query, params);
    if (changes === 0)
    {
      throw new NotFound("Friend Request to decline not found.");
    }
    return changes;
  }

  public async unfriend(params: any[]): Promise<any>
  {
    const query = `delete from friend where user_id = ? and friend_id = ?`;
    const changes = await this.executeQueryGetChanges(query, params)
    if (changes === 0)
    {
      throw new NotFound("You are not friends with this user therefore you can't unfriend.");
    }
    return changes;
  }

  public async getUser(params: any[]): Promise<any>
  {
    const query = "select * from user where username = ?";
    const response = await this.executeQuery(query, params);
    if (response.length === 0)
    {
      throw new NotFound("User not found!")
    }
    return response[0]
  }

  public async getUserFromId(params: any[]): Promise<any>
  {
    const query = "select id, username, biography, birthday, karma from user where id = ?";
    const response = await this.executeQuery(query, params);
    if (response.length === 0)
    {
      throw new NotFound("User not found!")
    }
    return response[0]
  }

  public async areFriends(userId: number | string, otherUserId: number | string): Promise<boolean> 
  {
    const query = `
      select 1
      from friend
      where (user_id = ? and friend_id = ?)
        or (user_id = ? and friend_id = ?)
      limit 1
    `;
    const rows = await this.executeQuery(query, [userId, otherUserId, otherUserId, userId]);
    return rows.length > 0;
  }

  public async existsFriendRequest(fromUserId: number | string, toUserId: number | string): Promise<boolean> 
  {
    const query = `
      select 1
      from friend_request
      where from_user_id = ? and to_user_id = ?
      limit 1
    `;
    const rows = await this.executeQuery(query, [fromUserId, toUserId]);
    return rows.length > 0;
  }

  public async updateUserProfile(params: any[]): Promise<any> 
  {
    const query = "update user set biography = ?, birthday = ? where id = ?";
    const changes = await this.executeQueryGetChanges(query, params);
    if (changes === 0)
    {
      throw new NotFound("User not found!")
    }
    return changes
  }


  public close(): void {
    this.db.close();
  }

  private async initTables()
  {
    await this.createUserTable()
    await this.createSubgedditTable()
    await this.createPostTable()
    await this.createCommentsTable()
    await this.createFriendRequestTable()
    await this.createFriendTable()
    await this.createVoteTable()
  }

  private async createUserTable()
  {
    const userTableCreationQuery = `create table if not exists user (
        id integer constraint PK_user primary key autoincrement,
        username varchar(50) not null constraint UK_user_username unique,
        password varchar(200) not null,
        biography varchar(500) default null,
        birthday date default null,
        karma integer default 0 constraint NN_profile_karma not null
    );`
    await this.runQuery(userTableCreationQuery);
  }

  private async createSubgedditTable()
  {
    const subgedditTableCreationQuery = `create table if not exists subgeddit (
      id integer constraint PK_subgeddit_id primary key autoincrement,
      name varchar(40) constraint NN_subgeddit_name not null,
      user_id integer constraint NN_subgeddit_profile not null,
      constraint FK_subgeddit_user_id2User foreign key(user_id) references user
    );
    `
    await this.runQuery(subgedditTableCreationQuery);
  }

  private async createPostTable()
  {
    const postTableCreationQuery = `create table if not exists post (
      id integer constraint PK_post_id primary key autoincrement,
      title varchar(150) constraint NN_post_name not null,
      content text constraint NN_post_content not null,
      subgeddit_id integer constraint NN_post_subgeddit not null,
      user_id integer constraint NN_post_profile not null,
      constraint FK_post_subgeddit_id2Subgeddit foreign key(subgeddit_id) references subgeddit,
      constraint FK_post_user_id2User foreign key(user_id) references user
    );
    `
    await this.runQuery(postTableCreationQuery);
  }

  private async createCommentsTable()
  {
    const commentTableCreationQuery = `create table if not exists comment (
      id integer constraint PK_comment_id primary key autoincrement,
      content text constraint NN_comment_content not null,
      post_id integer constraint NN_comment_post_id not null,
      user_id integer constraint NN_comment_user not null,
      constraint FK_comment_post_id2Post foreign key(post_id) references post,
      constraint FK_comment_user_id2User foreign key(user_id) references user
    );
    `
    
    await this.runQuery(commentTableCreationQuery);
  }

  private async createFriendRequestTable()
  {
    const friendRequestTableCreationQuery = `create table if not exists friend_request (
      from_user_id integer,
      to_user_id integer,
      constraint PK_friend_request_from_to primary key(from_user_id, to_user_id)
    );
    `

    await this.runQuery(friendRequestTableCreationQuery);
  }

  private async createFriendTable()
  {
    const friendTableCreationQuery = `create table if not exists friend (
      user_id integer,
      friend_id integer,
      constraint PK_friend_id_user_id primary key(user_id, friend_id),
      constraint FK_friend_user_id2User foreign key(user_id) references user,
      constraint FK_friend_friend_id2User foreign key(friend_id) references user
    );
    `

    await this.runQuery(friendTableCreationQuery);
  }

  private async createVoteTable()
  {
    const upvoteTableCreationQuery = `create table if not exists vote (
      post_id integer,
      user_id integer,
      vote_num integer check (vote_num == -1 or vote_num == 1),
      constraint PK_vote primary key(post_id, user_id)
    );`

    await this.runQuery(upvoteTableCreationQuery);
  }

  private async initTriggers()
  {
    await this.friendTriggers();
    await this.karmaTriggers();
  }

  private async karmaTriggers()
  {
    const updateKarmaAfterVoteInsert = `create trigger if not exists vote_insert_trigger
    after insert on vote
    for each row
    begin
      update user 
      set karma = karma + NEW.vote_num 
      where id = (select post.user_id from post where post.id = NEW.post_id);
    end;
    `
    const updateKarmaAfterVoteUpdate = `create trigger if not exists vote_update_trigger
    after update on vote
    for each row
    begin
      update user
      set karma = karma - OLD.vote_num + NEW.vote_num
      where id = (select post.user_id from post where post.id = NEW.post_id);
    end;
    `

    const updateKarmaOnVoteDelete = `create trigger if not exists vote_delete_trigger
    after delete on vote
    for each row
    begin
      update user
      set karma = karma - OLD.vote_num
      where id = (select post.user_id from post where post.id = OLD.post_id);
    end;`

    await this.runQuery(updateKarmaAfterVoteInsert);
    await this.runQuery(updateKarmaAfterVoteUpdate);
    await this.runQuery(updateKarmaOnVoteDelete);
  }

  private async friendTriggers()
  {
    const mutualFriendTrigger = `create trigger if not exists friend_insert_trigger
    after insert on friend
    for each row
    begin
      insert into friend (user_id, friend_id) values (NEW.friend_id, NEW.user_id);
      delete from friend_request 
      where (from_user_id = NEW.user_id and to_user_id = NEW.friend_id) or
      (from_user_id = NEW.friend_id and to_user_id = NEW.user_id);
    end;`;

    const unfriendTrigger = `create trigger if not exists friend_delete_trigger
    after delete on friend
    for each row
    begin
      delete from friend where user_id = OLD.friend_id and friend_id = OLD.user_id;
    end;`

    await this.runQuery(mutualFriendTrigger);
    await this.runQuery(unfriendTrigger);
  }

  private async executeQuery(query: string, params: any[]): Promise<any[]> 
  {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  private async executeQueryGetChanges(query: string, params: any[]): Promise<number>
  {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) 
        {
          reject(err);
        } 
        else 
        {
          resolve(this.changes);
        }
      });
    });
  }

  private async runQuery(query: string): Promise<void> 
  {
      return new Promise<void>((resolve, reject) => {
      this.db.run(query, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export const db = new DatabaseHelper("database.db");