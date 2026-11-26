import type {
  CreatePostInput,
  ListPostsQuery,
  Paginated,
  PostDto,
  UpdatePostInput,
  VoteValue,
} from '@ualgeddit/shared';
import { MAX_POST_IMAGES } from '@ualgeddit/shared';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { paginate, toSkipTake } from '../../common/utils/pagination.js';
import type { ImageFile, StorageService } from '../storage/storage.service.js';
import type { SubgedditsRepository } from '../subgeddits/subgeddits.repository.js';
import { toPostDto } from './posts.mapper.js';
import type { PostsRepository } from './posts.repository.js';

export class PostsService {
  constructor(
    private readonly posts: PostsRepository,
    private readonly subgeddits: SubgedditsRepository,
    private readonly storage: StorageService,
  ) {}

  async list(query: ListPostsQuery, viewerId?: number): Promise<Paginated<PostDto>> {
    const { items, total } = await this.posts.list({
      sort: query.sort,
      subgeddit: query.subgeddit,
      author: query.author,
      q: query.q,
      viewerId,
      ...toSkipTake(query),
    });
    return paginate(items.map(toPostDto), total, query);
  }

  async get(id: number, viewerId?: number): Promise<PostDto> {
    const record = await this.posts.findById(id, viewerId);
    if (!record) throw new NotFoundError('Post');
    return toPostDto(record);
  }

  async create(authorId: number, input: CreatePostInput, images: ImageFile[]): Promise<PostDto> {
    if (images.length > MAX_POST_IMAGES) {
      throw new BadRequestError(`A post can have at most ${MAX_POST_IMAGES} images`);
    }
    if (!(await this.subgeddits.findById(input.subgedditId))) {
      throw new NotFoundError('Subgeddit');
    }

    const imageUrls = await this.storage.saveImages(images);
    try {
      const record = await this.posts.create({ ...input, authorId, imageUrls });
      return toPostDto(record);
    } catch (error) {
      await this.storage.deleteMany(imageUrls);
      throw error;
    }
  }

  async update(id: number, userId: number, input: UpdatePostInput): Promise<PostDto> {
    await this.findOwned(id, userId);
    return toPostDto(await this.posts.update(id, input, userId));
  }

  async delete(id: number, userId: number): Promise<void> {
    const post = await this.findOwned(id, userId);
    const commentImageUrls = await this.posts.commentImageUrls(id);
    await this.posts.delete(id);
    await this.storage.deleteMany([...post.images.map((image) => image.url), ...commentImageUrls]);
  }

  vote(id: number, userId: number, value: VoteValue) {
    return this.posts.vote(id, userId, value);
  }

  private async findOwned(id: number, userId: number) {
    const post = await this.posts.findMeta(id);
    if (!post) throw new NotFoundError('Post');
    if (post.authorId !== userId) throw new ForbiddenError('Only the author can modify this post');
    return post;
  }
}
