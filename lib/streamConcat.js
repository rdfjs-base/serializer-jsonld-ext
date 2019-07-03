const concatStream = require('concat-stream')

function streamConcat (stream) {
  return new Promise((resolve, reject) => {
    stream.on('error', err => {
      reject(err)
    })

    stream.pipe(concatStream(content => {
      resolve(content)
    }))
  })
}

module.exports = streamConcat
