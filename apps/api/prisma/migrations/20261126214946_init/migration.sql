-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "bio" VARCHAR(500),
    "birthday" DATE,
    "avatar_url" VARCHAR(255),
    "karma" INTEGER NOT NULL DEFAULT 0,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subgeddits" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(21) NOT NULL,
    "name_lower" VARCHAR(21) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "icon_url" VARCHAR(255),
    "banner_url" VARCHAR(255),
    "owner_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subgeddits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "subgeddit_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "hot_rank" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_images" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "post_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_images" (
    "id" SERIAL NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "comment_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_votes" (
    "user_id" INTEGER NOT NULL,
    "post_id" INTEGER NOT NULL,
    "value" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_votes_pkey" PRIMARY KEY ("user_id","post_id")
);

-- CreateTable
CREATE TABLE "comment_votes" (
    "user_id" INTEGER NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "value" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("user_id","comment_id")
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "from_id" INTEGER NOT NULL,
    "to_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("from_id","to_id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "user_a_id" INTEGER NOT NULL,
    "user_b_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("user_a_id","user_b_id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "author_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "subgeddits_name_lower_key" ON "subgeddits"("name_lower");

-- CreateIndex
CREATE INDEX "subgeddits_owner_id_idx" ON "subgeddits"("owner_id");

-- CreateIndex
CREATE INDEX "posts_subgeddit_id_created_at_idx" ON "posts"("subgeddit_id", "created_at");

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "posts_hot_rank_idx" ON "posts"("hot_rank");

-- CreateIndex
CREATE INDEX "posts_score_idx" ON "posts"("score");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_images_post_id_position_key" ON "post_images"("post_id", "position");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_images_comment_id_position_key" ON "comment_images"("comment_id", "position");

-- CreateIndex
CREATE INDEX "post_votes_post_id_idx" ON "post_votes"("post_id");

-- CreateIndex
CREATE INDEX "comment_votes_comment_id_idx" ON "comment_votes"("comment_id");

-- CreateIndex
CREATE INDEX "friend_requests_to_id_idx" ON "friend_requests"("to_id");

-- CreateIndex
CREATE INDEX "friendships_user_b_id_idx" ON "friendships"("user_b_id");

-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");

-- AddForeignKey
ALTER TABLE "subgeddits" ADD CONSTRAINT "subgeddits_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_subgeddit_id_fkey" FOREIGN KEY ("subgeddit_id") REFERENCES "subgeddits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_images" ADD CONSTRAINT "comment_images_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity rules that Prisma cannot express in the schema.
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_value_check" CHECK ("value" IN (-1, 1));
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_value_check" CHECK ("value" IN (-1, 1));
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_canonical_order_check" CHECK ("user_a_id" < "user_b_id");
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_not_self_check" CHECK ("from_id" <> "to_id");
ALTER TABLE "comments" ADD CONSTRAINT "comments_depth_check" CHECK ("depth" >= 0);
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_position_check" CHECK ("position" >= 0);
ALTER TABLE "comment_images" ADD CONSTRAINT "comment_images_position_check" CHECK ("position" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "users_birthday_past_check" CHECK ("birthday" IS NULL OR "birthday" <= CURRENT_DATE);
