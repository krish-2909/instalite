const postsService = require("../services/posts.service")
const { parsePagination, buildMeta } = require("../utils/pagination")

const ALLOWED_POST_SORT = ["createdAt", "updatedAt", "likes"]

async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body

  if (!imageUrl || !authorId) {
    return res.status(400).json({ error: "imageUrl and authorId are required" })
  }

  try {
    const post = await postsService.createPost({
      imageUrl,
      authorId: Number(authorId),
      caption,
      location
    })

    if (!post) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.status(201).json(post)
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query)
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error })
  }

  const { sortBy = "createdAt", order = "desc", location, search, from, to } = req.query

  if (!ALLOWED_POST_SORT.includes(sortBy)) {
    return res.status(400).json({
      error: "sortBy must be one of: createdAt, updatedAt, likes"
    })
  }

  if (order !== "asc" && order !== "desc") {
    return res.status(400).json({ error: "order must be asc or desc" })
  }

  if (from !== undefined && isNaN(Date.parse(from))) {
    return res.status(400).json({ error: "from and to must be valid dates" })
  }

  if (to !== undefined && isNaN(Date.parse(to))) {
    return res.status(400).json({ error: "from and to must be valid dates" })
  }

  try {
    const { posts, total } = await postsService.listPosts({
      skip: pagination.skip,
      limit: pagination.limit,
      sortBy,
      order,
      location,
      search,
      from,
      to
    })

    return res.status(200).json({
      data: posts,
      meta: buildMeta(pagination.page, pagination.limit, total)
    })
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function getOne(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "Post not found" })
  }

  try {
    const post = await postsService.getPostById(id)
    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    return res.status(200).json(post)
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function update(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "Post not found" })
  }

  const allowedFields = ["caption", "location"]
  const data = {}

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field]
    }
  }

  try {
    const updated = await postsService.updatePost(id, data)
    return res.status(200).json(updated)
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function remove(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "Post not found" })
  }

  try {
    await postsService.deletePost(id)
    return res.status(204).send()
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove
}
