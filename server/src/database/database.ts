import * as sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import { UserModel } from '../models/User';
import { SubgedditModel } from '../models/Subgeddit';
import { ProfileModel } from '../models/Profile';
import { NotFound } from '../exceptions/NotFound';
import { PostModel } from '../models/Post';
import { Comment } from '../models/Comment';
import { FriendshipRequest } from '../models/FriendshipRequest';

class DatabaseHelper {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
    this.initTriggers();
  }
  
  public async insertUser(params: any[]): Promise<any>
  {
    const query = "insert into user (username, password) values (?, ?)";
    return await this.executeQuery(query, params);
  }

  public async insertSubgeddit(params: any[]): Promise<any>
  {
    const query = "insert into subgeddit (name, avatar, profile_id) values (?, ?, ?)";
    return await this.executeQuery(query, params);
  }

  public async getSubgeddit(params: any[]): Promise<SubgedditModel>
  {
    const query = "select * from subgeddit where id = ?"
    const response = await this.executeQuery(query, params);
    if (response.length == 0)
    {
      throw new NotFound("Subgeddit Not Found");
    }
    return response[0] as SubgedditModel
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

    if (params.avatar !== undefined)
    {
      updates.push("avatar = ?");
      values.push(params.avatar);
    }

    values.push(params.id);
    values.push(params.profileID)

    const query = `update subgeddit
    set ${updates.join(", ")} where id=? and profile_id = ?
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
    const query = `delete from subgeddit where id=? and profile_id = ?`

    const changes = await this.executeQueryGetChanges(query, params);
    if (changes == 0)
    {
      throw new NotFound("Subgeddit Not Found.")
    }
    return changes;
  }

  public async listSubgeddit(params: any[]): Promise<SubgedditModel[]>
  {
    const query = `select * from subgeddit`
    const response = await this.executeQuery(query, params)
    return response as SubgedditModel[]
  }

  public async insertPost(params: any[]): Promise<any>
  {
    const query = `insert into post (title, content, image, subgeddit_id, profile_id) values (?, ?, ?, ?, ?)`
    return await this.executeQuery(query, params);
  }

  public async getPost(params: any[]): Promise<PostModel>
  {
    const query = `select * from post where id = ?`
    const response = await this.executeQuery(query, params)
    if (response.length === 0)
    {
      throw new NotFound("Post not found.")
    }
    return response[0] as PostModel
  }

  public async listPost(params: any[]): Promise<PostModel[]>
  {
    const query = `select * from post`
    const response = await this.executeQuery(query, params);
    return response as PostModel[];
  }

  public async deletePost(params: any[]): Promise<any>
  {
    const query = `delete from post where id = ? and profile_id = ?`

    const changes = await this.executeQueryGetChanges(query, params)
    if (changes == 0)
    {
      throw new NotFound("Post to delete not found.")
    }
    return changes
  }

  public async upvotePost(params: any[]): Promise<any>
  {
    const query = `insert into vote (post_id, profile_id, num) values (?, ?, 1)`
    return await this.executeQuery(query, params);
  }

  public async downvotePost(params: any[]): Promise<any>
  {
    const query = `insert into vote (post_id, profile_id, num) values (?, ?, -1)`
    return await this.executeQuery(query, params);
  }
  
  public async updatePostVote(params: any[]): Promise<any>
  {
    const query = `update vote set num = ? where post_id = ? and profile_id = ?`
    const changes = await this.executeQueryGetChanges(query, params);
    return changes
  }

  public async deletePostVote(params: any[]): Promise<any>
  {
    const query = `delete from vote where post_id = ? and profile_id = ?`
    const changes = await this.executeQueryGetChanges(query, params)
    if (changes === 0)
    {
      throw new NotFound("User has no votes on this post.")
    }
    return changes
  }

  public async createComment(params: any[]): Promise<any>
  {
    const query = `insert into comment (content, post_id, profile_id)
    values (?, ?, ?);`

    return await this.executeQuery(query, params);
  }

  public async deleteComment(params: any[]): Promise<any>
  {
    const query = `delete from comment where id = ? and profile_id = ?;`
    const changes = await this.executeQueryGetChanges(query, params)
    if (changes === 0)
    {
      throw new NotFound("Comment to delete wasn't found.")
    }
    return changes
  }

  public async listComment(params: any[]): Promise<Comment[]>
  {
    const query = `select * from comment where post_id = ?`;
    const response = await this.executeQuery(query, params);
    return response as Comment[];
  }

  public async createFriendshipRequest(params: any[]): Promise<any>
  {
    const query = `insert into friend_request (from_profile_id, to_profile_id)
    values (?, ?);`
    return await this.executeQuery(query, params);
  }

  public async listReceivedFriendshipRequest(params: any[]): Promise<FriendshipRequest[]>
  {
    const query = `select * from friend_request where to_profile_id = ?`
    return await this.executeQuery(query, params);
  }

  public async acceptFriendshipRequest(params: any[]): Promise<any>
  {
    const query1 = `select * from friend_request where from_profile_id = ? and to_profile_id = ?`
    const friendRequests: FriendshipRequest[] = await this.executeQuery(query1, params)
    if (friendRequests.length === 0)
    {
      throw new NotFound("Friend Request not found.");
    }
    if (friendRequests[0] === undefined)
    {
      throw new NotFound("Friend Request not found.")
    }
    const friendRequest = friendRequests[0];
    const query2 = `insert into friend (profile_id, friend_id) values (?, ?);`;
    return await this.executeQuery(query2, [friendRequest.from_profile_id, friendRequest.to_profile_id]);
  }

  public async declineFriendshipRequest(params: any[]): Promise<any>
  {
    const query = `delete from friend_request where from_profile_id = ? and to_profile_id = ?`;
    const changes = await this.executeQueryGetChanges(query, params);
    if (changes === 0)
    {
      throw new NotFound("Friend Request to decline not found.");
    }
    return changes;
  }

  public async unfriend(params: any[]): Promise<any>
  {
    const query = `delete from friend where profile_id = ? and friend_id = ?`;
    const changes = await this.executeQueryGetChanges(query, params)
    if (changes === 0)
    {
      throw new NotFound("You are not friends with this user therefore you can't unfriend.");
    }
    return changes;
  }

  public async getUser(params: any[]): Promise<UserModel>
  {
    const query = "select * from user where username= ?";
    const response = await this.executeQuery(query, params);
    return response[0] as UserModel
  }

  public async getProfile(params: any[]): Promise<ProfileModel>
  {
    const query = "select * from profile where user_id = ?"
    const response = await this.executeQuery(query, params)
    if (response.length === 0)
    {
      throw new NotFound("Profile not found.")
    }
    return response[0] as ProfileModel
  }

  public close(): void {
    this.db.close();
  }

  private async initTables()
  {
    await this.createUserTable()
    await this.createProfileTable()
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
        password varchar(200) not null
    );`
    await this.runQuery(userTableCreationQuery);
  }

  private async createProfileTable()
  {
    // TODO COLOCAR UM AVATAR DEFAULT!!!!
    const profileTableCreationQuery = `create table if not exists profile (
      id integer constraint PK_profile_id primary key autoincrement,
      biography varchar(500),
      birthday date,
      karma integer default 0 constraint NN_profile_karma not null,
      avatar varchar(255),
      user_id integer constraint NN_profile_user_id2User not null,
      constraint FK_profile_user_id2User foreign key(user_id) references user
    );
    `
    await this.runQuery(profileTableCreationQuery);
  }

  private async createSubgedditTable()
  {
    // TODO colocar um avatar default!!!
    const subgedditTableCreationQuery = `create table if not exists subgeddit (
      id integer constraint PK_subgeddit_id primary key autoincrement,
      name varchar(40) constraint NN_subgeddit_name not null,
      avatar varchar(255),
      profile_id integer constraint NN_subgeddit_profile not null,
      constraint FK_subgeddit_profile_id2Profile foreign key(profile_id) references profile
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
      image varchar(255),
      subgeddit_id integer constraint NN_post_subgeddit not null,
      profile_id integer constraint NN_post_profile not null,
      constraint FK_post_subgeddit_id2Subgeddit foreign key(subgeddit_id) references subgeddit,
      constraint FK_post_profile_id2Profile foreign key(profile_id) references Profile
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
      profile_id integer constraint NN_comment_profile not null,
      constraint FK_comment_post_id2Post foreign key(post_id) references post,
      constraint FK_comment_profile_id2Profile foreign key(profile_id) references Profile
    );
    `
    
    await this.runQuery(commentTableCreationQuery);
  }

  private async createFriendRequestTable()
  {
    const friendRequestTableCreationQuery = `create table if not exists friend_request (
      from_profile_id integer,
      to_profile_id integer,
      constraint PK_friend_request_from_to primary key(from_profile_id, to_profile_id)
    );
    `

    await this.runQuery(friendRequestTableCreationQuery);
  }

  private async createFriendTable()
  {
    const friendTableCreationQuery = `create table if not exists friend (
      profile_id integer,
      friend_id integer,
      constraint PK_friend_id_profile_id primary key(profile_id, friend_id),
      constraint FK_friend_profile_id2Profile foreign key(profile_id) references profile,
      constraint FK_friend_friend_id2Profile foreign key(friend_id) references profile
    );
    `

    await this.runQuery(friendTableCreationQuery);
  }

  private async createVoteTable()
  {
    const upvoteTableCreationQuery = `create table if not exists vote (
      post_id integer,
      profile_id integer,
      vote_num integer check (vote_num == -1 or vote_num == 1),
      constraint PK_vote primary key(post_id, profile_id)
    );`

    await this.runQuery(upvoteTableCreationQuery);
  }

  private async initTriggers()
  {
    this.initProfileTrigger();
    this.karmaTriggers();
    this.friendTriggers();
  }

  private async initProfileTrigger()
  {
    const createProfileTrigger = `create trigger if not exists create_user_profile
    after insert on user
    for each row
    begin
      insert into profile (user_id) values (NEW.id);
    end;
    `

    this.runQuery(createProfileTrigger);
  }

  private async karmaTriggers()
  {
    const updateKarmaAfterVoteInsert = `create trigger if not exists vote_insert_trigger
    after insert on vote
    for each row
    begin
      update profile 
      set karma = karma + NEW.num 
      where id = (select post.profile_id from post where post.id = NEW.post_id);
    end;
    `
    const updateKarmaAfterVoteUpdate = `create trigger if not exists vote_update_trigger
    after update on vote
    for each row
    begin
      update profile
      set karma = karma - OLD.num + NEW.num
      where id = (select post.profile_id from post where post.id = NEW.post_id);
    end;
    `

    const updateKarmaOnVoteDelete = `create trigger if not exists vote_delete_trigger
    after delete on vote
    for each row
    begin
      update profile
      set karma = karma - OLD.num
      where id = (select post.profile_id from post where post.id = OLD.post_id);
    end;`

    this.runQuery(updateKarmaAfterVoteInsert);
    this.runQuery(updateKarmaAfterVoteUpdate);
    this.runQuery(updateKarmaOnVoteDelete);
  }

  private async friendTriggers()
  {
    const mutualFriendTrigger = `create trigger if not exists friend_insert_trigger
    after insert on friend
    for each row
    begin
      insert into friend (profile_id, friend_id) values (NEW.friend_id, NEW.profile_id);
      delete from friend_request 
      where (from_profile_id = NEW.profile_id and to_profile_id = NEW.friend_id) or
      (from_profile_id = NEW.friend_id and to_profile_id = NEW.profile_id);
    end;`;

    const unfriendTrigger = `create trigger if not exists friend_delete_trigger
    after delete on friend
    for each row
    begin
      delete from friend where profile_id = OLD.friend_id and friend_id = OLD.profile_id;
    end;`

    this.runQuery(mutualFriendTrigger);
    this.runQuery(unfriendTrigger);
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