const prisma = require("../db")

async function getPostLikes(postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId }
  })

  if (!post) {
    return null
  }

  const likes = await prisma.like.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullname: true
        }
      }
    },
    orderBy: {
      user: {
        username: "asc"
      }
    }
  })

  return likes.map((like) => like.user)
}

async function addLike(postId, userId) {
  const post = await prisma.post.findUnique({
    where: { id: postId }
  })
  if (!post) {
    return { errorType: "POST_NOT_FOUND" }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  if (!user) {
    return { errorType: "USER_NOT_FOUND" }
  }

  try {
    const like = await prisma.like.create({
      data: {
        postId,
        userId
      }
    })
    return { like }
  } catch (error) {
    if (error.code === "P2002") {
      return { errorType: "ALREADY_LIKED" }
    }
    throw error
  }
}

async function removeLike(postId, userId) {
  try {
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })
    return true
  } catch (error) {
    if (error.code === "P2025") {
      return false
    }
    throw error
  }
}

module.exports = {
  getPostLikes,
  addLike,
  removeLike
}
