module.exports = {
  response: (statusCode, pesan, data) => {
    if (data !== undefined) {
      return {
        status: statusCode,
        message: pesan,
        data: data,
      };
    }
    // jika tidak ada data, cukup kembalikan status dan pesan
    return {
      status: statusCode,
      message: pesan,
    };
  },
};
