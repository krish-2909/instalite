const prisma = require("../src/db")
const { users, posts, likes } = require("./seed-data")

async function main() {
  try {
    await prisma.like.deleteMany()
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()

    const createdUsers = await prisma.user.createManyAndReturn({
      data: users
    })

    const userMap = new Map()
    for (const u of createdUsers) {
      userMap.set(u.username, u.id)
    }

    const postData = posts.map((p) => ({
      imageUrl: p.imageUrl,
      caption: p.caption,
      location: p.location,
      authorId: userMap.get(p.author),
      createdAt: p.createdAt
    }))

    const createdPosts = await prisma.post.createManyAndReturn({
      data: postData
    })

    const postMap = new Map()
    for (const p of createdPosts) {
      const key = p.imageUrl.split("/")[4]
      postMap.set(key, p.id)
    }

    const likeData = likes.map((l) => ({
      userId: userMap.get(l.user),
      postId: postMap.get(l.post)
    }))

    const createdLikes = await prisma.like.createManyAndReturn({
      data: likeData
    })

    console.log(
      `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.length} likes`
    )
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
