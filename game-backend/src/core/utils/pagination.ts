export const paginate = (page = 1, perPage = 20) => {
  const limit = perPage
  const offset = (page - 1) * perPage
  return { limit, offset }
}
