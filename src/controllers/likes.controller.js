const likesService = require("../services/likes.service")

async function listLikes(req, res) {
  const postId = Number(req.params.id)
  if (!postId) {
    return res.status(404).json({ error: "Post not found" })
  }

  try {
    const users = await likesService.getPostLikes(postId)
    if (!users) {
      return res.status(404).json({ error: "Post not found" })
    }

    return res.status(200).json(users)
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function createLike(req, res) {
  const postId = Number(req.params.id)
  const { userId } = req.body

  if (userId === undefined || userId === null) {
    return res.status(400).json({ error: "userId is required" })
  }

  const userIdNum = Number(userId)

  try {
    const result = await likesService.addLike(postId, userIdNum)

    if (result.errorType === "POST_NOT_FOUND") {
      return res.status(404).json({ error: "Post not found" })
    }
    if (result.errorType === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" })
    }
    if (result.errorType === "ALREADY_LIKED") {
      return res.status(409).json({ error: "Already liked" })
    }

    return res.status(201).json(result.like)
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function removeLike(req, res) {
  const postId = Number(req.params.id)
  const userId = Number(req.params.userId)

  if (!postId || !userId) {
    return res.status(404).json({ error: "Like not found" })
  }

  try {
    const success = await likesService.removeLike(postId, userId)
    if (!success) {
      return res.status(404).json({ error: "Like not found" })
    }

    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

module.exports = {
  listLikes,
  createLike,
  removeLike
}
