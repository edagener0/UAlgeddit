import type { CommentDto, CommentSort, CreateCommentInput, VoteValue } from '@ualgeddit/shared';
import { MAX_COMMENT_DEPTH, MAX_COMMENT_IMAGES } from '@ualgeddit/shared';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import type { ImageFile, StorageService } from '../storage/storage.service.js';
import type { CommentsRepository } from './comments.repository.js';
import { buildCommentTree, toCommentDto } from './comments.tree.js';

export class CommentsService {
  constructor(
    private readonly comments: CommentsRepository,
    private readonly storage: StorageService,
  ) {}

  async listForPost(postId: number, sort: CommentSort, viewerId?: number): Promise<CommentDto[]> {
    if (!(await this.comments.postExists(postId))) throw new NotFoundError('Post');
    return buildCommentTree(await this.comments.listForPost(postId, viewerId), sort);
  }

  async create(
    postId: number,
    authorId: number,
    input: CreateCommentInput,
    images: ImageFile[],
  ): Promise<CommentDto> {
    if (!input.content && images.length === 0) {
      throw new BadRequestError('A comment needs text or at least one image');
    }
    if (images.length > MAX_COMMENT_IMAGES) {
      throw new BadRequestError(`A comment can have at most ${MAX_COMMENT_IMAGES} images`);
    }
    if (!(await this.comments.postExists(postId))) throw new NotFoundError('Post');

    let depth = 0;
    if (input.parentId !== undefined) {
      const parent = await this.comments.findById(input.parentId);
      if (!parent || parent.postId !== postId || parent.deletedAt) {
        throw new NotFoundError('Parent comment');
      }
      if (parent.depth + 1 > MAX_COMMENT_DEPTH) {
        throw new BadRequestError('This thread is too deep to reply to');
      }
      depth = parent.depth + 1;
    }

    const imageUrls = await this.storage.saveImages(images);
    try {
      const record = await this.comments.create({
        postId,
        authorId,
        parentId: input.parentId ?? null,
        depth,
        content: input.content,
        imageUrls,
      });
      return toCommentDto(record);
    } catch (error) {
      await this.storage.deleteMany(imageUrls);
      throw error;
    }
  }

  async delete(id: number, userId: number): Promise<void> {
    const comment = await this.comments.findById(id);
    if (!comment || comment.deletedAt) throw new NotFoundError('Comment');
    if (comment.authorId !== userId) {
      throw new ForbiddenError('Only the author can delete this comment');
    }
    const urls = await this.comments.softDelete(id, comment.postId);
    await this.storage.deleteMany(urls);
  }

  vote(id: number, userId: number, value: VoteValue) {
    return this.comments.vote(id, userId, value);
  }
}
