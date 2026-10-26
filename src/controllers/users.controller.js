const usersService = require("../services/users.service")
const { parsePagination, buildMeta } = require("../utils/pagination")

const ALLOWED_USER_SORT = ["createdAt", "username", "fullname"]

async function create(req, res) {
  const { username, email, fullname, bio } = req.body

  if (!username || !email || !fullname) {
    return res.status(400).json({ error: "username, email and fullname are required" })
  }

  try {
    const user = await usersService.createUser({ username, email, fullname, bio })
    return res.status(201).json(user)
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query)
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error })
  }

  const { sortBy = "createdAt", order = "desc", isPrivate, search, hasPosts } = req.query

  if (!ALLOWED_USER_SORT.includes(sortBy)) {
    return res.status(400).json({
      error: "sortBy must be one of: createdAt, username, fullname"
    })
  }

  if (order !== "asc" && order !== "desc") {
    return res.status(400).json({ error: "order must be asc or desc" })
  }

  let isPrivateFilter
  if (isPrivate !== undefined) {
    if (isPrivate !== "true" && isPrivate !== "false") {
      return res.status(400).json({ error: "isPrivate must be true or false" })
    }
    isPrivateFilter = isPrivate === "true"
  }

  let hasPostsFilter
  if (hasPosts !== undefined) {
    if (hasPosts !== "true" && hasPosts !== "false") {
      return res.status(400).json({ error: "hasPosts must be true or false" })
    }
    hasPostsFilter = hasPosts === "true"
  }

  try {
    const { users, total } = await usersService.listUsers({
      skip: pagination.skip,
      limit: pagination.limit,
      sortBy,
      order,
      isPrivate: isPrivateFilter,
      search,
      hasPosts: hasPostsFilter
    })

    return res.status(200).json({
      data: users,
      meta: buildMeta(pagination.page, pagination.limit, total)
    })
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function getOne(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "User not found" })
  }

  try {
    const user = await usersService.getUserById(id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function update(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "User not found" })
  }

  const allowedFields = ["fullname", "bio", "isPrivate"]
  const data = {}

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field]
    }
  }

  try {
    const updated = await usersService.updateUser(id, data)
    return res.status(200).json(updated)
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function remove(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "User not found" })
  }

  try {
    await usersService.deleteUser(id)
    return res.status(204).send()
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function listPosts(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "User not found" })
  }

  const pagination = parsePagination(req.query)
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error })
  }

  try {
    const result = await usersService.getUserPosts(id, {
      skip: pagination.skip,
      limit: pagination.limit
    })

    if (!result) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.status(200).json({
      data: result.posts,
      meta: buildMeta(pagination.page, pagination.limit, result.total)
    })
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

async function listLikedPosts(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(404).json({ error: "User not found" })
  }

  const pagination = parsePagination(req.query)
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error })
  }

  try {
    const result = await usersService.getUserLikedPosts(id, {
      skip: pagination.skip,
      limit: pagination.limit
    })

    if (!result) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.status(200).json({
      data: result.posts,
      meta: buildMeta(pagination.page, pagination.limit, result.total)
    })
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  listPosts,
  listLikedPosts
}
