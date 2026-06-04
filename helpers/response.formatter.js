module.exports = {
  response: (status, message, data) => {
    if (data !== undefined) {
      return { status, message, data }
    }
    return { status, message }
  }
}
