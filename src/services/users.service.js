const prisma = require("../db")

async function createUser(data) {
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      fullname: data.fullname,
      bio: data.bio ?? null
    }
  })
}

async function listUsers({ skip, limit, sortBy, order, isPrivate, search, hasPosts }) {
  const where = {}

  if (isPrivate !== undefined) {
    where.isPrivate = isPrivate
  }

  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } }
    ]
  }

  if (hasPosts !== undefined) {
    if (hasPosts === true) {
      where.posts = { some: {} }
    } else {
      where.posts = { none: {} }
    }
  }

  const orderBy = {
    [sortBy]: order
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ])

  return { users, total }
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true
        }
      }
    }
  })
}

async function updateUser(id, data) {
  return await prisma.user.update({
    where: { id },
    data
  })
}

async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id }
  })
}

async function getUserPosts(userId, { skip, limit }) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return null
  }

  const where = { authorId: userId }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { likes: true }
        }
      }
    }),
    prisma.post.count({ where })
  ])

  return { posts, total }
}

async function getUserLikedPosts(userId, { skip, limit }) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return null
  }

  const where = {
    likes: {
      some: {
        userId
      }
    }
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    }),
    prisma.post.count({ where })
  ])

  return { posts, total }
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
  getUserLikedPosts
}
