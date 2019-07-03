const Readable = require('readable-stream')

function quadsToReadable (quads) {
  const readable = new Readable({
    objectMode: true,
    read: () => {
      quads.forEach((quad) => {
        readable.push(quad)
      })

      readable.push(null)
    }
  })

  return readable
}

module.exports = quadsToReadable
