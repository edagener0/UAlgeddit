/**
 * Populates the database with deterministic mock data for local development.
 *
 *   npm run db:seed            (or `make seed`)
 *
 * WARNING: wipes every table and every file in UPLOAD_DIR first.
 * All seeded accounts use the password defined in SEED_PASSWORD (default "Password123").
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { faker } from '@faker-js/faker';
import type { User } from '@prisma/client';
import { createPrismaClient } from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';
import { hotRank } from '../src/common/utils/votes.js';

const prisma = createPrismaClient(process.env.DATABASE_URL ?? '');
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');
const PASSWORD = process.env.SEED_PASSWORD ?? 'Password123';

faker.seed(2026);

// ---------------------------------------------------------------------------
// Placeholder images (SVG, generated locally so seeding works offline)
// ---------------------------------------------------------------------------

const escapeXml = (value: string) =>
  value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);

function gradient(id: string, hue: number) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 85% 60%)"/>
    <stop offset="1" stop-color="hsl(${(hue + 50) % 360} 80% 40%)"/>
  </linearGradient>`;
}

function bubbles(width: number, height: number, count: number) {
  return Array.from({ length: count }, () => {
    const r = faker.number.int({ min: 10, max: Math.min(width, height) / 3 });
    const cx = faker.number.int({ min: 0, max: width });
    const cy = faker.number.int({ min: 0, max: height });
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" fill-opacity="${faker.number.float({ min: 0.05, max: 0.25, fractionDigits: 2 })}"/>`;
  }).join('');
}

function photoSvg(label: string, hue: number, width = 1200, height = 800) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>${gradient('g', hue)}</defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${bubbles(width, height, 14)}
  <path d="M0 ${height * 0.75} Q ${width * 0.25} ${height * 0.6} ${width * 0.5} ${height * 0.72} T ${width} ${height * 0.68} V ${height} H 0 Z" fill="black" fill-opacity="0.18"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="${Math.round(width / 18)}" font-weight="700" fill="white">${escapeXml(label)}</text>
</svg>`;
}

function avatarSvg(username: string, hue: number) {
  const initials = username.slice(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>${gradient('a', hue)}</defs>
  <rect width="256" height="256" rx="128" fill="url(#a)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="104" font-weight="700" fill="white">${escapeXml(initials)}</text>
</svg>`;
}

function iconSvg(name: string, hue: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>${gradient('i', hue)}</defs>
  <rect width="256" height="256" rx="64" fill="url(#i)"/>
  ${bubbles(256, 256, 4)}
  <text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="120" font-weight="800" fill="white">g/${escapeXml(name[0]?.toUpperCase() ?? '?')}</text>
</svg>`;
}

function bannerSvg(hue: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="320" viewBox="0 0 1600 320">
  <defs>${gradient('b', hue)}</defs>
  <rect width="1600" height="320" fill="url(#b)"/>
  ${bubbles(1600, 320, 24)}
  <path d="M0 220 C 300 140 500 300 800 220 S 1300 140 1600 230 V 320 H 0 Z" fill="white" fill-opacity="0.15"/>
</svg>`;
}

async function saveSvg(svg: string): Promise<string> {
  const name = `${randomUUID()}.svg`;
  await writeFile(path.join(UPLOAD_DIR, name), svg);
  return `/uploads/${name}`;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const COMMUNITIES = [
  {
    name: 'typescript',
    hue: 210,
    description: 'Everything TypeScript: types, tooling, tips and the occasional any.',
    titles: [
      'Is `satisfies` the most underrated operator?',
      'How do you structure a monorepo with shared types?',
      'Zod vs. Valibot in 2026',
      'Today I learned about template literal types',
      'Strict mode saved me from a production bug',
    ],
  },
  {
    name: 'UAlg',
    hue: 140,
    description:
      'Students and alumni of the Universidade do Algarve. Classes, campus life, events.',
    titles: [
      'Best spot to study on Gambelas campus?',
      'Tips for the Web Development course project',
      'Anyone going to the student week concerts?',
      'Library opening hours during exams',
      'Looking for a team for the hackathon',
    ],
  },
  {
    name: 'algarve',
    hue: 30,
    description: 'Beaches, food and hidden gems of the south of Portugal.',
    titles: [
      'Sunset at Ponta da Piedade',
      'Underrated beaches near Faro',
      'Where to eat the best cataplana?',
      'Benagil cave by kayak: worth it?',
      'Ria Formosa boat trip photos',
    ],
  },
  {
    name: 'photography',
    hue: 280,
    description: 'Share your shots, gear and techniques. Critique welcome.',
    titles: [
      'My first long-exposure attempt',
      'Golden hour in the old town',
      'Street photography: ask before or after?',
      'Minimalist compositions thread',
      'Is a 50mm still the best first lens?',
    ],
  },
  {
    name: 'gaming',
    hue: 350,
    description: 'Video games, board games and everything in between.',
    titles: [
      'What are you playing this weekend?',
      'Indie gems you never hear about',
      'My cozy setup after two years of upgrades',
      'Co-op games for long-distance friends',
      'Hot take: shorter games are better',
    ],
  },
  {
    name: 'cooking',
    hue: 15,
    description: 'Recipes, techniques and kitchen disasters.',
    titles: [
      'Pastel de nata at home: attempt #4',
      'One-pot meals for exam season',
      'How do you keep cilantro fresh?',
      'Homemade bread: crumb shot',
      'Cheap and healthy student recipes',
    ],
  },
  {
    name: 'science',
    hue: 190,
    description: 'News and discussion about scientific research.',
    titles: [
      'New study on ocean currents off the Portuguese coast',
      'ELI5: how do mRNA vaccines work?',
      'The math behind the hot ranking algorithm',
      'Why is the sky blue but sunsets red?',
      'Citizen science projects you can join',
    ],
  },
  {
    name: 'programming',
    hue: 255,
    description: 'General programming discussion. Be kind to beginners.',
    titles: [
      'Controller, service, repository: overkill for small apps?',
      'Postgres or SQLite for a side project?',
      'How I finally understood WebSockets',
      'Code review etiquette that actually works',
      'Conventional Commits changed how I write history',
    ],
  },
];

const USERNAMES = [
  'demo',
  'martim',
  'ana_silva',
  'joao_dev',
  'sofia.costa',
  'ricardo99',
  'beatriz_m',
  'tiago_codes',
  'ines_photo',
  'pedro_gamer',
  'catarina',
  'miguel_chef',
  'rita_science',
  'nuno',
].map((name) => name.replace('.', '_'));

const pick = <T>(items: readonly T[]) => faker.helpers.arrayElement(items);
const chance = (probability: number) => faker.number.float({ min: 0, max: 1 }) < probability;

const SENTENCES = [
  'I have been thinking about this for a while and wanted to hear what you all think.',
  'Honestly, this turned out much better than I expected.',
  'Any tips or recommendations are more than welcome.',
  'Took me a few tries, but I am pretty happy with the result.',
  'Curious whether anyone else has had the same experience.',
  'Here is a quick summary of what I learned along the way.',
  'It is one of those things that seems simple until you actually try it.',
  'I found a couple of great resources that helped a lot.',
  'Let me know if you want more details and I will update the post.',
  'This community has been super helpful, so I wanted to give something back.',
  'The first attempt was a disaster, the second one was fine, the third one was great.',
  'Would love some honest feedback before I take this further.',
  'Weekend project, nothing fancy, but it made my day.',
  'Saving this here so I can find it again next semester.',
];

const COMMENTS = [
  'This!',
  'Great post, thanks for sharing.',
  'Underrated comment.',
  'Source?',
  'Saving this for later.',
  'Came here to say this.',
  'I had the exact same problem last week.',
  'Wow, that looks amazing.',
  'Can confirm, works perfectly.',
  'Not sure I agree, but interesting point.',
  'How long did this take you?',
  'Thanks, this helped me a lot!',
  'This deserves more upvotes.',
  'Hard disagree, but respect the effort.',
  'Followed your advice and it worked, cheers!',
];

function paragraph() {
  return faker.helpers
    .multiple(
      () =>
        faker.helpers
          .arrayElements([...SENTENCES, faker.hacker.phrase()], { min: 1, max: 3 })
          .join(' '),
      { count: { min: 1, max: 3 } },
    )
    .join('\n\n');
}

function commentText() {
  return chance(0.6)
    ? pick(COMMENTS)
    : faker.helpers.arrayElements([...COMMENTS, ...SENTENCES], { min: 1, max: 2 }).join(' ');
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

async function resetUploads() {
  await mkdir(UPLOAD_DIR, { recursive: true });
  for (const file of await readdir(UPLOAD_DIR)) {
    if (file !== '.gitkeep') await unlink(path.join(UPLOAD_DIR, file));
  }
}

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE chat_messages, comment_votes, post_votes, comment_images, post_images,
      comments, posts, subgeddits, friend_requests, friendships, users
    RESTART IDENTITY CASCADE
  `);
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    throw new Error('Refusing to seed a production database (set SEED_FORCE=true to override).');
  }

  console.log('Resetting database and uploads...');
  await resetDatabase();
  await resetUploads();

  // Users ------------------------------------------------------------------
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users: User[] = [];
  for (const [index, username] of USERNAMES.entries()) {
    const hasAvatar = index === 0 || chance(0.8);
    users.push(
      await prisma.user.create({
        data: {
          username,
          passwordHash,
          bio: chance(0.85) ? faker.person.bio() : null,
          birthday: chance(0.7) ? faker.date.birthdate({ min: 18, max: 45, mode: 'age' }) : null,
          avatarUrl: hasAvatar ? await saveSvg(avatarSvg(username, (index * 47) % 360)) : null,
          createdAt: faker.date.past({ years: 2 }),
        },
      }),
    );
  }

  // Subgeddits ---------------------------------------------------------------
  console.log('Creating subgeddits...');
  const subgeddits = [];
  for (const community of COMMUNITIES) {
    subgeddits.push({
      ...community,
      record: await prisma.subgeddit.create({
        data: {
          name: community.name,
          nameLower: community.name.toLowerCase(),
          description: community.description,
          iconUrl: await saveSvg(iconSvg(community.name, community.hue)),
          bannerUrl: await saveSvg(bannerSvg(community.hue)),
          ownerId: pick(users).id,
          createdAt: faker.date.past({ years: 1 }),
        },
      }),
    });
  }

  // Posts ---------------------------------------------------------------------
  console.log('Creating posts with image galleries...');
  const posts = [];
  for (const community of subgeddits) {
    const count = faker.number.int({ min: 6, max: 10 });
    for (let i = 0; i < count; i++) {
      const imageCount = chance(0.55) ? faker.number.int({ min: 1, max: 5 }) : 0;
      const title =
        i < community.titles.length
          ? community.titles[i]!
          : `${faker.hacker.ingverb()} ${faker.hacker.adjective()} ${faker.hacker.noun()}: ${pick(['thoughts?', 'my experience', 'a quick guide', 'help needed', 'finally done!'])}`.replace(
              /^./,
              (c) => c.toUpperCase(),
            );
      const imageUrls = [];
      for (let n = 0; n < imageCount; n++) {
        imageUrls.push(
          await saveSvg(
            photoSvg(
              imageCount > 1
                ? `${title.slice(0, 24)} (${n + 1}/${imageCount})`
                : title.slice(0, 28),
              (community.hue + n * 35) % 360,
            ),
          ),
        );
      }
      posts.push(
        await prisma.post.create({
          data: {
            title,
            content: imageCount > 0 && chance(0.4) ? '' : paragraph(),
            subgedditId: community.record.id,
            authorId: pick(users).id,
            createdAt: faker.date.recent({ days: 21 }),
            images: { create: imageUrls.map((url, position) => ({ url, position })) },
          },
        }),
      );
    }
  }

  // Comments ------------------------------------------------------------------
  console.log('Creating comment threads...');
  const comments: { id: number; postId: number; authorId: number }[] = [];
  for (const post of posts) {
    const thread: { id: number; depth: number; createdAt: Date }[] = [];
    const count = faker.number.int({ min: 0, max: 14 });
    for (let i = 0; i < count; i++) {
      const parent = thread.length > 0 && chance(0.55) ? pick(thread) : undefined;
      const depth = parent ? parent.depth + 1 : 0;
      if (depth > 5) continue;
      const after = parent?.createdAt ?? post.createdAt;
      const createdAt = faker.date.between({
        from: after,
        to: new Date(Math.max(after.getTime() + 60_000, Date.now())),
      });
      const withImage = chance(0.08);
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: pick(users).id,
          parentId: parent?.id ?? null,
          depth,
          content: withImage && chance(0.5) ? '' : commentText(),
          createdAt,
          images: withImage
            ? {
                create: [
                  {
                    url: await saveSvg(photoSvg('reaction', faker.number.int(360), 600, 400)),
                    position: 0,
                  },
                ],
              }
            : undefined,
        },
      });
      thread.push({ id: comment.id, depth, createdAt });
      comments.push(comment);
    }
    await prisma.post.update({ where: { id: post.id }, data: { commentCount: thread.length } });
  }

  // Votes, scores and karma ---------------------------------------------------
  console.log('Casting votes and computing scores...');
  const karma = new Map<number, number>();
  const postVotes = [];
  for (const post of posts) {
    const popularity = faker.number.float({ min: 0.1, max: 0.95 });
    let score = 0;
    for (const user of users) {
      if (!chance(popularity)) continue;
      const value = chance(0.82) ? 1 : -1;
      postVotes.push({ userId: user.id, postId: post.id, value });
      score += value;
    }
    karma.set(post.authorId, (karma.get(post.authorId) ?? 0) + score);
    await prisma.post.update({
      where: { id: post.id },
      data: { score, hotRank: hotRank(score, post.createdAt) },
    });
  }
  await prisma.postVote.createMany({ data: postVotes });

  const commentVotes = [];
  for (const comment of comments) {
    let score = 0;
    for (const user of users) {
      if (!chance(0.3)) continue;
      const value = chance(0.85) ? 1 : -1;
      commentVotes.push({ userId: user.id, commentId: comment.id, value });
      score += value;
    }
    karma.set(comment.authorId, (karma.get(comment.authorId) ?? 0) + score);
    if (score !== 0) await prisma.comment.update({ where: { id: comment.id }, data: { score } });
  }
  await prisma.commentVote.createMany({ data: commentVotes });

  for (const [userId, value] of karma) {
    await prisma.user.update({ where: { id: userId }, data: { karma: value } });
  }

  // Friendships ---------------------------------------------------------------
  console.log('Creating friendships and requests...');
  const [demo, ...others] = users;
  const friendships = new Set<string>();
  const addFriendship = (a: number, b: number) => {
    const [userAId, userBId] = a < b ? [a, b] : [b, a];
    friendships.add(`${userAId}:${userBId}`);
  };
  for (const other of others.slice(0, 5)) addFriendship(demo!.id, other.id);
  for (let i = 0; i < 18; i++) {
    const [a, b] = faker.helpers.arrayElements(others, 2);
    addFriendship(a!.id, b!.id);
  }
  await prisma.friendship.createMany({
    data: [...friendships].map((pair) => {
      const [userAId, userBId] = pair.split(':').map(Number);
      return { userAId: userAId!, userBId: userBId!, createdAt: faker.date.recent({ days: 60 }) };
    }),
  });
  // Pending requests for the demo account (two received, one sent).
  await prisma.friendRequest.createMany({
    data: [
      { fromId: others[6]!.id, toId: demo!.id },
      { fromId: others[7]!.id, toId: demo!.id },
      { fromId: demo!.id, toId: others[8]!.id },
    ],
  });

  // Chat history ----------------------------------------------------------------
  console.log('Writing chat history...');
  const chatStart = Date.now() - 1000 * 60 * 90;
  await prisma.chatMessage.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      authorId: pick(users).id,
      content: pick([
        pick(SENTENCES),
        'Anyone around? 👋',
        'Check out the new post in g/algarve!',
        'lol',
        'Good luck with the exams everyone',
      ]),
      createdAt: new Date(chatStart + i * 1000 * 60 * 3),
    })),
  });

  console.log(
    `Done: ${users.length} users, ${subgeddits.length} subgeddits, ${posts.length} posts, ` +
      `${comments.length} comments, ${postVotes.length + commentVotes.length} votes.`,
  );
  console.log(`Sign in with "demo" / "${PASSWORD}" (every seeded user shares this password).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
