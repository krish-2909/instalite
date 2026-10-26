function parsePagination(query) {
  const pageStr = query.page ?? "1"
  const limitStr = query.limit ?? "10"

  const page = Number(pageStr)
  const limit = Number(limitStr)

  if (
    !Number.isInteger(page) ||
    page <= 0 ||
    !Number.isInteger(limit) ||
    limit <= 0 ||
    String(page) !== String(pageStr).trim() ||
    String(limit) !== String(limitStr).trim()
  ) {
    return { error: "page and limit must be positive integers" }
  }

  const finalLimit = limit > 50 ? 50 : limit
  const skip = (page - 1) * finalLimit

  return {
    page,
    limit: finalLimit,
    skip
  }
}

function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  }
}

module.exports = {
  parsePagination,
  buildMeta
}
