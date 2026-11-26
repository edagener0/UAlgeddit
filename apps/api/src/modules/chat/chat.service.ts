import type { ChatMessageDto } from '@ualgeddit/shared';
import { chatMessageContentSchema } from '@ualgeddit/shared';
import { toUserSummary } from '../users/users.mapper.js';
import type { ChatRepository } from './chat.repository.js';

type ChatRecord = Awaited<ReturnType<ChatRepository['create']>>;

export function toChatMessageDto(record: ChatRecord): ChatMessageDto {
  return {
    id: record.id,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
    author: toUserSummary(record.author),
  };
}

export class ChatService {
  constructor(private readonly chat: ChatRepository) {}

  async send(authorId: number, content: string): Promise<ChatMessageDto> {
    const record = await this.chat.create(authorId, chatMessageContentSchema.parse(content));
    return toChatMessageDto(record);
  }

  async history(limit: number): Promise<ChatMessageDto[]> {
    return (await this.chat.listRecent(limit)).map(toChatMessageDto);
  }
}
