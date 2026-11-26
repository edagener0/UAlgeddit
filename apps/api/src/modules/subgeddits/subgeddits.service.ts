import type {
  CreateSubgedditInput,
  ListSubgedditsQuery,
  Paginated,
  SubgedditDto,
  UpdateSubgedditInput,
} from '@ualgeddit/shared';
import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { paginate, toSkipTake } from '../../common/utils/pagination.js';
import type { ImageFile, StorageService } from '../storage/storage.service.js';
import { toSubgedditDto } from './subgeddits.mapper.js';
import type { SubgedditsRepository } from './subgeddits.repository.js';

export interface SubgedditImages {
  icon?: ImageFile;
  banner?: ImageFile;
}

export class SubgedditsService {
  constructor(
    private readonly subgeddits: SubgedditsRepository,
    private readonly storage: StorageService,
  ) {}

  async list(query: ListSubgedditsQuery): Promise<Paginated<SubgedditDto>> {
    const { items, total } = await this.subgeddits.list({ q: query.q, ...toSkipTake(query) });
    return paginate(items.map(toSubgedditDto), total, query);
  }

  async get(name: string): Promise<SubgedditDto> {
    const record = await this.subgeddits.findByName(name);
    if (!record) throw new NotFoundError('Subgeddit');
    return toSubgedditDto(record);
  }

  async create(
    ownerId: number,
    input: CreateSubgedditInput,
    images: SubgedditImages,
  ): Promise<SubgedditDto> {
    if (await this.subgeddits.findByName(input.name)) {
      throw new ConflictError(`g/${input.name} already exists`);
    }
    const [iconUrl = null, bannerUrl = null] = await this.saveOptional(images.icon, images.banner);
    try {
      const record = await this.subgeddits.create({ ...input, ownerId, iconUrl, bannerUrl });
      return toSubgedditDto(record);
    } catch (error) {
      await this.storage.deleteMany([iconUrl, bannerUrl]);
      throw error;
    }
  }

  async update(
    name: string,
    userId: number,
    input: UpdateSubgedditInput,
    images: SubgedditImages,
  ): Promise<SubgedditDto> {
    const current = await this.findOwned(name, userId);
    const [iconUrl, bannerUrl] = await this.saveOptional(images.icon, images.banner);

    const nextIcon = iconUrl ?? (input.removeIcon ? null : current.iconUrl);
    const nextBanner = bannerUrl ?? (input.removeBanner ? null : current.bannerUrl);

    const record = await this.subgeddits.update(current.id, {
      ...(input.description !== undefined && { description: input.description }),
      iconUrl: nextIcon,
      bannerUrl: nextBanner,
    });

    await this.storage.deleteMany([
      nextIcon !== current.iconUrl ? current.iconUrl : null,
      nextBanner !== current.bannerUrl ? current.bannerUrl : null,
    ]);
    return toSubgedditDto(record);
  }

  async delete(name: string, userId: number): Promise<void> {
    const current = await this.findOwned(name, userId);
    const urls = await this.subgeddits.collectImageUrls(current.id);
    await this.subgeddits.delete(current.id);
    await this.storage.deleteMany([...urls, current.iconUrl, current.bannerUrl]);
  }

  private async findOwned(name: string, userId: number) {
    const record = await this.subgeddits.findByName(name);
    if (!record) throw new NotFoundError('Subgeddit');
    if (record.ownerId !== userId) {
      throw new ForbiddenError('Only the owner can modify this subgeddit');
    }
    return record;
  }

  /**
   * Stores the optional icon (avatar preset) and banner (banner preset).
   * All-or-nothing: if the banner is rejected, the already stored icon is removed.
   */
  private async saveOptional(
    icon: ImageFile | undefined,
    banner: ImageFile | undefined,
  ): Promise<[string | undefined, string | undefined]> {
    const [iconUrl] = icon ? await this.storage.saveImages([icon], 'avatar') : [];
    try {
      const [bannerUrl] = banner ? await this.storage.saveImages([banner], 'banner') : [];
      return [iconUrl, bannerUrl];
    } catch (error) {
      await this.storage.deleteMany([iconUrl]);
      throw error;
    }
  }
}
